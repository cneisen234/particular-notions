'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import EmailAddress from './EmailAddress';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/shop', label: 'Collections' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/faq', label: 'FAQ' },
];

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  // Subtle backdrop blur once the page is scrolled
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Lock body scroll while the full-screen menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  return (
    <>
      <nav
        className="sticky top-0 z-50 transition-all"
        style={{
          backgroundColor: scrolled ? 'rgba(248, 244, 235, 0.85)' : 'var(--white)',
          backdropFilter: scrolled ? 'blur(12px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(12px)' : 'none',
          borderBottom: `1px solid ${scrolled ? 'var(--border)' : 'transparent'}`,
        }}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            {/* Brand */}
            <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
              <Image
                src="/logo.jpg"
                alt="Particular Notions"
                width={52}
                height={52}
                className="rounded-full object-cover"
                style={{ boxShadow: '0 1px 6px rgba(0,0,0,0.08)' }}
                priority
              />
              <span
                className="text-2xl leading-none"
                style={{ fontFamily: 'var(--font-cormorant), serif', color: 'var(--sage-deep)' }}
              >
                Particular <span style={{ color: 'var(--gold-deep)' }}>Notions</span>
              </span>
            </Link>

            {/* Desktop links */}
            <ul className="hidden md:flex items-center gap-1 font-brand text-sm" style={{ fontWeight: 600 }}>
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="relative px-4 py-2 transition-colors hover:opacity-70"
                      style={{ color: active ? 'var(--gold-deep)' : 'var(--charcoal)' }}
                    >
                      {l.label}
                      <span
                        className="absolute left-1/2 -translate-x-1/2 bottom-0 w-1 h-1 rounded-full transition-opacity"
                        style={{ backgroundColor: 'var(--gold-deep)', opacity: active ? 1 : 0 }}
                      />
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Hamburger — mobile */}
            <button
              className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-full transition-colors"
              style={{ backgroundColor: isOpen ? 'var(--sage-deep)' : 'rgba(156, 181, 163, 0.18)' }}
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={isOpen}
            >
              <div className="relative w-5 h-4 flex flex-col justify-between">
                <span
                  className="block h-0.5 w-full transition-all origin-center"
                  style={{
                    backgroundColor: isOpen ? 'var(--cream)' : 'var(--charcoal)',
                    transform: isOpen ? 'rotate(45deg) translate(4px, 5px)' : 'none',
                  }}
                />
                <span
                  className="block h-0.5 w-full transition-all"
                  style={{ backgroundColor: isOpen ? 'var(--cream)' : 'var(--charcoal)', opacity: isOpen ? 0 : 1 }}
                />
                <span
                  className="block h-0.5 w-full transition-all origin-center"
                  style={{
                    backgroundColor: isOpen ? 'var(--cream)' : 'var(--charcoal)',
                    transform: isOpen ? 'rotate(-45deg) translate(4px, -5px)' : 'none',
                  }}
                />
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Full-screen mobile overlay */}
      <div
        className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        style={{ backgroundColor: 'var(--sage-deep)' }}
      >
        {/* Ambient gold glow */}
        <div
          className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full opacity-25 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--gold) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }}
        />
        <div
          className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{ background: 'radial-gradient(circle, var(--sage-soft) 0%, transparent 70%)', transform: 'translate(-30%, 30%)' }}
        />

        <div className="relative h-full flex flex-col pt-24 pb-12 px-8">
          <nav className="flex-1 flex flex-col justify-center">
            <ul className="space-y-1">
              {links.map((l, idx) => {
                const active = pathname === l.href;
                return (
                  <li key={l.href} className={isOpen ? 'fade-in-up' : ''} style={{ animationDelay: `${idx * 60}ms` }}>
                    <Link href={l.href} onClick={() => setIsOpen(false)} className="group flex items-baseline py-2.5">
                      <span
                        className="text-5xl transition-colors"
                        style={{
                          fontFamily: 'var(--font-cormorant), serif',
                          color: active ? 'var(--gold-soft)' : 'var(--cream)',
                          fontStyle: active ? 'italic' : 'normal',
                        }}
                      >
                        {l.label}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Bottom CTA + email */}
          <div className="pt-8" style={{ borderTop: '1px solid rgba(231, 214, 173, 0.25)' }}>
            <Link
              href="/contact"
              onClick={() => setIsOpen(false)}
              className="flex items-center justify-center w-full px-6 py-4 rounded-full font-semibold text-lg transition-all"
              style={{ backgroundColor: 'var(--cream)', color: 'var(--sage-deep)', fontFamily: 'var(--font-quicksand), sans-serif' }}
            >
              Contact Me
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
