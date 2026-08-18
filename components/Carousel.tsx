'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';
import Zoom from './Zoom';
import PhotoFrame from './PhotoFrame';

export type Slide = { img: string; alt: string };

/*
 * Branded photo carousel for the Gallery.
 * Performance: only the first slide loads with `priority`; the rest are lazy
 * and only fetch as they slide into view — far lighter than a grid that pulls
 * every image at once. Click a slide to open the full lightbox (Zoom).
 */
export default function Carousel({ slides }: { slides: Slide[] }) {
  const [active, setActive] = useState(0);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback(
    (dir: number) => setActive((a) => (a + dir + count) % count),
    [count],
  );

  const onTouchStart = (e: React.TouchEvent) => {
    touchX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchX.current;
    if (Math.abs(dx) > 45) go(dx < 0 ? 1 : -1);
    touchX.current = null;
  };

  return (
    <div
      className="relative w-full max-w-3xl mx-auto"
      role="group"
      aria-roledescription="carousel"
      aria-label="Gallery of handmade pieces"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      {/* Frame + arrows */}
      <div className="relative">
        <PhotoFrame>
          <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${active * 100}%)` }}
            >
              {slides.map((s, i) => (
                <div key={s.img} className="min-w-full">
                  <Zoom src={s.img} alt={s.alt} className="block">
                    <div className="relative aspect-[4/3] w-full" style={{ backgroundColor: 'var(--cream)' }}>
                      <Image
                        src={s.img}
                        alt={s.alt}
                        fill
                        className="object-contain"
                        sizes="(max-width: 768px) 100vw, 640px"
                        priority={i === 0}
                        loading={i === 0 ? undefined : 'lazy'}
                      />
                    </div>
                  </Zoom>
                </div>
              ))}
            </div>
          </div>
        </PhotoFrame>

        {/* Arrows */}
        <button
          type="button"
          aria-label="Previous photo"
          onClick={() => go(-1)}
          className="absolute left-1 sm:-left-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--sage-deep)', color: 'white', boxShadow: '0 4px 12px -3px rgba(111,140,120,0.6)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          type="button"
          aria-label="Next photo"
          onClick={() => go(1)}
          className="absolute right-1 sm:-right-4 top-1/2 -translate-y-1/2 z-10 w-11 h-11 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105"
          style={{ backgroundColor: 'var(--sage-deep)', color: 'white', boxShadow: '0 4px 12px -3px rgba(111,140,120,0.6)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dots + counter */}
      <div className="mt-6 flex flex-col items-center gap-3">
        <div className="flex flex-wrap justify-center gap-2">
          {slides.map((s, i) => (
            <button
              key={s.img}
              type="button"
              aria-label={`Go to photo ${i + 1}`}
              aria-current={i === active}
              onClick={() => setActive(i)}
              className="h-2.5 rounded-full cursor-pointer transition-all"
              style={{
                width: i === active ? 22 : 10,
                backgroundColor: i === active ? 'var(--gold-deep)' : 'var(--gold-soft)',
              }}
            />
          ))}
        </div>
        <p className="font-brand text-sm" style={{ color: 'var(--text-light)' }}>
          {active + 1} <span style={{ color: 'var(--gold-deep)' }}>/</span> {count}
        </p>
      </div>
    </div>
  );
}
