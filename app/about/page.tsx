import Image from 'next/image';
import Link from 'next/link';
import Zoom from '@/components/Zoom';
import PhotoFrame from '@/components/PhotoFrame';

export default function About() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Meet Megan</h1>
          <div className="divider-sparkle" />
        </div>
      </section>

      {/* Bio */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <div className="space-y-4 text-lg leading-relaxed" style={{ color: 'var(--text-light)' }}>
                <p>Hi, I&apos;m Megan!</p>
                <p>
                  I love serving my community in simple ways, and baking is one of
                  my favorites. Sharing a fresh loaf with a neighbor is about as
                  simple and as good as it gets.
                </p>
                <p>
                  I bake sourdough at home: sandwich loaves, scones and cookies,
                  all made by hand in small batches.
                </p>
                <p>
                  Everything is baked to order, so it&apos;s fresh when you pick it
                  up or I drop it off.
                </p>
              </div>
            </div>
            <div className="order-1 md:order-2 flex justify-center">
              <PhotoFrame className="w-full max-w-sm">
                <Zoom src="/megan.webp" alt="Megan, the baker behind Megan’s Sourdough" className="block">
                  <Image
                    src="/megan.webp"
                    alt="Megan, the baker behind Megan’s Sourdough"
                    width={460}
                    height={560}
                    className="w-full h-auto object-cover"
                  />
                </Zoom>
              </PhotoFrame>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section-padding text-center bakery-bg">
        <div className="container mx-auto max-w-2xl">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/order" className="btn-primary">Order Online</Link>
            <Link href="/contact" className="btn-gold">Contact Megan</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
