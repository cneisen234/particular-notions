// Fulfillment + payment methods, delivery-area validation, and the cutoff-aware
// "next day" scheduling. Pure logic over the shop's settings (no server-only
// imports) so both the storefront and the server checkout can use it.

import type { ShopConfig } from "@/lib/shop-config";
import type { Product } from "@/lib/inventory";

export type FulfillmentMethod = "pickup" | "delivery";
export type PaymentMethod = "card" | "cash";

/** Fulfillment methods offered to customers. */
export function availableFulfillmentMethods(): FulfillmentMethod[] {
  return ["pickup", "delivery"];
}

/** Payment methods enabled in the shop settings. */
export function availablePaymentMethods(config: ShopConfig): PaymentMethod[] {
  const out: PaymentMethod[] = [];
  if (config.payments.card) out.push("card");
  if (config.payments.cash) out.push("cash");
  return out;
}

export function isFulfillmentMethodAvailable(m: FulfillmentMethod): boolean {
  return availableFulfillmentMethods().includes(m);
}

export function isPaymentMethodAvailable(config: ShopConfig, m: PaymentMethod): boolean {
  return availablePaymentMethods(config).includes(m);
}

// ---- Delivery area ----

export type DeliveryAddressInput = {
  city: string;
  state: string;
  zip: string;
};

/** "A", "A and B", "A, B, and C" — for customer-facing lists. */
export function joinList(items: string[]): string {
  if (items.length <= 2) return items.join(" and ");
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/** First 5 digits of a ZIP (drops any +4 and stray characters). */
function zip5(zip: string): string {
  return (zip.match(/\d/g) ?? []).join("").slice(0, 5);
}

/**
 * Is this address inside the delivery area? Delivery is limited to the shop's
 * state, towns, and ZIPs. Returns a reason on failure so the UI can tell the
 * customer why.
 */
export function validateDeliveryAddress(
  config: ShopConfig,
  a: DeliveryAddressInput,
): { ok: true } | { ok: false; reason: string } {
  const { delivery } = config;
  const state = a.state.trim().toUpperCase();
  const city = a.city.trim().toLowerCase();
  const zip = zip5(a.zip);
  const allowedCities = delivery.cities.map((c) => c.toLowerCase());

  if (state !== delivery.state.toUpperCase()) {
    return { ok: false, reason: `We only deliver within ${delivery.state}.` };
  }
  if (!delivery.zips.includes(zip)) {
    return {
      ok: false,
      reason: `We deliver to ZIP codes ${joinList(delivery.zips)} only.`,
    };
  }
  if (!allowedCities.includes(city)) {
    return {
      ok: false,
      reason: `We deliver to ${joinList(delivery.cities)} only.`,
    };
  }
  return { ok: true };
}

// ---- Lead time (advance notice) ----

/** Advance notice a single product needs, falling back to the shop default. */
export function productLeadTimeHours(config: ShopConfig, p: Pick<Product, "leadTimeHours">): number {
  return p.leadTimeHours ?? config.defaultLeadTimeHours;
}

/**
 * How much notice an order needs: the longest lead time of anything in it (so a
 * cart with one 48h item is a 48h order). Empty carts fall back to the default.
 */
export function orderLeadTimeHours(config: ShopConfig, products: Pick<Product, "leadTimeHours">[]): number {
  return products.reduce(
    (max, p) => Math.max(max, productLeadTimeHours(config, p)),
    config.defaultLeadTimeHours,
  );
}

// ---- Fulfillment scheduling ----
//
// The customer picks their pickup/delivery day at checkout. The cutoff + lead
// time rule below decides the EARLIEST day they may pick; the latest is
// BOOKING_WINDOW_DAYS after the shop's earliest day. Days are YYYY-MM-DD
// strings (how orders store them), with date math done at UTC noon.

/** How many days past the shop's earliest day customers can book. */
export const BOOKING_WINDOW_DAYS = 90;

/** Extract calendar parts + hour for `date` in the given IANA time zone. */
function localParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  return { year: get("year"), month: get("month"), day: get("day"), hour: get("hour") };
}

export type EarliestFulfillment = {
  /** The earliest calendar day, anchored at UTC noon (safe to format in UTC). */
  date: Date;
  /** That day as YYYY-MM-DD. */
  day: string;
  /** Human label, e.g. "Tuesday, September 9". */
  label: string;
  /** True if `now` is at/after the cutoff, so the earliest day rolled out one more. */
  afterCutoff: boolean;
};

/** A day as YYYY-MM-DD (how orders store it). */
export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** A real calendar day written as YYYY-MM-DD. */
export function isIsoDay(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  return isoDate(dayDate(v)) === v;
}

/** A YYYY-MM-DD day as a Date at UTC noon. */
export function dayDate(day: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
}

/** The day `n` days after `day` (negative goes back). */
export function addDays(day: string, n: number): string {
  const d = dayDate(day);
  d.setUTCDate(d.getUTCDate() + n);
  return isoDate(d);
}

/** "Thursday, November 6" for a YYYY-MM-DD day. */
export function dayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long", month: "long", day: "numeric" }).format(dayDate(day));
}

/** "Thu, Nov 6" for a YYYY-MM-DD day. */
export function shortDayLabel(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }).format(dayDate(day));
}

/** Today's date in the shop's time zone, as YYYY-MM-DD. */
export function shopToday(config: ShopConfig, now: Date = new Date()): string {
  const { year, month, day } = localParts(now, config.timeZone);
  return isoDate(new Date(Date.UTC(year, month - 1, day, 12, 0, 0)));
}

/**
 * The earliest day an order placed `now` can be picked up or delivered. Before
 * the cutoff hour that's the next day; at/after the cutoff, the day after next. A
 * `leadTimeHours` above the shop default rolls it out further — one extra day per
 * extra 24h of notice (e.g. a 48h order's earliest day is a day later than a 24h
 * one's). All computed in the shop's time zone.
 */
export function earliestFulfillment(
  config: ShopConfig,
  now: Date = new Date(),
  leadTimeHours: number = config.defaultLeadTimeHours,
): EarliestFulfillment {
  const { year, month, day, hour } = localParts(now, config.timeZone);
  const afterCutoff = hour >= config.orderCutoffHour;
  // Extra whole days an above-default lead time adds on top of the usual
  // next-day turnaround (0 for a default-lead order).
  const extraDays = Math.max(
    0,
    Math.round((leadTimeHours - config.defaultLeadTimeHours) / 24),
  );
  // Anchor at UTC noon so adding days never trips over a DST boundary.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + (afterCutoff ? 2 : 1) + extraDays);
  const iso = isoDate(date);
  return { date, day: iso, label: dayLabel(iso), afterCutoff };
}

/**
 * The days an order may be booked for: from its own earliest day (which honors
 * its lead time) through BOOKING_WINDOW_DAYS past the shop's earliest day. The
 * end doesn't move with lead time, so every product shares one last day.
 */
export function bookingWindow(
  config: ShopConfig,
  now: Date = new Date(),
  leadTimeHours: number = config.defaultLeadTimeHours,
): { first: string; last: string; earliest: EarliestFulfillment } {
  const earliest = earliestFulfillment(config, now, leadTimeHours);
  const last = addDays(earliestFulfillment(config, now).day, BOOKING_WINDOW_DAYS);
  return { first: earliest.day, last, earliest };
}
