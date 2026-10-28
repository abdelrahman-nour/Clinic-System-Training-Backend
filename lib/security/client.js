import { createHash } from "node:crypto";
import { headers } from "next/headers";

// IP الزائر (Vercel بيحطه في x-forwarded-for)
export async function clientIp() {
  const h = await headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return h.get("x-real-ip") ?? "local";
}

// بصمة للجهاز/الشبكة من غير ما نخزن الـ IP نفسه (خصوصية المريض)
// بتستخدم كلمة سر السيرفر كـ salt، فمحدش يقدر يرجّعها لـ IP
export function clientHash(ip) {
  return createHash("sha256").update(`${process.env.BOOKING_SERVER_SECRET}:${ip}`).digest("hex");
}
