function countLabel(n) {
  if (n === 0) return "مفيش حجوزات";
  if (n === 1) return "حجز واحد";
  if (n === 2) return "حجزين";
  if (n <= 10) return `${n} حجوزات`;
  return `${n} حجز`;
}

// 3 كروت فوق القايمة: عدد الحجوزات + الإيراد المتوقع + التقسيم
export default function DaySummary({ summary }) {
  const cards = [
    ["الحجوزات", <span key="c" className="text-primary">{countLabel(summary.count)}</span>],
    [
      "الإيراد المتوقع",
      <span key="r" className="text-[#B4610A]">
        {summary.revenue.toLocaleString("en-US")} <span className="text-base">جنيه</span>
      </span>,
    ],
    [
      "التقسيم",
      <span key="t" className="text-base">
        {summary.byType.length === 0 ? "—" : summary.byType.map((t) => `${t.count} ${t.name}`).join(" · ")}
      </span>,
    ],
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {cards.map(([label, value], i) => (
        <div
          key={label}
          style={{ animationDelay: `${i * 70}ms` }}
          className={`bg-white border border-line rounded-2xl px-5 py-4 animate-fade-up ${i === 2 ? "col-span-2 md:col-span-1" : ""}`}
        >
          <p className="text-sm text-muted">{label}</p>
          <p className="text-xl md:text-2xl font-extrabold mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  );
}
