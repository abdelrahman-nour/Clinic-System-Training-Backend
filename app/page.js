import { clinic } from "@/config/clinic";
import { createClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import Hero from "@/components/home/Hero";
import About from "@/components/home/About";
import Services from "@/components/home/Services";
import Steps from "@/components/home/Steps";
import ClinicInfo from "@/components/home/ClinicInfo";
import CtaBanner from "@/components/home/CtaBanner";
import ClinicJsonLd from "@/components/home/ClinicJsonLd";

export const metadata = {
  title: `${clinic.doctorName} | ${clinic.specialty}`,
  description: `احجز ميعادك أونلاين مع ${clinic.doctorName}، ${clinic.specialty}. اختار اليوم والساعة والميعاد يتأكد على طول.`,
  openGraph: {
    title: `${clinic.doctorName} | احجز ميعادك أونلاين`,
    description: clinic.specialty,
    images: ["/doctor.jpg"],
    locale: "ar_EG",
    type: "website",
  },
};

// الصفحة الرئيسية: كل قسم في ملف لوحده جوه components/home
export default async function HomePage() {
  // الأسعار من الداتابيز (نفس الأسعار اللي في صفحة الحجز)
  const supabase = await createClient();
  const { data: prices } = await supabase.from("visit_types").select("code, name_ar, price").order("sort");

  return (
    <div className="min-h-screen flex flex-col">
      <ClinicJsonLd />
      <SiteHeader variant="home" />
      <main className="flex-1">
        <Hero />
        <About />
        <Services />
        <Steps />
        <ClinicInfo prices={prices ?? []} />
        <CtaBanner />
      </main>
      <SiteFooter variant="full" />
    </div>
  );
}
