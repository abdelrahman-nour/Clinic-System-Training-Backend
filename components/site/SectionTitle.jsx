// عنوان القسم: كلمة صغيرة برتقالي فوق + عنوان كبير
export default function SectionTitle({ eyebrow, title, className = "" }) {
  return (
    <div className={`flex flex-col gap-2.5 ${className}`}>
      <span className="text-sm font-bold text-[#B4610A]">{eyebrow}</span>
      <h2 className="text-[28px] md:text-4xl font-extrabold leading-snug">{title}</h2>
    </div>
  );
}
