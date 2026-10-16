// Which add-ons are on for this business, as the owner set them in Pilot Light.
// Pilot Light keeps ops.addons in the business's database current (on only when
// it's in the plan, ready, and switched on), so the site reads its own database:
// no call to Pilot Light, and it keeps working if Pilot Light is down.
//
// If the add-ons can't be read, everything counts as off (a feature never shows
// by accident) and the reason is logged.

import { cache } from "react";
import { opsSql } from "./db";

type AddonRow = { addon_key: string; enabled: boolean; settings: Record<string, unknown> | null };

/** Read once per request (React's cache), not once per check. */
const loadAddons = cache(async (): Promise<Map<string, AddonRow>> => {
  try {
    const rows = (await opsSql()`select addon_key, enabled, settings from ops.addons`) as AddonRow[];
    return new Map(rows.map((r) => [r.addon_key, r]));
  } catch (err) {
    console.error(`[pilot-light] Couldn't read add-ons, so they all count as off: ${(err as Error).message}`);
    return new Map();
  }
});

/** Is this add-on on for the business (e.g. "lena_customers", "reviews")? */
export async function isAddonOn(key: string): Promise<boolean> {
  return (await loadAddons()).get(key)?.enabled === true;
}

/** The add-on's settings for the site, or null when it's off. */
export async function getAddonSettings<T extends Record<string, unknown> = Record<string, unknown>>(key: string): Promise<T | null> {
  const row = (await loadAddons()).get(key);
  return row?.enabled ? ((row.settings ?? {}) as T) : null;
}

export type PaymentProvider = "square" | "stripe";

/**
 * Which system the business's website charges through (Square or Stripe, one at
 * a time), as the owner chose in Pilot Light (E-commerce's `payments` setting).
 * Null when it isn't chosen or E-commerce is off. The site charges with its own
 * keys, so it should only follow a choice it has keys for (and keep using the
 * one it can charge with otherwise): checkout never breaks on a switch.
 */
export async function getPaymentProvider(): Promise<PaymentProvider | null> {
  const p = (await getAddonSettings<{ payments?: unknown }>("ecommerce"))?.payments;
  return p === "square" || p === "stripe" ? p : null;
}
