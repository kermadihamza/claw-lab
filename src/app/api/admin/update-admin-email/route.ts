import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Route temporaire à usage unique : change l'email de connexion du compte admin
 * (le mot de passe reste inchangé). À supprimer après utilisation.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.RESET_SECRET}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const newEmail = body?.newEmail as string | undefined;
  if (!newEmail || !newEmail.includes("@")) {
    return NextResponse.json({ error: "newEmail invalide" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findFirst();
  if (!admin) {
    return NextResponse.json({ error: "Aucun compte admin trouvé" }, { status: 404 });
  }

  const updated = await prisma.adminUser.update({
    where: { id: admin.id },
    data: { email: newEmail },
  });

  return NextResponse.json({ ok: true, previousEmail: admin.email, newEmail: updated.email });
}
