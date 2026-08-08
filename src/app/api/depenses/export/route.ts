import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const CATEGORY_LABELS: Record<string, string> = {
  LOYER: "Loyer",
  COTISATION: "Cotisation",
  MATERIEL: "Matériel",
  AUTRE: "Autre",
};

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const year = req.nextUrl.searchParams.get("year");
  const expenses = await prisma.expense.findMany({
    where: year
      ? { date: { gte: new Date(`${year}-01-01`), lt: new Date(`${Number(year) + 1}-01-01`) } }
      : undefined,
    orderBy: { date: "asc" },
  });

  const header = ["Date", "Catégorie", "Description", "Montant"].join(";");
  const rows = expenses.map((e) =>
    [
      new Intl.DateTimeFormat("fr-BE").format(e.date),
      CATEGORY_LABELS[e.category] ?? e.category,
      e.description.replace(/;/g, ","),
      Number(e.amount).toFixed(2).replace(".", ","),
    ].join(";")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="depenses${year ? `-${year}` : ""}.csv"`,
    },
  });
}
