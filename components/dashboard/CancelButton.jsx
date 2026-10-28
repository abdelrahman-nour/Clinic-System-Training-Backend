"use client";

import { useState, useTransition } from "react";
import { cancelBooking } from "@/app/dashboard/actions";
import Overlay from "@/components/ui/Overlay";
import Field from "@/components/ui/Field";
import Icon from "@/components/ui/Icon";
import Button from "@/components/ui/Button";

// زرار "إلغاء الحجز" + نافذة التأكيد (لازم سبب)
export default function CancelButton({ id, name, time, className = "" }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const reasonOk = reason.trim().length >= 3;

  function close() {
    if (pending) return;
    setOpen(false);
    setReason("");
    setError("");
  }

  function confirm() {
    if (!reasonOk) return setError("لازم تكتب سبب الإلغاء.");
    setError("");
    startTransition(async () => {
      const result = await cancelBooking(id, reason);
      if (result?.error) setError(result.error);
      else {
        setOpen(false);
        setReason("");
      }
    });
  }

  return (
    <>
      <Button variant="soft" size="sm" onClick={() => setOpen(true)} aria-label={`إلغاء حجز ${name}`} className={className}>
        إلغاء الحجز
      </Button>

      {open && (
        <Overlay onClose={close} variant="center" z="z-50" labelledBy={`cancel-title-${id}`} className="px-6 py-7 flex flex-col items-center gap-3 text-center">
          <span className="size-15 rounded-full bg-danger-soft text-danger flex items-center justify-center animate-pop">
            <Icon name="alert" size={28} />
          </span>

          <h2 id={`cancel-title-${id}`} className="text-[21px] font-extrabold">
            إلغاء الحجز؟
          </h2>
          <p className="text-[15px] leading-relaxed text-[#5C5363]">
            هتلغي حجز <strong className="text-ink">{name}</strong> الساعة <strong className="text-ink">{time}</strong>، والميعاد
            هيرجع فاضي للمرضى.
          </p>

          <Field
            id={`cancel-reason-${id}`}
            label="سبب الإلغاء"
            multiline
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value.slice(0, 200))}
            placeholder="مثلاً: المريض اتصل ولغى"
            hint="السبب واسمك هيتسجلوا في سجل التعديلات."
            className="w-full text-right"
          />

          {error && (
            <p role="alert" className="text-sm font-bold text-danger">
              {error}
            </p>
          )}

          <div className="w-full flex flex-col gap-2.5 mt-1">
            <Button variant="danger" onClick={confirm} disabled={pending || !reasonOk}>
              {pending ? "جاري الإلغاء..." : "أيوه، الغي الحجز"}
            </Button>
            <Button variant="outline" onClick={close} disabled={pending}>
              لا، رجوع
            </Button>
          </div>
        </Overlay>
      )}
    </>
  );
}
