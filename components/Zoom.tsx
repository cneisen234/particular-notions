'use client';

import { useCallback, useEffect, useState } from 'react';
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
 * Closing has to be bullet-proof on mobile, so:
 *  - The entire backdrop dismisses on tap. Only a tap on the image itself is
 *    ignored, and because the image is sized to its own box (no full-screen
 *    wrapper), the letterbox around it counts as backdrop and dismisses too.
 *  - The backdrop carries `cursor-zoom-out`; iOS Safari only dispatches `click`
 *    on non-button elements that have a pointer cursor, so this is required for
 *    tap-to-close to fire reliably.
 *  - The overlay is sized with dynamic viewport height + safe-area insets so the
 *    close button is never hidden behind the URL / toolbar chrome (which is
 *    expanded right after a refresh or a route change).
 */
export default function Zoom({ src, alt, className = '', style, children }: Props) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    // Preserve whatever the scroll-lock was (e.g. the nav menu) and restore it,
    // rather than blindly clearing it, so the two never stomp each other.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
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
            // h-screen is a fallback; the inline 100dvh wins where supported.
            className="fixed left-0 right-0 top-0 z-[100] h-screen flex items-center justify-center cursor-zoom-out lightbox-in"
            // NOTE: intentionally no backdrop-filter. On Android Chrome a
            // backdrop-filtered, portaled `position: fixed` layer can fail to
            // refresh its hit-test region after the compositing tree is rebuilt
            // (i.e. right after a refresh or a route change) — leaving the
            // overlay visible but unresponsive to taps. The 94%-opaque backdrop
            // reads the same without the blur.
            style={{
              height: '100dvh',
              padding:
                'max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom))',
              backgroundColor: 'rgba(64, 58, 50, 0.94)',
            }}
            onClick={close}
            role="dialog"
            aria-modal="true"
            aria-label={alt}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={close}
              className="absolute right-4 z-[101] w-11 h-11 rounded-full flex items-center justify-center transition-colors cursor-pointer"
              style={{
                top: 'max(1rem, env(safe-area-inset-top))',
                backgroundColor: 'rgba(255,255,255,0.16)',
                color: '#fff',
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* Sized to its own intrinsic box, so only the picture itself blocks
                the dismiss tap — the surrounding dark area always closes. */}
            <Image
              src={src}
              alt={alt}
              width={1400}
              height={1400}
              onClick={(e) => e.stopPropagation()}
              // Base classes are the fallback; the inline values win where the
              // browser understands min()/dvh. Caps at 1024px on desktop while
              // never exceeding the viewport (or its height) on mobile.
              className="w-auto h-auto max-w-full max-h-[85vh] object-contain rounded-lg cursor-default"
              style={{ maxWidth: 'min(100%, 1024px)', maxHeight: '85dvh' }}
              sizes="(max-width: 1024px) 100vw, 1024px"
              priority
            />
          </div>,
          document.body,
        )}
    </>
  );
}
