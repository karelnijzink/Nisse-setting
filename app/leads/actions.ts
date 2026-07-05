"use server";

import { revalidatePath } from "next/cache";
import { addLead, getLeadById, updateLeadStatus } from "@/lib/data";
import { sendEmail } from "@/lib/email";
import { renderTemplate, type EmailTemplate } from "@/lib/email-templates";
import { env } from "@/lib/env";
import type { EmailStatus, LeadStatus } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export interface EmailActionResult extends ActionResult {
  status?: EmailStatus;
}

const VALID_STATUSES: LeadStatus[] = ["pending", "called", "booked", "failed"];

export async function addLeadAction(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone_number") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const company = String(formData.get("company_name") ?? "").trim();

  if (!name) return { ok: false, error: "Name is required." };
  if (!phone) return { ok: false, error: "Phone number is required." };
  // Loose E.164-ish check: + and 8–15 digits.
  if (!/^\+?[0-9]{8,15}$/.test(phone.replace(/[\s()-]/g, ""))) {
    return { ok: false, error: "Enter a valid phone number (e.g. +16045550142)." };
  }

  try {
    await addLead({
      name,
      phone_number: phone,
      email: email || null,
      company_name: company || null,
    });
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to add lead.",
    };
  }

  revalidatePath("/leads");
  revalidatePath("/");
  return { ok: true };
}

export async function updateStatusAction(formData: FormData): Promise<void> {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as LeadStatus;
  if (!id || !VALID_STATUSES.includes(status)) return;

  await updateLeadStatus(id, status);
  revalidatePath("/leads");
  revalidatePath("/");
}

/** Send (or preview) an outreach email to a single lead. */
export async function sendEmailAction(
  _prev: EmailActionResult,
  formData: FormData,
): Promise<EmailActionResult> {
  const id = String(formData.get("id") ?? "");
  const template = (String(formData.get("template") ?? "cold_outreach") ===
  "follow_up"
    ? "follow_up"
    : "cold_outreach") as EmailTemplate;

  if (!id) return { ok: false, error: "Missing lead id." };

  let lead;
  try {
    lead = await getLeadById(id);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not load lead.",
    };
  }
  if (!lead) return { ok: false, error: "Lead not found." };
  if (!lead.email) {
    return { ok: false, error: "This lead has no email address." };
  }

  const rendered = renderTemplate(template, {
    name: lead.name,
    companyName: lead.company_name,
    bookingUrl: env.calBookingUrl,
    fromName: "Sam",
  });

  try {
    const { result } = await sendEmail({
      leadId: lead.id,
      to: lead.email,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      template,
    });

    revalidatePath("/emails");
    revalidatePath("/leads");
    revalidatePath("/");

    if (result.status === "failed") {
      return { ok: false, status: "failed", error: result.error ?? "Send failed." };
    }
    return { ok: true, status: result.status };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Failed to send email.",
    };
  }
}
