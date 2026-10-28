import Link from "next/link";

// Root 404 — shown for any unmatched URL and for notFound() calls. It renders
// inside the root layout, so the site nav + footer frame it. The "0" of 404 is a
// little sourdough loaf, keeping it on-brand for Megan's Sourdough.
export default function NotFound() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-20">
      <div
        className="relative max-w-lg w-full text-center bg-white rounded-2xl shadow-sm px-8 py-12 md:px-12 md:py-16"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Corner sparkles, like the logo scatter */}
        <Sparkle className="-top-2 left-6" size={16} />
        <Sparkle className="top-8 -right-2" size={12} />
        <Sparkle className="-bottom-2 right-10" size={14} />

        <p className="eyebrow mb-4">Page not found</p>

        {/* 4 · sourdough loaf · 4 */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Four />
          <Loaf />
          <Four />
        </div>
        <span className="sr-only">404 — page not found</span>

        <h1 className="mt-4 text-3xl md:text-4xl" style={{ color: "var(--charcoal)" }}>
          This page didn&rsquo;t{" "}
          <span className="italic" style={{ color: "var(--gold-deep)" }}>
            rise
          </span>
          .
        </h1>
        <div className="divider-sparkle mx-auto my-5" />
        <p className="text-lg" style={{ color: "var(--text-light)" }}>
          We couldn&rsquo;t find the page you were looking for — but there&rsquo;s
          plenty more fresh from the oven.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Take me home
          </Link>
          <Link href="/order" className="btn-gold">
            Order Online
          </Link>
        </div>
      </div>
    </main>
  );
}

// The oversized sage "4" flanking the loaf, in the brand serif.
function Four() {
  return (
    <span
      aria-hidden
      className="leading-none"
      style={{
        fontFamily: "var(--font-cormorant), serif",
        fontSize: "clamp(76px, 22vw, 132px)",
        fontWeight: 600,
        color: "var(--sage-deep)",
      }}
    >
      4
    </span>
  );
}

// A sourdough boule standing in for the "0" — a domed golden crust with three
// diagonal scores opening to the pale crumb, and a dusting of flour.
function Loaf() {
  return (
    <svg
      viewBox="6 12 84 72"
      aria-hidden
      style={{ width: "clamp(70px, 20vw, 120px)", height: "auto", flexShrink: 0, marginTop: "0.18em" }}
    >
      {/* the boule — the "0" */}
      <path
        d="M9 62 C9 32, 28 14, 48 14 C68 14, 87 32, 87 62 C87 76, 72 82, 48 82 C24 82, 9 76, 9 62 Z"
        fill="var(--gold)"
        stroke="var(--gold-deep)"
        strokeWidth="3"
      />
      {/* scores: a shadowed edge with the crumb showing through */}
      {[0, 15, 30].map((dx) => (
        <g key={dx} transform={`translate(${dx} 0)`}>
          <path d="M23 62 Q 28 44, 39 31" fill="none" stroke="var(--gold-deep)" strokeWidth="6" strokeLinecap="round" />
          <path d="M25 61 Q 30 44, 40 32" fill="none" stroke="var(--gold-soft)" strokeWidth="3" strokeLinecap="round" />
        </g>
      ))}
      {/* flour dusting */}
      <circle cx="33" cy="24" r="1.5" fill="var(--white)" />
      <circle cx="58" cy="21" r="1.5" fill="var(--white)" />
      <circle cx="74" cy="34" r="1.5" fill="var(--white)" />
      <circle cx="18" cy="46" r="1.5" fill="var(--white)" />
    </svg>
  );
}

// Small gold sparkle, matching the site's photo-frame accents.
function Sparkle({ className, size = 14 }: { className: string; size?: number }) {
  return (
    <span
      aria-hidden
      className={`absolute select-none pointer-events-none leading-none ${className}`}
      style={{ color: "var(--gold)", fontSize: size }}
    >
      ✦
    </span>
  );
}
