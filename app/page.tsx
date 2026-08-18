import Link from 'next/link';
import Image from 'next/image';

const collections = [
  {
    title: 'Word Charms',
    blurb: 'Clip and carry your little inspirations around with you.',
    img: '/word-charms.png',
    href: '/gallery#word-charms',
  },
  {
    title: 'Charm Clips',
    blurb: 'Quality beads on a clasp ready for your keys, bag, or zipper.',
    img: '/charm-tassel-pink.png',
    href: '/gallery#charm-clips',
  },
  {
    title: 'Key Chains',
    blurb: 'A playful, whimsical, and elegant addition to your keys',
    img: '/charm-jade.png',
    href: '/gallery#key-chains',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section
        className="relative py-20 px-4"
      >
        <div className="container mx-auto max-w-4xl text-center">
          <div className="mb-8 fade-in flex justify-center">
            <div className="rounded-3xl bg-white px-8 py-6 shadow-lg">
              <Image
                src="/logo.jpg"
                alt="Particular Notions"
                width={440}
                height={340}
                className="max-w-sm"
                style={{ width: '100%', height: 'auto' }}
                priority
              />
            </div>
          </div>
          <p
            className="text-xl md:text-2xl mb-3 fade-in stagger-1 font-brand"
            style={{ color: 'var(--sage-deep)', fontWeight: 500 }}
          >
            Uniquely creative. Individually expressive.
          </p>
          <p
            className="text-lg mb-9 fade-in stagger-2 max-w-2xl mx-auto"
            style={{ color: 'var(--text-light)' }}
          >
            Handmade beaded charms and keychains,<br /> each one
            made with care and meant to be carried every day.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center fade-in stagger-3">
            <Link href="/gallery" className="btn-primary">View Gallery</Link>
            <Link href="/contact" className="btn-gold">Contact Me</Link>
          </div>
        </div>
      </section>

      {/* Why handmade */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12 flex flex-col items-center">
            <span className="eyebrow mb-3">Made by hand</span>
            <h2 className="text-4xl mb-5" style={{ color: 'var(--sage-deep)' }}>
              A little beauty in the everyday
            </h2>
            <div className="divider-sparkle mb-6" />
            <p className="text-lg leading-relaxed max-w-2xl" style={{ color: 'var(--text-light)' }}>
              Particular Notions began with a love of simple things — a handful of
              beads, a quiet afternoon, and the joy of making something one bead at
              a time. Every charm is assembled by hand, so each one is a little
              different.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mt-14">
            {[
              {
                title: 'One of a Kind',
                body: '',
                color: 'var(--sage-deep)',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                ),
              },
              {
                title: 'Made with Care',
                body: '',
                color: 'var(--gold)',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                ),
              },
              {
                title: 'Meant to be Carried',
                body: '',
                color: 'var(--sage-deep)',
                icon: (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                ),
              },
            ].map((card) => (
              <div
                key={card.title}
                className="text-center p-8 rounded-2xl transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: 'var(--cream)' }}
              >
                <div
                  className="w-16 h-16 mx-auto mb-5 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: card.color }}
                >
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {card.icon}
                  </svg>
                </div>
                <h3 className="text-2xl mb-3" style={{ color: 'var(--charcoal)' }}>{card.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-light)' }}>{card.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding text-center" style={{ backgroundColor: 'var(--sage-deep)' }}>
        <div className="container mx-auto max-w-2xl">
          <h2 className="text-6xl text-white mb-5">
            Looking for something{' '}
            <span
              className="relative inline-block italic"
              style={{ color: 'var(--gold-deep)', fontWeight: 800 }}
            >
              particular?
              <svg
                className="absolute left-0 -bottom-1 w-full"
                height="16"
                viewBox="0 0 200 16"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path
                  className="underline-draw"
                  pathLength={1}
                  d="M28 11 C 66 16, 104 4, 140 8 S 182 13, 197 6"
                  stroke="var(--gold-deep)"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
          </h2>
          <p className="text-lg text-white mb-8 opacity-90">
            I take custom orders and love a good recommendation. Tell me
            what you have in mind and I&apos;ll make it by hand.
          </p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:-translate-y-1"
            style={{ backgroundColor: 'white', color: 'var(--sage-deep)', fontFamily: 'var(--font-quicksand), sans-serif' }}
          >
            Start a Custom Order
          </Link>
        </div>
      </section>
    </main>
  );
}
