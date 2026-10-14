/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Company, CnaeItem, SalesMember } from './types/company';
import { SEED_COMPANIES } from './data/seedCompanies';
import { TEAM_MEMBERS, getStoredActiveUser, saveStoredActiveUser } from './data/teamMembers';
import {
  AppSettings,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  loadStoredCompanies,
  saveStoredCompanies,
  exportToCSV,
} from './services/databaseStorage';
import { filterCompaniesInRadius, consultarCNPJ } from './services/cnpjService';
import { Header } from './components/Header';
import { CompanyMap } from './components/Map/CompanyMap';
import { SearchRadiusPanel } from './components/Search/SearchRadiusPanel';
import { CompanyCard } from './components/CompanyCard';
import { DatabaseView } from './components/Database/DatabaseView';
import { CompanyDetailsModal } from './components/Modal/CompanyDetailsModal';
import { BatchCnpjModal } from './components/Modal/BatchCnpjModal';
import { SupabaseModal } from './components/Modal/SupabaseModal';
import { AddCompanyModal } from './components/Modal/AddCompanyModal';
import { SettingsModal } from './components/SettingsModal';
import { EntranceScreen } from './components/Auth/EntranceScreen';
import {
  Building2,
  Database,
  Filter,
  Layers,
  MapPin,
  Sliders,
  Sparkles,
  ArrowUpDown,
  ListFilter,
  Check,
} from 'lucide-react';

