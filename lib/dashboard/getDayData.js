import { formatDay } from "@/lib/format";

// بيجيب كل داتا الداشبورد ليوم واحد ويجهزها للعرض:
// الحجوزات + أنواع الزيارات + اسم الموظف + سجل كل رقم + سجل التعديلات + ملخص اليوم
export async function getDayData(supabase, { day, userId }) {
  const [bookingsRes, typesRes, staffRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, slot_time, patient_name, phone, visit_type, booked_type, price, duration_min, source, created_by_name, created_at")
      .eq("slot_date", day)
      .eq("status", "confirmed")
      .order("slot_time"),
    supabase.from("visit_types").select("code, name_ar, price, duration_min").order("sort"),
    supabase.from("staff").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const bookings = bookingsRes.data ?? [];
  const visitTypes = Object.fromEntries((typesRes.data ?? []).map((t) => [t.code, t]));

  const [history, changesByBooking] = await Promise.all([
    getPhoneHistory(supabase, bookings, day),
    getChanges(supabase, bookings),
  ]);

  const rows = bookings.map((b) => {
    const h = history[b.phone] ?? { visits: 0, lastVisit: null, lastKashf: null };
    return {
      ...b,
      visits: h.visits,
      check: checkVisitType(b.visit_type, h, day),
      changes: changesByBooking[b.id] ?? [],
    };
  });

  return {
    error: bookingsRes.error,
    rows,
    visitTypes,
    staff: splitStaffName(staffRes.data),
    summary: {
      count: rows.length,
      revenue: rows.reduce((sum, b) => sum + (b.price ?? 0), 0),
      byType: Object.values(visitTypes)
        .map((t) => ({ name: t.name_ar, count: rows.filter((b) => b.visit_type === t.code).length }))
        .filter((t) => t.count > 0),
    },
  };
}

// اسم الموظف والشفت (ولو الشفت مش متسجل لوحده والاسم "الاسم - الشفت"، نقسمه)
function splitStaffName(staff) {
  if (!staff?.name) return null;
  if (staff.shift) return { name: staff.name, shift: staff.shift };
  const [name, ...rest] = staff.name.split(" - ");
  return { name: name.trim(), shift: rest.join(" - ").trim() || null };
}

// سجل كل رقم قبل اليوم ده: عدد الزيارات + آخر زيارة + آخر كشف
async function getPhoneHistory(supabase, bookings, day) {
  const phones = [...new Set(bookings.map((b) => b.phone))];
  if (phones.length === 0) return {};

  const { data: past } = await supabase
    .from("bookings")
    .select("phone, slot_date, visit_type")
    .in("phone", phones)
    .eq("status", "confirmed")
    .lt("slot_date", day)
    .order("slot_date", { ascending: false });

  const history = {};
  for (const p of past ?? []) {
    const h = (history[p.phone] ??= { visits: 0, lastVisit: null, lastKashf: null });
    h.visits += 1;
    h.lastVisit ??= p.slot_date; // مترتبين من الأحدث، فأول واحد هو الأخير
    if (p.visit_type === "kashf") h.lastKashf ??= p.slot_date;
  }
  return history;
}

// سجل التعديلات بتاع حجوزات اليوم
async function getChanges(supabase, bookings) {
  if (bookings.length === 0) return {};

  const { data } = await supabase
    .from("booking_changes")
    .select("id, booking_id, action, old_type, new_type, old_price, new_price, reason, changed_by_name, changed_at")
    .in("booking_id", bookings.map((b) => b.id))
    .order("changed_at");

  const byBooking = {};
  for (const c of data ?? []) (byBooking[c.booking_id] ??= []).push(c);
  return byBooking;
}

// التأكيد من سجل الرقم: إعادة الكشف لازم كشف خلال أسبوعين، والمتابعة لازم زيارة قبل كده
function checkVisitType(type, h, day) {
  const short = (date) => {
    const x = formatDay(date);
    return `${x.day} ${x.month}`;
  };

  if (type === "reexam") {
    const from = new Date(day + "T12:00:00Z");
    from.setUTCDate(from.getUTCDate() - 14);
    const reexamFrom = from.toISOString().slice(0, 10);
    return h.lastKashf && h.lastKashf >= reexamFrom
      ? { ok: true, text: `آخر كشف: ${short(h.lastKashf)}` }
      : { ok: false, text: "مفيش كشف خلال أسبوعين بالرقم ده" };
  }

  if (type === "followup") {
    return h.lastVisit
      ? { ok: true, text: `آخر زيارة: ${short(h.lastVisit)}` }
      : { ok: false, text: "مفيش زيارات قبل كده بالرقم ده" };
  }

  return null;
}
