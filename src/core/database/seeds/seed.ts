import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Populando banco de dados com dados iniciais e histórico da planilha...");

  // 1. Usuário dono dos dados da planilha (login: carlos@giro.app / senha123456)
  const user = await prisma.user.upsert({
    where: { email: "carlos@giro.app" },
    update: {},
    create: {
      name: "Carlos Motorista",
      email: "carlos@giro.app",
      passwordHash: await bcrypt.hash("senha123456", 10),
    },
  });

  // 2. Criar veículo padrão
  const vehicle = await prisma.vehicle.upsert({
    where: { plate: "APP-2026" },
    update: {},
    create: {
      userId: user.id,
      plate: "APP-2026",
      brand: "Carro",
      model: "Trabalho APP",
      year: 2024,
      monthlyInstallment: 851.15,
      insuranceValue: 218.0,
    },
  });

  // 3. Cadastrar taxas do veículo (IPVA, Licenciamento, Bombeiros)
  const taxesData = [
    { taxType: "BOMBEIROS", fiscalYear: 2024, installmentNumber: 1, totalInstallments: 1, dueDate: new Date(2025, 1, 10), amount: 65.53, isPaid: true },
    { taxType: "LICENSING", fiscalYear: 2024, installmentNumber: 1, totalInstallments: 1, dueDate: new Date(2025, 1, 10), amount: 145.17, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 1, totalInstallments: 10, dueDate: new Date(2025, 1, 10), amount: 131.23, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 2, totalInstallments: 10, dueDate: new Date(2025, 2, 10), amount: 131.23, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 3, totalInstallments: 10, dueDate: new Date(2025, 3, 10), amount: 131.23, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 4, totalInstallments: 10, dueDate: new Date(2025, 4, 11), amount: 131.23, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 5, totalInstallments: 10, dueDate: new Date(2025, 5, 10), amount: 131.23, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 6, totalInstallments: 10, dueDate: new Date(2025, 6, 10), amount: 131.23, isPaid: true },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 7, totalInstallments: 10, dueDate: new Date(2025, 7, 10), amount: 131.23, isPaid: false },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 8, totalInstallments: 10, dueDate: new Date(2025, 8, 10), amount: 131.23, isPaid: false },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 9, totalInstallments: 10, dueDate: new Date(2025, 9, 13), amount: 131.23, isPaid: false },
    { taxType: "IPVA", fiscalYear: 2024, installmentNumber: 10, totalInstallments: 10, dueDate: new Date(2025, 10, 10), amount: 131.23, isPaid: false },
  ];

  for (const tax of taxesData) {
    await prisma.vehicleTax.create({
      data: {
        vehicleId: vehicle.id,
        ...tax,
      },
    });
  }

  // 4. Cadastrar meses históricos de 2026 com base na planilha
  const monthsData = [
    {
      month: 1,
      totalRevenue: 7118.75,
      totalFuelCost: 2939.40,
      totalExpenses: 4748.91,
      netBalance: 4179.35,
      weeks: [
        { weekNumber: 1, grossAmount: 1103.30, fuelCost: 430.00, netAmount: 673.30, totalKm: 520 },
        { weekNumber: 2, grossAmount: 1382.14, fuelCost: 713.58, netAmount: 668.56, totalKm: 650 },
        { weekNumber: 3, grossAmount: 1373.95, fuelCost: 491.80, netAmount: 882.15, totalKm: 630 },
        { weekNumber: 4, grossAmount: 1631.14, fuelCost: 592.74, netAmount: 1038.40, totalKm: 780 },
        { weekNumber: 5, grossAmount: 1628.22, fuelCost: 711.28, netAmount: 916.94, totalKm: 760 },
      ],
      expenses: [
        { category: "VEHICLE", description: "Letra do Carro", plannedAmount: 826.0, actualAmount: 826.0, isPaid: true, dueDay: 3 },
        { category: "VEHICLE", description: "Seguro Veicular", plannedAmount: 218.0, actualAmount: 218.0, isPaid: true, dueDay: 25 },
        { category: "HOUSING", description: "Aluguel", plannedAmount: 670.0, actualAmount: 670.0, isPaid: true, dueDay: 30 },
        { category: "HOUSING", description: "Celpe (Energia)", plannedAmount: 162.4, actualAmount: 162.4, isPaid: true, dueDay: 23 },
        { category: "HOUSING", description: "Internet's", plannedAmount: 212.0, actualAmount: 212.0, isPaid: true, dueDay: 20 },
        { category: "FOOD", description: "Mercado", plannedAmount: 500.0, actualAmount: 500.0, isPaid: true },
        { category: "EDUCATION", description: "Escola", plannedAmount: 250.0, actualAmount: 250.0, isPaid: true, dueDay: 28 },
        { category: "HEALTH", description: "Academia", plannedAmount: 90.0, actualAmount: 90.0, isPaid: true, dueDay: 5 },
        { category: "FINANCIAL", description: "Cartão de Crédito", plannedAmount: 67.25, actualAmount: 67.25, isPaid: true, dueDay: 23 },
        { category: "SUBSCRIPTION", description: "Apple", plannedAmount: 27.8, actualAmount: 27.8, isPaid: true },
        { category: "FINANCIAL", description: "COF Nubank", plannedAmount: 157.4, actualAmount: 157.4, isPaid: true, installment: "05/12" },
        { category: "SUBSCRIPTION", description: "Google One", plannedAmount: 9.99, actualAmount: 9.99, isPaid: true },
        { category: "SUBSCRIPTION", description: "YouTube Music", plannedAmount: 21.9, actualAmount: 21.9, isPaid: true },
        { category: "FINANCIAL", description: "Cintia Cartão dia 15", plannedAmount: 531.0, actualAmount: 531.0, isPaid: true, dueDay: 15 },
        { category: "FINANCIAL", description: "Empréstimo 10x", plannedAmount: 376.0, actualAmount: 376.0, isPaid: true, installment: "02/10" },
      ],
    },
    {
      month: 2,
      totalRevenue: 7531.60,
      totalFuelCost: 2699.83,
      totalExpenses: 7202.50,
      netBalance: -393.26,
      weeks: [
        { weekNumber: 1, grossAmount: 2078.04, fuelCost: 805.87, netAmount: 1272.17, totalKm: 980 },
        { weekNumber: 2, grossAmount: 1547.76, fuelCost: 572.77, netAmount: 974.99, totalKm: 720 },
        { weekNumber: 3, grossAmount: 1443.87, fuelCost: 527.83, netAmount: 916.04, totalKm: 680 },
        { weekNumber: 4, grossAmount: 2461.93, fuelCost: 793.36, netAmount: 1668.57, totalKm: 1100 },
      ],
      expenses: [
        { category: "VEHICLE", description: "Letra do Carro", plannedAmount: 826.0, actualAmount: 826.0, isPaid: true, dueDay: 3 },
        { category: "VEHICLE", description: "Seguro Veicular", plannedAmount: 218.0, actualAmount: 218.0, isPaid: true, dueDay: 25 },
        { category: "HOUSING", description: "Aluguel", plannedAmount: 670.0, actualAmount: 670.0, isPaid: false, dueDay: 30 },
        { category: "HOUSING", description: "Celpe (Energia)", plannedAmount: 129.72, actualAmount: 129.72, isPaid: true, dueDay: 23 },
        { category: "HOUSING", description: "Internet's", plannedAmount: 212.0, actualAmount: 212.0, isPaid: true, dueDay: 20 },
        { category: "FOOD", description: "Mercado", plannedAmount: 900.0, actualAmount: 900.0, isPaid: true },
        { category: "EDUCATION", description: "Escola", plannedAmount: 217.5, actualAmount: 217.5, isPaid: true, dueDay: 28 },
        { category: "HEALTH", description: "Academia", plannedAmount: 90.0, actualAmount: 90.0, isPaid: true, dueDay: 5 },
        { category: "EDUCATION", description: "Faculdade", plannedAmount: 293.0, actualAmount: 293.0, isPaid: true, dueDay: 7 },
        { category: "FINANCIAL", description: "Sangria / Imprevistos", plannedAmount: 2195.0, actualAmount: 2195.0, isPaid: true },
      ],
    },
    {
      month: 3,
      totalRevenue: 6802.80,
      totalFuelCost: 3135.40,
      totalExpenses: 4215.17,
      netBalance: -335.77,
      weeks: [
        { weekNumber: 1, grossAmount: 1567.46, fuelCost: 552.35, netAmount: 1015.11, totalKm: 740 },
        { weekNumber: 2, grossAmount: 1382.58, fuelCost: 577.82, netAmount: 804.76, totalKm: 650 },
        { weekNumber: 3, grossAmount: 2104.46, fuelCost: 903.56, netAmount: 1200.90, totalKm: 990 },
        { weekNumber: 4, grossAmount: 1748.30, fuelCost: 895.75, netAmount: 852.55, totalKm: 830 },
        { weekNumber: 5, grossAmount: 0.0, fuelCost: 205.92, netAmount: -205.92, totalKm: 190 },
      ],
      expenses: [
        { category: "VEHICLE", description: "Letra do Carro", plannedAmount: 876.0, actualAmount: 876.0, isPaid: true, dueDay: 3 },
        { category: "HOUSING", description: "Aluguel", plannedAmount: 670.0, actualAmount: 670.0, isPaid: true, dueDay: 30 },
        { category: "HOUSING", description: "Celpe (Energia)", plannedAmount: 139.08, actualAmount: 139.08, isPaid: true, dueDay: 23 },
        { category: "FOOD", description: "Mercado", plannedAmount: 500.0, actualAmount: 500.0, isPaid: true },
        { category: "EDUCATION", description: "Escola", plannedAmount: 435.0, actualAmount: 435.0, isPaid: true, dueDay: 28 },
        { category: "FINANCIAL", description: "COF Nubank", plannedAmount: 157.4, actualAmount: 157.4, isPaid: true, installment: "06/12" },
      ],
    },
    {
      month: 6,
      totalRevenue: 6098.88,
      totalFuelCost: 2207.53,
      totalExpenses: 3788.37,
      netBalance: 155.38,
      weeks: [
        { weekNumber: 1, grossAmount: 1465.34, fuelCost: 1241.72, netAmount: 223.62, totalKm: 700 },
        { weekNumber: 2, grossAmount: 771.99, fuelCost: 240.45, netAmount: 531.54, totalKm: 360 },
        { weekNumber: 3, grossAmount: 1579.20, fuelCost: 725.36, netAmount: 853.84, totalKm: 750 },
        { weekNumber: 4, grossAmount: 2282.35, fuelCost: 0.0, netAmount: 2282.35, totalKm: 1050 },
      ],
      expenses: [
        { category: "VEHICLE", description: "Letra do Carro", plannedAmount: 851.15, actualAmount: 851.15, isPaid: true, dueDay: 3 },
        { category: "HOUSING", description: "Aluguel", plannedAmount: 670.0, actualAmount: 670.0, isPaid: false, dueDay: 30 },
        { category: "HOUSING", description: "Celpe (Energia)", plannedAmount: 142.53, actualAmount: 142.53, isPaid: true, dueDay: 23 },
        { category: "FOOD", description: "Mercado", plannedAmount: 1500.0, actualAmount: 1500.0, isPaid: false },
        { category: "FINANCIAL", description: "COF Nubank", plannedAmount: 157.4, actualAmount: 157.4, isPaid: false, installment: "06/12" },
      ],
    },
    {
      month: 7,
      totalRevenue: 3770.54,
      totalFuelCost: 1063.95,
      totalExpenses: 4530.62,
      netBalance: 2706.59,
      weeks: [
        { weekNumber: 1, grossAmount: 1658.47, fuelCost: 389.34, netAmount: 1269.13, totalKm: 780 },
        { weekNumber: 2, grossAmount: 2112.07, fuelCost: 674.61, netAmount: 1437.46, totalKm: 990 },
      ],
      expenses: [
        { category: "VEHICLE", description: "Letra do Carro", plannedAmount: 851.15, actualAmount: 851.15, isPaid: false, dueDay: 3 },
        { category: "VEHICLE", description: "Rastreamento Veicular", plannedAmount: 39.99, actualAmount: 39.99, isPaid: true, dueDay: 25 },
        { category: "HOUSING", description: "Aluguel", plannedAmount: 670.0, actualAmount: 670.0, isPaid: false, dueDay: 30 },
        { category: "FOOD", description: "Mercado", plannedAmount: 1500.0, actualAmount: 1500.0, isPaid: false },
        { category: "VEHICLE", description: "Manutenção Carro", plannedAmount: 330.0, actualAmount: 330.0, isPaid: true },
        { category: "EDUCATION", description: "Faculdade", plannedAmount: 315.07, actualAmount: 315.07, isPaid: true, dueDay: 7 },
      ],
    },
  ];

  for (const m of monthsData) {
    const budgetMonth = await prisma.budgetMonth.upsert({
      where: {
        userId_year_month: {
          userId: user.id,
          year: 2026,
          month: m.month,
        },
      },
      update: {},
      create: {
        userId: user.id,
        year: 2026,
        month: m.month,
        totalRevenue: m.totalRevenue,
        totalFuelCost: m.totalFuelCost,
        totalExpenses: m.totalExpenses,
        netBalance: m.netBalance,
      },
    });

    // Semanas
    for (const w of m.weeks) {
      await prisma.weeklyEarning.upsert({
        where: {
          budgetMonthId_weekNumber: {
            budgetMonthId: budgetMonth.id,
            weekNumber: w.weekNumber,
          },
        },
        update: {},
        create: {
          budgetMonthId: budgetMonth.id,
          weekNumber: w.weekNumber,
          grossAmount: w.grossAmount,
          fuelCost: w.fuelCost,
          netAmount: w.netAmount,
          totalKm: w.totalKm,
        },
      });
    }

    // Despesas
    for (const exp of m.expenses) {
      await prisma.expense.create({
        data: {
          budgetMonthId: budgetMonth.id,
          category: exp.category,
          description: exp.description,
          plannedAmount: exp.plannedAmount,
          actualAmount: exp.actualAmount,
          isPaid: exp.isPaid,
          installment: exp.installment || null,
          dueDay: exp.dueDay || null,
        },
      });
    }
  }

  // 5. Cadastrar alguns registros de trabalho diário com abastecimentos reais de exemplo em Julho
  const julBudget = await prisma.budgetMonth.findFirst({
    where: { userId: user.id, year: 2026, month: 7 },
  });

  if (julBudget) {
    const log1 = await prisma.dailyWorkLog.create({
      data: {
        budgetMonthId: julBudget.id,
        workDate: new Date(2026, 6, 1),
        kmStart: 54120,
        kmEnd: 54340,
        totalKm: 220,
        grossEarning: 410.50,
        notes: "Dia chuvoso, bom movimento",
      },
    });

    await prisma.fuelEntry.create({
      data: {
        dailyWorkLogId: log1.id,
        fuelType: "GASOLINE",
        liters: 25.0,
        pricePerLiter: 5.89,
        totalCost: 147.25,
      },
    });

    const log2 = await prisma.dailyWorkLog.create({
      data: {
        budgetMonthId: julBudget.id,
        workDate: new Date(2026, 6, 2),
        kmStart: 54340,
        kmEnd: 54510,
        totalKm: 170,
        grossEarning: 345.00,
        notes: "Abastecido etanol",
      },
    });

    await prisma.fuelEntry.create({
      data: {
        dailyWorkLogId: log2.id,
        fuelType: "ETHANOL",
        liters: 28.5,
        pricePerLiter: 3.99,
        totalCost: 113.71,
      },
    });
  }

  console.log("✅ Seed concluído com sucesso! Banco preenchido com histórico real!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
