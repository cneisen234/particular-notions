import EmailAddress from '@/components/EmailAddress';
import Carousel, { type Slide } from '@/components/Carousel';
import { asc, eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { galleryPhotos } from '@/lib/db/schema';

// The gallery's photos, managed in Pilot Light (shown ones, in their order).
// Read on every visit so a photo she adds or hides shows at once.
export const dynamic = 'force-dynamic';

async function getSlides(): Promise<Slide[]> {
  const rows = await db
    .select({ img: galleryPhotos.imageUrl, alt: galleryPhotos.altText, caption: galleryPhotos.caption })
    .from(galleryPhotos)
    .where(eq(galleryPhotos.visible, true))
    .orderBy(asc(galleryPhotos.sortOrder), asc(galleryPhotos.createdAt));
  return rows;
}

const categories = [
  {
    id: 'word-charms',
    title: 'Word Charms',
    accent: 'var(--sage-deep)',
    intro:
      'Beaded charms that spell out the little words worth keeping close. A simple, meaningful piece to clip where you’ll see it every day.',
  },
  {
    id: 'charm-clips',
    title: 'Charm Clips',
    accent: 'var(--gold-deep)',
    intro:
      'Stone, glass, wood or metal, each beaded combination is unique. Clip one to your keys, a purse, a zipper, whatever you want to!',
  },
  {
    id: 'key-chains',
    title: 'Key Chains',
    accent: 'var(--sage-deep)',
    intro:
      'Add a little swagger to your keys! Playful, colorful, and impossible to lose in the bottom of a bag.',
  },
];

export default async function Gallery() {
  const slides = await getSlides();
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Gallery</h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg max-w-2xl" style={{ color: 'var(--text-light)' }}>
            A gathering of handmade pieces — past and present. Because everything
            is one-of-a-kind, some of these have already found their people, but
            they show the spirit of what I make. Tap any photo for a closer look.
          </p>
        </div>
      </section>

      {/* Carousel (none when every photo is hidden) */}
      {slides.length ? (
        <section className="pb-16 px-4" style={{ backgroundColor: 'var(--white)' }}>
          <div className="container mx-auto pt-14">
            <Carousel slides={slides} />
          </div>
        </section>
      ) : null}

      {/* What I make — the collections, kept as light text sections */}
      <section className="section-padding" style={{ backgroundColor: 'transparent' }}>
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-12 flex flex-col items-center">
            <h2 className="text-4xl mb-5" style={{ color: 'var(--sage-deep)' }}>What I Design</h2>
            <div className="divider-sparkle" />
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {categories.map((c) => (
              <div
                key={c.id}
                id={c.id}
                className="scroll-mt-24 bg-white rounded-2xl shadow-sm p-8 text-center transition-all duration-300 hover:shadow-lg"
              >
                <h3 className="text-3xl mb-4" style={{ color: c.accent }}>{c.title}</h3>
                <p className="leading-relaxed" style={{ color: 'var(--text-light)' }}>{c.intro}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How to get yours */}
      <section className="section-padding" style={{ backgroundColor: 'var(--sage-deep)' }}>
        <div className="container mx-auto max-w-3xl text-center flex flex-col items-center">
          <h2 className="text-5xl mb-4 italic" style={{ color: 'var(--gold-soft)', fontWeight: 700 }}>
            How to get yours
          </h2>
          <p className="text-lg text-white opacity-90 mb-8">
            Find my charms in person at vendor shows and shops around town, or send
            an email to place an order, ask about a piece, or request something custom.
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
        </div>
      </section>
    </main>
  );
}
