"use client";

import { useState } from "react";
import { isOrderable, type Product } from "@/lib/inventory";
import { formatCents } from "@/lib/money";
import { useCart } from "./CartProvider";

/** Product photo with a graceful sage placeholder if the image is missing. */
function ProductImage({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false);
  const showPlaceholder = !product.imageUrl || failed;

  return (
    <div
      className="relative w-full aspect-square overflow-hidden"
      style={{ backgroundColor: "var(--sage-soft)" }}
    >
      {showPlaceholder ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            viewBox="0 0 64 64"
            width="72"
            height="72"
            fill="none"
            stroke="var(--sage-deep)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ opacity: 0.7 }}
            aria-hidden="true"
          >
            {/* Loaf of bread */}
            <path d="M12 34c0-8.8 9-15 20-15s20 6.2 20 15c0 1.9-1.6 3-3.6 3H15.6C13.6 37 12 35.9 12 34Z" />
            <path d="M15 37v10.5C15 50 17 52 19.5 52h25c2.5 0 4.5-2 4.5-4.5V37" />
            <path d="M26 25l-3 7M36 24l-3 8M46 25l-3 7" />
          </svg>
        </div>
      ) : (
        // Plain <img> (not next/image) keeps placeholders forgiving while photos
        // are still being added; swap-in real files under /public/store/.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.imageUrl}
          alt={product.name}
          className="absolute inset-0 w-full h-full object-contain p-3"
          onError={() => setFailed(true)}
          loading="lazy"
        />
      )}
    </div>
  );
}

export default function ProductCard({ product }: { product: Product }) {
  const { enriched, add, setQty } = useCart();
  const orderable = isOrderable(product);
  const inCart = enriched.find((i) => i.productId === product.id)?.qty ?? 0;
  const atLimit = inCart >= product.dailyLimit;

  return (
    <div
      className="flex flex-col rounded-2xl overflow-hidden bg-white shadow-sm transition-all"
      style={{ border: "1px solid var(--border)", opacity: orderable ? 1 : 0.6 }}
    >
      <div className="relative">
        <ProductImage product={product} />
        {!orderable && (
          <span
            className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold text-white"
            style={{ backgroundColor: "var(--charcoal)", fontFamily: "var(--font-quicksand), sans-serif" }}
          >
            Sold out
          </span>
        )}
      </div>

      <div className="flex flex-col flex-1 p-5">
        <h3 className="text-xl mb-1" style={{ color: "var(--charcoal)" }}>
          {product.name}
        </h3>
        <p className="text-sm leading-relaxed mb-4 flex-1" style={{ color: "var(--text-light)" }}>
          {product.description}
        </p>

        <div className="flex items-center justify-between mt-auto">
          <span
            className="text-lg font-semibold"
            style={{ fontFamily: "var(--font-quicksand), sans-serif", color: "var(--sage-deep)" }}
          >
            {formatCents(product.priceCents)}
          </span>

          {!orderable ? (
            <span className="text-sm" style={{ color: "var(--text-light)" }}>
              Unavailable
            </span>
          ) : inCart === 0 ? (
            <button
              onClick={() => add(product.id)}
              className="btn-primary"
              style={{ padding: "0.55rem 1.4rem", fontSize: "0.95rem" }}
            >
              Add
            </button>
          ) : (
            <div
              className="flex items-center gap-3 rounded-full px-2 py-1"
              style={{ border: "1px solid var(--border)", backgroundColor: "var(--cream)" }}
            >
              <button
                onClick={() => setQty(product.id, inCart - 1)}
                aria-label={`Remove one ${product.name}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none transition-colors"
                style={{ color: "var(--sage-deep)" }}
              >
                −
              </button>
              <span className="w-5 text-center font-semibold" style={{ color: "var(--charcoal)" }}>
                {inCart}
              </span>
              <button
                onClick={() => add(product.id)}
                disabled={atLimit}
                aria-label={`Add one ${product.name}`}
                className="w-8 h-8 rounded-full flex items-center justify-center text-lg leading-none transition-colors"
                style={{ color: atLimit ? "var(--border)" : "var(--sage-deep)", cursor: atLimit ? "not-allowed" : "pointer" }}
              >
                +
              </button>
            </div>
          )}
        </div>

        {orderable && atLimit && (
          <p className="text-xs mt-2 text-right" style={{ color: "var(--gold-deep)" }}>
            That&apos;s all we have today
          </p>
        )}
      </div>
    </div>
  );
}
