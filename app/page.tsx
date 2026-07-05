import Link from "next/link";
import { getStats, listCallLogs } from "@/lib/data";
import { StatCard } from "@/components/StatCard";

function PageHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="text-2xl font-semibold tracking-tight text-white">
        {title}
      </h1>
      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const [stats, calls] = await Promise.all([getStats(), listCallLogs()]);
  const recent = calls.slice(0, 4);

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Live overview of Sam's outbound appointment-setting pipeline."
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Total Leads" value={stats.total} accent="slate" />
        <StatCard label="Pending" value={stats.pending} accent="slate" />
        <StatCard label="Called" value={stats.called} accent="amber" />
        <StatCard label="Booked" value={stats.booked} accent="emerald" />
        <StatCard
          label="Conversion"
          value={`${stats.conversionRate}%`}
          hint="booked / contacted"
          accent="indigo"
        />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Recent activity */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-200">
              Recent call activity
            </h2>
            <Link
              href="/calls"
              className="text-xs font-medium text-indigo-400 hover:text-indigo-300"
            >
              View all →
            </Link>
          </div>
          <div className="divide-y divide-slate-800 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
            {recent.length === 0 ? (
              <p className="p-6 text-sm text-slate-500">No calls logged yet.</p>
            ) : (
              recent.map((call) => (
                <div key={call.id} className="p-4">
                  <p className="line-clamp-2 text-sm text-slate-300">
                    {call.summary ?? "No summary available."}
                  </p>
                  <p className="mt-1.5 font-mono text-[11px] text-slate-500">
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
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            How Sam works
          </h2>
          <ol className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/50 p-5 text-sm text-slate-400">
            {[
              "Dials consented pending leads via Vapi.",
              "Qualifies the operational bottleneck.",
              "Books a 15-min Google Meet on Cal.com.",
              "Logs transcript, summary & recording.",
            ].map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-indigo-500/15 text-[11px] font-semibold text-indigo-300">
                  {i + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
          <Link
            href="/leads"
            className="mt-4 flex items-center justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-400"
          >
            Manage leads
          </Link>
        </div>
      </div>
    </>
  );
}
