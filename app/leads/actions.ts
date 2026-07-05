"use server";

import { revalidatePath } from "next/cache";
import { addLead, updateLeadStatus } from "@/lib/data";
import type { LeadStatus } from "@/lib/types";

export interface ActionResult {
  ok: boolean;
  error?: string;
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
