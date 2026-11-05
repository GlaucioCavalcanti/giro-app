import Fastify, { FastifyRequest, FastifyReply } from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import jwt from "@fastify/jwt";
import { prisma } from "../core/database/client";
import { z } from "zod";
import { authRoutes } from "../modules/auth/components/auth.routes";

// Tipagem do payload do JWT
declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { id: string; email: string; name: string };
    user: { id: string; email: string; name: string };
  }
}

const server = Fastify({ logger: false });

server.register(cors, {
  origin: "*",
  methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
});

server.register(rateLimit, { max: 300, timeWindow: "1 minute" });

server.register(jwt, {
  secret: process.env.JWT_SECRET || "giro-super-secret-jwt-key-2026-production-ready",
});

server.register(authRoutes, { prefix: "/api/auth" });

// =====================================================================
// GUARDA GLOBAL: toda rota /api/* (exceto /api/auth/*) exige JWT válido
// e um usuário existente. Não há mais fallback para "primeiro usuário".
// =====================================================================
server.addHook("preHandler", async (request: FastifyRequest, reply: FastifyReply) => {
  const url = request.url;
  if (!url.startsWith("/api/") || url.startsWith("/api/auth/")) return;

  try {
    await request.jwtVerify();
  } catch {
    return reply.status(401).send({ error: "Acesso não autorizado. Faça login para continuar." });
  }

  const exists = await prisma.user.findUnique({ where: { id: request.user.id }, select: { id: true } });
  if (!exists) {
    return reply.status(401).send({ error: "Sessão inválida. Faça login novamente." });
  }
});

// ID do usuário autenticado (garantido pelo preHandler)
function getUserId(request: FastifyRequest): string {
  return request.user.id;
}

// Erro de recurso inexistente ou pertencente a outro usuário
function notFound(reply: FastifyReply) {
  return reply.status(404).send({ error: "Registro não encontrado." });
}

// Busca ou cria o orçamento do mês SEMPRE vinculado ao usuário logado
async function getOrCreateBudget(userId: string, year: number, month: number) {
  const found = await prisma.budgetMonth.findUnique({
    where: { userId_year_month: { userId, year, month } },
  });
  if (found) return found;
  return prisma.budgetMonth.create({ data: { userId, year, month } });
}

// Recalcula totais do mês (receita, combustível, despesas e saldo)
async function recalcBudget(budgetMonthId: string) {
  const [logs, expenses] = await Promise.all([
    prisma.dailyWorkLog.findMany({ where: { budgetMonthId }, include: { fuelEntries: true } }),
    prisma.expense.findMany({ where: { budgetMonthId } }),
  ]);
  const budget = await prisma.budgetMonth.findUnique({ where: { id: budgetMonthId } });
  if (!budget) return;

  // Meses importados da planilha não têm registros diários: preserva receita/combustível existentes
  const totalRevenue = logs.length ? logs.reduce((a, l) => a + l.grossEarning, 0) : budget.totalRevenue;
  const totalFuelCost = logs.length
    ? logs.reduce((a, l) => a + l.fuelEntries.reduce((f, e) => f + e.totalCost, 0), 0)
    : budget.totalFuelCost;
  const totalExpenses = expenses.reduce((a, e) => a + e.actualAmount, 0);

  await prisma.budgetMonth.update({
    where: { id: budgetMonthId },
    data: {
      totalRevenue,
      totalFuelCost,
      totalExpenses,
      netBalance: totalRevenue - totalFuelCost - totalExpenses,
    },
  });
}

// Veículo do usuário; contas novas recebem um veículo ZERADO com placa provisória única
async function getOrCreateVehicle(userId: string) {
  const found = await prisma.vehicle.findFirst({ where: { userId } });
  if (found) return found;
  return prisma.vehicle.create({
    data: {
      userId,
      plate: `SEM-PLACA-${userId.slice(0, 8).toUpperCase()}`,
      brand: "",
      model: "Meu Veículo",
      year: new Date().getFullYear(),
      monthlyInstallment: 0,
      insuranceValue: 0,
    },
  });
}

// 1. Anos disponíveis do usuário
server.get("/api/years", async (request) => {
  const userId = getUserId(request);
  const records = await prisma.budgetMonth.findMany({
    where: { userId },
    select: { year: true },
    distinct: ["year"],
  });
  const years = new Set(records.map((r) => r.year));
  years.add(new Date().getFullYear());
  return { years: Array.from(years).sort((a, b) => b - a) };
});

