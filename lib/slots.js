import { clinic } from "@/config/clinic";

// "16:30" ← 990 دقيقة
function toMinutes(time) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

// 990 ← "16:30"
function toTime(minutes) {
  const h = String(Math.floor(minutes / 60)).padStart(2, "0");
  const m = String(minutes % 60).padStart(2, "0");
  return `${h}:${m}`;
}

// كل مواعيد اليوم (ميعاد بيبدأ كل slotStep دقيقة)
export function generateSlots() {
  const start = toMinutes(clinic.startTime);
  const end = toMinutes(clinic.endTime);
  const slots = [];

  for (let t = start; t + clinic.slotStep <= end; t += clinic.slotStep) {
    slots.push(toTime(t));
  }

  return slots;
}

// التاريخ والوقت دلوقتي بتوقيت القاهرة
export function cairoNow() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const get = (type) => parts.find((p) => p.type === type).value;

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`, // "2026-10-28"
    minutes: Number(get("hour")) * 60 + Number(get("minute")), // 01:51 ← 111
  };
}

// الأيام اللي العيادة شغالة فيها خلال الفترة الجاية
export function generateDays() {
  const today = new Date(cairoNow().date + "T12:00:00Z");
  const days = [];

  for (let i = 0; i < clinic.daysAhead; i++) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() + i);

    if (clinic.workDays.includes(d.getUTCDay())) {
      days.push(d.toISOString().slice(0, 10)); // "2026-10-28"
    }
  }

  return days;
}

// المواعيد الفاضية في يوم معين
export function getAvailableSlots(date, takenSlots) {
  const taken = takenSlots.map((t) => t.slice(0, 5)); // "17:20:00" ← "17:20"
  const now = cairoNow();

  return generateSlots().filter((slot) => {
    if (taken.includes(slot)) return false; // محجوز
    if (date === now.date && toMinutes(slot) <= now.minutes) return false; // عدّى
    return true;
  });
}

// آخر ميعاد في اليوم (بيبدأ قبل القفل بـ slotStep): "21:30"
export function lastSlotTime() {
  return toTime(toMinutes(clinic.endTime) - clinic.slotStep);
}
