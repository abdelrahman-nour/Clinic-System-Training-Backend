# Clinic Booking — Backend Spec (.NET)

> نسخة تدريب. البيانات كلها وهمية. الكود ده ملك NOURVERSE: للتعلّم بس، ممنوع يتباع أو ينشر.

This document is everything the backend team needs to rebuild the clinic booking API in **ASP.NET Core**.
The frontend (Next.js, this repo) already works against Supabase in production. Your job: build an API with
the **same behavior**, then we switch the frontend to call your API instead.

- Live reference (production behavior): ask Abdelrahman for the link
- Database schema: [`database/schema.postgres.sql`](database/schema.postgres.sql)
- How V1 enforces the rules in SQL (read-only reference): [`supabase/`](supabase)

---

## 1. Suggested stack

| Part | Choice |
|---|---|
| Framework | ASP.NET Core Web API (.NET 8 or 9), Controllers |
| Database | PostgreSQL + EF Core (Npgsql) |
| Auth | JWT bearer for staff; passwords with `PasswordHasher<T>` or BCrypt |
| Validation | FluentValidation or DataAnnotations |
| Docs | Swagger / OpenAPI |
| Rate limiting | `Microsoft.AspNetCore.RateLimiting` + the DB rule in §4.4 |
| Tests | xUnit + Testcontainers (Postgres) or an in-memory provider for unit tests |

Suggested layout: `Controllers/` → `Services/` (all business rules) → `Data/` (DbContext, entities).
Keep **all rules in Services**, never only in the frontend.

---

## 2. Clinic configuration

Put these in `appsettings.json` (section `Clinic`). The frontend has the same values in `config/clinic.js`.
**They must match**, or the frontend will show slots the API rejects.

```json
"Clinic": {
  "TimeZone": "Africa/Cairo",
  "WorkDays": [6, 0, 1, 2, 3, 4],
  "StartTime": "16:00",
  "EndTime": "22:00",
  "SlotStepMinutes": 30,
  "DaysAhead": 14
}
```

- `WorkDays`: 0 = Sunday … 6 = Saturday. Friday (5) is off.
- Slots: every 30 min from 16:00; last slot starts at **21:30** (slot + step ≤ end).
- All dates/times are **clinic local time** (Cairo). Use `TimeZoneInfo.FindSystemTimeZoneById("Africa/Cairo")`
  (works on Windows and Linux in .NET 6+). Never use server local time.

---

## 3. Data model (short)

See the SQL file for full definitions.

- **visit_types**: `code` (`kashf` / `reexam` / `followup`), `name_ar`, `duration_min`, `price` (EGP), `patient_can_book`, `sort`.
  Prices live **only** here.
- **staff**: secretaries. `email`, `password_hash`, `name`, `shift`, `is_active`.
- **bookings**: `slot_date`, `slot_time`, `patient_name`, `phone`, `visit_type` (current), `booked_type` (what the patient picked,
  never changes), `price`, `duration_min`, `status` (`confirmed` / `cancelled`), `source` (`online` / `staff`),
  `created_by`, `created_by_name`, `created_at`.
- **booking_changes**: append-only audit log (`create` / `change_type` / `cancel`) with a required `reason` and who did it.
- **online_booking_log**: one row per successful online booking, keyed by a hashed client id (for rate limiting).

---

## 4. Business rules

These are the important part. Every rule has to be enforced **on the server**.

### 4.1 Valid slot
A (date, time) is bookable only if **all** are true:
1. `date` ≥ today (Cairo) and `date` < today + `DaysAhead` (14 days, today included).
2. `date` is a work day (not Friday).
3. `time` is 16:00, 16:30 … 21:30 exactly (minutes 00 or 30, seconds 0).
4. If `date` is today: `time` > now (Cairo).
5. No other **confirmed** booking has the same (date, time). Cancelled bookings free the slot.

### 4.2 Patient data
- `name`: trimmed, 2–60 chars.
- `phone`: Egyptian mobile, regex `^01[0125][0-9]{8}$` (11 digits).
- No notes field. This is intentional (patient privacy).

### 4.3 Booking limits
- One **confirmed** booking per phone per day.
- Online only: a phone can have at most **2 upcoming** confirmed bookings (date ≥ today).
- Online only: patients can only pick types with `patient_can_book = true`.
- Staff (desk) bookings can use **any** type, and the online limits do not apply.

