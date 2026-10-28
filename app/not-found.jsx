import Image from "next/image";
import { clinic } from "@/config/clinic";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Button from "@/components/ui/Button";

export const metadata = {
  title: `الصفحة مش موجودة | ${clinic.doctorName}`,
  robots: { index: false, follow: false },
};

// بتظهر لأي لينك مش موجود في الموقع
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="logo" />

      <main className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-[480px] flex flex-col items-center gap-4 text-center">
          <div className="relative mb-3 animate-scale-in">
            <Image
              src="/doctor.jpg"
              alt={clinic.doctorName}
              width={160}
              height={160}
              priority
              className="size-32 md:size-40 rounded-full object-cover object-[50%_15%] border-4 border-accent shadow-lg"
            />
            <span
              className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-primary text-white text-sm font-extrabold animate-pop"
              style={{ animationDelay: "250ms" }}
            >
              404
            </span>
          </div>

          <div className="flex flex-col gap-4 animate-fade-up" style={{ animationDelay: "150ms" }}>
            <h1 className="text-2xl md:text-[28px] font-extrabold">الصفحة دي مش موجودة</h1>
            <p className="text-muted leading-relaxed">
              ممكن يكون اللينك غلط أو الصفحة اتنقلت. تقدر ترجع للرئيسية، أو تحجز ميعادك على طول.
            </p>
          </div>

          <div className="w-full flex flex-wrap gap-2.5 mt-2 animate-fade-up" style={{ animationDelay: "250ms" }}>
            <Button href="/book" className="flex-1 basis-44">
              احجز ميعادك
            </Button>
            <Button href="/" variant="outline" className="flex-1 basis-44">
              الرئيسية
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter variant="simple" />
    </div>
  );
}
