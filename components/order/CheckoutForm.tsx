"use client";

// Checkout form + live order summary + order placement.
//
// Totals are previewed with the SAME computeOrder() the server uses, over the
// shop the page loaded from the database. On submit we
// verify reCAPTCHA, tokenize the card with Square's Web Payments SDK (card only),
// and POST to /api/order/checkout, which recomputes money server-side, charges
// (card) and emails. Cash orders skip tokenization and the charge.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { lineKey, useCart } from "./CartProvider";
import DatePicker, { type DayStatus } from "./DatePicker";
import { formatCents } from "@/lib/money";
import { computeOrder, normalizeCode, type CouponMatch } from "@/lib/pricing";
import { cartUnits, shortOn } from "@/lib/inventory";
import {
  addDays,
  availableFulfillmentMethods,
  availablePaymentMethods,
  bookingWindow,
  dayDate,
  dayLabel,
  BOOKING_WINDOW_DAYS,
  joinList,
  orderLeadTimeHours,
  productLeadTimeHours,
  shopToday,
  shortDayLabel,
  validateDeliveryAddress,
  type FulfillmentMethod,
  type PaymentMethod,
} from "@/lib/fulfillment";

// ---- Square Web Payments SDK (loaded from Square's CDN; tokenizes the card in a
// Square-hosted iframe so raw card data never touches our server). ----
type TokenizeResult = { status: string; token?: string; errors?: { message: string }[] };
type SquareCard = {
  attach: (selector: string) => Promise<void>;
  tokenize: () => Promise<TokenizeResult>;
};
type SquarePayments = { card: () => Promise<SquareCard> };
type SquareSdk = { payments: (appId: string, locationId: string) => SquarePayments };
declare global {
  interface Window {
    Square?: SquareSdk;
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

const SDK_URL = {
  sandbox: "https://sandbox.web.squarecdn.com/v1/square.js",
  production: "https://web.squarecdn.com/v1/square.js",
};

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? "";

function getRecaptchaToken(): Promise<string | undefined> {
  return new Promise((resolve) => {
    const g = window.grecaptcha;
    if (!g || !RECAPTCHA_SITE_KEY) return resolve(undefined);
    g.ready(() =>
      g.execute(RECAPTCHA_SITE_KEY, { action: "checkout" }).then(resolve).catch(() => resolve(undefined)),
    );
  });
}

type Props = { appId: string; locationId: string; squareEnv: string };

type Placed = {
  orderId: string;
  totalCents: number;
  method: FulfillmentMethod;
  payment: PaymentMethod;
  scheduleLabel: string;
};

const inputBase = "w-full rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none";
const inputStyle = { border: "1px solid var(--border)", color: "var(--charcoal)" } as const;

/** "Thursday" for a YYYY-MM-DD day. */
function weekdayOf(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", weekday: "long" }).format(dayDate(day));
}

/** "November 6" for a YYYY-MM-DD day. */
function monthDayOf(day: string): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", month: "long", day: "numeric" }).format(dayDate(day));
}

/** "6 PM" for hour 18. */
function hourLabel(hour: number): string {
  return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric" }).format(Date.UTC(2000, 0, 1, hour));
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
      <rect x="3" y="4.5" width="14" height="12.5" rx="2.5" />
      <path d="M3 8.5h14M7 2.75v3.5M13 2.75v3.5" />
    </svg>
  );
}

function Field({
  label,
  children,
  required,
}: {
  label: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold mb-1" style={{ color: "var(--charcoal)" }}>
        {label}
        {required && <span style={{ color: "var(--gold-deep)" }}> *</span>}
      </span>
      {children}
    </label>
  );
}

