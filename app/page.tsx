import Link from "next/link";
import { getStats, listCallLogs } from "@/lib/data";
import { StatCard } from "@/components/StatCard";

export default async function DashboardPage() {
  const [stats, calls] = await Promise.all([getStats(), listCallLogs()]);
  const recent = calls.slice(0, 4);

  return (
    <>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted">
            Live overview of Sam&apos;s outbound appointment-setting pipeline.
          </p>
        </div>
        <Link
          href="/leads"
          className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast shadow-card transition-colors hover:bg-brand-dark"
        >
          Manage leads
          <span aria-hidden>→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Leads" value={stats.total} />
        <StatCard label="Pending" value={stats.pending} />
        <StatCard label="Called" value={stats.called} />
        <StatCard label="Booked" value={stats.booked} />
        <StatCard
          label="Conversion"
          value={`${stats.conversionRate}%`}
          hint="booked / contacted"
          emphasis
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ink">
              Recent call activity
            </h2>
            <Link
              href="/calls"
              className="text-xs font-medium text-brand hover:text-brand-dark"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface shadow-card">
            {recent.length === 0 ? (
              <p className="p-6 text-sm text-muted">No calls logged yet.</p>
            ) : (
              recent.map((call) => (
                <div key={call.id} className="p-4">
                  <p className="line-clamp-2 text-sm text-ink/90">
                    {call.summary ?? "No summary available."}
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] text-muted">
                    {new Date(call.created_at).toLocaleString("en-CA", {
                      timeZone: "America/Vancouver",
                    })}{" "}
                    · {call.status ?? "unknown"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* How it works */}
        <div>
          <h2 className="mb-3 text-sm font-semibold text-ink">How Sam works</h2>
          <ol className="space-y-3.5 rounded-xl border border-line bg-surface p-5 text-sm text-muted shadow-card">
            {[
              "Dials consented pending leads via Vapi.",
              "Qualifies the operational bottleneck.",
              "Books a 15-min Google Meet on Cal.com.",
              "Logs transcript, summary & recording.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-brand-tint text-[11px] font-semibold text-brand-dark">
                  {i + 1}
                </span>
                <span className="text-ink/80">{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </>
  );
}
