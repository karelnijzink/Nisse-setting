// Data-access layer for the dashboard UI.
//
// Uses the Supabase service-role client when configured; otherwise falls back
// to an in-memory demo store so the app is runnable without any credentials.
// All functions are server-only (they may touch the service-role key).

// NOTE: intentionally not using `import "server-only"` — this module is shared
// with the Node/tsx scripts (start-emailing, etc.). It is only ever imported by
// server components, server actions, and scripts, never by a client component.
import { getSupabase } from "./supabase";
import * as demo from "./demo-store";
import type { CallLog, EmailLog, Lead, LeadStatus } from "./types";

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export interface LeadStats {
  total: number;
  pending: number;
  called: number;
  booked: number;
  failed: number;
  /** booked / (leads that have been contacted), as a percentage 0–100. */
  conversionRate: number;
}

export async function listLeads(): Promise<Lead[]> {
  if (!isSupabaseConfigured()) return demo.listLeads();

  const { data, error } = await getSupabase()
    .from("appt_leads")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listLeads failed: ${error.message}`);
  return data ?? [];
}

export async function listCallLogs(): Promise<CallLog[]> {
  if (!isSupabaseConfigured()) return demo.listCallLogs();

  const { data, error } = await getSupabase()
    .from("appt_call_logs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listCallLogs failed: ${error.message}`);
  return data ?? [];
}

export async function getStats(): Promise<LeadStats> {
  const leads = await listLeads();
  const count = (s: LeadStatus) => leads.filter((l) => l.status === s).length;

  const booked = count("booked");
  const contacted = booked + count("called") + count("failed");

  return {
    total: leads.length,
    pending: count("pending"),
    called: count("called"),
    booked,
    failed: count("failed"),
    conversionRate: contacted === 0 ? 0 : Math.round((booked / contacted) * 100),
  };
}

export async function addLead(input: {
  name: string;
  phone_number: string;
  email: string | null;
  company_name: string | null;
}): Promise<Lead> {
  if (!isSupabaseConfigured()) return demo.addLead(input);

  const { data, error } = await getSupabase()
    .from("appt_leads")
    .insert({ ...input, status: "pending" })
    .select("*")
    .single();

  if (error) throw new Error(`addLead failed: ${error.message}`);
  return data;
}

export async function updateLeadStatus(
  id: string,
  status: LeadStatus,
): Promise<void> {
  if (!isSupabaseConfigured()) return demo.updateLeadStatus(id, status);

  const { error } = await getSupabase()
    .from("appt_leads")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(`updateLeadStatus failed: ${error.message}`);
}

export async function getLeadById(id: string): Promise<Lead | null> {
  if (!isSupabaseConfigured()) return demo.getLeadById(id);

  const { data, error } = await getSupabase()
    .from("appt_leads")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`getLeadById failed: ${error.message}`);
  return data ?? null;
}

// ---------------------------------------------------------------------------
// Email outbound
// ---------------------------------------------------------------------------

export interface EmailStats {
  total: number;
  sent: number;
  failed: number;
  preview: number;
}

export async function listEmails(): Promise<EmailLog[]> {
  if (!isSupabaseConfigured()) return demo.listEmails();

  const { data, error } = await getSupabase()
    .from("appt_emails")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`listEmails failed: ${error.message}`);
  return data ?? [];
}

export async function getEmailStats(): Promise<EmailStats> {
  const emails = await listEmails();
  const count = (s: EmailLog["status"]) =>
    emails.filter((e) => e.status === s).length;
  return {
    total: emails.length,
    sent: count("sent"),
    failed: count("failed"),
    preview: count("preview"),
  };
}

/** True if the lead already has a successfully sent email logged. */
export async function hasBeenEmailed(leadId: string): Promise<boolean> {
  if (!isSupabaseConfigured()) return demo.hasBeenEmailed(leadId);

  const { count, error } = await getSupabase()
    .from("appt_emails")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("status", "sent");

  if (error) throw new Error(`hasBeenEmailed failed: ${error.message}`);
  return (count ?? 0) > 0;
}

export async function logEmail(
  row: Omit<EmailLog, "id" | "created_at">,
): Promise<EmailLog> {
  if (!isSupabaseConfigured()) return demo.logEmail(row);

  const { data, error } = await getSupabase()
    .from("appt_emails")
    .insert(row)
    .select("*")
    .single();

  if (error) throw new Error(`logEmail failed: ${error.message}`);
  return data;
}
