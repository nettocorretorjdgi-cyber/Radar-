import { Company, PipelineStatus } from '../types/company';
import { SEED_COMPANIES } from '../data/seedCompanies';

const STORAGE_KEY = 'radar_cnpj_database_v1';
const SETTINGS_KEY = 'radar_cnpj_settings_v1';

export interface AppSettings {
  googleMapsApiKey?: string;
  defaultRadiusKm: number;
  tileProvider: 'osm' | 'carto' | 'satellite' | 'google';
  defaultCity: string;
  defaultCoords: { lat: number; lng: number };
}

export const DEFAULT_SETTINGS: AppSettings = {
  defaultRadiusKm: 15,
  tileProvider: 'osm',
  defaultCity: 'São Paulo - SP (Av. Paulista)',
  defaultCoords: { lat: -23.5614, lng: -46.6560 },
};

export function loadStoredCompanies(): Company[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    let list: Company[] = [];
    if (!raw) {
      // Seed with initial sample companies in database
      list = SEED_COMPANIES.filter(c => c.isInDatabase);
    } else {
      list = JSON.parse(raw);
    }

    // Ensure all stored companies have responsavel assigned
    const reps = [
      { id: 'vendas-1', nome: 'Netto Corretor' },
      { id: 'vendas-2', nome: 'Mariana Costa' },
      { id: 'vendas-3', nome: 'Lucas Almeida' },
    ];

    list = list.map((c, i) => {
      if (!c.responsavelId) {
        const assigned = reps[i % reps.length];
        return {
          ...c,
          responsavelId: assigned.id,
          responsavelNome: assigned.nome,
        };
      }
      return c;
    });

    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    return list;
  } catch (err) {
    console.error('Failed to load companies from localStorage:', err);
    return SEED_COMPANIES.filter(c => c.isInDatabase);
  }
}

export function saveStoredCompanies(companies: Company[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(companies));
  } catch (err) {
    console.error('Failed to save companies to localStorage:', err);
  }
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings:', err);
  }
}

/**
 * Export companies database to CSV
 */
export function exportToCSV(companies: Company[], filename = 'empresas_radar_cnpj.csv'): void {
  const headers = [
    'CNPJ',
    'Razao Social',
    'Nome Fantasia',
    'Situacao',
    'CNAE Principal Codigo',
    'CNAE Principal Descricao',
    'Capital Social (R$)',
    'Telefone 1',
    'Telefone 2',
    'Email',
    'Logradouro',
    'Numero',
    'Complemento',
    'Bairro',
    'Municipio',
    'UF',
    'CEP',
    'Latitude',
    'Longitude',
    'Status Pipeline',
    'Tags',
    'Valor Estimado (R$)',
    'Avaliacao (Estrelas)',
    'Notas e Historico',
    'Data de Cadastro',
  ];

  const rows = companies.map(c => [
    `"${c.cnpj}"`,
    `"${(c.razaoSocial || '').replace(/"/g, '""')}"`,
    `"${(c.nomeFantasia || '').replace(/"/g, '""')}"`,
    `"${c.situacaoCadastral}"`,
    `"${c.cnaePrincipal?.codigo || ''}"`,
    `"${(c.cnaePrincipal?.descricao || '').replace(/"/g, '""')}"`,
    c.capitalSocial || 0,
    `"${c.contato?.telefone || ''}"`,
    `"${c.contato?.telefone2 || ''}"`,
    `"${c.contato?.email || ''}"`,
    `"${(c.endereco?.logradouro || '').replace(/"/g, '""')}"`,
    `"${c.endereco?.numero || ''}"`,
    `"${(c.endereco?.complemento || '').replace(/"/g, '""')}"`,
    `"${(c.endereco?.bairro || '').replace(/"/g, '""')}"`,
    `"${c.endereco?.municipio || ''}"`,
    `"${c.endereco?.uf || ''}"`,
    `"${c.endereco?.cep || ''}"`,
    c.coordenadas?.lat || 0,
    c.coordenadas?.lng || 0,
    `"${c.status || 'prospeccao'}"`,
    `"${(c.tags || []).join(';')}"`,
    c.valorEstimado || 0,
    c.avaliacao || 0,
    `"${(c.notas || '').replace(/"/g, '""')}"`,
    `"${c.savedAt || new Date().toISOString()}"`,
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export companies database to JSON
 */
export function exportToJSON(companies: Company[], filename = 'banco_empresas_radar_cnpj.json'): void {
  const jsonString = JSON.stringify(companies, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Parse CSV file to partial companies
 */
export function parseCSVToCompanies(csvText: string): Partial<Company>[] {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) return [];

  const result: Partial<Company>[] = [];
  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    // Split by commas taking into account quoted values
    const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
    const matches: string[] = [];
    let match;
    while ((match = regex.exec(line)) !== null && matches.length < 30) {
      let val = match[1] || '';
      if (val.startsWith('"') && val.endsWith('"')) {
        val = val.slice(1, -1).replace(/""/g, '"');
      }
      matches.push(val);
      if (regex.lastIndex >= line.length) break;
    }

    if (matches.length >= 2) {
      const cnpj = matches[0];
      const razaoSocial = matches[1];
      const nomeFantasia = matches[2] || razaoSocial;
      result.push({
        id: cnpj.replace(/\D/g, ''),
        cnpj,
        cnpjRaw: cnpj.replace(/\D/g, ''),
        razaoSocial,
        nomeFantasia,
        situacaoCadastral: (matches[3] as any) || 'ATIVA',
        cnaePrincipal: {
          codigo: matches[4] || '',
          descricao: matches[5] || 'Atividade comercial',
        },
        capitalSocial: Number(matches[6]) || 0,
        contato: {
          telefone: matches[7],
          email: matches[9],
        },
        endereco: {
          logradouro: matches[10] || '',
          numero: matches[11] || '',
          bairro: matches[13] || '',
          municipio: matches[14] || '',
          uf: matches[15] || '',
          cep: matches[16] || '',
        },
        coordenadas: {
          lat: Number(matches[17]) || -23.55,
          lng: Number(matches[18]) || -46.63,
        },
        status: (matches[19] as PipelineStatus) || 'prospeccao',
        tags: matches[20] ? matches[20].split(';') : [],
        valorEstimado: Number(matches[21]) || 0,
        avaliacao: Number(matches[22]) || 0,
        notas: matches[23] || '',
        isInDatabase: true,
        savedAt: matches[24] || new Date().toISOString(),
      });
    }
  }

  return result;
}
