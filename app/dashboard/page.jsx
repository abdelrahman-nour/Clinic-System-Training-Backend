import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clinic } from "@/config/clinic";
import { generateDays } from "@/lib/slots";
import { formatDay } from "@/lib/format";
import { getDayData } from "@/lib/dashboard/getDayData";
import DayChips from "@/components/ui/DayChips";
import Icon from "@/components/ui/Icon";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import DaySummary from "@/components/dashboard/DaySummary";
import BookingsList from "@/components/dashboard/BookingsList";
import RefreshButton from "@/components/dashboard/RefreshButton";
import NewBookingButton from "@/components/dashboard/NewBookingButton";

export const metadata = {
  title: `الداشبورد | ${clinic.doctorName}`,
  robots: { index: false, follow: false },
};

// الداشبورد: الصفحة دي بتجمع الأجزاء بس. الداتا في lib/dashboard/getDayData.js والأجزاء في components/dashboard
export default async function DashboardPage({ searchParams }) {
  const supabase = await createClient();

  // الحماية الحقيقية: بنتأكد من الـ session هنا على السيرفر، حتى لو الـ proxy اتعدّى
  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  // اليوم المختار جاي من اللينك: /dashboard?day=2026-10-29 (لو مش من الأيام المسموحة، نعرض النهارده)
  const days = generateDays();
  const { day } = await searchParams;
  const selectedDay = days.includes(day) ? day : days[0];

  const { error, rows, visitTypes, staff, summary } = await getDayData(
    supabase,
    {
      day: selectedDay,
      userId: auth.claims.sub,
    },
  );

  const f = formatDay(selectedDay);
  const dayLabel = `${f.weekday} ${f.day} ${f.month}`;

  return (
    <div className="min-h-screen">
      <DashboardHeader staff={staff} />

      <main className="max-w-290 mx-auto px-4 md:px-6 pt-5 md:pt-7 pb-14 flex flex-col gap-5">
        <DayChips
          days={days}
          selected={selectedDay}
          hrefFor={(d) => `/dashboard?day=${d}`}
        />

        {!staff && (
          <div
            role="alert"
            className="rounded-2xl bg-accent-soft px-5 py-4 font-bold text-[#8A4A05]"
          >
            الحساب ده مش متسجل كموظف، فمش هيقدر يشوف الحجوزات ولا يعدّل. كلّم
            المسؤول عن الموقع.
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-lg md:text-[22px] font-extrabold">
            حجوزات {dayLabel}
          </h1>
          <div className="flex items-center gap-2">
            <RefreshButton />
            {staff && (
              <NewBookingButton
                days={days}
                initialDay={selectedDay}
                visitTypes={visitTypes}
              />
            )}
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl bg-danger-soft px-5 py-6 text-center font-bold text-danger">
            معرفناش نجيب الحجوزات، اتأكد من النت واعمل تحديث.
          </div>
        ) : (
          <>
            <DaySummary summary={summary} />
            {rows.length === 0 ? (
              <div className="bg-white border-[1.5px] border-dashed border-[#DCD3E3] rounded-[20px] px-6 py-12 flex flex-col items-center gap-2 text-center animate-fade-in">
                <Icon
                  name="calendar"
                  size={44}
                  strokeWidth={1.6}
                  className="text-primary"
                />
                <p className="text-lg font-extrabold">مفيش حجوزات اليوم ده</p>
                <p className="text-sm text-muted">أول ما حد يحجز هيظهر هنا.</p>
              </div>
            ) : (
              <BookingsList
                rows={rows}
                visitTypes={visitTypes}
                dayLabel={dayLabel}
                doctorName={clinic.doctorName}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
}
