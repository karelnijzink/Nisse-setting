// Multi-touch cold-email sequence logic.
//
// Pure and side-effect-free so it can be unit-tested without a DB or clock:
// given a lead's prior touches and "now", decide which template (if any) is
// due next. The runner (scripts/start-emailing.ts) supplies the history and
// performs the actual send.

import type { EmailTemplate } from "./email-templates";

export interface SequenceStep {
  template: EmailTemplate;
  /** Days to wait after the PREVIOUS touch before this one is due. */
  gapDays: number;
  label: string;
}

// Day 0 → 3 → 7. Tunable via env in the runner (see gapScale).
export const SEQUENCE: SequenceStep[] = [
  { template: "cold_outreach", gapDays: 0, label: "Touch 1 · Intro" },
  { template: "follow_up", gapDays: 3, label: "Touch 2 · Follow-up" },
  { template: "break_up", gapDays: 7, label: "Touch 3 · Break-up" },
];

/** A prior touch that already went out (status sent, or preview in demo). */
export interface PriorTouch {
  template: string;
  /** ISO timestamp the touch was recorded. */
  at: string;
}

export type NextStep =
  | { kind: "due"; step: SequenceStep; index: number }
  | { kind: "waiting"; step: SequenceStep; index: number; dueAt: Date }
  | { kind: "complete" }
  | { kind: "stopped"; reason: string };

const DAY_MS = 86_400_000;

/**
 * Decide the next email for a lead.
 *
 * @param prior     touches already delivered to this lead
 * @param now       current time
 * @param opts.stop hard stop (e.g. the lead already booked) — no more emails
 * @param opts.gapScale multiply every gapDays (e.g. 1/1440 to turn days into
 *                       minutes for testing). Defaults to 1.
 */
export function nextSequenceStep(
  prior: PriorTouch[],
  now: Date,
  opts: { stop?: boolean; gapScale?: number; sequence?: SequenceStep[] } = {},
): NextStep {
  if (opts.stop) return { kind: "stopped", reason: "lead already converted" };

  const sequence = opts.sequence ?? SEQUENCE;
  const gapScale = opts.gapScale ?? 1;
  const sentTemplates = new Set(prior.map((p) => p.template));

  // First step in the sequence not yet sent.
  const index = sequence.findIndex((s) => !sentTemplates.has(s.template));
  if (index === -1) return { kind: "complete" };

  const step = sequence[index];

  // Touch 1 (no prior sends) is due immediately.
  if (index === 0) return { kind: "due", step, index };

  // Later touches wait gapDays after the most recent prior touch.
  const lastAt = prior
    .map((p) => new Date(p.at).getTime())
    .reduce((max, t) => (t > max ? t : max), 0);
  const dueAtMs = lastAt + step.gapDays * DAY_MS * gapScale;

  if (now.getTime() >= dueAtMs) return { kind: "due", step, index };
  return { kind: "waiting", step, index, dueAt: new Date(dueAtMs) };
}
