"use client";

import { useEffect, useState } from "react";
import { catalogByCategory } from "@/lib/inventory";
import { shopConfig } from "@/lib/shop-config";
import { fulfillmentSchedule } from "@/lib/fulfillment";
import { useCart } from "./CartProvider";
import ProductCard from "./ProductCard";
import CartDrawer from "./CartDrawer";

function FloatingCartButton() {
  const { count, openCart, hydrated } = useCart();
  return (
    <button
      onClick={openCart}
      className="fixed z-50 bottom-6 right-6 flex items-center gap-2 px-5 py-3 rounded-full text-white font-semibold transition-all"
      style={{
        backgroundColor: "var(--sage-deep)",
        fontFamily: "var(--font-quicksand), sans-serif",
        boxShadow: "0 8px 22px rgba(111, 140, 120, 0.4)",
      }}
      aria-label="Open cart"
    >
      <span aria-hidden>🧺</span>
      Cart
      {hydrated && count > 0 && (
        <span
          className="ml-1 min-w-6 h-6 px-2 rounded-full flex items-center justify-center text-sm"
          style={{ backgroundColor: "var(--gold)", color: "white" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

export default function Storefront() {
  const groups = catalogByCategory();
  // Compute the "ready" date in the browser after mount, not during render — this
  // page is statically prerendered, so a render-time date would freeze at build
  // time and only change on redeploy. Recomputing client-side keeps it current.
  const [readyLabel, setReadyLabel] = useState<string | null>(null);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- compute date after mount so a static build doesn't freeze it
    setReadyLabel(fulfillmentSchedule().label);
  }, []);

  if (!shopConfig.acceptingOrders) {
    return (
      <main className="min-h-screen section-padding">
        <div className="container mx-auto max-w-2xl text-center">
          <h1 className="text-4xl mb-4" style={{ color: "var(--sage-deep)" }}>
            Ordering is paused
          </h1>
          <div className="divider-sparkle mx-auto mb-6" />
          <p className="text-lg" style={{ color: "var(--text-light)" }}>
            {shopConfig.pausedMessage}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="py-14 px-4">
        <div className="container mx-auto max-w-4xl text-center flex flex-col items-center">
          <p className="eyebrow mb-3">Fresh sourdough, baked to order</p>
          <h1 className="text-5xl mb-4" style={{ color: "var(--sage-deep)" }}>
            Order Online
          </h1>
          <div className="divider-sparkle mb-6" />
          <p className="text-lg max-w-2xl" style={{ color: "var(--text-light)" }}>
            Place an order today and it&apos;s ready{" "}
            <strong>{readyLabel ?? "the next day"}</strong> for pickup or local
            delivery — sourdough loaves need an extra day. Pay by card, or cash at
            pickup/delivery.
          </p>
        </div>
      </section>

      {/* Catalog */}
      <section className="px-4 pb-28">
        <div className="container mx-auto max-w-6xl">
          {groups.length === 0 ? (
            <p className="text-center text-lg" style={{ color: "var(--text-light)" }}>
              Nothing is available to order right now — check back soon!
            </p>
          ) : (
            groups.map(({ category, products }) => (
              <div key={category.id} className="mb-14">
                <div className="mb-6">
                  <h2 className="text-3xl" style={{ color: "var(--charcoal)" }}>
                    {category.name}
                  </h2>
                  {category.description && (
                    <p className="text-base mt-1" style={{ color: "var(--text-light)" }}>
                      {category.description}
                    </p>
                  )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <FloatingCartButton />
      <CartDrawer />
    </main>
  );
}
