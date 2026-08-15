import Image from 'next/image';
import Link from 'next/link';
import Zoom from '@/components/Zoom';

export default function About() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <span className="eyebrow mb-3">The maker</span>
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Meet Megan</h1>
          <div className="divider-sparkle" />
        </div>
      </section>

      {/* Bio */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
            <div className="order-2 md:order-1">
              <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--text-light)' }}>
                <p>
                  Hi, I&apos;m Megan!
                </p>
                <p>
                  I&apos;ve always been drawn to the beauty in simple things. There&apos;s a
                  quiet kind of joy in sitting down with a handful of beads and a
                  clasp and turning them into something small enough to carry, yet
                  special enough to notice. For me, making these pieces is
                  creative expression at its most honest — no rush, no rules, just
                  the pleasure of putting colors and textures together until
                  something feels right.
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <Zoom src="/megan.png" alt="Megan, maker of Particular Notions" className="block w-full max-w-sm">
                <Image
                  src="/megan.png"
                  alt="Megan, maker of Particular Notions"
                  width={460}
                  height={560}
                  className="rounded-2xl shadow-xl w-full h-auto object-cover"
                />
              </Zoom>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="flex justify-center">
              <Zoom src="/display-stand.png" alt="A display of handmade Particular Notions charms" className="block w-full max-w-sm">
                <Image
                  src="/display-stand.png"
                  alt="A display of handmade Particular Notions charms"
                  width={460}
                  height={560}
                  className="rounded-2xl shadow-xl w-full h-auto object-cover"
                />
              </Zoom>
            </div>
            <div>
              <h2 className="text-3xl mb-6" style={{ color: 'var(--charcoal)' }}>
                Why &ldquo;Particular Notions&rdquo;
              </h2>
              <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--text-light)' }}>
                <p>
                  Being uniquely
                  creative and individually expressive is something worth
                  celebrating. Each piece I make starts as a small idea, a "notion" if you will, and I am intentional about the execution.
                </p>
                <p>
                  Because each one is handmade, no two are ever quite the same.
                  That&apos;s the whole point. When you pick one, you&apos;re choosing the
                  one made just a little differently from all the rest.
                </p>
                <p>
                  If you have something particular in mind, I&apos;d love to make it for
                  you!
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* CTA */}
      <section className="section-padding text-center" style={{ backgroundColor: 'var(--sage-deep)' }}>
        <div className="container mx-auto max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/shop" className="inline-block px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: 'white', color: 'var(--sage-deep)', fontFamily: 'var(--font-quicksand), sans-serif' }}>
              View Collections
            </Link>
            <Link href="/contact" className="inline-block px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:-translate-y-1" style={{ backgroundColor: 'var(--gold)', color: 'white', fontFamily: 'var(--font-quicksand), sans-serif' }}>
              Contact Megan
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
