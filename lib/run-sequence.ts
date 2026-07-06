// One pass of the email sequence: find every lead with a touch due now and
// send it. Shared by the CLI runner (scripts/start-emailing.ts) and the cron
// API route (app/api/cron/email), so the logic lives in exactly one place.

import { listLeads, listEmails } from "./data";
import { sendEmail } from "./email";
import { renderTemplate, type EmailTemplate } from "./email-templates";
import { nextSequenceStep, type PriorTouch } from "./email-sequence";
import { env } from "./env";
import type { EmailLog } from "./types";

export interface SequenceAction {
  lead: string;
  email: string;
  step: string;
  template: EmailTemplate;
  status: "sent" | "preview" | "failed";
  error?: string | null;
}

export interface SequenceRunResult {
  provider: string;
  due: number;
  waiting: number;
  complete: number;
  sent: number;
  previewed: number;
  failed: number;
  actions: SequenceAction[];
}

function priorTouchesByLead(emails: EmailLog[]): Map<string, PriorTouch[]> {
  const map = new Map<string, PriorTouch[]>();
  for (const e of emails) {
    if (!e.lead_id || !e.template) continue;
    if (e.status !== "sent" && e.status !== "preview") continue;
    const list = map.get(e.lead_id) ?? [];
    list.push({ template: e.template, at: e.sent_at ?? e.created_at });
    map.set(e.lead_id, list);
  }
  return map;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export interface RunOptions {
  batchLimit?: number;
  gapScale?: number;
  delayMs?: number;
  now?: Date;
  /** Optional progress callback (used by the CLI for logging). */
  onAction?: (a: SequenceAction) => void;
}

export async function runEmailSequence(
  opts: RunOptions = {},
): Promise<SequenceRunResult> {
  const batchLimit = opts.batchLimit ?? env.emailBatchLimit;
  const gapScale = opts.gapScale ?? env.emailGapScale;
  const delayMs = opts.delayMs ?? env.emailDelayMs;
  const now = opts.now ?? new Date();
  const provider = env.emailWebhookUrl
    ? "zapier"
    : env.resendApiKey
      ? "resend"
      : "preview";

  const [leads, emails] = await Promise.all([listLeads(), listEmails()]);
  const priorByLead = priorTouchesByLead(emails);

  const due: { leadId: string; name: string; email: string; template: EmailTemplate; step: string }[] = [];
  let waiting = 0;
  let complete = 0;

  for (const lead of leads.filter((l) => l.email)) {
    const decision = nextSequenceStep(priorByLead.get(lead.id) ?? [], now, {
      stop: lead.status === "booked",
      gapScale,
    });
    if (decision.kind === "due") {
      due.push({
        leadId: lead.id,
        name: lead.name,
        email: lead.email as string,
        template: decision.step.template,
        step: decision.step.label,
      });
    } else if (decision.kind === "waiting") {
      waiting++;
    } else {
      complete++;
    }
  }

  const batch = batchLimit > 0 ? due.slice(0, batchLimit) : due;
  const actions: SequenceAction[] = [];
  let sent = 0;
  let previewed = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const t = batch[i];
    const rendered = renderTemplate(t.template, {
      name: t.name,
      companyName:
        leads.find((l) => l.id === t.leadId)?.company_name ?? null,
      bookingUrl: env.calBookingUrl,
      fromName: "Sam",
    });

    let action: SequenceAction;
    try {
      const { result } = await sendEmail({
        leadId: t.leadId,
        to: t.email,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        template: t.template,
      });
      const status =
        result.status === "sent"
          ? "sent"
          : result.status === "preview"
            ? "preview"
            : "failed";
      action = {
        lead: t.name,
        email: t.email,
        step: t.step,
        template: t.template,
        status,
        error: result.error ?? null,
      };
      if (status === "sent") sent++;
      else if (status === "preview") previewed++;
      else failed++;
    } catch (err) {
      failed++;
      action = {
        lead: t.name,
        email: t.email,
        step: t.step,
        template: t.template,
        status: "failed",
        error: err instanceof Error ? err.message : "send error",
      };
    }

    actions.push(action);
    opts.onAction?.(action);

    if (delayMs > 0 && i < batch.length - 1) await sleep(delayMs);
  }

  return {
    provider,
    due: due.length,
    waiting,
    complete,
    sent,
    previewed,
    failed,
    actions,
  };
}
