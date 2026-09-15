import Link from "next/link";

// Root 404 — shown for any unmatched URL and for notFound() calls. It renders
// inside the root layout, so the site nav + footer frame it. The "0" of 404 is a
// little beaded charm on a keyring, keeping it on-brand for Particular Notions.
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

        {/* 4 · beaded charm · 4 */}
        <div className="flex items-center justify-center gap-2 sm:gap-3">
          <Four />
          <Charm />
          <Four />
        </div>
        <span className="sr-only">404 — page not found</span>

        <h1 className="mt-4 text-3xl md:text-4xl" style={{ color: "var(--charcoal)" }}>
          This page lost its{" "}
          <span className="italic" style={{ color: "var(--gold-deep)" }}>
            charm
          </span>
          .
        </h1>
        <div className="divider-sparkle mx-auto my-5" />
        <p className="text-lg" style={{ color: "var(--text-light)" }}>
          We couldn&rsquo;t find the page you were looking for — but there&rsquo;s
          plenty more to see.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/" className="btn-primary">
            Take me home
          </Link>
          <Link href="/gallery" className="btn-gold">
            Browse the Gallery
          </Link>
        </div>
      </div>
    </main>
  );
}

// The oversized sage "4" flanking the charm, in the brand serif.
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

// A little beaded charm on a keyring standing in for the "0" — gold ring with
// sage + gold beads and a jump ring up top, straight from the logo motifs.
function Charm() {
  return (
    <svg
      viewBox="0 0 64 96"
      aria-hidden
      style={{ width: "clamp(54px, 16vw, 96px)", height: "auto", flexShrink: 0 }}
    >
      {/* jump ring / clasp */}
      <circle cx="32" cy="13" r="6.5" fill="none" stroke="var(--gold-deep)" strokeWidth="3" />
      <path d="M32 19 L32 30" stroke="var(--gold-deep)" strokeWidth="3" strokeLinecap="round" />
      {/* main charm ring — the "0" */}
      <circle cx="32" cy="60" r="23" fill="none" stroke="var(--gold)" strokeWidth="6" />
      {/* beads seated on the ring */}
      <circle cx="32" cy="37" r="4.5" fill="var(--sage)" />
      <circle cx="55" cy="60" r="4.5" fill="var(--gold-deep)" />
      <circle cx="32" cy="83" r="4.5" fill="var(--sage-deep)" />
      <circle cx="9" cy="60" r="4.5" fill="var(--gold-soft)" />
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
