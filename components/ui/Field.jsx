// خانة إدخال بالعنوان والتلميح والإيرور
// <Field id="name" label="الاسم" value={name} onChange={...} error={showErr && "..."} hint="..." />
// error: نص الإيرور، أو true لو عايز الإطار أحمر من غير رسالة
// multiline: textarea بدل input

export default function Field({ id, label, hint, error, multiline = false, className = "", ...inputProps }) {
  const base =
    "w-full rounded-xl px-4 text-base outline-none border transition-colors focus:border-2 focus:border-primary";
  const state = error ? "border-danger bg-[#FFF8F8]" : "border-[#DCD3E3] bg-white";
  const message = typeof error === "string" ? error : hint;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-bold">
        {label}
      </label>
      {multiline ? (
        <textarea id={id} rows={2} aria-invalid={Boolean(error)} className={`${base} ${state} py-3 resize-none`} {...inputProps} />
      ) : (
        <input id={id} aria-invalid={Boolean(error)} className={`${base} ${state} h-13`} {...inputProps} />
      )}
      {message && (
        <span className={`text-[12.5px] ${typeof error === "string" ? "text-danger font-semibold" : "text-muted"}`}>{message}</span>
      )}
    </div>
  );
}
