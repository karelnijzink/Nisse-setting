"use client";

import { useRef } from "react";
import { updateStatusAction } from "@/app/leads/actions";
import type { LeadStatus } from "@/lib/types";

const OPTIONS: LeadStatus[] = ["pending", "called", "booked", "failed"];

export function StatusSelect({
  id,
  current,
}: {
  id: string;
  current: LeadStatus;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={updateStatusAction}>
      <input type="hidden" name="id" value={id} />
      <select
        name="status"
        defaultValue={current}
        onChange={() => formRef.current?.requestSubmit()}
        aria-label="Change lead status"
        className="cursor-pointer rounded-md border border-slate-700 bg-slate-950/60 px-2 py-1 text-xs text-slate-200 outline-none focus:border-indigo-500"
      >
        {OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </form>
  );
}
