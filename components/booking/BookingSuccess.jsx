import { clinic } from "@/config/clinic";
import { formatTime } from "@/lib/format";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

// شاشة "تم الحجز بنجاح" بملخص الحجز
export default function BookingSuccess({ dayLabel, slot, type, name, phone, onBookAgain }) {
  const rows = [
    ["الدكتور", clinic.doctorName],
    ["نوع الزيارة", type?.name_ar ?? ""],
    ["اليوم", dayLabel],
    ["الساعة", formatTime(slot), true],
    ["الاسم", name],
    ["الموبايل", phone],
    ["السعر", type ? `${type.price} جنيه` : "", true],
  ];

  return (
    <main className="flex-1 max-w-290 w-full mx-auto px-4 md:px-6 py-14 flex justify-center">
      <div className="w-full max-w-135 bg-white border border-line rounded-[28px] px-6 md:px-8 py-10 flex flex-col items-center gap-5 animate-scale-in">
        <span className="size-24 rounded-full bg-[#E6F6EE] text-[#17804A] flex items-center justify-center animate-pop" style={{ animationDelay: "150ms" }}>
          <Icon name="check" size={46} strokeWidth={2.6} />
        </span>

        <div className="text-center animate-fade-up" style={{ animationDelay: "250ms" }}>
          <h1 className="text-[28px] font-extrabold">تم الحجز بنجاح</h1>
          <p className="text-muted">ميعادك اتأكد، مستنيينك في العيادة.</p>
        </div>

        <dl className="w-full bg-bg rounded-2xl px-5 py-1 animate-fade-up" style={{ animationDelay: "350ms" }}>
          {rows.map(([label, value, highlight], i) => (
            <div key={label} className={`flex justify-between gap-3 py-3.5 ${i < rows.length - 1 ? "border-b border-line" : ""}`}>
              <dt className="text-muted">{label}</dt>
              <dd className={highlight ? "font-extrabold text-[#B4610A]" : "font-bold"} dir={label === "الموبايل" ? "ltr" : undefined}>
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <p className="w-full bg-accent-soft rounded-xl px-4 py-3 text-sm font-semibold animate-fade-up" style={{ animationDelay: "450ms" }}>
          الدفع في العيادة، ويا ريت توصل قبل ميعادك بـ 10 دقايق.
          {type && type.code !== "kashf" && " ومتنساش الروشتة، لو مش مطابقة هيتحسب كشف جديد."}
        </p>

        <div className="w-full flex flex-wrap gap-2.5 animate-fade-up" style={{ animationDelay: "550ms" }}>
          <Button variant="outline" onClick={onBookAgain} className="flex-1 basis-48">
            احجز ميعاد تاني
          </Button>
          <Button href="/" className="flex-1 basis-48">
            الرئيسية
          </Button>
        </div>
      </div>
    </main>
  );
}
