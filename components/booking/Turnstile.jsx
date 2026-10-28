"use client";

import { useEffect, useImperativeHandle, useRef, useState } from "react";

// Cloudflare Turnstile: بيتأكد إن اللي بيحجز إنسان مش بوت
// في الغالب مش بيظهر خالص للمريض (interaction-only)، وبيظهر مربع صغير بس لو الزيارة شكلها مريب
//
// <Turnstile ref={ref} onToken={setToken} />
// ref.current.reset() ← بعد كل محاولة حجز (التوكن بيتستخدم مرة واحدة بس)
//
// المفتاح: NEXT_PUBLIC_TURNSTILE_SITE_KEY في .env.local
// من غيره (وإنت بتجرب على جهازك) بيستخدم مفتاح التجربة بتاع Cloudflare

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
const DEV_TEST_SITE_KEY = "1x00000000000000000000AA";
const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || DEV_TEST_SITE_KEY;

// السكريبت بيتحمل مرة واحدة بس حتى لو الكومبوننت اتعمل كذا مرة
let scriptPromise = null;
function loadScript() {
  if (typeof window === "undefined") return Promise.reject(new Error("no window"));
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = SCRIPT_SRC;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => {
        scriptPromise = null; // نسمح بمحاولة تانية
        reject(new Error("turnstile script failed"));
      };
      document.head.appendChild(s);
    });
  }
  return scriptPromise;
}

export default function Turnstile({ ref, onToken }) {
  const boxRef = useRef(null);
  const widgetId = useRef(null);
  const onTokenRef = useRef(onToken);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    onTokenRef.current = onToken;
  });

  useImperativeHandle(ref, () => ({
    reset() {
      onTokenRef.current?.(null);
      if (widgetId.current != null) window.turnstile?.reset(widgetId.current);
    },
  }));

  useEffect(() => {
    let cancelled = false;

    loadScript()
      .then(() => {
        if (cancelled || !boxRef.current) return;
        widgetId.current = window.turnstile.render(boxRef.current, {
          sitekey: SITE_KEY,
          language: "ar",
          theme: "light",
          appearance: "interaction-only",
          callback: (token) => {
            setFailed(false);
            onTokenRef.current?.(token);
          },
          "expired-callback": () => onTokenRef.current?.(null), // بيتجدد لوحده بعدها
          "error-callback": () => {
            onTokenRef.current?.(null);
            setFailed(true);
          },
        });
      })
      .catch(() => !cancelled && setFailed(true));

    return () => {
      cancelled = true;
      if (widgetId.current != null) {
        window.turnstile?.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [attempt]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={boxRef} />
      {failed && (
        <p role="alert" className="text-[13px] text-danger text-center leading-relaxed">
          معرفناش نتأكد إنك مش روبوت. اتأكد من النت، ولو فاتح مانع إعلانات اقفله للموقع ده.{" "}
          <button
            type="button"
            onClick={() => {
              setFailed(false);
              setAttempt((n) => n + 1);
            }}
            className="font-bold underline underline-offset-4"
          >
            جرّب تاني
          </button>
        </p>
      )}
    </div>
  );
}
