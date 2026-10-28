import { clinic } from "@/config/clinic";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import SectionTitle from "@/components/site/SectionTitle";

// الخدمات (من config/clinic.js ← services)
export default function Services() {
  return (
    <section id="services" className="scroll-mt-20 py-16 md:py-24 bg-white">
      <div className="max-w-290 mx-auto px-4 md:px-6 flex flex-col gap-10">
        <Reveal>
          <SectionTitle eyebrow="الخدمات" title="بنعالج إيه في العيادة؟" />
        </Reveal>

        <ul className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
          {clinic.services.map((s, i) => (
            <Reveal
              as="li"
              key={s.title}
              delay={i * 100}
              className="group flex flex-col gap-3.5 bg-bg rounded-[20px] p-6 border border-transparent transition-all duration-300 hover:-translate-y-1.5 hover:bg-white hover:border-line hover:shadow-[0_20px_40px_-20px_rgba(75,29,94,0.35)]"
            >
              <span className="size-13 rounded-[14px] bg-primary text-white flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6">
                <Icon name={s.icon} size={26} strokeWidth={1.8} />
              </span>
              <h3 className="text-lg font-bold">{s.title}</h3>
              <p className="text-[15px] leading-relaxed text-[#5C5363]">{s.text}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
