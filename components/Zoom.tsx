'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';

type Props = {
  src: string;
  alt: string;
  /** classes applied to the clickable thumbnail wrapper */
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
};

/*
 * Click-to-zoom lightbox. The thumbnail (children) stays exactly as the page
 * laid it out; clicking it opens a full-viewport overlay rendered into <body>
 * via a portal, so it escapes any parent overflow/stacking context.
 *
 * Desktop: image is centered and contained within a comfortable max size.
 * Mobile:  image fills nearly the whole screen.
 * Close:   the X button, the backdrop, or the Esc key.
 */
export default function Zoom({ src, alt, className = '', style, children }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        aria-label={`View larger: ${alt}`}
        className={`cursor-zoom-in ${className}`}
        style={style}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        {children}
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-10 lightbox-in"
            style={{
              backgroundColor: 'rgba(64, 58, 50, 0.92)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
            onClick={() => setOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 w-11 h-11 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: 'rgba(255,255,255,0.16)', color: '#fff' }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Stop clicks on the image from closing the overlay */}
            <div
              className="relative w-full h-full max-w-5xl max-h-[85vh] cursor-default"
              onClick={(e) => e.stopPropagation()}
            >
              <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 1024px) 100vw, 1024px" priority />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
