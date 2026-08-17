"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/calendrier", label: "Calendrier" },
  { href: "/admin/reservations", label: "Réservations" },
  { href: "/admin/clients", label: "Clients" },
  { href: "/admin/factures", label: "Factures" },
  { href: "/admin/depenses", label: "Dépenses" },
  { href: "/admin/parametres", label: "Paramètres" },
];

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <>
      {/* Barre mobile avec menu déroulant */}
      <div className="sticky top-0 z-20 border-b border-ink/10 bg-cream-50/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <p className="font-display text-lg font-bold leading-tight">Claw lab</p>
            <p className="text-xs text-ink-light">Administration</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-ink/20"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        {open && (
          <nav className="flex flex-col gap-1 border-t border-ink/10 px-4 py-3">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive(l.href) ? "bg-ink text-cream-50" : "text-ink hover:bg-ink/5"
                }`}
              >
                {l.label}
              </Link>
            ))}
            <button
              onClick={() => signOut({ callbackUrl: "/admin/login" })}
              className="rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-light transition hover:bg-ink/5"
            >
              Se déconnecter
            </button>
          </nav>
        )}
      </div>

      {/* Barre latérale fixe sur grand écran */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-ink/10 bg-white/60 px-4 py-6 lg:flex">
        <p className="px-2 font-display text-xl font-bold">Claw lab</p>
        <p className="px-2 text-xs text-ink-light">Administration</p>
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                isActive(l.href) ? "bg-ink text-cream-50" : "text-ink hover:bg-ink/5"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => signOut({ callbackUrl: "/admin/login" })}
          className="mt-auto rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-light transition hover:bg-ink/5"
        >
          Se déconnecter
        </button>
      </aside>
    </>
  );
}
