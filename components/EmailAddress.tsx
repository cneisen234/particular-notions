'use client';

import { useState } from 'react';

/*
 * Bot-resistant email. The address is never written as a literal string or a
 * mailto: link in the rendered HTML — it's assembled from parts at runtime and
 * offered as click-to-copy, so scrapers crawling the static source come up empty.
 */
const USER = 'particularnotions';
const DOMAIN = ['gmail', 'com'];

type Props = {
  /** 'link' = inline sage text (footer), 'button' = pill button (contact/CTAs) */
  variant?: 'link' | 'button';
  /** true when placed on a dark/sage background (e.g. the nav overlay) */
  onDark?: boolean;
  className?: string;
};

export default function EmailAddress({ variant = 'link', onDark = false, className = '' }: Props) {
  const [copied, setCopied] = useState(false);
  const address = `${USER}@${DOMAIN.join('.')}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (variant === 'button') {
    return (
      <button
        onClick={copy}
        className={`btn-primary inline-flex items-center justify-center gap-2 max-w-full break-all text-center leading-tight ${className}`}
        aria-label="Copy email address"
      >
        {copied ? 'Copied to clipboard!' : `${USER}@${DOMAIN.join('.')}`}
      </button>
    );
  }

  return (
    <button
      onClick={copy}
      className={`inline-flex flex-wrap items-center gap-x-1.5 gap-y-0.5 max-w-full break-all text-left font-semibold hover:underline ${className}`}
      style={{ color: onDark ? 'var(--cream)' : 'var(--sage-deep)' }}
      aria-label="Copy email address"
    >
      <span className="break-all">{`${USER}@${DOMAIN.join('.')}`}</span>
      <span className="text-xs" style={{ color: onDark ? 'var(--gold-soft)' : 'var(--text-light)' }}>
        {copied ? '(copied!)' : '(click to copy)'}
      </span>
    </button>
  );
}
