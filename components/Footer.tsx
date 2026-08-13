import Link from 'next/link';
import EmailAddress from './EmailAddress';

export default function Footer() {
  return (
    <footer className="mt-auto border-t bg-white" style={{ borderColor: 'var(--border)' }}>
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <h3
              className="text-2xl mb-3"
              style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--sage-deep)' }}
            >
              Particular <span style={{ color: 'var(--gold-deep)' }}>Notions</span>
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text-light)' }}>
              Beaded charms, keychains, and little treasures — each one
              made by hand. Uniquely creative, individually expressive.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-brand font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
              Explore
            </h4>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/about', label: 'About Me' },
                { href: '/shop', label: 'Collections' },
                { href: '/gallery', label: 'Gallery' },
                { href: '/faq', label: 'FAQ' },
                { href: '/contact', label: 'Contact & Custom Orders' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:underline" style={{ color: 'var(--text-light)' }}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-brand font-semibold mb-4" style={{ color: 'var(--charcoal)' }}>
              Get in Touch
            </h4>
            <div className="space-y-3 text-sm" style={{ color: 'var(--text-light)' }}>
              <p>
                For orders, custom pieces, and recommendations, reach out any time:
              </p>
              <p>
                <EmailAddress />
              </p>
            </div>
          </div>
        </div>

        <div
          className="pt-8 border-t text-center text-sm flex flex-col sm:flex-row sm:justify-between items-center gap-2"
          style={{ borderColor: 'var(--border)', color: 'var(--text-light)' }}
        >
          <p>&copy; {new Date().getFullYear()} Particular Notions. Handmade with love by Megan.</p>
          <p className="text-xs" style={{ color: 'var(--text-light)' }}>
            Website by{' '}
            <a
              href="https://www.kindlingdigital.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:underline"
              style={{ color: 'var(--sage-deep)' }}
            >
              Kindling Digital
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
