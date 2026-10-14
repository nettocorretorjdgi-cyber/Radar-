import React, { useState } from 'react';
import {
  X,
  Settings,
  Map,
  Key,
  Sliders,
  Database,
  Trash2,
  RefreshCw,
  CheckCircle,
  ExternalLink,
  Layers,
} from 'lucide-react';
import { AppSettings } from '../services/databaseStorage';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (settings: AppSettings) => void;
  onResetSampleData: () => void;
  onClearAllData: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onResetSampleData,
  onClearAllData,
}) => {
  if (!isOpen) return null;

  const [tileProvider, setTileProvider] = useState(settings.tileProvider);
  const [googleMapsKey, setGoogleMapsKey] = useState(settings.googleMapsApiKey || '');
  const [defaultRadius, setDefaultRadius] = useState(settings.defaultRadiusKm);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    onSaveSettings({
      ...settings,
      tileProvider,
      googleMapsApiKey: googleMapsKey.trim() || undefined,
      defaultRadiusKm: defaultRadius,
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-base">Configurações do Sistema</h3>
              <p className="text-xs text-slate-400">Personalize o mapa, raio e armazenamento</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Map Layer Option */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Map className="w-3.5 h-3.5 text-blue-600" /> Camada do Mapa
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'carto', name: 'Carto Voyager (Moderno)', desc: 'Design limpo e rápido' },
                { id: 'osm', name: 'OpenStreetMap Padrão', desc: 'Riqueza de detalhes urbanos' },
                { id: 'satellite', name: 'Satélite (Esri World)', desc: 'Visão aérea e de relevo' },
                { id: 'google', name: 'Google Maps Tiles', desc: 'Camada padrão Google' },
              ].map((prov) => (
                <button
                  key={prov.id}
                  type="button"
                  onClick={() => setTileProvider(prov.id as any)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    tileProvider === prov.id
                      ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <p className="font-bold text-slate-800">{prov.name}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{prov.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Google Maps API Key input (Optional) */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block font-semibold uppercase tracking-wider text-slate-600 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-600" /> Chave de API Google Maps (Opcional)
              </span>
            </label>
            <p className="text-[11px] text-slate-500 mb-2">
              O sistema funciona 100% com OpenStreetMap e dados abertos da Receita Federal. Caso você possua uma chave Google Maps para serviços dedicados, informe-a abaixo.
            </p>
            <input
              type="password"
              value={googleMapsKey}
              onChange={(e) => setGoogleMapsKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full text-xs font-mono py-2 px-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            />
          </div>

          {/* Default Radius */}
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-blue-600" /> Raio Inicial Padrão (km)
            </label>
            <select
              value={defaultRadius}
              onChange={(e) => setDefaultRadius(Number(e.target.value))}
              className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800 bg-white"
            >
              <option value={5}>5 km (Bairro / Centro expandido)</option>
              <option value={10}>10 km (Região urbana)</option>
              <option value={15}>15 km (Cidade média)</option>
              <option value={25}>25 km (Metrópole)</option>
              <option value={50}>50 km (Região metropolitana)</option>
              <option value={100}>100 km (Macrorregião)</option>
            </select>
          </div>

          {/* Database Maintenance */}
          <div className="pt-2 border-t border-slate-200">
            <label className="block font-semibold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <Database className="w-3.5 h-3.5 text-indigo-600" /> Manutenção do Banco de Dados
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Deseja recarregar o banco com as empresas modelo de demonstração?')) {
                    onResetSampleData();
                  }
                }}
                className="flex-1 py-2 px-3 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 font-medium flex items-center justify-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-500" /> Restaurar Amostras
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Tem certeza que deseja apagar todas as empresas do banco de dados local?')) {
                    onClearAllData();
                  }
                }}
                className="py-2 px-3 border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl font-medium flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar Banco
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-emerald-600 font-bold">
            {savedSuccess && '✓ Configurações salvas!'}
          </span>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm"
            >
              Salvar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
