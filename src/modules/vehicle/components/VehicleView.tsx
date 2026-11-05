import React, { useState } from "react";
import { apiFetch } from "../../../core/utils/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Car,
  ShieldAlert,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  AlertTriangle,
  Edit2,
  Check,
} from "lucide-react";

interface VehicleTax {
  id: string;
  taxType: string;
  fiscalYear: number;
  installmentNumber: number;
  totalInstallments: number;
  dueDate: string;
  amount: number;
  isPaid: boolean;
}

interface Vehicle {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: number;
  monthlyInstallment: number;
  insuranceValue: number;
  taxes: VehicleTax[];
}

export const VehicleView: React.FC = () => {
  const queryClient = useQueryClient();

  // Estados de edição do veículo
  const [isEditingVehicle, setIsEditingVehicle] = useState<boolean>(false);
  const [model, setModel] = useState<string>("");
  const [plate, setPlate] = useState<string>("");
  const [installment, setInstallment] = useState<string>("");
  const [insurance, setInsurance] = useState<string>("");

  // Estados do modal de novo débito / multa
  const [showTaxModal, setShowTaxModal] = useState<boolean>(false);
  const [taxType, setTaxType] = useState<string>("MULTA");
  const [customType, setCustomType] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [dueDate, setDueDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [installmentNum, setInstallmentNum] = useState<string>("1");
  const [totalInstallments, setTotalInstallments] = useState<string>("1");
  const [fiscalYear, setFiscalYear] = useState<string>("2025");
  const [isPaid, setIsPaid] = useState<boolean>(false);

  // Consulta do Veículo e Taxas
  const { data, isLoading } = useQuery<{ vehicle: Vehicle }>({
    queryKey: ["vehicle"],
    queryFn: async () => {
      const res = await apiFetch("/api/vehicle");
      return res.json();
    },
  });

  const vehicle = data?.vehicle;

  // Sincronizar estados ao abrir edição do carro
  const handleStartEdit = () => {
    if (vehicle) {
      setModel(vehicle.model);
      setPlate(vehicle.plate);
      setInstallment(vehicle.monthlyInstallment.toString());
      setInsurance(vehicle.insuranceValue.toString());
      setIsEditingVehicle(true);
    }
  };

  // Mutação para atualizar dados do veículo
  const updateVehicleMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch("/api/vehicle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle"] });
      setIsEditingVehicle(false);
    },
  });

  // Mutação para alternar status pago
  const togglePaidMutation = useMutation({
    mutationFn: async ({ id, isPaid }: { id: string; isPaid: boolean }) => {
      const res = await apiFetch(`/api/vehicle/taxes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPaid }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle"] });
    },
  });

  // Mutação para criar débito / multa
  const createTaxMutation = useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiFetch("/api/vehicle/taxes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle"] });
      setShowTaxModal(false);
      setAmount("");
      setCustomType("");
    },
  });

  // Mutação para deletar débito / multa
  const deleteTaxMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/vehicle/taxes/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vehicle"] });
    },
  });

  const handleSaveVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    updateVehicleMutation.mutate({
      model,
      plate,
      monthlyInstallment: Number(installment) || 0,
      insuranceValue: Number(insurance) || 0,
    });
  };

  const handleCreateTax = (e: React.FormEvent) => {
    e.preventDefault();
    const finalType = taxType === "OUTROS" ? customType : taxType;
    createTaxMutation.mutate({
      taxType: finalType,
      amount: Number(amount) || 0,
      dueDate,
      installmentNumber: Number(installmentNum) || 1,
      totalInstallments: Number(totalInstallments) || 1,
      fiscalYear: Number(fiscalYear) || 2025,
      isPaid,
    });
  };

  const taxes = vehicle?.taxes || [];
  const totalTaxesAmount = taxes.reduce((acc, t) => acc + t.amount, 0);
  const totalPaid = taxes.filter((t) => t.isPaid).reduce((acc, t) => acc + t.amount, 0);
  const totalPending = totalTaxesAmount - totalPaid;

  if (isLoading) {
    return <div className="text-sm text-slate-400">Carregando dados do veículo...</div>;
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* CARD DO VEÍCULO (EDITÁVEL) */}
      <div className="bg-slate-900/70 p-5 sm:p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white">{vehicle?.model || "Carro de Trabalho"}</h3>
              <button
                onClick={handleStartEdit}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
                title="Editar dados do carro"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-xs text-slate-400">Placa: {vehicle?.plate || "APP-2026"} • Ano: {vehicle?.year || 2024}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-8 text-xs sm:text-sm">
          <div>
            <div className="text-[11px] text-slate-400">Letra / Financiamento</div>
            <div className="font-bold text-white">
              R$ {vehicle?.monthlyInstallment.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
            </div>
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Rastreamento / Seguro</div>
            <div className="font-bold text-white">
              R$ {vehicle?.insuranceValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
            </div>
          </div>
        </div>
      </div>

      {/* FORMULÁRIO DE EDIÇÃO DO VEÍCULO (SE ATIVO) */}
      {isEditingVehicle && (
        <form
          onSubmit={handleSaveVehicle}
          className="bg-slate-900 border border-slate-800 p-4 rounded-2xl grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
        >
          <div>
            <label className="text-slate-400">Modelo do Veículo</label>
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1"
              required
            />
          </div>
          <div>
            <label className="text-slate-400">Placa</label>
            <input
              type="text"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1"
              required
            />
          </div>
          <div>
            <label className="text-slate-400">Parcela Mensal (R$)</label>
            <input
              type="number"
              step="0.01"
              value={installment}
              onChange={(e) => setInstallment(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1"
              required
            />
          </div>
          <div>
            <label className="text-slate-400">Rastreamento / Seguro (R$)</label>
            <input
              type="number"
              step="0.01"
              value={insurance}
              onChange={(e) => setInsurance(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white mt-1"
              required
            />
          </div>
          <div className="sm:col-span-4 flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditingVehicle(false)}
              className="px-3 py-1.5 text-slate-400 hover:text-white rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={updateVehicleMutation.isPending}
              className="bg-sky-500 hover:bg-sky-400 text-slate-950 px-4 py-1.5 font-bold rounded-lg transition"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* CARDS DE RESUMO DOS DÉBITOS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium">Total de Débitos Cadastrados</div>
          <div className="text-xl font-black text-white mt-1">
            R$ {totalTaxesAmount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-emerald-400 font-medium">Total Quitado / Pago</div>
          <div className="text-xl font-black text-emerald-400 mt-1">
            R$ {totalPaid.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="text-[11px] text-amber-400 font-medium">Total Pendente / A Pagar</div>
          <div className="text-xl font-black text-amber-400 mt-1">
            R$ {totalPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* TABELA DE DÉBITOS, IPVA E MULTAS EDITÁVEL */}
      <div className="bg-slate-900/70 p-5 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h4 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" /> Débitos, IPVA & Multas
            </h4>
            <p className="text-xs text-slate-400">
              Controle interativo: marque como pago, adicione multas ou exclua débitos
            </p>
          </div>
          <button
            onClick={() => setShowTaxModal(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-bold transition shadow-md shadow-amber-500/20 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" /> Adicionar Débito / Multa
          </button>
        </div>

        <div className="overflow-x-auto -mx-2 sm:mx-0">
          <table className="w-full text-left text-xs sm:text-sm min-w-[500px]">
            <thead className="text-[11px] text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 w-10">Pago?</th>
                <th className="py-2.5">Descrição / Tipo</th>
                <th className="py-2.5">Cota / Exercício</th>
                <th className="py-2.5">Vencimento</th>
                <th className="py-2.5">Valor (R$)</th>
                <th className="py-2.5 text-right w-16">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {taxes.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition group">
                  <td className="py-3">
                    <button
                      onClick={() => togglePaidMutation.mutate({ id: t.id, isPaid: !t.isPaid })}
                      className="text-slate-500 hover:text-emerald-400 transition"
                      title={t.isPaid ? "Marcar como pendente" : "Marcar como pago"}
                    >
                      {t.isPaid ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </td>
                  <td className="py-3">
                    <div className={`font-semibold ${t.isPaid ? "line-through text-slate-500" : "text-white"}`}>
                      {t.taxType}
                    </div>
                  </td>
                  <td className="py-3 text-slate-400 text-xs">
                    {t.installmentNumber > 1 || t.totalInstallments > 1
                      ? `Cota ${t.installmentNumber}/${t.totalInstallments} (${t.fiscalYear})`
                      : `Única (${t.fiscalYear})`}
                  </td>
                  <td className="py-3 text-slate-300 text-xs">
                    {new Date(t.dueDate).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 font-bold text-white">
                    R$ {t.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => deleteTaxMutation.mutate(t.id)}
                      className="text-slate-500 hover:text-rose-400 transition p-1"
                      title="Excluir débito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}

              {taxes.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500 text-xs">
                    Nenhum débito veicular cadastrado. Clique em "+ Adicionar Débito / Multa" acima.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL PARA ADICIONAR DÉBITO OU MULTA */}
      {showTaxModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" /> Adicionar Débito ou Multa
              </h3>
              <button onClick={() => setShowTaxModal(false)} className="text-slate-400 hover:text-white text-sm p-1">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTax} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 font-medium">Tipo do Débito</label>
                <select
                  value={taxType}
                  onChange={(e) => setTaxType(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white mt-1 focus:outline-none"
                >
                  <option value="MULTA">Multa de Trânsito</option>
                  <option value="IPVA">IPVA</option>
                  <option value="LICENCIAMENTO">Licenciamento</option>
                  <option value="BOMBEIROS">Taxa de Bombeiros</option>
                  <option value="OUTROS">Outro / Personalizado</option>
                </select>
              </div>

              {taxType === "OUTROS" && (
                <div>
                  <label className="text-slate-400 font-medium">Nome do Débito</label>
                  <input
                    type="text"
                    value={customType}
                    onChange={(e) => setCustomType(e.target.value)}
                    placeholder="Ex: Vistoria GNV, Reboque..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white mt-1"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 font-medium">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 195.23"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-amber-400 font-bold mt-1"
                    required
                  />
                </div>
                <div>
                  <label className="text-slate-400 font-medium">Data de Vencimento</label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white mt-1"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-400">Exercício (Ano)</label>
                  <input
                    type="number"
                    value={fiscalYear}
                    onChange={(e) => setFiscalYear(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Cota / Parcela</label>
                  <input
                    type="number"
                    value={installmentNum}
                    onChange={(e) => setInstallmentNum(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  />
                </div>
                <div>
                  <label className="text-slate-400">Total de Cotas</label>
                  <input
                    type="number"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2 text-white mt-1"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="paidCheckbox"
                  checked={isPaid}
                  onChange={(e) => setIsPaid(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-slate-800 border-slate-700"
                />
                <label htmlFor="paidCheckbox" className="text-slate-300 font-medium cursor-pointer">
                  Já está pago?
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaxModal(false)}
                  className="px-3 py-2 rounded-xl text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createTaxMutation.isPending}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition shadow-md shadow-amber-500/20"
                >
                  {createTaxMutation.isPending ? "Salvando..." : "Salvar Débito"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
