// Every public page (docs/site-conventions.md §6, in Pilot Light): Pilot Light
// reads them as Lena's knowledge. Checkout and the API are left out.

import type { MetadataRoute } from "next";

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://particularnotions.com").replace(/\/+$/, "");

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/about", "/gallery", "/order", "/faq", "/contact"].map((path) => ({ url: `${SITE_URL}${path}` }));
}
