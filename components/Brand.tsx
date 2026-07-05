export function Logo({
  className = "",
  showTag = true,
}: {
  className?: string;
  showTag?: boolean;
}) {
  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-baseline gap-2">
        <span className="font-serif text-[26px] italic leading-none text-ink">
          Nisse
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand">
          Group
        </span>
      </div>
      {showTag ? (
        <span className="mt-1 text-[11px] font-medium tracking-wide text-muted">
          AI Appointment Agent
        </span>
      ) : null}
    </div>
  );
}

/**
 * The nisse (Nordic helper) — a small green-hatted gnome, echoing the mascot
 * on nissegroup.com. Used as a compact mark where a full wordmark won't fit.
 */
export function Mark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} fill="none" aria-hidden>
      {/* hat */}
      <path
        d="M16 4 C11 10 8 15 7 20 C11 18 21 18 25 20 C24 15 21 10 16 4 Z"
        fill="rgb(var(--brand))"
      />
      {/* hat tip */}
      <circle cx="16" cy="4" r="1.6" fill="rgb(var(--accent))" />
      {/* face / beard */}
      <path
        d="M9 20 C9 25 12 29 16 29 C20 29 23 25 23 20 C21 19 11 19 9 20 Z"
        fill="rgb(var(--brand-tint))"
      />
      {/* nose */}
      <circle cx="16" cy="21.5" r="1.5" fill="rgb(var(--accent))" />
    </svg>
  );
}
