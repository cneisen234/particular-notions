// Signing requests between Pilot Light and a business's website, both ways
// (plan.md Steps 16 and 18). The ONE copy: Pilot Light uses it through
// lib/sites/signature.ts, and it ships to every site in the site module.
// Standalone: only Node's crypto.
//
// Each request carries:
//   x-pilot-light-timestamp  seconds since 1970 when it was sent
//   x-pilot-light-request    a unique id (the receiver refuses repeats)
//   x-pilot-light-signature  v1=<hex HMAC-SHA256 of "timestamp.request.METHOD.path.body">
// with the site's own secret. A request older than 5 minutes is refused.

import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const SIGNATURE_HEADERS = {
  timestamp: "x-pilot-light-timestamp",
  request: "x-pilot-light-request",
  signature: "x-pilot-light-signature",
} as const;

const MAX_AGE_SECONDS = 5 * 60;

function mac(secret: string, parts: { timestamp: string; request: string; method: string; path: string; body: string }): string {
  return createHmac("sha256", secret).update(`${parts.timestamp}.${parts.request}.${parts.method.toUpperCase()}.${parts.path}.${parts.body}`).digest("hex");
}

/** Headers for a signed request. `path` is the URL path (with any query string). */
export function signRequest(secret: string, method: string, path: string, body: string, now = Date.now()): Record<string, string> {
  const timestamp = String(Math.floor(now / 1000));
  const request = randomUUID();
  return {
    [SIGNATURE_HEADERS.timestamp]: timestamp,
    [SIGNATURE_HEADERS.request]: request,
    [SIGNATURE_HEADERS.signature]: `v1=${mac(secret, { timestamp, request, method, path, body })}`,
  };
}

export type Verified = { ok: true; requestId: string } | { ok: false; reason: "missing" | "stale" | "bad_signature" };

/** On the site: is this request really from Pilot Light, and recent? (Also reject request ids you've seen.) */
export function verifyRequest(
  secret: string,
  req: { method: string; path: string; body: string; headers: { get(name: string): string | null } },
  now = Date.now(),
): Verified {
  const timestamp = req.headers.get(SIGNATURE_HEADERS.timestamp);
  const request = req.headers.get(SIGNATURE_HEADERS.request);
  const signature = req.headers.get(SIGNATURE_HEADERS.signature);
  if (!timestamp || !request || !signature?.startsWith("v1=")) return { ok: false, reason: "missing" };
  const age = Math.abs(Math.floor(now / 1000) - Number(timestamp));
  if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) return { ok: false, reason: "stale" };
  const expected = Buffer.from(mac(secret, { timestamp, request, method: req.method, path: req.path, body: req.body }), "hex");
  const given = Buffer.from(signature.slice(3), "hex");
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return { ok: false, reason: "bad_signature" };
  return { ok: true, requestId: request };
}

/**
 * Lena's chat key (plan.md Step 38): the site module puts it on Lena's script
 * tag, signed with the site's secret, so Pilot Light knows the chat was added by
 * the business's own site (and a new secret retires old keys). Pilot Light also
 * checks every chat request comes from the site's own address.
 */
export function widgetKey(secret: string, businessId: string): string {
  return createHmac("sha256", secret).update(`lena-widget.v1.${businessId}`).digest("base64url");
}

/** Pilot Light's side: is this the key the business's site would put on Lena's script? */
export function verifyWidgetKey(secret: string, businessId: string, key: string): boolean {
  const expected = Buffer.from(widgetKey(secret, businessId));
  const given = Buffer.from(key);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
