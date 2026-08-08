import { AdminNav } from "@/components/admin-nav";
import { SettingsAlert } from "@/components/settings-alert";

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <AdminNav />
      <main className="flex-1 px-8 py-8">
        <SettingsAlert />
        {children}
      </main>
    </div>
  );
}
