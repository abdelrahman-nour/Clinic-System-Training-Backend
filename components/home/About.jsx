import { clinic } from "@/config/clinic";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";

// "عن الدكتور": النبذة + النقط (من config/clinic.js)
export default function About() {
  return (
    <section id="about" className="scroll-mt-20 py-16 md:py-24">
      <div className="max-w-290 mx-auto px-4 md:px-6 grid md:grid-cols-2 gap-8 md:gap-10 items-start">
        <Reveal className="flex flex-col gap-4">
          <span className="text-sm font-bold text-[#B4610A]">عن الدكتور</span>
          <h2 className="text-[28px] md:text-4xl font-extrabold leading-snug">{clinic.aboutTitle}</h2>
          <p className="text-[17px] leading-loose text-[#4A4150]">{clinic.about}</p>
        </Reveal>

        <ul className="flex flex-col gap-3">
          {clinic.highlights.map((h, i) => (
            <Reveal
              as="li"
              key={h}
              delay={i * 100}
              className="flex items-center gap-3.5 bg-white border border-line rounded-2xl px-5 py-4 transition-all duration-300 hover:border-primary/40 hover:-translate-x-1"
            >
              <span className="size-11 rounded-xl bg-primary-soft text-primary flex items-center justify-center">
                <Icon name="check" size={22} />
              </span>
              <span className="font-semibold">{h}</span>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
