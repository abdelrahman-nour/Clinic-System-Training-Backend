"use server";

import { createAnonClient } from "@/lib/supabase/anon";
import { verifyTurnstile } from "@/lib/security/turnstile";
import { clientIp, clientHash } from "@/lib/security/client";
import { isValidPhone } from "@/lib/phone";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

// حجز المريض من الموقع
// الترتيب: نتأكد من البيانات ← Turnstile ← الداتابيز (كلمة سر السيرفر + الحد الأقصى + قواعد الميعاد)
// بيرجع { ok: true } أو { error, slotTaken? }
export async function bookOnline({ day, time, name, phone, type, token } = {}) {
  const cleanName = typeof name === "string" ? name.trim() : "";
  const cleanPhone = typeof phone === "string" ? phone.trim() : "";

  if (
    typeof day !== "string" || !DATE_RE.test(day) ||
    typeof time !== "string" || !TIME_RE.test(time) ||
    typeof type !== "string" ||
    cleanName.length < 2 || cleanName.length > 60 ||
    !isValidPhone(cleanPhone)
  ) {
    return { error: "اتأكد من الاسم ورقم الموبايل وجرّب تاني." };
  }

  if (!process.env.BOOKING_SERVER_SECRET) {
    console.error("[bookOnline] BOOKING_SERVER_SECRET مش موجود في .env.local");
    return { error: "الحجز أونلاين واقف دلوقتي. كلّم العيادة." };
  }

  const ip = await clientIp();
  const human = await verifyTurnstile(token, ip);
  if (!human) {
    return { error: "معرفناش نتأكد إنك مش روبوت. جرّب تاني.", retryCheck: true };
  }

  const supabase = createAnonClient();
  const { error } = await supabase.rpc("book_online", {
    p_secret: process.env.BOOKING_SERVER_SECRET,
    p_client: clientHash(ip),
    p_date: day,
    p_time: time,
    p_name: cleanName,
    p_phone: cleanPhone,
    p_type: type,
  });

  if (!error) return { ok: true };
  return messageFor(error);
}

// أكواد الإيرور اللي بترجع من book_online (supabase/008_spam_protection.sql)
function messageFor(error) {
  if (error.code === "23505" && error.message?.includes("one_booking_per_phone_day")) {
    return { error: "الرقم ده عنده حجز في اليوم ده بالفعل. لو عايز تغيّر الميعاد، كلّم العيادة." };
  }
  // حد سبقه للميعاد، أو الميعاد عدّى وهو بيكتب بياناته
  if (error.code === "23505" || error.code === "22023") return { slotTaken: true };

  if (error.code === "CB409") {
    return { error: "الرقم ده عنده حجزين جايين بالفعل. لو محتاج ميعاد تاني، كلّم العيادة." };
  }
  if (error.code === "CB429") {
    return { error: "اتعمل حجوزات كتير من الجهاز ده في وقت قصير. جرّب بعد شوية أو كلّم العيادة." };
  }

  // CB403 (كلمة السر مش زي اللي في الداتابيز) أو أي حاجة تانية
  console.error("[bookOnline]", error.code, error.message);
  return { error: "حصلت مشكلة وإحنا بنحفظ الحجز. جرّب تاني أو كلّم العيادة." };
}
