// Cal.com API v2 client.
//
// Docs: https://cal.com/docs/api-reference/v2/introduction
// We use two endpoints:
//   - GET  /v2/slots     (cal-api-version 2024-09-04) — availability
//   - POST /v2/bookings  (cal-api-version 2024-08-13) — create booking
//
// The public booking page is https://cal.com/karel-nijzink/15min and the event
// type is configured to generate a Google Meet link, so a successful booking
// automatically emails the attendee a Meet invite.

import { env } from "./env";

const CAL_API_BASE = "https://api.cal.com/v2";
const SLOTS_API_VERSION = "2024-09-04";
const BOOKINGS_API_VERSION = "2024-08-13";

export interface AvailabilityResult {
  available: boolean;
  /** A few nearby ISO start times the caller can offer instead. */
  suggestions: string[];
}

export interface BookingResult {
  uid: string;
  status: string;
  start: string;
  meetingUrl: string | null;
}

interface CalSlotsResponse {
  status: string;
  data: Record<string, Array<{ start: string }>>;
}

interface CalBookingResponse {
  status: string;
  data: {
    uid: string;
    status: string;
    start: string;
    meetingUrl?: string | null;
    location?: string | null;
  };
  error?: { message?: string };
}

function authHeaders(apiVersion: string): HeadersInit {
  return {
    Authorization: `Bearer ${env.calApiKey}`,
    "Content-Type": "application/json",
    "cal-api-version": apiVersion,
  };
}

/** Same instant, allowing for tiny clock/format differences (< 60s). */
function sameInstant(a: string, b: string): boolean {
  const ta = new Date(a).getTime();
  const tb = new Date(b).getTime();
  if (Number.isNaN(ta) || Number.isNaN(tb)) return false;
  return Math.abs(ta - tb) < 60_000;
}

/**
 * Check whether `startTimeIso` is an open slot on the discovery-call event type.
 * Returns availability plus a handful of alternative slots on the same day.
 */
export async function checkAvailability(
  startTimeIso: string,
  timeZone: string = env.defaultTimezone,
): Promise<AvailabilityResult> {
  const start = new Date(startTimeIso);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid startTime: "${startTimeIso}"`);
  }

  // Query the whole day around the requested time so we can offer alternatives.
  const dayStart = new Date(start);
  dayStart.setUTCHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

  const url = new URL(`${CAL_API_BASE}/slots`);
  url.searchParams.set("eventTypeId", String(env.calEventTypeId));
  url.searchParams.set("start", dayStart.toISOString());
  url.searchParams.set("end", dayEnd.toISOString());
  url.searchParams.set("timeZone", timeZone);

  const res = await fetch(url, {
    method: "GET",
    headers: authHeaders(SLOTS_API_VERSION),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(
      `Cal.com availability check failed (${res.status}): ${body}`,
    );
  }

  const json = (await res.json()) as CalSlotsResponse;
  const slots = Object.values(json.data ?? {})
    .flat()
    .map((s) => s.start);

  const available = slots.some((slot) => sameInstant(slot, startTimeIso));
  const suggestions = slots.filter((slot) => !sameInstant(slot, startTimeIso));

  return { available, suggestions: suggestions.slice(0, 5) };
}

/**
 * Create a booking on the discovery-call event type for the given attendee.
 */
export async function createBooking(params: {
  name: string;
  email: string;
  startTimeIso: string;
  timeZone?: string;
  companyName?: string | null;
}): Promise<BookingResult> {
  const { name, email, startTimeIso } = params;
  const timeZone = params.timeZone ?? env.defaultTimezone;

  const start = new Date(startTimeIso);
  if (Number.isNaN(start.getTime())) {
    throw new Error(`Invalid startTime: "${startTimeIso}"`);
  }

  const res = await fetch(`${CAL_API_BASE}/bookings`, {
    method: "POST",
    headers: authHeaders(BOOKINGS_API_VERSION),
    body: JSON.stringify({
      start: start.toISOString(),
      eventTypeId: env.calEventTypeId,
      attendee: {
        name,
        email,
        timeZone,
        language: "en",
      },
      metadata: params.companyName
        ? { company: params.companyName, source: "Nisse AI Agent" }
        : { source: "Nisse AI Agent" },
    }),
  });

  const json = (await res.json()) as CalBookingResponse;

  if (!res.ok || json.status !== "success") {
    const message = json.error?.message ?? JSON.stringify(json);
    throw new Error(`Cal.com booking failed (${res.status}): ${message}`);
  }

  return {
    uid: json.data.uid,
    status: json.data.status,
    start: json.data.start,
    meetingUrl: json.data.meetingUrl ?? json.data.location ?? null,
  };
}
