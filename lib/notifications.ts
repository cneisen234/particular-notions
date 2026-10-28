// Order notifications — email only, via Twilio SendGrid:
//   1. an alert email to the owner (ORDER_ALERT_EMAIL), and
//   2. a branded confirmation email to the customer.
// The contact form's messages go to the owner the same way (notifyContactMessage).
//
// There is NO database, so the email IS the order record. Every order is also
// written to the server log as a fallback, and the owner alert is sent first and
// awaited so a cash order (which has no Square record to fall back on) still
// leaves a trail. Notification failures never throw — the order is already placed
// (and, for card, already charged), so a mail hiccup must not fail the customer.

import "server-only";
import { formatCents } from "@/lib/money";
import type { PickupLocation } from "@/lib/shop-config";
import { siteEmailHeaders, type SiteEmailKind } from "@/lib/pilot-light";
import type { FulfillmentMethod, PaymentMethod } from "@/lib/fulfillment";

export type OrderNotice = {
  orderId: string;
  method: FulfillmentMethod;
  payment: PaymentMethod;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  note?: string;
  /** Present for delivery orders (the customer's address). */
  address?: { line1: string; line2?: string; city: string; state: string; zip: string };
  lines: { name: string; qty: number; lineTotalCents: number }[];
  subtotalCents: number;
  deliveryFeeCents: number;
  cardSurchargeCents: number;
  totalCents: number;
  /** e.g. "Tuesday, September 9". */
  scheduleLabel: string;
  /** The shop's pickup address (from its settings). */
  pickup: PickupLocation;
};

// ---- Brand palette (matches the site's CSS variables) ----
const C = {
  cream: "#f8f4eb",
  white: "#ffffff",
  sage: "#6f8c78",
  sageSoft: "#cddccf",
  gold: "#b8945a",
  goldSoft: "#e7d6ad",
  charcoal: "#403a32",
  textLight: "#7c7367",
  border: "#e8e0d1",
};

function methodLabel(m: FulfillmentMethod): string {
  return m === "delivery" ? "Local delivery" : "Pickup";
}

function paymentLabel(p: PaymentMethod): string {
  return p === "card" ? "Paid by card" : "Cash at pickup/delivery";
}

function fullPickupAddress(p: PickupLocation): string {
  return `${p.addressLine}, ${p.city}, ${p.state} ${p.zip}`;
}

function fullDeliveryAddress(a: NonNullable<OrderNotice["address"]>): string {
  return `${a.line1}${a.line2 ? `, ${a.line2}` : ""}, ${a.city}, ${a.state} ${a.zip}`;
}

// Public base URL (e.g. https://www.megans-sourdough.com). Email clients can only
// load images from an absolute, public URL — so we show the real logo when this
// is set and fall back to a styled text wordmark otherwise (e.g. local dev).
const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/+$/, "");

function brandMark(): string {
  if (SITE_URL) {
    return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td style="background-color:${C.white};border-radius:14px;padding:10px 16px;">
      <img src="${SITE_URL}/logo-megans-sourdough.jpg" alt="Megan&rsquo;s Sourdough" width="180" style="display:block;width:180px;max-width:100%;height:auto;border:0;" />
    </td></tr></table>`;
  }
  return `<div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;letter-spacing:0.5px;color:${C.white};">Megan&rsquo;s <span style="color:${C.goldSoft};">Sourdough</span></div>`;
}

// ---- Shared branded HTML shell (table-based for email-client compatibility) ----
function shell(preheader: string, contentHtml: string): string {
  return `<div style="margin:0;padding:0;background-color:${C.cream};">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${preheader}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${C.cream};padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background-color:${C.white};border:1px solid ${C.border};border-radius:16px;overflow:hidden;">
        <tr><td style="background-color:${C.sage};padding:28px 32px;text-align:center;">
          ${brandMark()}
          <div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:2px;text-transform:uppercase;color:${C.sageSoft};margin-top:10px;">Fresh sourdough, baked to order</div>
        </td></tr>
        <tr><td style="padding:32px;font-family:Arial,Helvetica,sans-serif;color:${C.charcoal};line-height:1.5;">${contentHtml}</td></tr>
        <tr><td style="background-color:${C.cream};padding:18px 32px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${C.textLight};border-top:1px solid ${C.border};">
          Megan&rsquo;s Sourdough · Fairview, MI<br/><span style="color:${C.gold};font-size:14px;">&#10022;</span>
        </td></tr>
      </table>
    </td></tr>
  </table>
</div>`;
}

function itemsTable(n: OrderNotice): string {
  const rows = n.lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 0;font-size:15px;">${l.qty} &times; ${l.name}</td><td style="padding:6px 0;text-align:right;font-size:15px;white-space:nowrap;">${formatCents(
          l.lineTotalCents,
        )}</td></tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">${rows}</table>`;
}

