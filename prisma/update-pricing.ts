import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function setPrice(category: string, name: string, priceMin: number, priceMax: number | null, durationMinutes?: number) {
  const existing = await prisma.service.findFirst({ where: { category: category as never, name } });
  if (!existing) {
    console.log(`Introuvable, ignoré : ${category} / ${name}`);
    return;
  }
  await prisma.service.update({
    where: { id: existing.id },
    data: {
      priceMin,
      priceMax,
      ...(durationMinutes ? { durationMinutes } : {}),
    },
  });
  console.log(`Mis à jour : ${category} / ${name} -> ${priceMin}${priceMax ? "-" + priceMax : ""}€`);
}

async function main() {
  await setPrice("VERNIS_SEMI_PERMANENT", "Uni", 45, null);
  await setPrice("VERNIS_SEMI_PERMANENT", "Nail art", 55, 65);
  await setPrice("GAINAGE", "Uni", 55, null);
  await setPrice("GAINAGE", "Nail art", 60, 70);

  const oldDeposeExt = await prisma.service.findFirst({
    where: { category: "VERNIS_SEMI_PERMANENT", name: "Dépose extérieure" },
  });
  if (oldDeposeExt) {
    await prisma.service.update({ where: { id: oldDeposeExt.id }, data: { active: false } });
    console.log("Désactivé : Dépose extérieure (15€, ancienne)");
  }

  const newDeposeExt = await prisma.service.findFirst({
    where: { category: "VERNIS_SEMI_PERMANENT", name: "Dépose extérieure seule" },
  });
  if (!newDeposeExt) {
    const depose = await prisma.service.findFirst({
      where: { category: "VERNIS_SEMI_PERMANENT", name: "Dépose" },
    });
    await prisma.service.create({
      data: {
        category: "VERNIS_SEMI_PERMANENT",
        name: "Dépose extérieure seule",
        priceMin: 20,
        durationMinutes: 45,
        sortOrder: (depose?.sortOrder ?? 3) + 1,
        isRemovalService: true,
      },
    });
    console.log("Créé : Dépose extérieure seule (20€)");
  } else {
    await prisma.service.update({ where: { id: newDeposeExt.id }, data: { priceMin: 20, active: true } });
    console.log("Mis à jour : Dépose extérieure seule -> 20€");
  }

  console.log("Terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
