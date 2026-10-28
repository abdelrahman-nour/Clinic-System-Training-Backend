"use client";

import { useEffect, useRef } from "react";

// العنصر بيظهر بالراحة (fade + طلوع لفوق) أول ما يدخل الشاشة وإنت بتنزل
// <Reveal delay={100}> ... </Reveal>
// as: نوع الـ tag (div افتراضياً) — delay: بالملّي ثانية
// الشكل نفسه في app/globals.css (.reveal و .is-visible)
export default function Reveal({ as: Tag = "div", delay = 0, className = "", children, ...props }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const show = () => el.classList.add("is-visible");

    // متصفح قديم: نظهره على طول
    if (!("IntersectionObserver" in window)) return show();

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          show();
          observer.disconnect(); // بيظهر مرة واحدة بس
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.12 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Tag ref={ref} className={`reveal ${className}`} style={{ transitionDelay: `${delay}ms` }} {...props}>
      {children}
    </Tag>
  );
}
