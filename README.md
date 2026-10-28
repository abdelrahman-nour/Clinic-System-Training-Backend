# Clinic Booking — نسخة تدريب

نسخة تدريب من سيستم حجز عيادة (Next.js + Supabase)، ببيانات وهمية.
الهدف: تيم الباك إند يبني نفس الـ API بـ **ASP.NET Core**، وبعدها نربط الفرونت بيه.

> ⚠️ الكود ده ملك NOURVERSE. للتدريب بس، ممنوع يتباع أو ينشر أو يترفع public.

## ابدأ من هنا
1. **[`BACKEND_SPEC.md`](BACKEND_SPEC.md)**: القواعد، والـ API، والاختبارات، وتقسيم المهام.
2. **[`database/schema.postgres.sql`](database/schema.postgres.sql)**: الداتابيز (PostgreSQL).
3. **[`supabase/`](supabase)**: إزاي V1 بيطبّق القواعد جوه الداتابيز (مرجع للقراءة بس).

## الفرونت
```
app/          الصفحات: / ، /book ، /login ، /dashboard ، /dashboard/log
components/   ui ، site ، home ، booking ، dashboard
lib/          المنطق: slots ، phone ، dates ، dashboard/getDayData ، supabase/
config/       clinic.js: بيانات العيادة والمواعيد
```

تشغيله محتاج Supabase. لو عايز تشغّله: انسخ `.env.example` لـ `.env.local` وحط مفاتيح مشروع Supabase بتاعك، وبعدين:
```bash
npm install
npm run dev
```

## طريقة الشغل
- كل مهمة في GitHub Issue (القايمة في `BACKEND_SPEC.md` §9).
- كل مهمة في branch لوحدها، وبعدين Pull Request، وبعدين review، وبعدين merge.
- متعملش commit لأي secret: connection strings، وJWT key، ومفاتيح Turnstile. استخدم `dotnet user-secrets`.
