import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  Key,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Copy,
  Check,
  UploadCloud,
  DownloadCloud,
  Code,
  ExternalLink,
  ShieldCheck,
  HelpCircle,
  Terminal,
  Layers,
  Sparkles,
  Info,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';
import {
  loadSupabaseConfig,
  saveSupabaseConfig,
  sanitizeSupabaseUrl,
  runSupabaseDiagnostic,
  syncCompaniesToSupabase,
  fetchCompaniesFromSupabase,
  SUPABASE_SQL_SCRIPT,
  DEFAULT_TABLE_NAME,
  SupabaseConfig,
  SupabaseDiagnostic,
} from '../../services/supabaseService';
import { Company } from '../../types/company';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  localCompanies: Company[];
  onCompaniesSyncedFromSupabase: (companies: Company[]) => void;
  onToast: (msg: string) => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  localCompanies,
  onCompaniesSyncedFromSupabase,
  onToast,
}) => {
  if (!isOpen) return null;

  const [config, setConfig] = useState<SupabaseConfig>(loadSupabaseConfig);
  const [isTesting, setIsTesting] = useState(false);
  const [diagnostic, setDiagnostic] = useState<SupabaseDiagnostic | null>(null);
  const [copiedSql, setCopiedSql] = useState(false);
  const [isSyncing, setIsSyncing] = useState<'upload' | 'download' | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncErrorDetails, setSyncErrorDetails] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);
  const [showSqlCode, setShowSqlCode] = useState(true);

  useEffect(() => {
    const loaded = loadSupabaseConfig();
    setConfig(loaded);
    setSyncError(null);
    setSyncErrorDetails(null);
    setSyncSuccess(null);
  }, [isOpen]);

  const currentTable = config.tableName || DEFAULT_TABLE_NAME;

  const handleRunDiagnostic = async () => {
    setIsTesting(true);
    setSyncError(null);
    setSyncErrorDetails(null);
    setSyncSuccess(null);

    const cleanUrl = sanitizeSupabaseUrl(config.supabaseUrl);
    const cleanKey = config.supabaseAnonKey.trim();
    const cleanTable = (config.tableName || DEFAULT_TABLE_NAME).trim().toLowerCase();

    // Auto-update sanitized input
    setConfig((prev) => ({
      ...prev,
      supabaseUrl: cleanUrl,
      supabaseAnonKey: cleanKey,
      tableName: cleanTable,
    }));

    const result = await runSupabaseDiagnostic(cleanUrl, cleanKey, cleanTable);
    setIsTesting(false);
    setDiagnostic(result);

    if (result.success) {
      saveSupabaseConfig({
        supabaseUrl: cleanUrl,
        supabaseAnonKey: cleanKey,
        tableName: cleanTable,
      });
      onToast(`✓ Conexão com o Supabase e tabela "${cleanTable}" 100% validada!`);
    } else {
      setSyncError(result.errorMessage || 'Falha no teste de conexão.');
      setSyncErrorDetails(result.solution || null);
    }
  };

  const handleSaveOnly = () => {
    const cleanUrl = sanitizeSupabaseUrl(config.supabaseUrl);
    const cleanKey = config.supabaseAnonKey.trim();
    const cleanTable = (config.tableName || DEFAULT_TABLE_NAME).trim().toLowerCase();
    saveSupabaseConfig({
      supabaseUrl: cleanUrl,
      supabaseAnonKey: cleanKey,
      tableName: cleanTable,
    });
    onToast('Configurações do Supabase salvas.');
    onClose();
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
    onToast('Script SQL copiado!');
  };

  const handleUploadToSupabase = async () => {
    setSyncError(null);
    setSyncErrorDetails(null);
    setSyncSuccess(null);

    if (localCompanies.length === 0) {
      setSyncError('Não há empresas no banco de dados local para enviar. Salve empresas pelo Radar ou Funil primeiro.');
      return;
    }

    setIsSyncing('upload');
    const res = await syncCompaniesToSupabase(localCompanies);
    setIsSyncing(null);

    if (res.success) {
      setSyncSuccess(`Sucesso! ${res.count} empresas foram gravadas na tabela "${currentTable}" do Supabase.`);
      onToast(`✓ ${res.count} empresas salvas na tabela "${currentTable}" do Supabase!`);
    } else {
      setSyncError(res.error || 'Falha ao sincronizar com Supabase.');
      setSyncErrorDetails(res.details || res.diagnostic?.solution || null);
      if (res.diagnostic) {
        setDiagnostic(res.diagnostic);
      }
    }
  };

  const handleDownloadFromSupabase = async () => {
    setSyncError(null);
    setSyncErrorDetails(null);
    setSyncSuccess(null);

    setIsSyncing('download');
    const res = await fetchCompaniesFromSupabase();
    setIsSyncing(null);

    if (res.success) {
      if (res.companies.length === 0) {
        setSyncSuccess(`Conexão realizada, mas a tabela "${currentTable}" no Supabase ainda está sem registros.`);
      } else {
        onCompaniesSyncedFromSupabase(res.companies);
        setSyncSuccess(`Sucesso! ${res.companies.length} empresas baixadas da tabela "${currentTable}" do Supabase.`);
        onToast(`✓ ${res.companies.length} empresas baixadas do Supabase!`);
      }
    } else {
      setSyncError(res.error || 'Falha ao baixar dados do Supabase.');
    }
  };

  const isConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Sincronização Supabase &middot; Tabela '{currentTable}'</h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    diagnostic?.success
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : isConfigured
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {diagnostic?.success
                    ? 'Conectado & Pronto'
                    : isConfigured
                    ? 'Chaves Informadas'
                    : 'Não Configurado'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Passe seus leads diretamente para a tabela <strong>{currentTable}</strong> no Supabase
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 md:p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {/* Diagnostic Console Box (Step-by-step audit) */}
          {diagnostic && (
            <div
              className={`p-4 rounded-2xl border text-xs space-y-3 ${
                diagnostic.success
                  ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
                  : 'bg-rose-50/90 border-rose-300 text-rose-950'
              }`}
            >
              <div className="flex items-center justify-between font-bold text-sm">
                <div className="flex items-center gap-2">
                  {diagnostic.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                  )}
                  <span>
                    {diagnostic.success
                      ? 'Diagnóstico Completo: Supabase 100% Pronto!'
                      : 'Diagnóstico Detectou um Problema na Conexão'}
                  </span>
                </div>
              </div>

              {/* Steps Log */}
              <div className="space-y-1.5 bg-white/80 p-3 rounded-xl border border-slate-200">
                {diagnostic.steps.map((st, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px]">
                    <span className="shrink-0 mt-0.5">
                      {st.status === 'ok' && <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />}
                      {st.status === 'error' && <X className="w-3.5 h-3.5 text-rose-600 font-bold" />}
                      {st.status === 'warning' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                    </span>
                    <div className="min-w-0 flex-1">
                      <strong className={st.status === 'error' ? 'text-rose-700' : 'text-slate-800'}>
                        {st.name}:
                      </strong>{' '}
                      <span className="text-slate-600">{st.details}</span>
                    </div>
                  </div>
                ))}
              </div>

              {!diagnostic.success && diagnostic.solution && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-300 text-slate-800 space-y-1">
                  <p className="font-bold text-amber-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Como resolver agora:
                  </p>
                  <p className="text-[11px] leading-relaxed text-slate-700">{diagnostic.solution}</p>
                </div>
              )}
            </div>
          )}

          {/* Sync Success Notice */}
          {syncSuccess && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncSuccess}</span>
            </div>
          )}

          {/* Sync Error Notice */}
          {syncError && !diagnostic && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-950 text-xs space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-rose-900">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>Erro ao gravar no Supabase:</span>
              </div>
              <p className="text-[11px] text-rose-800 pl-6 leading-relaxed">{syncError}</p>
              {syncErrorDetails && (
                <p className="text-[10px] text-slate-600 pl-6 font-mono bg-white/70 p-2 rounded-lg border border-rose-200">
                  {syncErrorDetails}
                </p>
              )}
            </div>
          )}

          {/* Project URL & Anon Key */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" /> Project URL
                </span>
              </label>
              <input
                type="text"
                value={config.supabaseUrl}
                onChange={(e) => setConfig({ ...config, supabaseUrl: e.target.value })}
                placeholder="https://sua-empresa.supabase.co"
                className="w-full text-xs font-mono py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" /> Tabela de Destino
                </span>
                <span className="text-[10px] text-slate-400">Padrão: funil</span>
              </label>
              <input
                type="text"
                value={config.tableName || DEFAULT_TABLE_NAME}
                onChange={(e) => setConfig({ ...config, tableName: e.target.value })}
                placeholder="funil"
                className="w-full text-xs font-mono py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Key className="w-3.5 h-3.5 text-emerald-600" /> API Key (anon / public)
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Chave JWT longa</span>
            </label>
            <input
              type="password"
              value={config.supabaseAnonKey}
              onChange={(e) => setConfig({ ...config, supabaseAnonKey: e.target.value })}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              className="w-full text-xs font-mono py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
            />
          </div>

          {/* Test & Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
            <button
              type="button"
              disabled={isTesting || !config.supabaseUrl || !config.supabaseAnonKey}
              onClick={handleRunDiagnostic}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              {isTesting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Testando Tabela '{currentTable}'...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Diagnosticar e Testar Conexão
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveOnly}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Salvar Chaves
            </button>
          </div>

          {/* Primary Action: Upload to Supabase */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block font-bold uppercase tracking-wider text-slate-700 mb-2">
              Gravação Direta na Tabela '{currentTable}'
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                disabled={isSyncing !== null || !isConfigured}
                onClick={handleUploadToSupabase}
                className="p-4 rounded-2xl border-2 border-emerald-500/60 bg-emerald-50/60 hover:bg-emerald-100/70 text-left transition-all group disabled:opacity-50 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-emerald-950 text-sm mb-1">
                  <UploadCloud className="w-5 h-5 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span>Gravar Dados na Tabela '{currentTable}' (Upload)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Envia as <strong>{localCompanies.length} empresas</strong> para a tabela <strong>{currentTable}</strong> no Supabase.
                </p>
                {isSyncing === 'upload' && (
                  <div className="mt-2 text-[11px] text-emerald-700 font-bold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Gravando no Supabase...
                  </div>
                )}
              </button>

              <button
                type="button"
                disabled={isSyncing !== null || !isConfigured}
                onClick={handleDownloadFromSupabase}
                className="p-4 rounded-2xl border border-slate-200 hover:border-blue-500 bg-white hover:bg-blue-50/40 text-left transition-all group disabled:opacity-50 shadow-sm"
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 text-sm mb-1 group-hover:text-blue-700">
                  <DownloadCloud className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span>Puxar Dados da Tabela '{currentTable}' (Download)</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  Importa todas as empresas gravadas no Supabase para o seu funil de vendas.
                </p>
                {isSyncing === 'download' && (
                  <div className="mt-2 text-[11px] text-blue-700 font-bold flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Baixando dados...
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Quick 1-Click SQL Script to unlock everything */}
          <div className="pt-2 border-t border-slate-200">
            <div className="bg-slate-950 text-white rounded-2xl p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span className="font-bold text-xs text-white">
                    Script SQL Definitivo da Tabela '{currentTable}' (Sem Bloqueios)
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1.5 transition-all shadow-md active:scale-95"
                >
                  {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSql ? 'Copiado!' : 'Copiar Script SQL'}
                </button>
              </div>

              <p className="text-[11px] text-slate-300 leading-relaxed">
                Este script cria ou adapta todas as colunas da tabela <strong>{currentTable}</strong> e <strong>desativa os bloqueios de segurança (RLS)</strong>, garantindo que os dados passem sem erro.
              </p>

              <div className="flex justify-between items-center pt-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setShowSqlCode(!showSqlCode)}
                  className="text-emerald-400 hover:underline font-semibold"
                >
                  {showSqlCode ? 'Ocultar código SQL' : 'Visualizar código SQL'}
                </button>
                <a
                  href="https://supabase.com/dashboard/project/_/sql"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-300 hover:text-white flex items-center gap-1 underline"
                >
                  Abrir SQL Editor do Supabase <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {showSqlCode && (
                <pre className="p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono text-[10px] text-emerald-300 overflow-x-auto max-h-44 leading-relaxed select-all">
                  {SUPABASE_SQL_SCRIPT}
                </pre>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {localCompanies.length} empresas disponíveis no banco local
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
