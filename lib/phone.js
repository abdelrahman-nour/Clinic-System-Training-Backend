// رقم موبايل مصري: 11 رقم ويبدأ بـ 010 / 011 / 012 / 015
export const PHONE_RE = /^01[0125][0-9]{8}$/;

export function isValidPhone(phone) {
  return PHONE_RE.test(String(phone ?? "").trim());
}

// "01012345678" ← "https://wa.me/201012345678?text=..."
export function whatsappLink(phone, text = "") {
  const url = `https://wa.me/20${String(phone).slice(1)}`;
  return text ? `${url}?text=${encodeURIComponent(text)}` : url;
}
