import React, { useState } from 'react';
import {
  Radar,
  Briefcase,
  TrendingUp,
  ShieldCheck,
  UserCheck,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Users,
  Target,
  Award,
  ChevronRight,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
} from 'lucide-react';
import { SalesMember, UserRole } from '../../types/company';
import { TEAM_MEMBERS, authenticateUser } from '../../data/teamMembers';

interface EntranceScreenProps {
  onSelectUser: (user: SalesMember) => void;
}

export const EntranceScreen: React.FC<EntranceScreenProps> = ({ onSelectUser }) => {
  const [loginInput, setLoginInput] = useState('netto');
  const [passwordInput, setPasswordInput] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('vendas');

  const handleQuickLogin = (memberId: string) => {
    const member = TEAM_MEMBERS.find((m) => m.id === memberId);
    if (member) {
      setLoginInput(member.username);
      setPasswordInput(member.senha);
      setSelectedRole(member.role);
      setErrorMsg('');
      onSelectUser(member);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!loginInput.trim()) {
      setErrorMsg('Digite seu usuário ou e-mail de acesso.');
      return;
    }

    const authResult = authenticateUser(loginInput, passwordInput);
    if (authResult) {
      onSelectUser(authResult);
    } else {
      setErrorMsg('Usuário ou senha inválidos. Utilize uma das credenciais padrão indicadas abaixo.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-slate-950 text-white flex flex-col justify-between relative overflow-hidden font-sans select-none">
      {/* Background glowing effects */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <header className="p-5 md:px-12 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Radar className="w-5 h-5 text-white animate-spin-slow" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              Radar<span className="text-blue-400">CNPJ</span>
              <span className="text-xs ml-2 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-semibold border border-blue-500/30">
                PRO CRM
              </span>
            </h1>
            <p className="text-xs text-slate-400">Plataforma de Prospecção Georreferenciada & Funil de Vendas</p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3.5 py-1.5 rounded-xl border border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Acesso Seguro &middot; Portal Comercial</span>
        </div>
      </header>

      {/* Main Entrance Card */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-6 z-10">
        <div className="max-w-2xl w-full bg-slate-900/90 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-2">
              <KeyRound className="w-3.5 h-3.5" />
              <span>Autenticação de Usuário</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Entrada do Sistema Comercial
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Informe seu login e senha ou clique em uma das credenciais rápidas abaixo:
            </p>
          </div>

          {/* Quick Credential Cards (1-Click Access) */}
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
              <span>Acesso Rápido com 1 Clique:</span>
              <span className="text-[10px] text-emerald-400">Clique para preencher e entrar</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Gerente Box */}
              <div
                onClick={() => handleQuickLogin('gerente-1')}
                className="p-3.5 rounded-2xl border border-indigo-500/40 bg-indigo-950/40 hover:bg-indigo-900/50 hover:border-indigo-400 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-indigo-300">
                        Modo Gerente
                      </h4>
                      <p className="text-[10px] text-slate-400">Carlos Silva</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
                    Entrar
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-xl text-[11px] font-mono text-slate-300 flex justify-between">
                  <span>Login: <strong className="text-white">gerente</strong></span>
                  <span>Senha: <strong className="text-emerald-400">admin</strong></span>
                </div>
              </div>

              {/* Vendas (Netto Corretor) Box */}
              <div
                onClick={() => handleQuickLogin('vendas-1')}
                className="p-3.5 rounded-2xl border border-blue-500/40 bg-blue-950/40 hover:bg-blue-900/50 hover:border-blue-400 cursor-pointer transition-all group ring-1 ring-blue-500/20"
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white font-bold text-xs flex items-center justify-center">
                      <TrendingUp className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-white group-hover:text-blue-300">
                        Modo Vendas
                      </h4>
                      <p className="text-[10px] text-slate-400">Netto Corretor</p>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                    Entrar
                  </span>
                </div>
                <div className="bg-slate-950/60 p-2 rounded-xl text-[11px] font-mono text-slate-300 flex justify-between">
                  <span>Login: <strong className="text-white">netto</strong></span>
                  <span>Senha: <strong className="text-emerald-400">123456</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Usuário ou E-mail
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  placeholder="gerente ou netto"
                  className="w-full text-xs py-2.5 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-white font-mono"
                />
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                <span>Senha de Acesso</span>
                <span className="text-[10px] text-slate-500 font-mono">Padrão: admin ou 123456</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Digite sua senha..."
                  className="w-full text-xs py-2.5 pl-9 pr-10 rounded-xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 text-white font-mono"
                />
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] mt-2"
            >
              <span>Acessar o Funil de Vendas</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Reference credentials table */}
          <div className="mt-4 pt-4 border-t border-slate-800 text-center">
            <p className="text-[11px] text-slate-400">
              Outros usuários de vendas: <strong className="text-slate-300">mariana</strong> (senha: 123456) &middot; <strong className="text-slate-300">lucas</strong> (senha: 123456)
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="p-4 text-center text-xs text-slate-500 z-10 border-t border-slate-900">
        RadarCNPJ Enterprise &middot; Gestão de Prospecção & Funil de Vendas
      </footer>
    </div>
  );
};
