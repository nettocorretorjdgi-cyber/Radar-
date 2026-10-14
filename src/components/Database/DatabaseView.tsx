import React, { useState, useMemo } from 'react';
import {
  Database,
  Table as TableIcon,
  Kanban,
  BarChart3,
  Download,
  Upload,
  Search,
  Plus,
  Trash2,
  ExternalLink,
  MessageCircle,
  Phone,
  Tag,
  Star,
  Filter,
  ArrowUpDown,
  Building,
  CheckSquare,
  Square,
  FileSpreadsheet,
  UserCheck,
  Target,
  Award,
  Users,
  Briefcase,
  TrendingUp,
  Sparkles,
  Calendar,
  Shuffle,
} from 'lucide-react';
import { Company, PipelineStatus, SalesMember } from '../../types/company';
import { formatCurrency, formatPhone, getWhatsAppUrl } from '../../utils/cnpjUtils';
import { exportToCSV, parseCSVToCompanies } from '../../services/databaseStorage';
import { TEAM_MEMBERS } from '../../data/teamMembers';

interface DatabaseViewProps {
  companies: Company[];
  currentUser: SalesMember;
  onSelectCompany: (company: Company) => void;
  onUpdateCompany: (company: Company) => void;
  onDeleteCompany: (companyId: string) => void;
  onImportCompanies: (newCompanies: Partial<Company>[]) => void;
  onOpenAddCompanyModal: () => void;
  onOpenBatchModal: () => void;
  onOpenSupabaseModal?: () => void;
  onSwitchUser?: () => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({
  companies,
  currentUser,
  onSelectCompany,
  onUpdateCompany,
  onDeleteCompany,
  onImportCompanies,
  onOpenAddCompanyModal,
  onOpenBatchModal,
  onOpenSupabaseModal,
  onSwitchUser,
}) => {
  const [subView, setSubView] = useState<'kanban' | 'table' | 'analytics'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('TODOS');
  const [ufFilter, setUfFilter] = useState<string>('TODAS');
  const [selectedRepFilter, setSelectedRepFilter] = useState<string>(
    currentUser.role === 'vendas' ? currentUser.id : 'TODOS'
  );
  const [sortField, setSortField] = useState<'razaoSocial' | 'capitalSocial' | 'savedAt'>('savedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const isGerente = currentUser.role === 'gerente';
  const salesReps = TEAM_MEMBERS.filter((m) => m.role === 'vendas');

  // Unique UFs
  const uniqueUfs = useMemo(() => {
    const set = new Set<string>();
    companies.forEach((c) => {
      if (c.endereco?.uf) set.add(c.endereco.uf);
    });
    return Array.from(set).sort();
  }, [companies]);

  // Filtered & Sorted companies
  const filteredCompanies = useMemo(() => {
    return companies
      .filter((c) => {
        // Responsible filter
        if (selectedRepFilter !== 'TODOS') {
          const compRep = c.responsavelId || 'unassigned';
          if (compRep !== selectedRepFilter) return false;
        }

        // Search term
        if (searchTerm) {
          const t = searchTerm.toLowerCase();
          const matchName = (c.nomeFantasia || '').toLowerCase().includes(t);
          const matchRazao = (c.razaoSocial || '').toLowerCase().includes(t);
          const matchCnpj = c.cnpjRaw.includes(searchTerm.replace(/\D/g, ''));
          const matchCnae =
            (c.cnaePrincipal?.descricao || '').toLowerCase().includes(t) ||
            (c.cnaePrincipal?.codigo || '').includes(t);
          const matchCity = (c.endereco?.municipio || '').toLowerCase().includes(t);
          const matchTag = (c.tags || []).some((tg) => tg.toLowerCase().includes(t));
          const matchRep = (c.responsavelNome || '').toLowerCase().includes(t);

          if (!matchName && !matchRazao && !matchCnpj && !matchCnae && !matchCity && !matchTag && !matchRep) {
            return false;
          }
        }

        // Status filter
        if (statusFilter !== 'TODOS' && (c.status || 'prospeccao') !== statusFilter) {
          return false;
        }

        // UF filter
        if (ufFilter !== 'TODAS' && c.endereco?.uf !== ufFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (sortField === 'capitalSocial') {
          valA = a.capitalSocial || 0;
          valB = b.capitalSocial || 0;
        }

        if (sortOrder === 'asc') {
          return valA > valB ? 1 : -1;
        } else {
          return valA < valB ? 1 : -1;
        }
      });
  }, [companies, searchTerm, statusFilter, ufFilter, selectedRepFilter, sortField, sortOrder]);

  // Select all toggle
  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredCompanies.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredCompanies.map((c) => c.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDeleteSelected = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Deseja remover as ${selectedIds.length} empresas selecionadas?`)) {
      selectedIds.forEach((id) => onDeleteCompany(id));
      setSelectedIds([]);
    }
  };

  const handleBulkChangeStatus = (newStatus: PipelineStatus) => {
    selectedIds.forEach((id) => {
      const comp = companies.find((c) => c.id === id);
      if (comp) {
        onUpdateCompany({ ...comp, status: newStatus });
      }
    });
  };

  const handleBulkAssignRep = (repId: string) => {
    const rep = TEAM_MEMBERS.find((m) => m.id === repId);
    selectedIds.forEach((id) => {
      const comp = companies.find((c) => c.id === id);
      if (comp) {
        onUpdateCompany({ ...comp, responsavelId: repId, responsavelNome: rep?.nome || '' });
      }
    });
  };

  // Gerente function: Distribute unassigned leads equally among sales reps
  const handleDistributeUnassigned = () => {
    const unassigned = companies.filter((c) => !c.responsavelId || c.responsavelId === 'unassigned');
    if (unassigned.length === 0) {
      alert('Todos os leads já possuem corretor/vendedor responsável atribuído!');
      return;
    }

    if (
      window.confirm(
        `Distribuir ${unassigned.length} leads sem responsável igualmente entre os ${salesReps.length} vendedores?`
      )
    ) {
      unassigned.forEach((comp, idx) => {
        const assignedRep = salesReps[idx % salesReps.length];
        onUpdateCompany({
          ...comp,
          responsavelId: assignedRep.id,
          responsavelNome: assignedRep.nome,
        });
      });
      alert(`Distribuição concluída com sucesso!`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const parsed = parseCSVToCompanies(text);
      if (parsed.length > 0) {
        onImportCompanies(parsed);
        alert(`${parsed.length} empresas importadas via CSV!`);
      } else {
        alert('Nenhum dado reconhecido no arquivo CSV.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // 6 Pipeline Stages for Commercial Sales Funnel
  const pipelineStages: { id: PipelineStatus; label: string; desc: string; color: string }[] = [
    {
      id: 'prospeccao',
      label: '1. Novos Leads',
      desc: 'Mapeados no radar',
      color: 'border-slate-300 bg-slate-50',
    },
    {
      id: 'contatado',
      label: '2. Em Contato',
      desc: 'Abordagem inicial',
      color: 'border-blue-300 bg-blue-50/50',
    },
    {
      id: 'reuniao',
      label: '3. Reunião / Visita',
      desc: 'Apresentação agendada',
      color: 'border-indigo-300 bg-indigo-50/50',
    },
    {
      id: 'proposta',
      label: '4. Proposta Enviada',
      desc: 'Análise de valores',
      color: 'border-amber-300 bg-amber-50/50',
    },
    {
      id: 'fechamento',
      label: '5. Negociação Final',
      desc: 'Minuta e fechamento',
      color: 'border-purple-300 bg-purple-50/50',
    },
    {
      id: 'cliente',
      label: '6. Ganho / Fechado 🎉',
      desc: 'Venda realizada',
      color: 'border-emerald-400 bg-emerald-50/60',
    },
    {
      id: 'descartado',
      label: 'Perdido / Descarte',
      desc: 'Sem interesse ou fit',
      color: 'border-rose-200 bg-rose-50/30',
    },
  ];

  // Pipeline calculations
  const totalValue = useMemo(() => {
    return filteredCompanies.reduce((acc, c) => acc + (c.valorEstimado || 0), 0);
  }, [filteredCompanies]);

  const totalWonValue = useMemo(() => {
    return filteredCompanies
      .filter((c) => c.status === 'cliente')
      .reduce((acc, c) => acc + (c.valorEstimado || 0), 0);
  }, [filteredCompanies]);

  const totalClosedDeals = filteredCompanies.filter((c) => c.status === 'cliente').length;
  const conversionRate = filteredCompanies.length > 0
    ? Math.round((totalClosedDeals / filteredCompanies.length) * 100)
    : 0;

  // Monthly Target
  const targetMonthly = isGerente
    ? currentUser.metaMensal
    : currentUser.metaMensal;
  const targetProgress = Math.min(Math.round((totalWonValue / (targetMonthly || 1)) * 100), 100);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-100/70 overflow-hidden font-sans">
      {/* Top Banner: Mode Indicator & Role Control */}
      <div
        className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 text-xs ${
          isGerente
            ? 'bg-indigo-950 text-indigo-100 border-indigo-900'
            : 'bg-slate-900 text-slate-100 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs ${
              isGerente ? 'bg-indigo-600 text-white' : 'bg-blue-600 text-white'
            }`}
          >
            {isGerente ? <Briefcase className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold uppercase tracking-wide text-white">
                {isGerente ? 'Modo Gerente Comercial' : 'Modo Vendas'}
              </span>
              <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full border border-white/20">
                Logado como: <strong>{currentUser.nome}</strong>
              </span>
            </div>
            <p className="text-[11px] text-slate-300">
              {isGerente
                ? 'Supervisão de equipe, pipeline unificado e distribuição de oportunidades.'
                : 'Seu funil pessoal de negociações, metas e fechamento com clientes.'}
            </p>
          </div>
        </div>

        {/* Goal / Meta Progress bar */}
        <div className="flex items-center gap-4">
          <div className="hidden sm:block text-right">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">
              {isGerente ? 'Meta Global da Equipe' : 'Minha Meta do Mês'}
            </span>
            <span className="font-bold text-xs text-white">
              {formatCurrency(totalWonValue)} / {formatCurrency(targetMonthly)}
            </span>
          </div>

          <div className="w-28 bg-slate-800 rounded-full h-2.5 overflow-hidden border border-slate-700 hidden sm:block">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                targetProgress >= 100 ? 'bg-emerald-400' : 'bg-blue-500'
              }`}
              style={{ width: `${targetProgress}%` }}
            />
          </div>

          {onSwitchUser && (
            <button
              onClick={onSwitchUser}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Trocar Perfil</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Top Action Bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 shrink-0 flex flex-wrap items-center justify-between gap-3 shadow-sm">
        {/* View Switcher: Funil vs Tabela vs Métricas */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            onClick={() => setSubView('kanban')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'kanban'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Funil de Vendas (Kanban)
          </button>
          <button
            onClick={() => setSubView('table')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'table'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tabela de Empresas
          </button>
          <button
            onClick={() => setSubView('analytics')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              subView === 'analytics'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Métricas & Conversão
          </button>
        </div>

        {/* Gerente specific tool: Distribute leads */}
        {isGerente && (
          <button
            onClick={handleDistributeUnassigned}
            className="px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            title="Distribuir leads não atribuídos igualmente na equipe"
          >
            <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
            <span>Distribuir Leads na Equipe</span>
          </button>
        )}

        {/* Action Buttons: Add Company, Import, Supabase, Export */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddCompanyModal}
            className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>+ Adicionar Empresa no Funil</span>
          </button>

          {onOpenSupabaseModal && (
            <button
              onClick={onOpenSupabaseModal}
              className="px-3 py-1.5 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 rounded-xl flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Supabase</span>
            </button>
          )}

          <button
            onClick={onOpenBatchModal}
            className="px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Lote CNPJ</span>
          </button>

          <button
            onClick={() => exportToCSV(companies)}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar (Visible in Funnel & Table) */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-[280px]">
          {/* Search box */}
          <div className="relative flex-1 max-w-xs">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar lead, CNPJ, atividade ou cidade..."
              className="w-full text-xs py-1.5 pl-8 pr-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
          </div>

          {/* Filter by sales rep (Crucial for Gerente & Vendedor toggle) */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="text-[11px] font-bold text-slate-500">Corretor:</span>
            <select
              value={selectedRepFilter}
              onChange={(e) => setSelectedRepFilter(e.target.value)}
              className="text-xs bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos os Corretores ({companies.length})</option>
              {salesReps.map((rep) => {
                const count = companies.filter((c) => c.responsavelId === rep.id).length;
                return (
                  <option key={rep.id} value={rep.id}>
                    {rep.nome} ({count})
                  </option>
                );
              })}
              <option value="unassigned">Sem Responsável</option>
            </select>
          </div>

          {/* UF Filter */}
          <select
            value={ufFilter}
            onChange={(e) => setUfFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-xl border border-slate-200 bg-white text-slate-700"
          >
            <option value="TODAS">Todos os Estados</option>
            {uniqueUfs.map((uf) => (
              <option key={uf} value={uf}>
                {uf}
              </option>
            ))}
          </select>
        </div>

        {/* Funnel Pipeline Totals */}
        <div className="flex items-center gap-3 text-slate-600 font-medium">
          <span className="text-slate-800 font-bold">
            {filteredCompanies.length} {filteredCompanies.length === 1 ? 'oportunidade' : 'oportunidades'}
          </span>
          <span className="text-slate-300">|</span>
          <span className="text-emerald-700 font-bold">
            Pipeline: {formatCurrency(totalValue)}
          </span>
        </div>
      </div>

      {/* SUBVIEW 1: SALES FUNNEL (KANBAN PIPELINE) */}
      {subView === 'kanban' && (
        <div className="flex-1 p-4 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-3.5 h-full min-w-[1300px]">
            {pipelineStages.map((stage) => {
              const stageCompanies = filteredCompanies.filter(
                (c) => (c.status || 'prospeccao') === stage.id
              );
              const stageValue = stageCompanies.reduce(
                (acc, c) => acc + (c.valorEstimado || 0),
                0
              );

              return (
                <div
                  key={stage.id}
                  className={`w-72 flex flex-col rounded-2xl border ${stage.color} p-3 shrink-0 shadow-sm`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-slate-200/80">
                    <div>
                      <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
                        {stage.label}
                      </h3>
                      <p className="text-[10px] text-slate-500">{stage.desc}</p>
                    </div>
                    <div className="text-right">
                      <span className="w-5 h-5 rounded-full bg-white border border-slate-200 text-slate-800 text-[11px] font-bold inline-flex items-center justify-center mb-0.5">
                        {stageCompanies.length}
                      </span>
                      <span className="text-[10px] font-bold text-slate-700 block">
                        {formatCurrency(stageValue)}
                      </span>
                    </div>
                  </div>

                  {/* Card List in Stage */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {stageCompanies.length === 0 ? (
                      <div className="h-28 border border-dashed border-slate-200 rounded-xl flex items-center justify-center text-[11px] text-slate-400">
                        Nenhum lead nesta etapa
                      </div>
                    ) : (
                      stageCompanies.map((company) => {
                        const whatsappUrl = getWhatsAppUrl(
                          company.contato?.telefone || company.contato?.telefone2,
                          `Olá, falo com o responsável pela ${company.nomeFantasia || company.razaoSocial}?`
                        );
                        const assignedRep = TEAM_MEMBERS.find((m) => m.id === company.responsavelId);

                        return (
                          <div
                            key={company.id}
                            className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group relative text-xs"
                          >
                            {/* Card Header: Name & Priority */}
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <h4
                                onClick={() => onSelectCompany(company)}
                                className="font-bold text-xs text-slate-900 group-hover:text-blue-600 cursor-pointer line-clamp-2 leading-snug"
                              >
                                {company.nomeFantasia || company.razaoSocial}
                              </h4>
                              {company.avaliacao ? (
                                <div className="flex items-center text-yellow-500 shrink-0 text-[10px] font-bold">
                                  ★ {company.avaliacao}
                                </div>
                              ) : null}
                            </div>

                            <p className="text-[10px] font-mono text-slate-400 mb-1.5">
                              {company.cnpj}
                            </p>

                            {/* CNAE */}
                            <div className="text-[11px] text-slate-600 line-clamp-1 mb-2">
                              <span className="font-semibold text-blue-700 mr-1">
                                {company.cnaePrincipal?.codigo}
                              </span>
                              {company.cnaePrincipal?.descricao}
                            </div>

                            {/* Location & Estimated value */}
                            <div className="flex items-center justify-between text-[11px] py-1.5 border-t border-slate-100 text-slate-600 font-medium">
                              <span>
                                {company.endereco?.municipio} - {company.endereco?.uf}
                              </span>
                              {company.valorEstimado ? (
                                <span className="font-bold text-emerald-700">
                                  {formatCurrency(company.valorEstimado)}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic">Sem valor</span>
                              )}
                            </div>

                            {/* Responsável tag */}
                            <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-100 text-slate-500">
                              <div className="flex items-center gap-1.5">
                                <div
                                  className={`w-4 h-4 rounded-full ${
                                    assignedRep?.avatarColor || 'bg-slate-400'
                                  } text-white font-bold text-[8px] flex items-center justify-center`}
                                >
                                  {assignedRep?.nome[0] || '?'}
                                </div>
                                <span className="font-semibold text-slate-700 truncate max-w-[110px]">
                                  {assignedRep?.nome || 'Não atribuído'}
                                </span>
                              </div>

                              {isGerente && (
                                <select
                                  value={company.responsavelId || ''}
                                  onChange={(e) => {
                                    const rep = TEAM_MEMBERS.find((m) => m.id === e.target.value);
                                    onUpdateCompany({
                                      ...company,
                                      responsavelId: e.target.value,
                                      responsavelNome: rep?.nome || '',
                                    });
                                  }}
                                  className="text-[9px] py-0.5 px-1 rounded border border-slate-200 text-slate-600 bg-slate-50"
                                >
                                  <option value="">Atribuir...</option>
                                  {salesReps.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.nome}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </div>

                            {/* Move Stage & Quick Actions */}
                            <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {whatsappUrl && (
                                  <a
                                    href={whatsappUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                                    title="Chamar no WhatsApp"
                                  >
                                    <MessageCircle className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                {company.contato?.telefone && (
                                  <a
                                    href={`tel:${company.contato.telefone}`}
                                    className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
                                    title="Ligar"
                                  >
                                    <Phone className="w-3.5 h-3.5" />
                                  </a>
                                )}
                              </div>

                              {/* Stage Selector */}
                              <select
                                value={company.status || 'prospeccao'}
                                onChange={(e) =>
                                  onUpdateCompany({
                                    ...company,
                                    status: e.target.value as PipelineStatus,
                                  })
                                }
                                className="text-[10px] py-1 px-1.5 rounded-lg border border-slate-200 font-semibold text-blue-900 bg-blue-50/50 cursor-pointer"
                              >
                                {pipelineStages.map((st) => (
                                  <option key={st.id} value={st.id}>
                                    {st.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUBVIEW 2: TABLE VIEW */}
      {subView === 'table' && (
        <div className="flex-1 flex flex-col p-4 overflow-hidden">
          {/* Bulk actions */}
          {selectedIds.length > 0 && (
            <div className="mb-3 flex items-center gap-2 bg-blue-50 border border-blue-200 p-2.5 rounded-2xl shadow-sm">
              <span className="text-xs font-semibold text-blue-900 mr-2">
                {selectedIds.length} selecionada(s)
              </span>

              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkChangeStatus(e.target.value as PipelineStatus);
                    e.target.value = '';
                  }
                }}
                className="text-xs py-1 px-2 rounded-lg bg-white border border-blue-200 text-blue-900"
                defaultValue=""
              >
                <option value="" disabled>
                  Mudar Etapa...
                </option>
                {pipelineStages.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>

              {isGerente && (
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAssignRep(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="text-xs py-1 px-2 rounded-lg bg-white border border-blue-200 text-blue-900"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Atribuir Corretor...
                  </option>
                  {salesReps.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.nome}
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleDeleteSelected}
                className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 ml-auto"
              >
                <Trash2 className="w-3.5 h-3.5" /> Excluir Selecionadas
              </button>
            </div>
          )}

          {/* Table */}
          <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 z-10">
                  <th className="p-3 w-10 text-center">
                    <button onClick={handleToggleSelectAll} className="text-slate-400 hover:text-slate-700">
                      {selectedIds.length === filteredCompanies.length ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="p-3">Empresa / Razão</th>
                  <th className="p-3">CNPJ</th>
                  <th className="p-3">CNAE Principal</th>
                  <th className="p-3">Localização</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3">Etapa do Funil</th>
                  <th className="p-3">Valor Negócio</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((company) => {
                  const isSelected = selectedIds.includes(company.id);
                  const whatsappUrl = getWhatsAppUrl(
                    company.contato?.telefone || company.contato?.telefone2
                  );
                  const assignedRep = TEAM_MEMBERS.find((m) => m.id === company.responsavelId);

                  return (
                    <tr
                      key={company.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isSelected ? 'bg-blue-50/40' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleSelect(company.id)}
                          className="text-slate-400 hover:text-slate-700"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      <td className="p-3 max-w-[200px]">
                        <button
                          onClick={() => onSelectCompany(company)}
                          className="font-bold text-slate-900 hover:text-blue-600 text-left line-clamp-1"
                        >
                          {company.nomeFantasia || company.razaoSocial}
                        </button>
                        <span className="text-[11px] text-slate-400 block truncate">
                          {company.razaoSocial}
                        </span>
                      </td>

                      <td className="p-3 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {company.cnpj}
                      </td>

                      <td className="p-3 max-w-[180px]">
                        <span className="font-mono text-[10px] text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-semibold mr-1">
                          {company.cnaePrincipal?.codigo}
                        </span>
                        <span className="text-slate-600 text-[11px] line-clamp-1">
                          {company.cnaePrincipal?.descricao}
                        </span>
                      </td>

                      <td className="p-3 text-slate-600 whitespace-nowrap">
                        {company.endereco?.municipio} - {company.endereco?.uf}
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <span className="text-xs font-semibold text-slate-700">
                          {assignedRep?.nome || 'Sem responsável'}
                        </span>
                      </td>

                      <td className="p-3 whitespace-nowrap">
                        <select
                          value={company.status || 'prospeccao'}
                          onChange={(e) =>
                            onUpdateCompany({
                              ...company,
                              status: e.target.value as PipelineStatus,
                            })
                          }
                          className="text-[11px] font-semibold py-1 px-2 rounded-lg border border-slate-200 bg-white"
                        >
                          {pipelineStages.map((st) => (
                            <option key={st.id} value={st.id}>
                              {st.label}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-3 whitespace-nowrap font-bold text-emerald-700">
                        {company.valorEstimado ? formatCurrency(company.valorEstimado) : '-'}
                      </td>

                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {whatsappUrl && (
                            <a
                              href={whatsappUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <button
                            onClick={() => onSelectCompany(company)}
                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700 font-semibold"
                          >
                            Ver
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBVIEW 3: ANALYTICS & METRICS */}
      {subView === 'analytics' && (
        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Top KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Total de Oportunidades
              </span>
              <p className="text-2xl font-extrabold text-slate-900">{filteredCompanies.length}</p>
              <span className="text-[11px] text-slate-500 font-medium">No funil comercial</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Forecast em Negociação
              </span>
              <p className="text-2xl font-extrabold text-blue-600">{formatCurrency(totalValue)}</p>
              <span className="text-[11px] text-slate-500 font-medium">Soma de propostas e valores</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Negócios Fechados (Ganhos)
              </span>
              <p className="text-2xl font-extrabold text-emerald-600">{formatCurrency(totalWonValue)}</p>
              <span className="text-[11px] text-emerald-700 font-bold">
                {totalClosedDeals} vendas concluídas
              </span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Taxa de Conversão
              </span>
              <p className="text-2xl font-extrabold text-purple-600">{conversionRate}%</p>
              <span className="text-[11px] text-slate-500 font-medium">Leads convertidos em clientes</span>
            </div>
          </div>

          {/* Performance by Sales Rep */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-600" />
              Desempenho da Equipe Comercial
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {salesReps.map((rep) => {
                const repCompanies = companies.filter((c) => c.responsavelId === rep.id);
                const wonCompanies = repCompanies.filter((c) => c.status === 'cliente');
                const wonValue = wonCompanies.reduce((acc, c) => acc + (c.valorEstimado || 0), 0);
                const progress = Math.min(Math.round((wonValue / (rep.metaMensal || 1)) * 100), 100);

                return (
                  <div key={rep.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div
                        className={`w-8 h-8 rounded-xl ${rep.avatarColor} text-white font-bold text-xs flex items-center justify-center`}
                      >
                        {rep.nome
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{rep.nome}</h4>
                        <p className="text-[10px] text-slate-500">{rep.cargo}</p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 mt-3 pt-3 border-t border-slate-200">
                      <div className="flex justify-between">
                        <span>Leads Atribuídos:</span>
                        <strong className="text-slate-900">{repCompanies.length}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Vendas Fechadas:</span>
                        <strong className="text-emerald-700">{formatCurrency(wonValue)}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Meta do Mês:</span>
                        <span className="text-slate-500">{formatCurrency(rep.metaMensal)}</span>
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="flex justify-between text-[11px] mb-1 font-semibold text-slate-600">
                        <span>Atingimento da Meta</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
