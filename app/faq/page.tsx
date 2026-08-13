'use client';

import { useState } from 'react';
import Link from 'next/link';

const faqs = [
  {
    question: 'Are these really handmade?',
    answer:
      'Yes — every single one. I design and assemble each charm and keychain by hand, one bead at a time. Nothing is mass-produced.',
  },
  {
    question: 'Where can I buy your products?',
    answer:
      'Contact me for a list of locations where my items are currently displayed. You can also reach out to me to place a custom order.',
  },
  {
    question: 'What can I clip these to?',
    answer:
      'Anywhere you’d like a little personality — keys, a purse or backpack, a zipper pull, a water bottle, a diaper bag, a lanyard. Each charm has a sturdy clasp made for everyday use.',
  },
  {
    question: 'How do I get in touch?',
    answer:
      'The best way is email — I read every message and am happy to answer questions, take orders, or chat about a custom idea. Head to the Contact page for details.',
  },
];

export default function FAQ() {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      next.has(index) ? next.delete(index) : next.add(index);
      return next;
    });
  };

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4" style={{ background: 'linear-gradient(180deg, var(--cream) 0%, #f1ede1 100%)' }}>
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <span className="eyebrow mb-3">Good to know</span>
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Frequently Asked Questions</h1>
          <div className="divider-sparkle" />
        </div>
      </section>

      {/* List */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-3xl">
          <div className="space-y-4">
            {faqs.map((faq, index) => {
              const open = openItems.has(index);
              return (
                <div key={index} className="rounded-2xl shadow-sm overflow-hidden" style={{ backgroundColor: 'var(--cream)' }}>
                  <button
                    onClick={() => toggle(index)}
                    aria-expanded={open}
                    className="w-full px-6 py-5 text-left flex justify-between items-center cursor-pointer"
                  >
                    <span className="font-brand font-semibold text-lg pr-8" style={{ color: 'var(--charcoal)' }}>
                      {faq.question}
                    </span>
                    <svg
                      className="w-6 h-6 flex-shrink-0 transition-transform duration-300"
                      style={{ color: 'var(--sage-deep)', transform: open ? 'rotate(180deg)' : 'rotate(0)' }}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <div className="overflow-hidden transition-all duration-300" style={{ maxHeight: open ? '500px' : '0' }}>
                    <p className="px-6 pb-5 leading-relaxed" style={{ color: 'var(--text-light)' }}>{faq.answer}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Still curious */}
      <section className="section-padding" style={{ backgroundColor: 'var(--cream)' }}>
        <div className="container mx-auto max-w-2xl text-center flex flex-col items-center">
          <h2 className="text-4xl mb-5" style={{ color: 'var(--sage-deep)' }}>Still curious?</h2>
          <p className="text-lg mb-8" style={{ color: 'var(--text-light)' }}>
            If your question isn&apos;t here, just ask — I am always happy to help.
          </p>
          <Link href="/contact" className="btn-primary">Contact Me</Link>
        </div>
      </section>
    </main>
  );
}
