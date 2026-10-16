// Order pricing — the single source of truth for order math, used by both the
// checkout preview (client) and the server checkout. Prices come from the shop
// loaded from the database, never from the client, so client and server agree.
//
// Rules:
//   • Delivery fee: flat, delivery orders only. Pickup is free. Waived when the
//     subtotal reaches the free-delivery amount.
//   • Card surcharge: cardSurchargeBps of (subtotal + delivery fee). Cash = none.
//   • No sales tax.

import { getProduct, type Shop } from "@/lib/inventory";
import type { ShopConfig } from "@/lib/shop-config";
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
export function deliveryFeeFor(config: ShopConfig, method: FulfillmentMethod, subtotalCents: number): number {
  if (method !== "delivery") return 0;
  if (subtotalCents >= config.freeDeliveryThresholdCents) return 0;
  return config.deliveryFeeCents;
}

/** Card surcharge on a base amount (0 for cash). */
export function cardSurchargeFor(config: ShopConfig, baseCents: number, payment: PaymentMethod): number {
  if (payment !== "card") return 0;
  return Math.round((baseCents * config.cardSurchargeBps) / 10000);
}

/**
 * Price a cart. Unknown products and non-positive quantities are skipped here —
 * availability, daily limits, and the accepting-orders switch are enforced
 * separately at checkout; this function only does the money.
 */
export function computeOrder(
  shop: Shop,
  lines: CartLine[],
  method: FulfillmentMethod,
  payment: PaymentMethod,
): PricedOrder {
  const priced: PricedLine[] = [];
  let subtotalCents = 0;
  let itemCount = 0;

  for (const line of lines) {
    const product = getProduct(shop, line.productId);
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

  const deliveryFeeCents = deliveryFeeFor(shop.config, method, subtotalCents);
  const cardSurchargeCents = cardSurchargeFor(shop.config, subtotalCents + deliveryFeeCents, payment);
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
