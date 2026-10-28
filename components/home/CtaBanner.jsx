import Reveal from "@/components/ui/Reveal";
import Button, { ButtonArrow } from "@/components/ui/Button";

// شريط "جاهز تحجز ميعادك؟" قبل الفوتر
export default function CtaBanner() {
  return (
    <section className="py-14 md:py-20">
      <div className="max-w-290 mx-auto px-4 md:px-6">
        <Reveal className="relative overflow-hidden bg-primary text-white rounded-[28px] px-6 md:px-10 py-10 md:py-12 flex flex-wrap items-center justify-between gap-6">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -left-16 size-64 rounded-full bg-accent/20 blur-3xl animate-float" />
          <div className="relative flex flex-col gap-2">
            <h2 className="text-[26px] md:text-3xl font-extrabold">جاهز تحجز ميعادك؟</h2>
            <p className="text-[#E4D6EC]">اختار الوقت المناسب ليك من المواعيد الفاضية.</p>
          </div>
          <Button href="/book" size="lg" className="relative w-full sm:w-auto sm:px-10">
            احجز الآن
            <ButtonArrow />
          </Button>
        </Reveal>
      </div>
    </section>
  );
}
