export function Logo({
  className = "",
  showText = true,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <Mark className="h-9 w-9" />
      {showText ? (
        <div className="leading-tight">
          <div className="text-[15px] font-semibold tracking-tight text-ink">
            Nisse<span className="text-brand"> Group</span>
          </div>
          <div className="text-[11px] font-medium tracking-wide text-muted">
            AI Appointment Agent
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * The mark: an evergreen roundel holding a stylized "nisse" hat/roof silhouette
 * over a soundwave — the quiet helper (voice) that keeps the house running.
 */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative grid place-items-center rounded-[10px] bg-brand shadow-[0_2px_8px_-2px_rgb(17_94_68_/_0.5)] ${className}`}
    >
      <svg viewBox="0 0 32 32" className="h-[62%] w-[62%]" fill="none">
        {/* nisse hat / gable */}
        <path
          d="M16 4 L26 15 H6 Z"
          fill="rgb(var(--brand-contrast))"
          opacity="0.95"
        />
        <circle cx="16" cy="4.5" r="1.8" fill="rgb(var(--accent))" />
        {/* soundwave */}
        <g
          stroke="rgb(var(--brand-contrast))"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M9 21 v4" opacity="0.7" />
          <path d="M13 19 v8" />
          <path d="M16 22 v2" opacity="0.7" />
          <path d="M19 19 v8" />
          <path d="M23 21 v4" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
}
