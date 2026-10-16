// Server-side checkout. Prices and validates against the shop in the database
// (never trusting client money), saves the order, charges the card via Square
// Payments for card orders (cash orders are saved unpaid), then sends
// notifications.
//
// Server-only.

import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { orderItems, orders, payments } from "@/lib/db/schema";
import { square, locationId } from "@/lib/square";
import { getShop, orderedOn } from "@/lib/shop";
import { getProduct, isOrderable, type Shop } from "@/lib/inventory";
import { computeOrder, type CartLine } from "@/lib/pricing";
import {
  validateDeliveryAddress,
  fulfillmentSchedule,
  isoDate,
  orderLeadTimeHours,
  isFulfillmentMethodAvailable,
  isPaymentMethodAvailable,
  type FulfillmentMethod,
  type PaymentMethod,
} from "@/lib/fulfillment";
import { notifyNewOrder } from "@/lib/notifications";

export type Customer = { name: string; email: string; phone?: string; note?: string };
export type DeliveryAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
};

export type CheckoutInput = {
  lines: CartLine[];
  method: FulfillmentMethod;
  payment: PaymentMethod;
  customer: Customer;
  address?: DeliveryAddress;
  /** Square card token (required for card payments). */
  sourceId?: string;
};

/** Validation failure the client can act on (paused / sold out / bad fields). */
export class OrderError extends Error {
  problems: string[];
  soldOut: string[];
  paused: boolean;
  constructor(problems: string[], soldOut: string[] = [], paused = false) {
    super(problems.join(" "));
    this.name = "OrderError";
    this.problems = problems;
    this.soldOut = soldOut;
    this.paused = paused;
  }
}

/** Card charge failed. */
export class PaymentError extends Error {
  constructor(message = "Payment could not be processed.") {
    super(message);
    this.name = "PaymentError";
  }
}

/**
 * Re-check the cart against the shop, the kill switch, and what's left of each
 * item's daily limit for the order's day (`left`: productId → count left that day).
 */
export function validateOrder(shop: Shop, input: CheckoutInput, left: Map<string, number>): void {
  const { config } = shop;
  if (!config.acceptingOrders) {
    throw new OrderError([config.pausedMessage], [], true);
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new OrderError(["Your cart is empty."]);
  }

  const problems: string[] = [];
  const soldOut: string[] = [];

  for (const line of input.lines) {
    const product = getProduct(shop, line.productId);
    if (!product) {
      problems.push("An item in your cart is no longer available.");
      soldOut.push(line.productId);
      continue;
    }
    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      problems.push(`Invalid quantity for ${product.name}.`);
      continue;
    }
    const remaining = left.get(product.id) ?? 0;
    if (!isOrderable(product) || remaining <= 0) {
      problems.push(`${product.name} is sold out.`);
      soldOut.push(product.id);
      continue;
    }
    if (line.qty > remaining) {
      problems.push(`Only ${remaining} of ${product.name} left for that day.`);
      soldOut.push(product.id);
    }
  }

  if (!isFulfillmentMethodAvailable(input.method)) {
    problems.push("That fulfillment method isn't available.");
  }
  if (input.method === "delivery") {
    const a = input.address;
    if (!a?.line1?.trim() || !a?.city?.trim() || !a?.state?.trim() || !a?.zip?.trim()) {
      problems.push("Please enter your full delivery address.");
    } else {
      const r = validateDeliveryAddress(config, { city: a.city, state: a.state, zip: a.zip });
      if (!r.ok) problems.push(r.reason);
    }
  }

  if (!isPaymentMethodAvailable(config, input.payment)) {
    problems.push("That payment method isn't available.");
  }
  if (input.payment === "card" && !input.sourceId) {
    problems.push("Missing card details.");
  }
  if (!input.customer?.name?.trim() || !input.customer?.email?.trim()) {
    problems.push("Please enter your name and email.");
  }

  if (problems.length > 0) {
    throw new OrderError([...new Set(problems)], [...new Set(soldOut)]);
  }
}

export type PlacedOrder = {
  orderId: string;
  method: FulfillmentMethod;
  payment: PaymentMethod;
  subtotalCents: number;
  deliveryFeeCents: number;
  cardSurchargeCents: number;
  totalCents: number;
  scheduleLabel: string;
  paymentId?: string;
};

