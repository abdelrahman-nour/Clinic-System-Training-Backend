-- =====================================================================
-- V1.2: الحماية من السبام
--
-- قبل كده: المريض كان بيحجز من المتصفح على الداتابيز على طول،
--   فأي حد معاه رابط Supabase يقدر يعمل سكريبت ويحجز كل المواعيد.
-- دلوقتي: الحجز بيعدّي على سيرفر Next الأول (app/book/actions.js):
--   1) يتأكد من Cloudflare Turnstile (إن اللي بيحجز إنسان مش بوت)
--   2) يبعت الحجز للـ function دي ومعاه "كلمة سر السيرفر"
--   3) الـ function تتأكد من كلمة السر + الحد الأقصى للحجوزات + قواعد الميعاد
-- والحجز المباشر من المتصفح اتقفل خالص.
--
-- ⚠️ قبل ما تشغّل الملف: غيّر 'PUT-YOUR-BOOKING-SERVER-SECRET-HERE' تحت
--    لنفس قيمة BOOKING_SERVER_SECRET اللي في .env.local بالظبط.
-- شغّل الملف ده كله في Supabase ← SQL Editor (query جديدة)
-- =====================================================================


-- 1) كلمة سر السيرفر (بنخزن الـ hash بس، مش الكلمة نفسها)
--    الجدول ده محدش يقدر يقراه من بره (مفيش grant ولا policy)
create table if not exists public.app_secrets (
  name text primary key,
  value_hash text not null
);
alter table public.app_secrets enable row level security;
revoke all on public.app_secrets from anon, authenticated;

insert into public.app_secrets (name, value_hash)
values ('booking_server', encode(sha256(convert_to('PUT-YOUR-BOOKING-SERVER-SECRET-HERE', 'UTF8')), 'hex'))
on conflict (name) do update set value_hash = excluded.value_hash;


-- 2) سجل الحجوزات أونلاين لكل جهاز/شبكة (عشان الحد الأقصى)
--    مش بنخزن الـ IP نفسه: بنخزن hash منه (خصوصية المريض)
create table if not exists public.online_booking_log (
  id bigint generated always as identity primary key,
  client_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists online_booking_log_client_time
  on public.online_booking_log (client_hash, created_at desc);
alter table public.online_booking_log enable row level security;
revoke all on public.online_booking_log from anon, authenticated;


-- 3) الحجز من الموقع (السيرفر بس اللي بيناديها)
--    أكواد الإيرور:
--      CB403 كلمة سر السيرفر غلط (حد بيحاول يناديها من بره)
--      CB429 الجهاز ده عدّى الحد الأقصى
--      CB409 الرقم ده عنده حجوزات جاية كتير
--      22023 الميعاد أو النوع مش مسموح
--      23505 الميعاد اتحجز / الرقم حاجز في نفس اليوم (من الـ unique indexes)
create or replace function public.book_online(
  p_secret text,
  p_client text,
  p_date date,
  p_time time,
  p_name text,
  p_phone text,
  p_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  -- ⚠️ الحدود: كبيرة كفاية عشان أكتر من مريض على نفس شبكة الموبايل/الواي فاي
  max_per_hour constant int := 4;
  max_per_day constant int := 10;
  max_upcoming_per_phone constant int := 2;
  n int;
begin
  -- كلمة سر السيرفر
  if p_secret is null or not exists (
    select 1 from app_secrets
    where name = 'booking_server'
      and value_hash = encode(sha256(convert_to(p_secret, 'UTF8')), 'hex')
  ) then
    raise exception 'forbidden' using errcode = 'CB403';
  end if;

  -- البيانات
  p_name := btrim(coalesce(p_name, ''));
  p_phone := btrim(coalesce(p_phone, ''));
  if char_length(p_name) < 2 or char_length(p_name) > 60
     or p_phone !~ '^01[0125][0-9]{8}$'
     or coalesce(p_client, '') = '' then
    raise exception 'invalid data' using errcode = '22023';
  end if;

  -- الميعاد والنوع (نفس قواعد الحجز القديمة بالظبط)
  if not public.is_valid_slot(p_date, p_time)
     or not exists (select 1 from visit_types where code = p_type and patient_can_book) then
    raise exception 'invalid slot or type' using errcode = '22023';
  end if;

  -- الحد الأقصى للجهاز/الشبكة
  -- قفل صغير على الجهاز ده بس، عشان طلبين في نفس اللحظة مايعدّوش الحد سوا
  perform pg_advisory_xact_lock(hashtext('book_online:' || p_client));

  select count(*) into n from online_booking_log
  where client_hash = p_client and created_at > now() - interval '1 hour';
  if n >= max_per_hour then
    raise exception 'rate limited' using errcode = 'CB429';
  end if;

  select count(*) into n from online_booking_log
  where client_hash = p_client and created_at > now() - interval '1 day';
  if n >= max_per_day then
    raise exception 'rate limited' using errcode = 'CB429';
  end if;

  -- الرقم الواحد ميحجزش أكتر من حجزين جايين
  select count(*) into n from bookings
  where phone = p_phone
    and status = 'confirmed'
    and slot_date >= (now() at time zone 'Africa/Cairo')::date;
  if n >= max_upcoming_per_phone then
    raise exception 'too many upcoming' using errcode = 'CB409';
  end if;

  -- الحجز (السعر والمدة والمصدر بيتحطوا لوحدهم من الـ triggers)
  insert into bookings (slot_date, slot_time, patient_name, phone, visit_type, status)
  values (p_date, p_time, p_name, p_phone, p_type, 'confirmed');

  insert into online_booking_log (client_hash) values (p_client);

  -- تنضيف السجل القديم (أكتر من يومين) من وقت للتاني
  if random() < 0.05 then
    delete from online_booking_log where created_at < now() - interval '2 days';
  end if;
end;
$$;

revoke execute on function public.book_online(text, text, date, time, text, text, text) from public;
grant execute on function public.book_online(text, text, date, time, text, text, text) to anon;


-- 4) قفل الحجز المباشر من المتصفح
--    (حجز السكرتيرة من الداشبورد مش متأثر: ليه policy لوحده "staff can book")
drop policy if exists "anyone can book" on public.bookings;
revoke insert on public.bookings from anon;


-- =====================================================================
-- اختبار سريع بعد التشغيل (اختياري):
--   ده لازم يفشل بـ forbidden:
--   select public.book_online('wrong', 'x', current_date + 1, '18:00', 'تجربة', '01000000000', 'kashf');
-- =====================================================================
