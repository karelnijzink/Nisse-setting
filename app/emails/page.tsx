import { listEmails, listLeads } from "@/lib/data";
import { env } from "@/lib/env";
import type { EmailStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<EmailStatus, string> = {
  sent: "bg-brand-tint text-brand-dark ring-brand/20",
  preview: "bg-amber-50 text-amber-700 ring-amber-200",
  failed: "bg-rose-50 text-rose-600 ring-rose-200",
  queued: "bg-stone-100 text-stone-600 ring-stone-200",
};

export default async function EmailsPage() {
  const [emails, leads] = await Promise.all([listEmails(), listLeads()]);
  const leadName = new Map(leads.map((l) => [l.id, l.name] as const));
  const configured = env.isEmailConfigured;

  return (
    <>
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-medium text-ink">Emails</h1>
        <p className="mt-1 text-sm text-muted">
          Automated outbound sent from the leads list or the{" "}
          <code className="font-mono text-xs">start-emailing</code> script.
        </p>
      </div>

      {!configured ? (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium">Preview mode — no send provider configured.</p>
          <p className="mt-1 text-amber-700">
            Emails are fully rendered and logged, but not delivered. Set{" "}
            <code className="font-mono">EMAIL_WEBHOOK_URL</code> (Zapier → Gmail)
            or <code className="font-mono">RESEND_API_KEY</code> to send for real.
          </p>
        </div>
      ) : null}

      {emails.length === 0 ? (
        <div className="rounded-xl border border-line bg-surface p-10 text-center text-sm text-muted shadow-card">
          No emails yet. Send one from the Leads page.
        </div>
      ) : (
        <div className="space-y-4">
          {emails.map((email) => (
            <div
              key={email.id}
              className="overflow-hidden rounded-xl border border-line bg-surface shadow-card"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-page/40 px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {email.subject}
                  </p>
                  <p className="font-mono text-[11px] text-muted">
                    to {email.to_email}
                    {email.lead_id && leadName.get(email.lead_id)
                      ? ` · ${leadName.get(email.lead_id)}`
                      : ""}{" "}
                    · {new Date(email.created_at).toLocaleString("en-CA", {
                      timeZone: "America/Vancouver",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {email.provider ? (
                    <span className="text-[11px] text-muted">
                      via {email.provider}
                    </span>
                  ) : null}
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${STATUS_STYLES[email.status]}`}
                  >
                    {email.status}
                  </span>
                </div>
              </div>

              <div className="px-5 py-4">
                {email.error ? (
                  <p className="mb-2 text-xs font-medium text-rose-600">
                    {email.error}
                  </p>
                ) : null}
                {email.body_html ? (
                  <details className="group">
                    <summary className="cursor-pointer list-none text-xs font-medium text-brand hover:text-brand-dark">
                      <span className="group-open:hidden">Show email ▾</span>
                      <span className="hidden group-open:inline">Hide email ▴</span>
                    </summary>
                    <div
                      className="mt-3 overflow-hidden rounded-lg border border-line"
                      // Rendered from our own templates only — not user input.
                      dangerouslySetInnerHTML={{ __html: email.body_html }}
                    />
                  </details>
                ) : email.body_text ? (
                  <pre className="whitespace-pre-wrap font-sans text-xs text-muted">
                    {email.body_text}
                  </pre>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
