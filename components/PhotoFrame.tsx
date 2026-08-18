import React from 'react';

/*
 * Branded photo frame for Particular Notions.
 * A cream mat with a double gold border, soft sage shadow, corner sparkles,
 * and a small sage sprig emblem at the top — all pulled from the logo motifs.
 */

function Sprig() {
  return (
    <svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true">
      <path d="M24 42 C24 30 24 18 24 8" fill="none" stroke="var(--sage)" strokeWidth="1.6" strokeLinecap="round" />
      <g fill="var(--sage)">
        <ellipse cx="16" cy="30" rx="6" ry="2.9" transform="rotate(-35 16 30)" />
        <ellipse cx="32" cy="25" rx="6" ry="2.9" transform="rotate(35 32 25)" />
        <ellipse cx="17" cy="20" rx="5" ry="2.5" transform="rotate(-35 17 20)" />
        <ellipse cx="31" cy="15" rx="5" ry="2.5" transform="rotate(35 31 15)" />
        <ellipse cx="24" cy="9" rx="3.2" ry="2.1" />
      </g>
    </svg>
  );
}

function Sparkle({ className, size = 14 }: { className: string; size?: number }) {
  return (
    <span
      className={`absolute select-none pointer-events-none leading-none ${className}`}
      style={{ color: 'var(--gold)', fontSize: size }}
      aria-hidden="true"
    >
      ✦
    </span>
  );
}

export default function PhotoFrame({
  children,
  className = '',
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      {/* Mat */}
      <div
        className="relative rounded-[28px] p-2.5 sm:p-3"
        style={{
          background: 'linear-gradient(150deg, #ffffff 0%, var(--cream) 100%)',
          border: '1px solid var(--gold-soft)',
          boxShadow: '0 22px 45px -22px rgba(111, 140, 120, 0.55)',
        }}
      >
        {/* Photo, clipped, with an inner gold hairline */}
        <div
          className="overflow-hidden rounded-[20px]"
          style={{ boxShadow: 'inset 0 0 0 1.5px var(--gold)' }}
        >
          {children}
        </div>
      </div>

      {/* Sprig emblem crowning the top */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -top-4 flex items-center justify-center rounded-full"
        style={{
          width: 40,
          height: 40,
          backgroundColor: 'var(--cream)',
          border: '1px solid var(--gold-soft)',
          boxShadow: '0 4px 10px -4px rgba(111, 140, 120, 0.5)',
        }}
      >
        <Sprig />
      </div>

      {/* Corner sparkles, varied sizes like the logo scatter */}
      <Sparkle className="-bottom-2 -left-2" size={16} />
      <Sparkle className="-bottom-1 right-3" size={10} />
      <Sparkle className="top-6 -right-2.5" size={13} />
    </div>
  );
}
