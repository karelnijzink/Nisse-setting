import { VapiClient } from "@vapi-ai/server-sdk";
import { env } from "./env";

// Singleton Vapi server SDK client (server-side only).
let client: VapiClient | null = null;

export function getVapi(): VapiClient {
  if (!client) {
    client = new VapiClient({ token: env.vapiApiKey });
  }
  return client;
}
