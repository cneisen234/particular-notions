"use client";

// Cart state for the storefront. Holds the raw {productId, qty} lines, persists
// them to localStorage, and re-prices/re-validates against the current static
// inventory on every load (so if an item's daily limit was lowered or it sold
// out since the cart was saved, the cart self-corrects).
//
// Also owns the cart-drawer open/close UI state so the floating cart button (and
// the checkout link) can drive it.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getProduct, isOrderable, type Product } from "@/lib/inventory";

const STORAGE_KEY = "pn-cart-v1";

export type CartItem = { productId: string; qty: number };

export type EnrichedItem = CartItem & { product: Product; lineTotalCents: number };

type CartContextValue = {
  items: CartItem[];
  /** Cart lines joined to their live product data (skips unknown/off items). */
  enriched: EnrichedItem[];
  /** Total quantity across all lines. */
  count: number;
  subtotalCents: number;
  /** Add qty (default 1); clamped to the item's daily limit. */
  add: (productId: string, qty?: number) => void;
  /** Set an exact qty; 0 or less removes the line. Clamped to the daily limit. */
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** True once localStorage has been read (avoids SSR hydration mismatch). */
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** Clamp a requested qty to [0, dailyLimit] for an orderable product; else 0. */
function clampQty(product: Product | undefined, qty: number): number {
  if (!product || !isOrderable(product)) return 0;
  const n = Math.floor(qty);
  if (!Number.isFinite(n) || n <= 0) return 0;
  return Math.min(n, product.dailyLimit);
}

/** Drop unknown/off items and clamp each qty to the current daily limit. */
function reconcile(items: CartItem[]): CartItem[] {
  const out: CartItem[] = [];
  for (const it of items) {
    const qty = clampQty(getProduct(it.productId), it.qty);
    if (qty > 0) out.push({ productId: it.productId, qty });
  }
  return out;
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Load once on mount (client only), reconciling against current inventory.
  // localStorage can't be read during SSR without a hydration mismatch, so this
  // deliberately runs post-mount — the set-state-in-effect warning is expected.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
        if (Array.isArray(parsed)) setItems(reconcile(parsed));
      }
    } catch {
      // Ignore corrupt/unavailable storage — start with an empty cart.
    }
    setHydrated(true);
  }, []);

  // Persist after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota/availability errors.
    }
  }, [items, hydrated]);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      const clamped = clampQty(getProduct(productId), qty);
      if (clamped <= 0) return prev.filter((i) => i.productId !== productId);
      // Update in place to preserve the existing line order; append if new.
      if (prev.some((i) => i.productId === productId)) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: clamped } : i));
      }
      return [...prev, { productId, qty: clamped }];
    });
  }, []);

  const add = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      const clamped = clampQty(getProduct(productId), (existing?.qty ?? 0) + qty);
      if (clamped <= 0) return prev;
      // Update in place to preserve line order; append only when it's a new line.
      if (existing) {
        return prev.map((i) => (i.productId === productId ? { ...i, qty: clamped } : i));
      }
      return [...prev, { productId, qty: clamped }];
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const enriched = useMemo<EnrichedItem[]>(() => {
    return items.flatMap((it) => {
      const product = getProduct(it.productId);
      if (!product) return [];
      return [{ ...it, product, lineTotalCents: product.priceCents * it.qty }];
    });
  }, [items]);

  const count = useMemo(() => enriched.reduce((n, i) => n + i.qty, 0), [enriched]);
  const subtotalCents = useMemo(
    () => enriched.reduce((n, i) => n + i.lineTotalCents, 0),
    [enriched],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      enriched,
      count,
      subtotalCents,
      add,
      setQty,
      remove,
      clear,
      hydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [items, enriched, count, subtotalCents, add, setQty, remove, clear, hydrated, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
