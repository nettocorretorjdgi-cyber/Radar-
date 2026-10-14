import { CnaeItem } from '../types/company';

export interface CnaeCategory {
  nome: string;
  icone: string;
  itens: CnaeItem[];
}

export const CNAE_POPULARES: CnaeCategory[] = [
  {
    nome: 'Atividades Imobiliárias & Construção',
    icone: 'Building2',
    itens: [
      { codigo: '6821-8/01', descricao: 'Corretagem na compra e venda e avaliação de imóveis' },
      { codigo: '6821-8/02', descricao: 'Corretagem no aluguel de imóveis' },
      { codigo: '6810-2/01', descricao: 'Compra e venda de imóveis próprios' },
      { codigo: '6810-2/02', descricao: 'Aluguel de imóveis próprios' },
      { codigo: '6810-2/03', descricao: 'Loteamento de imóveis próprios' },
      { codigo: '4120-4/00', descricao: 'Construção de edifícios' },
      { codigo: '4110-7/00', descricao: 'Incorporação de empreendimentos imobiliários' },
      { codigo: '4399-1/01', descricao: 'Administração de obras' },
      { codigo: '7112-0/00', descricao: 'Serviços de engenharia' },
      { codigo: '7111-1/00', descricao: 'Serviços de arquitetura' },
    ]
  },
  {
    nome: 'Comércio Varejista & Atacadista',
    icone: 'ShoppingBag',
    itens: [
      { codigo: '4711-3/01', descricao: 'Comércio varejista de mercadorias em geral (hipermercados)' },
      { codigo: '4711-3/02', descricao: 'Comércio varejista de mercadorias em geral (supermercados)' },
      { codigo: '4712-1/00', descricao: 'Comércio varejista de mercadorias em geral (minimercados, mercearias)' },
      { codigo: '4781-0/00', descricao: 'Comércio varejista de artigos do vestuário e acessórios' },
      { codigo: '4771-7/01', descricao: 'Comércio varejista de produtos farmacêuticos (farmácias)' },
      { codigo: '4744-0/99', descricao: 'Comércio varejista de materiais de construção em geral' },
      { codigo: '4751-2/01', descricao: 'Comércio varejista especializado de equipamentos e suprimentos de informática' },
      { codigo: '4619-2/00', descricao: 'Representantes comerciais e agentes do comércio' },
      { codigo: '4693-1/00', descricao: 'Comércio atacadista de mercadorias em geral' },
    ]
  },
  {
    nome: 'Tecnologia da Informação & Comunicação',
    icone: 'Laptop',
    itens: [
      { codigo: '6201-5/01', descricao: 'Desenvolvimento de programas de computador sob encomenda' },
      { codigo: '6202-3/00', descricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis' },
      { codigo: '6203-1/00', descricao: 'Desenvolvimento e licenciamento de programas de computador não-customizáveis' },
      { codigo: '6204-0/00', descricao: 'Consultoria em tecnologia da informação' },
      { codigo: '6209-1/00', descricao: 'Suporte técnico, manutenção e outros serviços em tecnologia da informação' },
      { codigo: '6311-9/00', descricao: 'Tratamento de dados, provedores de serviços de aplicação e hospedagem na internet' },
      { codigo: '6319-4/00', descricao: 'Portais, provedores de conteúdo e outros serviços de informação na internet' },
    ]
  },
  {
    nome: 'Serviços Profissionais, Jurídicos & Financeiros',
    icone: 'Briefcase',
    itens: [
      { codigo: '6911-7/01', descricao: 'Serviços advocatícios' },
      { codigo: '6920-6/01', descricao: 'Atividades de contabilidade' },
      { codigo: '6920-6/02', descricao: 'Atividades de consultoria e auditoria contábil e tributária' },
      { codigo: '7020-4/00', descricao: 'Atividades de consultoria em gestão empresarial' },
      { codigo: '7311-4/00', descricao: 'Agências de publicidade e marketing' },
      { codigo: '7319-0/02', descricao: 'Promoção de vendas' },
      { codigo: '6619-3/02', descricao: 'Correspondentes de instituições financeiras' },
      { codigo: '6499-9/99', descricao: 'Outras atividades de serviços financeiros não especificadas anteriormente' },
    ]
  },
  {
    nome: 'Saúde, Clínicas & Bem-Estar',
    icone: 'HeartPulse',
    itens: [
      { codigo: '8610-1/01', descricao: 'Atividades de atendimento hospitalar' },
      { codigo: '8630-5/03', descricao: 'Atividade médica ambulatorial restrita a consultas' },
      { codigo: '8630-5/04', descricao: 'Atividade odontológica' },
      { codigo: '8650-0/02', descricao: 'Atividades de profissionais da nutrição' },
      { codigo: '8650-0/03', descricao: 'Atividades de psicologia e psicanálise' },
      { codigo: '8650-0/04', descricao: 'Atividades de fisioterapia' },
      { codigo: '8640-2/02', descricao: 'Laboratórios de análises clínicas' },
      { codigo: '9602-5/01', descricao: 'Cabeleireiros, manicure e pedicure' },
      { codigo: '9602-5/02', descricao: 'Atividades de estética e outros serviços de cuidados com a beleza' },
    ]
  },
  {
    nome: 'Alimentação & Hotelaria',
    icone: 'Utensils',
    itens: [
      { codigo: '5611-2/01', descricao: 'Restaurantes e similares' },
      { codigo: '5611-2/03', descricao: 'Lanchonetes, casas de chá, de sucos e similares' },
      { codigo: '5611-2/04', descricao: 'Bares e outros estabelecimentos especializados em servir bebidas' },
      { codigo: '5620-1/01', descricao: 'Fornecimento de alimentos preparados preponderantemente para empresas' },
      { codigo: '5620-1/04', descricao: 'Serviços de ambulantes de alimentação' },
      { codigo: '5510-8/01', descricao: 'Hotéis' },
      { codigo: '5510-8/02', descricao: 'Apart-hotéis e pousadas' },
    ]
  },
  {
    nome: 'Transporte, Logística & Automotivo',
    icone: 'Truck',
    itens: [
      { codigo: '4930-2/02', descricao: 'Transporte rodoviário de carga, exceto produtos perigosos e mudanças, intermunicipal e interestadual' },
      { codigo: '4930-2/01', descricao: 'Transporte rodoviário de carga municipal' },
      { codigo: '5211-7/99', descricao: 'Depósitos de mercadorias para terceiros, exceto armazéns gerais' },
      { codigo: '4520-0/01', descricao: 'Serviços de manutenção e reparação mecânica de veículos automotores' },
      { codigo: '4530-7/03', descricao: 'Comércio a varejo de peças e acessórios novos para veículos automotores' },
      { codigo: '4511-1/01', descricao: 'Comércio a varejo de automóveis, camionetas e utilitários novos' },
      { codigo: '4511-1/02', descricao: 'Comércio a varejo de automóveis, camionetas e utilitários usados' },
    ]
  },
  {
    nome: 'Indústria & Manufatura',
    icone: 'Factory',
    itens: [
      { codigo: '2511-0/00', descricao: 'Fabricação de estruturas metálicas' },
      { codigo: '2599-3/99', descricao: 'Fabricação de outros produtos de metal não especificados anteriormente' },
      { codigo: '2229-3/99', descricao: 'Fabricação de artefatos de material plástico para outros usos' },
      { codigo: '1091-1/02', descricao: 'Fabricação de produtos de padaria e confeitaria com predominância de produção própria' },
      { codigo: '3101-2/00', descricao: 'Fabricação de móveis com predominância de madeira' },
      { codigo: '2829-1/99', descricao: 'Fabricação de outras máquinas e equipamentos de uso geral' },
    ]
  },
  {
    nome: 'Educação & Treinamento',
    icone: 'GraduationCap',
    itens: [
      { codigo: '8512-1/00', descricao: 'Educação infantil - pré-escola' },
      { codigo: '8513-9/00', descricao: 'Ensino fundamental' },
      { codigo: '8520-1/00', descricao: 'Ensino médio' },
      { codigo: '8532-5/00', descricao: 'Educação superior - graduação e pós-graduação' },
      { codigo: '8599-6/03', descricao: 'Treinamento em informática' },
      { codigo: '8599-6/04', descricao: 'Treinamento em desenvolvimento profissional e gerencial' },
      { codigo: '8593-7/00', descricao: 'Ensino de idiomas' },
    ]
  }
];

export const TODOS_CNAES: CnaeItem[] = CNAE_POPULARES.flatMap(cat => cat.itens);

/**
 * Searches CNAE items by partial code or keyword description
 */
export function buscarCNAEs(termo: string): CnaeItem[] {
  if (!termo || termo.trim().length === 0) return TODOS_CNAES.slice(0, 15);
  const cleanTerm = termo.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const digitsTerm = termo.replace(/\D/g, '');

  return TODOS_CNAES.filter(item => {
    const itemNorm = item.descricao.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const codeDigits = item.codigo.replace(/\D/g, '');

    const matchText = itemNorm.includes(cleanTerm);
    const matchCode = digitsTerm.length > 0 && codeDigits.includes(digitsTerm);
    return matchText || matchCode;
  });
}
