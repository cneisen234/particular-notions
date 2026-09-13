// Money helpers. Every amount in this app is an integer number of cents; this is
// the one place we convert to/from that representation. Pure and safe on both
// the client and the server.

/** Format integer cents as a dollar string, e.g. 2369 -> "$23.69". */
export function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/** Parse a dollar string (e.g. "9.50") to integer cents. Invalid/negative -> 0. */
export function dollarsToCents(v: string): number {
  const n = Number.parseFloat(v);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}
