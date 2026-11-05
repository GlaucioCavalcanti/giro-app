import React, { useState } from "react";
import { apiFetch } from "../../../core/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ResponsiveContainer,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Line,
  ComposedChart,
} from "recharts";
import {
  TrendingUp,
  Fuel,
  Receipt,
  Wallet,
  Gauge,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Car,
} from "lucide-react";

interface AnnualSummary {
  year: number;
  monthlyData: Array<{
    month: number;
    monthName: string;
    revenue: number;
    fuelCost: number;
    expenses: number;
    netBalance: number;
  }>;
  totals: {
    revenue: number;
    fuelCost: number;
    expenses: number;
    netBalance: number;
  };
}

interface Expense {
  id: string;
  category: string;
  description: string;
  plannedAmount: number;
  actualAmount: number;
  isPaid: boolean;
  installment?: string;
  dueDay?: number;
}

interface MonthlyDetail {
  budget: {
    id: string;
    year: number;
    month: number;
    totalRevenue: number;
    totalFuelCost: number;
    totalExpenses: number;
    netBalance: number;
    weeklyEarnings: Array<{
      id: string;
      weekNumber: number;
      grossAmount: number;
      fuelCost: number;
      netAmount: number;
      totalKm: number;
    }>;
    expenses: Expense[];
    dailyWorkLogs: Array<{
      id: string;
      workDate: string;
      kmStart: number;
      kmEnd: number;
      totalKm: number;
      grossEarning: number;
      notes?: string;
      fuelEntries: Array<{
        id: string;
        fuelType: "GASOLINE" | "ETHANOL";
        liters: number;
        pricePerLiter: number;
        totalCost: number;
      }>;
    }>;
  };
}

