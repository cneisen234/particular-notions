import Image from 'next/image';
import Link from 'next/link';
import Zoom from '@/components/Zoom';

const gallery = [
  { img: '/display-stand.webp', alt: 'A stand of handmade charm clips on kraft cards' },
  { img: '/word-charms.jpg', alt: 'Word charms spelling LOVE, JOY, PEACE, HOPE and PRAY' },
  { img: '/charm-agate.jpg', alt: 'Frosted agate bead charm with a gold leaf' },
  { img: '/charm-tassel-blue.jpg', alt: 'Sky-blue tassel charm with a pearl drop' },
  { img: '/display-tree.jpg', alt: 'A gold display tree hung with beaded charms' },
  { img: '/charm-disc.jpg', alt: 'Charm of stacked slate discs with red accents' },
  { img: '/charm-butterfly.webp', alt: 'Mint glass charm with a gilded butterfly' },
  { img: '/word-charms-wall.jpg', alt: 'A wall display of word charms' },
  { img: '/charm-wood.jpg', alt: 'Peach wood bead charm with knotted cord' },
  { img: '/charm-floral.webp', alt: 'Frosted floral bead charm with a pink tassel' },
  { img: '/charm-white-green.webp', alt: 'White swirl bead charm with a green tassel' },
  { img: '/charm-tassel-pink.jpg', alt: 'Rose tassel charm with a gilded bead' },
  { img: '/charm-fish.webp', alt: 'Playful little fish-in-a-bag charm' },
];

export default function Gallery() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, var(--cream) 0%, #f1ede1 100%)' }}>
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <span className="eyebrow mb-3">A closer look</span>
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Gallery</h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg max-w-2xl" style={{ color: 'var(--text-light)' }}>
            A gathering of handmade pieces — past and present. Because everything
            is one-of-a-kind, some of these have already found their people, but
            they show the spirit of what I make.
          </p>
        </div>
      </section>

      {/* Masonry grid */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-6xl">
          <div className="columns-2 md:columns-3 lg:columns-4 gap-5 [column-fill:_balance]">
            {gallery.map((g) => (
              <Zoom
                key={g.img}
                src={g.img}
                alt={g.alt}
                className="group mb-5 block break-inside-avoid overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:shadow-lg"
                style={{ backgroundColor: 'var(--cream)' }}
              >
                <Image
                  src={g.img}
                  alt={g.alt}
                  width={500}
                  height={640}
                  className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              </Zoom>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding text-center" style={{ backgroundColor: 'var(--cream)' }}>
        <div className="container mx-auto max-w-2xl flex flex-col items-center">
          <span className="eyebrow mb-3">See one you like?</span>
          <h2 className="text-4xl mb-5" style={{ color: 'var(--sage-deep)' }}>
            Let&apos;s find yours
          </h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-light)' }}>
            Reach out about a custom piece made
            just for you.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="btn-primary">View Collections</Link>
            <Link href="/contact" className="btn-gold">Contact Megan</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
