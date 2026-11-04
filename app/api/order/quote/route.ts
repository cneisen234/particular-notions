// Authoritative order quote. Recomputes totals from the shop in the database so
// the client preview can never disagree with what the server will charge. With
// a coupon code: whether it's valid, and the coupon for the preview to apply.

import { computeOrder, normalizeCode, type CartLine } from "@/lib/pricing";
import { couponForCode } from "@/lib/coupons";
import { getShop } from "@/lib/shop";
import type { FulfillmentMethod, PaymentMethod } from "@/lib/fulfillment";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let body: { lines?: CartLine[]; method?: FulfillmentMethod; payment?: PaymentMethod; couponCode?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  const method: FulfillmentMethod = body.method === "delivery" ? "delivery" : "pickup";
  const payment: PaymentMethod = body.payment === "card" ? "card" : "cash";
  const entered = normalizeCode(typeof body.couponCode === "string" ? body.couponCode : "");

  const [shop, coupon] = await Promise.all([getShop(), couponForCode(entered)]);
  const totals = computeOrder(shop, lines, method, payment, coupon);
  return Response.json({ ok: true, ...totals, coupon, couponValid: entered ? coupon != null : null });
}
