import Link from 'next/link';
import EmailAddress from '@/components/EmailAddress';

export default function Contact() {
  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <span className="eyebrow mb-3">Say hello</span>
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Get in Touch</h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg max-w-2xl" style={{ color: 'var(--text-light)' }}>
            Questions, orders, custom ideas, or just a recommendation you&apos;d love to
            see made — I read every message.
          </p>
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
              The best way to reach me for orders, custom pieces, and
              recommendations. Click below to copy the address.
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
            <h2 className="text-3xl mb-3" style={{ color: 'var(--charcoal)' }}>Find Me in Person</h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--text-light)' }}>
              Particular Notions pops up at vendor shows and in shops around town,
              where you can see the pieces up close and pick your favorite. Email
              to ask where I will be next.
            </p>
          </div>
        </div>
      </section>

      {/* Where to next */}
      <section className="section-padding text-center" style={{ backgroundColor: 'var(--sage-deep)' }}>
        <div className="container mx-auto max-w-2xl flex flex-col items-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/shop"
              className="inline-block px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: 'white', color: 'var(--sage-deep)', fontFamily: 'var(--font-quicksand), sans-serif' }}
            >
              View Collections
            </Link>
            <Link
              href="/gallery"
              className="inline-block px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 hover:-translate-y-1"
              style={{ backgroundColor: 'var(--gold)', color: 'white', fontFamily: 'var(--font-quicksand), sans-serif' }}
            >
              Browse the Gallery
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
