import React from "react";
import { Menu, Bell, ShieldCheck } from "lucide-react";
import { useAuth } from "../../modules/auth/hooks/useAuth";

interface HeaderProps {
  title: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenMobileMenu }) => {
  const { user } = useAuth();

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          title="Abrir menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">{title}</h2>
      </div>

      <div className="flex items-center gap-3">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[11px] font-semibold border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" /> Sessão Ativa
        </span>
        <div className="text-right hidden md:block">
          <div className="text-xs font-bold text-slate-200">{user?.name || "Motorista G.O."}</div>
          <div className="text-[10px] text-slate-400">Modo Operacional</div>
        </div>
      </div>
    </header>
  );
};
