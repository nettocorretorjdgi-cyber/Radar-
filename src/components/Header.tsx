import React from 'react';
import {
  Radar,
  Database,
  Layers,
  Settings,
  Download,
  Building2,
  Sparkles,
  MapPin,
  UserCheck,
  Briefcase,
  TrendingUp,
  LogOut,
} from 'lucide-react';
import { SalesMember } from '../types/company';

interface HeaderProps {
  activeTab: 'map' | 'database';
  onTabChange: (tab: 'map' | 'database') => void;
  databaseCount: number;
  foundInRadiusCount: number;
  currentUser: SalesMember;
  onSwitchUser: () => void;
  onOpenBatchModal: () => void;
  onOpenSupabaseModal: () => void;
  onOpenSettings: () => void;
  onExportCSV: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  databaseCount,
  foundInRadiusCount,
  currentUser,
  onSwitchUser,
  onOpenBatchModal,
  onOpenSupabaseModal,
  onOpenSettings,
  onExportCSV,
}) => {
  const isGerente = currentUser.role === 'gerente';

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white px-4 py-2.5 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-md z-30">
      {/* Brand Title */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20 relative">
          <Radar className="w-4 h-4 text-white animate-spin-slow" />
          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-white">
              Radar<span className="text-blue-400">CNPJ</span>
            </span>
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-semibold px-1.5 py-0.2 rounded border border-blue-500/30">
              PRO
            </span>
          </div>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">
            Prospecção CNPJ/CNAE & Funil de Vendas
          </p>
        </div>
      </div>

      {/* Main Mode Tabs */}
      <div className="flex items-center bg-slate-800/90 p-1 rounded-2xl border border-slate-700">
        <button
          onClick={() => onTabChange('map')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'map'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Radar className="w-4 h-4" />
          <span>Radar & Mapa</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'map' ? 'bg-blue-700 text-white' : 'bg-slate-700 text-slate-300'
            }`}
          >
            {foundInRadiusCount}
          </span>
        </button>

        <button
          onClick={() => onTabChange('database')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            activeTab === 'database'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Funil & Banco</span>
          <span
            className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
              activeTab === 'database' ? 'bg-blue-700 text-white' : 'bg-amber-500/20 text-amber-300'
            }`}
          >
            {databaseCount}
          </span>
        </button>
      </div>

      {/* User Chip and Action Shortcuts */}
      <div className="flex items-center gap-2">
        {/* Active User / Role Badge */}
        <button
          onClick={onSwitchUser}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            isGerente
              ? 'bg-indigo-950/80 hover:bg-indigo-900 border-indigo-500/40 text-indigo-200'
              : 'bg-blue-950/80 hover:bg-blue-900 border-blue-500/40 text-blue-200'
          }`}
          title="Clique para alternar entre Modo Gerente e Modo Vendas"
        >
          <div
            className={`w-5 h-5 rounded-lg ${currentUser.avatarColor} text-white text-[10px] font-bold flex items-center justify-center`}
          >
            {currentUser.nome[0]}
          </div>
          <div className="text-left hidden sm:block">
            <span className="text-[11px] font-bold block leading-none">{currentUser.nome}</span>
            <span className="text-[9px] uppercase tracking-wider text-slate-400">
              {isGerente ? 'Modo Gerente' : 'Modo Vendas'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 ml-1">⇄</span>
        </button>

        <button
          onClick={onOpenSupabaseModal}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-300 rounded-xl transition-colors shadow-sm"
          title="Configurar chaves do Supabase e sincronizar banco"
        >
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Supabase</span>
        </button>

        <button
          onClick={onOpenBatchModal}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-colors"
          title="Consultar múltiplos CNPJs de uma vez"
        >
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Lote CNPJs</span>
        </button>

        <button
          onClick={onOpenSettings}
          className="p-2 text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors"
          title="Configurações e camadas de mapa"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