// 2. Resumo anual (12 meses)
server.get("/api/dashboard/annual-summary", async (request) => {
  const { year } = z.object({ year: z.coerce.number().default(new Date().getFullYear()) }).parse(request.query);
  const userId = getUserId(request);

  const months = await prisma.budgetMonth.findMany({ where: { userId, year }, orderBy: { month: "asc" } });
  const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

  const monthlyData = names.map((monthName, i) => {
    const f = months.find((m) => m.month === i + 1);
    return {
      month: i + 1,
      monthName,
      revenue: f?.totalRevenue ?? 0,
      fuelCost: f?.totalFuelCost ?? 0,
      expenses: f?.totalExpenses ?? 0,
      netBalance: f?.netBalance ?? 0,
    };
  });

  const sum = (k: "revenue" | "fuelCost" | "expenses" | "netBalance") =>
    monthlyData.reduce((a, m) => a + m[k], 0);

  return {
    year,
    monthlyData,
    totals: { revenue: sum("revenue"), fuelCost: sum("fuelCost"), expenses: sum("expenses"), netBalance: sum("netBalance") },
  };
});

// 3. Detalhe mensal
server.get("/api/dashboard/monthly-detail", async (request) => {
  const { year, month } = z
    .object({
      year: z.coerce.number().default(new Date().getFullYear()),
      month: z.coerce.number().min(1).max(12).default(new Date().getMonth() + 1),
    })
    .parse(request.query);
  const userId = getUserId(request);

  const base = await getOrCreateBudget(userId, year, month);
  const budget = await prisma.budgetMonth.findUnique({
    where: { id: base.id },
    include: {
      weeklyEarnings: { orderBy: { weekNumber: "asc" } },
      expenses: { orderBy: { createdAt: "asc" } },
      dailyWorkLogs: { include: { fuelEntries: true }, orderBy: { workDate: "desc" } },
    },
  });
  return { budget };
});

// 4. Registro diário (KM + ganho + abastecimentos)
server.post("/api/fuel-log/daily", async (request, reply) => {
  const data = z
    .object({
      year: z.number(),
      month: z.number().min(1).max(12),
      workDate: z.string(),
      kmStart: z.number().min(0),
      kmEnd: z.number().min(0),
      grossEarning: z.number().min(0),
      notes: z.string().optional(),
      fuelEntries: z.array(
        z.object({
          fuelType: z.enum(["GASOLINE", "ETHANOL"]),
          liters: z.number().positive(),
          pricePerLiter: z.number().positive(),
        })
      ),
    })
    .parse(request.body);

  const budget = await getOrCreateBudget(getUserId(request), data.year, data.month);

  const dailyLog = await prisma.dailyWorkLog.create({
    data: {
      budgetMonthId: budget.id,
      workDate: new Date(data.workDate),
      kmStart: data.kmStart,
      kmEnd: data.kmEnd,
      totalKm: Math.max(0, data.kmEnd - data.kmStart),
      grossEarning: data.grossEarning,
      notes: data.notes || null,
      fuelEntries: {
        create: data.fuelEntries.map((fe) => ({
          fuelType: fe.fuelType,
          liters: fe.liters,
          pricePerLiter: fe.pricePerLiter,
          totalCost: fe.liters * fe.pricePerLiter,
        })),
      },
    },
    include: { fuelEntries: true },
  });

  await recalcBudget(budget.id);
  return reply.status(201).send({ dailyLog });
});

// 5. Criar despesa
server.post("/api/expenses", async (request, reply) => {
  const data = z
    .object({
      year: z.number(),
      month: z.number().min(1).max(12),
      category: z.string(),
      description: z.string().min(1),
      plannedAmount: z.number().min(0),
      actualAmount: z.number().min(0),
      dueDay: z.number().optional(),
      installment: z.string().optional(),
    })
    .parse(request.body);

  const budget = await getOrCreateBudget(getUserId(request), data.year, data.month);

  const expense = await prisma.expense.create({
    data: {
      budgetMonthId: budget.id,
      category: data.category,
      description: data.description,
      plannedAmount: data.plannedAmount,
      actualAmount: data.actualAmount,
      dueDay: data.dueDay ?? null,
      installment: data.installment ?? null,
    },
  });

  await recalcBudget(budget.id);
  return reply.status(201).send({ expense });
});

