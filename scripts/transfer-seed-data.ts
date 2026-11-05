import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const FROM_EMAIL = "motorista@giro.app";
const TO_EMAIL = "carlos@giro.app";

async function isEmptyBudget(id: string): Promise<boolean> {
  const [e, d, w, g] = await Promise.all([
    prisma.expense.count({ where: { budgetMonthId: id } }),
    prisma.dailyWorkLog.count({ where: { budgetMonthId: id } }),
    prisma.weeklyEarning.count({ where: { budgetMonthId: id } }),
    prisma.budgetGoal.count({ where: { budgetMonthId: id } }),
  ]);
  return e + d + w + g === 0;
}

async function main() {
  const from = await prisma.user.findUnique({ where: { email: FROM_EMAIL } });
  const to = await prisma.user.findUnique({ where: { email: TO_EMAIL } });
  if (!from || !to) throw new Error("Usuário de origem ou destino não encontrado.");

  const fromMonths = await prisma.budgetMonth.findMany({ where: { userId: from.id } });
  const toMonths = await prisma.budgetMonth.findMany({ where: { userId: to.id } });

  await prisma.$transaction(async (tx) => {
    for (const tm of toMonths) {
      const conflict = fromMonths.find((fm) => fm.year === tm.year && fm.month === tm.month);
      if (!conflict) continue;
      if (!(await isEmptyBudget(tm.id))) {
        throw new Error(`Conflito com mês ${tm.month}/${tm.year} de ${TO_EMAIL} que contém dados. Abortado.`);
      }
      await tx.budgetMonth.delete({ where: { id: tm.id } });
      console.log(`Removido mês vazio conflitante ${tm.month}/${tm.year} de ${TO_EMAIL}`);
    }

    const months = await tx.budgetMonth.updateMany({ where: { userId: from.id }, data: { userId: to.id } });
    const vehicles = await tx.vehicle.updateMany({ where: { userId: from.id }, data: { userId: to.id } });
    console.log(`Transferidos: ${months.count} meses e ${vehicles.count} veículo(s) para ${TO_EMAIL}`);
  });
}

main()
  .catch((e) => {
    console.error(e.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