export default function CheckoutForm({ appId, locationId, squareEnv }: Props) {
  const { shop, enriched, count, hydrated, clear } = useCart();
  const shopConfig = shop.config;
  const router = useRouter();

  const fulfillmentMethods = availableFulfillmentMethods();
  const paymentMethods = availablePaymentMethods(shopConfig);

  const [method, setMethod] = useState<FulfillmentMethod>(fulfillmentMethods[0] ?? "pickup");
  const [payment, setPayment] = useState<PaymentMethod>(paymentMethods[0] ?? "cash");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const [couponInput, setCouponInput] = useState("");
  // What the shop said about the code typed (checked as they type, like Soady Poppers).
  const [couponCheck, setCouponCheck] = useState<{ code: string; coupon: CouponMatch | null } | null>(null);

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState(shopConfig.delivery.cities[0] ?? "");
  const [zip, setZip] = useState(shopConfig.delivery.zips[0] ?? "");

  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<Placed | null>(null);

  const cardRef = useRef<SquareCard | null>(null);
  const [cardReady, setCardReady] = useState(false);

  const cardConfigured = Boolean(appId && locationId);
  const isDelivery = method === "delivery";
  const isCard = payment === "card";

  const lines = useMemo(
    () => enriched.map((i) => ({ productId: i.productId, pack: i.pack, qty: i.qty })),
    [enriched],
  );
  const couponCode = normalizeCode(couponInput);
  const coupon = couponCheck && couponCheck.code === couponCode ? couponCheck.coupon : null;
  const couponInvalid = Boolean(couponCode) && couponCheck?.code === couponCode && !couponCheck.coupon;
  const totals = useMemo(() => computeOrder(shop, lines, method, payment, coupon), [shop, lines, method, payment, coupon]);

  // Check the code with the shop, debounced so typing doesn't fire a request per keystroke. Only the
  // code matters here (the money is worked out above), so other re-renders never cancel the check.
  useEffect(() => {
    if (!couponCode) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetch("/api/order/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: [], couponCode }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (!cancelled && d.ok) setCouponCheck({ code: couponCode, coupon: d.coupon ?? null });
        })
        .catch(() => {});
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [couponCode]);

  // ---- Pickup/delivery day ----
  // The clock ticks each minute so the earliest day moves on when the cutoff passes.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);
  const leadHours = orderLeadTimeHours(shopConfig, enriched.map((i) => i.product));
  const booking = useMemo(() => bookingWindow(shopConfig, now, leadHours), [shopConfig, now, leadHours]);
  const today = shopToday(shopConfig, now);
  const units = useMemo(() => cartUnits(shop, lines), [shop, lines]);
  const dayStatus = useCallback(
    (day: string): DayStatus =>
      day < booking.first || day > booking.last ? "closed" : shortOn(shop, units, day).length ? "booked" : "available",
    [shop, units, booking],
  );
  const earliestOpen = useMemo(() => {
    for (let d = booking.first; d <= booking.last; d = addDays(d, 1)) if (dayStatus(d) === "available") return d;
    return null;
  }, [booking, dayStatus]);
  // What they tapped; the order's day is that while it can still take the cart,
  // otherwise the earliest day that can (so there's always a sensible default).
  const [pickedDay, setPickedDay] = useState<string | null>(null);
  const day = pickedDay && dayStatus(pickedDay) === "available" ? pickedDay : earliestOpen;
  const pickMoved = Boolean(pickedDay && day && pickedDay !== day);
  // The item that sets the earliest day, when it needs more than the usual notice.
  const slowest = useMemo(() => {
    const extra = enriched
      .map((i) => i.product)
      .filter((p) => productLeadTimeHours(shopConfig, p) > shopConfig.defaultLeadTimeHours)
      .sort((a, b) => productLeadTimeHours(shopConfig, b) - productLeadTimeHours(shopConfig, a));
    return extra[0] ?? null;
  }, [enriched, shopConfig]);

  const freeDelivery = totals.subtotalCents >= shopConfig.freeDeliveryThresholdCents;
  const remainingForFree = shopConfig.freeDeliveryThresholdCents - totals.subtotalCents;
  const freeThresholdLabel = formatCents(shopConfig.freeDeliveryThresholdCents);

  const deliveryError = useMemo(() => {
    if (!isDelivery) return null;
    if (!line1.trim() || !city.trim() || !zip.trim()) return null;
    const r = validateDeliveryAddress(shopConfig, { city, state: shopConfig.delivery.state, zip });
    return r.ok ? null : r.reason;
  }, [shopConfig, isDelivery, line1, city, zip]);

  const problems = useMemo(() => {
    const p: string[] = [];
    if (!name.trim()) p.push("Please enter your name.");
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      p.push("Please enter a valid email for your confirmation.");
    if (isDelivery) {
      if (!line1.trim() || !city.trim() || !zip.trim())
        p.push("Please enter your full delivery address.");
      const r = validateDeliveryAddress(shopConfig, { city, state: shopConfig.delivery.state, zip });
      if (line1.trim() && !r.ok) p.push(r.reason);
    }
    if (isCard && !cardConfigured)
      p.push("Card payments aren't configured yet — choose cash, or add Square keys.");
    if (couponInvalid) p.push("That coupon code isn't valid. Remove it to place your order.");
    if (!day)
      p.push(`No day in our booking window has room for everything in your cart. Try fewer of an item.`);
    return p;
  }, [shopConfig, name, email, isDelivery, line1, city, zip, isCard, cardConfigured, couponInvalid, day]);

  const canSubmit = count > 0 && problems.length === 0;

  // Load reCAPTCHA v3 script once (if configured).
  useEffect(() => {
    if (!RECAPTCHA_SITE_KEY || document.querySelector("script[data-recaptcha]")) return;
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.setAttribute("data-recaptcha", "1");
    document.head.appendChild(s);
  }, []);

  // Load the Square SDK and mount the card field once (kept mounted, hidden when
  // paying by cash). Only when card is configured and there's a cart.
  useEffect(() => {
    if (!cardConfigured || !hydrated || placed || count === 0) return;
    let cancelled = false;
    async function init() {
      if (cardRef.current) return;
      const url = SDK_URL[squareEnv === "production" ? "production" : "sandbox"];
      if (!window.Square) {
        await new Promise<void>((resolve, reject) => {
          const s = document.createElement("script");
          s.src = url;
          s.onload = () => resolve();
          s.onerror = () => reject(new Error("Failed to load payment form."));
          document.head.appendChild(s);
        });
      }
      if (cancelled || !window.Square) return;
      const payments = window.Square.payments(appId, locationId);
      const card = await payments.card();
      await card.attach("#card-container");
      if (cancelled) return;
      cardRef.current = card;
      setCardReady(true);
    }
    init().catch(() => setServerError("Couldn't load the secure card field. Please refresh."));
    return () => {
      cancelled = true;
    };
  }, [appId, locationId, squareEnv, cardConfigured, hydrated, placed, count]);

  useEffect(() => {
    if (placed) window.scrollTo({ top: 0, behavior: "auto" });
  }, [placed]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAttempted(true);
    setServerError(null);
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    try {
      const recaptchaToken = await getRecaptchaToken();

      let sourceId: string | undefined;
      if (isCard) {
        if (!cardRef.current) {
          setServerError("The card field isn't ready yet — give it a moment and try again.");
          setSubmitting(false);
          return;
        }
        const result = await cardRef.current.tokenize();
        if (result.status !== "OK" || !result.token) {
          setServerError(result.errors?.[0]?.message ?? "Please check your card details.");
          setSubmitting(false);
          return;
        }
        sourceId = result.token;
      }

      const res = await fetch("/api/order/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lines,
          method,
          payment,
          customer: { name, email, phone, note },
          address: isDelivery ? { line1, line2, city, state: shopConfig.delivery.state, zip } : undefined,
          fulfillmentDate: day,
          sourceId,
          couponCode: couponCode || undefined,
          recaptchaToken,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        // A day may have filled up since the page loaded: fetch fresh bookings so the calendar catches up.
        if (res.status === 409) router.refresh();
        setServerError(
          data.paused
            ? data.message || "Online ordering is paused right now."
            : Array.isArray(data.problems) && data.problems.length
              ? data.problems.join(" ")
              : data.message || "We couldn't place your order. Please try again.",
        );
        setSubmitting(false);
        return;
      }

      setPlaced({
        orderId: data.orderId,
        totalCents: data.totalCents,
        method: data.method,
        payment: data.payment,
        scheduleLabel: data.scheduleLabel,
      });
      clear();
    } catch {
      setServerError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  // ---- Loading (pre-hydration) ----
  if (!hydrated) {
    return (
      <main className="min-h-screen section-padding">
        <div className="container mx-auto max-w-2xl text-center" style={{ color: "var(--text-light)" }}>
          Loading your cart…
        </div>
      </main>
    );
  }

  // ---- Confirmation (checked before the empty-cart guard, since we clear) ----
  if (placed) {
    const deliver = placed.method === "delivery";
    return (
      <main className="min-h-screen section-padding">
        <div className="container mx-auto max-w-lg text-center flex flex-col items-center">
          <p className="eyebrow mb-3">Order confirmed</p>
          <h1 className="text-4xl mb-3" style={{ color: "var(--sage-deep)" }}>
            Thanks, {name || "friend"}! 🎉
          </h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg mb-2" style={{ color: "var(--charcoal)" }}>
            Order <strong>#{placed.orderId}</strong> — {formatCents(placed.totalCents)}
          </p>
          <p className="text-base mb-6" style={{ color: "var(--text-light)" }}>
            {deliver ? "Local delivery" : "Pickup"} on <strong>{placed.scheduleLabel}</strong>.
            {placed.payment === "cash"
              ? ` Please have ${formatCents(placed.totalCents)} in cash ready.`
              : " Your card was charged."}{" "}
            We&apos;ve emailed your confirmation{deliver ? " and will reach out to confirm a delivery time." : `${" "}with the pickup address.`}
          </p>
          <Link href="/order" className="btn-primary">
            Back to the menu
          </Link>
        </div>
      </main>
    );
  }

  // ---- Empty cart ----
  if (count === 0) {
    return (
      <main className="min-h-screen section-padding">
        <div className="container mx-auto max-w-2xl text-center flex flex-col items-center">
          <h1 className="text-4xl mb-4" style={{ color: "var(--sage-deep)" }}>
            Your cart is empty
          </h1>
          <div className="divider-sparkle mb-6" />
          <Link href="/order" className="btn-primary">
            Back to the menu
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen py-12 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="mb-8">
          <Link href="/order" className="text-sm underline" style={{ color: "var(--text-light)" }}>
            ← Back to the menu
          </Link>
          <h1 className="text-4xl mt-2" style={{ color: "var(--sage-deep)" }}>
            Checkout
          </h1>
        </div>

        <form onSubmit={handleSubmit} className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
          {/* ---- Left: form ---- */}
          <div className="space-y-8">
            {/* Fulfillment */}
            <section className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="text-2xl mb-4" style={{ color: "var(--charcoal)" }}>
                How would you like to get it?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {fulfillmentMethods.map((m) => (
                  <button
                    type="button"
                    key={m}
                    onClick={() => setMethod(m)}
                    className="rounded-xl px-4 py-3 text-center font-semibold transition-all"
                    style={{
                      fontFamily: "var(--font-quicksand), sans-serif",
                      border: `2px solid ${method === m ? "var(--sage-deep)" : "var(--border)"}`,
                      backgroundColor: method === m ? "rgba(156, 181, 163, 0.14)" : "var(--white)",
                      color: "var(--charcoal)",
                    }}
                  >
                    {m === "pickup" ? "Pickup" : "Local delivery"}
                    <span className="block text-xs font-normal mt-0.5" style={{ color: "var(--text-light)" }}>
                      {m === "pickup"
                        ? "Free"
                        : freeDelivery
                          ? "Free"
                          : `${formatCents(shopConfig.deliveryFeeCents)} fee`}
                    </span>
                  </button>
                ))}
              </div>

              {isDelivery && (
                <p className="text-sm mt-4 font-semibold" style={{ color: "var(--sage-deep)" }}>
                  {freeDelivery
                    ? "🎉 You've qualified for free delivery!"
                    : `Add ${formatCents(remainingForFree)} more for free delivery (orders ${freeThresholdLabel}+).`}
                </p>
              )}

              {method === "pickup" && (
                <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: "var(--cream)" }}>
                  <p className="text-sm font-semibold" style={{ color: "var(--charcoal)" }}>
                    Pickup in {shopConfig.pickup.city}, {shopConfig.pickup.state}
                  </p>
                  <p className="text-sm" style={{ color: "var(--text-light)" }}>
                    We&apos;ll email you the exact pickup address with your order confirmation.
                  </p>
                </div>
              )}

              {isDelivery && (
                <div className="mt-4 space-y-3">
                  <Field label="Street address" required>
                    <input className={inputBase} style={inputStyle} value={line1} onChange={(e) => setLine1(e.target.value)} />
                  </Field>
                  <Field label="Apt / unit (optional)">
                    <input className={inputBase} style={inputStyle} value={line2} onChange={(e) => setLine2(e.target.value)} />
                  </Field>
                  <div className="grid grid-cols-3 gap-3">
                    <Field label="Town" required>
                      <select className={inputBase} style={inputStyle} value={city}
                        onChange={(e) => {
                          setCity(e.target.value);
                          const z = shopConfig.delivery.zips[e.target.selectedIndex];
                          if (z) setZip(z);
                        }}
                      >
                        {shopConfig.delivery.cities.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="State" required>
                      <input className={inputBase} style={{ ...inputStyle, backgroundColor: "var(--cream)" }} value={shopConfig.delivery.state} readOnly />
                    </Field>
                    <Field label="ZIP" required>
                      <select className={inputBase} style={inputStyle} value={zip} onChange={(e) => setZip(e.target.value)}>
                        {shopConfig.delivery.zips.map((z) => (
                          <option key={z} value={z}>
                            {z}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-light)" }}>
                    We deliver to {joinList(shopConfig.delivery.cities)} (ZIPs{" "}
                    {shopConfig.delivery.zips.join(", ")}).
                  </p>
                  {deliveryError && (
                    <p className="text-sm font-semibold" style={{ color: "#b3261e" }}>
                      {deliveryError}
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* When */}
            <section className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--border)" }} aria-labelledby="when-heading">
              <h2 id="when-heading" className="text-2xl mb-1" style={{ color: "var(--charcoal)" }}>
                When would you like it?
              </h2>
              <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
                Pick any open day for your {isDelivery ? "delivery" : "pickup"}, up to {BOOKING_WINDOW_DAYS} days ahead.
              </p>

              <div className="grid gap-6 sm:grid-cols-[minmax(0,21rem)_1fr] sm:items-start">
                <DatePicker
                  value={day}
                  onChange={setPickedDay}
                  first={booking.first}
                  last={booking.last}
                  today={today}
                  status={dayStatus}
                  label={isDelivery ? "Delivery day" : "Pickup day"}
                />

                <div className="rounded-xl p-5" style={{ backgroundColor: "var(--cream)" }}>
                  <p className="eyebrow mb-2">{isDelivery ? "Delivery" : "Pickup"} day</p>
                  <div aria-live="polite">
                    {day ? (
                      <>
                        <p className="text-3xl leading-tight" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", color: "var(--charcoal)" }}>
                          {weekdayOf(day)}
                        </p>
                        <p className="text-lg font-semibold" style={{ fontFamily: "var(--font-quicksand), sans-serif", color: "var(--sage-ink)" }}>
                          {monthDayOf(day)}
                        </p>
                      </>
                    ) : (
                      <p className="text-base font-semibold" style={{ color: "var(--charcoal)" }}>
                        No open days for this cart
                      </p>
                    )}
                    {pickMoved && day && (
                      <p
                        className="mt-3 text-sm rounded-lg px-3 py-2"
                        style={{ color: "var(--charcoal)", backgroundColor: "var(--white)", borderLeft: "3px solid var(--gold)" }}
                      >
                        {shortDayLabel(pickedDay!)} isn&apos;t open for this order anymore, so we moved you to the next open day.
                      </p>
                    )}
                  </div>

                  <ul className="mt-4 space-y-1.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    <li>
                      Earliest for this order: <strong style={{ color: "var(--charcoal)" }}>{shortDayLabel(booking.first)}</strong>
                      {slowest
                        ? ` — ${slowest.name} needs ${Math.round(productLeadTimeHours(shopConfig, slowest) / 24)} days' notice.`
                        : "."}
                    </li>
                    <li>
                      {booking.earliest.afterCutoff
                        ? `It's past today's ${hourLabel(shopConfig.orderCutoffHour)} cutoff, so the earliest day is one later.`
                        : `Today's cutoff is ${hourLabel(shopConfig.orderCutoffHour)} — after that, the earliest day moves back one.`}
                    </li>
                  </ul>

                  {day && earliestOpen && day !== earliestOpen && (
                    <button
                      type="button"
                      onClick={() => setPickedDay(earliestOpen)}
                      className="cal-link mt-4 text-sm font-semibold underline underline-offset-2 rounded"
                      style={{ color: "var(--sage-ink)" }}
                    >
                      Switch to the earliest day ({shortDayLabel(earliestOpen)})
                    </button>
                  )}
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="text-2xl mb-4" style={{ color: "var(--charcoal)" }}>
                Your details
              </h2>
              <div className="space-y-3">
                <Field label="Name" required>
                  <input className={inputBase} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} />
                </Field>
                <div className="grid sm:grid-cols-2 gap-3">
                  <Field label="Email" required>
                    <input className={inputBase} style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                  </Field>
                  <Field label="Phone (optional)">
                    <input className={inputBase} style={inputStyle} value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </Field>
                </div>
                <Field label="Order notes (optional)">
                  <textarea className={inputBase} style={inputStyle} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
                </Field>
              </div>
            </section>
          </div>

          {/* ---- Right: summary + payment ---- */}
          <div className="space-y-6">
            <aside className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="text-2xl mb-4" style={{ color: "var(--charcoal)" }}>
                Order summary
              </h2>
              {day && (
                <p className="flex items-center gap-2 text-sm -mt-2 mb-4" style={{ color: "var(--charcoal)" }}>
                  <span style={{ color: "var(--sage-ink)" }}>
                    <CalendarIcon />
                  </span>
                  {isDelivery ? "Delivery" : "Pickup"} · {dayLabel(day)}
                </p>
              )}
              <ul className="space-y-2 mb-4">
                {enriched.map((i) => (
                  <li key={lineKey(i.productId, i.pack)} className="flex justify-between text-sm">
                    <span style={{ color: "var(--charcoal)" }}>
                      {i.qty} × {i.name}
                    </span>
                    <span style={{ color: "var(--charcoal)" }}>{formatCents(i.lineTotalCents)}</span>
                  </li>
                ))}
              </ul>

              <div className="py-4" style={{ borderTop: "1px solid var(--border)" }}>
                <Field label="Have a coupon code?">
                  <input
                    className={`${inputBase} uppercase`}
                    style={inputStyle}
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    autoCapitalize="characters"
                    autoComplete="off"
                  />
                </Field>
                {coupon && (
                  <p className="mt-1.5 text-sm font-semibold" style={{ color: "var(--sage-deep)" }}>
                    Code {coupon.code} applied 🎉
                  </p>
                )}
                {couponInvalid && (
                  <p className="mt-1.5 text-sm font-semibold" style={{ color: "#b3261e" }}>
                    That code isn&apos;t valid.
                  </p>
                )}
              </div>

              <div className="space-y-1.5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
                <Row label="Subtotal" value={formatCents(totals.subtotalCents)} />
                {totals.discountCents > 0 && (
                  <Row label={`Coupon (${totals.couponCode})`} value={`-${formatCents(totals.discountCents)}`} />
                )}
                {isDelivery && (
                  <Row
                    label="Delivery fee"
                    value={totals.deliveryFeeCents === 0 ? "Free" : formatCents(totals.deliveryFeeCents)}
                  />
                )}
                {isCard && (
                  <Row
                    label={`Card fee (${shopConfig.cardSurchargeBps / 100}%)`}
                    value={formatCents(totals.cardSurchargeCents)}
                  />
                )}
              </div>

              <div className="flex justify-between items-center pt-3" style={{ borderTop: "1px solid var(--border)" }}>
                <span className="text-lg font-semibold" style={{ color: "var(--charcoal)" }}>
                  Total
                </span>
                <span className="text-2xl font-semibold" style={{ color: "var(--sage-deep)" }}>
                  {formatCents(totals.totalCents)}
                </span>
              </div>
            </aside>

            {/* Payment */}
            <section className="bg-white rounded-2xl p-6" style={{ border: "1px solid var(--border)" }}>
              <h2 className="text-2xl mb-4" style={{ color: "var(--charcoal)" }}>
                Payment
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethods.map((pm) => (
                  <button
                    type="button"
                    key={pm}
                    onClick={() => setPayment(pm)}
                    className="rounded-xl px-4 py-3 text-center font-semibold transition-all"
                    style={{
                      fontFamily: "var(--font-quicksand), sans-serif",
                      border: `2px solid ${payment === pm ? "var(--sage-deep)" : "var(--border)"}`,
                      backgroundColor: payment === pm ? "rgba(156, 181, 163, 0.14)" : "var(--white)",
                      color: "var(--charcoal)",
                    }}
                  >
                    {pm === "card" ? "Pay by card" : "Cash at pickup/delivery"}
                    <span className="block text-xs font-normal mt-0.5" style={{ color: "var(--text-light)" }}>
                      {pm === "card" ? `+${shopConfig.cardSurchargeBps / 100}% card fee` : "No card fee"}
                    </span>
                  </button>
                ))}
              </div>

              {/* Card field: kept mounted once loaded, shown only when paying by card. */}
              {cardConfigured ? (
                <div className="mt-4" style={{ display: isCard ? "block" : "none" }}>
                  <div id="card-container" style={{ minHeight: 52 }} />
                  {!cardReady && (
                    <p className="text-xs mt-2" style={{ color: "var(--text-light)" }}>
                      Loading secure card field…
                    </p>
                  )}
                </div>
              ) : (
                isCard && (
                  <div className="mt-4 rounded-lg p-4 text-sm" style={{ backgroundColor: "#fdf0ef", color: "#b3261e" }}>
                    Card payments aren&apos;t configured yet. Add your Square keys to
                    <code> .env.local</code>, or pay with cash.
                  </div>
                )
              )}

              {attempted && problems.length > 0 && (
                <ul className="mt-4 space-y-1">
                  {problems.map((p) => (
                    <li key={p} className="text-sm" style={{ color: "#b3261e" }}>
                      • {p}
                    </li>
                  ))}
                </ul>
              )}

              {serverError && (
                <p className="mt-4 text-sm font-semibold" style={{ color: "#b3261e" }}>
                  {serverError}
                </p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full mt-5"
                style={{ display: "block", opacity: submitting || (attempted && !canSubmit) ? 0.7 : 1 }}
              >
                {submitting
                  ? "Placing order…"
                  : payment === "cash"
                    ? "Place order"
                    : `Pay ${formatCents(totals.totalCents)} & place order`}
              </button>
              <p className="text-xs text-center mt-3" style={{ color: "var(--text-light)" }}>
                {isCard
                  ? "Card is charged securely by Square."
                  : "Pay with cash when you pick up or receive your order."}
              </p>
              {RECAPTCHA_SITE_KEY && (
                <p className="text-[10px] text-center mt-2" style={{ color: "var(--text-light)" }}>
                  Protected by reCAPTCHA.
                </p>
              )}
            </section>
          </div>
        </form>
      </div>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span style={{ color: "var(--text-light)" }}>{label}</span>
      <span style={{ color: "var(--charcoal)" }}>{value}</span>
    </div>
  );
}
