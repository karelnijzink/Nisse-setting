"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addLeadAction, type ActionResult } from "@/app/leads/actions";

const initial: ActionResult = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-contrast shadow-card transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Adding…" : "Add lead"}
    </button>
  );
}

export function AddLeadForm() {
  const [state, formAction] = useFormState(addLeadAction, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) formRef.current?.reset();
  }, [state]);

  const inputClass =
    "w-full rounded-lg border border-line bg-page/50 px-3 py-2 text-sm text-ink placeholder-muted/70 outline-none transition-colors focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/15";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-line bg-surface p-5 shadow-card"
    >
      <h2 className="text-sm font-semibold text-ink">Add a lead</h2>
      <p className="mt-0.5 text-xs text-muted">
        New leads start as <span className="text-brand-dark">pending</span> and
        are dialed on the next run.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input name="name" placeholder="Full name *" className={inputClass} />
        <input
          name="phone_number"
          placeholder="Phone e.g. +16045550142 *"
          className={inputClass}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          className={inputClass}
        />
        <input
          name="company_name"
          placeholder="Company"
          className={inputClass}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <SubmitButton />
        {state.error ? (
          <span className="text-xs font-medium text-rose-600">
            {state.error}
          </span>
        ) : null}
        {state.ok ? (
          <span className="text-xs font-medium text-brand-dark">
            Lead added.
          </span>
        ) : null}
      </div>
    </form>
  );
}
