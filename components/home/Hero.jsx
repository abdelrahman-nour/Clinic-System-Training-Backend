import Image from "next/image";
import { clinic } from "@/config/clinic";
import { clinicHours } from "@/lib/format";
import Button, { ButtonArrow } from "@/components/ui/Button";

// أول قسم في الرئيسية: اسم الدكتور + زرار الحجز + الصورة
// كل سطر بيظهر بعد اللي قبله بشوية (animationDelay)
export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-primary-dark text-white">
      {/* إضاءة خفيفة في الخلفية */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -left-24 size-105 rounded-full bg-primary blur-3xl opacity-70 animate-float" />
        <div
          className="absolute -bottom-40 right-1/3 size-90 rounded-full bg-accent/25 blur-3xl animate-float"
          style={{ animationDelay: "-3s" }}
        />
      </div>

      <div className="relative max-w-290 mx-auto px-4 md:px-6 py-12 md:py-20 grid md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] gap-10 md:gap-14 items-center">
        <div className="flex flex-col gap-5 md:gap-6 order-2 md:order-1">
          <span
            className="self-start inline-flex items-center gap-2 text-sm font-semibold px-3.5 py-1.5 rounded-full bg-white/10 text-[#F3E6FA] animate-fade-up"
            style={{ animationDelay: "0ms" }}
          >
            <span
              className="size-2 rounded-full bg-[#3DDC84] animate-pulse"
              aria-hidden="true"
            />
            حجز أونلاين · في أقل من دقيقة
          </span>

          <h1
            className="text-[34px] sm:text-[42px] md:text-[56px] font-extrabold leading-normal animate-fade-up "
            style={{ animationDelay: "100ms" }}
          >
            <span className="text-accent">{clinic.doctorName}</span>
            <br />
            {clinic.specialty}
          </h1>

          <p
            className="text-base md:text-lg leading-loose text-[#E4D6EC] max-w-135 animate-fade-up"
            style={{ animationDelay: "200ms" }}
          >
            {clinic.university && <>خريج {clinic.university}. </>}
            اختار اليوم والساعة اللي تناسبك، والميعاد يتأكد لك على طول. من غير
            مكالمات ولا انتظار.
          </p>

          <div
            className="flex flex-wrap gap-3 animate-fade-up"
            style={{ animationDelay: "300ms" }}
          >
            <Button
              href="/book"
              size="lg"
              className="flex-1 sm:flex-none px-5 sm:px-8"
            >
              احجز ميعادك الآن
              <ButtonArrow />
            </Button>
            <Button
              href="#info"
              variant="ghost"
              size="lg"
              className="flex-1 sm:flex-none px-5 sm:px-8"
            >
              مواعيد العيادة
            </Button>
          </div>

          <dl
            className="flex flex-wrap gap-x-7 gap-y-3 pt-4 border-t border-white/15 animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            <div className="flex flex-col">
              <dt className="text-[13px] text-[#CDB8D9]">أيام العمل</dt>
              <dd className="font-bold">{clinic.workDaysLabel}</dd>
            </div>
            <div className="flex flex-col">
              <dt className="text-[13px] text-[#CDB8D9]">المواعيد</dt>
              <dd className="font-bold">{clinicHours()}</dd>
            </div>
          </dl>
        </div>

        <div
          className="order-1 md:order-2 animate-scale-in"
          style={{ animationDelay: "150ms" }}
        >
          <div className="relative max-w-110 mx-auto">
            {/* إطار برتقالي ورا الصورة */}
            <div
              aria-hidden="true"
              className="absolute inset-0 translate-x-3 translate-y-3 rounded-4xl border-2 border-accent/60"
            />
            <div className="relative aspect-square rounded-4xl overflow-hidden bg-primary shadow-[0_30px_60px_rgba(0,0,0,0.35)]">
              <Image
                src="/doctor.jpg"
                alt={clinic.doctorName}
                fill
                priority
                sizes="(max-width: 768px) 90vw, 440px"
                className="object-cover object-top"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
