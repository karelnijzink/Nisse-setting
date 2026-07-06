/**
 * Sequence-aware outbound email runner (CLI).
 *
 * Advances every emailable lead through the cold-email SEQUENCE
 * (Touch 1 intro → Touch 2 follow-up → Touch 3 break-up), sending only the
 * one touch that is currently due for each lead. Run it on a schedule
 * (e.g. daily) and each lead progresses one step at a time. A lead drops out
 * once it books.
 *
 * The same logic runs automatically in production via the cron route
 * (app/api/cron/email) — this script is the manual/local equivalent.
 *
 * Usage:
 *   npm run email
 *   EMAIL_BATCH_LIMIT=25 npm run email
 *   EMAIL_GAP_SCALE=0 npm run email      # ignore delays (send next touch now)
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { env } from "@/lib/env";
import { runEmailSequence } from "@/lib/run-sequence";

async function main() {
  console.log("── Nisse Group email sequence ──");
  console.log(
    env.isEmailConfigured
      ? `Provider: ${env.emailWebhookUrl ? "Zapier webhook" : "Resend"}`
      : "Provider: none — PREVIEW mode (nothing will be delivered).",
  );

  const result = await runEmailSequence({
    onAction: (a) => {
      const icon =
        a.status === "sent" ? "✉️ " : a.status === "preview" ? "👁️ " : "❌";
      const suffix = a.status === "failed" ? `: ${a.error}` : "";
      console.log(`${icon} ${a.step} → ${a.lead} <${a.email}>${suffix}`);
    },
  });

  console.log(
    `\n${result.due} due · ${result.waiting} waiting · ${result.complete} done/stopped.`,
  );
  console.log(
    `Done. ✅ ${result.sent} sent · 👁️ ${result.previewed} previewed · ❌ ${result.failed} failed.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
