"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// الـ function دي بتشتغل على السيرفر بس، والباسورد مبيتحفظش في أي حتة في المتصفح
export async function login(prevState, formData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { error: "اكتب الإيميل والباسورد.", email };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // محاولات كتير ورا بعض: Supabase بيوقف الدخول شوية (حماية من التخمين)
    if (error.status === 429) {
      return { error: "محاولات كتير ورا بعض، استنى دقيقة وجرّب تاني.", email };
    }
    // متقولش الإيميل غلط ولا الباسورد، عشان محدش يعرف الإيميلات الموجودة
    if (error.code === "invalid_credentials" || error.status === 400) {
      return { error: "الإيميل أو الباسورد غلط، جرّب تاني.", email };
    }
    return { error: "حصلت مشكلة في الاتصال، اتأكد من النت وجرّب تاني.", email };
  }

  // redirect لازم تكون بره أي try/catch
  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
