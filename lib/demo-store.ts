// In-memory demo data store.
//
// Used automatically when Supabase env vars are absent, so the dashboard is
// fully runnable for local development / demos without any credentials. State
// lives in the Node process and resets on restart. NEVER used when
// SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are configured.

import { randomUUID } from "node:crypto";
import type { CallLog, EmailLog, Lead, LeadStatus } from "./types";

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

const seedLeads: Lead[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Alex Rivera",
    phone_number: "+16045550142",
    email: "alex@riveraroofing.ca",
    company_name: "Rivera Roofing",
    status: "booked",
    created_at: daysAgo(4),
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Priya Sharma",
    phone_number: "+17785550193",
    email: "priya@brightsmiledental.ca",
    company_name: "Bright Smile Dental",
    status: "called",
    created_at: daysAgo(3),
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Marcus Chen",
    phone_number: "+16045550178",
    email: "marcus@coastalhvac.ca",
    company_name: "Coastal HVAC",
    status: "pending",
    created_at: daysAgo(2),
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Dana Whitfield",
    phone_number: "+12365550119",
    email: "dana@whitfieldlaw.ca",
    company_name: "Whitfield Law Group",
    status: "pending",
    created_at: daysAgo(1),
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Tomasz Kowalski",
    phone_number: "+16045550164",
    email: null,
    company_name: "Kowalski Auto Body",
    status: "failed",
    created_at: daysAgo(2),
  },
];

const seedCallLogs: CallLog[] = [
  {
    id: "aaaaaaa1-0000-4000-8000-000000000001",
    lead_id: "11111111-1111-4111-8111-111111111111",
    vapi_call_id: "demo-call-rivera",
    transcript:
      "Sam: Hi Alex, this is Sam calling from the Nissa Group in Vancouver...\n" +
      "Alex: Sure, I've got a minute.\n" +
      "Sam: What is the biggest operational bottleneck in your business right now?\n" +
      "Alex: Honestly, scheduling and following up with quotes eats my whole week.\n" +
      "Sam: It sounds like we could really help streamline that. I'd love to show you on a quick 15-minute Google Meet — does tomorrow at 2pm work?\n" +
      "Alex: Yeah, 2pm works.\n" +
      "Sam: Perfect, I've sent a Google Meet invite to your email. Talk to you then!",
    summary:
      "Alex from Rivera Roofing is overwhelmed by quote follow-ups and scheduling. Booked a 15-min discovery call for tomorrow at 2:00 PM PT.",
    recording_url: "https://storage.vapi.ai/demo-recording-rivera.mp3",
    status: "customer-ended-call",
    created_at: daysAgo(4),
  },
  {
    id: "aaaaaaa2-0000-4000-8000-000000000002",
    lead_id: "22222222-2222-4222-8222-222222222222",
    vapi_call_id: "demo-call-sharma",
    transcript:
      "Sam: Hi Priya, this is Sam calling from the Nissa Group in Vancouver...\n" +
      "Priya: I'm actually with a patient right now.\n" +
      "Sam: No problem at all — when would be a better time for me to call you back?\n" +
      "Priya: Try me Thursday afternoon.\n" +
      "Sam: Will do, thanks Priya!",
    summary:
      "Priya at Bright Smile Dental was busy with a patient. Requested a callback Thursday afternoon.",
    recording_url: "https://storage.vapi.ai/demo-recording-sharma.mp3",
    status: "customer-ended-call",
    created_at: daysAgo(3),
  },
];

// Back the mutable state on globalThis so every module instance in the process
// (RSC render + server-action bundles, which Next can load separately in dev)
// shares one store — otherwise added leads wouldn't show up after submit.
interface DemoState {
  leads: Lead[];
  callLogs: CallLog[];
  emails: EmailLog[];
}
const g = globalThis as typeof globalThis & { __nisseDemo?: DemoState };
const state: DemoState =
  g.__nisseDemo ??
  (g.__nisseDemo = {
    leads: [...seedLeads],
    callLogs: [...seedCallLogs],
    emails: [],
  });

const leads = state.leads;
const callLogs = state.callLogs;
// Tolerate an older global shape that predates the emails array.
const emails = state.emails ?? (state.emails = []);

export async function listLeads(): Promise<Lead[]> {
  return [...leads].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function listCallLogs(): Promise<CallLog[]> {
  return [...callLogs].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function addLead(input: {
  name: string;
  phone_number: string;
  email: string | null;
  company_name: string | null;
}): Promise<Lead> {
  const lead: Lead = {
    id: randomUUID(),
    name: input.name,
    phone_number: input.phone_number,
    email: input.email,
    company_name: input.company_name,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  leads.push(lead);
  return lead;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<void> {
  const lead = leads.find((l) => l.id === id);
  if (lead) lead.status = status;
}

export async function getLeadById(id: string): Promise<Lead | null> {
  return leads.find((l) => l.id === id) ?? null;
}

export async function listEmails(): Promise<EmailLog[]> {
  return [...emails].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export async function hasBeenEmailed(leadId: string): Promise<boolean> {
  return emails.some((e) => e.lead_id === leadId && e.status === "sent");
}

export async function logEmail(
  row: Omit<EmailLog, "id" | "created_at">,
): Promise<EmailLog> {
  const email: EmailLog = {
    ...row,
    id: randomUUID(),
    created_at: new Date().toISOString(),
  };
  emails.push(email);
  return email;
}
