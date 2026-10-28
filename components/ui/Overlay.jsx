"use client";

import { useEffect } from "react";

// خلفية غامقة + نافذة فوقها (بتتقفل بـ Esc أو بالضغط بره النافذة)
//
// variant:
//   "center" ← نافذة في النص (تأكيد الإلغاء)
//   "sheet"  ← من تحت على الموبايل، وفي النص على الكمبيوتر (حجز من المكتب)
//   "side"   ← من الجنب (تفاصيل الحجز)
//
// as: "div" أو "form" (لو النافذة فورم)
export default function Overlay({
  onClose,
  variant = "center",
  as: Tag = "div",
  labelledBy,
  className = "",
  z = "z-40",
  children,
  ...props
}) {
  // Esc يقفل + نمنع الصفحة اللي ورا من السكرول
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const wrap = {
    center: "flex items-center justify-center p-5",
    sheet: "flex items-end md:items-center justify-center md:p-5",
    side: "",
  }[variant];

  const panel = {
    center: "w-full max-w-[420px] bg-white rounded-3xl animate-scale-in",
    sheet:
      "w-full md:max-w-[600px] max-h-[92vh] overflow-y-auto bg-white rounded-t-3xl md:rounded-3xl animate-sheet-up md:animate-scale-in",
    side: "absolute inset-y-0 left-0 w-full max-w-[440px] bg-white shadow-2xl flex flex-col animate-slide-in",
  }[variant];

  return (
    <div
      className={`fixed inset-0 ${z} bg-primary-dark/55 animate-fade-in ${wrap}`}
      onClick={onClose}
    >
      <Tag
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        onClick={(e) => e.stopPropagation()}
        className={`${panel} ${className}`}
        {...props}
      >
        {children}
      </Tag>
    </div>
  );
}
