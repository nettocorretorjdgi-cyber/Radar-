import React, { useState } from 'react';
import { X, Layers, CheckCircle2, AlertCircle, Loader2, Sparkles, Database } from 'lucide-react';
import { Company } from '../../types/company';
import { cleanDigits, isValidCNPJ } from '../../utils/cnpjUtils';
import { consultarCNPJ } from '../../services/cnpjService';

interface BatchCnpjModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompaniesLoaded: (companies: Company[]) => void;
}

export const BatchCnpjModal: React.FC<BatchCnpjModalProps> = ({
  isOpen,
  onClose,
  onCompaniesLoaded,
}) => {
  if (!isOpen) return null;

  const [textInput, setTextInput] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [log, setLog] = useState<{ cnpj: string; status: 'ok' | 'error'; message: string }[]>([]);

  const handleStartBatch = async () => {
    // Extract CNPJs by lines, commas, or semicolons
    const tokens = textInput
      .split(/[\n,;\r]+/)
      .map((t) => cleanDigits(t))
      .filter((t) => t.length === 14);

    // Remove duplicates
    const uniqueCnpjs = Array.from(new Set(tokens));

    if (uniqueCnpjs.length === 0) {
      alert('Nenhum CNPJ com 14 dígitos válidos encontrado no texto.');
      return;
    }

    setIsRunning(true);
    setProgress({ current: 0, total: uniqueCnpjs.length });
    setLog([]);

    const loadedCompanies: Company[] = [];

    for (let i = 0; i < uniqueCnpjs.length; i++) {
      const cnpj = uniqueCnpjs[i];
      setProgress({ current: i + 1, total: uniqueCnpjs.length });

      try {
        const company = await consultarCNPJ(cnpj);
        company.isInDatabase = true;
        company.savedAt = new Date().toISOString();
        loadedCompanies.push(company);

        setLog((prev) => [
          ...prev,
          {
            cnpj,
            status: 'ok',
            message: `${company.nomeFantasia || company.razaoSocial} (${company.cnaePrincipal.codigo})`,
          },
        ]);
      } catch (err: any) {
        setLog((prev) => [
          ...prev,
          {
            cnpj,
            status: 'error',
            message: err.message || 'Erro ao consultar Receita Federal',
          },
        ]);
      }

      // Small pause to be polite to public API servers
      await new Promise((r) => setTimeout(r, 600));
    }

    setIsRunning(false);
    if (loadedCompanies.length > 0) {
      onCompaniesLoaded(loadedCompanies);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Consulta em Lote de CNPJs</h3>
              <p className="text-xs text-slate-400">Cole múltiplos CNPJs para importar ao banco de dados</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isRunning}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Cole os CNPJs (um por linha ou separados por vírgula):
            </label>
            <textarea
              rows={5}
              disabled={isRunning}
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="01.234.567/0001-89&#10;12.345.678/0001-95&#10;23456789000101"
              className="w-full text-xs font-mono p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
          </div>

          {/* Progress bar */}
          {isRunning && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
              <div className="flex justify-between text-xs font-semibold text-slate-700">
                <span>Consultando na Receita Federal...</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 transition-all duration-300 rounded-full"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Consultation log */}
          {log.length > 0 && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Resultado do Processamento
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-1.5 border border-slate-100 rounded-xl p-2 bg-slate-50/50 text-xs">
                {log.map((item, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg flex items-start gap-2 ${
                      item.status === 'ok' ? 'bg-emerald-50 text-emerald-900' : 'bg-rose-50 text-rose-900'
                    }`}
                  >
                    {item.status === 'ok' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="font-mono font-bold">{item.cnpj}: </span>
                      <span className="truncate">{item.message}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isRunning}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-xl"
          >
            Fechar
          </button>
          <button
            type="button"
            disabled={isRunning || !textInput.trim()}
            onClick={handleStartBatch}
            className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-sm flex items-center gap-1.5"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Iniciar Consulta em Lote
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
