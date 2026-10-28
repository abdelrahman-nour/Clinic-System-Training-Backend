// التأكد من Cloudflare Turnstile على السيرفر (إن اللي بيحجز إنسان مش بوت)
// المفاتيح في .env.local:
//   NEXT_PUBLIC_TURNSTILE_SITE_KEY  ← بيظهر في المتصفح (عادي)
//   TURNSTILE_SECRET_KEY            ← سري، على السيرفر بس
//
// وإنت بتجرب على جهازك من غير مفاتيح: بنستخدم مفاتيح التجربة بتاعة Cloudflare (بتعدّي دايماً)
// على Vercel لازم المفاتيح الحقيقية، وإلا الحجز هيقف (أحسن من إنه يشتغل من غير حماية)

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const DEV_TEST_SECRET = "1x0000000000000000000000000000000AA";

function secretKey() {
  if (process.env.TURNSTILE_SECRET_KEY) return process.env.TURNSTILE_SECRET_KEY;
  if (process.env.NODE_ENV !== "production") return DEV_TEST_SECRET;
  return null;
}

export async function verifyTurnstile(token, ip) {
  const secret = secretKey();
  if (!secret) {
    console.error("[turnstile] TURNSTILE_SECRET_KEY مش موجود");
    return false;
  }
  if (typeof token !== "string" || token.length < 10 || token.length > 2048) return false;

  const body = new URLSearchParams({ secret, response: token });
  if (ip) body.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, { method: "POST", body, signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    if (!data.success) console.warn("[turnstile] failed:", data["error-codes"]);
    return data.success === true;
  } catch (err) {
    console.error("[turnstile] request error:", err?.message);
    return false;
  }
}