function totalsTable(n: OrderNotice): string {
  const row = (label: string, value: string, opts?: { bold?: boolean; accent?: boolean }) =>
    `<tr>
      <td style="padding:6px 0;font-size:15px;${opts?.bold ? "font-weight:bold;" : ""}">${label}</td>
      <td style="padding:6px 0;text-align:right;font-size:${opts?.bold ? "18px" : "15px"};${
        opts?.bold ? "font-weight:bold;" : ""
      }${opts?.accent ? `color:${C.sage};` : ""}white-space:nowrap;">${value}</td>
    </tr>`;
  const rows = [row("Subtotal", formatCents(n.subtotalCents))];
  if (n.deliveryFeeCents > 0) rows.push(row("Delivery fee", formatCents(n.deliveryFeeCents)));
  if (n.cardSurchargeCents > 0) rows.push(row("Card fee", formatCents(n.cardSurchargeCents)));
  rows.push(row("Total", formatCents(n.totalCents), { bold: true, accent: true }));
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${C.border};margin-top:8px;padding-top:8px;">${rows.join(
    "",
  )}</table>`;
}

function infoBox(inner: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0 0;"><tr><td style="background-color:${C.cream};border:1px solid ${C.border};border-radius:10px;padding:16px;font-size:14px;color:${C.charcoal};">${inner}</td></tr></table>`;
}

function orderMeta(n: OrderNotice): string {
  return `<p style="margin:0 0 4px;font-size:15px;"><strong>Order #${n.orderId}</strong></p>
  <p style="margin:0 0 20px;font-size:15px;color:${C.textLight};">${methodLabel(n.method)} &mdash; ready <strong style="color:${C.charcoal};">${n.scheduleLabel}</strong></p>`;
}

