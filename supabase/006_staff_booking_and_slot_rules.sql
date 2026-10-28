-- =====================================================================
-- V1.1:
--   1) الداتابيز نفسها تتأكد إن الميعاد صح (ساعات العمل + الأيام + كل نص ساعة)
--   2) السكرتيرة تحجز من الداشبورد للي معندوش نت (ويتسجل إنه من المكتب وباسمها)
-- شغّل الملف ده كله في Supabase ← SQL Editor (query جديدة)
-- =====================================================================


-- 1) قواعد الميعاد الصح
--    ⚠️ لازم تفضل زي config/clinic.js بالظبط:
--       من 16:00 لآخر ميعاد 21:30 · كل 30 دقيقة · من غير الجمعة · 14 يوم قدام
create or replace function public.is_valid_slot(d date, t time)
returns boolean
language sql
stable
set search_path = public
as $$
  with now_cairo as (select (now() at time zone 'Africa/Cairo') as ts)
  select
        d >= (select ts::date from now_cairo)                 -- مش يوم عدّى
    and d <  (select ts::date from now_cairo) + 14            -- خلال 14 يوم
    and extract(dow from d) <> 5                              -- مش جمعة (5 = الجمعة)
    and t between time '16:00' and time '21:30'               -- جوه ساعات العمل
    and extract(minute from t) in (0, 30)                     -- كل نص ساعة بالظبط
    and extract(second from t) = 0
    and (d > (select ts::date from now_cairo)                 -- لو النهارده: الميعاد لسه مجاش
         or t > (select ts::time from now_cairo));
$$;

grant execute on function public.is_valid_slot(date, time) to anon, authenticated;


-- 2) مين حجز: الموقع ولا المكتب (وباسم مين)
alter table public.bookings
  add column source text not null default 'online' check (source in ('online', 'staff')),
  add column created_by uuid,
  add column created_by_name text;

-- بيتحدد لوحده من الحساب، محدش يقدر يبعته بنفسه
create or replace function public.set_booking_source()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  who text;
begin
  select name into who from public.staff where user_id = auth.uid();

  if who is not null then
    new.source := 'staff';
    new.created_by := auth.uid();
    new.created_by_name := who;
  else
    new.source := 'online';
    new.created_by := null;
    new.created_by_name := null;
  end if;

  return new;
end;
$$;

create trigger bookings_set_source
  before insert on public.bookings
  for each row execute function public.set_booking_source();


-- 3) صلاحيات الحجز
drop policy "anyone can book" on public.bookings;

-- المريض من الموقع: ميعاد صح + كشف / إعادة / متابعة
create policy "anyone can book" on public.bookings
  for insert to anon
  with check (
    status = 'confirmed'
    and public.is_valid_slot(slot_date, slot_time)
    and visit_type in (select code from public.visit_types where patient_can_book)
  );

-- السكرتيرة من الداشبورد: لازم تكون موظفة مسجلة + ميعاد صح + أي نوع
create policy "staff can book" on public.bookings
  for insert to authenticated
  with check (
    public.is_staff()
    and status = 'confirmed'
    and public.is_valid_slot(slot_date, slot_time)
  );


-- 4) حجز المكتب بيتسجل في سجل التعديلات كمان
alter table public.booking_changes drop constraint booking_changes_action_check;
alter table public.booking_changes
  add constraint booking_changes_action_check check (action in ('create', 'change_type', 'cancel'));

create or replace function public.log_staff_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.source = 'staff' then
    insert into public.booking_changes
      (booking_id, action, old_type, new_type, old_price, new_price, reason, changed_by, changed_by_name)
    values
      (new.id, 'create', null, new.visit_type, 0, new.price, 'حجز من المكتب', new.created_by, new.created_by_name);
  end if;
  return new;
end;
$$;

create trigger bookings_log_staff_booking
  after insert on public.bookings
  for each row execute function public.log_staff_booking();
