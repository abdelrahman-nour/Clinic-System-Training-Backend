import Link from "next/link";
import { formatDay } from "@/lib/format";

// صف الأيام (بيتسكرول بالعرض على الموبايل، وبينزل سطرين على الكمبيوتر)
//
// طريقتين للاستخدام:
//   <DayChips days={days} selected={day} onSelect={setDay} />          ← زراير (صفحة الحجز / حجز المكتب)
//   <DayChips days={days} selected={day} hrefFor={(d) => `/x?day=${d}`} /> ← لينكات (الداشبورد)
//
// size: md | sm

export default function DayChips({
  days,
  selected,
  onSelect,
  hrefFor,
  size = "md",
  label = "اختار اليوم",
}) {
  const box = size === "sm" ? "w-[64px] h-[74px]" : "w-[76px] h-[88px]";
  const num = size === "sm" ? "text-xl" : "text-2xl";

  return (
    <div
      className="flex gap-2.5 overflow-x-auto no-scrollbar md:flex-wrap md:overflow-visible"
      role="group"
      aria-label={label}
    >
      {days.map((d) => {
        const f = formatDay(d);
        const active = d === selected;
        const cls = `shrink-0 ${box} rounded-2xl border flex flex-col items-center justify-center transition-all duration-200 active:scale-95 ${
          active
            ? "bg-primary border-primary text-white shadow-[0_10px_22px_-10px_rgba(75,29,94,0.8)]"
            : "bg-white border-line hover:border-primary hover:-translate-y-0.5"
        }`;

        const inner = (
          <>
            <span
              className={`text-xs font-medium ${active ? "text-white/80" : "text-muted"}`}
            >
              {f.weekday}
            </span>
            <span className={`${num} font-extrabold leading-snug`}>
              {f.day}
            </span>
            <span
              className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}
            >
              {f.month}
            </span>
          </>
        );

        return hrefFor ? (
          <Link
            key={d}
            href={hrefFor(d)}
            scroll={false}
            aria-current={active ? "page" : undefined}
            className={cls}
          >
            {inner}
          </Link>
        ) : (
          <button
            key={d}
            type="button"
            onClick={() => onSelect(d)}
            aria-pressed={active}
            className={cls}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
