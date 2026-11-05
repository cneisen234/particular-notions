// The store, loaded from its database for each request: the shop settings, the
// delivery towns, the catalog, and how much of each product's daily limit is
// booked on each day customers can pick. Server-only; pages pass the result down.

import "server-only";
import { and, asc, between, eq, inArray, notInArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { categories, deliveryTowns, orderItems, orders, products, settings } from "@/lib/db/schema";
import { addDays, bookingWindow, productLeadTimeHours } from "@/lib/fulfillment";
import { leftOn, type Product, type Shop } from "@/lib/inventory";
import type { ShopConfig } from "@/lib/shop-config";

type Db = typeof db;
/** A transaction or the shared client (the checkout counts inside its transaction). */
type Reader = Pick<Db, "select">;

/** Orders that don't hold any of a day's limit. */
const NOT_COUNTED = ["cancelled", "refunded"] as const;

export async function getShopConfig(r: Reader = db): Promise<ShopConfig> {
  const [[s], towns] = await Promise.all([
    r.select().from(settings).where(eq(settings.id, 1)).limit(1),
    r.select({ city: deliveryTowns.city, zip: deliveryTowns.zip }).from(deliveryTowns).orderBy(asc(deliveryTowns.sortOrder), asc(deliveryTowns.city)),
  ]);
  if (!s) throw new Error("The shop's settings row is missing (run the migrations).");
  return {
    acceptingOrders: s.acceptingOrders,
    pausedMessage: s.pausedMessage,
    deliveryFeeCents: s.deliveryFeeCents,
    freeDeliveryThresholdCents: s.freeDeliveryThresholdCents,
    cardSurchargeBps: s.cardSurchargeBps,
    orderCutoffHour: s.orderCutoffHour,
    timeZone: s.timeZone,
    defaultLeadTimeHours: s.defaultLeadTimeHours,
    pickup: { label: s.pickupLabel, addressLine: s.pickupAddressLine, city: s.pickupCity, state: s.pickupState, zip: s.pickupZip },
    delivery: { state: s.deliveryState, cities: towns.map((t) => t.city), zips: towns.map((t) => t.zip) },
    payments: { card: s.cardPayments, cash: s.cashPayments },
  };
}

const daysQty = () => sql<number>`sum(coalesce(${orderItems.dailyLimitUsed}, ${orderItems.qty}))::int`;

/** How much of each product's daily limit is already ordered for each of these days. Keyed `${productId}|${YYYY-MM-DD}`. */
export async function orderedOn(days: string[], r: Reader = db): Promise<Map<string, number>> {
  const out = new Map<string, number>();
  if (!days.length) return out;
  const rows = await r
    .select({ productId: orderItems.productId, day: orders.fulfillmentDate, qty: daysQty() })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(inArray(orders.fulfillmentDate, [...new Set(days)]), notInArray(orders.status, [...NOT_COUNTED])))
    .groupBy(orderItems.productId, orders.fulfillmentDate);
  for (const row of rows) if (row.productId) out.set(`${row.productId}|${row.day}`, row.qty);
  return out;
}

/** The same counts for every day from `first` through `last` (YYYY-MM-DD, inclusive). */
async function orderedBetween(first: string, last: string, r: Reader = db): Promise<Record<string, number>> {
  const rows = await r
    .select({ productId: orderItems.productId, day: orders.fulfillmentDate, qty: daysQty() })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(and(between(orders.fulfillmentDate, first, last), notInArray(orders.status, [...NOT_COUNTED])))
    .groupBy(orderItems.productId, orders.fulfillmentDate);
  const out: Record<string, number> = {};
  for (const row of rows) if (row.productId && row.qty > 0) out[`${row.productId}|${row.day}`] = row.qty;
  return out;
}

/**
 * The whole shop, with what's booked on each day of the booking window. Each
 * product's `remaining` is the most left on any day it can be booked for (its own
 * earliest day, which honors its lead time, through the window's last day).
 */
export async function getShop(now: Date = new Date(), r: Reader = db): Promise<Shop> {
  const [config, cats, prods] = await Promise.all([
    getShopConfig(r),
    r.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.name)),
    r.select().from(products).orderBy(asc(products.sortOrder), asc(products.name)),
  ]);
  const shopWindow = bookingWindow(config, now);
  const booked = await orderedBetween(shopWindow.first, shopWindow.last, r);
  const bestDay = (p: (typeof prods)[number]) => {
    const { first, last } = bookingWindow(config, now, productLeadTimeHours(config, p));
    let best = 0;
    for (let day = first; day <= last && best < p.dailyLimit; day = addDays(day, 1)) {
      best = Math.max(best, leftOn(booked, p, day));
    }
    return best;
  };
  const list: Product[] = prods.map((p) => ({
    id: p.id,
    name: p.name,
    description: p.description,
    category: p.categoryId,
    priceCents: p.priceCents,
    dailyLimit: p.dailyLimit,
    remaining: bestDay(p),
    available: p.available,
    leadTimeHours: p.leadTimeHours,
    imageUrl: p.imageUrl,
    packSize: p.packSize,
    twoPackPriceCents: p.twoPackPriceCents,
    fourPackPriceCents: p.fourPackPriceCents,
    sixPackPriceCents: p.sixPackPriceCents,
    twelvePackPriceCents: p.twelvePackPriceCents,
  }));
  return {
    config,
    categories: cats.map((c) => ({ id: c.id, name: c.name, ...(c.description ? { description: c.description } : {}) })),
    products: list,
    booked,
  };
}
