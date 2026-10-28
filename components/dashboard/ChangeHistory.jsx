import { CHANGE_ACTIONS, describeChange } from "@/lib/changes";
import { cairoDateTime } from "@/lib/dates";

// سجل التعديلات بتاع حجز واحد (جوه النافذة الجانبية)
export default function ChangeHistory({ changes, visitTypes }) {
  const typeName = (code) => visitTypes[code]?.name_ar ?? code;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-bold">سجل التعديلات</span>
      {changes.length === 0 ? (
        <p className="text-sm text-muted">مفيش تعديلات على الحجز ده.</p>
      ) : (
        <ol className="flex flex-col gap-2">
          {changes.map((c) => (
            <li key={c.id} className="bg-bg rounded-xl px-4 py-3 flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-muted">{CHANGE_ACTIONS[c.action]?.label ?? c.action}</span>
                <span className="text-xs text-muted">{cairoDateTime.format(new Date(c.changed_at))}</span>
              </div>
              <span className="font-bold">{describeChange(c, typeName)}</span>
              <span className="text-sm">
                <span className="text-muted">السبب: </span>
                {c.reason}
              </span>
              <span className="text-sm">
                <span className="text-muted">بواسطة: </span>
                <span className="font-bold">{c.changed_by_name}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
