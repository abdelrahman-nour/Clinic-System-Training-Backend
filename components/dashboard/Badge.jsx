// علامة صغيرة جنب اسم المريض ("جديد" / "زار 3 مرات" / "من المكتب" ...)
const TONES = {
  purple: "text-primary bg-primary-soft",
  green: "text-[#17804A] bg-[#E6F6EE]",
  orange: "text-[#8A4A05] bg-accent-soft",
  blue: "text-[#1F5FA8] bg-[#E7F0FB]",
  gray: "text-[#4A4150] bg-[#ECE8EF]",
};

export default function Badge({ tone = "purple", children }) {
  return (
    <span className={`shrink-0 text-[11px] font-bold px-2 py-0.5 rounded-full ${TONES[tone]}`}>{children}</span>
  );
}
