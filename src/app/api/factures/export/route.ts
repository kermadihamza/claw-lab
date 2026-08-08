import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function csvEscape(value: string) {
  if (/[",\n;]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const year = req.nextUrl.searchParams.get("year");
  const invoices = await prisma.invoice.findMany({
    where: year ? { year: Number(year) } : undefined,
    orderBy: [{ year: "asc" }, { sequence: "asc" }],
  });

  const header = ["Numéro", "Date", "Client", "Montant", "Statut"].join(";");
  const rows = invoices.map((inv) =>
    [
      inv.number,
      new Intl.DateTimeFormat("fr-BE").format(inv.issueDate),
      csvEscape(inv.clientName),
      Number(inv.totalAmount).toFixed(2).replace(".", ","),
      inv.status === "PAID" ? "Payée" : "Annulée",
    ].join(";")
  );

  const csv = [header, ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="factures${year ? `-${year}` : ""}.csv"`,
    },
  });
}
