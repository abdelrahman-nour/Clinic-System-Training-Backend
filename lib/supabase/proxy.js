import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// بيشتغل قبل ما صفحات /login و /dashboard تفتح:
// 1) يجدد تذكرة الدخول (session) لو قربت تخلص، ويحفظها في الـ cookies
// 2) يحوّل اللي مش عامل login بعيد عن الداشبورد، واللي عامل login بعيد عن صفحة الدخول
export async function updateSession(request) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          // نحط الـ cookies الجديدة على الطلب (عشان الصفحة تشوفها) وعلى الرد (عشان المتصفح يحفظها)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
          // headers بتمنع إن أي cache يحفظ رد فيه session حد
          Object.entries(headers ?? {}).forEach(([key, value]) =>
            response.headers.set(key, value)
          );
        },
      },
    }
  );

  // مهم: متكتبش أي كود بين createServerClient و getClaims
  // getClaims بتتأكد إن التذكرة سليمة ومش متزورة، وبتجددها لو محتاجة
  const { data } = await supabase.auth.getClaims();
  const isLoggedIn = Boolean(data?.claims);

  const path = request.nextUrl.pathname;

  if (!isLoggedIn && path.startsWith("/dashboard")) {
    return redirectKeepingCookies(request, response, "/login");
  }

  if (isLoggedIn && path === "/login") {
    return redirectKeepingCookies(request, response, "/dashboard");
  }

  return response;
}

// لما نحوّل لصفحة تانية، لازم ننقل الـ cookies اللي اتجددت للرد الجديد، وإلا الـ session تضيع
function redirectKeepingCookies(request, response, to) {
  const url = request.nextUrl.clone();
  url.pathname = to;
  url.search = "";

  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
