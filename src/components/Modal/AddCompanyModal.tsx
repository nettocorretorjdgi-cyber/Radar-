import React, { useState } from 'react';
import {
  X,
  Building2,
  Search,
  Loader2,
  Database,
  CloudUpload,
  UserCheck,
  DollarSign,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Tag,
  Sparkles,
} from 'lucide-react';
import { Company, PipelineStatus, SalesMember } from '../../types/company';
import { TEAM_MEMBERS } from '../../data/teamMembers';
import { consultarCNPJ } from '../../services/cnpjService';
import { cleanDigits, formatCNPJ } from '../../utils/cnpjUtils';
import { getSupabaseClient, syncCompaniesToSupabase, loadSupabaseConfig } from '../../services/supabaseService';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: SalesMember;
  onCompanyAdded: (company: Company) => void;
  onToast: (msg: string) => void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onCompanyAdded,
  onToast,
}) => {
  if (!isOpen) return null;

  const [cnpjInput, setCnpjInput] = useState('');
  const [isSearchingCnpj, setIsSearchingCnpj] = useState(false);
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [cnaeCodigo, setCnaeCodigo] = useState('');
  const [cnaeDescricao, setCnaeDescricao] = useState('');
  const [telefone, setTelefone] = useState('');
  const [email, setEmail] = useState('');
  const [municipio, setMunicipio] = useState('São Paulo');
  const [uf, setUf] = useState('SP');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [bairro, setBairro] = useState('');
  const [cep, setCep] = useState('');
  const [status, setStatus] = useState<PipelineStatus>('prospeccao');
  const [responsavelId, setResponsavelId] = useState<string>(currentUser.id);
  const [valorEstimado, setValorEstimado] = useState<number>(0);
  const [notas, setNotas] = useState('');
  const [tagsInput, setTagsInput] = useState('Novo Lead');
  
  // Direct Supabase Push Toggle
  const supabaseConfig = loadSupabaseConfig();
  const isSupabaseConfigured = Boolean(supabaseConfig.supabaseUrl && supabaseConfig.supabaseAnonKey);
  const [syncToSupabase, setSyncToSupabase] = useState<boolean>(isSupabaseConfigured);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Live lookup from Receita Federal
  const handleLookupCnpj = async () => {
    if (!cnpjInput.trim()) {
      setErrorMsg('Informe um CNPJ para buscar.');
      return;
    }

    setIsSearchingCnpj(true);
    setErrorMsg('');

    try {
      const company = await consultarCNPJ(cnpjInput.trim());
      setRazaoSocial(company.razaoSocial);
      setNomeFantasia(company.nomeFantasia || company.razaoSocial);
      setCnaeCodigo(company.cnaePrincipal?.codigo || '');
      setCnaeDescricao(company.cnaePrincipal?.descricao || '');
      setTelefone(company.contato?.telefone || company.contato?.telefone2 || '');
      setEmail(company.contato?.email || '');
      setLogradouro(company.endereco?.logradouro || '');
      setNumero(company.endereco?.numero || '');
      setBairro(company.endereco?.bairro || '');
      setMunicipio(company.endereco?.municipio || 'São Paulo');
      setUf(company.endereco?.uf || 'SP');
      setCep(company.endereco?.cep || '');
      setCnpjInput(company.cnpj);
    } catch (err: any) {
      setErrorMsg(err.message || 'Erro ao consultar CNPJ na Receita Federal.');
    } finally {
      setIsSearchingCnpj(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!razaoSocial.trim()) {
      setErrorMsg('Por favor, informe ao menos a Razão Social ou busque pelo CNPJ.');
      return;
    }

    setIsSubmitting(true);

    const clean = cleanDigits(cnpjInput) || String(Date.now());
    const formatted = formatCNPJ(clean);
    const assignedRep = TEAM_MEMBERS.find((m) => m.id === responsavelId);

    const newCompany: Company = {
      id: clean,
      cnpj: formatted,
      cnpjRaw: clean,
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
      cnaePrincipal: {
        codigo: cnaeCodigo.trim() || '0000-0/00',
        descricao: cnaeDescricao.trim() || 'Atividade Comercial',
      },
      cnaesSecundarios: [],
      situacaoCadastral: 'ATIVA',
      dataAbertura: new Date().toISOString().split('T')[0],
      capitalSocial: 0,
      endereco: {
        logradouro: logradouro.trim(),
        numero: numero.trim(),
        bairro: bairro.trim(),
        municipio: municipio.trim(),
        uf: uf.trim().toUpperCase(),
        cep: cep.trim(),
      },
      contato: {
        telefone: telefone.trim() || undefined,
        email: email.trim() || undefined,
      },
      qsa: [],
      coordenadas: {
        lat: -23.5614 + (Math.random() - 0.5) * 0.05,
        lng: -46.6560 + (Math.random() - 0.5) * 0.05,
      },
      status,
      responsavelId,
      responsavelNome: assignedRep?.nome || '',
      valorEstimado: Number(valorEstimado) || 0,
      notas: notas.trim(),
      tags: tagsInput
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      isInDatabase: true,
      savedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Add locally to Funnel & Database
    onCompanyAdded(newCompany);

    // 2. If user chose to sync to Supabase, push it immediately!
    let supabaseSuccess = false;
    if (syncToSupabase && isSupabaseConfigured) {
      try {
        const res = await syncCompaniesToSupabase([newCompany]);
        if (res.success) {
          supabaseSuccess = true;
        } else {
          console.warn('Supabase sync warning:', res.error);
        }
      } catch (err) {
        console.error('Failed to sync to Supabase:', err);
      }
    }

    setIsSubmitting(false);

    if (supabaseSuccess) {
      onToast(`✓ Empresa adicionada ao funil e gravada no Supabase com sucesso!`);
    } else {
      onToast(`✓ Empresa adicionada ao funil de vendas!`);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base text-white">Adicionar Empresa no Funil</h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  {isSupabaseConfigured ? 'Integrado com Supabase' : 'Funil Local'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Cadastre um novo lead e sincronize diretamente no seu banco de dados Supabase
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
        <form onSubmit={handleSubmit} className="p-5 md:p-6 space-y-4 overflow-y-auto text-xs flex-1">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Quick Auto-Fill with CNPJ */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4">
            <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Preenchimento Automático por CNPJ (Receita Federal)
              </span>
              <span className="text-[10px] text-blue-600 font-normal">Opcional</span>
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={cnpjInput}
                onChange={(e) => setCnpjInput(e.target.value)}
                placeholder="Digite o CNPJ (ex: 12.345.678/0001-90)..."
                className="flex-1 text-xs py-2 px-3 rounded-xl border border-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white font-mono text-slate-800"
              />
              <button
                type="button"
                disabled={isSearchingCnpj}
                onClick={handleLookupCnpj}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isSearchingCnpj ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Buscando...
                  </>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" /> Buscar na Receita
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Dados Principais */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Razão Social *
              </label>
              <input
                type="text"
                required
                value={razaoSocial}
                onChange={(e) => setRazaoSocial(e.target.value)}
                placeholder="Ex: Metropolis Empreendimentos LTDA"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800 font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Nome Fantasia
              </label>
              <input
                type="text"
                value={nomeFantasia}
                onChange={(e) => setNomeFantasia(e.target.value)}
                placeholder="Ex: Metropolis Imóveis"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-800"
              />
            </div>
          </div>

          {/* CNAE e Contato */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                CNAE Código
              </label>
              <input
                type="text"
                value={cnaeCodigo}
                onChange={(e) => setCnaeCodigo(e.target.value)}
                placeholder="Ex: 6821-8/01"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-800"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Descrição da Atividade (CNAE)
              </label>
              <input
                type="text"
                value={cnaeDescricao}
                onChange={(e) => setCnaeDescricao(e.target.value)}
                placeholder="Ex: Corretagem na compra e venda e avaliação de imóveis"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-blue-600" /> Telefone / WhatsApp
              </label>
              <input
                type="text"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
                placeholder="Ex: (11) 98765-4321"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-blue-600" /> E-mail de Contato
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: contato@empresa.com.br"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          {/* Localização */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-blue-600" /> Endereço (Logradouro e Número)
              </label>
              <input
                type="text"
                value={logradouro}
                onChange={(e) => setLogradouro(e.target.value)}
                placeholder="Ex: Av. Paulista, 1000"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Bairro
              </label>
              <input
                type="text"
                value={bairro}
                onChange={(e) => setBairro(e.target.value)}
                placeholder="Ex: Bela Vista"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                Município
              </label>
              <input
                type="text"
                value={municipio}
                onChange={(e) => setMunicipio(e.target.value)}
                placeholder="Ex: São Paulo"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                UF (Estado)
              </label>
              <input
                type="text"
                maxLength={2}
                value={uf}
                onChange={(e) => setUf(e.target.value.toUpperCase())}
                placeholder="SP"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 font-mono text-slate-800 uppercase"
              />
            </div>
          </div>

          {/* Configurações no Funil */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Posicionamento no Funil de Vendas
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Etapa Inicial
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as PipelineStatus)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-semibold text-blue-900"
                >
                  <option value="prospeccao">1. Novos Leads</option>
                  <option value="contatado">2. Em Contato</option>
                  <option value="reuniao">3. Reunião / Visita</option>
                  <option value="proposta">4. Proposta Enviada</option>
                  <option value="fechamento">5. Negociação Final</option>
                  <option value="cliente">6. Ganho / Fechado 🎉</option>
                  <option value="descartado">Perdido / Descarte</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Corretor Responsável
                </label>
                <select
                  value={responsavelId}
                  onChange={(e) => setResponsavelId(e.target.value)}
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold"
                >
                  {TEAM_MEMBERS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nome} ({m.cargo.split('/')[0].trim()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Valor Estimado (R$)
                </label>
                <input
                  type="number"
                  value={valorEstimado || ''}
                  onChange={(e) => setValorEstimado(Number(e.target.value))}
                  placeholder="Ex: 45000"
                  className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white font-mono text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="Ex: Novo Lead, Decisor: Roberto, Alto Padrão"
                className="w-full text-xs py-2 px-3 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">
                Notas Iniciais
              </label>
              <textarea
                rows={2}
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Observações da oportunidade, detalhes do tomador de decisão..."
                className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Direct Supabase Sync Toggle */}
          <div className="p-3.5 rounded-2xl border border-emerald-300 bg-emerald-50/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-700 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-slate-900 leading-tight">
                  Gravar automaticamente na tabela 'funil' do Supabase
                </p>
                <p className="text-[11px] text-slate-500">
                  {isSupabaseConfigured
                    ? 'O lead será adicionado ao funil e sincronizado na nuvem instantaneamente.'
                    : 'Configure as chaves do Supabase no botão do topo para envio automático.'}
                </p>
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={syncToSupabase}
                onChange={(e) => setSyncToSupabase(e.target.checked)}
                disabled={!isSupabaseConfigured}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
            </label>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Salvando...
                </>
              ) : (
                <>
                  <CloudUpload className="w-4 h-4" />
                  Salvar Empresa no Funil & Supabase
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
