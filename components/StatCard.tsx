export function StatCard({
  label,
  value,
  hint,
  accent = "indigo",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "indigo" | "emerald" | "amber" | "rose" | "slate";
}) {
  const accents: Record<string, string> = {
    indigo: "from-indigo-500/10 text-indigo-300",
    emerald: "from-emerald-500/10 text-emerald-300",
    amber: "from-amber-500/10 text-amber-300",
    rose: "from-rose-500/10 text-rose-300",
    slate: "from-slate-500/10 text-slate-300",
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent ${accents[accent]}`}
      />
      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          {label}
        </p>
        <p className="mt-2 text-3xl font-semibold tabular-nums text-white">
          {value}
        </p>
        {hint ? (
          <p className={`mt-1 text-xs font-medium ${accents[accent].split(" ")[1]}`}>
            {hint}
          </p>
        ) : null}
      </div>
    </div>
  );
}
