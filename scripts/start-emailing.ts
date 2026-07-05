/**
 * Outbound email sender for the Nisse Group agent.
 *
 * Queries leads that have an email address and haven't been emailed yet,
 * renders the branded cold-outreach template, and sends via the configured
 * provider (Zapier webhook → Resend → preview). Every attempt is logged to
 * appt_emails.
 *
 * Usage:
 *   npm run email                  # email all not-yet-emailed leads
 *   EMAIL_BATCH_LIMIT=25 npm run email
 *   EMAIL_DELAY_MS=30000 npm run email
 *
 * With no provider configured, it runs in PREVIEW mode: nothing is delivered,
 * but each rendered email is logged so you can review it in the dashboard.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { listLeads, hasBeenEmailed } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { coldOutreachEmail } from "@/lib/email-templates";
import { env } from "@/lib/env";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  console.log("── Nisse Group outbound email ──");
  console.log(
    env.isEmailConfigured
      ? `Provider: ${env.emailWebhookUrl ? "Zapier webhook" : "Resend"}`
      : "Provider: none — PREVIEW mode (nothing will be delivered).",
  );

  const leads = await listLeads();
  const withEmail = leads.filter((l) => l.email);

  // Skip leads that already have a sent email.
  const targets: typeof withEmail = [];
  for (const lead of withEmail) {
    if (!(await hasBeenEmailed(lead.id))) targets.push(lead);
  }

  const batch =
    env.emailBatchLimit > 0 ? targets.slice(0, env.emailBatchLimit) : targets;

  if (batch.length === 0) {
    console.log("No leads to email. 👋");
    return;
  }

  console.log(
    `Emailing ${batch.length} lead(s). Delay between sends: ${env.emailDelayMs}ms.\n`,
  );

  let sent = 0;
  let previewed = 0;
  let failed = 0;

  for (let i = 0; i < batch.length; i++) {
    const lead = batch[i];
    const rendered = coldOutreachEmail({
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
        template: "cold_outreach",
      });

      if (result.status === "sent") {
        sent++;
        console.log(`✉️  Sent to ${lead.name} <${lead.email}>`);
      } else if (result.status === "preview") {
        previewed++;
        console.log(`👁️  Previewed for ${lead.name} <${lead.email}>`);
      } else {
        failed++;
        console.error(`❌ Failed for ${lead.name}: ${result.error}`);
      }
    } catch (err) {
      failed++;
      console.error(
        `❌ Error for ${lead.name}:`,
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
