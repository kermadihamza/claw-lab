import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.service.updateMany({
    where: { name: { in: ["Dépose", "Dépose extérieure"] } },
    data: { isRemovalService: true },
  });
  console.log(`Services mis à jour : ${result.count}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
