// Data-access layer for the dashboard UI.
//
// Uses the Supabase service-role client when configured; otherwise falls back
// to an in-memory demo store so the app is runnable without any credentials.
// All functions are server-only (they may touch the service-role key).

import "server-only";
import { getSupabase } from "./supabase";
import * as demo from "./demo-store";
import type { CallLog, Lead, LeadStatus } from "./types";

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
