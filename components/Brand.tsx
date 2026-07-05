export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-900/40">
        {/* Sound-wave mark for the voice agent */}
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="white"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          <path d="M4 12h0M8 8v8M12 5v14M16 8v8M20 12h0" />
        </svg>
      </div>
      <div className="leading-tight">
        <div className="text-sm font-semibold tracking-tight text-white">
          Nisse Group
        </div>
        <div className="text-[11px] font-medium text-slate-400">
          AI Appointment Agent
        </div>
      </div>
    </div>
  );
}
