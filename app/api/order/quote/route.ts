// Authoritative order quote. Recomputes totals from OUR inventory so the client
// preview can never disagree with what the server will charge.

import { computeOrder, type CartLine } from "@/lib/pricing";
import type { FulfillmentMethod, PaymentMethod } from "@/lib/fulfillment";

export async function POST(request: Request) {
  let body: { lines?: CartLine[]; method?: FulfillmentMethod; payment?: PaymentMethod };
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  const method: FulfillmentMethod = body.method === "delivery" ? "delivery" : "pickup";
  const payment: PaymentMethod = body.payment === "card" ? "card" : "cash";

  const totals = computeOrder(lines, method, payment);
  return Response.json({ ok: true, ...totals });
}
