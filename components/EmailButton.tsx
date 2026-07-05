"use client";

import { useFormState, useFormStatus } from "react-dom";
import {
  sendEmailAction,
  type EmailActionResult,
} from "@/app/leads/actions";

const initial: EmailActionResult = { ok: false };

function Btn({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      title={disabled ? "No email address on file" : "Send outreach email"}
      className="inline-flex items-center gap-1.5 rounded-md border border-line bg-page/50 px-2 py-1 text-xs font-medium text-ink transition-colors hover:border-brand/40 hover:text-brand-dark disabled:cursor-not-allowed disabled:opacity-40"
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </svg>
      {pending ? "Sending…" : "Email"}
    </button>
  );
}

export function EmailButton({
  id,
  hasEmail,
}: {
  id: string;
  hasEmail: boolean;
}) {
  const [state, formAction] = useFormState(sendEmailAction, initial);

  return (
    <form action={formAction} className="flex items-center gap-2">
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="template" value="cold_outreach" />
      <Btn disabled={!hasEmail} />
      {state.status === "sent" ? (
        <span className="text-xs font-medium text-brand-dark">Sent ✓</span>
      ) : null}
      {state.status === "preview" ? (
        <span className="text-xs font-medium text-amber-700">Previewed</span>
      ) : null}
      {!state.ok && state.error ? (
        <span className="text-xs font-medium text-rose-600">{state.error}</span>
      ) : null}
    </form>
  );
}
