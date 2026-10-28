"use client";

import { useState } from "react";
import { formatTime } from "@/lib/format";
import Icon from "@/components/ui/Icon";
import Badge from "./Badge";
import BookingDrawer from "./BookingDrawer";

const COLS = "md:grid-cols-[110px_minmax(0,1fr)_130px_110px_24px]";

// قايمة حجوزات اليوم. الضغط على أي حجز بيفتح النافذة الجانبية بتفاصيله
export default function BookingsList({ rows, visitTypes, dayLabel, doctorName }) {
  const [openId, setOpenId] = useState(null);

  // لو الحجز المفتوح اتلغى واختفى من القايمة، النافذة تتقفل لوحدها
  const selected = rows.find((b) => b.id === openId) ?? null;

  return (
    <>
      <div className="flex flex-col gap-2.5">
        {/* عناوين الأعمدة (كمبيوتر بس) */}
        <div className={`hidden md:grid ${COLS} gap-4 px-5 text-[13px] font-bold text-muted`}>
          <span>الساعة</span>
          <span>الاسم</span>
          <span>النوع</span>
          <span>السعر</span>
          <span />
        </div>

        {rows.map((b, i) => (
          <Row key={b.id} b={b} index={i} visitTypes={visitTypes} onOpen={() => setOpenId(b.id)} />
        ))}
      </div>

      {selected && (
        <BookingDrawer
          key={selected.id}
          booking={selected}
          visitTypes={visitTypes}
          dayLabel={dayLabel}
          doctorName={doctorName}
          onClose={() => setOpenId(null)}
        />
      )}
    </>
  );
}

function Row({ b, index, visitTypes, onOpen }) {
  const time = formatTime(b.slot_time.slice(0, 5));
  const typeName = visitTypes[b.visit_type]?.name_ar ?? b.visit_type;

  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ animationDelay: `${Math.min(index, 10) * 40}ms` }}
      className={`group grid grid-cols-[auto_minmax(0,1fr)_auto] ${COLS} items-center gap-3 md:gap-4 bg-white border border-line rounded-2xl px-3.5 py-3 md:px-5 md:py-3.5 text-right animate-fade-up transition-all duration-200 hover:border-primary hover:shadow-[0_12px_28px_-18px_rgba(75,29,94,0.6)]`}
    >
      <span className="justify-self-start inline-flex items-center justify-center h-10 px-3.5 rounded-[10px] bg-primary-soft text-primary font-extrabold">
        {time}
      </span>

      <span className="flex flex-col min-w-0">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          <span className="font-bold truncate">{b.patient_name}</span>
          {b.visits > 0 ? (
            <Badge tone="purple">
              زار {b.visits} {b.visits === 1 ? "مرة" : "مرات"}
            </Badge>
          ) : (
            <Badge tone="green">جديد</Badge>
          )}
          {b.check && !b.check.ok && <Badge tone="orange">⚠ راجع الروشتة</Badge>}
          {b.source === "staff" && <Badge tone="blue">من المكتب</Badge>}
          {b.changes.some((c) => c.action !== "create") && <Badge tone="gray">اتعدّل</Badge>}
        </span>
        {/* النوع والسعر تحت الاسم على الموبايل */}
        <span className="md:hidden text-[13px] text-muted">
          {typeName} · {b.price} جنيه
        </span>
      </span>

      <span className="hidden md:block font-semibold">{typeName}</span>
      <span className="hidden md:block font-extrabold text-[#B4610A]">{b.price} ج</span>

      <span className="text-muted transition-transform duration-200 group-hover:-translate-x-1">
        <Icon name="arrow" size={18} />
      </span>
    </button>
  );
}
