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
      <body className="min-h-screen antialiased">
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="brand-wash hidden w-64 shrink-0 flex-col border-r border-line bg-surface/60 p-4 md:flex">
            <div className="px-2 py-2">
              <Logo />
            </div>
            <div className="mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
              Workspace
            </div>
            <div className="mt-2">
              <Nav />
            </div>
            <div className="mt-auto rounded-xl border border-line bg-page/60 p-3.5">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand" />
                </span>
                <p className="text-sm font-medium text-ink">Sam</p>
              </div>
              <p className="mt-1 text-xs text-muted">
                Outbound voice agent · Vancouver, BC
              </p>
            </div>
          </aside>

          {/* Main */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Mobile top bar */}
            <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 md:hidden">
              <Logo />
              <div className="flex gap-4 text-sm">
                <Link href="/leads" className="text-muted">
                  Leads
                </Link>
                <Link href="/calls" className="text-muted">
                  Calls
                </Link>
              </div>
            </header>

            {demoMode ? (
              <div className="border-b border-amber-200 bg-amber-50 px-6 py-2 text-center text-xs font-medium text-amber-800">
                Demo mode — Supabase isn&apos;t configured, so sample data is
                shown. Set{" "}
                <code className="font-mono">SUPABASE_URL</code> +{" "}
                <code className="font-mono">SUPABASE_SERVICE_ROLE_KEY</code> to go
                live.
              </div>
            ) : null}

            <main className="flex-1 px-6 py-8 lg:px-10">
              <div className="mx-auto max-w-6xl">{children}</div>
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
