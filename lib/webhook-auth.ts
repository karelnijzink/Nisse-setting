import { timingSafeEqual } from "node:crypto";
import { env } from "./env";

/**
 * Verify an inbound Vapi webhook.
 *
 * Vapi authenticates server messages with a shared secret configured under the
 * assistant's `server.secret`. It echoes that value back on every request in
 * the `x-vapi-secret` header. We compare it in constant time.
 *
 * If `VAPI_WEBHOOK_SECRET` is not configured, verification is skipped but a
 * warning is logged — acceptable for local dev, NOT for production.
 */
export function verifyVapiSignature(headers: Headers): {
  ok: boolean;
  reason?: string;
} {
  const expected = env.vapiWebhookSecret;

  if (!expected) {
    console.warn(
      "[vapi-webhook] VAPI_WEBHOOK_SECRET is not set — skipping signature " +
        "verification. Set it in production.",
    );
    return { ok: true };
  }

  const provided =
    headers.get("x-vapi-secret") ?? headers.get("x-vapi-signature") ?? "";

  if (!provided) {
    return { ok: false, reason: "missing x-vapi-secret header" };
  }

  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "secret mismatch" };
  }

  return { ok: true };
}