// Busca despesa SOMENTE se pertencer ao usuário
function findOwnedExpense(id: string, userId: string) {
  return prisma.expense.findFirst({ where: { id, budgetMonth: { userId } } });
}

// 6. Editar despesa
server.patch("/api/expenses/:id", async (request, reply) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  const data = z
    .object({
      description: z.string().optional(),
      actualAmount: z.number().optional(),
      isPaid: z.boolean().optional(),
    })
    .parse(request.body);

  const owned = await findOwnedExpense(id, getUserId(request));
  if (!owned) return notFound(reply);

  const expense = await prisma.expense.update({ where: { id }, data });
  await recalcBudget(owned.budgetMonthId);
  return { expense };
});

// 7. Excluir despesa
server.delete("/api/expenses/:id", async (request, reply) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);

  const owned = await findOwnedExpense(id, getUserId(request));
  if (!owned) return notFound(reply);

  await prisma.expense.delete({ where: { id } });
  await recalcBudget(owned.budgetMonthId);
  return { success: true };
});

// 8. Veículo + débitos do usuário
server.get("/api/vehicle", async (request) => {
  const base = await getOrCreateVehicle(getUserId(request));
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: base.id },
    include: { taxes: { orderBy: { dueDate: "asc" } } },
  });
  return { vehicle };
});

// 9. Editar dados do veículo
server.patch("/api/vehicle", async (request, reply) => {
  const data = z
    .object({
      model: z.string().optional(),
      plate: z.string().min(1).optional(),
      monthlyInstallment: z.number().min(0).optional(),
      insuranceValue: z.number().min(0).optional(),
    })
    .parse(request.body);

  const vehicle = await getOrCreateVehicle(getUserId(request));

  if (data.plate && data.plate !== vehicle.plate) {
    const taken = await prisma.vehicle.findUnique({ where: { plate: data.plate } });
    if (taken) return reply.status(409).send({ error: "Esta placa já está cadastrada." });
  }

  const updated = await prisma.vehicle.update({ where: { id: vehicle.id }, data });
  return { vehicle: updated };
});

// 10. Criar débito / multa / IPVA
server.post("/api/vehicle/taxes", async (request, reply) => {
  const data = z
    .object({
      taxType: z.string().min(1),
      fiscalYear: z.number().default(new Date().getFullYear()),
      installmentNumber: z.number().default(1),
      totalInstallments: z.number().default(1),
      dueDate: z.string(),
      amount: z.number().min(0),
      isPaid: z.boolean().default(false),
    })
    .parse(request.body);

  const vehicle = await getOrCreateVehicle(getUserId(request));
  const tax = await prisma.vehicleTax.create({
    data: { ...data, vehicleId: vehicle.id, dueDate: new Date(data.dueDate) },
  });
  return reply.status(201).send({ tax });
});

// Busca débito SOMENTE se pertencer ao usuário
function findOwnedTax(id: string, userId: string) {
  return prisma.vehicleTax.findFirst({ where: { id, vehicle: { userId } } });
}

// 11. Editar débito (pago / valor / tipo)
server.patch("/api/vehicle/taxes/:id", async (request, reply) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);
  const data = z
    .object({
      isPaid: z.boolean().optional(),
      amount: z.number().min(0).optional(),
      taxType: z.string().optional(),
    })
    .parse(request.body);

  if (!(await findOwnedTax(id, getUserId(request)))) return notFound(reply);

  const tax = await prisma.vehicleTax.update({ where: { id }, data });
  return { tax };
});

// 12. Excluir débito
server.delete("/api/vehicle/taxes/:id", async (request, reply) => {
  const { id } = z.object({ id: z.string() }).parse(request.params);

  if (!(await findOwnedTax(id, getUserId(request)))) return notFound(reply);

  await prisma.vehicleTax.delete({ where: { id } });
  return { success: true };
});

const start = async () => {
  try {
    const port = Number(process.env.PORT) || 3333;
    const host = process.env.HOST || "0.0.0.0";
    await server.listen({ port, host });
    console.log(`🚀 Servidor Girô rodando em http://localhost:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
