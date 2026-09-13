// Order pricing — the single source of truth for order math, used by both the
// checkout preview (client) and the server checkout. Prices come from the static
// inventory, never from the client, so client and server always agree.
//
// Rules (per the build spec):
//   • Delivery fee: flat, delivery orders only. Pickup is free. Waived when the
//     subtotal reaches shopConfig.freeDeliveryThresholdCents.
//   • Card surcharge: cardSurchargeBps of (subtotal + delivery fee). Cash = none.
//   • No sales tax.

import { getProduct } from "@/lib/inventory";
import { shopConfig } from "@/lib/shop-config";
import type { FulfillmentMethod, PaymentMethod } from "@/lib/fulfillment";

export type CartLine = { productId: string; qty: number };

export type PricedLine = {
  productId: string;
  name: string;
  unitPriceCents: number;
  qty: number;
  lineTotalCents: number;
};

export type OrderTotals = {
  subtotalCents: number;
  deliveryFeeCents: number;
  cardSurchargeCents: number;
  totalCents: number;
};

export type PricedOrder = OrderTotals & {
  lines: PricedLine[];
  itemCount: number;
};

/**
 * Delivery fee for a method + subtotal: the flat fee for delivery, nothing for
 * pickup, and nothing once the subtotal reaches the free-delivery threshold.
 */
export function deliveryFeeFor(method: FulfillmentMethod, subtotalCents: number): number {
  if (method !== "delivery") return 0;
  if (subtotalCents >= shopConfig.freeDeliveryThresholdCents) return 0;
  return shopConfig.deliveryFeeCents;
}

/** Card surcharge on a base amount (0 for cash). */
export function cardSurchargeFor(baseCents: number, payment: PaymentMethod): number {
  if (payment !== "card") return 0;
  return Math.round((baseCents * shopConfig.cardSurchargeBps) / 10000);
}

/**
 * Price a cart. Unknown products and non-positive quantities are skipped here —
 * availability, daily limits, and the accepting-orders switch are enforced
 * separately at checkout (Step 5); this function only does the money.
 */
export function computeOrder(
  lines: CartLine[],
  method: FulfillmentMethod,
  payment: PaymentMethod,
): PricedOrder {
  const priced: PricedLine[] = [];
  let subtotalCents = 0;
  let itemCount = 0;

  for (const line of lines) {
    const product = getProduct(line.productId);
    if (!product) continue;
    const qty = Math.floor(line.qty);
    if (!Number.isFinite(qty) || qty <= 0) continue;
    const lineTotalCents = product.priceCents * qty;
    subtotalCents += lineTotalCents;
    itemCount += qty;
    priced.push({
      productId: product.id,
      name: product.name,
      unitPriceCents: product.priceCents,
      qty,
      lineTotalCents,
    });
  }

  const deliveryFeeCents = deliveryFeeFor(method, subtotalCents);
  const cardSurchargeCents = cardSurchargeFor(subtotalCents + deliveryFeeCents, payment);
  const totalCents = subtotalCents + deliveryFeeCents + cardSurchargeCents;

  return {
    lines: priced,
    itemCount,
    subtotalCents,
    deliveryFeeCents,
    cardSurchargeCents,
    totalCents,
  };
}
