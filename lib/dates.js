// تنسيق التواريخ والأوقات بتوقيت القاهرة (للتواريخ اللي جاية من الداتابيز زي created_at)

// "28 أكتوبر، 5:12 م"
export const cairoDateTime = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  timeZone: "Africa/Cairo",
  day: "numeric",
  month: "long",
  hour: "numeric",
  minute: "2-digit",
});

// "5:12 م"
export const cairoClock = new Intl.DateTimeFormat("ar-EG-u-nu-latn", {
  timeZone: "Africa/Cairo",
  hour: "numeric",
  minute: "2-digit",
});

// "2026-10-28" (اليوم بتوقيت القاهرة)
export const cairoDateKey = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
