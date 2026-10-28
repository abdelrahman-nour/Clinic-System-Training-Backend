import { clinic } from "@/config/clinic";

// بيانات منظمة لجوجل: بتعرّفه إن دي عيادة (بتساعد في الظهور في البحث)
export default function ClinicJsonLd() {
  const data = {
    "@context": "https://schema.org",
    "@type": "MedicalClinic",
    name: `عيادة ${clinic.doctorName}`,
    description: clinic.specialty,
    image: "/doctor.jpg",
    ...(clinic.phone && { telephone: clinic.phone }),
    ...(!clinic.address.startsWith("[") && { address: clinic.address }),
  };

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
