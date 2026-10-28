import { Cairo } from "next/font/google";
import "./globals.css";
import { clinic } from "@/config/clinic";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata = {
  // الدومين الحقيقي (من Vercel)، عشان صورة المشاركة على واتساب وفيسبوك تشتغل
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: `${clinic.doctorName} | احجز ميعادك`,
  description: `احجز ميعادك أونلاين مع ${clinic.doctorName}، ${clinic.specialty}`,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body
        className={`${cairo.variable} font-sans bg-bg text-ink antialiased`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
