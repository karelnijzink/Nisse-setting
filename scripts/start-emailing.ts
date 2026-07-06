/**
 * Sequence-aware outbound email runner for the Nisse Group agent.
 *
 * Advances every emailable lead through the cold-email SEQUENCE
 * (Touch 1 intro → Touch 2 follow-up → Touch 3 break-up), sending only the
 * one touch that is currently due for each lead. Run it on a schedule
 * (e.g. daily via cron) and each lead progresses one step at a time.
 *
 * A lead is skipped once it books (status 'booked'), once the sequence is
 * complete, or until the next touch's delay has elapsed.
 *
 * Usage:
 *   npm run email                    # advance the sequence by one due touch each
 *   EMAIL_BATCH_LIMIT=25 npm run email
 *   EMAIL_GAP_SCALE=0 npm run email  # ignore delays (send next touch now) — testing
 *
 * With no provider configured it runs in PREVIEW mode: emails are rendered
 * and logged (status 'preview') but not delivered.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { listLeads, listEmails } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { renderTemplate } from "@/lib/email-templates";
import {
  nextSequenceStep,
  type PriorTouch,
} from "@/lib/email-sequence";
import { env } from "@/lib/env";
import type { EmailLog, Lead } from "@/lib/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Group delivered touches (sent, or preview in demo) by lead. */
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

async function main() {
  console.log("── Nisse Group email sequence ──");
  console.log(
    env.isEmailConfigured
      ? `Provider: ${env.emailWebhookUrl ? "Zapier webhook" : "Resend"}`
      : "Provider: none — PREVIEW mode (nothing will be delivered).",
  );
  if (env.emailGapScale !== 1) {
    console.log(`Gap scale: ${env.emailGapScale} (delays compressed).`);
  }

  const [leads, emails] = await Promise.all([listLeads(), listEmails()]);
  const priorByLead = priorTouchesByLead(emails);
  const now = new Date();

  // Figure out who has a touch due right now.
  type Due = { lead: Lead; template: Parameters<typeof renderTemplate>[0]; label: string };
  const due: Due[] = [];
  let waiting = 0;
  let complete = 0;

  for (const lead of leads.filter((l) => l.email)) {
    const decision = nextSequenceStep(priorByLead.get(lead.id) ?? [], now, {
      stop: lead.status === "booked",
      gapScale: env.emailGapScale,
    });
    if (decision.kind === "due") {
      due.push({ lead, template: decision.step.template, label: decision.step.label });
    } else if (decision.kind === "waiting") {
      waiting++;
    } else if (decision.kind === "complete" || decision.kind === "stopped") {
      complete++;
    }
  }

  const batch = env.emailBatchLimit > 0 ? due.slice(0, env.emailBatchLimit) : due;

  console.log(
    `${due.length} touch(es) due · ${waiting} waiting · ${complete} done/stopped.\n`,
  );
  if (batch.length === 0) {
    console.log("Nothing due right now. 👋");
    return;
  }

  let sent = 0;
  let previewed = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const { lead, template, label } = batch[i];
    const rendered = renderTemplate(template, {
      name: lead.name,
      companyName: lead.company_name,
      bookingUrl: env.calBookingUrl,
      fromName: "Sam",
    });

    try {
      const { result } = await sendEmail({
        leadId: lead.id,
        to: lead.email as string,
        subject: rendered.subject,
        html: rendered.html,
        text: rendered.text,
        template,
      });

      if (result.status === "sent") {
        sent++;
        console.log(`✉️  ${label} → ${lead.name} <${lead.email}>`);
      } else if (result.status === "preview") {
        previewed++;
        console.log(`👁️  ${label} (preview) → ${lead.name} <${lead.email}>`);
      } else {
        failed++;
        console.error(`❌ ${label} → ${lead.name}: ${result.error}`);
      }
    } catch (err) {
      failed++;
      console.error(
        `❌ ${label} → ${lead.name}:`,
        err instanceof Error ? err.message : err,
      );
    }

    if (i < batch.length - 1) await sleep(env.emailDelayMs);
  }

  console.log(
    `\nDone. ✅ ${sent} sent · 👁️ ${previewed} previewed · ❌ ${failed} failed.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
