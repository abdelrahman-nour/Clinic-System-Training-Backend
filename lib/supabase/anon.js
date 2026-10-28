import { createServerClient } from "@supabase/ssr";

// عميل Supabase "زائر" على السيرفر: من غير كوكيز ومن غير login
// بنستخدمه في حجز المريض، عشان لو السكرتيرة فاتحة الموقع من نفس المتصفح
// الحجز يتسجل برضه إنه "أونلاين" مش باسمها
export function createAnonClient() {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => [], setAll: () => {} } },
  );
}
