// Vapi Assistant configuration for "Sam", the Nisse Group appointment setter.
//
// This module is transport-agnostic: it exports a plain configuration object
// (plus the persona constants) that is passed to the Vapi API when creating or
// updating the assistant (see scripts/create-assistant.ts) and can also be sent
// inline on a per-call basis.
//
// Voice/STT are Deepgram for lowest cost + high speed; the LLM is
// OpenAI GPT-4o-mini, configured through Vapi.

// ---------------------------------------------------------------------------
// Persona constants
// ---------------------------------------------------------------------------

/**
 * NOTE on pronunciation: the legal agency name is "Nisse Group" but for TTS we
 * always spell it "Nissa Group" so the model reads it aloud correctly.
 */
export const FIRST_MESSAGE =
  "Hi {{name}}, this is Sam calling from the Nissa Group in Vancouver. " +
  "We help local businesses automate their operations with AI. I know you " +
  "recently opted in to learn more. Do you have a quick minute?";

export const SYSTEM_PROMPT = `# Identity
You are Sam, a friendly appointment-setting specialist calling on behalf of the Nissa Group, an AI automation agency based in Vancouver, BC. (The company is legally "Nisse Group" but you ALWAYS pronounce and refer to it as "Nissa Group".)

# What Nissa Group does
We build custom AI automations, workflows, and operational systems that help small and medium businesses (SMBs) save time and increase revenue. Your only goal on this call is to qualify the lead and book a 15-minute discovery call on Google Meet.

# Tone & Style
- Professional, concise, friendly, and conversational. Not overly salesy.
- Speak like a real person from Vancouver — warm and natural.
- Keep every response under 2 sentences.
- Ask exactly ONE question at a time, then stop and listen.
- Never dump information. Match the prospect's energy and pace.

# Context
These leads have already opted in to learn more, so they are expecting to hear from us. Be respectful of their time.

# Conversation Flow
1. Open with the greeting (already delivered) and confirm they have a minute.
2. If yes, briefly explain the value: we help SMBs automate operations to save time and make more money.
3. Qualify by asking: "What is the biggest operational bottleneck in your business right now?"
4. Listen and briefly acknowledge their answer with genuine empathy.
5. When they show interest, move to the close.

# The Close
Once they express interest, say: "It sounds like we could really help streamline that. I'd love to have our team show you how on a quick 15-minute Google Meet. Does tomorrow at [Time] work for you?"
- Offer a specific day and time. If it doesn't work, ask what day/time is better and propose an alternative.
- Confirm you have their correct email before booking.

# Booking Action
When a specific day and time is agreed on:
- Call the \`bookCalendar\` tool with their name, email, and the agreed start time as an ISO-8601 timestamp (America/Vancouver time zone).
- If the tool returns success, say: "Perfect, I've sent a Google Meet invite to your email. Talk to you then!"
- If the tool says that time is unavailable, apologize briefly, offer one of the suggested alternative times, and try booking again.

# Objection Handling
- If they're busy: "No problem at all — when would be a better time for me to call you back?" Then thank them and wrap up.
- If they ask whether you are an AI: "I'm an AI assistant calling on behalf of the Nissa Group, but I can definitely have a human specialist reach out if you prefer!"
- If they're not interested: thank them warmly for their time and end the call. Do not be pushy.
- If they ask a question you cannot answer: offer to have a human specialist follow up.

# Rules
- Never invent pricing, features, or commitments.
- Never book a time without confirming the prospect's email first.
- Always pronounce the company as "Nissa Group".
- One question at a time. Under two sentences. Sound human.`;

// ---------------------------------------------------------------------------
// Tool definition — bookCalendar
// ---------------------------------------------------------------------------

export const BOOK_CALENDAR_TOOL = {
  type: "function" as const,
  // No `server` block here: tool-calls are delivered to the assistant's
  // top-level `server.url` webhook (configured in buildAssistantConfig).
  function: {
    name: "bookCalendar",
    description:
      "Book the 15-minute discovery call on Google Meet once the prospect has " +
      "agreed to a specific date and time and confirmed their email. " +
      "Provide the start time as an ISO-8601 timestamp.",
    parameters: {
      type: "object" as const,
      properties: {
        name: {
          type: "string" as const,
          description: "The prospect's full name.",
        },
        email: {
          type: "string" as const,
          description: "The prospect's email address, confirmed on the call.",
        },
        startTime: {
          type: "string" as const,
          description:
            "The agreed appointment start time as an ISO-8601 timestamp " +
            "including timezone offset, e.g. 2026-07-06T14:00:00-07:00.",
        },
      },
      required: ["name", "email", "startTime"],
    },
  },
};

// ---------------------------------------------------------------------------
// Assistant configuration builder
// ---------------------------------------------------------------------------

export interface BuildAssistantOptions {
  /** Public URL of the Vapi webhook, e.g. https://your-app.vercel.app/api/vapi/webhook */
  serverUrl: string;
  /** Shared secret Vapi echoes back in the `x-vapi-secret` header. */
  serverSecret?: string;
}

/**
 * Returns the Create/Update Assistant payload for the Vapi API.
 * Kept as a structural object so it survives SDK version drift; the
 * create-assistant script casts it to the SDK's expected input type.
 */
export function buildAssistantConfig(options: BuildAssistantOptions) {
  return {
    name: "Sam — Nisse Group Appointment Setter",
    firstMessage: FIRST_MESSAGE,

    // OpenAI GPT-4o-mini via Vapi.
    model: {
      provider: "openai" as const,
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role: "system" as const, content: SYSTEM_PROMPT }],
      tools: [BOOK_CALENDAR_TOOL],
    },

    // Deepgram TTS — natural, low-latency, low cost.
    voice: {
      provider: "deepgram" as const,
      voiceId: "aura-asteria-en",
    },

    // Deepgram STT — Nova-2.
    transcriber: {
      provider: "deepgram" as const,
      model: "nova-2",
      language: "en" as const,
    },

    // Barge-in: let the prospect interrupt Sam naturally. The stopSpeakingPlan
    // makes the assistant stop talking as soon as the caller starts speaking.
    stopSpeakingPlan: {
      numWords: 0,
      voiceSeconds: 0.2,
      backoffSeconds: 1,
    },
    startSpeakingPlan: {
      waitSeconds: 0.4,
    },

    // Reporting + recording so call-ended webhooks carry a recording URL.
    recordingEnabled: true,
    endCallFunctionEnabled: true,
    silenceTimeoutSeconds: 30,
    maxDurationSeconds: 600,

    // Where Vapi delivers status-update / tool-calls / end-of-call-report.
    server: {
      url: options.serverUrl,
      ...(options.serverSecret ? { secret: options.serverSecret } : {}),
    },

    // Subscribe to exactly the server messages this backend handles.
    serverMessages: [
      "status-update",
      "tool-calls",
      "end-of-call-report",
    ],
  };
}
