import React, { useState } from 'react';
import {
  Search,
  MapPin,
  Compass,
  Sliders,
  Building2,
  FileText,
  Filter,
  X,
  Loader2,
  CheckCircle,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { CNAE_POPULARES, buscarCNAEs } from '../../data/cnaeCatalog';
import { CnaeItem } from '../../types/company';
import { formatCNPJ, isValidCNPJ, cleanDigits } from '../../utils/cnpjUtils';
import { geocodeAddress, geocodeCEP } from '../../services/cnpjService';

interface SearchRadiusPanelProps {
  radiusKm: number;
  onRadiusChange: (km: number) => void;
  selectedCnae: CnaeItem | null;
  onSelectCnae: (cnae: CnaeItem | null) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  situacaoFilter: string;
  onSituacaoFilterChange: (situacao: string) => void;
  onlyInDatabase: boolean;
  onToggleOnlyInDatabase: (val: boolean) => void;
  centerAddress: string;
  onCenterAddressChange: (address: string) => void;
  onCenterCoordsChange: (coords: { lat: number; lng: number }) => void;
  onConsultarCnpjLive: (cnpj: string) => void;
  isConsultingCnpj: boolean;
  totalFound: number;
}

export const SearchRadiusPanel: React.FC<SearchRadiusPanelProps> = ({
  radiusKm,
  onRadiusChange,
  selectedCnae,
  onSelectCnae,
  searchTerm,
  onSearchTermChange,
  situacaoFilter,
  onSituacaoFilterChange,
  onlyInDatabase,
  onToggleOnlyInDatabase,
  centerAddress,
  onCenterAddressChange,
  onCenterCoordsChange,
  onConsultarCnpjLive,
  isConsultingCnpj,
  totalFound,
}) => {
  const [cnpjInput, setCnpjInput] = useState('');
  const [addressInput, setAddressInput] = useState(centerAddress);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [cnaeSearchInput, setCnaeSearchInput] = useState('');
  const [showCnaeDropdown, setShowCnaeDropdown] = useState(false);
  const [geoError, setGeoError] = useState('');

  // Radius quick presets
  const RADIUS_PRESETS = [2, 5, 10, 25, 50];

  // CNAE search results
  const cnaeResults = buscarCNAEs(cnaeSearchInput);

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCNPJ(e.target.value);
    setCnpjInput(formatted);
  };

  const handleConsultCnpj = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cnpjInput) return;
    onConsultarCnpjLive(cnpjInput);
  };

  const handleAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressInput.trim()) return;
    setIsGeocoding(true);
    setGeoError('');

    try {
      // Check if input looks like a CEP (8 digits)
      const digits = cleanDigits(addressInput);
      if (digits.length === 8) {
        const cepResult = await geocodeCEP(digits);
        if (cepResult) {
          onCenterCoordsChange({ lat: cepResult.lat, lng: cepResult.lng });
          onCenterAddressChange(`${cepResult.city || ''} - ${cepResult.state || ''} (CEP ${formatCNPJ(digits)})`);
          setIsGeocoding(false);
          return;
        }
      }

      const coords = await geocodeAddress(addressInput);
      if (coords) {
        onCenterCoordsChange(coords);
        onCenterAddressChange(addressInput);
      } else {
        setGeoError('Endereço não localizado. Tente digitar "Cidade, Estado" ou CEP.');
      }
    } catch {
      setGeoError('Erro ao buscar localização.');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada no seu navegador.');
      return;
    }

    setIsGeocoding(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onCenterCoordsChange({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
        onCenterAddressChange('Sua Localização GPS Atual');
        setAddressInput('Sua Localização GPS Atual');
        setIsGeocoding(false);
      },
      (err) => {
        console.warn('Geolocation error:', err);
        setGeoError('Não foi possível obter sua localização GPS. Verifique a permissão do navegador.');
        setIsGeocoding(false);
      },
      { timeout: 10000 }
    );
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
      {/* 1. Address / Center Search */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-600" />
            Centro do Raio (Endereço, Cidade ou CEP)
          </span>
          <button
            type="button"
            onClick={handleGetCurrentLocation}
            className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium capitalize"
          >
            <Compass className="w-3 h-3" />
            Meu GPS
          </button>
        </label>
        <form onSubmit={handleAddressSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={addressInput}
              onChange={(e) => setAddressInput(e.target.value)}
              placeholder="Ex: Av. Paulista, 1000 ou 01310-100 ou Curitiba - PR"
              className="w-full text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800 placeholder-slate-400"
            />
            {addressInput && (
              <button
                type="button"
                onClick={() => {
                  setAddressInput('');
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={isGeocoding}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            {isGeocoding ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Mudar
          </button>
        </form>
        {geoError && <p className="text-[11px] text-rose-600 mt-1">{geoError}</p>}
      </div>

      {/* 2. Radius Slider in KM */}
      <div className="bg-slate-50/80 p-3 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Raio de Busca: <strong className="text-blue-600 text-sm font-bold">{radiusKm} km</strong>
          </span>
          <span className="text-[11px] text-slate-500 font-medium">1 km - 100 km</span>
        </div>

        <input
          type="range"
          min="1"
          max="100"
          value={radiusKm}
          onChange={(e) => onRadiusChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 mb-2.5"
        />

        {/* Quick Presets */}
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Rápido:</span>
          {RADIUS_PRESETS.map((preset) => (
            <button
              key={preset}
              type="button"
              onClick={() => onRadiusChange(preset)}
              className={`px-2 py-0.5 rounded-lg text-xs font-medium transition-all ${
                radiusKm === preset
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              {preset} km
            </button>
          ))}
        </div>
      </div>

      {/* 3. Direct CNPJ Lookup (Live Federal Revenue API) */}
      <div className="pt-1">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
            Consultar CNPJ Específico (Receita Federal)
          </span>
          {cleanDigits(cnpjInput).length === 14 && isValidCNPJ(cnpjInput) && (
            <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
              <CheckCircle className="w-3 h-3" /> Válido
            </span>
          )}
        </label>
        <form onSubmit={handleConsultCnpj} className="flex gap-2">
          <input
            type="text"
            value={cnpjInput}
            onChange={handleCnpjChange}
            placeholder="00.000.000/0000-00"
            maxLength={18}
            className="flex-1 text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-mono text-slate-800"
          />
          <button
            type="submit"
            disabled={cleanDigits(cnpjInput).length !== 14 || isConsultingCnpj}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            {isConsultingCnpj ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Consultar
          </button>
        </form>
      </div>

      {/* 4. CNAE Filter & Catalog */}
      <div className="relative">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            Filtrar por Atividade / CNAE
          </span>
          {selectedCnae && (
            <button
              type="button"
              onClick={() => onSelectCnae(null)}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-medium"
            >
              Limpar CNAE
            </button>
          )}
        </label>

        {selectedCnae ? (
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-2.5 flex items-start justify-between gap-2">
            <div>
              <span className="font-mono text-xs font-bold text-indigo-800 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                {selectedCnae.codigo}
              </span>
              <p className="text-xs text-indigo-950 font-medium mt-1 leading-snug">{selectedCnae.descricao}</p>
            </div>
            <button
              onClick={() => onSelectCnae(null)}
              className="p-1 hover:bg-indigo-100 rounded-lg text-indigo-600"
              title="Remover filtro"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <div className="relative">
              <input
                type="text"
                value={cnaeSearchInput}
                onFocus={() => setShowCnaeDropdown(true)}
                onChange={(e) => {
                  setCnaeSearchInput(e.target.value);
                  setShowCnaeDropdown(true);
                }}
                placeholder="Ex: 6821, imobiliária, software, médico..."
                className="w-full text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            {/* Dropdown with CNAE list */}
            {showCnaeDropdown && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto z-50 p-1">
                <div className="p-1.5 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Selecione uma atividade</span>
                  <button
                    type="button"
                    onClick={() => setShowCnaeDropdown(false)}
                    className="hover:text-slate-600"
                  >
                    Fechar
                  </button>
                </div>
                {cnaeResults.length === 0 ? (
                  <div className="p-3 text-center text-xs text-slate-500">Nenhum CNAE encontrado</div>
                ) : (
                  cnaeResults.map((item) => (
                    <button
                      key={item.codigo}
                      type="button"
                      onClick={() => {
                        onSelectCnae(item);
                        setShowCnaeDropdown(false);
                        setCnaeSearchInput('');
                      }}
                      className="w-full text-left p-2 hover:bg-indigo-50/70 rounded-lg transition-colors flex items-start gap-2 group"
                    >
                      <span className="font-mono text-[11px] font-semibold text-slate-500 group-hover:text-indigo-600 bg-slate-100 px-1 py-0.5 rounded shrink-0">
                        {item.codigo}
                      </span>
                      <span className="text-xs text-slate-700 leading-snug group-hover:text-slate-900">
                        {item.descricao}
                      </span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. General Search Term & Database Filters */}
      <div className="space-y-2 pt-1 border-t border-slate-100">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            placeholder="Buscar por nome, razão social, bairro..."
            className="w-full text-xs py-2 pl-8 pr-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <select
            value={situacaoFilter}
            onChange={(e) => onSituacaoFilterChange(e.target.value)}
            className="text-xs py-1.5 px-2 rounded-xl border border-slate-200 text-slate-700 bg-white focus:outline-none"
          >
            <option value="TODOS">Todas Situações</option>
            <option value="ATIVA">Apenas Ativas</option>
            <option value="BAIXADA">Baixadas</option>
          </select>

          <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700 select-none">
            <input
              type="checkbox"
              checked={onlyInDatabase}
              onChange={(e) => onToggleOnlyInDatabase(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-blue-600 accent-blue-600"
            />
            <Database className="w-3 h-3 text-slate-500" />
            <span>Apenas Salvas no Banco</span>
          </label>
        </div>
      </div>
    </div>
  );
};
