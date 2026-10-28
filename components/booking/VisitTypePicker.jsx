import Icon from "@/components/ui/Icon";

// اختيار نوع الزيارة (كشف / إعادة كشف / متابعة) + تنبيه الروشتة
export default function VisitTypePicker({ types, value, onChange }) {
  if (types.length === 0) {
    return (
      <p className="rounded-2xl bg-danger-soft px-4 py-4 text-center font-bold text-danger">
        معرفناش نجيب أنواع الزيارات، اعمل ريفرش للصفحة.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5" role="radiogroup" aria-label="نوع الزيارة">
        {types.map((t) => {
          const active = t.code === value;
          return (
            <button
              key={t.code}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(t.code)}
              className={`rounded-2xl border px-4 py-3 flex sm:flex-col items-center sm:items-start justify-between gap-1 text-right transition-all duration-200 active:scale-[0.98] ${
                active
                  ? "bg-primary border-primary text-white shadow-[0_12px_26px_-12px_rgba(75,29,94,0.8)]"
                  : "bg-white border-line hover:border-primary hover:-translate-y-0.5"
              }`}
            >
              <span className="text-lg font-extrabold">{t.name_ar}</span>
              <span className={`text-sm font-semibold ${active ? "text-white/85" : "text-[#B4610A]"}`}>{t.price} جنيه</span>
            </button>
          );
        })}
      </div>

      {value !== "kashf" && (
        <div role="note" className="flex gap-3 items-start bg-accent-soft rounded-2xl px-4 py-3.5 animate-fade-up">
          <Icon name="file" size={22} className="text-[#B4610A] mt-0.5" />
          <p className="text-sm leading-relaxed">
            <strong>لازم تجيب الروشتة معاك</strong> وتوريها للسكرتيرة قبل ما تدخل.
            {value === "reexam" && " إعادة الكشف بتبقى خلال أسبوعين من الكشف."} لو مش مطابقة، هيتحسب كشف جديد.
          </p>
        </div>
      )}
    </>
  );
}
