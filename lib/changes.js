// كل حاجة تخص سجل التعديلات (booking_changes): الأسماء والألوان والنص

export const CHANGE_ACTIONS = {
  create: { label: "حجز من المكتب", badge: "bg-[#E7F0FB] text-[#1F5FA8]" },
  change_type: { label: "تغيير النوع", badge: "bg-primary-soft text-primary" },
  cancel: { label: "إلغاء", badge: "bg-danger-soft text-[#B71C1C]" },
};

// وصف التعديل في سطر: "متابعة (75) ← إعادة كشف (200)"
// typeName: function بتحوّل الكود لاسم ("kashf" ← "كشف")
export function describeChange(c, typeName) {
  if (c.action === "create") return `${typeName(c.new_type)} (${c.new_price} جنيه)`;
  if (c.action === "cancel") return `${typeName(c.old_type)} (${c.old_price} جنيه) ← اتلغى`;
  return `${typeName(c.old_type)} (${c.old_price}) ← ${typeName(c.new_type)} (${c.new_price})`;
}