// ---- Low-level SendGrid send. Returns true if accepted. Never throws. ----
async function sendEmail(opts: {
  /** What the email is (required): Pilot Light sorts the store's mail by it (site conventions §5). */
  kind: SiteEmailKind;
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}): Promise<boolean> {
  const apiKey = process.env.SENDGRID_API_KEY;
  const from = process.env.ORDER_FROM_EMAIL;
  if (!apiKey || !from) {
    console.warn("[notify] SendGrid not configured — skipping email.");
    return false;
  }
  try {
    const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: opts.to }] }],
        from: { email: from, name: "Megan's Sourdough" },
        ...(opts.replyTo ? { reply_to: { email: opts.replyTo } } : {}),
        subject: opts.subject,
        headers: siteEmailHeaders(opts.kind),
        content: [
          { type: "text/plain", value: opts.text },
          { type: "text/html", value: opts.html },
        ],
      }),
    });
    if (!res.ok) {
      console.error(`[notify] SendGrid ${res.status} sending "${opts.subject}" to ${opts.to}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[notify] SendGrid request failed:", err);
    return false;
  }
}

function lineRowsText(n: OrderNotice): string {
  return n.lines.map((l) => `${l.qty} x ${l.name} — ${formatCents(l.lineTotalCents)}`).join("\n");
}

function totalsText(n: OrderNotice): string {
  const rows = [`Subtotal: ${formatCents(n.subtotalCents)}`];
  if (n.deliveryFeeCents > 0) rows.push(`Delivery fee: ${formatCents(n.deliveryFeeCents)}`);
  if (n.cardSurchargeCents > 0) rows.push(`Card fee: ${formatCents(n.cardSurchargeCents)}`);
  rows.push(`Total: ${formatCents(n.totalCents)}`);
  return rows.join("\n");
}

// ---- Customer confirmation ----
async function sendCustomerConfirmation(n: OrderNotice): Promise<boolean> {
  const isDelivery = n.method === "delivery";
  const whereText = isDelivery
    ? `We'll deliver to ${fullDeliveryAddress(n.address!)} and email you to confirm a time.`
    : `Pickup address: ${fullPickupAddress(n.pickup)}.`;
  const payText =
    n.payment === "cash"
      ? `Please have ${formatCents(n.totalCents)} in cash ready at ${isDelivery ? "delivery" : "pickup"}.`
      : `Your card was charged ${formatCents(n.totalCents)}.`;

  const text = [
    `Thanks for your order, ${n.customerName}!`,
    ``,
    `Order #${n.orderId}`,
    `${methodLabel(n.method)} — ready ${n.scheduleLabel}`,
    ``,
    lineRowsText(n),
    ``,
    totalsText(n),
    ``,
    payText,
    whereText,
    n.note ? `\nYour note: ${n.note}` : ``,
    ``,
    `— Megan's Sourdough`,
  ].join("\n");

  const whereInner = isDelivery
    ? `<strong style="color:${C.sage};">Delivering to</strong><br/>${fullDeliveryAddress(n.address!)}<br/><span style="color:${C.textLight};">We'll email you to confirm a time.</span>`
    : `<strong style="color:${C.sage};">Pickup address</strong><br/>${fullPickupAddress(n.pickup)}`;

  const content = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${C.sage};margin:0 0 16px;">Thanks for your order, ${n.customerName}!</h1>
    ${orderMeta(n)}
    ${itemsTable(n)}
    ${totalsTable(n)}
    <p style="margin:20px 0 0;font-size:15px;">${payText}</p>
    ${infoBox(whereInner)}
    ${
      n.note
        ? `<p style="margin:16px 0 0;font-size:14px;color:${C.textLight};font-style:italic;">Your note: ${n.note}</p>`
        : ""
    }
    <p style="margin:24px 0 0;font-size:14px;color:${C.textLight};">With love,<br/>Megan&rsquo;s Sourdough</p>`;

  return sendEmail({
    kind: "order_confirmation",
    to: n.customerEmail,
    subject: `Your Megan's Sourdough order #${n.orderId}`,
    text,
    html: shell(`Order #${n.orderId} — ready ${n.scheduleLabel}`, content),
    replyTo: process.env.CUSTOMER_REPLY_TO_EMAIL,
  });
}

// ---- Owner alert ----
async function sendOwnerAlert(n: OrderNotice): Promise<boolean> {
  const alertTo = process.env.ORDER_ALERT_EMAIL;
  if (!alertTo) {
    console.warn("[notify] ORDER_ALERT_EMAIL not set — skipping owner alert.");
    return false;
  }
  const whereText =
    n.method === "delivery"
      ? `Deliver to: ${fullDeliveryAddress(n.address!)}`
      : `Pickup at: ${fullPickupAddress(n.pickup)}`;

  const text = [
    `New order #${n.orderId}`,
    `${methodLabel(n.method)} — ready ${n.scheduleLabel}`,
    `${paymentLabel(n.payment)}`,
    ``,
    `Customer: ${n.customerName}`,
    `Email: ${n.customerEmail}`,
    n.customerPhone ? `Phone: ${n.customerPhone}` : ``,
    whereText,
    n.note ? `Note: ${n.note}` : ``,
    ``,
    lineRowsText(n),
    ``,
    totalsText(n),
  ]
    .filter(Boolean)
    .join("\n");

  const payChip = `<span style="display:inline-block;background-color:${
    n.payment === "card" ? C.sageSoft : C.goldSoft
  };color:${C.charcoal};font-size:12px;font-weight:bold;padding:4px 12px;border-radius:999px;">${paymentLabel(
    n.payment,
  )}</span>`;

  const contactRows = `
    <tr><td style="padding:3px 0;color:${C.textLight};width:70px;">Customer</td><td style="padding:3px 0;">${n.customerName}</td></tr>
    <tr><td style="padding:3px 0;color:${C.textLight};">Email</td><td style="padding:3px 0;"><a href="mailto:${n.customerEmail}" style="color:${C.sage};">${n.customerEmail}</a></td></tr>
    ${n.customerPhone ? `<tr><td style="padding:3px 0;color:${C.textLight};">Phone</td><td style="padding:3px 0;">${n.customerPhone}</td></tr>` : ""}
    <tr><td style="padding:3px 0;color:${C.textLight};vertical-align:top;">${n.method === "delivery" ? "Deliver" : "Pickup"}</td><td style="padding:3px 0;">${
      n.method === "delivery" ? fullDeliveryAddress(n.address!) : fullPickupAddress(n.pickup)
    }</td></tr>`;

  const content = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${C.sage};margin:0 0 6px;">New order #${n.orderId}</h1>
    <p style="margin:0 0 12px;font-size:15px;color:${C.textLight};">${methodLabel(n.method)} &mdash; ready <strong style="color:${C.charcoal};">${n.scheduleLabel}</strong></p>
    <p style="margin:0 0 20px;">${payChip}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:8px;">${contactRows}</table>
    ${n.note ? `<p style="margin:8px 0 0;font-size:14px;color:${C.textLight};font-style:italic;">Note: ${n.note}</p>` : ""}
    ${itemsTable(n)}
    ${totalsTable(n)}`;

  return sendEmail({
    kind: "order_alert",
    to: alertTo,
    subject: `New order #${n.orderId} — ${methodLabel(n.method)} (${paymentLabel(n.payment)})`,
    text,
    html: shell(`New order #${n.orderId} — ${formatCents(n.totalCents)}`, content),
    replyTo: n.customerEmail,
  });
}

