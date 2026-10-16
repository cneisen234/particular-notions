'use client';

import { useState } from 'react';

export type Faq = { question: string; answer: string };

/** The FAQ's questions, each opening to its answer. */
export default function FaqList({ faqs }: { faqs: Faq[] }) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
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
  );
}
