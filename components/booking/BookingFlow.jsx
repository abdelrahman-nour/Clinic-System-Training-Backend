"use client";

import { useRef, useState } from "react";
import { bookOnline } from "@/app/book/actions";
import { getAvailableSlots } from "@/lib/slots";
import { formatDay, formatTime } from "@/lib/format";
import { isValidPhone } from "@/lib/phone";
import { useTakenSlots } from "@/lib/hooks/useTakenSlots";
import DayChips from "@/components/ui/DayChips";
import SlotGrid from "@/components/ui/SlotGrid";
import Field from "@/components/ui/Field";
import Icon from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";
import VisitTypePicker from "./VisitTypePicker";
import BookingSuccess from "./BookingSuccess";
import Turnstile from "./Turnstile";

// صفحة الحجز كلها: النوع ← اليوم ← الساعة ← البيانات ← تم الحجز
// days و visitTypes جايين من السيرفر (app/book/page.jsx)
export default function BookingFlow({ days, visitTypes }) {
  const [visitType, setVisitType] = useState("kashf");
  const [day, setDay] = useState(days[0]);
  const [slot, setSlot] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [tried, setTried] = useState(false); // داس "احجز" مرة على الأقل؟
  const [done, setDone] = useState(false); // الحجز تم؟
  const [submitting, setSubmitting] = useState(false);
  const [slotTaken, setSlotTaken] = useState(false); // حد سبقه للميعاد؟
  const [submitError, setSubmitError] = useState("");
  const [humanToken, setHumanToken] = useState(null); // من Turnstile (إنه مش بوت)
  const turnstileRef = useRef(null);

  // المحجوز في اليوم المختار (من Supabase)
  const { taken, loading, error: loadError, reload } = useTakenSlots(day);

  // المتاح = كل المواعيد − المحجوز − اللي عدّى النهارده
  const slots = getAvailableSlots(day, taken);

  const type = visitTypes.find((t) => t.code === visitType);
  const f = formatDay(day);
  const dayLabel = `${f.weekday} ${f.day} ${f.month}`;

  const nameOk = name.trim().length >= 2;
  const phoneOk = isValidPhone(phone);

  function pickDay(d) {
    setDay(d);
    setSlot(null); // لما يغيّر اليوم، الساعة المختارة تتشال
  }

  function pickSlot(s) {
    setSlot(s);
    setSlotTaken(false);
    setSubmitError("");
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!slot || submitting) return;
    setTried(true);
    if (!nameOk || !phoneOk) return;

    if (!humanToken) return; // Turnstile لسه بيتأكد

    setSubmitting(true);
    setSubmitError("");

    // الحجز بيعدّي على السيرفر (app/book/actions.js): Turnstile + الحد الأقصى + قواعد الميعاد
    // السعر والمدة مش بنبعتهم: الداتابيز بتحسبهم لوحدها من نوع الزيارة
    let result;
    try {
      result = await bookOnline({ day, time: slot, name, phone, type: visitType, token: humanToken });
    } catch {
      result = { error: "حصلت مشكلة وإحنا بنحفظ الحجز. اتأكد من النت وجرّب تاني." };
    }

    setSubmitting(false);

    if (result?.ok) {
      setDone(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // التوكن بيتستخدم مرة واحدة بس، فلازم واحد جديد للمحاولة الجاية
    turnstileRef.current?.reset();

    if (result?.slotTaken) {
      setSlotTaken(true);
      setSlot(null);
      reload();
    } else {
      setSubmitError(result?.error ?? "حصلت مشكلة وإحنا بنحفظ الحجز. جرّب تاني.");
    }
  }

  function bookAgain() {
    setDone(false);
    setSlot(null);
    setTried(false);
    reload(); // الميعاد اللي اتحجز لازم يختفي
  }

  if (done) {
    return (
      <BookingSuccess
        dayLabel={dayLabel}
        slot={slot}
        type={type}
        name={name.trim()}
        phone={phone.trim()}
        onBookAgain={bookAgain}
      />
    );
  }

  return (
    <main className="flex-1 max-w-290 w-full mx-auto px-4 md:px-6 pt-9 pb-16 flex flex-col gap-6">
      <div className="animate-fade-up">
        <h1 className="text-[28px] md:text-[34px] font-extrabold">احجز ميعادك</h1>
        <p className="text-muted">اختار نوع الزيارة، واليوم، والساعة، واكتب بياناتك.</p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_400px] gap-7 items-start">
        {/* 1 + 2 + 3: النوع واليوم والساعة */}
        <section
          className="min-w-0 bg-white border border-line rounded-3xl p-5 md:p-7 flex flex-col gap-4 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <h2 className="text-xl font-extrabold">1. نوع الزيارة</h2>
          <VisitTypePicker types={visitTypes} value={visitType} onChange={setVisitType} />

          <hr className="border-line my-1.5" />

          <StepTitle title="2. اختار اليوم" side="الأسبوعين الجايين" />
          <DayChips days={days} selected={day} onSelect={pickDay} label="الأيام" />

          <hr className="border-line my-1.5" />

          <StepTitle title="3. اختار الساعة" side={dayLabel} />
          {/* key={day}: الجريد بيتعمل من جديد مع كل يوم، فالأنيميشن يشتغل تاني */}
          <SlotGrid
            key={day}
            slots={slots}
            selected={slot}
            onSelect={pickSlot}
            loading={loading}
            error={loadError}
            onRetry={reload}
          />
          <p className="text-[13px] text-muted">بيظهر المواعيد الفاضية بس.</p>
        </section>

        {/* 4: البيانات */}
        <form
          onSubmit={handleSubmit}
          noValidate
          className="bg-white border border-line rounded-3xl p-5 md:p-7 flex flex-col gap-4 md:sticky md:top-24 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <h2 className="text-xl font-extrabold">4. بياناتك</h2>

          {slotTaken && (
            <div role="alert" className="flex gap-3 items-start bg-danger-soft rounded-2xl px-4 py-3.5 animate-scale-in">
              <Icon name="alert" size={22} className="text-danger mt-0.5" />
              <div className="flex flex-col gap-0.5">
                <span className="font-extrabold text-danger">الميعاد ده مبقاش متاح</span>
                <span className="text-sm leading-relaxed">حد سبقك بثواني. اختار ميعاد تاني من المواعيد الفاضية.</span>
              </div>
            </div>
          )}

          <Summary dayLabel={dayLabel} slot={slot} type={type} />

          <Field
            id="name"
            label="الاسم"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسمك الثلاثي"
            maxLength={60}
            error={tried && !nameOk && "الاسم لازم يكون حرفين على الأقل"}
            hint="اكتب اسمك الثلاثي"
          />

          <Field
            id="phone"
            label="رقم الموبايل"
            type="tel"
            inputMode="numeric"
            dir="ltr"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01xxxxxxxxx"
            maxLength={11}
            style={{ textAlign: "right" }}
            error={tried && !phoneOk && "الرقم لازم يكون 11 رقم ويبدأ بـ 010 أو 011 أو 012 أو 015"}
            hint="رقم موبايل مصري 11 رقم"
          />

          {submitError && (
            <p role="alert" className="text-sm font-semibold text-danger animate-fade-in">
              {submitError}
            </p>
          )}

          <Turnstile ref={turnstileRef} onToken={setHumanToken} />

          <button type="submit" disabled={!slot || submitting || !humanToken} className={buttonClass({ className: "w-full" })}>
            {submitting
              ? "جاري الحجز..."
              : !slot
                ? "اختار ساعة الأول"
                : !humanToken
                  ? "لحظة، بنجهّز الحجز..."
                  : "احجز الميعاد"}
          </button>
        </form>
      </div>
    </main>
  );
}

function StepTitle({ title, side }) {
  return (
    <div className="flex justify-between items-baseline gap-3">
      <h2 className="text-xl font-extrabold">{title}</h2>
      <span className="text-sm text-muted">{side}</span>
    </div>
  );
}

// الملخص البنفسجي فوق الفورم: اليوم + الساعة + النوع + السعر
function Summary({ dayLabel, slot, type }) {
  return (
    <div className="bg-primary-soft rounded-2xl px-4 py-3.5 flex flex-col gap-2.5">
      <div className="flex justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted">اليوم</span>
          <span className="font-extrabold text-primary">{dayLabel}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-xs text-muted">الساعة</span>
          <span key={slot ?? "none"} className="font-extrabold text-primary animate-fade-in">
            {slot ? formatTime(slot) : "لسه مختارتش"}
          </span>
        </div>
      </div>
      <div className="flex justify-between gap-3 pt-2.5 border-t border-primary/10">
        <span className="font-bold text-primary">{type?.name_ar ?? "كشف"}</span>
        <span className="font-extrabold text-[#B4610A]">{type ? `${type.price} جنيه` : ""}</span>
      </div>
    </div>
  );
}
