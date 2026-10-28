-- =====================================================================
-- Clinic Booking — PostgreSQL schema (training / .NET backend)
--
-- This is a plain PostgreSQL version of the production database.
-- Production runs on Supabase with the same rules (see /supabase for reference).
-- Here, all the business rules live in the .NET backend (see BACKEND_SPEC.md);
-- the database only keeps the hard guarantees (unique slots, checks, FKs).
--
-- Run:  psql -d clinic -f database/schema.postgres.sql
-- Times are clinic local time (Africa/Cairo). Dates are clinic local dates.
-- =====================================================================

create extension if not exists pgcrypto; -- gen_random_uuid()


-- ---------------------------------------------------------------------
-- 1) visit types: prices and durations live here (single source of truth)
-- ---------------------------------------------------------------------
create table visit_types (
  code             text primary key,                 -- kashf / reexam / followup
  name_ar          text not null,
  duration_min     int  not null check (duration_min between 5 and 30),  -- must be <= slot step (30)
  price            int  not null check (price >= 0), -- EGP
  patient_can_book boolean not null default true,    -- can a patient pick it online?
  sort             int  not null default 0
);

insert into visit_types (code, name_ar, duration_min, price, patient_can_book, sort) values
  ('kashf',    'كشف',       20, 300, true, 1),
  ('reexam',   'إعادة كشف', 20, 200, true, 2),
  ('followup', 'متابعة',    30, 75,  true, 3);


-- ---------------------------------------------------------------------
-- 2) staff (secretaries). Each one has her own account.
--    password_hash: ASP.NET Identity PasswordHasher / BCrypt — never plain text
-- ---------------------------------------------------------------------
create table staff (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  name          text not null check (char_length(name) between 2 and 40),
  shift         text check (shift is null or char_length(shift) <= 40),  -- e.g. 'الشفت المسائي'
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);


-- ---------------------------------------------------------------------
-- 3) bookings
-- ---------------------------------------------------------------------
create table bookings (
  id              uuid primary key default gen_random_uuid(),
  slot_date       date not null,
  slot_time       time not null,
  patient_name    text not null check (char_length(patient_name) between 2 and 60),
  phone           text not null check (phone ~ '^01[0125][0-9]{8}$'),

  visit_type      text not null references visit_types (code),  -- current type (staff can change it)
  booked_type     text not null references visit_types (code),  -- what the patient picked; never changes
  price           int  not null check (price >= 0),             -- copied from visit_types by the SERVER
  duration_min    int  not null,

  status          text not null default 'confirmed' check (status in ('confirmed', 'cancelled')),

  source          text not null default 'online' check (source in ('online', 'staff')),
  created_by      uuid references staff (id),                   -- null for online bookings
  created_by_name text,                                         -- staff name at booking time

  created_at      timestamptz not null default now(),

  check (extract(minute from slot_time) in (0, 30) and extract(second from slot_time) = 0)
);

-- one active booking per slot (cancelled bookings free the slot)
create unique index one_booking_per_slot
  on bookings (slot_date, slot_time) where status = 'confirmed';

-- one active booking per phone per day
create unique index one_booking_per_phone_day
  on bookings (phone, slot_date) where status = 'confirmed';

create index bookings_phone_idx on bookings (phone, slot_date desc);


-- ---------------------------------------------------------------------
-- 4) audit log: every staff action (create from desk / change type / cancel)
--    append-only: the API never updates or deletes rows here
-- ---------------------------------------------------------------------
create table booking_changes (
  id              bigint generated always as identity primary key,
  booking_id      uuid not null references bookings (id) on delete restrict,
  action          text not null check (action in ('create', 'change_type', 'cancel')),
  old_type        text,
  new_type        text,
  old_price       int,
  new_price       int,
  reason          text not null check (char_length(reason) between 3 and 200),
  changed_by      uuid not null references staff (id),
  changed_by_name text not null,
  changed_at      timestamptz not null default now()
);

create index booking_changes_booking_idx on booking_changes (booking_id);
create index booking_changes_time_idx on booking_changes (changed_at desc);


-- ---------------------------------------------------------------------
-- 5) online booking log (rate limiting per client)
--    client_hash = SHA256(server_secret + ":" + ip) — never store the raw IP
-- ---------------------------------------------------------------------
create table online_booking_log (
  id          bigint generated always as identity primary key,
  client_hash text not null,
  created_at  timestamptz not null default now()
);

create index online_booking_log_client_time on online_booking_log (client_hash, created_at desc);


-- ---------------------------------------------------------------------
-- Seed: a test secretary is created by the API on first run (see BACKEND_SPEC.md §8),
-- because the password hash must come from the .NET hasher.
-- ---------------------------------------------------------------------
