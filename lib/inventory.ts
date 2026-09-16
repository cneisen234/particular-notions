// Static product catalog for the Particular Notions online store.
//
// There is NO database and NO admin portal. This file IS the inventory: edit it
// and redeploy to change what's for sale.
//
// DAILY LIMIT (manual cap): `dailyLimit` is how many are available for a day's
// orders. It does NOT auto-decrement as orders come in — YOU lower it by hand as
// you take orders, then redeploy. When it reaches 0 the item turns OFF (shown as
// sold out and impossible to order). Set `available: false` to force an item OFF
// regardless of its limit (e.g. a temporary pause).
//
// This module is pure data + pure helpers (no server-only imports), so it's safe
// to use from both the storefront (browser) and the checkout (server). Prices
// are public, so shipping them to the browser is fine.

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
  /** Must match a Category id below. */
  category: string;
  /** Price in integer cents (e.g. 900 = $9.00). */
  priceCents: number;
  /**
   * Number available for the day. Manual cap — lower it by hand as orders come
   * in. 0 = sold out / OFF.
   */
  dailyLimit: number;
  /** Set false to force this item OFF regardless of dailyLimit. Defaults on. */
  available?: boolean;
  /** Path to a photo under /public, e.g. "/store/classic-sourdough.webp". */
  imageUrl?: string;
};

// ---- Categories (storefront display order = array order) ----
export const categories: Category[] = [
  {
    id: "sourdough-bread",
    name: "Sourdough Bread",
    description: "Naturally leavened and baked fresh to order.",
  },
  {
    id: "scones",
    name: "Scones",
    description: "Tender, buttery scones.",
  },
  {
    id: "cookies",
    name: "Cookies",
    description: "Small-batch cookies, baked fresh to order.",
  },
  {
    id: "quick-breads",
    name: "Quick Breads",
    description: "Moist mini loaves, baked fresh to order.",
  },
];

// ---- Products ----
// To add a photo: drop the .webp in /public/store/ and set
//   imageUrl: "/store/your-file.webp"
// Leave imageUrl off entirely to show the bread-icon placeholder — never point it
// at a file that doesn't exist yet, or the browser will 404 it.
export const products: Product[] = [
  // --- Sourdough Bread ---
  {
    id: "sourdough-sandwich-bread",
    name: "Sourdough Sandwich Bread",
    description: "A soft-crumb sandwich loaf with a gentle sourdough tang — perfect for toast and sandwiches.",
    category: "sourdough-bread",
    priceCents: 1000,
    dailyLimit: 4,
    imageUrl: "/store/sourdoughbread.webp",
  },

  // --- Sourdough Scones ---
  {
    id: "blueberry-sourdough-scone",
    name: "Blueberry Sourdough Scone",
    description: "Buttery sourdough scone studded with juicy blueberries.",
    category: "scones",
    priceCents: 400,
    dailyLimit: 24,
  },
  {
    id: "chocolate-chip-sourdough-scone",
    name: "Chocolate Chip Sourdough Scone",
    description: "Buttery sourdough scone loaded with melty chocolate chips.",
    category: "scones",
    priceCents: 400,
    dailyLimit: 24,
    imageUrl: "/store/ChocolateChipScone.webp",
  },
  {
    id: "plain-sourdough-scone",
    name: "Plain Sourdough Scone",
    description: "A classic buttery sourdough scone — simple and tender.",
    category: "scones",
    priceCents: 400,
    dailyLimit: 24,
  },
  {
    id: "lemon-sourdough-scone",
    name: "Lemon Scone",
    description: "Bright, zesty lemon folded into a tender scone.",
    category: "scones",
    priceCents: 400,
    dailyLimit: 24,
    imageUrl: "/store/lemon-scone.webp",
  },
  {
    id: "cinnamon-raisin-sourdough-scone",
    name: "Cinnamon Raisin Sourdough Scone",
    description: "Warm cinnamon and plump raisins in a buttery sourdough scone.",
    category: "scones",
    priceCents: 400,
    dailyLimit: 24,
  },

  // --- Cookies ---
  {
    id: "chocolate-chip-sourdough-cookies",
    name: "Chocolate Chip Sourdough Cookies (2-Pack)",
    description: "Two chewy sourdough cookies packed with chocolate chips.",
    category: "cookies",
    priceCents: 200,
    dailyLimit: 24,
    imageUrl: "/store/ChocolateChipCookies.webp",
  },
  {
    id: "sugar-sourdough-cookies",
    name: "Sugar Sourdough Cookies (2-Pack)",
    description: "Two soft, sweet sourdough sugar cookies.",
    category: "cookies",
    priceCents: 200,
    dailyLimit: 24,
    imageUrl: "/store/sugar-cookie.webp",
  },
  {
    id: "salted-caramel-sourdough-cookies",
    name: "Salted Caramel Sourdough Cookies (2-Pack)",
    description: "Two chewy sourdough cookies with gooey salted caramel.",
    category: "cookies",
    priceCents: 200,
    dailyLimit: 24,
  },
  {
    id: "meringue-cookies",
    name: "Meringue Cookies (4-Pack)",
    description: "Four light, airy meringue cookies that melt in your mouth.",
    category: "cookies",
    priceCents: 200,
    dailyLimit: 4,
  },

  // --- Quick Breads ---
  {
    id: "banana-bread-plain",
    name: "Banana Bread Mini Loaf — Plain",
    description: "A moist, tender mini loaf of classic banana bread.",
    category: "quick-breads",
    priceCents: 400,
    dailyLimit: 4,
  },
  {
    id: "banana-bread-apple",
    name: "Banana Bread Mini Loaf — Apple",
    description: "Moist banana bread mini loaf folded with sweet apple.",
    category: "quick-breads",
    priceCents: 500,
    dailyLimit: 4,
  },
  {
    id: "banana-bread-chocolate-chip",
    name: "Banana Bread Mini Loaf — Chocolate Chip",
    description: "Moist banana bread mini loaf loaded with chocolate chips.",
    category: "quick-breads",
    priceCents: 500,
    dailyLimit: 4,
  },
  {
    id: "zucchini-bread-plain",
    name: "Zucchini Bread Mini Loaf — Plain",
    description: "A moist, lightly spiced mini loaf of classic zucchini bread.",
    category: "quick-breads",
    priceCents: 400,
    dailyLimit: 2,
  },
  {
    id: "zucchini-bread-chocolate-chip",
    name: "Zucchini Bread Mini Loaf — Chocolate Chip",
    description: "Moist zucchini bread mini loaf with chocolate chips.",
    category: "quick-breads",
    priceCents: 500,
    dailyLimit: 2,
  },
];

// ---- Helpers ----

/** An item can be ordered when it isn't disabled and still has daily capacity. */
export function isOrderable(p: Product): boolean {
  return p.available !== false && p.dailyLimit > 0;
}

/** Look up a product by id (undefined if not found). */
export function getProduct(id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

/** Products in a category, in catalog order. */
export function productsByCategory(categoryId: string): Product[] {
  return products.filter((p) => p.category === categoryId);
}

/**
 * Storefront-ready grouping: categories in display order, each with its
 * products (orderable first, sold-out/off sunk to the bottom — stable within
 * each group). Categories with no products are omitted.
 */
export function catalogByCategory(): { category: Category; products: Product[] }[] {
  return categories
    .map((category) => ({
      category,
      products: productsByCategory(category.id).sort(
        (a, b) => Number(isOrderable(b)) - Number(isOrderable(a)),
      ),
    }))
    .filter((group) => group.products.length > 0);
}
