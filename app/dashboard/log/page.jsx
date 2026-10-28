import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clinic } from "@/config/clinic";
import { cairoNow } from "@/lib/slots";
import { formatDay } from "@/lib/format";
import { cairoDateKey } from "@/lib/dates";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import ChangeCard from "@/components/dashboard/ChangeCard";

export const metadata = {
  title: `سجل التعديلات | ${clinic.doctorName}`,
  robots: { index: false, follow: false },
};

// سجل التعديلات: آخر 200 تعديل، متقسمين بالأيام
export default async function LogPage() {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getClaims();
  if (!auth?.claims) redirect("/login");

  const [changesRes, typesRes, staffRes] = await Promise.all([
    supabase
      .from("booking_changes")
      .select(
        "id, action, old_type, new_type, old_price, new_price, reason, changed_by_name, changed_at, bookings(patient_name, slot_date, slot_time)",
      )
      .order("changed_at", { ascending: false })
      .limit(200),
    supabase.from("visit_types").select("code, name_ar"),
    supabase
      .from("staff")
      .select("*")
      .eq("user_id", auth.claims.sub)
      .maybeSingle(),
  ]);

  const changes = changesRes.data ?? [];
  const names = Object.fromEntries(
    (typesRes.data ?? []).map((t) => [t.code, t.name_ar]),
  );
  const typeName = (code) => names[code] ?? code;
  const staff = staffRes.data?.name
    ? { name: staffRes.data.name.split(" - ")[0], shift: staffRes.data.shift }
    : null;

  const groups = groupByDay(changes);
  const today = cairoNow().date;
  const groupTitle = (date) => {
    if (date === today) return "النهارده";
    const f = formatDay(date);
    return `${f.weekday} ${f.day} ${f.month}`;
  };

  return (
    <div className="min-h-screen">
      <DashboardHeader staff={staff} page="log" />

      <main className="max-w-225 mx-auto px-4 md:px-6 pt-7 pb-14 flex flex-col gap-6">
        <p className="text-sm text-muted leading-relaxed">
          كل حجز من المكتب، وكل تغيير في نوع زيارة أو إلغاء حجز، بيتسجل هنا
          لوحده بمين عمله وإمتى والسبب. ومحدش يقدر يعدّل أو يمسح السجل ده.
        </p>

        {changesRes.error ? (
          <div className="rounded-2xl bg-danger-soft px-5 py-6 text-center font-bold text-danger">
            معرفناش نجيب السجل، اتأكد من النت واعمل ريفرش.
          </div>
        ) : changes.length === 0 ? (
          <div className="bg-white border-[1.5px] border-dashed border-[#DCD3E3] rounded-[20px] px-6 py-12 text-center">
            <p className="text-lg font-extrabold">مفيش تعديلات لسه</p>
          </div>
        ) : (
          groups.map((g) => (
            <section key={g.date} className="flex flex-col gap-3">
              <h2 className="text-base font-extrabold text-muted">
                {groupTitle(g.date)}{" "}
                <span className="font-semibold">· {g.items.length}</span>
              </h2>
              <ol className="flex flex-col gap-3">
                {g.items.map((c, i) => (
                  <ChangeCard
                    key={c.id}
                    change={c}
                    typeName={typeName}
                    index={i}
                  />
                ))}
              </ol>
            </section>
          ))
        )}
      </main>
    </div>
  );
}

// [{ date: "2026-10-28", items: [...] }, ...] — اليوم بتوقيت القاهرة
function groupByDay(changes) {
  const groups = [];
  for (const c of changes) {
    const date = cairoDateKey.format(new Date(c.changed_at));
    let g = groups[groups.length - 1];
    if (!g || g.date !== date) groups.push((g = { date, items: [] }));
    g.items.push(c);
  }
  return groups;
}
