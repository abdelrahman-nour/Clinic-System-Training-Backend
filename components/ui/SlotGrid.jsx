import { formatTime } from "@/lib/format";
import { buttonClass } from "./Button";

// جريد المواعيد الفاضية + حالات التحميل والإيرور والفاضي
// <SlotGrid slots={["16:00", ...]} selected={slot} onSelect={setSlot} loading={...} error={...} onRetry={...} />

export default function SlotGrid({ slots, selected, onSelect, loading, error, onRetry, size = "md" }) {
  const h = size === "sm" ? "h-11 text-[15px]" : "h-[50px] text-base";

  if (loading) {
    return (
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5" aria-busy="true" aria-label="جاري تحميل المواعيد">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`${h} rounded-xl bg-line/70 animate-pulse`} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl bg-danger-soft px-4 py-5 flex flex-col items-center gap-3 text-center animate-fade-in">
        <p className="font-bold text-danger">معرفناش نجيب المواعيد، اتأكد من النت.</p>
        <button type="button" onClick={onRetry} className={buttonClass({ variant: "outline", size: "sm" })}>
          جرّب تاني
        </button>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border-[1.5px] border-dashed border-[#DCD3E3] px-5 py-8 flex flex-col items-center gap-1.5 text-center animate-fade-in">
        <p className="text-lg font-extrabold">مفيش مواعيد فاضية اليوم ده</p>
        <p className="text-sm text-muted">كل المواعيد اتحجزت، جرّب تختار يوم تاني.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5" role="group" aria-label="المواعيد الفاضية">
      {slots.map((slot, i) => {
        const active = slot === selected;
        return (
          <button
            key={slot}
            type="button"
            onClick={() => onSelect(slot)}
            aria-pressed={active}
            style={{ animationDelay: `${i * 25}ms` }}
            className={`${h} rounded-xl border animate-fade-in transition-all duration-200 active:scale-95 ${
              active
                ? "bg-accent border-accent text-primary-dark font-extrabold shadow-[0_10px_22px_-10px_rgba(247,148,29,0.9)]"
                : "bg-white border-line text-primary font-semibold hover:border-primary hover:bg-primary-soft"
            }`}
          >
            {formatTime(slot)}
          </button>
        );
      })}
    </div>
  );
}
