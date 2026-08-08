import { Providers } from "@/components/providers";

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-cream-100 text-ink">
      <Providers>{children}</Providers>
    </div>
  );
}
