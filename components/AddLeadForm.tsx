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
      className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-60"
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
    "w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="rounded-xl border border-slate-800 bg-slate-900/50 p-5"
    >
      <h2 className="text-sm font-semibold text-slate-200">Add a lead</h2>
      <p className="mt-0.5 text-xs text-slate-500">
        New leads start as <span className="text-slate-300">pending</span> and
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
          <span className="text-xs font-medium text-rose-400">
            {state.error}
          </span>
        ) : null}
        {state.ok ? (
          <span className="text-xs font-medium text-emerald-400">
            Lead added.
          </span>
        ) : null}
      </div>
    </form>
  );
}
