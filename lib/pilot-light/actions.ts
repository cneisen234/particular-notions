// The site's side of Pilot Light's calls (docs/site-conventions.md §3): every
// POST to /api/pilot-light/<name> is checked (signed with the site's secret,
// recent, never seen before) and then handed to the site's own code for <name>.
// `ping` is built in (Pilot Light's connection check).
//
// In the site: app/api/pilot-light/[action]/route.ts
//   export const POST = pilotLightRoute({ "plan-save": savePlan, "order-ready": emailCustomer });

import { verifyRequest } from "./signature";
import { siteSecret } from "./config";
import { acceptRequestId } from "./db";
import { SITE_MODULE_VERSION } from "./version";

/** What Pilot Light sends with each site action (plan.md Step 16). */
export type SiteActionRequest = {
  /** The declared action's key (npm run site:actions). */
  action: string;
  operation: "create" | "update" | "delete" | "status" | "ping";
  /** Schema-map feature, resource, and the business's table the record is in. */
  feature?: string;
  resource?: string;
  table?: string;
  /** The record (update, delete, status; and create "after"). */
  id?: string;
  /** Column → new value (create, update). */
  values?: Record<string, unknown>;
  /** Status change (status). */
  from?: string;
  to?: string;
  /** Who pressed it in Pilot Light. */
  actor: string;
};

/** `id`: the new record's id (a create the site made). `message`: shown to the owner. */
export type SiteActionReply = { id?: string; message?: string } | void;
export type SiteActionHandler = (request: SiteActionRequest) => Promise<SiteActionReply>;

/**
 * Throw this to refuse with a reason the owner will see in Pilot Light
 * ("Stripe is down", "that plan has active members"). Any other error is logged
 * on the site and the owner sees only that the website hit an error.
 */
export class SiteActionRefused extends Error {}

const MAX_BODY = 1_000_000;
const NAME = /^[a-z0-9][a-z0-9_.-]{0,63}$/;

const reply = (status: number, body: Record<string, unknown>) => Response.json(body, { status, headers: { "cache-control": "no-store" } });

async function handle(request: Request, name: string, actions: Record<string, SiteActionHandler>): Promise<Response> {
  if (!NAME.test(name)) return reply(404, { ok: false, error: "no such action" });
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY) return reply(413, { ok: false, error: "the request is too large" });
  const body = await request.text();
  if (body.length > MAX_BODY) return reply(413, { ok: false, error: "the request is too large" });

  const url = new URL(request.url);
  const checked = verifyRequest(siteSecret(), { method: request.method, path: url.pathname + url.search, body, headers: request.headers });
  if (!checked.ok) return reply(401, { ok: false, error: "not signed by Pilot Light" });
  if (!(await acceptRequestId(checked.requestId, "to_site"))) return reply(409, { ok: false, error: "this request was already received" });

  let input: SiteActionRequest;
  try {
    input = JSON.parse(body) as SiteActionRequest;
  } catch {
    return reply(400, { ok: false, error: "the request isn't JSON" });
  }
  // The ping also says which copy of the module this site runs (version.ts).
  if (name === "ping") return reply(200, { ok: true, message: "connected", module: SITE_MODULE_VERSION });

  const handler = Object.hasOwn(actions, name) ? actions[name] : undefined;
  if (!handler) return reply(404, { ok: false, error: `the website doesn't handle "${name}"` });
  try {
    const result = (await handler(input)) ?? {};
    return reply(200, { ok: true, ...(result.id ? { id: String(result.id) } : {}), ...(result.message ? { message: result.message } : {}) });
  } catch (err) {
    if (err instanceof SiteActionRefused) return reply(422, { ok: false, error: err.message });
    console.error(`[pilot-light] Site action "${name}" failed:`, err);
    return reply(500, { ok: false, error: "the website hit an error" });
  }
}

/** The route handler for app/api/pilot-light/[action]/route.ts. */
export function pilotLightRoute(actions: Record<string, SiteActionHandler> = {}) {
  return async function POST(request: Request, context: { params: Promise<{ action: string }> }): Promise<Response> {
    return handle(request, (await context.params).action, actions);
  };
}
