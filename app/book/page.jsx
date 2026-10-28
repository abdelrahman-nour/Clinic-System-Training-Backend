import { connection } from "next/server";
import { clinic } from "@/config/clinic";
import { createClient } from "@/lib/supabase/server";
import { generateDays } from "@/lib/slots";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import BookingFlow from "@/components/booking/BookingFlow";

export const metadata = {
  title: `احجز ميعادك | ${clinic.doctorName}`,
  description: `احجز ميعادك أونلاين مع ${clinic.doctorName}: اختار اليوم والساعة والميعاد يتأكد على طول.`,
};

// صفحة الحجز: السيرفر بيجهز الأيام وأنواع الزيارات، والحجز نفسه في BookingFlow
export default async function BookPage() {
  // الصفحة لازم تتعمل مع كل زيارة (مش مرة واحدة وقت الرفع)، عشان الأيام تبدأ من النهارده
  await connection();

  const supabase = await createClient();
  const { data: visitTypes } = await supabase
    .from("visit_types")
    .select("code, name_ar, duration_min, price")
    .eq("patient_can_book", true)
    .order("sort");

  return (
    <div className="min-h-screen flex flex-col">
      <SiteHeader variant="simple" />
      <BookingFlow days={generateDays()} visitTypes={visitTypes ?? []} />
      <SiteFooter variant="simple" />
    </div>
  );
}
