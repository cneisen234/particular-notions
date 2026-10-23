// The site's connection to Pilot Light, from the environment names in
// docs/site-conventions.md §2. Printed by Kindling's `npm run site:connect`.

export class PilotLightConfigError extends Error {}

function read(name: string): string | null {
  const v = process.env[name]?.trim();
  return v ? v : null;
}

function required(name: string): string {
  const v = read(name);
  if (!v) throw new PilotLightConfigError(`${name} isn't set (docs/site-conventions.md §2).`);
  return v;
}

/** The business's own database (Pilot Light's data is in its `ops` schema). */
export const databaseUrl = () => required("DATABASE_URL");

/** The secret both sides sign with. */
export const siteSecret = () => required("PILOT_LIGHT_SITE_SECRET");

/** The live Pilot Light. */
const LIVE_PILOT_LIGHT = "https://pilotlight.kindlingdigital.org";

/**
 * Where Pilot Light runs: the local one while the site runs in development (`next dev`; `PILOT_LIGHT_DEV_URL`,
 * else http://localhost:3000), the live one everywhere else (`PILOT_LIGHT_URL`, else the live address). So the
 * same values work in `.env.local` and on Vercel, with nothing to switch.
 */
function pilotLightUrl(): string {
  if (process.env.NODE_ENV === "development") return read("PILOT_LIGHT_DEV_URL") ?? "http://localhost:3000";
  return read("PILOT_LIGHT_URL") ?? LIVE_PILOT_LIGHT;
}

/** Where Pilot Light runs, and which business this site is; null until the site is connected. */
export function pilotLight(): { url: string; businessId: string } | null {
  const businessId = read("PILOT_LIGHT_BUSINESS_ID");
  return businessId ? { url: pilotLightUrl().replace(/\/+$/, ""), businessId } : null;
}
