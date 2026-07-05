/**
 * Outbound dialer for the Nisse Group appointment agent.
 *
 * Queries Supabase for leads with status = 'pending', then initiates an
 * outbound Vapi call for each — passing the lead's name (and other fields) as
 * template variables so the assistant's first message is personalized.
 *
 * Usage:
 *   npm run call                 # dial all pending leads
 *   CALL_BATCH_LIMIT=10 npm run call
 *   CALL_DELAY_MS=30000 npm run call
 *
 * Loads env from `.env.local` (preferred) then `.env`.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv(); // fall back to .env without overriding what's already set

import { getSupabase } from "@/lib/supabase";
import { getVapi } from "@/lib/vapi";
import { env } from "@/lib/env";
import type { Lead } from "@/lib/types";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchPendingLeads(): Promise<Lead[]> {
  const supabase = getSupabase();
  let query = supabase
    .from("appt_leads")
    .select("*")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (env.callBatchLimit > 0) {
    query = query.limit(env.callBatchLimit);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Failed to fetch pending leads: ${error.message}`);
  }
  return (data ?? []) as Lead[];
}

async function dialLead(lead: Lead): Promise<void> {
  const vapi = getVapi();
  const supabase = getSupabase();

  console.log(`📞 Calling ${lead.name} (${lead.phone_number})...`);

  const call = await vapi.calls.create({
    phoneNumberId: env.vapiPhoneNumberId,
    assistantId: env.vapiAssistantId,
    customer: { number: lead.phone_number },
    // Personalize the first message + give the webhook the lead context.
    assistantOverrides: {
      variableValues: {
        name: lead.name,
        leadId: lead.id,
        email: lead.email ?? "",
        companyName: lead.company_name ?? "",
      },
    },
  });

  // The SDK returns either a single Call or a batch; normalize to an id.
  const callId =
    (call as { id?: string }).id ??
    (call as { results?: Array<{ id?: string }> }).results?.[0]?.id ??
    null;

  console.log(`   ↳ Vapi call created: ${callId ?? "(unknown id)"}`);

  // Optimistically mark 'called' so a concurrent/later run won't re-dial.
  // The webhook will fill in the call_logs row and final status.
  const { error } = await supabase
    .from("appt_leads")
    .update({ status: "called" })
    .eq("id", lead.id);
  if (error) {
    console.warn(`   ⚠️  Could not update lead status: ${error.message}`);
  }
}

async function main() {
  console.log("── Nisse Group outbound dialer ──");

  const leads = await fetchPendingLeads();
  if (leads.length === 0) {
    console.log("No pending leads. Nothing to do. 👋");
    return;
  }

  console.log(
    `Found ${leads.length} pending lead(s). ` +
      `Delay between calls: ${env.callDelayMs}ms.\n`,
  );

  let ok = 0;
  let failed = 0;

  for (let i = 0; i < leads.length; i++) {
    const lead = leads[i];
    try {
      await dialLead(lead);
      ok++;
    } catch (err) {
      failed++;
      console.error(
        `   ❌ Failed to call ${lead.name}:`,
        err instanceof Error ? err.message : err,
      );
      // Mark failed so it isn't stuck in 'pending' forever.
      await getSupabase()
        .from("appt_leads")
        .update({ status: "failed" })
        .eq("id", lead.id);
    }

    // Throttle — skip the wait after the final lead.
    if (i < leads.length - 1) {
      await sleep(env.callDelayMs);
    }
  }

  console.log(`\nDone. ✅ ${ok} started, ❌ ${failed} failed.`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
