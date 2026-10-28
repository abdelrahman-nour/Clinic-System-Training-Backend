"use client";

import { useState, useTransition } from "react";
import { changeVisitType } from "@/app/dashboard/actions";
import { formatTime } from "@/lib/format";
import { cairoDateTime } from "@/lib/dates";
import { whatsappLink } from "@/lib/phone";
import Overlay from "@/components/ui/Overlay";
import Field from "@/components/ui/Field";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";
import CancelButton from "./CancelButton";
import ChangeHistory from "./ChangeHistory";

// النافذة الجانبية بتاعة حجز واحد: تواصل + بيانات + تأكيد الروشتة + تغيير النوع + السجل + إلغاء
export default function BookingDrawer({ booking: b, visitTypes, dayLabel, doctorName, onClose }) {
  const time = formatTime(b.slot_time.slice(0, 5));
  const typeName = visitTypes[b.visit_type]?.name_ar ?? b.visit_type;

  const waText =
    `أهلاً ${b.patient_name}، معاك عيادة ${doctorName}.\n` +
    `بنأكد ميعادك يوم ${dayLabel} الساعة ${time} (${typeName} - ${b.price} جنيه).\n` +
    `لو محتاج تلغي أو تغيّر الميعاد، رد علينا هنا. شكراً`;

  return (
    <Overlay onClose={onClose} variant="side" as="aside" labelledBy="drawer-title">
      {/* رأس النافذة */}
      <div className="flex items-center justify-between gap-3 px-6 py-5 border-b border-line">
        <div className="min-w-0">
          <h2 id="drawer-title" className="text-xl font-extrabold truncate">
            {b.patient_name}
          </h2>
          <p className="text-sm text-muted">
            {dayLabel} · {time}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="قفل"
          className="shrink-0 size-11 rounded-xl border border-line flex items-center justify-center transition-colors hover:border-primary hover:rotate-90 duration-300"
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        {/* اتصال + واتساب */}
        <div className="grid grid-cols-2 gap-2.5">
          <Button href={`tel:${b.phone}`} variant="outline" size="sm" className="h-12">
            <Icon name="phone" size={18} />
            اتصال
          </Button>
          <Button href={whatsappLink(b.phone, waText)} variant="whatsapp" size="sm" className="h-12">
            <Icon name="whatsapp" size={18} />
            واتساب
          </Button>
        </div>

        <Details b={b} visitTypes={visitTypes} />

        {/* التأكيد من سجل الرقم (إعادة الكشف والمتابعة بس) */}
        {b.check && (
          <div className={`rounded-2xl px-4 py-3.5 flex flex-col gap-1 ${b.check.ok ? "bg-[#E6F6EE]" : "bg-accent-soft"}`}>
            <span className={`font-extrabold ${b.check.ok ? "text-[#17804A]" : "text-[#8A4A05]"}`}>
              {b.check.ok ? "✓ السجل مطابق" : "⚠ راجع الروشتة"}
            </span>
            <span className="text-sm">{b.check.text}</span>
            <span className="text-[12.5px] text-muted">المريض لازم يوري الروشتة عند المكتب قبل ما يدخل.</span>
          </div>
        )}

        <ChangeTypeForm b={b} visitTypes={visitTypes} />
        <ChangeHistory changes={b.changes} visitTypes={visitTypes} />
      </div>

      {/* الإلغاء تحت */}
      <div className="px-6 py-4 border-t border-line">
        <CancelButton id={b.id} name={b.patient_name} time={time} className="w-full min-h-12" />
      </div>
    </Overlay>
  );
}

// بيانات الحجز (كل معلومة في سطر)
function Details({ b, visitTypes }) {
  const name = (code) => visitTypes[code]?.name_ar ?? code;
  const rows = [
    ["الموبايل", <span key="p" dir="ltr">{b.phone}</span>],
    ["النوع الحالي", name(b.visit_type)],
    ["المريض اختار", <span key="b" className={b.booked_type !== b.visit_type ? "text-[#8A4A05]" : ""}>{name(b.booked_type)}</span>],
    ["السعر", <span key="pr" className="font-extrabold text-[#B4610A]">{b.price} جنيه</span>],
    ["زيارات قبل كده", b.visits > 0 ? `${b.visits}` : "أول مرة"],
    ["اتحجز من", b.source === "staff" ? `المكتب (${b.created_by_name ?? "—"})` : "الموقع"],
    ["وقت الحجز", cairoDateTime.format(new Date(b.created_at))],
  ];

  return (
    <dl className="bg-bg rounded-2xl px-5 py-1">
      {rows.map(([label, value], i) => (
        <div key={label} className={`flex justify-between gap-3 py-3 ${i < rows.length - 1 ? "border-b border-line" : ""}`}>
          <dt className="text-muted">{label}</dt>
          <dd className="font-bold text-left">{value}</dd>
        </div>
      ))}
    </dl>
  );
}

// تغيير نوع الزيارة (لازم سبب). السعر بيتغير لوحده من الداتابيز
function ChangeTypeForm({ b, visitTypes }) {
  const [pending, startTransition] = useTransition();
  const [newType, setNewType] = useState(b.visit_type);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const changed = newType !== b.visit_type;

  function save() {
    if (reason.trim().length < 3) return setError("لازم تكتب سبب التعديل.");
    setError("");
    setSaved(false);
    startTransition(async () => {
      const result = await changeVisitType(b.id, newType, reason);
      if (result?.error) setError(result.error);
      else {
        setReason("");
        setSaved(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2 border border-line rounded-2xl p-4">
      <label htmlFor="visit-type" className="text-sm font-bold">
        تغيير نوع الزيارة
      </label>
      <select
        id="visit-type"
        value={newType}
        onChange={(e) => {
          setNewType(e.target.value);
          setSaved(false);
          setError("");
        }}
        disabled={pending}
        className="h-13 rounded-xl px-4 text-base border border-[#DCD3E3] bg-white outline-none focus:border-2 focus:border-primary disabled:opacity-60"
      >
        {Object.values(visitTypes).map((t) => (
          <option key={t.code} value={t.code}>
            {t.name_ar} ({t.price} جنيه)
          </option>
        ))}
      </select>

      {changed && (
        <div className="flex flex-col gap-2 animate-fade-up">
          <Field
            id="type-reason"
            label="سبب التعديل"
            multiline
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            placeholder="مثلاً: الروشتة بتقول إعادة كشف مش متابعة"
            hint="السبب واسمك هيتسجلوا في سجل التعديلات."
          />
          <Button variant="dark" size="sm" onClick={save} disabled={pending || reason.trim().length < 3} className="h-12">
            {pending ? "بيحفظ..." : "حفظ التعديل"}
          </Button>
        </div>
      )}

      {saved && !changed && <span className="text-sm font-bold text-[#17804A] animate-fade-in">✓ اتحفظ التعديل.</span>}
      {error && (
        <span role="alert" className="text-sm font-bold text-danger">
          {error}
        </span>
      )}
    </div>
  );
}