/**
 * Send both emails and log the order server-side as a durable fallback. Never
 * throws. Returns whether the owner alert was accepted (the caller may surface a
 * warning for cash orders, which have no Square record to fall back on).
 */
export async function notifyNewOrder(n: OrderNotice): Promise<{ ownerAlerted: boolean }> {
  console.log(
    `[order] #${n.orderId} ${n.method}/${n.payment} ${n.customerName} <${n.customerEmail}> ` +
      `total=${formatCents(n.totalCents)} :: ${n.lines.map((l) => `${l.qty}×${l.name}`).join(", ")}`,
  );

  const ownerAlerted = await sendOwnerAlert(n);
  await sendCustomerConfirmation(n);
  return { ownerAlerted };
}

// ---- Contact form ----
export type ContactMessage = {
  name: string;
  email: string;
  phone?: string;
  /** What the message is about (the form's topic list). */
  topic: string;
  message: string;
};

/** The visitor typed it, so it's escaped before going into the HTML email. */
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

/**
 * Email a visitor's contact form message to the owner (ORDER_ALERT_EMAIL), with
 * the visitor as Reply-To so answering it reaches them. Returns true if
 * SendGrid accepted it. Never throws.
 */
export async function notifyContactMessage(m: ContactMessage): Promise<boolean> {
  console.log(`[contact] ${m.name} <${m.email}> (${m.topic})`);
  const to = process.env.ORDER_ALERT_EMAIL;
  if (!to) {
    console.warn("[notify] ORDER_ALERT_EMAIL not set — skipping contact message.");
    return false;
  }

  const text = [
    `New message from ${m.name}`,
    ``,
    `Email: ${m.email}`,
    ...(m.phone ? [`Phone: ${m.phone}`] : []),
    `About: ${m.topic}`,
    ``,
    m.message,
    ``,
    `Reply to this email to answer ${m.name}.`,
  ].join("\n");

  const name = escapeHtml(m.name);
  const email = escapeHtml(m.email);
  const rows = `
    <tr><td style="padding:3px 0;color:${C.textLight};width:70px;">Email</td><td style="padding:3px 0;"><a href="mailto:${email}" style="color:${C.sage};">${email}</a></td></tr>
    ${m.phone ? `<tr><td style="padding:3px 0;color:${C.textLight};">Phone</td><td style="padding:3px 0;">${escapeHtml(m.phone)}</td></tr>` : ""}
    <tr><td style="padding:3px 0;color:${C.textLight};">About</td><td style="padding:3px 0;">${escapeHtml(m.topic)}</td></tr>`;
  const content = `
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:22px;color:${C.sage};margin:0 0 16px;">New message from ${name}</h1>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:8px;">${rows}</table>
    ${infoBox(escapeHtml(m.message).replace(/\n/g, "<br/>"))}
    <p style="margin:20px 0 0;font-size:14px;color:${C.textLight};">Reply to this email to answer ${name}.</p>`;

  return sendEmail({
    kind: "contact_form",
    to,
    subject: `New message from ${m.name} — ${m.topic}`,
    text,
    html: shell(`New message from ${name}`, content),
    replyTo: m.email,
  });
}
