import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    include: { _count: { select: { budgetMonths: true, vehicles: true } } },
  });
  for (const u of users) {
    console.log(`${u.email} | id=${u.id} | meses=${u._count.budgetMonths} | veiculos=${u._count.vehicles}`);
  }
}
main().finally(() => prisma.$disconnect());
