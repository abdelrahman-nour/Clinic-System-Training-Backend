import Link from "next/link";
import Image from "next/image";
import { clinic } from "@/config/clinic";
import { logout } from "@/app/login/actions";
import Icon from "@/components/ui/Icon";

const iconBtn =
  "inline-flex items-center justify-center gap-2 size-11 md:size-auto md:min-h-11 md:px-4 rounded-xl bg-white/12 hover:bg-white/20 font-semibold text-sm transition-colors";

// الهيدر البنفسجي بتاع الداشبورد
// staff: { name, shift } — page: "bookings" | "log" (عشان نعرض اللينك التاني)
export default function DashboardHeader({ staff, page = "bookings" }) {
  return (
    <header className="bg-primary text-white">
      <div className="max-w-290 mx-auto px-4 md:px-6 min-h-16 md:min-h-18 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0 animate-fade-in">
          <Image
            src="/doctor.jpg"
            alt=""
            width={44}
            height={44}
            className="shrink-0 size-10 md:size-11 rounded-full object-cover object-[50%_18%] border-2 border-accent"
          />
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-normal text-[#E4D6EC] leading-5">
              {page === "log" ? "سجل التعديلات" : staff ? "مرحباً" : "لوحة الحجوزات"}
            </span>
            <span className="text-base md:text-lg font-bold truncate leading-6">
              {staff?.name ?? `عيادة ${clinic.doctorName}`}
            </span>
            {staff?.shift && <span className="text-xs font-normal text-[#CDB8D9] truncate leading-5">{staff.shift}</span>}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          {page === "log" ? (
            <Link href="/dashboard" aria-label="الحجوزات" className={iconBtn}>
              <Icon name="calendar" size={18} />
              <span className="hidden md:inline">الحجوزات</span>
            </Link>
          ) : (
            <Link href="/dashboard/log" aria-label="سجل التعديلات" className={iconBtn}>
              <Icon name="history" size={18} />
              <span className="hidden md:inline">سجل التعديلات</span>
            </Link>
          )}
          <form action={logout}>
            <button type="submit" aria-label="خروج" className={iconBtn}>
              <Icon name="logout" size={18} />
              <span className="hidden md:inline">خروج</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
