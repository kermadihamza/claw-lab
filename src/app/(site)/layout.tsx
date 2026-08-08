import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";

// Le footer affiche les horaires/adresse en base : rendu à chaque requête,
// jamais figé au build, pour rester à jour avec les changements admin.
export const dynamic = "force-dynamic";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-cream-100 text-ink">
      <SiteNav />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