### 4.4 Spam protection (online booking only)
1. **Cloudflare Turnstile.** The frontend sends a `turnstileToken`. Verify it server-side:
   `POST https://challenges.cloudflare.com/turnstile/v0/siteverify` (form: `secret`, `response`, `remoteip`).
   Reject if `success != true`. Tokens are single-use.
   Test keys that always pass: site `1x00000000000000000000AA`, secret `1x0000000000000000000000000000000AA`.
2. **Per-client rate limit.** `clientHash = SHA256(serverSecret + ":" + clientIp)` (never store the raw IP).
   Count rows in `online_booking_log` for that hash: max **4 per hour** and **10 per day**.
   Insert a log row only after a **successful** booking.
   Make the count and insert atomic per client (transaction + `pg_advisory_xact_lock(hashtext(clientHash))` or a
   serializable transaction), so two parallel requests can't both pass.
   The limits are generous on purpose: many patients share one mobile-carrier IP.
3. Delete log rows older than 2 days (background job or occasional cleanup).

### 4.5 Pricing
- `price` and `duration_min` are **always** copied from `visit_types` on the server.
  The client never sends a price. If it does, ignore it.
- On create: `booked_type = visit_type`.
- On type change: recalc `price` and `duration_min` from the new type; `booked_type` stays.

### 4.6 Staff actions & audit log
- Every staff write goes through the API and writes one `booking_changes` row **in the same transaction**:
  - Desk booking → `action = 'create'`, `new_type`, `new_price`, `reason = 'حجز من المكتب'`.
  - Change type → `action = 'change_type'`, old/new type and price, staff's reason.
  - Cancel → `action = 'cancel'`, `old_type`, `old_price`, `new_price = 0`, staff's reason.
- `reason` is required for change/cancel: trimmed, 3–200 chars.
- `changed_by` / `changed_by_name` / `created_by_name` come from the **JWT user**, never from the request body.
- Only `confirmed` bookings can be changed or cancelled.
- Changing to the same type does nothing (no log row).
- No endpoint updates or deletes audit rows. No endpoint hard-deletes bookings.
- Inactive staff (`is_active = false`) can't log in, and their existing tokens are rejected.

### 4.7 Visit-type check (shown to the secretary, does not block)
For the dashboard, compute per booking from that phone's **confirmed bookings before this date**:
- `visits`: count of those bookings.
- `reexam`: ok if there is a `kashf` within the last **14 days** before this date → text `آخر كشف: {day month}`,
  else `{ ok: false, text: "مفيش كشف خلال أسبوعين بالرقم ده" }`.
- `followup`: ok if there is **any** previous visit → `آخر زيارة: {day month}`,
  else `{ ok: false, text: "مفيش زيارات قبل كده بالرقم ده" }`.
- `kashf`: `null`.

---

## 5. API

Base path: `/api`. JSON in camelCase. Dates `YYYY-MM-DD`, times `HH:mm`.

**Error format (all endpoints):**
```json
{ "code": "SLOT_TAKEN", "message": "الميعاد ده مبقاش متاح، اختار ميعاد تاني." }
```
`message` is Arabic and can be shown to the user as is. The frontend switches on `code`.

### 5.1 Public

#### `GET /api/visit-types`
Types a patient can book, ordered by `sort`.
```json
[{ "code": "kashf", "nameAr": "كشف", "durationMin": 20, "price": 300 }]
```

#### `GET /api/days`
Bookable dates (next 14 days, work days only, Cairo).
```json
["2026-10-28", "2026-10-29", "2026-10-31"]
```

#### `GET /api/slots?date=2026-10-29`
All slots of the day with availability (past times today = not available).
```json
{ "date": "2026-10-29", "slots": [{ "time": "16:00", "available": true }, { "time": "16:30", "available": false }] }
```
Do **not** return patient names or phones here: this endpoint is public.
`400 INVALID_DATE` if the date is outside the bookable range.

#### `POST /api/bookings`
```json
{ "date": "2026-10-29", "time": "18:00", "name": "محمد علي", "phone": "01012345678", "visitType": "kashf", "turnstileToken": "..." }
```
`201`:
```json
{ "date": "2026-10-29", "time": "18:00", "visitType": "kashf", "visitTypeName": "كشف", "price": 300 }
```

