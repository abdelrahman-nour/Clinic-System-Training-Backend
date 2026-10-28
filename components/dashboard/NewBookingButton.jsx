"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "@/app/dashboard/actions";
import { getAvailableSlots } from "@/lib/slots";
import { formatDay, formatTime } from "@/lib/format";
import { isValidPhone } from "@/lib/phone";
import { useTakenSlots } from "@/lib/hooks/useTakenSlots";
import Overlay from "@/components/ui/Overlay";
import DayChips from "@/components/ui/DayChips";
import SlotGrid from "@/components/ui/SlotGrid";
import Field from "@/components/ui/Field";
import Icon from "@/components/ui/Icon";
import Button, { buttonClass } from "@/components/ui/Button";

// زرار "حجز جديد" + نافذة الحجز من المكتب
// نفس قواعد الموقع بالظبط (14 يوم قدام، المواعيد الفاضية بس) — والداتابيز هي اللي بتتأكد
export default function NewBookingButton({ days, initialDay, visitTypes }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Icon name="plus" size={18} strokeWidth={2.4} />
        حجز جديد
      </Button>
      {open && (
        <NewBookingModal days={days} initialDay={initialDay} visitTypes={visitTypes} onClose={() => setOpen(false)} />
      )}
    </>
  );
}

function NewBookingModal({ days, initialDay, visitTypes, onClose }) {
  const router = useRouter();
  const [day, setDay] = useState(initialDay); // بتبدأ من اليوم المفتوح في الداشبورد
  const [slot, setSlot] = useState(null);
  const [type, setType] = useState("kashf");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tried, setTried] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const { taken, loading, error: loadError, reload } = useTakenSlots(day);
  const slots = getAvailableSlots(day, taken);

  const nameOk = name.trim().length >= 2;
  const phoneOk = isValidPhone(phone);
  const f = formatDay(day);
  const dayLabel = `${f.weekday} ${f.day} ${f.month}`;

  function close() {
    if (!pending) onClose();
  }

  function pickDay(d) {
    setDay(d);
    setSlot(null);
    setError("");
  }

  function submit(e) {
    e.preventDefault();
    setTried(true);
    if (!slot) return setError("اختار ميعاد.");
    if (!nameOk || !phoneOk) return;

    setError("");
    const bookedDay = day;
    startTransition(async () => {
      const result = await createBooking({ day: bookedDay, time: slot, name, phone, type });
      if (result?.error) {
        setError(result.error);
        if (result.slotTaken) {
          setSlot(null);
          reload();
        }
      } else {
        onClose();
        // نروح على اليوم اللي اتحجز فيه عشان السكرتيرة تشوف الحجز
        router.push(`/dashboard?day=${bookedDay}`, { scroll: false });
      }
    });
  }

  return (
    <Overlay onClose={close} variant="sheet" as="form" onSubmit={submit} noValidate labelledBy="new-booking-title" className="px-6 py-6 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="new-booking-title" className="text-xl font-extrabold">
            حجز من المكتب
          </h2>
          <p className="text-sm text-muted">للمرضى اللي بيتصلوا أو جايين بنفسهم</p>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="قفل"
          className="shrink-0 size-11 rounded-xl border border-line flex items-center justify-center transition-all duration-300 hover:border-primary hover:rotate-90"
        >
          <Icon name="close" />
        </button>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">اليوم</span>
        <DayChips days={days} selected={day} onSelect={pickDay} size="sm" label="الأيام" />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-bold">الميعاد · {dayLabel}</span>
        <SlotGrid
          key={day}
          slots={slots}
          selected={slot}
          onSelect={(s) => {
            setSlot(s);
            setError("");
          }}
          loading={loading}
          error={loadError}
          onRetry={reload}
          size="sm"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="nb-type" className="text-sm font-bold">
          نوع الزيارة
        </label>
        <select
          id="nb-type"
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="h-13 rounded-xl px-4 text-base border border-[#DCD3E3] bg-white outline-none focus:border-2 focus:border-primary"
        >
          {Object.values(visitTypes).map((t) => (
            <option key={t.code} value={t.code}>
              {t.name_ar} ({t.price} جنيه)
            </option>
          ))}
        </select>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <Field
          id="nb-name"
          label="الاسم"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={60}
          error={tried && !nameOk && "حرفين على الأقل"}
        />
        <Field
          id="nb-phone"
          label="رقم الموبايل"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          maxLength={11}
          placeholder="01xxxxxxxxx"
          style={{ textAlign: "right" }}
          error={tried && !phoneOk && "11 رقم ويبدأ بـ 01"}
        />
      </div>

      {/* ملخص يتقري للمريض على التليفون قبل الحجز */}
      <div className="flex justify-between gap-3 bg-primary-soft rounded-2xl px-4 py-3">
        <span className="font-bold text-primary">
          {dayLabel} · {slot ? formatTime(slot) : "لسه مختارتش ميعاد"} · {visitTypes[type]?.name_ar}
        </span>
        <span className="shrink-0 font-extrabold text-[#B4610A]">{visitTypes[type]?.price} جنيه</span>
      </div>

      {error && (
        <p role="alert" className="text-sm font-bold text-danger animate-fade-in">
          {error}
        </p>
      )}

      <button type="submit" disabled={pending || loading} className={buttonClass({ className: "w-full" })}>
        {pending ? "جاري الحجز..." : "احجز"}
      </button>
      <span className="text-[12px] text-muted text-center">الحجز هيتسجل إنه &quot;من المكتب&quot; وباسمك.</span>
    </Overlay>
  );
}
