import React, { useState } from "react";
import { useAuth } from "../../modules/auth/hooks/useAuth";
import { AuthPage } from "../../modules/auth/components/AuthPage";
import { Sidebar, NavTab } from "./Sidebar";
import { Header } from "./Header";
import { DashboardView } from "../../modules/dashboard/components/DashboardView";
import { VehicleView } from "../../modules/vehicle/components/VehicleView";

export const AppLayout: React.FC = () => {
  const { user, token, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>("dashboard");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 text-sm">
        Carregando Girô...
      </div>
    );
  }

  // Se não autenticado, apresenta a tela de login/registro
  if (!user && !token) {
    return <AuthPage />;
  }

  const titles: Record<NavTab, string> = {
    dashboard: "Painel Geral & Gráficos",
    fuel_log: "Lançamentos de KM e Abastecimento",
    expenses: "Gestão de Contas & Despesas Fixas",
    vehicle: "Veículo, IPVA & Licenciamento",
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      {/* Sidebar Modular */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Área de Conteúdo Principal */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <Header
          title={titles[activeTab]}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="p-4 sm:p-6 md:p-8 flex-1">
          {activeTab === "dashboard" && <DashboardView />}
          {activeTab === "fuel_log" && <DashboardView />}
          {activeTab === "expenses" && <DashboardView />}
          {activeTab === "vehicle" && <VehicleView />}
        </main>
      </div>
    </div>
  );
};