const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const DashboardView: React.FC = () => {
  const queryClient = useQueryClient();
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [isAllMonths, setIsAllMonths] = useState<boolean>(false);

  // Estados do modal de registro diário (KM + Combustível)
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [workDate, setWorkDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [kmStart, setKmStart] = useState<string>("");
  const [kmEnd, setKmEnd] = useState<string>("");
  const [grossEarning, setGrossEarning] = useState<string>("");
  const [fuelType, setFuelType] = useState<"GASOLINE" | "ETHANOL" | "BOTH">("GASOLINE");
  const [gasLiters, setGasLiters] = useState<string>("");
  const [gasPrice, setGasPrice] = useState<string>("");
  const [ethLiters, setEthLiters] = useState<string>("0");
  const [ethPrice, setEthPrice] = useState<string>("");
  const [notes, setNotes] = useState<string>("");

  // Estados do modal de nova despesa
  const [showExpenseModal, setShowExpenseModal] = useState<boolean>(false);
  const [expDesc, setExpDesc] = useState<string>("");
  const [expCategory, setExpCategory] = useState<string>("HOUSING");
  const [expAmount, setExpAmount] = useState<string>("");
  const [expDueDay, setExpDueDay] = useState<string>("10");
  const [expInstallment, setExpInstallment] = useState<string>("");

  // Queries usando caminhos relativos (/api/...) para funcionar em qualquer host/dispositivo
  const { data: yearsData } = useQuery<{ years: number[] }>({
    queryKey: ["years"],
    queryFn: async () => {
      const res = await apiFetch("/api/years");
      return res.json();
    },
  });

  const { data: annualData } = useQuery<AnnualSummary>({
    queryKey: ["annual-summary", selectedYear],
    queryFn: async () => {
      const res = await apiFetch(`/api/dashboard/annual-summary?year=${selectedYear}`);
      return res.json();
    },
  });

  const { data: monthlyData } = useQuery<MonthlyDetail>({
    queryKey: ["monthly-detail", selectedYear, selectedMonth],
    queryFn: async () => {
      const res = await apiFetch(`/api/dashboard/monthly-detail?year=${selectedYear}&month=${selectedMonth}`);
      return res.json();
    },
  });

  // Mutação para salvar dia trabalhado
  const dailyLogMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch("/api/fuel-log/daily", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-summary", selectedYear] });
      queryClient.invalidateQueries({ queryKey: ["monthly-detail", selectedYear, selectedMonth] });
      setShowLogModal(false);
    },
  });

  // Mutação para alternar status pago da despesa
  const toggleExpensePaidMutation = useMutation({
    mutationFn: async ({ id, isPaid }: { id: string; isPaid: boolean }) => {
      const res = await apiFetch(`/api/expenses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-summary", selectedYear] });
      queryClient.invalidateQueries({ queryKey: ["monthly-detail", selectedYear, selectedMonth] });
    },
  });

  // Mutação para criar despesa
  const createExpenseMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-summary", selectedYear] });
      queryClient.invalidateQueries({ queryKey: ["monthly-detail", selectedYear, selectedMonth] });
      setShowExpenseModal(false);
      setExpDesc("");
      setExpAmount("");
    },
  });

  // Mutação para deletar despesa
  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["annual-summary", selectedYear] });
      queryClient.invalidateQueries({ queryKey: ["monthly-detail", selectedYear, selectedMonth] });
    },
  });

  // Cálculos rápidos do formulário diário
  const calcTotalKm = Math.max(0, Number(kmEnd) - Number(kmStart));
  const calcGasTotal = (Number(gasLiters) || 0) * (Number(gasPrice) || 0);
  const calcEthTotal = (Number(ethLiters) || 0) * (Number(ethPrice) || 0);
  const calcFuelTotal =
    fuelType === "GASOLINE"
      ? calcGasTotal
      : fuelType === "ETHANOL"
      ? calcEthTotal
      : calcGasTotal + calcEthTotal;

  const handleSaveDailyLog = (e: React.FormEvent) => {
    e.preventDefault();
    const fuelEntries = [];
    if (fuelType === "GASOLINE" || fuelType === "BOTH") {
      if (Number(gasLiters) > 0) {
        fuelEntries.push({
          fuelType: "GASOLINE",
          liters: Number(gasLiters),
          pricePerLiter: Number(gasPrice),
        });
      }
    }
    if (fuelType === "ETHANOL" || fuelType === "BOTH") {
      if (Number(ethLiters) > 0) {
        fuelEntries.push({
          fuelType: "ETHANOL",
          liters: Number(ethLiters),
          pricePerLiter: Number(ethPrice),
        });
      }
    }

    dailyLogMutation.mutate({
      year: selectedYear,
      month: selectedMonth,
      workDate,
      kmStart: Number(kmStart),
      kmEnd: Number(kmEnd),
      grossEarning: Number(grossEarning),
      notes,
      fuelEntries,
    });
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    createExpenseMutation.mutate({
      year: selectedYear,
      month: selectedMonth,
      category: expCategory,
      description: expDesc,
      plannedAmount: Number(expAmount),
      actualAmount: Number(expAmount),
      dueDay: Number(expDueDay) || undefined,
      installment: expInstallment || undefined,
    });
  };

  const currentBudget = monthlyData?.budget;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-3 sm:p-5 md:p-8 space-y-6 md:space-y-8 max-w-7xl mx-auto">
      {/* HEADER PRINCIPAL RESPONSIVO */}
      <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="bg-emerald-500/20 text-emerald-400 p-2 sm:p-2.5 rounded-2xl border border-emerald-500/30 shrink-0">
            <Car className="w-6 h-6 sm:w-8 sm:h-8" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              Girô <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v1.0 Pro</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400">
              Gestão Orçamentária e Operacional para Motoristas de APP
            </p>
          </div>
        </div>

        {/* NAVEGAÇÃO TEMPORAL RESPONSIVA */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-2 rounded-2xl border border-slate-800 w-full lg:w-auto justify-between sm:justify-start">
          {/* Seletor de Ano */}
          <div className="flex items-center gap-1 bg-slate-800/80 px-2 py-1.5 rounded-xl border border-slate-700">
            <button
              onClick={() => setSelectedYear((prev) => prev - 1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              title="Ano anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-xs sm:text-sm font-bold text-white focus:outline-none cursor-pointer px-1"
            >
              {yearsData?.years.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>
            <button
              onClick={() => setSelectedYear((prev) => prev + 1)}
              className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition"
              title="Próximo ano"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Alternar Ano Completo ou Mês Específico */}
          <button
            onClick={() => setIsAllMonths(!isAllMonths)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
              isAllMonths
                ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isAllMonths ? "Ano Completo" : "Ver Ano Todo"}
          </button>

          {!isAllMonths && (
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="bg-slate-800 border border-slate-700 text-white text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={idx + 1} value={idx + 1} className="bg-slate-900">
                  {name}
                </option>
              ))}
            </select>
          )}

          {/* Botão Registrar Dia */}
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20 ml-auto"
          >
            <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Registrar</span> Dia / KM
          </button>
        </div>
      </header>

      {/* CARDS DE RESUMO EM TEMPO REAL RESPONSIVOS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium truncate">Receita Bruta ({isAllMonths ? selectedYear : MONTH_NAMES[selectedMonth - 1]})</span>
            <TrendingUp className="w-4 h-4 text-emerald-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">
            R$ {((isAllMonths ? annualData?.totals.revenue : currentBudget?.totalRevenue) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-emerald-400 mt-2 font-medium">Ganhos em corridas apurados</div>
        </div>

        <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Combustível Total</span>
            <Fuel className="w-4 h-4 text-amber-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-400">
            R$ {((isAllMonths ? annualData?.totals.fuelCost : currentBudget?.totalFuelCost) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">Gasto em abastecimentos</div>
        </div>

        <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Despesas & Contas</span>
            <Receipt className="w-4 h-4 text-rose-400 shrink-0" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400">
            R$ {((isAllMonths ? annualData?.totals.expenses : currentBudget?.totalExpenses) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">Aluguel, carro, parcelas e fixos</div>
        </div>

        <div className="bg-slate-900/60 p-4 sm:p-5 rounded-2xl border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium">Saldo Resultante</span>
            <Wallet className="w-4 h-4 text-sky-400 shrink-0" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              ((isAllMonths ? annualData?.totals.netBalance : currentBudget?.netBalance) || 0) >= 0
                ? "text-emerald-400"
                : "text-rose-400"
            }`}
          >
            R$ {((isAllMonths ? annualData?.totals.netBalance : currentBudget?.netBalance) || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-slate-400 mt-2 font-medium">Lucro real em caixa</div>
        </div>
      </section>

      {/* GRÁFICO ANUAL INTERATIVO EM TEMPO REAL RESPONSIVO */}
      <section className="bg-slate-900/70 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> Panorama Anual {selectedYear}
            </h2>
            <p className="text-xs text-slate-400">
              Receitas brutas, combustível, contas e curva de saldo líquido real mês a mês.
            </p>
          </div>
          <div className="text-[10px] sm:text-xs text-slate-400 bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-700/60 self-start">
            ⚡ Atualização instantânea em tempo real
          </div>
        </div>

        <div className="h-64 sm:h-80 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={annualData?.monthlyData || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="monthName" stroke="#64748b" fontSize={11} />
              <YAxis stroke="#64748b" fontSize={11} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "12px", fontSize: "12px" }}
                formatter={(val: number) => `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Legend verticalAlign="top" wrapperStyle={{ paddingBottom: "10px", fontSize: "11px" }} />
              <Bar dataKey="revenue" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="fuelCost" name="Combustível" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" name="Contas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Line
                type="monotone"
                dataKey="netBalance"
                name="Saldo Real"
                stroke="#38bdf8"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#38bdf8" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* SEÇÃO DETALHADA DO MÊS SELECIONADO RESPONSIVA */}
      {!isAllMonths && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          {/* COLUNA 1 & 2: Ganhos Semanais e Histórico de Abastecimentos Diários */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            {/* Ganhos Semanais do Mês */}
            <div className="bg-slate-900/70 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Ganhos Semanais — {MONTH_NAMES[selectedMonth - 1]}
                </h3>
                <span className="text-[11px] text-slate-400">Totais apurados</span>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
                <table className="w-full text-left text-xs sm:text-sm min-w-[420px]">
                  <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800">
                    <tr>
                      <th className="py-2.5">Semana</th>
                      <th className="py-2.5">Receita</th>
                      <th className="py-2.5">Combustível</th>
                      <th className="py-2.5">KM</th>
                      <th className="py-2.5 text-right">Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-medium">
                    {currentBudget?.weeklyEarnings.map((w) => (
                      <tr key={w.id} className="hover:bg-slate-800/30 transition">
                        <td className="py-2.5 text-slate-200">Semana {w.weekNumber}</td>
                        <td className="py-2.5 text-emerald-400">R$ {w.grossAmount.toFixed(2)}</td>
                        <td className="py-2.5 text-amber-400">R$ {w.fuelCost.toFixed(2)}</td>
                        <td className="py-2.5 text-slate-300">{w.totalKm} km</td>
                        <td className="py-2.5 text-right font-bold text-sky-400">
                          R$ {w.netAmount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {(!currentBudget?.weeklyEarnings || currentBudget.weeklyEarnings.length === 0) && (
                      <tr>
                        <td colSpan={5} className="py-4 text-center text-slate-500">
                          Nenhuma semana fechada ainda neste mês.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Abastecimentos e KM Diários Registrados */}
            <div className="bg-slate-900/70 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-emerald-400" /> Registros Diários (KM & Combustível)
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Histórico de rodagem</p>
                </div>
                <button
                  onClick={() => setShowLogModal(true)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" /> Adicionar
                </button>
              </div>

              <div className="space-y-3">
                {currentBudget?.dailyWorkLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 sm:p-4 bg-slate-800/40 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="text-[11px] sm:text-xs font-semibold text-slate-400">
                        {new Date(log.workDate).toLocaleDateString("pt-BR")} {log.notes && `• ${log.notes}`}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-1">
                        <span className="text-xs sm:text-sm font-bold text-white">KM: {log.totalKm} km</span>
                        <span className="text-[11px] text-slate-400">({log.kmStart} ➔ {log.kmEnd})</span>
                        <span className="text-xs sm:text-sm font-bold text-emerald-400">
                          + R$ {log.grossEarning.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {log.fuelEntries.map((fe) => (
                        <span
                          key={fe.id}
                          className={`text-[10px] sm:text-xs px-2 py-0.5 rounded-xl border font-medium ${
                            fe.fuelType === "GASOLINE"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}
                        >
                          {fe.fuelType === "GASOLINE" ? "⛽ Gas." : "🌱 Eta."}: {fe.liters}L (R${fe.pricePerLiter}) = R${" "}
                          {fe.totalCost.toFixed(2)}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {(!currentBudget?.dailyWorkLogs || currentBudget.dailyWorkLogs.length === 0) && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Nenhum dia de trabalho registrado em {MONTH_NAMES[selectedMonth - 1]}. Clique em "Registrar Dia / KM" para começar!
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* COLUNA 3: CONTROLE DE DESPESAS E COMPROMISSOS FIXOS EDITÁVEIS */}
          <div className="space-y-6">
            <div className="bg-slate-900/70 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-1.5">
                    <Receipt className="w-4 h-4 text-rose-400" /> Contas & Compromissos
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-400">Editáveis: aluguel, parcelas, contas</p>
                </div>
                <button
                  onClick={() => setShowExpenseModal(true)}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl text-xs font-bold transition border border-slate-700"
                  title="Nova Despesa"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                {currentBudget?.expenses.map((exp) => (
                  <div
                    key={exp.id}
                    className="p-3 bg-slate-800/40 rounded-xl border border-slate-800 flex items-center justify-between gap-2 group hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => toggleExpensePaidMutation.mutate({ id: exp.id, isPaid: !exp.isPaid })}
                        className="text-slate-400 hover:text-emerald-400 transition shrink-0"
                      >
                        {exp.isPaid ? (
                          <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-slate-500" />
                        )}
                      </button>
                      <div>
                        <div className={`text-xs sm:text-sm font-semibold ${exp.isPaid ? "line-through text-slate-500" : "text-slate-200"}`}>
                          {exp.description} {exp.installment && <span className="text-[10px] text-amber-400 font-normal">({exp.installment})</span>}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {exp.dueDay ? `Dia ${exp.dueDay}` : "Sem venc."} • {exp.category}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs sm:text-sm font-bold text-rose-400">
                        R$ {exp.actualAmount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => deleteExpenseMutation.mutate(exp.id)}
                        className="text-slate-500 hover:text-rose-400 transition"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {(!currentBudget?.expenses || currentBudget.expenses.length === 0) && (
                  <div className="text-center py-6 text-slate-500 text-xs">
                    Nenhum compromisso cadastrado para este mês.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RESPONSIVO: REGISTRAR DIA DE TRABALHO, KM E COMBUSTÍVEL */}
      {showLogModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Gauge className="w-5 h-5 text-emerald-400" /> Registrar Dia de Trabalho
              </h3>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-slate-400 hover:text-white text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDailyLog} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Data do Trabalho</label>
                  <input
                    type="date"
                    value={workDate}
                    onChange={(e) => setWorkDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Ganho Bruto do Dia (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={grossEarning}
                    onChange={(e) => setGrossEarning(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 mt-1"
                    placeholder="Ex: 350.00"
                    required
                  />
                </div>
              </div>

              {/* SEÇÃO DE QUILOMETRAGEM */}
              <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-2">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  🚗 Quilometragem (KM)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-400">KM Inicial</label>
                    <input
                      type="number"
                      value={kmStart}
                      onChange={(e) => setKmStart(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">KM Final</label>
                    <input
                      type="number"
                      value={kmEnd}
                      onChange={(e) => setKmEnd(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Total Rodado</label>
                    <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-emerald-400 font-bold text-center">
                      {calcTotalKm} km
                    </div>
                  </div>
                </div>
              </div>

              {/* SEÇÃO DE COMBUSTÍVEL */}
              <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    ⛽ Abastecimento
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setFuelType("GASOLINE")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        fuelType === "GASOLINE" ? "bg-amber-500 text-slate-950" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      Gasolina
                    </button>
                    <button
                      type="button"
                      onClick={() => setFuelType("ETHANOL")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        fuelType === "ETHANOL" ? "bg-emerald-500 text-slate-950" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      Etanol
                    </button>
                    <button
                      type="button"
                      onClick={() => setFuelType("BOTH")}
                      className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                        fuelType === "BOTH" ? "bg-sky-500 text-slate-950" : "bg-slate-700 text-slate-400"
                      }`}
                    >
                      Ambos
                    </button>
                  </div>
                </div>

                {(fuelType === "GASOLINE" || fuelType === "BOTH") && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[10px] text-amber-400 font-semibold">Litros Gasolina</label>
                      <input
                        type="number"
                        step="0.1"
                        value={gasLiters}
                        onChange={(e) => setGasLiters(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-400 font-semibold">Preço/L (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={gasPrice}
                        onChange={(e) => setGasPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-amber-400 font-semibold">Total Gas.</label>
                      <div className="text-xs font-bold text-amber-300 pt-1.5">
                        R$ {calcGasTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                {(fuelType === "ETHANOL" || fuelType === "BOTH") && (
                  <div className="grid grid-cols-3 gap-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[10px] text-emerald-400 font-semibold">Litros Etanol</label>
                      <input
                        type="number"
                        step="0.1"
                        value={ethLiters}
                        onChange={(e) => setEthLiters(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-emerald-400 font-semibold">Preço/L (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={ethPrice}
                        onChange={(e) => setEthPrice(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-emerald-400 font-semibold">Total Eta.</label>
                      <div className="text-xs font-bold text-emerald-300 pt-1.5">
                        R$ {calcEthTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs font-bold text-slate-300 pt-1 border-t border-slate-800">
                  <span>Gasto Total Combustível:</span>
                  <span className="text-amber-400 text-sm">R$ {calcFuelTotal.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Observações</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Trânsito, chuva..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-emerald-500 mt-1"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={dailyLogMutation.isPending}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-emerald-500/20"
                >
                  {dailyLogMutation.isPending ? "Salvando..." : "Salvar Registro"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL RESPONSIVO: ADICIONAR NOVO COMPROMISSO / DESPESA */}
      {showExpenseModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-rose-400" /> Novo Compromisso / Conta
              </h3>
              <button onClick={() => setShowExpenseModal(false)} className="text-slate-400 hover:text-white text-sm p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400">Descrição do Compromisso</label>
                <input
                  type="text"
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="Ex: Aluguel, Pneu, Internet..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-rose-500 mt-1"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Categoria</label>
                  <select
                    value={expCategory}
                    onChange={(e) => setExpCategory(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white mt-1 focus:outline-none"
                  >
                    <option value="HOUSING">Moradia</option>
                    <option value="VEHICLE">Veículo</option>
                    <option value="FOOD">Mercado / Alimentação</option>
                    <option value="EDUCATION">Educação</option>
                    <option value="HEALTH">Saúde</option>
                    <option value="FINANCIAL">Financeiro / Parcelas</option>
                    <option value="SUBSCRIPTION">Assinaturas</option>
                    <option value="OTHER">Outros</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    placeholder="Ex: 670.00"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-rose-400 font-bold focus:outline-none focus:ring-1 focus:ring-rose-500 mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400">Dia Vencimento</label>
                  <input
                    type="number"
                    value={expDueDay}
                    onChange={(e) => setExpDueDay(e.target.value)}
                    placeholder="Ex: 10"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400">Parcela (opcional)</label>
                  <input
                    type="text"
                    value={expInstallment}
                    onChange={(e) => setExpInstallment(e.target.value)}
                    placeholder="Ex: 01/21"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowExpenseModal(false)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createExpenseMutation.isPending}
                  className="bg-rose-500 hover:bg-rose-400 text-white px-4 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-rose-500/20"
                >
                  {createExpenseMutation.isPending ? "Adicionando..." : "Adicionar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
