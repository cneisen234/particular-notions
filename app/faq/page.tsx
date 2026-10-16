import Link from 'next/link';
import FaqList, { type Faq } from '@/components/FaqList';
import { joinList } from '@/lib/fulfillment';
import { formatCents } from '@/lib/money';
import { getShopConfig } from '@/lib/shop';
import type { ShopConfig } from '@/lib/shop-config';

// The wording lives here; the facts in it (pickup town, delivery towns, the
// free-delivery amount) come from the shop's settings, so they never drift.
function faqs(config: ShopConfig): Faq[] {
  return [
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
      question: 'How do I order sourdough online?',
      answer:
        `Head to the Order page, add what you’d like, and check out. Orders placed before the daily cutoff are ready the next day — pickup in ${config.pickup.city}, or local delivery to ${joinList(config.delivery.cities)}${config.freeDeliveryThresholdCents > 0 ? ` (free on orders ${formatCents(config.freeDeliveryThresholdCents).replace(/\.00$/, '')} and up)` : ''}. ${payWords(config)}`,
    },
    {
      question: 'What can I clip these to?',
      answer:
        'Anywhere you’d like a little personality — keys, a purse or backpack, a zipper pull, a water bottle, a diaper bag, a lanyard. Each charm has a sturdy clasp made for everyday use.',
    },
    {
      question: 'How do I get in touch?',
      answer:
        'The best way is email. I read every message and am happy to answer questions, take orders, or chat about a custom idea. Head to the Contact page for details.',
    },
  ];
}

function payWords(config: ShopConfig): string {
  if (config.payments.card && config.payments.cash) return 'Pay securely by card, or choose cash at pickup/delivery.';
  if (config.payments.card) return 'Pay securely by card.';
  return 'Pay with cash at pickup/delivery.';
}

// The facts come from the database on every visit.
export const dynamic = 'force-dynamic';

export default async function FAQ() {
  const config = await getShopConfig();

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <h1 className="text-5xl mb-5" style={{ color: 'var(--sage-deep)' }}>Frequently Asked Questions</h1>
          <div className="divider-sparkle" />
        </div>
      </section>

      {/* List */}
      <section className="section-padding" style={{ backgroundColor: 'var(--white)' }}>
        <div className="container mx-auto max-w-3xl">
          <FaqList faqs={faqs(config)} />
        </div>
      </section>

      {/* Still curious */}
      <section className="section-padding">
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
