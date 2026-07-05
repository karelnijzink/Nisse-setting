import type { LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, string> = {
  pending: "bg-stone-100 text-stone-600 ring-stone-200",
  called: "bg-amber-50 text-amber-700 ring-amber-200",
  booked: "bg-brand-tint text-brand-dark ring-brand/20",
  failed: "bg-rose-50 text-rose-600 ring-rose-200",
};

const LABELS: Record<LeadStatus, string> = {
  pending: "Pending",
  called: "Called",
  booked: "Booked",
  failed: "Failed",
};

export function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {LABELS[status]}
    </span>
  );
}