export default function App() {
  // Active User / Session (Gerente or Vendas)
  const [currentUser, setCurrentUser] = useState<SalesMember | null>(getStoredActiveUser);
  const [showEntrance, setShowEntrance] = useState<boolean>(!getStoredActiveUser());

  // App Settings
  const [settings, setSettings] = useState<AppSettings>(loadSettings);

  const handleSelectUser = (user: SalesMember) => {
    setCurrentUser(user);
    saveStoredActiveUser(user);
    setShowEntrance(false);
    showToast(`Bem-vindo, ${user.nome}! Entrando em ${user.role === 'gerente' ? 'Modo Gerente' : 'Modo Vendas'}.`);
  };

  // Active view: 'map' or 'database'
  const [activeTab, setActiveTab] = useState<'map' | 'database'>('database');

  // Stored Companies in Database
  const [databaseCompanies, setDatabaseCompanies] = useState<Company[]>(loadStoredCompanies);

  // Live session pool (merges seed + database + live queries)
  const [livePool, setLivePool] = useState<Company[]>(() => {
    const dbMap = new Map(databaseCompanies.map((c) => [c.id, c]));
    const list: Company[] = [...databaseCompanies];
    SEED_COMPANIES.forEach((seed) => {
      if (!dbMap.has(seed.id)) {
        list.push(seed);
      }
    });
    return list;
  });

  // Search parameters
  const [center, setCenter] = useState(settings.defaultCoords);
  const [centerAddress, setCenterAddress] = useState(settings.defaultCity);
  const [radiusKm, setRadiusKm] = useState(settings.defaultRadiusKm);
  const [selectedCnae, setSelectedCnae] = useState<CnaeItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [situacaoFilter, setSituacaoFilter] = useState('TODOS');
  const [onlyInDatabase, setOnlyInDatabase] = useState(false);

  // Selected company for detail modal
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  // Modals
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [supabaseModalOpen, setSupabaseModalOpen] = useState(false);
  const [addCompanyModalOpen, setAddCompanyModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [isConsultingCnpj, setIsConsultingCnpj] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Persist database changes
  useEffect(() => {
    saveStoredCompanies(databaseCompanies);
  }, [databaseCompanies]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCompanyAdded = (newCompany: Company) => {
    setDatabaseCompanies((prev) => [newCompany, ...prev]);
    setLivePool((prev) => [newCompany, ...prev]);
    setCenter(newCompany.coordenadas);
  };

  // Synchronize company pool when database changes
  const mergedPool = useMemo(() => {
    const dbMap = new Map(databaseCompanies.map((c) => [c.id, c]));
    return livePool.map((c) => {
      if (dbMap.has(c.id)) {
        return { ...dbMap.get(c.id)!, isInDatabase: true };
      }
      return { ...c, isInDatabase: false };
    });
  }, [livePool, databaseCompanies]);

  // Compute companies within the current active radius & filters
  const companiesInRadius = useMemo(() => {
    let list = mergedPool;
    if (onlyInDatabase) {
      list = list.filter((c) => c.isInDatabase);
    }
    return filterCompaniesInRadius(
      list,
      center,
      radiusKm,
      selectedCnae?.codigo,
      searchTerm,
      situacaoFilter
    );
  }, [mergedPool, center, radiusKm, selectedCnae, searchTerm, situacaoFilter, onlyInDatabase]);

  // Toggle company in/out of database
  const handleToggleDatabase = (company: Company) => {
    const exists = databaseCompanies.some((c) => c.id === company.id);
    if (exists) {
      setDatabaseCompanies((prev) => prev.filter((c) => c.id !== company.id));
      showToast(`Empresa removida do banco de dados.`);
    } else {
      const updated: Company = {
        ...company,
        isInDatabase: true,
        savedAt: new Date().toISOString(),
        status: company.status || 'prospeccao',
      };
      setDatabaseCompanies((prev) => [updated, ...prev]);
      showToast(`"${company.nomeFantasia || company.razaoSocial}" salva no banco de dados!`);
    }
  };

  // Save/Update company with CRM tags/notes in database
  const handleSaveToDatabase = (updatedCompany: Company) => {
    setDatabaseCompanies((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedCompany.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedCompany;
        return copy;
      }
      return [updatedCompany, ...prev];
    });

    // Also update in live pool
    setLivePool((prev) => {
      const idx = prev.findIndex((c) => c.id === updatedCompany.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = updatedCompany;
        return copy;
      }
      return [updatedCompany, ...prev];
    });

    setSelectedCompany(updatedCompany);
    showToast(`Alterações salvas no banco de dados.`);
  };

  // Delete company from database
  const handleDeleteCompany = (companyId: string) => {
    setDatabaseCompanies((prev) => prev.filter((c) => c.id !== companyId));
    showToast(`Empresa removida do banco de dados.`);
  };

  // Import companies from CSV/JSON
  const handleImportCompanies = (newCompanies: Partial<Company>[]) => {
    const formatted: Company[] = newCompanies.map((c, i) => ({
      id: c.id || String(Date.now() + i),
      cnpj: c.cnpj || '00.000.000/0000-00',
      cnpjRaw: c.cnpjRaw || '',
      razaoSocial: c.razaoSocial || 'EMPRESA IMPORTADA',
      nomeFantasia: c.nomeFantasia || c.razaoSocial || 'EMPRESA IMPORTADA',
      cnaePrincipal: c.cnaePrincipal || { codigo: '0000-0/00', descricao: 'Atividade Geral' },
      cnaesSecundarios: c.cnaesSecundarios || [],
      situacaoCadastral: c.situacaoCadastral || 'ATIVA',
      dataAbertura: c.dataAbertura || '',
      capitalSocial: c.capitalSocial || 0,
      endereco: c.endereco || {
        logradouro: '',
        numero: '',
        bairro: '',
        municipio: 'São Paulo',
        uf: 'SP',
        cep: '',
      },
      contato: c.contato || {},
      qsa: c.qsa || [],
      coordenadas: c.coordenadas || center,
      isInDatabase: true,
      savedAt: new Date().toISOString(),
      status: c.status || 'prospeccao',
      tags: c.tags || ['Importado'],
      notas: c.notas || '',
      valorEstimado: c.valorEstimado || 0,
      avaliacao: c.avaliacao || 0,
    }));

    setDatabaseCompanies((prev) => [...formatted, ...prev]);
    setLivePool((prev) => [...formatted, ...prev]);
    showToast(`${formatted.length} empresas importadas para o banco!`);
  };

  // Batch CNPJs loaded from modal
  const handleBatchLoaded = (batchList: Company[]) => {
    setDatabaseCompanies((prev) => {
      const existing = new Set(prev.map((c) => c.id));
      const toAdd = batchList.filter((c) => !existing.has(c.id));
      return [...toAdd, ...prev];
    });

    setLivePool((prev) => {
      const existing = new Set(prev.map((c) => c.id));
      const toAdd = batchList.filter((c) => !existing.has(c.id));
      return [...toAdd, ...prev];
    });

    if (batchList.length > 0) {
      setCenter(batchList[0].coordenadas);
    }

    setBatchModalOpen(false);
    showToast(`${batchList.length} empresas consultadas e salvas no banco!`);
  };

  // Live Federal Revenue CNPJ Lookup
  const handleConsultarCnpjLive = async (cnpjInput: string) => {
    setIsConsultingCnpj(true);
    try {
      const company = await consultarCNPJ(cnpjInput);

      // Add to live pool if not present
      setLivePool((prev) => {
        const filtered = prev.filter((c) => c.id !== company.id);
        return [company, ...filtered];
      });

      // Reposition map to the company
      setCenter(company.coordenadas);
      setCenterAddress(
        `${company.endereco.logradouro}, ${company.endereco.numero} - ${company.endereco.municipio}/${company.endereco.uf}`
      );

      // Open details modal immediately
      setSelectedCompany(company);
      showToast(`CNPJ consultado com sucesso na Receita Federal!`);
    } catch (err: any) {
      alert(err.message || 'Erro ao consultar CNPJ');
    } finally {
      setIsConsultingCnpj(false);
    }
  };

  // Reset sample data
  const handleResetSampleData = () => {
    const sample = SEED_COMPANIES.filter((c) => c.isInDatabase);
    setDatabaseCompanies(sample);
    setLivePool(SEED_COMPANIES);
    saveStoredCompanies(sample);
    showToast('Banco de dados restaurado com as empresas de amostra.');
  };

  // Clear all data
  const handleClearAllData = () => {
    setDatabaseCompanies([]);
    setLivePool([]);
    saveStoredCompanies([]);
    showToast('Banco de dados limpo com sucesso.');
  };

  if (showEntrance || !currentUser) {
    return <EntranceScreen onSelectUser={handleSelectUser} />;
  }

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-100 font-sans text-slate-900 select-text">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2 text-xs animate-in fade-in slide-in-from-bottom-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        databaseCount={databaseCompanies.length}
        foundInRadiusCount={companiesInRadius.length}
        currentUser={currentUser}
        onSwitchUser={() => setShowEntrance(true)}
        onOpenBatchModal={() => setBatchModalOpen(true)}
        onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
        onOpenSettings={() => setSettingsModalOpen(true)}
        onExportCSV={() => exportToCSV(databaseCompanies)}
      />

      {/* Main Viewport */}
      {activeTab === 'map' ? (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Left Search & Company Results Drawer */}
          <div className="w-full md:w-[420px] lg:w-[460px] bg-slate-50 border-r border-slate-200/80 flex flex-col h-full shrink-0 overflow-hidden shadow-lg z-20">
            {/* Scrollable Filters Section */}
            <div className="p-3 md:p-4 overflow-y-auto max-h-[48vh] md:max-h-[50vh] border-b border-slate-200 bg-white">
              <SearchRadiusPanel
                radiusKm={radiusKm}
                onRadiusChange={setRadiusKm}
                selectedCnae={selectedCnae}
                onSelectCnae={setSelectedCnae}
                searchTerm={searchTerm}
                onSearchTermChange={setSearchTerm}
                situacaoFilter={situacaoFilter}
                onSituacaoFilterChange={setSituacaoFilter}
                onlyInDatabase={onlyInDatabase}
                onToggleOnlyInDatabase={setOnlyInDatabase}
                centerAddress={centerAddress}
                onCenterAddressChange={setCenterAddress}
                onCenterCoordsChange={setCenter}
                onConsultarCnpjLive={handleConsultarCnpjLive}
                isConsultingCnpj={isConsultingCnpj}
                totalFound={companiesInRadius.length}
              />
            </div>

            {/* Results Header */}
            <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
              <div className="flex items-center gap-1.5 font-bold text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span>
                  {companiesInRadius.length}{' '}
                  {companiesInRadius.length === 1 ? 'empresa encontrada' : 'empresas encontradas'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 font-medium">
                Raio de {radiusKm} km
              </span>
            </div>

            {/* Company Cards List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {companiesInRadius.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center p-6 text-center text-slate-400">
                  <MapPin className="w-10 h-10 text-slate-300 mb-2" />
                  <p className="text-xs font-semibold text-slate-600">
                    Nenhuma empresa neste raio ou filtro
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-xs mt-1">
                    Aumente o raio em km no controle deslizante, altere o centro ou limpe os filtros de CNAE.
                  </p>
                </div>
              ) : (
                companiesInRadius.map((company) => (
                  <CompanyCard
                    key={company.id}
                    company={company}
                    isSelected={selectedCompany?.id === company.id}
                    onSelect={(c) => {
                      setSelectedCompany(c);
                      setCenter(c.coordenadas);
                    }}
                    onToggleDatabase={handleToggleDatabase}
                  />
                ))
              )}
            </div>
          </div>

          {/* Interactive Map */}
          <div className="flex-1 h-full min-h-[300px] relative">
            <CompanyMap
              companies={companiesInRadius}
              center={center}
              radiusKm={radiusKm}
              selectedCompany={selectedCompany}
              tileProviderId={settings.tileProvider}
              googleMapsApiKey={settings.googleMapsApiKey}
              onSelectCompany={setSelectedCompany}
              onCenterChange={(newCenter) => {
                setCenter(newCenter);
                setCenterAddress(`Ponto no Mapa (${newCenter.lat.toFixed(4)}, ${newCenter.lng.toFixed(4)})`);
              }}
              onToggleDatabase={handleToggleDatabase}
            />
          </div>
        </div>
      ) : (
        /* Dedicated Database & Sales Funnel Mode */
        <DatabaseView
          companies={databaseCompanies}
          currentUser={currentUser}
          onSelectCompany={setSelectedCompany}
          onUpdateCompany={handleSaveToDatabase}
          onDeleteCompany={handleDeleteCompany}
          onImportCompanies={handleImportCompanies}
          onOpenAddCompanyModal={() => setAddCompanyModalOpen(true)}
          onOpenBatchModal={() => setBatchModalOpen(true)}
          onOpenSupabaseModal={() => setSupabaseModalOpen(true)}
          onSwitchUser={() => setShowEntrance(true)}
        />
      )}

      {/* Modals */}
      <AddCompanyModal
        isOpen={addCompanyModalOpen}
        onClose={() => setAddCompanyModalOpen(false)}
        currentUser={currentUser}
        onCompanyAdded={handleCompanyAdded}
        onToast={showToast}
      />

      <CompanyDetailsModal
        company={selectedCompany}
        onClose={() => setSelectedCompany(null)}
        onSaveToDatabase={handleSaveToDatabase}
        onRemoveFromDatabase={handleDeleteCompany}
      />

      <BatchCnpjModal
        isOpen={batchModalOpen}
        onClose={() => setBatchModalOpen(false)}
        onCompaniesLoaded={handleBatchLoaded}
      />

      <SupabaseModal
        isOpen={supabaseModalOpen}
        onClose={() => setSupabaseModalOpen(false)}
        localCompanies={databaseCompanies}
        onCompaniesSyncedFromSupabase={(syncedCompanies) => {
          setDatabaseCompanies(syncedCompanies);
          setLivePool(syncedCompanies);
        }}
        onToast={showToast}
      />

      <SettingsModal
        isOpen={settingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
        settings={settings}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          saveSettings(newSettings);
        }}
        onResetSampleData={handleResetSampleData}
        onClearAllData={handleClearAllData}
      />
    </div>
  );
}
