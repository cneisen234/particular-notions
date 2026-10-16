// The product catalog: plain types and helpers over the shop loaded from the
// database (lib/shop.ts), managed in Pilot Light. No server-only imports, so
// both the storefront (browser) and the checkout (server) can use it.
//
// DAILY LIMIT: `dailyLimit` is how many can be ordered for each pickup/delivery
// day. Saved orders count it down for their day; `remaining` is what's left for
// the product's next day, and 0 means sold out. `available: false` turns an item
// off regardless of its limit (e.g. a temporary pause).

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
