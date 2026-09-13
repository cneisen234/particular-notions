// Place an order: verify reCAPTCHA, then validate + charge (card) + notify.
// All money is recomputed server-side; the client's totals are never trusted.

import { placeOrder, OrderError, PaymentError, type CheckoutInput } from "@/lib/checkout";
import { verifyRecaptcha } from "@/lib/recaptcha";

type Body = CheckoutInput & { recaptchaToken?: string };

function clientIp(request: Request): string | undefined {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0]!.trim() : undefined;
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid request." }, { status: 400 });
  }

  // Bot gate before any Square work.
  const recaptcha = await verifyRecaptcha(body.recaptchaToken, "checkout", clientIp(request));
  if (!recaptcha.ok) {
    return Response.json(
      { ok: false, message: "Couldn't verify you're human. Please refresh and try again." },
      { status: 400 },
    );
  }

  try {
    const order = await placeOrder({
      lines: body.lines,
      method: body.method,
      payment: body.payment,
      customer: body.customer,
      address: body.address,
      sourceId: body.sourceId,
    });
    return Response.json({ ok: true, ...order });
  } catch (err) {
    if (err instanceof OrderError) {
      return Response.json(
        { ok: false, message: err.message, problems: err.problems, soldOut: err.soldOut, paused: err.paused },
        { status: 409 },
      );
    }
    if (err instanceof PaymentError) {
      return Response.json({ ok: false, message: err.message }, { status: 402 });
    }
    console.error("[checkout] unexpected error:", err);
    return Response.json(
      { ok: false, message: "Something went wrong placing your order. Please try again." },
      { status: 500 },
    );
  }
}
