"use client";

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

  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-ink/10 bg-white/60 px-4 py-6">
      <p className="px-2 font-display text-xl font-bold">Claw lab</p>
      <p className="px-2 text-xs text-ink-light">Administration</p>
      <nav className="mt-8 flex flex-col gap-1">
        {links.map((l) => {
          const active = l.href === "/admin" ? pathname === "/admin" : pathname.startsWith(l.href);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                active ? "bg-ink text-cream-50" : "text-ink hover:bg-ink/5"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/admin/login" })}
        className="mt-auto rounded-lg px-3 py-2 text-left text-sm font-medium text-ink-light transition hover:bg-ink/5"
      >
        Se déconnecter
      </button>
    </aside>
  );
}
