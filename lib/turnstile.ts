/**
 * Cloudflare Turnstile — التحقق من رمز النموذج.
 * المفتاح العام يُستخدم في الواجهة، والمفتاح السري للسيرفر فقط.
 */

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";

export function isTurnstileEnabled(): boolean {
  return Boolean(TURNSTILE_SITE_KEY && process.env.TURNSTILE_SECRET_KEY);
}

export type TurnstileResult = { ok: boolean; error?: string; skipped?: boolean };

/** يتحقق من رمز Turnstile. إذا لم تُضبط المفاتيح يتخطى التحقق (بيئة تطوير). */
export async function verifyTurnstile(
  token: string | undefined,
  remoteIp?: string | null,
): Promise<TurnstileResult> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  if (!TURNSTILE_SITE_KEY || !secret) {
    return { ok: true, skipped: true };
  }

  if (!token) return { ok: false, error: "رمز التحقق (Turnstile) مفقود." };

  try {
    const body = new URLSearchParams({ secret, response: token });
    if (remoteIp) body.set("remoteip", remoteIp);

    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      { method: "POST", body, signal: AbortSignal.timeout(8000) },
    );
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (data.success) return { ok: true };
    return {
      ok: false,
      error: `فشل التحقق من Turnstile (${(data["error-codes"] ?? []).join(", ") || "unknown"}).`,
    };
  } catch {
    return { ok: false, error: "تعذّر الوصول إلى خدمة التحقق." };
  }
}

/** استخراج IP العميل من ترويسات الطلب */
export function getClientIp(req: Request): string | null {
  const h = req.headers;
  return (
    h.get("cf-connecting-ip") ??
    h.get("x-nf-client-connection-ip") ??
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    null
  );
}
