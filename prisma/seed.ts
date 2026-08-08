import { PrismaClient, ServiceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const services: {
  category: ServiceCategory;
  name: string;
  priceMin: number;
  priceMax?: number;
  durationMinutes: number;
  sortOrder: number;
}[] = [
  // Vernis semi-permanent / dépose
  { category: "VERNIS_SEMI_PERMANENT", name: "Uni", priceMin: 40, durationMinutes: 60, sortOrder: 1 },
  { category: "VERNIS_SEMI_PERMANENT", name: "Nail art", priceMin: 45, priceMax: 60, durationMinutes: 90, sortOrder: 2 },
  { category: "VERNIS_SEMI_PERMANENT", name: "Dépose", priceMin: 10, durationMinutes: 45, sortOrder: 3 },
  { category: "VERNIS_SEMI_PERMANENT", name: "Dépose extérieure", priceMin: 15, durationMinutes: 45, sortOrder: 4 },
  // Manucure
  { category: "MANUCURE", name: "Japonaise", priceMin: 40, durationMinutes: 45, sortOrder: 1 },
  // Gainage sur ongle naturel
  { category: "GAINAGE", name: "Uni", priceMin: 45, durationMinutes: 90, sortOrder: 1 },
  { category: "GAINAGE", name: "Nail art", priceMin: 50, priceMax: 65, durationMinutes: 120, sortOrder: 2 },
  // Pose gel X
  { category: "GEL_X", name: "Uni", priceMin: 50, durationMinutes: 90, sortOrder: 1 },
  { category: "GEL_X", name: "French", priceMin: 55, durationMinutes: 90, sortOrder: 2 },
  { category: "GEL_X", name: "Nail art niveau 1", priceMin: 60, durationMinutes: 90, sortOrder: 3 },
  { category: "GEL_X", name: "Nail art niveau 2", priceMin: 65, durationMinutes: 120, sortOrder: 4 },
  { category: "GEL_X", name: "Nail art niveau 3", priceMin: 70, durationMinutes: 150, sortOrder: 5 },
  { category: "GEL_X", name: "Nail art niveau 4", priceMin: 75, priceMax: 90, durationMinutes: 180, sortOrder: 6 },
];

// dayOfWeek: 0 = dimanche ... 6 = samedi. Ouvert lundi (1) à vendredi (5), 9h-18h.
const businessHours = [0, 1, 2, 3, 4, 5, 6].map((dayOfWeek) => {
  const isOpen = dayOfWeek >= 1 && dayOfWeek <= 5;
  return {
    dayOfWeek,
    isOpen,
    openTime: isOpen ? "09:00" : null,
    closeTime: isOpen ? "18:00" : null,
  };
});

async function main() {
  await prisma.settings.upsert({
    where: { id: "singleton" },
    update: {},
    create: {
      id: "singleton",
      businessName: "Claw lab",
      address: "16, rue des Capucins, 6700 Arlon",
      tvaNumber: null,
      bceNumber: null,
      cotisationAmount: null,
      bufferMinutes: 10,
      loyerMensuel: 350,
    },
  });

  for (const hours of businessHours) {
    await prisma.businessHours.upsert({
      where: { dayOfWeek: hours.dayOfWeek },
      update: hours,
      create: hours,
    });
  }

  for (const service of services) {
    const existing = await prisma.service.findFirst({
      where: { category: service.category, name: service.name },
    });
    if (existing) {
      await prisma.service.update({ where: { id: existing.id }, data: service });
    } else {
      await prisma.service.create({ data: service });
    }
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "change-me";
  const adminName = process.env.ADMIN_NAME ?? "Admin";
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  await prisma.adminUser.upsert({
    where: { email: adminEmail },
    update: { passwordHash, name: adminName },
    create: { email: adminEmail, passwordHash, name: adminName },
  });

  console.log("Seed terminé.");
  console.log(`Admin: ${adminEmail} — pensez à changer ce mot de passe avant la mise en prod.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
