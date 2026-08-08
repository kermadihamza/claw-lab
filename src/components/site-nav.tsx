import Image from "next/image";
import Link from "next/link";
import { InstagramIcon } from "@/components/instagram-icon";

const links = [
  { href: "/", label: "Accueil" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/reserver", label: "Réserver" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-30 border-b border-ink/10 bg-cream-100/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6 sm:py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo_clawlab.png"
            alt="Claw lab"
            width={44}
            height={44}
            priority
            className="h-10 w-10 rounded-full shadow-sm sm:h-11 sm:w-11"
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-ink-light sm:gap-6">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="transition hover:text-slate-600">
              {l.label}
            </Link>
          ))}
          <Link
            href="https://www.instagram.com/the_clawlab/"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Claw lab sur Instagram"
            className="transition hover:text-slate-600"
          >
            <InstagramIcon className="h-5 w-5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
