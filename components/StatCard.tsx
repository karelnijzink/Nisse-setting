export function StatCard({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  /** Highlight the headline metric (e.g. conversion) in brand colors. */
  emphasis?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-5 shadow-card transition-shadow hover:shadow-lift ${
        emphasis
          ? "border-brand/20 bg-brand text-brand-contrast"
          : "border-line bg-surface"
      }`}
    >
      <p
        className={`text-xs font-medium uppercase tracking-wider ${
          emphasis ? "text-brand-contrast/75" : "text-muted"
        }`}
      >
        {label}
      </p>
      <p
        className={`mt-2 text-3xl font-semibold tabular-nums ${
          emphasis ? "text-brand-contrast" : "text-ink"
        }`}
      >
        {value}
      </p>
      {hint ? (
        <p
          className={`mt-1 text-xs font-medium ${
            emphasis ? "text-brand-contrast/80" : "text-muted"
          }`}
        >
          {hint}
        </p>
      ) : null}
    </div>
  );
}
