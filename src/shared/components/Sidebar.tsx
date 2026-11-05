import React from "react";
import {
  LayoutDashboard,
  Gauge,
  Receipt,
  Car,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../modules/auth/hooks/useAuth";

export type NavTab = "dashboard" | "fuel_log" | "expenses" | "vehicle";

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { user, logout } = useAuth();

  const navItems = [
    { id: "dashboard" as NavTab, label: "Dashboard", icon: LayoutDashboard },
    { id: "fuel_log" as NavTab, label: "KM & Combustível", icon: Gauge },
    { id: "expenses" as NavTab, label: "Contas & Compromissos", icon: Receipt },
    { id: "vehicle" as NavTab, label: "Veículo & IPVA", icon: Car },
  ];

  return (
    <>
      {/* Overlay no mobile */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 p-5 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Logo da Aplicação */}
          <div className="flex items-center gap-3 px-2">
            <span className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-2xl border border-emerald-500/30">
              <Car className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
                Girô <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30">Pro</span>
              </h2>
              <p className="text-[11px] text-slate-400">Gestão Orçamentária</p>
            </div>
          </div>

          {/* Navegação Principal */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-sm"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-emerald-400" : "text-slate-400"}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé do Menu com Usuário e Logout */}
        <div className="pt-4 border-t border-slate-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-white truncate">{user?.name || "Motorista"}</div>
              <div className="text-[10px] text-slate-400 truncate">{user?.email || "motorista@giro.app"}</div>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition"
          >
            <LogOut className="w-4 h-4" />
            Sair da Conta
          </button>
        </div>
      </aside>
    </>
  );
};
