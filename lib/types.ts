// Shared domain types for the Nisse Group appointment agent.

export type LeadStatus = "pending" | "called" | "booked" | "failed";

// NOTE: These are `type` aliases (not `interface`) on purpose — the Supabase
// client's schema constraint requires each table's Row to be assignable to
// `Record<string, unknown>`, and interfaces (unlike type aliases) lack an
// implicit index signature, which would make the whole schema resolve to
// `never`.
export type Lead = {
  id: string;
  name: string;
  phone_number: string;
  email: string | null;
  company_name: string | null;
  status: LeadStatus;
  created_at: string;
};

export type CallLog = {
  id: string;
  lead_id: string | null;
  vapi_call_id: string | null;
  transcript: string | null;
  summary: string | null;
  recording_url: string | null;
  status: string | null;
  created_at: string;
};

export type EmailStatus = "queued" | "sent" | "failed" | "preview";

export type EmailLog = {
  id: string;
  lead_id: string | null;
  to_email: string;
  subject: string;
  body_html: string | null;
  body_text: string | null;
  template: string | null;
  status: EmailStatus;
  provider: string | null;
  provider_message_id: string | null;
  error: string | null;
  created_at: string;
  sent_at: string | null;
};

// Strongly-typed Supabase schema for the JS client. The shape conforms to
// postgrest-js `GenericSchema` (each table needs Row/Insert/Update/Relationships).
export interface Database {
  public: {
    Tables: {
      appt_leads: {
        Row: Lead;
        // name + phone_number are required; everything else is defaulted/nullable.
        Insert: Pick<Lead, "name" | "phone_number"> &
          Partial<Omit<Lead, "name" | "phone_number">>;
        Update: Partial<Omit<Lead, "id" | "created_at">>;
        Relationships: [];
      };
      appt_call_logs: {
        Row: CallLog;
        // All columns are nullable/defaulted, so every field is optional on insert.
        Insert: Partial<CallLog>;
        Update: Partial<Omit<CallLog, "id" | "created_at">>;
        Relationships: [];
      };
      appt_emails: {
        Row: EmailLog;
        // to_email + subject are required; everything else is defaulted/nullable.
        Insert: Pick<EmailLog, "to_email" | "subject"> &
          Partial<Omit<EmailLog, "to_email" | "subject">>;
        Update: Partial<Omit<EmailLog, "id" | "created_at">>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      appt_lead_status: LeadStatus;
      appt_email_status: EmailStatus;
    };
    CompositeTypes: Record<string, never>;
  };
}

// ---- Arguments the LLM passes to the `bookCalendar` tool ----
export interface BookCalendarArgs {
  name: string;
  email: string;
  /** ISO-8601 start time, e.g. "2026-07-06T17:00:00-07:00". */
  startTime: string;
}
