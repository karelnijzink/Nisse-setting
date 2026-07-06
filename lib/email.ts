// Provider-agnostic email sender for the Nisse Group agent.
//
// Send path is chosen from env, in priority order:
//   1. Zapier Catch-Hook webhook (EMAIL_WEBHOOK_URL) — app → Zapier → Gmail.
//      This is the "connector" integration: no ESP account needed, sends from
//      your real inbox via a Zap (Webhooks by Zapier → Gmail: Send Email).
//   2. Resend HTTP API (RESEND_API_KEY) — a direct alternative.
//   3. Preview — no provider configured: nothing is sent, but the fully
//      rendered email is logged with status 'preview' so you can review it.
//
// Every attempt (sent / failed / preview) is written to appt_emails.

// Shared with the Node/tsx email runner, so no `import "server-only"` here.
import { env } from "./env";
import { logEmail } from "./data";
import type { EmailLog, EmailStatus } from "./types";

export interface OutboundEmail {
  leadId?: string | null;
  to: string;
  subject: string;
  html: string;
  text: string;
  template?: string;
}

export interface SendResult {
  status: EmailStatus;
  provider: string;
  providerMessageId?: string | null;
  error?: string | null;
}

type Provider = "zapier" | "resend" | "preview";

function pickProvider(): Provider {
  if (env.emailWebhookUrl) return "zapier";
  if (env.resendApiKey) return "resend";
  return "preview";
}

async function sendViaZapier(email: OutboundEmail): Promise<SendResult> {
  const res = await fetch(env.emailWebhookUrl as string, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: email.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      from: env.emailFrom,
      fromName: env.emailFromName,
      leadId: email.leadId ?? null,
      template: email.template ?? null,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    return {
      status: "failed",
      provider: "zapier",
      error: `Zapier webhook ${res.status}: ${body.slice(0, 200)}`,
    };
  }
  return { status: "sent", provider: "zapier", providerMessageId: null };
}

async function sendViaResend(email: OutboundEmail): Promise<SendResult> {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey as string}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `${env.emailFromName} <${env.emailFrom}>`,
      to: [email.to],
      subject: email.subject,
      html: email.html,
      text: email.text,
    }),
  });
  const json = (await res.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
  };
  if (!res.ok) {
    return {
      status: "failed",
      provider: "resend",
      error: json.message ?? `Resend error ${res.status}`,
    };
  }
  return {
    status: "sent",
    provider: "resend",
    providerMessageId: json.id ?? null,
  };
}

/**
 * Send (or preview) an email and record the attempt in appt_emails.
 * Never throws for a delivery failure — the failure is captured in the
 * returned result and the logged row.
 */
export async function sendEmail(email: OutboundEmail): Promise<{
  result: SendResult;
  log: EmailLog;
}> {
  const provider = pickProvider();

  let result: SendResult;
  try {
    if (provider === "zapier") result = await sendViaZapier(email);
    else if (provider === "resend") result = await sendViaResend(email);
    else result = { status: "preview", provider: "preview" };
  } catch (err) {
    result = {
      status: "failed",
      provider,
      error: err instanceof Error ? err.message : "Unknown send error",
    };
  }

  const log = await logEmail({
    lead_id: email.leadId ?? null,
    to_email: email.to,
    subject: email.subject,
    body_html: email.html,
    body_text: email.text,
    template: email.template ?? null,
    status: result.status,
    provider: result.provider,
    provider_message_id: result.providerMessageId ?? null,
    error: result.error ?? null,
    sent_at: result.status === "sent" ? new Date().toISOString() : null,
  });

  return { result, log };
}
