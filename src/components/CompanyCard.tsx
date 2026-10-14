import React from 'react';
import {
  Building2,
  MapPin,
  Bookmark,
  BookmarkCheck,
  Phone,
  MessageCircle,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';
import { Company } from '../types/company';
import { formatCurrency, formatPhone, getWhatsAppUrl } from '../utils/cnpjUtils';

interface CompanyCardProps {
  company: Company;
  isSelected: boolean;
  onSelect: (company: Company) => void;
  onToggleDatabase: (company: Company) => void;
}

export const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  isSelected,
  onSelect,
  onToggleDatabase,
}) => {
  const isAtiva = company.situacaoCadastral === 'ATIVA';
  const whatsappUrl = getWhatsAppUrl(company.contato?.telefone || company.contato?.telefone2);

  return (
    <div
      onClick={() => onSelect(company)}
      className={`p-3.5 rounded-2xl border transition-all cursor-pointer relative group text-xs ${
        isSelected
          ? 'bg-blue-50/70 border-blue-500 shadow-md ring-1 ring-blue-500/20'
          : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Top badges */}
      <div className="flex items-center justify-between gap-1 mb-1.5">
        <div className="flex items-center gap-1.5">
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
              isAtiva ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
            }`}
          >
            {company.situacaoCadastral}
          </span>
          {company.isInDatabase && (
            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5">
              ★ Salva
            </span>
          )}
        </div>

        {company.distanciaKm !== undefined && (
          <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
            {company.distanciaKm} km
          </span>
        )}
      </div>

      {/* Name and CNPJ */}
      <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 leading-snug line-clamp-1 mb-0.5">
        {company.nomeFantasia || company.razaoSocial}
      </h3>
      <p className="text-[11px] text-slate-400 font-mono mb-2">
        CNPJ: {company.cnpj}
      </p>

      {/* CNAE */}
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 mb-2.5">
        <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold mb-0.5">
          <Building2 className="w-3 h-3 text-blue-600" />
          <span>CNAE Principal</span>
        </div>
        <p className="font-semibold text-slate-800 text-[11px] line-clamp-1">
          <span className="font-mono text-blue-700 mr-1">{company.cnaePrincipal?.codigo}</span>
          {company.cnaePrincipal?.descricao}
        </p>
      </div>

      {/* Address */}
      <div className="flex items-start gap-1.5 text-slate-500 text-[11px] mb-3">
        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <span className="line-clamp-1">
          {company.endereco?.logradouro}, {company.endereco?.numero} - {company.endereco?.bairro},{' '}
          {company.endereco?.municipio}/{company.endereco?.uf}
        </span>
      </div>

      {/* Action Buttons */}
      <div
        className="flex items-center justify-between pt-2 border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => onToggleDatabase(company)}
          className={`py-1 px-2.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all ${
            company.isInDatabase
              ? 'bg-amber-100 text-amber-900 hover:bg-amber-200'
              : 'bg-slate-900 hover:bg-slate-800 text-white'
          }`}
        >
          {company.isInDatabase ? (
            <>
              <BookmarkCheck className="w-3 h-3 text-amber-700" />
              No Banco
            </>
          ) : (
            <>
              <Bookmark className="w-3 h-3" />
              Salvar
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
              title="Abrir conversa no WhatsApp"
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
          <button
            onClick={() => onSelect(company)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Ver detalhes"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
