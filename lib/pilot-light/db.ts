// The site reaches Pilot Light's data in its own business database (the `ops`
// schema) with Neon's serverless driver, which Kindling sites already use. Only
// the tables named in this module are touched.

import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { databaseUrl } from "./config";

let sql: NeonQueryFunction<false, false> | null = null;

export function opsSql(): NeonQueryFunction<false, false> {
  sql ??= neon(databaseUrl());
  return sql;
}

/**
 * Accept a signed request id once. False when it was already used (a replay).
 * Also clears ids older than an hour (their signatures have expired anyway).
 */
export async function acceptRequestId(requestId: string, direction: "to_site" | "to_pilot_light"): Promise<boolean> {
  const q = opsSql();
  await q`delete from ops.site_requests where received_at < now() - interval '1 hour'`;
  const rows = await q`insert into ops.site_requests (request_id, direction) values (${requestId}, ${direction}) on conflict do nothing returning request_id`;
  return rows.length === 1;
}
