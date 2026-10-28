import Image from "next/image";
import { clinic } from "@/config/clinic";
import LoginForm from "./login-form";

export const metadata = {
  title: `دخول السكرتارية | ${clinic.doctorName}`,
  robots: { index: false, follow: false }, // جوجل ميظهرش الصفحة دي في البحث
};

export default function LoginPage() {
  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-white">
      {/* البيانات (على اليمين في RTL) */}
      <div className="flex items-center justify-center px-5 py-10 md:py-12 order-2 md:order-1">
        <LoginForm />
      </div>

      {/* البانل البنفسجي */}
      <div className="relative overflow-hidden bg-primary text-white flex flex-col items-center justify-center gap-2 md:gap-3.5 px-6 py-9 md:p-12 text-center order-1 md:order-2">
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-accent/20 blur-3xl animate-float" />
        <Image
          src="/doctor.jpg"
          alt=""
          width={120}
          height={120}
          priority
          className="relative size-18 md:size-30 rounded-full object-cover object-[50%_18%] border-4 border-accent animate-scale-in"
        />
        <span className="relative text-[22px] md:text-[30px] font-extrabold animate-fade-up">عيادة {clinic.doctorName}</span>
        <span className="hidden md:block text-[#E4D6EC]">{clinic.specialty}</span>
        <span className="hidden md:inline-block mt-3 text-[13px] font-semibold px-3.5 py-1.5 rounded-full bg-white/12 text-[#F3E6FA]">
          لوحة تحكم السكرتارية
        </span>
      </div>
    </div>
  );
}
