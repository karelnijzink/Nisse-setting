export default function Home() {
  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 px-6 py-16">
      <div>
        <p className="text-sm uppercase tracking-widest text-indigo-400">
          Nisse Group · Vancouver, BC
        </p>
        <h1 className="mt-2 text-3xl font-semibold">
          AI Appointment-Setting Agent
        </h1>
        <p className="mt-3 text-slate-400">
          Backend for &quot;Sam&quot;, our outbound voice agent. It qualifies
          consented leads and books 15-minute discovery calls on Google Meet via
          Cal.com.
        </p>
      </div>

      <ul className="grid gap-3 text-sm">
        <li className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <span className="font-mono text-indigo-300">POST</span>{" "}
          <span className="font-mono">/api/vapi/webhook</span> — Vapi event +
          tool-call handler
        </li>
        <li className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <span className="font-mono text-indigo-300">GET</span>{" "}
          <span className="font-mono">/api/health</span> — liveness probe
        </li>
        <li className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <span className="font-mono">npm run call</span> — start the outbound
          dialer
        </li>
        <li className="rounded-lg border border-slate-800 bg-slate-900/40 p-4">
          <span className="font-mono">npm run assistant:sync</span> —
          create/update the Vapi assistant
        </li>
      </ul>

      <p className="text-xs text-slate-500">
        This surface intentionally exposes no lead data. All PII lives in
        Supabase behind the service-role key.
      </p>
    </main>
  );
}
