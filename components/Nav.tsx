"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard", icon: "M3 12l9-9 9 9M5 10v10h14V10" },
  {
    href: "/leads",
    label: "Leads",
    icon: "M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-1.13a4 4 0 10-4-4 4 4 0 004 4z",
  },
  {
    href: "/calls",
    label: "Call Logs",
    icon: "M3 5a2 2 0 012-2h2l2 5-2 1a11 11 0 005 5l1-2 5 2v2a2 2 0 01-2 2A16 16 0 013 5z",
  },
  {
    href: "/emails",
    label: "Emails",
    icon: "M3 5h18v14H3zM3 7l9 6 9-6",
  },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-0.5">
      {LINKS.map((link) => {
        const active =
          link.href === "/"
            ? pathname === "/"
            : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-brand-tint text-brand-dark"
                : "text-muted hover:bg-black/[0.04] hover:text-ink"
            }`}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[18px] w-[18px]"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={link.icon} />
            </svg>
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
