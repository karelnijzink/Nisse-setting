# Nisse Group — AI Appointment-Setting Agent

Production-ready backend for **"Sam"**, an outbound AI voice agent that calls
consented SMB leads, qualifies them, and books a 15-minute discovery call on
Google Meet via Cal.com.

- **Agency:** Nisse Group (pronounced *"Nissa Group"* for TTS), Vancouver, BC
- **Voice AI:** [Vapi.ai](https://vapi.ai) (`@vapi-ai/server-sdk`)
- **LLM:** OpenAI GPT-4o-mini (via Vapi)
- **TTS/STT:** Deepgram (`aura-asteria-en` / `nova-2`) — low cost, high speed
- **Database:** Supabase (PostgreSQL)
- **Calendar:** Cal.com API v2 → Google Meet
- **Framework:** Next.js (App Router, TypeScript, Tailwind)

---

## Architecture

```
                ┌──────────────────┐
  npm run call  │ start-calling.ts │  reads pending leads, places outbound calls
   (dialer)     └────────┬─────────┘
                         │ Vapi Server SDK
                         ▼
                   ┌───────────┐   places call to lead's phone
                   │  Vapi.ai  │◄──────────────────────────────┐
                   └─────┬─────┘                               │
       server messages   │  (status-update, tool-calls,        │ speaks result
   (call lifecycle +     │   end-of-call-report)               │
    bookCalendar tool)   ▼                                     │
              ┌────────────────────────┐   tool-calls: book    │
              │ /api/vapi/webhook      │──────────────────────►│
              │ (Next.js route)        │
              └───────┬──────────┬─────┘
                      │          │
             ┌────────▼───┐  ┌───▼───────────┐
             │  Supabase  │  │  Cal.com API  │→ Google Meet invite emailed
             │ leads /    │  │  (v2 bookings)│
             │ call_logs  │  └───────────────┘
             └────────────┘
```

---

## Project layout

| Path | Purpose |
| --- | --- |
| `.env.example` | Required environment variables |
| `supabase/schema.sql` | `leads` + `call_logs` tables, enum, RLS |
| `lib/vapi-config.ts` | "Sam" assistant config (persona, voice, tools) |
| `lib/cal.ts` | Cal.com v2 availability + booking |
| `lib/supabase.ts` | Service-role Supabase client |
| `lib/vapi.ts` | Vapi Server SDK client |
| `lib/webhook-auth.ts` | Vapi webhook signature verification |
| `lib/env.ts` / `lib/types.ts` | Validated env + shared types |
| `app/api/vapi/webhook/route.ts` | Handles call lifecycle + `bookCalendar` |
| `app/api/health/route.ts` | Liveness probe |
| `scripts/start-calling.ts` | Outbound dialer |
| `scripts/start-emailing.ts` | Bulk email outreach (`npm run email`) |
| `lib/email.ts` / `lib/email-templates.ts` | Email sender + branded templates |
| `app/emails/page.tsx` | Email outbound log |
| `scripts/create-assistant.ts` | Creates/updates the Vapi assistant |

---

## Setup

### 1. Install

```bash
npm install
```

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in every value. See `.env.example` for where to find each one.

### 3. Database

Open the [Supabase SQL editor](https://supabase.com/dashboard/project/czstsfowxbxlbybhhfxn/sql)
and run the contents of [`supabase/schema.sql`](supabase/schema.sql). This
creates the `leads` and `call_logs` tables (with RLS enabled).

Add leads with `status = 'pending'`:

```sql
insert into public.leads (name, phone_number, email, company_name) values
  ('Alex Rivera', '+16045551234', 'alex@example.com', 'Rivera Roofing');
```

> ⚠️ Only call leads who have **consented** to be contacted.

### 4. Deploy the webhook

Deploy to Vercel (or any Node host) so Vapi can reach the webhook:

```
https://<your-app>.vercel.app/api/vapi/webhook
```

Set the same environment variables in your host's dashboard.

### 5. Create the Vapi assistant

```bash
WEBHOOK_URL=https://<your-app>.vercel.app/api/vapi/webhook npm run assistant:sync
```

Copy the printed `VAPI_ASSISTANT_ID` into `.env.local` (and your host).

### 6. Start calling

```bash
npm run call
```

---

## Webhook events handled

| Vapi message | Action |
| --- | --- |
| `status-update` (`in-progress`) | Insert a `call_logs` row, mark lead `called` |
| `tool-calls` → `bookCalendar` | Check Cal.com availability, create booking, mark lead `booked`, return confirmation for Sam to speak |
| `end-of-call-report` | Save transcript, summary, recording URL; finalize lead status |

Requests are authenticated by comparing the `x-vapi-secret` header against
`VAPI_WEBHOOK_SECRET` in constant time.

---

## The `bookCalendar` tool

Sam calls `bookCalendar({ name, email, startTime })` once a time is agreed.
The webhook:

1. Checks availability on the Cal.com event type for `startTime`.
2. If free, creates the booking → Cal.com emails a Google Meet invite.
3. If taken, returns the next open slot for Sam to offer instead.

---

## Email outbound

A second outreach channel, parallel to the voice agent. Emails are logged to
`appt_emails` and rendered from brand-matched templates
(`lib/email-templates.ts`).

- **Per-lead:** the **Email** button on the Leads table (server action).
- **Sequence:** `npm run email` advances every emailable lead through a
  3-touch cold sequence — **Touch 1 · Intro** (day 0) → **Touch 2 · Follow-up**
  (day 3) → **Touch 3 · Break-up** (day 7). It sends only the one touch that's
  currently due per lead, so run it on a daily schedule (cron) and each lead
  progresses one step at a time. A lead drops out of the sequence once it books.
  The steps/delays live in `lib/email-sequence.ts`; set `EMAIL_GAP_SCALE=0` to
  ignore delays while testing.
- **Log:** the **Emails** page shows every send with its rendered body + status.

### Send path (chosen from env, in priority order)

1. **Zapier webhook (`EMAIL_WEBHOOK_URL`)** — the connector integration. Create
   a Zap: *Webhooks by Zapier → Catch Hook* (copy its URL into
   `EMAIL_WEBHOOK_URL`), then *Gmail → Send Email* with **To** `{{to}}`,
   **Subject** `{{subject}}`, **Body Type** `html`, **Body** `{{html}}`. The app
   POSTs `{ to, subject, html, text, from, fromName, leadId, template }`.
   *Draft-review mode:* set the Gmail action to **Create Draft** instead of
   **Send Email** to queue each email for manual approval first.
2. **Resend (`RESEND_API_KEY`)** — a direct HTTP alternative (verified domain).
3. **Preview** — no provider set: emails are fully rendered and logged with
   status `preview`, but not delivered. Great for reviewing copy.

---

## Local development

```bash
npm run dev        # Next.js dev server on http://localhost:3000
npm run typecheck  # tsc --noEmit
npm run lint       # eslint
```

To test the webhook locally, expose it with a tunnel (e.g. `ngrok http 3000`)
and point `WEBHOOK_URL` at the tunnel when running `assistant:sync`.

---

## Notes & safety

- The service-role key bypasses RLS — keep it server-side only. RLS is enabled
  with no permissive policies, so a leaked anon key can't read lead data.
- `maxDurationSeconds` (600s) and `silenceTimeoutSeconds` (30s) cap call cost.
- Always set `VAPI_WEBHOOK_SECRET` in production; the webhook warns if unset.