"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { InstagramIcon } from "@/components/instagram-icon";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/reserver", label: "Réserver" },
];

export function SiteNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/logo_clawlab.png"
            alt="Claw lab"
            width={2000}
            height={2000}
            priority
            className="h-14 w-14 rounded-full shadow-md sm:h-16 sm:w-16"
          />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-1.5">
          {links.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-3 py-2 text-sm font-medium transition sm:px-4 ${
                  active ? "bg-[#9bb5d5] text-cream-50" : "text-ink-light hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link
            href="https://www.instagram.com/the_clawlab/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Claw lab sur Instagram"
            className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-chrome text-ink shadow transition hover:scale-105 sm:h-10 sm:w-10"
          >
            <InstagramIcon className="h-4 w-4" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
