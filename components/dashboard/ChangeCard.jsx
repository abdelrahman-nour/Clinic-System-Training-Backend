import { CHANGE_ACTIONS } from "@/lib/changes";
import { cairoClock } from "@/lib/dates";
import { formatDay, formatTime } from "@/lib/format";

// كارت تعديل واحد في صفحة سجل التعديلات: كل معلومة في سطر
// typeName: function بتحوّل كود النوع لاسمه
export default function ChangeCard({ change: c, typeName, index = 0 }) {
  const bk = c.bookings; // بيانات الحجز (جاية مع التعديل)
  const a = CHANGE_ACTIONS[c.action] ?? { label: c.action, badge: "bg-bg" };
  const bkDay = bk ? formatDay(bk.slot_date) : null;

  let change;
  if (c.action === "create") {
    change = (
      <>
        {typeName(c.new_type)} <Price v={c.new_price} />
      </>
    );
  } else if (c.action === "cancel") {
    change = (
      <>
        {typeName(c.old_type)} <Price v={c.old_price} /> <Arrow /> <span className="text-[#B71C1C]">اتلغى</span>
      </>
    );
  } else {
    change = (
      <>
        {typeName(c.old_type)} <Price v={c.old_price} /> <Arrow /> {typeName(c.new_type)} <Price v={c.new_price} />
      </>
    );
  }

  return (
    <li
      style={{ animationDelay: `${Math.min(index, 8) * 50}ms` }}
      className="bg-white border border-line rounded-2xl overflow-hidden animate-fade-up"
    >
      <div className="flex items-center justify-between gap-3 px-5 py-3 bg-bg border-b border-line">
        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${a.badge}`}>{a.label}</span>
        <span className="text-sm font-bold text-muted">{cairoClock.format(new Date(c.changed_at))}</span>
      </div>

      <dl className="px-5 py-2">
        <Line label="المريض">{bk?.patient_name ?? "—"}</Line>
        <Line label="ميعاد الحجز">
          {bk ? `${bkDay.weekday} ${bkDay.day} ${bkDay.month} · ${formatTime(bk.slot_time.slice(0, 5))}` : "—"}
        </Line>
        <Line label="التعديل">{change}</Line>
        <Line label="السبب">{c.reason}</Line>
        <Line label="بواسطة" last>
          <span className="font-extrabold">{c.changed_by_name}</span>
        </Line>
      </dl>
    </li>
  );
}

function Line({ label, children, last = false }) {
  return (
    <div className={`grid grid-cols-[96px_minmax(0,1fr)] sm:grid-cols-[120px_minmax(0,1fr)] gap-3 py-2.5 ${last ? "" : "border-b border-line"}`}>
      <dt className="text-sm text-muted">{label}</dt>
      <dd className="font-semibold leading-relaxed">{children}</dd>
    </div>
  );
}

function Price({ v }) {
  return <span className="text-[#B4610A] font-bold">({v} جنيه)</span>;
}

function Arrow() {
  return (
    <span className="text-muted mx-1" aria-label="اتغيّر لـ">
      ←
    </span>
  );
}