| Status | code | When |
|---|---|---|
| 400 | `VALIDATION` | bad name / phone / format |
| 403 | `HUMAN_CHECK_FAILED` | Turnstile failed |
| 409 | `SLOT_TAKEN` | slot taken, or became invalid (passed) while the patient was typing |
| 409 | `PHONE_DAY_TAKEN` | phone already has a booking that day |
| 409 | `PHONE_TOO_MANY_UPCOMING` | phone already has 2 upcoming bookings |
| 422 | `INVALID_SLOT` | outside hours / Friday / beyond 14 days / staff-only type |
| 429 | `RATE_LIMITED` | client limit (§4.4) |

Rely on the **unique indexes** for races: catch the Postgres `23505` error and map the index name
(`one_booking_per_slot` → `SLOT_TAKEN`, `one_booking_per_phone_day` → `PHONE_DAY_TAKEN`).
A pre-check alone is not enough, because two requests can pass it at the same moment.

### 5.2 Auth

#### `POST /api/auth/login`
```json
{ "email": "staff@example.com", "password": "..." }
```
`200`:
```json
{ "accessToken": "jwt...", "expiresIn": 43200, "staff": { "id": "uuid", "name": "سارة علي", "shift": "الشفت المسائي" } }
```
- `401 INVALID_CREDENTIALS`: same message for a wrong email or a wrong password (`الإيميل أو الباسورد غلط، جرّب تاني.`).
- `429 RATE_LIMITED`: max 5 attempts per minute per IP + email.
- Token lifetime: about one shift (e.g. 12h). Claims: `sub` = staff id, `name`.

#### `GET /api/auth/me` (JWT)
Returns `{ id, name, shift }`. Use it to render the dashboard header ("مرحباً / name / shift").

### 5.3 Staff (all require JWT)

#### `GET /api/staff/visit-types`
All types (including staff-only), with `patientCanBook`.

#### `GET /api/staff/bookings?date=2026-10-29`
Confirmed bookings of the day + summary.
```json
{
  "date": "2026-10-29",
  "summary": { "count": 2, "revenue": 375, "byType": [{ "code": "kashf", "name": "كشف", "count": 1 }] },
  "bookings": [{
    "id": "uuid", "time": "18:00", "patientName": "محمد علي", "phone": "01012345678",
    "visitType": "followup", "bookedType": "followup", "price": 75, "durationMin": 30,
    "source": "online", "createdByName": null, "createdAt": "2026-10-28T13:05:00Z",
    "visits": 3,
    "check": { "ok": true, "text": "آخر زيارة: 21 أكتوبر" },
    "changes": [{ "id": 1, "action": "change_type", "oldType": "kashf", "newType": "followup",
                  "oldPrice": 300, "newPrice": 75, "reason": "...", "changedByName": "سارة", "changedAt": "..." }]
  }]
}
```
- `revenue` = sum of `price` of confirmed bookings that day.
- The dashboard date can be any day the staff picks (past days too), not only the 14-day window.

#### `POST /api/staff/bookings`
Desk booking (patient called or walked in).
```json
{ "date": "2026-10-29", "time": "18:00", "name": "محمد علي", "phone": "01012345678", "visitType": "reexam" }
```
- Same slot rules (§4.1) and phone/day rule. No Turnstile, no rate limit, any type.
- `source = 'staff'`, `created_by` and `created_by_name` from the JWT, plus a `create` audit row.
- Errors: `VALIDATION`, `INVALID_SLOT`, `SLOT_TAKEN`, `PHONE_DAY_TAKEN`.

#### `PATCH /api/staff/bookings/{id}/visit-type`
```json
{ "visitType": "reexam", "reason": "المريض جاب الروشتة" }
```
`200` → the updated booking. Errors: `REASON_REQUIRED` (400), `BOOKING_NOT_ACTIVE` (409, missing or cancelled),
`INVALID_TYPE` (400).

#### `POST /api/staff/bookings/{id}/cancel`
```json
{ "reason": "المريض اتصل ولغى" }
```
`200`. Errors: `REASON_REQUIRED`, `BOOKING_NOT_ACTIVE`.

#### `GET /api/staff/changes?limit=200&before=<changedAt>`
Audit log, newest first, with booking info, for the "سجل التعديلات" page.
```json
[{ "id": 9, "action": "cancel", "oldType": "kashf", "newType": null, "oldPrice": 300, "newPrice": 0,
   "reason": "...", "changedByName": "سارة", "changedAt": "...",
   "booking": { "patientName": "محمد علي", "date": "2026-10-29", "time": "18:00" } }]
```
Paging: cursor by `changedAt` (`before`), `limit` max 200.

