// Centralised, validated access to environment variables.
//
// Every getter throws a clear error if the variable is missing, so a
// misconfiguration surfaces immediately instead of as a confusing runtime
// failure deep inside an API call.

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. ` +
        `Add it to your .env.local / deployment secrets (see .env.example).`,
    );
  }
  return value;
}

function optional(name: string, fallback: string): string {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : fallback;
}

export const env = {
  // Vapi
  get vapiApiKey() {
    return required("VAPI_API_KEY");
  },
  get vapiPhoneNumberId() {
    return required("VAPI_PHONE_NUMBER_ID");
  },
  get vapiAssistantId() {
    return required("VAPI_ASSISTANT_ID");
  },
  /** Webhook secret is optional but STRONGLY recommended. */
  get vapiWebhookSecret(): string | undefined {
    const value = process.env.VAPI_WEBHOOK_SECRET;
    return value && value.trim() !== "" ? value : undefined;
  },

  // Supabase
  get supabaseUrl() {
    return required("SUPABASE_URL");
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY");
  },

  // Cal.com
  get calApiKey() {
    return required("CAL_API_KEY");
  },
  get calEventTypeId(): number {
    const raw = required("CAL_EVENT_TYPE_ID");
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      throw new Error(`CAL_EVENT_TYPE_ID must be a number, got: "${raw}"`);
    }
    return parsed;
  },

  // Optional tuning
  get defaultTimezone() {
    return optional("DEFAULT_TIMEZONE", "America/Vancouver");
  },
  get callDelayMs(): number {
    return Number.parseInt(optional("CALL_DELAY_MS", "15000"), 10);
  },
  get callBatchLimit(): number {
    return Number.parseInt(optional("CALL_BATCH_LIMIT", "0"), 10);
  },
};
