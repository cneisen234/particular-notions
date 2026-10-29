// The product catalog: plain types and helpers over the shop loaded from the
// database (lib/shop.ts), managed in Pilot Light. No server-only imports, so
// both the storefront (browser) and the checkout (server) can use it.
//
// DAILY LIMIT: `dailyLimit` is how many can be ordered for each pickup/delivery
// day. Saved orders count it down for their day; `remaining` is what's left for
// the product's next day, and 0 means sold out. `available: false` turns an item
// off regardless of its limit (e.g. a temporary pause).
//
// PACKS: a product with a 6- or 12-pack price can also be bought in that size
// (e.g. cookies: 2 for the regular price, or a 6- or 12-pack). The daily limit
// counts regular packs, so each bigger pack takes its share (a 12-pack of a
// 2-cookie product takes 6).

import type { ShopConfig } from "@/lib/shop-config";

export type Category = {
  id: string;
  name: string;
  /** Optional blurb shown under the section heading on the storefront. */
  description?: string;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  /** Matches a Category id. */
  category: string;
  /** Price in integer cents (e.g. 900 = $9.00). */
  priceCents: number;
  /** How many can be ordered for each pickup/delivery day. */
  dailyLimit: number;
  /** Left for this product's next pickup/delivery day (sold out at 0). */
  remaining: number;
  /** False turns this item off regardless of its limit. */
  available: boolean;
  /** Advance notice this item needs, in hours; null uses the shop's default. */
  leadTimeHours: number | null;
  /** The product's photo, if it has one. */
  imageUrl: string | null;
  /** How many come at the regular price (e.g. 2 cookies); null is one. */
  packSize: number | null;
  /** 6- and 12-pack prices in integer cents; null doesn't offer that size. */
  sixPackPriceCents: number | null;
  twelvePackPriceCents: number | null;
};

/** Everything the storefront and checkout need, loaded fresh for each request. */
export type Shop = {
  config: ShopConfig;
  /** In storefront display order. */
  categories: Category[];
  /** In catalog order. */
  products: Product[];
};

// ---- Helpers ----

/** An item can be ordered when it isn't off and has some left for its day. */
export function isOrderable(p: Product): boolean {
  return p.available && p.remaining > 0;
}

/** Look up a product by id (undefined if not found). */
export function getProduct(shop: Shop, id: string): Product | undefined {
  return shop.products.find((p) => p.id === id);
}

// ---- Packs ----

/** The bigger packs a product can also be sold in, when it has a price for them. */
export const PACK_SIZES = [6, 12] as const;
export type PackSize = (typeof PACK_SIZES)[number];

/** One way to buy a product: its regular pack (`size` null) or a 6- or 12-pack. */
export type PackOption = {
  size: PackSize | null;
  /** e.g. "2-Pack", "12-Pack". */
  label: string;
  priceCents: number;
  /** How much of the daily limit (counted in regular packs) one of these takes. */
  limitUnits: number;
};

/** A cart line's pack as sent by the browser: 6 or 12, anything else is the regular one. */
export function asPackSize(v: unknown): PackSize | null {
  return PACK_SIZES.find((s) => s === v) ?? null;
}

/** Every way the product can be bought, regular pack first. */
export function packOptions(p: Product): PackOption[] {
  const regular = p.packSize ?? 1;
  const options: PackOption[] = [
    { size: null, label: p.packSize ? `${p.packSize}-Pack` : "Single", priceCents: p.priceCents, limitUnits: 1 },
  ];
  const prices: Record<PackSize, number | null> = { 6: p.sixPackPriceCents, 12: p.twelvePackPriceCents };
  for (const size of PACK_SIZES) {
    const priceCents = prices[size];
    if (priceCents === null || size <= regular) continue;
    options.push({ size, label: `${size}-Pack`, priceCents, limitUnits: Math.ceil(size / regular) });
  }
  return options;
}

/** The option for a pack size, or undefined if the product isn't sold that way. */
export function packOption(p: Product, size: PackSize | null): PackOption | undefined {
  return packOptions(p).find((o) => o.size === size);
}

/**
 * The product's name for a cart line or an order item: as it is for the regular
 * pack; for a 6- or 12-pack, its "(2-Pack)" ending becomes "(12-Pack)", or
 * "(12-Pack)" is added when the name has none.
 */
export function packName(p: Product, size: PackSize | null): string {
  if (size === null) return p.name;
  const label = `(${size}-Pack)`;
  const named = /\s*\(\d+[- ]?pack\)\s*$/i;
  return named.test(p.name) ? p.name.replace(named, ` ${label}`) : `${p.name} ${label}`;
}

/**
 * Storefront-ready grouping: categories in display order, each with its
 * products (orderable first, sold-out/off sunk to the bottom — stable within
 * each group). Categories with no products are omitted.
 */
export function catalogByCategory(shop: Shop): { category: Category; products: Product[] }[] {
  return shop.categories
    .map((category) => ({
      category,
      products: shop.products
        .filter((p) => p.category === category.id)
        .sort((a, b) => Number(isOrderable(b)) - Number(isOrderable(a))),
    }))
    .filter((group) => group.products.length > 0);
}
