// What each email the site sends is (docs/site-conventions.md §5, "Emails the
// site sends"). The site adds `siteEmailHeaders(kind)` to every email it sends
// (its own SendGrid call: `headers: siteEmailHeaders("contact_form")`), so when
// one lands in the business's mailbox, Pilot Light knows exactly what it is: a
// contact form message (the customer is its Reply-To) or the site's own alert,
// never mistaken for a customer writing in.

export const SITE_EMAIL_KIND_HEADER = "X-Pilot-Light-Kind";

export const SITE_EMAIL_KINDS = [
  /** A visitor's message from the site's contact form (Reply-To: the visitor). */
  "contact_form",
  /** Alerts to the business: a new order, a review to moderate, a plan bought. */
  "order_alert",
  "review_alert",
  "purchase_alert",
  /** Emails to customers (a copy may reach the business): confirmations and order updates. */
  "order_confirmation",
  "order_update",
  "purchase_confirmation",
  /** Anything else the site sends. */
  "other",
] as const;

export type SiteEmailKind = (typeof SITE_EMAIL_KINDS)[number];

/** The header to add to an email the site sends. */
export function siteEmailHeaders(kind: SiteEmailKind): Record<string, string> {
  return { [SITE_EMAIL_KIND_HEADER]: kind };
}
