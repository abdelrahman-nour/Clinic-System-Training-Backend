-- =====================================================================
-- V1.1: الشفت بتاع كل موظفة (بيظهر تحت اسمها في الداشبورد)
-- شغّل الملف ده في Supabase ← SQL Editor (query جديدة)
-- =====================================================================

alter table public.staff
  add column shift text check (shift is null or char_length(shift) <= 40);

-- مثال: فصل الاسم عن الشفت للحساب الحالي (غيّر القيم براحتك)
update public.staff
set name = 'سكرتيرة تجربة',
    shift = 'الشفت المسائي'
where user_id = (select id from auth.users where email = 'staff@example.com');

-- لما تضيف موظفة جديدة بعد كده:
-- insert into staff (user_id, name, shift)
-- select id, 'سارة علي', 'الشفت الصباحي' from auth.users where email = '...';
