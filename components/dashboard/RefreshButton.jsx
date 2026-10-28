"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/ui/Icon";
import { buttonClass } from "@/components/ui/Button";

// بيجيب الحجوزات الجديدة من غير ما الصفحة كلها تعمل reload
export default function RefreshButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      onClick={() => startTransition(() => router.refresh())}
      disabled={pending}
      className={buttonClass({ variant: "light", size: "sm" })}
    >
      <Icon name="refresh" size={16} className={pending ? "animate-spin" : ""} />
      {pending ? "بيحدّث..." : "تحديث"}
    </button>
  );
}
