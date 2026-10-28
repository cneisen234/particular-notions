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
      question: 'Is everything made by hand?',
      answer:
        'Yes — every single bake. I mix, fold, shape and bake each order by hand in small batches. Nothing is mass-produced.',
    },
    {
      question: 'How do I order?',
      answer:
        `Head to the Order page, add what you’d like, and check out. Orders placed before the daily cutoff are ready the next day — pickup in ${config.pickup.city}, or local delivery to ${joinList(config.delivery.cities)}${config.freeDeliveryThresholdCents > 0 ? ` (free on orders ${formatCents(config.freeDeliveryThresholdCents).replace(/\.00$/, '')} and up)` : ''}. ${payWords(config)}`,
    },
    {
      question: 'Why do loaves take an extra day?',
      answer:
        'Sourdough can’t be rushed. Each loaf needs time to rise and develop flavor before it’s baked, so loaves are ready a day later than the other bakes.',
    },
    {
      question: 'How should I store my bread?',
      answer:
        'Keep it at room temperature in a bread bag or wrapped in a towel for a few days. For longer, slice it and freeze it — toast slices straight from the freezer.',
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
