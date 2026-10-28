import Link from "next/link";
import { clinic } from "@/config/clinic";
import { clinicHours } from "@/lib/format";

// الفوتر بتاع الصفحات العامة
// variant: "full" (الرئيسية) | "simple" (الحجز و 404)
export default function SiteFooter({ variant = "full" }) {
  const year = new Date().getFullYear();

  if (variant === "simple") {
    return (
      <footer className="bg-white border-t border-line">
        <div className="max-w-290 mx-auto px-4 md:px-6 py-5 flex flex-wrap justify-between gap-3 text-[13px] text-muted">
          <span>
            © {year} {clinic.doctorName}
          </span>
          <span>
            {clinic.workDaysLabel} · {clinicHours()}
          </span>
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-primary-dark text-white pt-12 pb-7">
      <div className="max-w-290 mx-auto px-4 md:px-6 flex flex-col gap-8">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex flex-col gap-1.5 max-w-90">
            <span className="text-xl font-extrabold">{clinic.doctorName}</span>
            <span className="text-sm text-[#CDB8D9]">{clinic.specialty}</span>
          </div>
          <nav className="flex flex-wrap gap-6 text-[15px] font-semibold" aria-label="روابط الفوتر">
            <a href="#about" className="text-white/75 hover:text-white transition-colors">عن الدكتور</a>
            <a href="#services" className="text-white/75 hover:text-white transition-colors">الخدمات</a>
            <a href="#info" className="text-white/75 hover:text-white transition-colors">المواعيد والعنوان</a>
            <Link href="/book" className="text-white/75 hover:text-white transition-colors">احجز الآن</Link>
          </nav>
        </div>
        <div className="flex flex-wrap justify-between gap-4 pt-5 border-t border-white/12 text-[13px] text-[#B9A6C6]">
          <span>
            © {year} {clinic.doctorName}. كل الحقوق محفوظة.
          </span>
          <Link href="/login" className="hover:text-white transition-colors">
            دخول السكرتارية
          </Link>
        </div>
      </div>
    </footer>
  );
}
