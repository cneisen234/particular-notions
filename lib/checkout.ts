// Server-side checkout. Prices and validates against OUR static inventory (never
// trusting client money), charges the card via Square Payments for card orders
// (cash orders skip the charge), then sends notifications. No database.
//
// Server-only.

import "server-only";
import { square, locationId } from "@/lib/square";
import { getProduct, isOrderable } from "@/lib/inventory";
import { shopConfig } from "@/lib/shop-config";
import { computeOrder, type CartLine } from "@/lib/pricing";
import {
  validateDeliveryAddress,
  fulfillmentSchedule,
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

/** Re-check the cart against live inventory, the kill switch, and daily limits. */
export function validateOrder(input: CheckoutInput): void {
  if (!shopConfig.acceptingOrders) {
    throw new OrderError([shopConfig.pausedMessage], [], true);
  }
  if (!Array.isArray(input.lines) || input.lines.length === 0) {
    throw new OrderError(["Your cart is empty."]);
  }

  const problems: string[] = [];
  const soldOut: string[] = [];

  for (const line of input.lines) {
    const product = getProduct(line.productId);
    if (!product) {
      problems.push("An item in your cart is no longer available.");
      soldOut.push(line.productId);
      continue;
    }
    if (!Number.isInteger(line.qty) || line.qty <= 0) {
      problems.push(`Invalid quantity for ${product.name}.`);
      continue;
    }
    if (!isOrderable(product)) {
      problems.push(`${product.name} is sold out.`);
      soldOut.push(product.id);
      continue;
    }
    if (line.qty > product.dailyLimit) {
      problems.push(`Only ${product.dailyLimit} of ${product.name} left today.`);
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
      const r = validateDeliveryAddress({ city: a.city, state: a.state, zip: a.zip });
      if (!r.ok) problems.push(r.reason);
    }
  }

  if (!isPaymentMethodAvailable(input.payment)) {
    problems.push("That payment method isn't available.");
  }
  if (input.payment === "card" && !input.sourceId) {
    problems.push("Missing card details.");
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

/** Validate, charge (card only), notify, and return the placed order. */
export async function placeOrder(input: CheckoutInput): Promise<PlacedOrder> {
  validateOrder(input);

  // Authoritative totals from our inventory — client money is ignored.
  const totals = computeOrder(input.lines, input.method, input.payment);
  if (totals.totalCents <= 0) throw new OrderError(["Order total is invalid."]);

  const orderId = makeShortId();
  let paymentId: string | undefined;

  if (input.payment === "card") {
    try {
      const payment = await square().payments.create({
        idempotencyKey: crypto.randomUUID(),
        sourceId: input.sourceId!,
        amountMoney: { amount: BigInt(totals.totalCents), currency: "USD" as const },
        locationId: locationId(),
        autocomplete: true,
        note: `Particular Notions order ${orderId} (${input.method})`,
      });
      paymentId = payment.payment?.id;
      if (payment.payment?.status !== "COMPLETED") {
        throw new PaymentError();
      }
    } catch (err) {
      if (err instanceof PaymentError) throw err;
      console.error("[checkout] Square charge failed:", err);
      throw new PaymentError();
    }
  }

  // Ready date honors the longest lead time in the cart (validated above, so
  // every line resolves to a real product).
  const orderedProducts = input.lines
    .map((l) => getProduct(l.productId))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));
  const scheduleLabel = fulfillmentSchedule(new Date(), orderLeadTimeHours(orderedProducts)).label;

  // Notifications (email) — best-effort, never throw. Order is already placed.
  await notifyNewOrder({
    orderId,
    method: input.method,
    payment: input.payment,
    customerName: input.customer.name,
    customerEmail: input.customer.email,
    customerPhone: input.customer.phone || undefined,
    note: input.customer.note || undefined,
    address: input.method === "delivery" ? input.address : undefined,
    lines: totals.lines.map((l) => ({
      name: l.name,
      qty: l.qty,
      lineTotalCents: l.lineTotalCents,
    })),
    subtotalCents: totals.subtotalCents,
    deliveryFeeCents: totals.deliveryFeeCents,
    cardSurchargeCents: totals.cardSurchargeCents,
    totalCents: totals.totalCents,
    scheduleLabel,
  }).catch((err) => {
    console.error("[checkout] notifyNewOrder threw unexpectedly:", err);
    return { ownerAlerted: false };
  });

  return {
    orderId,
    method: input.method,
    payment: input.payment,
    subtotalCents: totals.subtotalCents,
    deliveryFeeCents: totals.deliveryFeeCents,
    cardSurchargeCents: totals.cardSurchargeCents,
    totalCents: totals.totalCents,
    scheduleLabel,
    paymentId,
  };
}
