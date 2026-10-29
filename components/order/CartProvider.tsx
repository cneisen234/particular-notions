"use client";

// Cart state for the storefront. Holds the raw {productId, pack, qty} lines,
// persists them to localStorage, and re-prices/re-validates against the shop the
// page loaded from the database (so if an item sold out or its limit was lowered
// since the cart was saved, the cart self-corrects). Also hands that shop to the
// storefront and checkout (useCart().shop).
//
// A product can be in the cart once per pack (its regular pack, a 6-pack, a
// 12-pack); those lines share the product's daily limit.
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
import {
  asPackSize,
  getProduct,
  isOrderable,
  packName,
  packOption,
  type PackOption,
  type PackSize,
  type Product,
  type Shop,
} from "@/lib/inventory";

const STORAGE_KEY = "pn-cart-v1";

/** `pack`: 6 or 12 for a bigger pack; null for the regular one. */
export type CartItem = { productId: string; pack: PackSize | null; qty: number };

export type EnrichedItem = CartItem & {
  product: Product;
  option: PackOption;
  /** The product's name with its pack, e.g. "Sugar Sourdough Cookies (12-Pack)". */
  name: string;
  lineTotalCents: number;
};

type CartContextValue = {
  /** The shop as loaded for this page (settings, catalog, what's left today). */
  shop: Shop;
  items: CartItem[];
  /** Cart lines joined to their live product data (skips unknown/off items). */
  enriched: EnrichedItem[];
  /** Total quantity across all lines. */
  count: number;
  subtotalCents: number;
  /** Add qty (default 1) of a pack; clamped to what's left of the item's daily limit. */
  add: (productId: string, pack: PackSize | null, qty?: number) => void;
  /** Set an exact qty of a pack; 0 or less removes the line. Clamped to the daily limit. */
  setQty: (productId: string, pack: PackSize | null, qty: number) => void;
  remove: (productId: string, pack: PackSize | null) => void;
  clear: () => void;
  /** How much of a product's daily limit the cart holds, across all its packs. */
  limitUsed: (productId: string) => number;
  /** True once localStorage has been read (avoids SSR hydration mismatch). */
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

/** A cart line's identity: the product and its pack. */
export function lineKey(productId: string, pack: PackSize | null): string {
  return `${productId}|${pack ?? ""}`;
}

const sameLine = (i: CartItem, productId: string, pack: PackSize | null) => i.productId === productId && i.pack === pack;

/** Daily limit taken by the cart's other lines of this product. */
function usedByOthers(shop: Shop, items: CartItem[], productId: string, pack: PackSize | null): number {
  const product = getProduct(shop, productId);
  if (!product) return 0;
  return items.reduce((n, i) => {
    if (i.productId !== productId || i.pack === pack) return n;
    return n + (packOption(product, i.pack)?.limitUnits ?? 0) * i.qty;
  }, 0);
}

/**
 * Clamp a requested qty of a pack to [0, what fits in what's left of the
 * product's daily limit after the cart's other packs of it]; 0 if it can't be ordered.
 */
function clampQty(shop: Shop, items: CartItem[], productId: string, pack: PackSize | null, qty: number): number {
  const product = getProduct(shop, productId);
  if (!product || !isOrderable(product)) return 0;
  const option = packOption(product, pack);
  if (!option) return 0;
  const n = Math.floor(qty);
  if (!Number.isFinite(n) || n <= 0) return 0;
  const room = product.remaining - usedByOthers(shop, items, productId, pack);
  return Math.max(0, Math.min(n, Math.floor(room / option.limitUnits)));
}

/** Drop unknown/off items and packs no longer sold, and clamp each qty to what's left. */
function reconcile(shop: Shop, items: unknown[]): CartItem[] {
  const out: CartItem[] = [];
  for (const raw of items) {
    const it = raw as Partial<CartItem>;
    if (typeof it?.productId !== "string" || typeof it.qty !== "number") continue;
    const pack = asPackSize(it.pack);
    if (out.some((i) => sameLine(i, it.productId!, pack))) continue;
    const qty = clampQty(shop, out, it.productId, pack, it.qty);
    if (qty > 0) out.push({ productId: it.productId, pack, qty });
  }
  return out;
}

/** Set a line's qty in place (keeping line order), append it if new, or drop it at 0. */
function withQty(items: CartItem[], productId: string, pack: PackSize | null, qty: number): CartItem[] {
  if (qty <= 0) return items.filter((i) => !sameLine(i, productId, pack));
  if (items.some((i) => sameLine(i, productId, pack))) {
    return items.map((i) => (sameLine(i, productId, pack) ? { ...i, qty } : i));
  }
  return [...items, { productId, pack, qty }];
}

export function CartProvider({ shop, children }: { shop: Shop; children: ReactNode }) {
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
        if (Array.isArray(parsed)) setItems(reconcile(shop, parsed));
      }
    } catch {
      // Ignore corrupt/unavailable storage — start with an empty cart.
    }
    setHydrated(true);
  }, [shop]);

  // Persist after hydration.
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore quota/availability errors.
    }
  }, [items, hydrated]);

  const setQty = useCallback((productId: string, pack: PackSize | null, qty: number) => {
    setItems((prev) => withQty(prev, productId, pack, clampQty(shop, prev, productId, pack, qty)));
  }, [shop]);

  const add = useCallback((productId: string, pack: PackSize | null, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, productId, pack))?.qty ?? 0;
      const clamped = clampQty(shop, prev, productId, pack, existing + qty);
      // Never shrink a line by adding to it.
      return clamped <= existing ? prev : withQty(prev, productId, pack, clamped);
    });
  }, [shop]);

  const remove = useCallback((productId: string, pack: PackSize | null) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, pack)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const enriched = useMemo<EnrichedItem[]>(() => {
    return items.flatMap((it) => {
      const product = getProduct(shop, it.productId);
      const option = product && packOption(product, it.pack);
      if (!product || !option) return [];
      return [{ ...it, product, option, name: packName(product, it.pack), lineTotalCents: option.priceCents * it.qty }];
    });
  }, [shop, items]);

  const limitUsed = useCallback(
    (productId: string) =>
      enriched.reduce((n, i) => (i.productId === productId ? n + i.option.limitUnits * i.qty : n), 0),
    [enriched],
  );

  const count = useMemo(() => enriched.reduce((n, i) => n + i.qty, 0), [enriched]);
  const subtotalCents = useMemo(
    () => enriched.reduce((n, i) => n + i.lineTotalCents, 0),
    [enriched],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      shop,
      items,
      enriched,
      count,
      subtotalCents,
      add,
      setQty,
      remove,
      clear,
      limitUsed,
      hydrated,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
    }),
    [shop, items, enriched, count, subtotalCents, add, setQty, remove, clear, limitUsed, hydrated, isOpen],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