---

## 6. Security checklist

- [ ] Secrets in user-secrets / environment variables, never committed: DB connection string, JWT key,
      Turnstile secret, booking server secret.
- [ ] CORS: allow only the frontend origin(s).
- [ ] All `/api/staff/*` endpoints require a valid JWT of an **active** staff member.
- [ ] The public endpoints never return phones or names.
- [ ] Parameterized queries only (EF Core does this; be careful with raw SQL).
- [ ] Generic 500 message to clients; details only in logs.
- [ ] HTTPS only in production.

---

## 7. Acceptance tests (minimum)

1. Book a valid slot → 201, price taken from `visit_types` (sending `price: 0` changes nothing).
2. Same slot again (other phone) → 409 `SLOT_TAKEN`.
3. Same phone, same day, other slot → 409 `PHONE_DAY_TAKEN`.
4. Friday / 22:00 / 18:15 / 15 days ahead / earlier today → 422 `INVALID_SLOT`.
5. 3rd upcoming booking for one phone (online) → 409 `PHONE_TOO_MANY_UPCOMING`.
6. 5th online booking from one client within an hour → 429 `RATE_LIMITED`.
7. Bad Turnstile token → 403.
8. Two parallel requests for the same slot → exactly one 201.
9. Cancel → slot shows `available: true` again; audit row created with reason and staff name.
10. Change type → price recalculated, `bookedType` unchanged, audit row with old/new.
11. Change/cancel without reason → 400 `REASON_REQUIRED`.
12. Staff endpoints without a token → 401. With an inactive staff token → 401/403.
13. Desk booking → `source = staff`, `createdByName` = JWT name, `create` audit row.

---

## 8. Seed & local run

- Create the DB: `createdb clinic && psql -d clinic -f database/schema.postgres.sql`
- On startup in **Development** only: if `staff` is empty, create
  `staff@example.com` / `Test@12345` (`name: سكرتيرة تجربة`, `shift: الشفت المسائي`) using the real password hasher.
- Swagger at `/swagger` in Development.

---

## 9. Suggested task split (GitHub Issues)

| # | Issue | Depends on |
|---|---|---|
| 1 | Project setup: solution, EF Core, DbContext, entities, Swagger, config | — |
| 2 | Clinic time service (Cairo now, days, slot generation, `IsValidSlot`) + unit tests | 1 |
| 3 | `GET visit-types`, `GET days`, `GET slots` | 2 |
| 4 | `POST bookings` (validation, pricing, unique-index mapping) | 3 |
| 5 | Turnstile verification + per-client rate limit | 4 |
| 6 | Staff auth: login, JWT, `me`, dev seed, login rate limit | 1 |
| 7 | Dashboard day endpoint (summary, visits, check, changes) | 6 |
| 8 | Desk booking + change type + cancel (+ audit log in the same transaction) | 6 |
| 9 | Audit log endpoint with paging | 8 |
| 10 | Acceptance tests (§7) | all |
| 11 | Frontend switch: replace Supabase calls with the API (see §10) | all |

Workflow: one branch per issue → Pull Request → review → merge into `main`.

---

## 10. Where the frontend talks to the backend today

These are the only places to change when switching from Supabase to the .NET API:

| File | What it does now | Replace with |
|---|---|---|
| `lib/hooks/useTakenSlots.js` | `rpc("get_taken_slots")` | `GET /api/slots` |
| `app/book/page.jsx` | reads `visit_types` | `GET /api/visit-types` |
| `app/page.js` | reads prices | `GET /api/visit-types` |
| `app/book/actions.js` | `rpc("book_online")` + Turnstile | `POST /api/bookings` (move Turnstile check to the API) |
| `app/login/actions.js` | Supabase sign-in | `POST /api/auth/login` (store the JWT in an httpOnly cookie) |
| `proxy.js`, `lib/supabase/proxy.js` | session refresh / route guard | check the JWT cookie |
| `lib/dashboard/getDayData.js` | several queries | `GET /api/staff/bookings` |
| `app/dashboard/actions.js` | cancel / change type / desk booking | the 3 staff endpoints |
| `app/dashboard/log/page.jsx` | reads `booking_changes` | `GET /api/staff/changes` |
