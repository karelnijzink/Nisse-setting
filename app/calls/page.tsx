import { listCallLogs, listLeads } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function CallsPage() {
  const [calls, leads] = await Promise.all([listCallLogs(), listLeads()]);
  const leadName = new Map(leads.map((l) => [l.id, l.name] as const));

  return (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">
          Call Logs
        </h1>
        <p className="mt-1 text-sm text-muted">
          Transcripts, summaries and recordings captured from Vapi.
        </p>
      </div>

      {calls.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted shadow-card">
          No calls logged yet.
        </div>
      ) : (
        <div className="space-y-4">
          {calls.map((call) => (
            <div
              key={call.id}
              className="overflow-hidden rounded-xl border border-line bg-surface shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-page/40 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {call.lead_id
                      ? leadName.get(call.lead_id) ?? "Unknown lead"
                      : "Unknown lead"}
                  </p>
                  <p className="font-mono text-[11px] text-muted">
                    {new Date(call.created_at).toLocaleString("en-CA", {
                      timeZone: "America/Vancouver",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600 ring-1 ring-inset ring-stone-200">
                    {call.status ?? "unknown"}
                  </span>
                  {call.recording_url ? (
                    <a
                      href={call.recording_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-brand hover:text-brand-dark"
                    >
                      ▶ Recording
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="px-5 py-4">
                <p className="text-sm text-ink/90">
                  {call.summary ?? "No summary available."}
                </p>

                {call.transcript ? (
                  <details className="group mt-3">
                    <summary className="cursor-pointer list-none text-xs font-medium text-brand hover:text-brand-dark">
                      <span className="group-open:hidden">Show transcript ▾</span>
                      <span className="hidden group-open:inline">
                        Hide transcript ▴
                      </span>
                    </summary>
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-page/50 p-4 font-sans text-xs leading-relaxed text-muted">
                      {call.transcript}
                    </pre>
                  </details>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
