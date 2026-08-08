import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { renderToBuffer } from "@react-pdf/renderer";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { InvoicePdfDocument } from "@/lib/invoice-pdf";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const [invoice, settings] = await Promise.all([
    prisma.invoice.findUnique({ where: { id: params.id }, include: { items: true } }),
    prisma.settings.findUnique({ where: { id: "singleton" } }),
  ]);

  if (!invoice) return NextResponse.json({ error: "Facture introuvable" }, { status: 404 });

  const buffer = await renderToBuffer(
    <InvoicePdfDocument
      data={{
        number: invoice.number,
        issueDate: invoice.issueDate,
        status: invoice.status,
        clientName: invoice.clientName,
        clientAddress: invoice.clientAddress,
        totalAmount: Number(invoice.totalAmount),
        items: invoice.items.map((i) => ({
          description: i.description,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          total: Number(i.total),
        })),
        business: {
          name: settings?.businessName ?? "Claw lab",
          address: settings?.address ?? "",
          tvaNumber: settings?.tvaNumber,
          bceNumber: settings?.bceNumber,
        },
      }}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="facture-${invoice.number}.pdf"`,
    },
  });
}
