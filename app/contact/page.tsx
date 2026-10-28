import Link from 'next/link';
import ContactForm from '@/components/ContactForm';
import EmailAddress from '@/components/EmailAddress';
import { joinList } from '@/lib/fulfillment';
import { getShopConfig } from '@/lib/shop';

// The pickup and delivery towns come from the shop's settings on every visit.
export const dynamic = 'force-dynamic';

export default async function Contact() {
  const config = await getShopConfig();
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Get in Touch</h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg max-w-2xl" style={{ color: 'var(--text-light)' }}>
            Questions about an order, pickup, or delivery — I read every
            message.
          </p>
        </div>
      </section>

      {/* Contact form */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)', paddingBottom: 0 }}>
        <div className="container mx-auto max-w-4xl">
          <div className="relative bg-white rounded-2xl shadow-sm p-8 md:p-10" style={{ border: '1px solid var(--border)' }}>
            <h2 className="text-3xl mb-2" style={{ color: 'var(--charcoal)' }}>Send a message</h2>
            <p className="text-lg leading-relaxed mb-8" style={{ color: 'var(--text-light)' }}>
              Ask about an order, pickup, or delivery, and I&apos;ll get back to you.
            </p>
            <ContactForm />
          </div>
        </div>
      </section>

      {/* Contact cards */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-4xl grid md:grid-cols-2 gap-8">
          {/* Email */}
          <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col" style={{ border: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--sage-deep)' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h2 className="text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Email</h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-light)' }}>
              The best way to reach me with questions about your order. Click
              below to copy the address.
            </p>
            <div className="mt-auto">
              <EmailAddress variant="button" />
            </div>
          </div>

          {/* In person */}
          <div className="bg-white rounded-2xl shadow-sm p-8 flex flex-col" style={{ border: '1px solid var(--border)' }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: 'var(--gold)' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <h2 className="text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Pickup &amp; Delivery</h2>
            <p className="text-lg leading-relaxed mb-6" style={{ color: 'var(--text-light)' }}>
              Every order is baked fresh, then ready for pickup in {config.pickup.city} or
              local delivery to {joinList(config.delivery.cities)}. Order online and
              choose what works for you.
            </p>
            <div className="mt-auto">
              <Link href="/order" className="btn-primary">Order Online</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Where to next */}
      <section className="section-padding text-center bakery-bg">
        <div className="container mx-auto max-w-2xl flex flex-col items-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/faq" className="btn-primary">Read the FAQ</Link>
            <Link href="/about" className="btn-gold">Meet Megan</Link>
          </div>
        </div>
      </section>
    </main>
  );
}
