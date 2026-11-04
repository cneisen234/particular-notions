// Coupons: codes a customer types at checkout, as on Soady Poppers. Server-only
// (reads the database); the money math is in lib/pricing.ts.

import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { coupons } from "@/lib/db/schema";
import { normalizeCode, type CouponMatch } from "@/lib/pricing";

/** The active coupon for a code, or null when the code is blank, unknown, or switched off. Case-insensitive. */
export async function couponForCode(code?: string | null, tx: Pick<typeof db, "select"> = db): Promise<CouponMatch | null> {
  const c = normalizeCode(code);
  if (!c) return null;
  const [row] = await tx
    .select({ code: coupons.code, kind: coupons.kind, bps: coupons.discountBps, amountCents: coupons.amountOffCents })
    .from(coupons)
    // However it was typed when it was made (Pilot Light saves it as written).
    .where(and(eq(sql`upper(trim(${coupons.code}))`, c), eq(coupons.active, true)))
    .limit(1);
  if (!row) return null;
  return { code: row.code, kind: row.kind, bps: row.bps, amountCents: row.amountCents ?? 0 };
}
