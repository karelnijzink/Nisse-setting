import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { runEmailSequence } from "@/lib/run-sequence";

// Runs the email sequence one pass. Wired to a daily Vercel Cron (vercel.json).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(req: Request): boolean {
  const secret = env.cronSecret;
  // If no secret is configured, allow (dev). In production, set CRON_SECRET —
  // Vercel Cron sends it automatically as `Authorization: Bearer <secret>`.
  if (!secret) return true;
  const header = req.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

async function run(req: Request) {
  if (!authorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runEmailSequence();
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("[cron/email] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "run failed" },
      { status: 500 },
    );
  }
}

// Vercel Cron triggers GET; POST is allowed for manual/other schedulers.
export const GET = run;
export const POST = run;