function makeShortId(): string {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

/** One order saved at a time, so two orders can't both take the last of an item. */
const ORDER_LOCK = 72_014_001;

/** Validate, save, charge (card only), notify, and return the placed order. */
export async function placeOrder(input: CheckoutInput): Promise<PlacedOrder> {
  const now = new Date();
  const shortId = makeShortId();

  // Saved first (holding the item counts for the order's day), then charged.
  const saved = await db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${ORDER_LOCK})`);
    const shop = await getShop(now, tx);
    const ordered = (input.lines ?? []).map((l) => getProduct(shop, l.productId)).filter((p): p is NonNullable<typeof p> => Boolean(p));
    // The order's day honors the longest lead time in the cart.
    const schedule = fulfillmentSchedule(shop.config, now, orderLeadTimeHours(shop.config, ordered));
    const day = isoDate(schedule.date);
    const counts = await orderedOn([day], tx);
    const left = new Map(ordered.map((p) => [p.id, Math.max(0, p.dailyLimit - (counts.get(`${p.id}|${day}`) ?? 0))]));
    validateOrder(shop, input, left);

    // Authoritative totals from the shop — client money is ignored.
    const totals = computeOrder(shop, input.lines, input.method, input.payment);
    if (totals.totalCents <= 0) throw new OrderError(["Order total is invalid."]);

    const address = input.method === "delivery" ? input.address! : undefined;
    const [order] = await tx
      .insert(orders)
      .values({
        shortId,
        method: input.method,
        fulfillmentDate: day,
        customerName: input.customer.name.trim(),
        customerEmail: input.customer.email.trim().toLowerCase(),
        customerPhone: input.customer.phone?.trim() || null,
        note: input.customer.note?.trim() || null,
        addressLine1: address?.line1.trim() ?? null,
        addressLine2: address?.line2?.trim() || null,
        city: address?.city.trim() ?? null,
        state: address?.state.trim().toUpperCase() ?? null,
        zip: address?.zip.trim() ?? null,
        subtotalCents: totals.subtotalCents,
        deliveryFeeCents: totals.deliveryFeeCents,
        cardSurchargeCents: totals.cardSurchargeCents,
        totalCents: totals.totalCents,
      })
      .returning({ id: orders.id });
    await tx.insert(orderItems).values(
      totals.lines.map((l) => ({ orderId: order.id, productId: l.productId, productName: l.name, unitPriceCents: l.unitPriceCents, qty: l.qty, lineTotalCents: l.lineTotalCents })),
    );
    const [payment] = await tx
      .insert(payments)
      .values({ orderId: order.id, method: input.payment, status: "pending", amountCents: totals.totalCents })
      .returning({ id: payments.id });
    return { orderId: order.id, paymentRowId: payment.id, totals, scheduleLabel: schedule.label, pickup: shop.config.pickup };
  });

  let paymentId: string | undefined;
  if (input.payment === "card") {
    try {
      const payment = await square().payments.create({
        idempotencyKey: crypto.randomUUID(),
        sourceId: input.sourceId!,
        amountMoney: { amount: BigInt(saved.totals.totalCents), currency: "USD" as const },
        locationId: locationId(),
        autocomplete: true,
        note: `Particular Notions order ${shortId} (${input.method})`,
      });
      paymentId = payment.payment?.id;
      if (payment.payment?.status !== "COMPLETED") {
        throw new PaymentError();
      }
    } catch (err) {
      // Never charged: the order didn't happen, so its items go back.
      await db.delete(orders).where(eq(orders.id, saved.orderId));
      if (err instanceof PaymentError) throw err;
      console.error("[checkout] Square charge failed:", err);
      throw new PaymentError();
    }
    await db
      .update(payments)
      .set({ status: "completed", squarePaymentId: paymentId ?? null, updatedAt: new Date() })
      .where(eq(payments.id, saved.paymentRowId))
      .catch((err) => console.error("[checkout] couldn't record the card payment:", err));
  }

  // Notifications (email) — best-effort, never throw. Order is already placed.
  await notifyNewOrder({
    orderId: shortId,
    method: input.method,
    payment: input.payment,
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    customerPhone: input.customer.phone || undefined,
    note: input.customer.note || undefined,
    address: input.method === "delivery" ? input.address : undefined,
    lines: saved.totals.lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      lineTotalCents: l.lineTotalCents,
    })),
    subtotalCents: saved.totals.subtotalCents,
    deliveryFeeCents: saved.totals.deliveryFeeCents,
    cardSurchargeCents: saved.totals.cardSurchargeCents,
    totalCents: saved.totals.totalCents,
    scheduleLabel: saved.scheduleLabel,
    pickup: saved.pickup,
  }).catch((err) => {
    console.error("[checkout] notifyNewOrder threw unexpectedly:", err);
    return { ownerAlerted: false };
  });

  return {
    orderId: shortId,
    method: input.method,
    payment: input.payment,
    subtotalCents: saved.totals.subtotalCents,
    deliveryFeeCents: saved.totals.deliveryFeeCents,
    cardSurchargeCents: saved.totals.cardSurchargeCents,
    totalCents: saved.totals.totalCents,
    scheduleLabel: saved.scheduleLabel,
    paymentId,
  };
}
