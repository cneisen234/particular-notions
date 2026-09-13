// Google reCAPTCHA v3 verification (server-side). Confirms the token is real,
// tied to the expected action, and scores above the risk threshold. Gates
// checkout against bots / card-testing.
//
// Fail-open ONLY when no secret is configured, so local dev works before keys
// exist. Once RECAPTCHA_SECRET_KEY is set (production), a missing/invalid token
// is rejected.

import "server-only";

export type RecaptchaResult = { ok: true } | { ok: false; reason: string };

export async function verifyRecaptcha(
  token: string | undefined,
  action: string,
  ip?: string,
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true }; // not configured -> skip
  if (!token) return { ok: false, reason: "missing-token" };

  const minScore = Number(process.env.RECAPTCHA_MIN_SCORE ?? "0.5");
  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  let data: { success: boolean; score?: number; action?: string };
  try {
    const res = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    data = (await res.json()) as typeof data;
  } catch {
    return { ok: false, reason: "verify-error" };
  }

  if (!data.success) return { ok: false, reason: "failed" };
  if (data.action && data.action !== action) return { ok: false, reason: "bad-action" };
  if (typeof data.score === "number" && data.score < minScore) {
    return { ok: false, reason: "low-score" };
  }
  return { ok: true };
}
