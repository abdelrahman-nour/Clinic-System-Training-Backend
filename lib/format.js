import { clinic } from "@/config/clinic";

// "2026-10-28" ← { weekday: "الأربعاء", day: 28, month: "أكتوبر" }
export function formatDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00Z");
  const opts = (o) =>
    new Intl.DateTimeFormat("ar-EG", { ...o, timeZone: "UTC" }).format(d);

  return {
    weekday: opts({ weekday: "long" }),
    day: d.getUTCDate(),
    month: opts({ month: "long" }),
  };
}

// "17:20" ← "5:20 م"
export function formatTime(time) {
  const [h, m] = time.split(":").map(Number);
  const hour12 = h % 12 || 12;
  const period = h < 12 ? "ص" : "م";
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

// "4:00 م – 10:00 م" (ساعات العيادة من config/clinic.js)
export function clinicHours() {
  return `${formatTime(clinic.startTime)} – ${formatTime(clinic.endTime)}`;
}
