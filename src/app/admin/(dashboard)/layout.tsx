import { AdminNav } from "@/components/admin-nav";
import { SettingsAlert } from "@/components/settings-alert";

export default function DashboardShellLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminNav />
      <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <SettingsAlert />
        {children}
      </main>
    </div>
  );
}
