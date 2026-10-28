import Reveal from "@/components/ui/Reveal";
import SectionTitle from "@/components/site/SectionTitle";

const STEPS = [
  ["اختار نوع الزيارة واليوم", "كشف أو إعادة كشف أو متابعة، في أي يوم خلال الأسبوعين الجايين."],
  ["اختار الساعة", "هيظهرلك المواعيد الفاضية بس، فمش هتحجز ميعاد متاخد."],
  ["اكتب اسمك ورقمك", "وخلاص، الميعاد اتحجز باسمك وهيظهرلك ملخص الحجز."],
];

// "احجز في 3 خطوات"
export default function Steps() {
  return (
    <section className="py-16 md:py-24">
      <div className="max-w-290 mx-auto px-4 md:px-6 flex flex-col gap-10">
        <Reveal>
          <SectionTitle eyebrow="الحجز" title="احجز في 3 خطوات" />
        </Reveal>

        <ol className="grid md:grid-cols-3 gap-4 md:gap-5">
          {STEPS.map(([title, text], i) => (
            <Reveal
              as="li"
              key={title}
              delay={i * 120}
              className="relative flex flex-col gap-3 bg-white border border-line rounded-[20px] p-7 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-accent/50"
            >
              <span className="text-[40px] font-extrabold text-accent leading-none">{i + 1}</span>
              <h3 className="text-xl font-bold">{title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5C5363]">{text}</p>
              {/* رقم كبير باهت في الخلفية */}
              <span aria-hidden="true" className="absolute -top-4 left-3 text-[110px] font-extrabold text-primary/5 leading-none select-none">
                {i + 1}
              </span>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
