"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { clinic } from "@/config/clinic";
import Button from "@/components/ui/Button";
import Icon from "@/components/ui/Icon";

// الهيدر بتاع الصفحات العامة (الرئيسية / الحجز / 404)
// variant:
//   "home"   ← لينكات الأقسام + زرار احجز الآن
//   "simple" ← لينك "الرئيسية" بس (صفحة الحجز)
//   "logo"   ← اللوجو بس (404)
export default function SiteHeader({ variant = "home" }) {
  const [scrolled, setScrolled] = useState(false);

  // ظل خفيف تحت الهيدر أول ما تنزل في الصفحة
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-40 bg-white border-b transition-shadow duration-300 ${
        scrolled ? "border-line shadow-[0_8px_24px_-12px_rgba(42,15,54,0.25)]" : "border-transparent"
      }`}
    >
      <div className="max-w-290 mx-auto px-4 md:px-6 h-16 md:h-18 flex items-center justify-between gap-4">
        <Link href="/" className="group flex items-center gap-3 min-w-0">
          <Image
            src="/doctor.jpg"
            alt=""
            width={44}
            height={44}
            priority
            className="shrink-0 size-10 md:size-11 rounded-full object-cover object-[50%_18%] border-2 border-accent transition-transform duration-300 group-hover:scale-105"
          />
          <span className="flex flex-col leading-tight min-w-0">
            <span className="text-[15px] md:text-base font-extrabold truncate">{clinic.doctorName}</span>
            <span className="text-[11.5px] md:text-xs text-muted truncate">{clinic.shortSpecialty}</span>
          </span>
        </Link>

        {variant === "home" && (
          <>
            <nav className="hidden md:flex items-center gap-7 text-[15px] font-semibold" aria-label="القائمة الرئيسية">
              {[
                ["#about", "عن الدكتور"],
                ["#services", "الخدمات"],
                ["#info", "المواعيد والعنوان"],
              ].map(([href, text]) => (
                <a
                  key={href}
                  href={href}
                  className="relative py-1 hover:text-primary after:absolute after:inset-x-0 after:-bottom-0.5 after:h-0.5 after:bg-accent after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100"
                >
                  {text}
                </a>
              ))}
            </nav>
            <Button href="/book" size="sm" className="px-4 md:h-12 md:px-6 md:text-[15px]">
              <Icon name="calendar" size={17} strokeWidth={2.2} />
              احجز الآن
            </Button>
          </>
        )}

        {variant === "simple" && (
          <Link href="/" className="inline-flex items-center gap-1.5 min-h-11 font-semibold text-primary hover:text-primary-dark">
            الرئيسية
            <Icon name="arrow" size={18} strokeWidth={2.2} />
          </Link>
        )}
      </div>
    </header>
  );
}
