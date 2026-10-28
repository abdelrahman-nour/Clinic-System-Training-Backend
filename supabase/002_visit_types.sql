-- =====================================================================
-- V1.1: نوع الزيارة + السعر + الملاحظة + رقم واحد = حجز واحد في اليوم
-- شغّل الملف ده كله مرة واحدة في Supabase ← SQL Editor
-- =====================================================================

-- 1) جدول أنواع الزيارات: هنا الأسعار والمدد (مكان واحد بس)
create table public.visit_types (
  code text primary key,                         -- kashf / reexam / followup
  name_ar text not null,                         -- الاسم اللي بيظهر
  duration_min int not null check (duration_min between 5 and 30),
  price int not null check (price >= 0),
  patient_can_book boolean not null default true, -- المريض يقدر يختاره بنفسه؟
  sort int not null default 0
);

insert into public.visit_types (code, name_ar, duration_min, price, patient_can_book, sort) values
  ('kashf',    'كشف',        20, 300, true,  1),
  ('followup', 'متابعة',     30, 75,  true,  2),
  ('reexam',   'إعادة كشف',  20, 200, false, 3);  -- السكرتيرة بس

alter table public.visit_types enable row level security;

-- أي حد يقرا الأنواع والأسعار (المريض محتاج يشوفها)
create policy "anyone can read visit types" on public.visit_types
  for select to anon, authenticated using (true);

grant select on public.visit_types to anon, authenticated;
-- مفيش insert/update/delete لحد: الأسعار بتتغير من SQL Editor بس (لحد V3)


-- 2) أعمدة جديدة في الحجوزات
alter table public.bookings
  add column visit_type text not null default 'kashf' references public.visit_types (code),
  add column price int,
  add column duration_min int,
  add column note text check (note is null or char_length(note) <= 300);


-- 3) السعر والمدة بيتحسبوا في الداتابيز نفسها، مش من المتصفح
--    (عشان محدش يبعت price = 0 ويحجز ببلاش)
create or replace function public.set_booking_pricing()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  vt public.visit_types%rowtype;
begin
  select * into vt from public.visit_types where code = new.visit_type;
  if not found then
    raise exception 'invalid visit type' using errcode = '23514';
  end if;

  new.price := vt.price;
  new.duration_min := vt.duration_min;
  return new;
end;
$$;

-- بيشتغل لما حجز يتعمل، أو لما السكرتيرة تغيّر النوع (مثلاً لإعادة كشف)
create trigger bookings_set_pricing
  before insert or update of visit_type on public.bookings
  for each row execute function public.set_booking_pricing();


-- 4) الحجوزات القديمة تاخد سعر ومدة الكشف
update public.bookings set visit_type = 'kashf';


-- 5) المريض ميقدرش يحجز غير الأنواع المسموحله (كشف / متابعة)
drop policy "anyone can book" on public.bookings;

create policy "anyone can book" on public.bookings
  for insert to anon, authenticated
  with check (
    status = 'confirmed'
    and slot_date >= (now() at time zone 'Africa/Cairo')::date
    and visit_type in (select code from public.visit_types where patient_can_book)
  );


-- 6) حماية من الحجز الوهمي: الرقم الواحد يحجز ميعاد واحد بس في اليوم
--    ⚠️ لو فيه رقم حاجز مرتين في نفس اليوم دلوقتي، السطر ده هيفشل.
--    ساعتها امسح أو الغي واحد منهم وشغّله تاني.
create unique index one_booking_per_phone_day
  on public.bookings (phone, slot_date)
  where status = 'confirmed';
