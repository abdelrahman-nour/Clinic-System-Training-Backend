import Link from "next/link";
import Icon from "./Icon";

// زرار واحد لكل الموقع بأشكال مختلفة
// <Button href="/book">احجز</Button>          ← لينك
// <Button onClick={...} variant="outline">     ← زرار
//
// variant: primary (برتقالي) | outline (إطار بنفسجي) | dark (بنفسجي) | danger (أحمر)
//          ghost (على خلفية غامقة) | whatsapp (أخضر) | soft (أحمر فاتح) | light (أبيض بإطار خفيف)
// size: md | lg | sm

const VARIANTS = {
  primary: [
    "bg-gradient-to-b from-[#FFAD45] to-accent text-primary-dark",
    "shadow-[0_10px_24px_-10px_rgba(247,148,29,0.35),inset_0_1px_0_rgba(255,255,255,0.5)]",
    "hover:from-[#FFB95C] hover:to-[#FF9F2E] ",
  ].join(" "),
  outline:
    "bg-white text-primary border-[1.5px] border-primary/80 hover:border-primary hover:bg-primary-soft",
  light:
    "bg-white text-primary border border-line shadow-sm hover:border-primary",
  dark: "bg-primary text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15)] hover:bg-primary-dark",
  danger: "bg-danger text-white hover:bg-[#A91F1F]",
  ghost:
    "bg-white/5 border-[1.5px] border-white/40 text-white backdrop-blur-sm hover:bg-white/15 hover:border-white/70",
  whatsapp:
    "bg-[#1E8E4E] text-white shadow-[0_8px_20px_-10px_rgba(30,142,78,0.8)] hover:bg-[#177A42]",
  soft: "bg-danger-soft text-[#B71C1C] hover:bg-[#F9D6D6]",
};

// ارتفاع ثابت (h) + padding جانبي: الزرار مايتكبسش ولا يتمط مهما كان المحتوى
const SIZES = {
  sm: "h-11 px-5 text-sm rounded-xl gap-2",
  md: "h-[52px] px-7 text-[15px] rounded-2xl gap-2.5",
  lg: "h-14 px-8 text-base rounded-2xl gap-3",
};

export function buttonClass({
  variant = "primary",
  size = "md",
  className = "",
} = {}) {
  return [
    "group relative inline-flex shrink-0 items-center justify-center font-bold leading-none whitespace-nowrap select-none",
    "outline-none focus-visible:ring-4 focus-visible:ring-accent/40 transition-all duration-200 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none",
    VARIANTS[variant],
    SIZES[size],
    className,
  ].join(" ");
}

export default function Button({
  href,
  variant,
  size,
  className,
  children,
  ...props
}) {
  const cls = buttonClass({ variant, size, className });

  if (href) {
    // لينك بره الموقع (واتساب / جوجل ماب) أو اتصال: <a> عادي
    if (/^(https?:|tel:|mailto:)/.test(href)) {
      const newTab = href.startsWith("http");
      return (
        <a
          href={href}
          className={cls}
          {...(newTab ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          {...props}
        >
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={cls} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" className={cls} {...props}>
      {children}
    </button>
  );
}

// السهم اللي جوه زرار الحجز: دايرة صغيرة بتتحرك لما تعدّي على الزرار
// <Button href="/book">احجز الآن <ButtonArrow /></Button>
export function ButtonArrow({ className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`grid place-items-center size-7 -me-2 rounded-full bg-primary-dark/10 transition-transform duration-300 group-hover:-translate-x-1 ${className}`}
    >
      <Icon name="arrow" size={15} strokeWidth={2.6} />
    </span>
  );
}
