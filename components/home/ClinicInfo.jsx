import { clinic } from "@/config/clinic";
import { clinicHours, formatTime } from "@/lib/format";
import { lastSlotTime } from "@/lib/slots";
import { whatsappLink } from "@/lib/phone";
import Reveal from "@/components/ui/Reveal";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import SectionTitle from "@/components/site/SectionTitle";

// المواعيد + الأسعار + العنوان والخريطة
// prices: [{ code, name_ar, price }] جاية من جدول visit_types
export default function ClinicInfo({ prices = [] }) {
  // لو اتحط كود الـ iframe كله بدل اللينك، ناخد اللينك اللي جوه src بس
  const mapSrc = clinic.mapEmbedUrl.match(/src="([^"]+)"/)?.[1] ?? clinic.mapEmbedUrl;
  const showMap = mapSrc.startsWith("https://www.google.com/maps/embed");

  const hoursRows = [
    [clinic.workDaysLabel, clinicHours(), "text-primary"],
    [clinic.offDaysLabel, "إجازة", "text-muted"],
    ["آخر ميعاد", formatTime(lastSlotTime()), "text-primary"],
  ];

  return (
    <section id="info" className="scroll-mt-20 py-16 md:py-24 bg-white">
      <div className="max-w-290 mx-auto px-4 md:px-6 flex flex-col gap-10">
        <Reveal>
          <SectionTitle eyebrow="المواعيد والعنوان" title="تلاقينا فين وإمتى؟" />
        </Reveal>

        <div className="grid md:grid-cols-2 gap-5">
          <div className="flex flex-col gap-5">
            <Reveal>
              <InfoList rows={hoursRows} />
            </Reveal>
            {prices.length > 0 && (
              <Reveal delay={100}>
                <InfoList rows={prices.map((t) => [t.name_ar, `${t.price} جنيه`, "text-[#B4610A]"])} />
              </Reveal>
            )}
          </div>

          <Reveal delay={150} className="flex flex-col gap-4 bg-bg rounded-[20px] p-6">
            <p className="flex items-start gap-3">
              <Icon name="pin" size={22} className="text-primary mt-0.5" />
              <span className="font-semibold leading-relaxed">{clinic.address}</span>
            </p>

            {clinic.phone && (
              <a href={`tel:${clinic.phone}`} className="flex items-center gap-3 font-semibold hover:text-primary transition-colors">
                <Icon name="phone" size={22} className="text-primary" />
                <span dir="ltr">{clinic.phone}</span>
              </a>
            )}

            {clinic.whatsapp && (
              <Button href={whatsappLink(clinic.whatsapp)} variant="whatsapp" size="sm" className="self-start">
                <Icon name="whatsapp" size={18} />
                كلّمنا واتساب
              </Button>
            )}

            {showMap ? (
              <iframe
                src={mapSrc}
                title="موقع العيادة على الخريطة"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full flex-1 min-h-60 rounded-2xl border-0"
              />
            ) : (
              <div className="flex-1 min-h-45 rounded-2xl border-[1.5px] border-dashed border-[#CFC3D8] flex items-center justify-center text-sm font-semibold text-muted">
                [خريطة جوجل]
              </div>
            )}

            {clinic.mapUrl && (
              <a
                href={clinic.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group self-start inline-flex items-center gap-1 font-bold text-primary hover:text-primary-dark"
              >
                افتح على جوجل ماب
                <span className="transition-transform duration-300 group-hover:-translate-x-1">
                  <Icon name="arrow" size={18} />
                </span>
              </a>
            )}
          </Reveal>
        </div>
      </div>
    </section>
  );
}

// جدول صغير: عنوان على اليمين وقيمة على الشمال
function InfoList({ rows }) {
  return (
    <dl className="bg-bg rounded-[20px] px-6 py-2">
      {rows.map(([label, value, color], i) => (
        <div key={label} className={`flex justify-between gap-4 py-4 ${i < rows.length - 1 ? "border-b border-line" : ""}`}>
          <dt className="font-semibold">{label}</dt>
          <dd className={`font-bold ${color}`}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
