'use client';

import Script from 'next/script';
import { useState, type FormEvent } from 'react';
import { CONTACT_TOPICS } from '@/lib/contact';

/*
 * The contact form: a reCAPTCHA v3 token is fetched on submit and sent with the
 * fields to /api/contact, which emails the message to Megan. A hidden
 * "company" field catches bots that fill in everything.
 */

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';

type Grecaptcha = {
  ready: (cb: () => void) => void;
  execute: (siteKey: string, opts: { action: string }) => Promise<string>;
};

const inputBase = 'w-full rounded-lg px-3 py-2.5 text-base bg-white focus:outline-none';
const inputStyle = { border: '1px solid var(--border)', color: 'var(--charcoal)' } as const;

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="block text-sm font-semibold mb-1" style={{ color: 'var(--charcoal)' }}>
      {children}
    </span>
  );
}

function getRecaptchaToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const g = (window as Window & { grecaptcha?: Grecaptcha }).grecaptcha;
    if (!g || !RECAPTCHA_SITE_KEY) return reject(new Error('recaptcha-unavailable'));
    g.ready(() => g.execute(RECAPTCHA_SITE_KEY, { action: 'contact' }).then(resolve).catch(reject));
  });
}

export default function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    const fields = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.interest,
      message: data.message,
      company: data.company,
    };
    try {
      let token = '';
      try {
        token = await getRecaptchaToken();
      } catch {
        throw new Error('Spam protection isn’t ready yet. Please refresh and try again.');
      }
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...fields, token }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || 'Something went wrong. Please try again.');
      setStatus('success');
      form.reset();
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="text-center py-10" role="status">
        <div
          className="w-16 h-16 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: 'var(--sage-deep)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </div>
        <h3 className="mt-5 text-3xl" style={{ color: 'var(--charcoal)' }}>Message sent!</h3>
        <p className="mt-3 text-lg" style={{ color: 'var(--text-light)' }}>
          Thanks for reaching out — I&apos;ll get back to you as soon as I can.
        </p>
        <button type="button" onClick={() => setStatus('idle')} className="btn-gold mt-8">
          Send another
        </button>
      </div>
    );
  }

  return (
    <>
      {RECAPTCHA_SITE_KEY && (
        <Script src={`https://www.google.com/recaptcha/api.js?render=${RECAPTCHA_SITE_KEY}`} strategy="afterInteractive" />
      )}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <Label>Name</Label>
            <input name="name" type="text" required autoComplete="name" placeholder="Jane Smith" className={inputBase} style={inputStyle} />
          </label>
          <label className="block">
            <Label>Email</Label>
            <input name="email" type="email" required autoComplete="email" placeholder="you@email.com" className={inputBase} style={inputStyle} />
          </label>
        </div>
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <Label>Phone (optional)</Label>
            <input name="phone" type="tel" autoComplete="tel" placeholder="(555) 123-4567" className={inputBase} style={inputStyle} />
          </label>
          <label className="block">
            <Label>What&apos;s it about?</Label>
            <select name="interest" defaultValue={CONTACT_TOPICS[0]} className={inputBase} style={inputStyle}>
              {CONTACT_TOPICS.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
        <label className="block">
          <Label>Your message</Label>
          <textarea
            name="message"
            required
            rows={5}
            placeholder="How can I help?"
            className={inputBase}
            style={inputStyle}
          />
        </label>

        {/* Bots fill in every field; people never see this one. */}
        <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px', width: 1, height: 1, overflow: 'hidden' }}>
          <label>
            Company
            <input name="company" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        {status === 'error' && (
          <p
            role="alert"
            className="text-sm rounded-xl px-4 py-3"
            style={{ backgroundColor: 'rgba(184, 148, 90, 0.12)', color: 'var(--charcoal)', fontWeight: 600 }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="btn-primary w-full text-center"
          style={status === 'submitting' ? { opacity: 0.7 } : undefined}
        >
          {status === 'submitting' ? 'Sending…' : 'Send message'}
        </button>

        <p className="text-xs text-center" style={{ color: 'var(--text-light)' }}>
          Protected by reCAPTCHA. The Google{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="underline">
            Privacy Policy
          </a>{' '}
          and{' '}
          <a href="https://policies.google.com/terms" target="_blank" rel="noopener noreferrer" className="underline">
            Terms of Service
          </a>{' '}
          apply.
        </p>
      </form>
    </>
  );
}
