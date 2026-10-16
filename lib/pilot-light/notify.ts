// Tell Pilot Light something changed on the site (plan.md Step 18, "change
// ping"), e.g. a customer placed an order, left a review, bought a plan.
//
// The change is written to ops.events in the business's own database first, so
// it's never lost; then Pilot Light gets a signed nudge to look now. If Pilot
// Light can't be reached, it picks the event up on its next run.

import { randomUUID } from "node:crypto";
import { opsSql } from "./db";
import { pilotLight, siteSecret } from "./config";
import { signRequest } from "./signature";

export type Change = {
  /** What happened, e.g. "order.placed", "review.submitted". */
  type: string;
  /** Which record, e.g. { table: "orders", id: "..." }. */
  ref?: Record<string, unknown>;
  payload?: Record<string, unknown>;
  /** Makes a retry safe: the same key is recorded once. */
  key?: string;
};

const TYPE = /^[a-z][a-z0-9_.-]{1,63}$/;

/** `recorded`: written to ops.events. `delivered`: Pilot Light got the nudge. */
export async function notifyChange(change: Change): Promise<{ recorded: boolean; delivered: boolean }> {
  if (!TYPE.test(change.type)) throw new Error(`[pilot-light] "${change.type}" isn't a change type (lowercase, e.g. order.placed).`);
  const key = change.key ?? `site:${randomUUID()}`;
  const rows = await opsSql()`
    insert into ops.events (source, type, ref, payload, idempotency_key)
    values ('site_ping', ${change.type}, ${JSON.stringify(change.ref ?? {})}::jsonb, ${JSON.stringify(change.payload ?? {})}::jsonb, ${key})
    on conflict (idempotency_key) do nothing
    returning id`;
  const recorded = rows.length === 1;

  const target = pilotLight();
  if (!target) return { recorded, delivered: false };
  const path = `/api/sites/${encodeURIComponent(target.businessId)}/events`;
  const body = JSON.stringify({ type: change.type, key });
  try {
    const res = await fetch(target.url + path, {
      method: "POST",
      headers: { "content-type": "application/json", ...signRequest(siteSecret(), "POST", path, body) },
      body,
      signal: AbortSignal.timeout(3_000),
    });
    if (!res.ok) console.error(`[pilot-light] Pilot Light answered ${res.status} to a change ping; it will pick the change up later.`);
    return { recorded, delivered: res.ok };
  } catch (err) {
    console.error(`[pilot-light] Couldn't reach Pilot Light (${(err as Error).message}); it will pick the change up later.`);
    return { recorded, delivered: false };
  }
}
