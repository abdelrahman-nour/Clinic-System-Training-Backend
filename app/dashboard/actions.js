"use server";

import { refresh } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// أي Server Action ممكن حد يناديها من بره الصفحة، فلازم كل action تتأكد من الـ login بنفسها
async function requireStaff() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  return auth?.claims ? supabase : null;
}

function cleanReason(reason) {
  return typeof reason === "string" ? reason.trim().slice(0, 200) : "";
}

// أكواد الإيرور اللي بترجع من الـ functions في الداتابيز
function messageFor(error, fallback) {
  console.error("[dashboard action]", error.code, error.message);
  if (error.code === "22023") return "لازم تكتب سبب التعديل (3 حروف على الأقل).";
  if (error.code === "42501") return "حسابك مش متسجل كموظف. كلّم المسؤول عن الموقع.";
  if (error.code === "P0002") return "الحجز ده اتلغى أو مش موجود.";
  if (error.code === "23514" || error.code === "23503") return "نوع الزيارة ده مش موجود.";
  return fallback;
}

// إلغاء حجز (لازم سبب). الداتابيز بتسجل مين لغى وإمتى لوحدها
export async function cancelBooking(id, reason) {
  const supabase = await requireStaff();
  if (!supabase) return { error: "انتهت الجلسة، اعمل login تاني." };

  if (typeof id !== "string" || !UUID_RE.test(id)) return { error: "الحجز ده مش موجود." };
  const why = cleanReason(reason);
  if (why.length < 3) return { error: "لازم تكتب سبب الإلغاء (3 حروف على الأقل)." };

  const { error } = await supabase.rpc("cancel_booking", { p_booking: id, p_reason: why });
  refresh();

  if (error) return { error: messageFor(error, "معرفناش نلغي الحجز، اتأكد من النت وجرّب تاني.") };
  return { ok: true };
}

// تغيير نوع الزيارة (لازم سبب). السعر بيتغير لوحده من الداتابيز
export async function changeVisitType(id, code, reason) {
  const supabase = await requireStaff();
  if (!supabase) return { error: "انتهت الجلسة، اعمل login تاني." };

  if (typeof id !== "string" || !UUID_RE.test(id) || typeof code !== "string") {
    return { error: "بيانات غلط." };
  }
  const why = cleanReason(reason);
  if (why.length < 3) return { error: "لازم تكتب سبب التعديل (3 حروف على الأقل)." };

  const { error } = await supabase.rpc("change_visit_type", { p_booking: id, p_type: code, p_reason: why });
  refresh();

  if (error) return { error: messageFor(error, "معرفناش نغيّر النوع، جرّب تاني.") };
  return { ok: true };
}

const PHONE_RE = /^01[0125][0-9]{8}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

// حجز من المكتب (للي بيتصل أو جاي بنفسه)
// الداتابيز بتتأكد إن الميعاد صح، وبتسجل إنه "من المكتب" وباسم السكرتيرة لوحدها
export async function createBooking(input) {
  const supabase = await requireStaff();
  if (!supabase) return { error: "انتهت الجلسة، اعمل login تاني." };

  const day = String(input?.day ?? "");
  const time = String(input?.time ?? "");
  const name = String(input?.name ?? "").trim();
  const phone = String(input?.phone ?? "").trim();
  const type = String(input?.type ?? "");

  if (!DATE_RE.test(day) || !TIME_RE.test(time)) return { error: "اختار الميعاد." };
  if (name.length < 2 || name.length > 60) return { error: "الاسم لازم يكون من 2 لـ 60 حرف." };
  if (!PHONE_RE.test(phone)) return { error: "الرقم لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015." };

  const { error } = await supabase.from("bookings").insert({
    slot_date: day,
    slot_time: time,
    patient_name: name,
    phone,
    visit_type: type,
  });

  refresh();

  if (!error) return { ok: true };

  console.error("[createBooking]", error.code, error.message);
  if (error.code === "23505" && error.message.includes("one_booking_per_phone_day")) {
    return { error: "الرقم ده عنده حجز في اليوم ده بالفعل." };
  }
  if (error.code === "23505") return { error: "الميعاد ده اتحجز لسه، اختار ميعاد تاني.", slotTaken: true };
  if (error.code === "42501") return { error: "الميعاد ده مش متاح (عدّى أو بره ساعات العمل)، أو حسابك مش متسجل كموظف." };
  if (error.code === "23503" || error.code === "23514") return { error: "نوع الزيارة ده مش موجود." };
  return { error: "معرفناش نحفظ الحجز، اتأكد من النت وجرّب تاني." };
}
