// Which copy of the site module this is (plan.md Step 22). Every site runs its
// own copy of the module, so Pilot Light needs to know which sites are behind:
// the site's ping reports this, Pilot Light records it on the site's connection,
// and `site:check`, `connections` and `usage:report` flag a site running an
// older copy. Bump it (to the day's date) with every change to the module.

export const SITE_MODULE_VERSION = "2026-10-14";
