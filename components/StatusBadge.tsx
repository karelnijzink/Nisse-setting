import type { LeadStatus } from "@/lib/types";

const STYLES: Record<LeadStatus, string> = {
  pending: "bg-slate-500/15 text-slate-300 ring-slate-500/30",
  called: "bg-amber-500/15 text-amber-300 ring-amber-500/30",
  booked: "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30",
  failed: "bg-rose-500/15 text-rose-300 ring-rose-500/30",
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
