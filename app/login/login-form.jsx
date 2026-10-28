"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "./actions";
import Field from "@/components/ui/Field";
import Icon from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

const initialState = { error: null, email: "" };

export default function LoginForm() {
  // useActionState بيشغّل login على السيرفر، وبيرجعلنا النتيجة (error) + هل لسه شغال (pending)
  const [state, formAction, pending] = useActionState(login, initialState);
  const hasError = Boolean(state.error);

  return (
    <form action={formAction} className="w-full max-w-100 flex flex-col gap-4.5 animate-fade-up">
      <div>
        <h1 className="text-[30px] font-extrabold">دخول السكرتارية</h1>
        <p className="text-muted">سجّل دخول عشان تتابع حجوزات العيادة.</p>
      </div>

      {hasError && (
        <div role="alert" className="flex gap-2.5 items-center bg-danger-soft rounded-2xl px-4 py-3 animate-scale-in">
          <Icon name="alert" className="text-danger" />
          <span className="text-sm font-bold text-danger">{state.error}</span>
        </div>
      )}

      <Field
        id="email"
        name="email"
        label="الإيميل"
        type="email"
        dir="ltr"
        autoComplete="username"
        required
        defaultValue={state.email}
        placeholder="name@clinic.com"
        style={{ textAlign: "right" }}
        error={hasError}
      />
      <Field
        id="password"
        name="password"
        label="الباسورد"
        type="password"
        dir="ltr"
        autoComplete="current-password"
        required
        style={{ textAlign: "right" }}
        error={hasError}
      />

      <button type="submit" disabled={pending} className={buttonClass({ className: "w-full" })}>
        {pending ? "جاري الدخول..." : "دخول"}
      </button>

      <Link href="/" className="self-center text-sm font-semibold text-primary hover:text-primary-dark p-2.5">
        رجوع للموقع
      </Link>
    </form>
  );
}
