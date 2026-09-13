// Fulfillment + payment methods, delivery-area validation, and the cutoff-aware
// "next day" scheduling. Pure logic (no server-only imports) so both the
// storefront and the server checkout can use it.

import { shopConfig } from "@/lib/shop-config";

export type FulfillmentMethod = "pickup" | "delivery";
export type PaymentMethod = "card" | "cash";

/** Fulfillment methods offered to customers. */
export function availableFulfillmentMethods(): FulfillmentMethod[] {
  return ["pickup", "delivery"];
}

/** Payment methods enabled in shop config. */
export function availablePaymentMethods(): PaymentMethod[] {
  const out: PaymentMethod[] = [];
  if (shopConfig.payments.card) out.push("card");
  if (shopConfig.payments.cash) out.push("cash");
  return out;
}

export function isFulfillmentMethodAvailable(m: FulfillmentMethod): boolean {
  return availableFulfillmentMethods().includes(m);
}

export function isPaymentMethodAvailable(m: PaymentMethod): boolean {
  return availablePaymentMethods().includes(m);
}

// ---- Delivery area ----

export type DeliveryAddressInput = {
  city: string;
  state: string;
  zip: string;
};

/** First 5 digits of a ZIP (drops any +4 and stray characters). */
function zip5(zip: string): string {
  return (zip.match(/\d/g) ?? []).join("").slice(0, 5);
}

/**
 * Is this address inside the delivery area? Delivery is limited to the configured
 * state, towns, and ZIPs (see shopConfig.delivery). Returns a reason on failure
 * so the UI can tell the customer why.
 */
export function validateDeliveryAddress(
  a: DeliveryAddressInput,
): { ok: true } | { ok: false; reason: string } {
  const { delivery } = shopConfig;
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
      reason: `We deliver to ZIP codes ${delivery.zips.join(" and ")} only.`,
    };
  }
  if (!allowedCities.includes(city)) {
    return {
      ok: false,
      reason: `We deliver to ${delivery.cities.join(" and ")} only.`,
    };
  }
  return { ok: true };
}

// ---- Next-day fulfillment scheduling ----

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

export type FulfillmentSchedule = {
  /** The fulfillment calendar day, anchored at UTC noon (safe to format in UTC). */
  date: Date;
  /** Human label, e.g. "Tuesday, September 9". */
  label: string;
  /** True if placed at/after the cutoff, so it rolled to the day after next. */
  afterCutoff: boolean;
};

/**
 * When an order placed `now` will be fulfilled. Orders before the cutoff hour are
 * ready the next day; orders at/after the cutoff roll to the day after next. All
 * computed in the shop's configured time zone.
 */
export function fulfillmentSchedule(now: Date = new Date()): FulfillmentSchedule {
  const { year, month, day, hour } = localParts(now, shopConfig.timeZone);
  const afterCutoff = hour >= shopConfig.orderCutoffHour;
  // Anchor at UTC noon so adding days never trips over a DST boundary.
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  date.setUTCDate(date.getUTCDate() + (afterCutoff ? 2 : 1));
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(date);
  return { date, label, afterCutoff };
}
