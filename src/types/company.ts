export interface Socio {
  nome: string;
  qual: string;
  pais?: string;
  faixaEtaria?: string;
}

export interface CnaeItem {
  codigo: string;
  descricao: string;
}

export type SituacaoCadastral = 'ATIVA' | 'BAIXADA' | 'SUSPENSA' | 'INAPTA' | 'NULA';

export type PipelineStatus =
  | 'prospeccao'
  | 'contatado'
  | 'reuniao'
  | 'proposta'
  | 'fechamento'
  | 'cliente'
  | 'descartado';

export type UserRole = 'gerente' | 'vendas';

export interface SalesMember {
  id: string;
  nome: string;
  email: string;
  username: string;
  senha: string;
  cargo: string;
  role: UserRole;
  avatarColor: string;
  metaMensal: number;
}

export interface InteracaoLead {
  id: string;
  data: string;
  autorNome: string;
  tipo: 'whatsapp' | 'ligacao' | 'reuniao' | 'email' | 'nota';
  descricao: string;
}

export interface Company {
  id: string; // usually cleaned CNPJ
  cnpj: string; // Formatted 00.000.000/0000-00
  cnpjRaw: string; // Digits only
  razaoSocial: string;
  nomeFantasia: string;
  cnaePrincipal: CnaeItem;
  cnaesSecundarios: CnaeItem[];
  situacaoCadastral: SituacaoCadastral;
  dataSituacaoCadastral?: string;
  dataAbertura: string;
  capitalSocial: number;
  naturezaJuridica?: string;
  porte?: string;
  simplesNacional?: boolean;
  mei?: boolean;
  
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    municipio: string;
    uf: string;
    cep: string;
  };
  
  contato: {
    telefone?: string;
    telefone2?: string;
    email?: string;
  };

  qsa: Socio[];

  coordenadas: {
    lat: number;
    lng: number;
  };

  // Dynamic calculated distance from current search center
  distanciaKm?: number;

  // Custom user database & Funnel fields
  isInDatabase?: boolean;
  savedAt?: string;
  updatedAt?: string;
  status?: PipelineStatus;
  tags?: string[];
  notas?: string;
  avaliacao?: number; // 1-5
  valorEstimado?: number;

  // Sales team assignment & interaction tracking
  responsavelId?: string;
  responsavelNome?: string;
  dataUltimoContato?: string;
  dataProximoContato?: string;
  motivoPerda?: string;
  historicoInteracoes?: InteracaoLead[];
}

export interface SearchFilters {
  termo?: string;
  cnpj?: string;
  cnaeCodigo?: string;
  uf?: string;
  municipio?: string;
  situacaoCadastral?: SituacaoCadastral | 'TODAS';
  raioKm: number;
  centro: {
    lat: number;
    lng: number;
    enderecoTexto?: string;
  };
}

export interface MapTileProvider {
  id: 'osm' | 'carto' | 'satellite' | 'google';
  name: string;
  url: string;
  attribution: string;
  subdomains?: string[];
}
