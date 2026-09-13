"use client";

import Link from "next/link";
import { formatCents } from "@/lib/money";
import { useCart } from "./CartProvider";

export default function CartDrawer() {
  const { enriched, count, subtotalCents, setQty, remove, isOpen, closeCart } = useCart();

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeCart}
        aria-hidden={!isOpen}
        className="fixed inset-0 z-[60] transition-opacity duration-300"
        style={{
          backgroundColor: "rgba(64, 58, 50, 0.45)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
        }}
      />

      {/* Panel */}
      <aside
        className="fixed top-0 right-0 z-[70] h-full w-full max-w-md flex flex-col transition-transform duration-300"
        style={{
          backgroundColor: "var(--cream)",
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          boxShadow: "-8px 0 30px rgba(0,0,0,0.12)",
        }}
        role="dialog"
        aria-label="Your cart"
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <h2 className="text-2xl" style={{ color: "var(--charcoal)" }}>
            Your Order{count > 0 ? ` (${count})` : ""}
          </h2>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="w-9 h-9 rounded-full flex items-center justify-center text-xl transition-colors"
            style={{ backgroundColor: "rgba(156, 181, 163, 0.18)", color: "var(--charcoal)" }}
          >
            ×
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {enriched.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <p className="text-lg mb-2" style={{ color: "var(--charcoal)" }}>
                Your cart is empty
              </p>
              <p className="text-sm" style={{ color: "var(--text-light)" }}>
                Add something from the menu to get started.
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {enriched.map((item) => {
                const atLimit = item.qty >= item.product.dailyLimit;
                return (
                  <li
                    key={item.productId}
                    className="flex gap-3 pb-4"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <div className="flex-1">
                      <p className="font-semibold" style={{ color: "var(--charcoal)" }}>
                        {item.product.name}
                      </p>
                      <p className="text-sm mb-2" style={{ color: "var(--text-light)" }}>
                        {formatCents(item.product.priceCents)} each
                      </p>
                      <div className="flex items-center gap-3">
                        <div
                          className="flex items-center gap-3 rounded-full px-2 py-1"
                          style={{ border: "1px solid var(--border)", backgroundColor: "var(--white)" }}
                        >
                          <button
                            onClick={() => setQty(item.productId, item.qty - 1)}
                            aria-label={`Remove one ${item.product.name}`}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none"
                            style={{ color: "var(--sage-deep)" }}
                          >
                            −
                          </button>
                          <span className="w-5 text-center font-semibold" style={{ color: "var(--charcoal)" }}>
                            {item.qty}
                          </span>
                          <button
                            onClick={() => setQty(item.productId, item.qty + 1)}
                            disabled={atLimit}
                            aria-label={`Add one ${item.product.name}`}
                            className="w-7 h-7 rounded-full flex items-center justify-center text-lg leading-none"
                            style={{ color: atLimit ? "var(--border)" : "var(--sage-deep)", cursor: atLimit ? "not-allowed" : "pointer" }}
                          >
                            +
                          </button>
                        </div>
                        <button
                          onClick={() => remove(item.productId)}
                          className="text-sm underline"
                          style={{ color: "var(--text-light)" }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    <div className="font-semibold" style={{ color: "var(--sage-deep)" }}>
                      {formatCents(item.lineTotalCents)}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        {enriched.length > 0 && (
          <div className="px-6 py-5" style={{ borderTop: "1px solid var(--border)" }}>
            <div className="flex items-center justify-between mb-1">
              <span style={{ color: "var(--charcoal)" }}>Subtotal</span>
              <span className="text-xl font-semibold" style={{ color: "var(--charcoal)" }}>
                {formatCents(subtotalCents)}
              </span>
            </div>
            <p className="text-xs mb-4" style={{ color: "var(--text-light)" }}>
              Delivery fee and (for card) the 3% surcharge are calculated at checkout.
            </p>
            <Link
              href="/order/checkout"
              onClick={closeCart}
              className="btn-primary w-full text-center"
              style={{ display: "block" }}
            >
              Go to checkout
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
