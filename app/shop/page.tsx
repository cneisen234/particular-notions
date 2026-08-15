import Image from 'next/image';
import Link from 'next/link';
import EmailAddress from '@/components/EmailAddress';
import Zoom from '@/components/Zoom';

type Piece = { img: string; name: string };

const sections: {
  id: string;
  title: string;
  intro: string;
  accent: string;
  pieces: Piece[];
}[] = [
  {
    id: 'word-charms',
    title: 'Word Charms',
    accent: 'var(--sage-deep)',
    intro:
      'Beaded charms that spell out the little words worth keeping close. A simple, meaningful piece to clip where you’ll see it every day.',
    pieces: [
      { img: '/word-charms-wall.png', name: '' },
    ],
  },
  {
    id: 'charm-clips',
    title: 'Charm Clips',
    accent: 'var(--gold-deep)',
    intro:
      'Stone, glass, wood or metal, each beaded combination is unique. Clip one to your keys, a purse, a zipper, whatever you want to!',
    pieces: [
      { img: '/charm-agate.png', name: '' },
      { img: '/charm-disc.png', name: '' },
      { img: '/charm-wood.png', name: '' },
      { img: '/charm-tassel-pink.png', name: '' },
    ],
  },
  {
    id: 'key-chains',
    title: 'Key Chains',
    accent: 'var(--sage-deep)',
    intro:
      'Add a little swagger to your keys! Playful, colorful, and impossible to lose in the bottom of a bag.',
    pieces: [
      { img: '/charm-jade.png', name: '' },
      { img: '/charm-white-green.png', name: '' },
      { img: '/charm-fish.png', name: '' },
      { img: '/charm-floral.png', name: '' },
    ],
  },
];

export default function Shop() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <span className="eyebrow mb-3">The collections</span>
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>View Collections</h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg max-w-2xl" style={{ color: 'var(--text-light)' }}>
            A look at the handmade charms and keychains. Everything is one-of-a-kind —
            when you see something you love, reach out and I will help you claim it.
          </p>
        </div>
      </section>

      {/* Category quick-nav */}
      <section className="py-8 px-4 border-b" style={{ backgroundColor: 'var(--white)', borderColor: 'var(--border)' }}>
        <div className="container mx-auto max-w-4xl flex flex-wrap justify-center gap-3">
          {sections.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="font-brand text-sm px-4 py-2 rounded-full transition-colors"
              style={{ backgroundColor: 'var(--cream)', color: 'var(--charcoal)', fontWeight: 600 }}
            >
              {s.title}
            </a>
          ))}
        </div>
      </section>

      {/* Sections */}
      {sections.map((s, i) => (
        <section
          key={s.id}
          id={s.id}
          className="section-padding scroll-mt-24"
          style={{ backgroundColor: i % 2 === 0 ? 'var(--white)' : 'transparent' }}
        >
          <div className="container mx-auto max-w-5xl">
            <div className="max-w-2xl mb-10">
              <h2 className="text-4xl mb-4" style={{ color: s.accent }}>{s.title}</h2>
              <p className="text-lg leading-relaxed" style={{ color: 'var(--text-light)' }}>{s.intro}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {s.pieces.map((p) => (
                <figure key={p.img} className="group">
                  <Zoom
                    src={p.img}
                    alt={p.name || s.title}
                    className="relative block aspect-square overflow-hidden rounded-2xl shadow-sm transition-all duration-300 group-hover:shadow-lg"
                    style={{ backgroundColor: 'var(--cream)' }}
                  >
                    <Image
                      src={p.img}
                      alt={p.name || s.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                  </Zoom>
                  <figcaption className="mt-3 text-sm text-center" style={{ color: 'var(--text-light)' }}>
                    {p.name}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* How to buy */}
      <section className="section-padding" style={{ backgroundColor: 'var(--sage-deep)' }}>
        <div className="container mx-auto max-w-3xl text-center">
          <h2 className="text-6xl relative inline-block italic mb-4"
              style={{ color: 'var(--gold-deep)', fontWeight: 800 }}>How to get yours</h2>
          <p className="text-lg text-white opacity-90 mb-8">
            Find my charms in person at vendor shows and
            shops around town, or send an email to place an order, ask about a
            piece, or request something custom.
          </p>
          <div className="inline-block max-w-full rounded-2xl bg-white px-6 sm:px-8 py-7 shadow-lg">
            <p className="font-brand mb-3" style={{ color: 'var(--charcoal)', fontWeight: 600 }}>
              Email to order or ask a question
            </p>
            <EmailAddress variant="button" />
            <p className="text-sm mt-4" style={{ color: 'var(--text-light)' }}>
              Custom orders &amp; recommendations always welcome.
            </p>
          </div>
          <div className="mt-8">
            <Link href="/gallery" className="font-brand text-white underline underline-offset-4 hover:opacity-80">
              Or browse the full gallery →
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
