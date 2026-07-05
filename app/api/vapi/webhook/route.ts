import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { verifyVapiSignature } from "@/lib/webhook-auth";
import { checkAvailability, createBooking } from "@/lib/cal";
import type { BookCalendarArgs } from "@/lib/types";

// Vapi webhooks are Node-runtime (we use node:crypto) and must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Loose structural types for the parts of the Vapi payload we consume.
// ---------------------------------------------------------------------------
interface VapiVariableValues {
  leadId?: string;
  name?: string;
  email?: string;
  companyName?: string;
  [key: string]: unknown;
}

interface VapiCall {
  id?: string;
  assistantOverrides?: { variableValues?: VapiVariableValues };
}

interface VapiToolCall {
  id: string;
  function?: { name?: string; arguments?: unknown };
  // Some payload versions nest the fn under `function`, others flatten it.
  name?: string;
  arguments?: unknown;
}

interface VapiMessage {
  type: string;
  status?: string;
  call?: VapiCall;
  toolCalls?: VapiToolCall[];
  toolCallList?: VapiToolCall[];
  transcript?: string;
  summary?: string;
  recordingUrl?: string;
  endedReason?: string;
  artifact?: { recordingUrl?: string; transcript?: string };
}

interface VapiWebhookBody {
  message?: VapiMessage;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function getVariableValues(call?: VapiCall): VapiVariableValues {
  return call?.assistantOverrides?.variableValues ?? {};
}

function parseToolArguments(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  if (typeof raw === "object") return raw as Record<string, unknown>;
  return {};
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/** call-started → create/patch a call_logs row. */
async function handleCallStarted(message: VapiMessage) {
  const callId = message.call?.id;
  if (!callId) return;

  const { leadId } = getVariableValues(message.call);
  const supabase = getSupabase();

  const { error } = await supabase.from("appt_call_logs").upsert(
    {
      vapi_call_id: callId,
      lead_id: leadId ?? null,
      status: "in-progress",
    },
    { onConflict: "vapi_call_id" },
  );
  if (error) {
    console.error("[vapi-webhook] call-started upsert failed:", error.message);
  }

  if (leadId) {
    await supabase
      .from("appt_leads")
      .update({ status: "called" })
      .eq("id", leadId)
      .eq("status", "pending"); // don't clobber 'booked'
  }
}

/**
 * tool-calls → run the requested tool(s) and return results to Vapi so the
 * assistant can speak the outcome.
 */
async function handleToolCalls(message: VapiMessage): Promise<NextResponse> {
  const toolCalls = message.toolCalls ?? message.toolCallList ?? [];
  const vars = getVariableValues(message.call);

  const results = await Promise.all(
    toolCalls.map(async (call) => {
      const name = call.function?.name ?? call.name;
      if (name !== "bookCalendar") {
        return {
          toolCallId: call.id,
          result: `Unknown tool "${name}".`,
        };
      }

      const args = parseToolArguments(
        call.function?.arguments ?? call.arguments,
      ) as Partial<BookCalendarArgs>;

      const bookingName = args.name ?? vars.name ?? "";
      const email = args.email ?? vars.email ?? "";
      const startTime = args.startTime ?? "";

      if (!bookingName || !email || !startTime) {
        return {
          toolCallId: call.id,
          result:
            "I couldn't book that yet — I still need the name, email, and a " +
            "specific time. Please confirm those and try again.",
        };
      }

      try {
        const availability = await checkAvailability(startTime);
        if (!availability.available) {
          const alt = availability.suggestions[0];
          return {
            toolCallId: call.id,
            result: alt
              ? `That time isn't available. The next open slot is ${alt}. ` +
                `Offer that (or ask for another time) and call bookCalendar again.`
              : "That time isn't available and there are no other openings " +
                "that day. Please ask the prospect for a different day.",
          };
        }

        const booking = await createBooking({
          name: bookingName,
          email,
          startTimeIso: startTime,
          companyName: vars.companyName ?? null,
        });

        // Mark the lead as booked.
        if (vars.leadId) {
          await getSupabase()
            .from("appt_leads")
            .update({ status: "booked" })
            .eq("id", vars.leadId);
        }

        return {
          toolCallId: call.id,
          result:
            `Booked successfully for ${booking.start}. A Google Meet invite ` +
            `has been emailed to ${email}. Confirm to the prospect and wrap up warmly.`,
        };
      } catch (err) {
        console.error("[vapi-webhook] bookCalendar failed:", err);
        return {
          toolCallId: call.id,
          result:
            "The booking system had an error. Apologize, let them know a human " +
            "will follow up by email to confirm the time, and wrap up.",
        };
      }
    }),
  );

  return NextResponse.json({ results });
}

/** end-of-call-report → persist transcript/summary/recording, finalize lead. */
async function handleCallEnded(message: VapiMessage) {
  const callId = message.call?.id;
  if (!callId) return;

  const { leadId } = getVariableValues(message.call);
  const supabase = getSupabase();

  const transcript = message.transcript ?? message.artifact?.transcript ?? null;
  const summary = message.summary ?? null;
  const recordingUrl =
    message.recordingUrl ?? message.artifact?.recordingUrl ?? null;
  const endedReason = message.endedReason ?? "ended";

  const { error } = await supabase.from("appt_call_logs").upsert(
    {
      vapi_call_id: callId,
      lead_id: leadId ?? null,
      transcript,
      summary,
      recording_url: recordingUrl,
      status: endedReason,
    },
    { onConflict: "vapi_call_id" },
  );
  if (error) {
    console.error("[vapi-webhook] call-ended upsert failed:", error.message);
  }

  // If we never reached a booking, and the lead is still just 'called',
  // mark it 'failed' so it isn't silently stuck. 'booked' is left untouched.
  if (leadId) {
    const { data: lead } = await supabase
      .from("appt_leads")
      .select("status")
      .eq("id", leadId)
      .single();

    if (lead && lead.status !== "booked") {
      await supabase
        .from("appt_leads")
        .update({ status: "failed" })
        .eq("id", leadId)
        .neq("status", "booked");
    }
  }
}

// ---------------------------------------------------------------------------
// Route entry point
// ---------------------------------------------------------------------------
export async function POST(req: Request) {
  const auth = verifyVapiSignature(req.headers);
  if (!auth.ok) {
    console.warn("[vapi-webhook] rejected:", auth.reason);
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: VapiWebhookBody;
  try {
    body = (await req.json()) as VapiWebhookBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const message = body.message;
  if (!message?.type) {
    return NextResponse.json({ error: "Missing message.type" }, { status: 400 });
  }

  try {
    switch (message.type) {
      // Vapi delivers call lifecycle via `status-update`.
      case "status-update": {
        if (message.status === "in-progress") {
          await handleCallStarted(message);
        } else if (message.status === "ended") {
          // The detailed record arrives via end-of-call-report; here we just
          // make sure the row exists / status is recorded.
          await handleCallEnded(message);
        }
        return NextResponse.json({ received: true });
      }

      case "tool-calls":
        return await handleToolCalls(message);

      case "end-of-call-report":
        await handleCallEnded(message);
        return NextResponse.json({ received: true });

      default:
        // Acknowledge unhandled message types so Vapi doesn't retry.
        return NextResponse.json({ received: true, ignored: message.type });
    }
  } catch (err) {
    console.error("[vapi-webhook] handler error:", err);
    return NextResponse.json(
      { error: "Internal error" },
      { status: 500 },
    );
  }
}

// Simple GET for uptime checks / manual verification in a browser.
export async function GET() {
  return NextResponse.json({ ok: true, service: "vapi-webhook" });
}
