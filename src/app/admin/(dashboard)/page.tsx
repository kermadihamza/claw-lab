import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatEUR, formatTime, formatDateShort, formatDateLong } from "@/lib/format";
import { MonthlyRevenueChart, CategoryRevenueChart } from "@/components/admin/dashboard-charts";
import type { ServiceCategory } from "@prisma/client";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<ServiceCategory, string> = {
  VERNIS_SEMI_PERMANENT: "Vernis semi-permanent",
  MANUCURE: "Manucure",
  GAINAGE: "Gainage",
  GEL_X: "Gel X",
};

const QUICK_LINKS = [
  { href: "/admin/calendrier", label: "Calendrier", desc: "Vue du mois" },
  { href: "/admin/reservations", label: "Réservations", desc: "Nouveau RDV, jour par jour" },
  { href: "/admin/clients", label: "Clients", desc: "Historique par personne" },
];

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function monthLabel(year: number, month: number) {
  return new Intl.DateTimeFormat("fr-BE", { month: "short" }).format(new Date(year, month, 1));
}

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yearStart = new Date(now.getFullYear(), 0, 1);
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const thirtyDaysAgo = new Date(todayStart.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [todayCount, weekCount, invoicesYear, expensesYear, upcoming, last30Days] = await Promise.all([
    prisma.booking.count({
      where: { startTime: { gte: todayStart, lt: todayEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.booking.count({
      where: { startTime: { gte: todayStart, lt: weekEnd }, status: { not: "CANCELLED" } },
    }),
    prisma.invoice.findMany({
      where: { status: "PAID", issueDate: { gte: sixMonthsAgo } },
      include: { booking: { include: { service: true } } },
    }),
    prisma.expense.aggregate({
      where: { date: { gte: yearStart } },
      _sum: { amount: true },
    }),
    prisma.booking.findMany({
      where: { startTime: { gte: todayStart }, status: "CONFIRMED" },
      include: { service: true },
      orderBy: { startTime: "asc" },
      take: 8,
    }),
    prisma.booking.findMany({
      where: { startTime: { gte: thirtyDaysAgo, lt: todayEnd } },
      select: { status: true },
    }),
  ]);

  const revenueMonth = invoicesYear
    .filter((inv) => inv.issueDate >= new Date(now.getFullYear(), now.getMonth(), 1))
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  const revenueYear = invoicesYear
    .filter((inv) => inv.issueDate >= yearStart)
    .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

  const expensesTotal = Number(expensesYear._sum.amount ?? 0);

  const cancelledLast30 = last30Days.filter((b) => b.status === "CANCELLED").length;
  const cancellationRate = last30Days.length > 0 ? Math.round((cancelledLast30 / last30Days.length) * 100) : 0;

  const monthlyBuckets: { key: string; month: string; revenue: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthlyBuckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, month: monthLabel(d.getFullYear(), d.getMonth()), revenue: 0 });
  }
  for (const inv of invoicesYear) {
    const key = `${inv.issueDate.getFullYear()}-${inv.issueDate.getMonth()}`;
    const bucket = monthlyBuckets.find((b) => b.key === key);
    if (bucket) bucket.revenue += Number(inv.totalAmount);
  }

  const categoryTotals = new Map<string, number>();
  for (const inv of invoicesYear.filter((i) => i.issueDate >= yearStart)) {
    const label = inv.booking?.service ? CATEGORY_LABELS[inv.booking.service.category] : "Facture manuelle";
    categoryTotals.set(label, (categoryTotals.get(label) ?? 0) + Number(inv.totalAmount));
  }
  const categoryData = Array.from(categoryTotals.entries())
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue);

  const kpis = [
    { label: "RDV aujourd'hui", value: String(todayCount), accent: "border-l-blue-400" },
    { label: "RDV cette semaine", value: String(weekCount), accent: "border-l-blue-400" },
    { label: "Revenu du mois", value: formatEUR(revenueMonth), accent: "border-l-green-500" },
    { label: "Revenu / dépenses (année)", value: `${formatEUR(revenueYear)} / ${formatEUR(expensesTotal)}`, accent: "border-l-green-500" },
    { label: "Annulations (30j)", value: `${cancellationRate}%`, accent: cancellationRate > 20 ? "border-l-red-400" : "border-l-ink/20" },
  ];

  return (
    <div>
      <div>
        <h1 className="font-display text-3xl font-bold">Dashboard</h1>
        <p className="mt-1 text-sm capitalize text-ink-light">{formatDateLong(now)}</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="rounded-2xl border border-ink/10 bg-white p-4 transition hover:border-ink/30 hover:shadow-sm"
          >
            <p className="font-display text-base font-semibold">{link.label}</p>
            <p className="mt-0.5 text-xs text-ink-light">{link.desc}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className={`rounded-2xl border border-ink/10 border-l-4 ${kpi.accent} bg-white p-5`}>
            <p className="text-xs font-medium uppercase tracking-wide text-ink-light">{kpi.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink/10 p-5">
          <h2 className="font-display text-lg font-semibold">Revenu mensuel (6 derniers mois)</h2>
          <div className="mt-2">
            <MonthlyRevenueChart data={monthlyBuckets.map(({ month, revenue }) => ({ month, revenue }))} />
          </div>
        </div>
        <div className="rounded-2xl border border-ink/10 p-5">
          <h2 className="font-display text-lg font-semibold">Revenu par prestation ({now.getFullYear()})</h2>
          <div className="mt-2">
            {categoryData.length > 0 ? (
              <CategoryRevenueChart data={categoryData} />
            ) : (
              <p className="py-16 text-center text-sm text-ink-light">Pas encore de données.</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-ink/10 p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Prochains rendez-vous</h2>
          <Link href="/admin/reservations" className="text-sm font-medium text-ink underline">
            Voir tout
          </Link>
        </div>
        <ul className="mt-3 divide-y divide-ink/10">
          {upcoming.length === 0 && <li className="py-4 text-sm text-ink-light">Aucun rendez-vous à venir.</li>}
          {upcoming.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3 text-sm">
              <span>
                {formatDateShort(b.startTime)} à {formatTime(b.startTime)}
              </span>
              <span className="font-medium">{b.clientName}</span>
              <span className="text-ink-light">{b.service.name}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
