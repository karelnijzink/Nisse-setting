/**
 * Create (or update) the "Sam" Vapi assistant from lib/vapi-config.ts.
 *
 * Usage:
 *   WEBHOOK_URL=https://your-app.vercel.app/api/vapi/webhook npm run assistant:sync
 *
 * If VAPI_ASSISTANT_ID is set, the existing assistant is updated in place;
 * otherwise a new one is created and its id is printed for you to add to .env.
 */

import { config as loadEnv } from "dotenv";
loadEnv({ path: ".env.local" });
loadEnv();

import { getVapi } from "@/lib/vapi";
import { env } from "@/lib/env";
import { buildAssistantConfig } from "@/lib/vapi-config";

async function main() {
  const webhookUrl = process.env.WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error(
      "Set WEBHOOK_URL to your deployed webhook, e.g. " +
        "https://your-app.vercel.app/api/vapi/webhook",
    );
  }

  const vapi = getVapi();
  const config = buildAssistantConfig({
    serverUrl: webhookUrl,
    serverSecret: env.vapiWebhookSecret,
  });

  // Cast to the SDK's expected input; our config is intentionally kept as a
  // plain structural object so it survives SDK version drift.
  const payload = config as unknown as Parameters<
    typeof vapi.assistants.create
  >[0];

  const existingId = process.env.VAPI_ASSISTANT_ID;

  if (existingId && existingId.trim() !== "") {
    console.log(`Updating existing assistant ${existingId}...`);
    const updated = await vapi.assistants.update(
      existingId,
      payload as unknown as Parameters<typeof vapi.assistants.update>[1],
    );
    console.log("✅ Updated:", (updated as { id?: string }).id ?? existingId);
  } else {
    console.log("Creating new assistant...");
    const created = await vapi.assistants.create(payload);
    const id = (created as { id?: string }).id;
    console.log("✅ Created assistant:", id);
    console.log("\n➡️  Add this to your .env.local:\n");
    console.log(`VAPI_ASSISTANT_ID=${id}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
