// The site's header links (docs/site-conventions.md §4, "Navigation"): the same
// rule as Pilot Light's own menu, worked out here so every connected site gets it
// without coding it.
//
//  - Each link names the Pilot Light add-on behind its page (`addon`), if any.
//    Links whose add-on is off are left out, so a section the owner switches off
//    in Pilot Light disappears from the menu at once.
//  - Up to 6 links: every link shows, in the site's order.
//  - Past 6: links group into categories, one per add-on (E-commerce's Order and
//    Plans under "Shop"), named the same on every Kindling site
//    (NAV_CATEGORIES). A category with a single link stays a plain link. A site
//    can name a category itself with `category` (also how it groups its own
//    pages, e.g. Visit and Contact under "About", if those alone pass 6).
//
// The header renders what this returns: a category is a button, never a link,
// that opens and closes its links (a small menu on desktop, nested links in the
// phone menu); a plain link goes to its page. The main call-to-action button
// isn't part of this and doesn't count.
//
// The footer uses the same links: up to 6, one "Explore" column; past 6, the
// plain links stay under "Explore" and each category is its own column, headed
// by its name, with all its links always showing (no buttons in a footer).

import { isAddonOn } from "./addons";

/** Most links a menu shows before it groups into categories. */
export const NAV_LIMIT = 6;

/** What visitors see as each add-on's category (Pilot Light's add-on keys). */
export const NAV_CATEGORIES: Record<string, string> = {
  ecommerce: "Shop",
  cms: "News",
  reviews: "Reviews",
  bookings: "Book",
  customers_loyalty: "Rewards",
  client_portal: "Account",
  leads_forms: "Get a quote",
  delivery_tracking: "Track",
  multi_location: "Locations",
  hiring: "Careers",
  documents: "Forms",
};

export type SiteNavLink = {
  href: string;
  label: string;
  /** The Pilot Light add-on behind this page (e.g. "ecommerce"); none for the site's own pages (Home, Contact). */
  addon?: string;
  /** Names the category instead of the add-on's (rarely needed). */
  category?: string;
};

export type SiteNavItem = { kind: "link"; link: SiteNavLink } | { kind: "category"; label: string; links: SiteNavLink[] };

function categoryOf(link: SiteNavLink): string | null {
  if (link.category) return link.category;
  if (!link.addon) return null;
  return NAV_CATEGORIES[link.addon] ?? link.addon.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

/** The grouping alone (no add-on check): up to 6 links as they are; past 6, categories in the place of their first link. */
export function groupNav(links: SiteNavLink[]): SiteNavItem[] {
  if (links.length <= NAV_LIMIT) return links.map((link) => ({ kind: "link", link }));
  const items: SiteNavItem[] = [];
  for (const link of links) {
    const category = categoryOf(link);
    const group = category ? links.filter((l) => categoryOf(l) === category) : [];
    if (group.length < 2) items.push({ kind: "link", link });
    else if (group[0] === link) items.push({ kind: "category", label: category!, links: group });
  }
  return items;
}

export type SiteFooterColumn = { title: string; links: SiteNavLink[] };

/** The footer's link columns: "Explore" for the plain links, then one per category (past 6 links). */
export function groupFooter(links: SiteNavLink[]): SiteFooterColumn[] {
  const plain: SiteNavLink[] = [];
  const columns: SiteFooterColumn[] = [];
  for (const item of groupNav(links)) {
    if (item.kind === "link") plain.push(item.link);
    else columns.push({ title: item.label, links: item.links });
  }
  return plain.length ? [{ title: "Explore", links: plain }, ...columns] : columns;
}

/**
 * The site's menus: `links` are the links that are on, `items` the header's menu
 * (links and categories), `footer` the footer's link columns.
 */
export async function getSiteNav(all: SiteNavLink[]): Promise<{ links: SiteNavLink[]; items: SiteNavItem[]; footer: SiteFooterColumn[] }> {
  const on = await Promise.all(all.map((l) => (l.addon ? isAddonOn(l.addon) : true)));
  const links = all.filter((_, i) => on[i]);
  return { links, items: groupNav(links), footer: groupFooter(links) };
}
