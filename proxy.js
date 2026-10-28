import { updateSession } from "@/lib/supabase/proxy";

// في Next 16 الملف ده اسمه proxy (كان اسمه middleware قبل كده)
export async function proxy(request) {
  return updateSession(request);
}

// بيشتغل على صفحات السكرتارية بس.
// المريض مش عامل login أصلاً، فمفيش داعي نبطّأ صفحة الحجز والرئيسية.
export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
