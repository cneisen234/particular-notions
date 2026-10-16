// Kindling's site module: how a custom site plugs into Pilot Light
// (docs/site-module.md; docs/site-conventions.md). Server-side only: import it
// from server components, route handlers and server actions, never from a
// "use client" file (it reads the site's secret and database).

export { isAddonOn, getAddonSettings, getPaymentProvider, type PaymentProvider } from "./addons";
export { getSiteNav, groupNav, groupFooter, NAV_LIMIT, NAV_CATEGORIES, type SiteNavLink, type SiteNavItem, type SiteFooterColumn } from "./nav";
export { pilotLightRoute, SiteActionRefused, type SiteActionHandler, type SiteActionRequest, type SiteActionReply } from "./actions";
export { notifyChange, type Change } from "./notify";
export { LenaForCustomers } from "./lena";
export { PilotLightConfigError } from "./config";
export { SITE_MODULE_VERSION } from "./version";
export { siteEmailHeaders, SITE_EMAIL_KINDS, SITE_EMAIL_KIND_HEADER, type SiteEmailKind } from "./email";
