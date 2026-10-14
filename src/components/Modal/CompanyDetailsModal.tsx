import React, { useState } from 'react';
import {
  X,
  Building2,
  MapPin,
  Phone,
  Mail,
  Users,
  DollarSign,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  Star,
  Tag,
  Bookmark,
  BookmarkCheck,
  FileSpreadsheet,
  MessageCircle,
  UserCheck,
  Clock,
  Plus,
  Send,
} from 'lucide-react';
import { Company, PipelineStatus, InteracaoLead } from '../../types/company';
import { formatCurrency, formatPhone, getWhatsAppUrl } from '../../utils/cnpjUtils';
import { TEAM_MEMBERS } from '../../data/teamMembers';

interface CompanyDetailsModalProps {
  company: Company | null;
  onClose: () => void;
  onSaveToDatabase: (updatedCompany: Company) => void;
  onRemoveFromDatabase: (companyId: string) => void;
}

export const CompanyDetailsModal: React.FC<CompanyDetailsModalProps> = ({
  company,
  onClose,
  onSaveToDatabase,
  onRemoveFromDatabase,
}) => {
  if (!company) return null;

  const [activeTab, setActiveTab] = useState<'cadastral' | 'crm' | 'interacoes'>('crm');
  const [copiedCnpj, setCopiedCnpj] = useState(false);
  const [status, setStatus] = useState<PipelineStatus>(company.status || 'prospeccao');
  const [tags, setTags] = useState<string[]>(company.tags || []);
  const [newTagInput, setNewTagInput] = useState('');
  const [notas, setNotas] = useState(company.notas || '');
  const [avaliacao, setAvaliacao] = useState(company.avaliacao || 0);
  const [valorEstimado, setValorEstimado] = useState(company.valorEstimado || 0);
  const [responsavelId, setResponsavelId] = useState(company.responsavelId || 'vendas-1');
  const [dataProximoContato, setDataProximoContato] = useState(company.dataProximoContato || '');
  const [interacoes, setInteracoes] = useState<InteracaoLead[]>(company.historicoInteracoes || []);
  
  // New interaction input
  const [tipoInteracao, setTipoInteracao] = useState<'whatsapp' | 'ligacao' | 'reuniao' | 'email' | 'nota'>('whatsapp');
  const [descInteracao, setDescInteracao] = useState('');
  const [isSavedFeedback, setIsSavedFeedback] = useState(false);

  const handleCopyCNPJ = () => {
    navigator.clipboard.writeText(company.cnpj);
    setCopiedCnpj(true);
    setTimeout(() => setCopiedCnpj(false), 2000);
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(newTagInput.trim())) {
        setTags([...tags, newTagInput.trim()]);
      }
      setNewTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleAddInteracao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descInteracao.trim()) return;

    const resp = TEAM_MEMBERS.find((m) => m.id === responsavelId);
    const nova: InteracaoLead = {
      id: String(Date.now()),
      data: new Date().toISOString(),
      autorNome: resp?.nome || 'Consultor',
      tipo: tipoInteracao,
      descricao: descInteracao.trim(),
    };

    const atualizadas = [nova, ...interacoes];
    setInteracoes(atualizadas);
    setDescInteracao('');

    // Auto save with new interaction
    const updated: Company = {
      ...company,
      isInDatabase: true,
      savedAt: company.savedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: status === 'prospeccao' ? 'contatado' : status,
      tags,
      notas,
      avaliacao,
      valorEstimado,
      responsavelId,
      responsavelNome: resp?.nome || '',
      dataProximoContato,
      dataUltimoContato: new Date().toISOString(),
      historicoInteracoes: atualizadas,
    };
    onSaveToDatabase(updated);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const handleSaveDatabaseChanges = () => {
    const resp = TEAM_MEMBERS.find((m) => m.id === responsavelId);
    const updated: Company = {
      ...company,
      isInDatabase: true,
      savedAt: company.savedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status,
      tags,
      notas,
      avaliacao,
      valorEstimado,
      responsavelId,
      responsavelNome: resp?.nome || '',
      dataProximoContato,
      historicoInteracoes: interacoes,
    };
    onSaveToDatabase(updated);
    setIsSavedFeedback(true);
    setTimeout(() => setIsSavedFeedback(false), 2000);
  };

  const isAtiva = company.situacaoCadastral === 'ATIVA';
  const whatsappUrl = getWhatsAppUrl(
    company.contato.telefone || company.contato.telefone2,
    `Olá, falo com o responsável da empresa ${company.nomeFantasia || company.razaoSocial}?`
  );
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `${company.endereco.logradouro}, ${company.endereco.numero} - ${company.endereco.bairro}, ${company.endereco.municipio} - ${company.endereco.uf}`
  )}`;

  const pipelineOptions: { id: PipelineStatus; label: string; desc: string }[] = [
    { id: 'prospeccao', label: '1. Prospecção', desc: 'Lead novo identificado' },
    { id: 'contatado', label: '2. Em Contato', desc: 'Primeira abordagem iniciada' },
    { id: 'reuniao', label: '3. Reunião Agendada', desc: 'Demonstração ou visita' },
    { id: 'proposta', label: '4. Proposta Enviada', desc: 'Em análise comercial' },
    { id: 'fechamento', label: '5. Negociação', desc: 'Ajuste de contrato/preço' },
    { id: 'cliente', label: '6. Ganho / Cliente 🎉', desc: 'Venda concretizada' },
    { id: 'descartado', label: 'Perdido / Descarte', desc: 'Sem fit ou declinado' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 md:p-6 bg-slate-900 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                isAtiva
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {company.situacaoCadastral}
            </span>
            {company.distanciaKm !== undefined && (
              <span className="text-xs bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-medium">
                📍 {company.distanciaKm} km de distância
              </span>
            )}
            {company.isInDatabase && (
              <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded flex items-center gap-1 font-semibold">
                <BookmarkCheck className="w-3.5 h-3.5" /> No Funil de Vendas
              </span>
            )}
          </div>

          <h2 className="text-xl md:text-2xl font-bold leading-tight text-white mb-1">
            {company.nomeFantasia || company.razaoSocial}
          </h2>
          <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
            CNPJ: <span className="text-slate-200 font-semibold">{company.cnpj}</span>
            <button
              onClick={handleCopyCNPJ}
              className="text-slate-400 hover:text-white transition-colors"
              title="Copiar CNPJ"
            >
              {copiedCnpj ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {company.razaoSocial !== company.nomeFantasia && (
              <span className="text-slate-400 truncate max-w-xs">| {company.razaoSocial}</span>
            )}
          </p>

          {/* Quick contact / actions */}
          <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-slate-800">
            {whatsappUrl && (
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Chamar no WhatsApp
              </a>
            )}
            {company.contato.telefone && (
              <a
                href={`tel:${company.contato.telefone}`}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" /> Ligar ({formatPhone(company.contato.telefone)})
              </a>
            )}
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Rota no Maps
            </a>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 md:px-6">
          <button
            onClick={() => setActiveTab('crm')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'crm'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            🎯 Funil & Negociação
            {company.isInDatabase && <span className="w-2 h-2 rounded-full bg-blue-600" />}
          </button>
          <button
            onClick={() => setActiveTab('interacoes')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'interacoes'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            💬 Atendimento & Histórico ({interacoes.length})
          </button>
          <button
            onClick={() => setActiveTab('cadastral')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors ${
              activeTab === 'cadastral'
                ? 'border-blue-600 text-blue-600 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Ficha CNPJ & Sócios
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-4 md:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'crm' ? (
            /* CRM & Funnel Management */
            <div className="space-y-4">
              {/* Etapa do Funil */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Etapa no Funil de Vendas
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {pipelineOptions.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setStatus(opt.id)}
                      className={`p-2.5 rounded-xl text-left border transition-all ${
                        status === opt.id
                          ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-500/20 text-blue-900'
                          : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <p className="font-bold text-xs">{opt.label}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-tight">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Responsável & Próximo Contato */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    Responsável / Vendedor
                  </label>
                  <select
                    value={responsavelId}
                    onChange={(e) => setResponsavelId(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold"
                  >
                    {TEAM_MEMBERS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nome} ({m.cargo})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Data Próximo Contato / Retorno
                  </label>
                  <input
                    type="date"
                    value={dataProximoContato}
                    onChange={(e) => setDataProximoContato(e.target.value)}
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
                  />
                </div>
              </div>

              {/* Valor Estimado & Avaliação */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Valor Estimado do Negócio (R$)
                  </label>
                  <input
                    type="number"
                    value={valorEstimado || ''}
                    onChange={(e) => setValorEstimado(Number(e.target.value))}
                    placeholder="Ex: 50000"
                    className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                    Temperatura / Avaliação
                  </label>
                  <div className="flex items-center gap-1 py-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setAvaliacao(star === avaliacao ? 0 : star)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= avaliacao ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Tags e Marcadores (Pressione Enter para adicionar)
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="bg-slate-100 text-slate-700 border border-slate-200 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1"
                    >
                      <Tag className="w-3 h-3 text-slate-400" />
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="text-slate-400 hover:text-rose-600 ml-0.5"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  value={newTagInput}
                  onChange={(e) => setNewTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Ex: Decisor: Carlos, Alto Padrão, Contrato Anual..."
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Notas Internas e Estratégia de Venda
                </label>
                <textarea
                  rows={3}
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Anote detalhes de objeções, tomador de decisão, concorrentes..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
                />
              </div>

              {/* Bottom save bar */}
              <div className="pt-2 flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  {isSavedFeedback && <span className="text-emerald-600 font-bold">✓ Atualizado no funil!</span>}
                </span>
                <button
                  type="button"
                  onClick={handleSaveDatabaseChanges}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-colors"
                >
                  <Bookmark className="w-4 h-4" />
                  Salvar Dados do Lead
                </button>
              </div>
            </div>
          ) : activeTab === 'interacoes' ? (
            /* Interactions & Meeting Log Tab */
            <div className="space-y-4">
              {/* Form to log new interaction */}
              <form onSubmit={handleAddInteracao} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5 text-blue-600" />
                  Registrar Novo Contato / Interação
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                  {[
                    { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                    { id: 'ligacao', label: 'Ligação', icon: '📞' },
                    { id: 'reuniao', label: 'Reunião', icon: '🤝' },
                    { id: 'email', label: 'E-mail', icon: '✉️' },
                    { id: 'nota', label: 'Nota Interna', icon: '📝' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTipoInteracao(item.id as any)}
                      className={`p-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1 border transition-all ${
                        tipoInteracao === item.id
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>

                <textarea
                  rows={2}
                  value={descInteracao}
                  onChange={(e) => setDescInteracao(e.target.value)}
                  placeholder="Ex: Conversei com o diretor financeiro. Proposta de R$ 45.000 enviada por WhatsApp..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
                />

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!descInteracao.trim()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Registrar Atendimento
                  </button>
                </div>
              </form>

              {/* Interactions Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" /> Histórico de Atendimentos
                </h4>

                {interacoes.length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    Nenhuma interação registrada ainda. Registre a primeira abordagem acima!
                  </p>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {interacoes.map((item) => (
                      <div key={item.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-bold text-slate-800 flex items-center gap-1">
                            {item.tipo === 'whatsapp' && '💬 WhatsApp'}
                            {item.tipo === 'ligacao' && '📞 Ligação'}
                            {item.tipo === 'reuniao' && '🤝 Reunião'}
                            {item.tipo === 'email' && '✉️ E-mail'}
                            {item.tipo === 'nota' && '📝 Nota'}
                            <span className="text-slate-400 font-normal">&middot; por {item.autorNome}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {new Date(item.data).toLocaleDateString('pt-BR')} às{' '}
                            {new Date(item.data).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{item.descricao}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Standard Cadastral Tab */
            <div className="space-y-4">
              {/* CNAE Principal */}
              <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3.5">
                <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block mb-1">
                  Atividade Econômica Principal (CNAE)
                </span>
                <p className="font-mono text-xs font-bold text-slate-800">{company.cnaePrincipal.codigo}</p>
                <p className="text-sm font-semibold text-slate-900 mt-0.5">{company.cnaePrincipal.descricao}</p>
              </div>

              {/* Endereço & Dados Financeiros */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-600" /> Endereço Completo
                  </span>
                  <p className="text-xs font-semibold text-slate-800">
                    {company.endereco.logradouro}, {company.endereco.numero}
                  </p>
                  <p className="text-xs text-slate-600">
                    Bairro: {company.endereco.bairro || 'Não informado'}
                  </p>
                  <p className="text-xs text-slate-600">
                    {company.endereco.municipio} - {company.endereco.uf} | CEP: {company.endereco.cep}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-xl">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-emerald-600" /> Capital & Porte
                  </span>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Capital Social:</strong> {formatCurrency(company.capitalSocial)}
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Porte:</strong> {company.porte || 'Não informado'}
                  </p>
                  <p className="text-xs text-slate-700">
                    <strong className="text-slate-900">Abertura:</strong> {company.dataAbertura || 'Não informado'}
                  </p>
                </div>
              </div>

              {/* Sócios (QSA) */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-600" />
                  Sócios e Administradores ({company.qsa?.length || 0})
                </h4>
                {company.qsa && company.qsa.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {company.qsa.map((s, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl text-xs">
                        <p className="font-semibold text-slate-900">{s.nome}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5">{s.qual}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Quadro societário não disponível.</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
