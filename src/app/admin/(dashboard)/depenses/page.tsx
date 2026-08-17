import { prisma } from "@/lib/prisma";
import { formatEUR } from "@/lib/format";
import { ExpenseRow } from "@/components/admin/expense-row";
import { NewExpenseForm } from "@/components/admin/new-expense-form";
import { GenerateRecurringButton } from "@/components/admin/generate-recurring-button";

export const dynamic = "force-dynamic";

export default async function DepensesPage() {
  const currentYear = new Date().getFullYear();
  const [expenses, settings] = await Promise.all([
    prisma.expense.findMany({
      where: { date: { gte: new Date(`${currentYear}-01-01`) } },
      orderBy: { date: "desc" },
    }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Dépenses</h1>
        <a
          href={`/api/depenses/export?year=${currentYear}`}
          className="rounded-full border border-ink/20 px-4 py-2 text-sm font-medium hover:bg-ink/5"
        >
          Exporter {currentYear} (CSV)
        </a>
      </div>
      <p className="mt-2 text-sm text-ink-light">
        Total {currentYear} : <span className="font-semibold text-ink">{formatEUR(total)}</span>
      </p>

      <div className="mt-4">
        <GenerateRecurringButton />
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="min-w-0 overflow-x-auto rounded-2xl border border-ink/10 lg:col-span-2">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-ink/5 text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Catégorie</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Montant</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-light">
                    Aucune dépense enregistrée pour {currentYear}.
                  </td>
                </tr>
              )}
              {expenses.map((e) => (
                <ExpenseRow
                  key={e.id}
                  expense={{
                    id: e.id,
                    date: e.date,
                    category: e.category,
                    description: e.description,
                    amount: Number(e.amount),
                    recurring: e.recurring,
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>

        <NewExpenseForm defaultAmount={settings ? Number(settings.loyerMensuel) : undefined} />
      </div>
    </div>
  );
}
