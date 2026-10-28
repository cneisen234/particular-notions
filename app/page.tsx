import Link from 'next/link';
import Image from 'next/image';
import { getShopConfig } from '@/lib/shop';

// The pickup town comes from the shop's settings on every visit.
export const dynamic = 'force-dynamic';

export default async function Home() {
  const config = await getShopConfig();
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
                src="/logo-megans-sourdough.jpg"
                alt="Megan’s Sourdough"
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
            Fresh sourdough, baked to order.
          </p>
          <p
            className="text-lg fade-in stagger-2 max-w-2xl mx-auto"
            style={{ color: 'var(--text-light)' }}
          >
            Naturally leavened loaves and sourdough bakes,<br /> made by
            hand in small batches and baked fresh for your table.
          </p>
        </div>
      </section>

      {/* Ordering */}
      <section className="py-16 px-4" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-4xl">
          <div
            className="rounded-3xl p-10 md:p-14 text-center flex flex-col items-center bakery-bg shadow-sm"
            style={{ border: '1px solid var(--border)' }}
          >
            <span className="eyebrow mb-3">Fresh from the kitchen</span>
            <h2 className="text-4xl mb-5" style={{ color: 'var(--sage-deep)' }}>
              Now taking orders
            </h2>
            <div className="divider-sparkle mb-6" />
            <p className="text-lg leading-relaxed max-w-2xl mb-8" style={{ color: 'var(--text-light)' }}>
              Sandwich loaves, scones, cookies and more, made fresh to order. Order today for
              next-day pickup in {config.pickup.city} or local delivery — pay by card, or cash at
              pickup/delivery.
            </p>
            <Link href="/order" className="btn-primary">Order Online</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
