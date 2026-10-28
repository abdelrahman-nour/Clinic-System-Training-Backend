-- =====================================================================
-- V1.1: سجل التعديلات (Audit Log)
-- أي تغيير في نوع الزيارة أو إلغاء حجز:
--   1) لازم يبقى معاه سبب
--   2) بيتسجل لوحده مين عمله وإمتى (من الحساب اللي عامل login، مش بالكتابة)
--   3) محدش يقدر يعدّل أو يمسح السجل
-- شغّل الملف ده كله في Supabase ← SQL Editor (query جديدة)
-- =====================================================================


-- 1) جدول الموظفين: كل حساب login ليه اسم
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 40),
  created_at timestamptz not null default now()
);

alter table public.staff enable row level security;

create policy "staff can read staff" on public.staff
  for select to authenticated using (true);

grant select on public.staff to authenticated;

-- هل اللي عامل login ده موظف مسجل؟
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.staff where user_id = auth.uid());
$$;

revoke execute on function public.is_staff() from public, anon;
grant execute on function public.is_staff() to authenticated;


-- 2) قراءة الحجوزات للموظفين المسجلين بس (مش أي حد عامل login)
drop policy "staff can read" on public.bookings;

create policy "staff can read" on public.bookings
  for select to authenticated using (public.is_staff());


-- 3) نقفل التعديل المباشر على الحجوزات
--    من دلوقتي أي تعديل لازم يعدّي على الـ functions اللي تحت (اللي بتسجل السبب)
drop policy "staff can cancel" on public.bookings;
revoke update on public.bookings from authenticated;


-- 4) النوع الأصلي اللي المريض اختاره وقت الحجز (عشان نقارن)
alter table public.bookings
  add column booked_type text references public.visit_types (code);

update public.bookings set booked_type = visit_type;

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

  if tg_op = 'INSERT' then
    new.booked_type := new.visit_type; -- اللي المريض اختاره، ومبيتغيرش بعد كده
  end if;

  return new;
end;
$$;


-- 5) جدول السجل
create table public.booking_changes (
  id bigint generated always as identity primary key,
  booking_id uuid not null references public.bookings (id) on delete restrict,
  action text not null check (action in ('change_type', 'cancel')),
  old_type text,
  new_type text,
  old_price int,
  new_price int,
  reason text not null check (char_length(reason) between 3 and 200),
  changed_by uuid not null,
  changed_by_name text not null,
  changed_at timestamptz not null default now()
);

create index booking_changes_booking_idx on public.booking_changes (booking_id);
create index booking_changes_time_idx on public.booking_changes (changed_at desc);

alter table public.booking_changes enable row level security;

create policy "staff can read changes" on public.booking_changes
  for select to authenticated using (public.is_staff());

grant select on public.booking_changes to authenticated;
-- مفيش insert / update / delete لحد خالص: السجل بيتكتب من الـ functions بس


-- 6) تغيير نوع الزيارة (بسبب)
create or replace function public.change_visit_type(p_booking uuid, p_type text, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  who text;
  b public.bookings%rowtype;
  new_price int;
begin
  select name into who from public.staff where user_id = auth.uid();
  if who is null then
    raise exception 'not staff' using errcode = '42501';
  end if;

  p_reason := btrim(coalesce(p_reason, ''));
  if char_length(p_reason) < 3 then
    raise exception 'reason required' using errcode = '22023';
  end if;

  select * into b from public.bookings where id = p_booking for update;
  if not found or b.status <> 'confirmed' then
    raise exception 'booking not active' using errcode = 'P0002';
  end if;

  if b.visit_type = p_type then
    return; -- مفيش تغيير
  end if;

  update public.bookings set visit_type = p_type
  where id = p_booking
  returning price into new_price;

  insert into public.booking_changes
    (booking_id, action, old_type, new_type, old_price, new_price, reason, changed_by, changed_by_name)
  values
    (p_booking, 'change_type', b.visit_type, p_type, b.price, new_price, p_reason, auth.uid(), who);
end;
$$;


-- 7) إلغاء حجز (بسبب)
create or replace function public.cancel_booking(p_booking uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  who text;
  b public.bookings%rowtype;
begin
  select name into who from public.staff where user_id = auth.uid();
  if who is null then
    raise exception 'not staff' using errcode = '42501';
  end if;

  p_reason := btrim(coalesce(p_reason, ''));
  if char_length(p_reason) < 3 then
    raise exception 'reason required' using errcode = '22023';
  end if;

  select * into b from public.bookings where id = p_booking for update;
  if not found or b.status <> 'confirmed' then
    raise exception 'booking not active' using errcode = 'P0002';
  end if;

  update public.bookings set status = 'cancelled' where id = p_booking;

  insert into public.booking_changes
    (booking_id, action, old_type, new_type, old_price, new_price, reason, changed_by, changed_by_name)
  values
    (p_booking, 'cancel', b.visit_type, null, b.price, 0, p_reason, auth.uid(), who);
end;
$$;

revoke execute on function public.change_visit_type(uuid, text, text) from public, anon;
revoke execute on function public.cancel_booking(uuid, text) from public, anon;
grant execute on function public.change_visit_type(uuid, text, text) to authenticated;
grant execute on function public.cancel_booking(uuid, text) to authenticated;


-- 8) سجّل الحساب الحالي كموظف (غيّر الاسم لاسم السكرتيرة)
--    ⚠️ من غير الخطوة دي الداشبورد هيبقى فاضي، لأن القراءة بقت للموظفين المسجلين بس
insert into public.staff (user_id, name)
select id, 'سكرتيرة (تجربة)'
from auth.users
where email = 'staff@example.com';
