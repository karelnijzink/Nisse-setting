import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { Logo } from "@/components/Brand";
import { Nav } from "@/components/Nav";
import { isSupabaseConfigured } from "@/lib/data";

export const metadata: Metadata = {
  title: "Nisse Group — AI Appointment Agent",
  description:
    "Operations console for the Nisse Group outbound AI appointment-setting agent.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const demoMode = !isSupabaseConfigured();

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-200 antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-800/80 bg-slate-900/40 p-4 md:flex">
            <div className="px-2 py-2">
              <Logo />
            </div>
            <div className="mt-6 px-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
              Workspace
            </div>
            <div className="mt-2">
              <Nav />
            </div>
            <div className="mt-auto rounded-lg border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400">
              <p className="font-medium text-slate-300">Sam</p>
              <p className="mt-0.5">
                Outbound voice agent · Vancouver, BC
              </p>
            </div>
          </aside>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Mobile top bar */}
            <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-900/40 px-4 py-3 md:hidden">
              <Logo />
              <div className="flex gap-4 text-sm">
                <Link href="/leads" className="text-slate-300">
                  Leads
                </Link>
                <Link href="/calls" className="text-slate-300">
                  Calls
                </Link>
              </div>
            </header>

            {demoMode ? (
              <div className="border-b border-amber-500/20 bg-amber-500/10 px-6 py-2 text-center text-xs font-medium text-amber-300">
                Demo mode — Supabase is not configured, so sample data is shown.
                Set <code className="font-mono">SUPABASE_URL</code> and{" "}
                <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to go
                live.
              </div>
            ) : null}

            <main className="flex-1 px-6 py-8">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
