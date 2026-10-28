// The contact form: drop bots (the hidden "company" field, then reCAPTCHA),
// check the fields, then hand the message to Lena (Pilot Light) and email it to
// the owner.

import { CONTACT_TOPICS, type ContactTopic } from "@/lib/contact";
import { notifyContactMessage } from "@/lib/notifications";
import { notifyChange } from "@/lib/pilot-light";
import { verifyRecaptcha } from "@/lib/recaptcha";

type Body = {
  name?: unknown;
  email?: unknown;
  phone?: unknown;
  interest?: unknown;
  message?: unknown;
  /** Hidden from people; only bots fill it in. */
  company?: unknown;
  token?: unknown;
};

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function field(v: unknown, max: number): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function clientIp(request: Request): string | undefined {
  const fwd = request.headers.get("x-forwarded-for");
  return fwd ? fwd.split(",")[0]!.trim() : undefined;
}

function fail(error: string, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(request: Request) {
  let body: Body;
  try {
    body = await request.json();
  } catch {
    return fail("Something went wrong. Please try again.");
  }

  // A bot filled in the hidden field: say it worked and send nothing.
  if (field(body.company, 200)) return Response.json({ ok: true });

  const recaptcha = await verifyRecaptcha(field(body.token, 4000) || undefined, "contact", clientIp(request));
  if (!recaptcha.ok) return fail("Couldn’t verify you’re human. Please refresh and try again.");

  const name = field(body.name, 100);
  const email = field(body.email, 200);
  const phone = field(body.phone, 40);
  const message = field(body.message, 5000);
  const interest = field(body.interest, 100);
  const topic: ContactTopic = (CONTACT_TOPICS as readonly string[]).includes(interest)
    ? (interest as ContactTopic)
    : "Something else";

  if (!name) return fail("Please enter your name.");
  if (!EMAIL.test(email)) return fail("Please enter a valid email address.");
  if (!message) return fail("Please enter a message.");

  const contact = { name, email, phone: phone || undefined, topic, message };

  // Lena hears about it two ways: the change ping (recorded in ops.events, then
  // Pilot Light is nudged), and the email itself, tagged "contact_form" with the
  // visitor as Reply-To, which Pilot Light sorts out of the shop's inbox.
  let recorded = false;
  try {
    ({ recorded } = await notifyChange({ type: "contact.submitted", payload: contact }));
  } catch (err) {
    console.error("[contact] Couldn't tell Pilot Light about the message:", err);
  }
  const emailed = await notifyContactMessage(contact);

  if (!recorded && !emailed) {
    return fail("Your message couldn’t be sent right now. Please try again, or email me directly.", 502);
  }
  return Response.json({ ok: true });
}
