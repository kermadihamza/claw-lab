import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const invoice = await prisma.expenseInvoice.findUnique({ where: { id: params.id } });
  if (!invoice) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return new NextResponse(new Uint8Array(invoice.data), {
    headers: {
      "Content-Type": invoice.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(invoice.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
