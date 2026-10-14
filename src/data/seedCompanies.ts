import { Company } from '../types/company';

export const SEED_COMPANIES: Company[] = [
  // São Paulo - Av. Paulista & Região Central
  {
    id: '01234567000189',
    cnpj: '01.234.567/0001-89',
    cnpjRaw: '01234567000189',
    razaoSocial: 'VANGUARDA ASSESSORIA IMOBILIARIA E CORRETAGEM LTDA',
    nomeFantasia: 'VANGUARDA IMOVEIS SP',
    cnaePrincipal: {
      codigo: '6821-8/01',
      descricao: 'Corretagem na compra e venda e avaliação de imóveis'
    },
    cnaesSecundarios: [
      { codigo: '6821-8/02', descricao: 'Corretagem no aluguel de imóveis' },
      { codigo: '6810-2/02', descricao: 'Aluguel de imóveis próprios' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '15/03/2012',
    capitalSocial: 450000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS',
    simplesNacional: false,
    mei: false,
    endereco: {
      logradouro: 'Avenida Paulista',
      numero: '1471',
      complemento: 'Conj 112',
      bairro: 'Bela Vista',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01311-200'
    },
    contato: {
      telefone: '1132845500',
      telefone2: '11987654321',
      email: 'contato@vanguardaimoveis.com.br'
    },
    qsa: [
      { nome: 'ROBERTO CARLOS MENDONCA', qual: '49-Sócio-Administrador', faixaEtaria: '51 a 60 anos' },
      { nome: 'PATRICIA ALBUQUERQUE LIMA', qual: '22-Sócio', faixaEtaria: '41 a 50 anos' }
    ],
    coordenadas: {
      lat: -23.5614,
      lng: -46.6560
    },
    isInDatabase: true,
    savedAt: '2026-09-15T10:30:00Z',
    status: 'cliente',
    tags: ['Imobiliária', 'Comercial', 'Decisor: Roberto'],
    notas: 'Cliente chave com carteira de 150 imóveis comerciais na Av. Paulista.',
    avaliacao: 5,
    valorEstimado: 25000
  },
  {
    id: '12345678000195',
    cnpj: '12.345.678/0001-95',
    cnpjRaw: '12345678000195',
    razaoSocial: 'CONSTRUTORA E INCORPORADORA METROPOLIS SA',
    nomeFantasia: 'METROPOLIS ENGENHARIA',
    cnaePrincipal: {
      codigo: '4120-4/00',
      descricao: 'Construção de edifícios'
    },
    cnaesSecundarios: [
      { codigo: '4110-7/00', descricao: 'Incorporação de empreendimentos imobiliários' },
      { codigo: '7112-0/00', descricao: 'Serviços de engenharia' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '04/08/2005',
    capitalSocial: 12500000,
    naturezaJuridica: '205-4 - Sociedade Anônima Fechada',
    porte: 'DEMAIS',
    simplesNacional: false,
    mei: false,
    endereco: {
      logradouro: 'Avenida Brigadeiro Faria Lima',
      numero: '3477',
      complemento: '14º Andar',
      bairro: 'Itaim Bibi',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '04538-133'
    },
    contato: {
      telefone: '1130459800',
      email: 'diretoria@metropoliseng.com.br'
    },
    qsa: [
      { nome: 'FERNANDO AUGUSTO BRANDAO', qual: '10-Diretor Presidente' },
      { nome: 'MARCELO TOLEDO RIBEIRO', qual: '16-Diretor Financeiro' }
    ],
    coordenadas: {
      lat: -23.5854,
      lng: -46.6811
    },
    isInDatabase: true,
    savedAt: '2026-09-20T14:15:00Z',
    status: 'proposta',
    tags: ['Construtora', 'Alto Padrão', 'Grande Porte'],
    notas: 'Enviada proposta para mapeamento georreferenciado de terrenos e análise de zoneamento.',
    avaliacao: 4,
    valorEstimado: 85000
  },
  {
    id: '23456789000101',
    cnpj: '23.456.789/0001-01',
    cnpjRaw: '23456789000101',
    razaoSocial: 'TECHMAP SOLUCOES DIGITAIS EM GEOLOCALIZACAO LTDA',
    nomeFantasia: 'TECHMAP BRASIL',
    cnaePrincipal: {
      codigo: '6201-5/01',
      descricao: 'Desenvolvimento de programas de computador sob encomenda'
    },
    cnaesSecundarios: [
      { codigo: '6202-3/00', descricao: 'Desenvolvimento e licenciamento de programas de computador customizáveis' },
      { codigo: '6311-9/00', descricao: 'Tratamento de dados, provedores de serviços de aplicação e hospedagem na internet' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '10/11/2018',
    capitalSocial: 800000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS',
    simplesNacional: true,
    mei: false,
    endereco: {
      logradouro: 'Rua Bela Cintra',
      numero: '986',
      complemento: 'Conj 41',
      bairro: 'Consolação',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01415-000'
    },
    contato: {
      telefone: '1131514422',
      telefone2: '11991234567',
      email: 'comercial@techmap.io'
    },
    qsa: [
      { nome: 'LUCAS GABRIEL SANTOS', qual: '49-Sócio-Administrador' },
      { nome: 'JULIANA PEREIRA VIEIRA', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -23.5562,
      lng: -46.6603
    },
    isInDatabase: true,
    savedAt: '2026-09-22T09:00:00Z',
    status: 'contatado',
    tags: ['Tecnologia', 'SaaS', 'Parceria'],
    notas: 'Reunião com CTO realizada. Avaliando integração de APIs de geomarketing.',
    avaliacao: 4,
    valorEstimado: 18000
  },
  {
    id: '34567890000112',
    cnpj: '34.567.890/0001-12',
    cnpjRaw: '34567890000112',
    razaoSocial: 'PRIME OFFICE GESTAO E CORRETAGEM DE IMOVEIS LTDA',
    nomeFantasia: 'PRIME PROPERTIES SP',
    cnaePrincipal: {
      codigo: '6821-8/01',
      descricao: 'Corretagem na compra e venda e avaliação de imóveis'
    },
    cnaesSecundarios: [
      { codigo: '6821-8/02', descricao: 'Corretagem no aluguel de imóveis' },
      { codigo: '6810-2/01', descricao: 'Compra e venda de imóveis próprios' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '22/01/2015',
    capitalSocial: 300000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'MICROEMPRESA',
    simplesNacional: true,
    mei: false,
    endereco: {
      logradouro: 'Alameda Santos',
      numero: '1800',
      complemento: '8º Andar',
      bairro: 'Cerqueira César',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01418-102'
    },
    contato: {
      telefone: '1132537700',
      email: 'contato@primeproperties.com.br'
    },
    qsa: [
      { nome: 'CLAUDIO ANDRADE NETO', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -23.5638,
      lng: -46.6575
    },
    isInDatabase: false,
    status: 'prospeccao',
    tags: ['Corretora', 'Paulista']
  },
  {
    id: '45678901000123',
    cnpj: '45.678.901/0001-23',
    cnpjRaw: '45678901000123',
    razaoSocial: 'AUDITAX CONSULTORIA CONTABIL E TRIBUTARIA SOCIEDADE SIMPLES',
    nomeFantasia: 'AUDITAX AUDITORIA',
    cnaePrincipal: {
      codigo: '6920-6/01',
      descricao: 'Atividades de contabilidade'
    },
    cnaesSecundarios: [
      { codigo: '6920-6/02', descricao: 'Atividades de consultoria e auditoria contábil e tributária' },
      { codigo: '7020-4/00', descricao: 'Atividades de consultoria em gestão empresarial' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '18/06/2009',
    capitalSocial: 500000,
    naturezaJuridica: '224-0 - Sociedade Simples Limitada',
    porte: 'DEMAIS',
    simplesNacional: false,
    mei: false,
    endereco: {
      logradouro: 'Rua Augusta',
      numero: '2525',
      complemento: 'Conj 91',
      bairro: 'Cerqueira César',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01413-100'
    },
    contato: {
      telefone: '1130628899',
      email: 'fiscal@auditax.com.br'
    },
    qsa: [
      { nome: 'HELENA MATOS SILVEIRA', qual: '49-Sócio-Administrador' },
      { nome: 'DANIEL COSTA FONSECA', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -23.5598,
      lng: -46.6664
    },
    isInDatabase: false,
    status: 'prospeccao',
    tags: ['Contabilidade', 'Fiscal']
  },
  {
    id: '56789012000134',
    cnpj: '56.789.012/0001-34',
    cnpjRaw: '56789012000134',
    razaoSocial: 'BIOHEALTH CENTRO DIAGNOSTICO E CLINICA MEDICA LTDA',
    nomeFantasia: 'BIOHEALTH MEDICINA DIAGNOSTICA',
    cnaePrincipal: {
      codigo: '8640-2/02',
      descricao: 'Laboratórios de análises clínicas'
    },
    cnaesSecundarios: [
      { codigo: '8630-5/03', descricao: 'Atividade médica ambulatorial restrita a consultas' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '14/02/2016',
    capitalSocial: 2200000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS',
    simplesNacional: false,
    mei: false,
    endereco: {
      logradouro: 'Rua da Consolação',
      numero: '2222',
      complemento: '',
      bairro: 'Consolação',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01302-001'
    },
    contato: {
      telefone: '1138241000',
      email: 'atendimento@biohealthsp.com.br'
    },
    qsa: [
      { nome: 'DRA ANA BEATRIZ VASCONCELOS', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -23.5539,
      lng: -46.6611
    },
    isInDatabase: false,
    status: 'prospeccao',
    tags: ['Saúde', 'Clínica', 'Laboratório']
  },
  // Rio de Janeiro
  {
    id: '67890123000145',
    cnpj: '67.890.123/0001-45',
    cnpjRaw: '67890123000145',
    razaoSocial: 'ORLA CARIOCA GESTAO DE IMOVEIS E NEGOCIOS LTDA',
    nomeFantasia: 'ORLA CARIOCA IMOBILIARIA',
    cnaePrincipal: {
      codigo: '6821-8/01',
      descricao: 'Corretagem na compra e venda e avaliação de imóveis'
    },
    cnaesSecundarios: [
      { codigo: '6810-2/01', descricao: 'Compra e venda de imóveis próprios' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '08/05/2014',
    capitalSocial: 600000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'MICROEMPRESA',
    simplesNacional: true,
    mei: false,
    endereco: {
      logradouro: 'Avenida Rio Branco',
      numero: '156',
      complemento: 'Sala 2101',
      bairro: 'Centro',
      municipio: 'Rio de Janeiro',
      uf: 'RJ',
      cep: '20040-006'
    },
    contato: {
      telefone: '2122105500',
      email: 'contato@orlacarioca.com.br'
    },
    qsa: [
      { nome: 'LEONARDO VALLE BARBOSA', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -22.9068,
      lng: -43.1769
    },
    isInDatabase: true,
    savedAt: '2026-09-24T11:20:00Z',
    status: 'proposta',
    tags: ['Rio de Janeiro', 'Imobiliária', 'Comercial'],
    notas: 'Proposta de parceria para locação de salas comerciais no Centro do RJ.',
    avaliacao: 5,
    valorEstimado: 35000
  },
  // Curitiba
  {
    id: '78901234000156',
    cnpj: '78.901.234/0001-56',
    cnpjRaw: '78901234000156',
    razaoSocial: 'PARANA CAPITAL ENGENHARIA E CONSTRUCOES LTDA',
    nomeFantasia: 'PARANA CAPITAL',
    cnaePrincipal: {
      codigo: '4120-4/00',
      descricao: 'Construção de edifícios'
    },
    cnaesSecundarios: [
      { codigo: '4399-1/01', descricao: 'Administração de obras' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '19/09/2010',
    capitalSocial: 5400000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS',
    simplesNacional: false,
    mei: false,
    endereco: {
      logradouro: 'Avenida Sete de Setembro',
      numero: '4214',
      complemento: '',
      bairro: 'Batel',
      municipio: 'Curitiba',
      uf: 'PR',
      cep: '80250-210'
    },
    contato: {
      telefone: '4133428900',
      email: 'contato@paranacapital.com.br'
    },
    qsa: [
      { nome: 'RICARDO WOYCIECHOWSKI', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -25.4419,
      lng: -49.2818
    },
    isInDatabase: true,
    savedAt: '2026-09-25T16:00:00Z',
    status: 'cliente',
    tags: ['Construção', 'Curitiba', 'Residencial'],
    notas: 'Obras em andamento no Batel e Ecoville.',
    avaliacao: 5,
    valorEstimado: 120000
  },
  // Belo Horizonte
  {
    id: '89012345000167',
    cnpj: '89.012.345/0001-67',
    cnpjRaw: '89012345000167',
    razaoSocial: 'MINAS LOGISTICA E TRANSPORTES RODOVIARIOS LTDA',
    nomeFantasia: 'MINAS CARGAS EXPRESS',
    cnaePrincipal: {
      codigo: '4930-2/02',
      descricao: 'Transporte rodoviário de carga, exceto produtos perigosos e mudanças, intermunicipal e interestadual'
    },
    cnaesSecundarios: [
      { codigo: '5211-7/99', descricao: 'Depósitos de mercadorias para terceiros' }
    ],
    situacaoCadastral: 'ATIVA',
    dataAbertura: '30/03/2013',
    capitalSocial: 1800000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'DEMAIS',
    simplesNacional: false,
    mei: false,
    endereco: {
      logradouro: 'Avenida do Contorno',
      numero: '6594',
      complemento: '',
      bairro: 'Savassi',
      municipio: 'Belo Horizonte',
      uf: 'MG',
      cep: '30110-044'
    },
    contato: {
      telefone: '3132819000',
      email: 'operacional@minascargas.com.br'
    },
    qsa: [
      { nome: 'GUSTAVO HENRIQUE REZENDE', qual: '49-Sócio-Administrador' }
    ],
    coordenadas: {
      lat: -19.9388,
      lng: -43.9348
    },
    isInDatabase: true,
    savedAt: '2026-09-26T14:40:00Z',
    status: 'contatado',
    tags: ['Logística', 'Frotista', 'Minas Gerais'],
    notas: 'Frota de 45 caminhões com rastreamento ativo.',
    avaliacao: 3,
    valorEstimado: 45000
  },
  // Baixada / Inapta example
  {
    id: '90123456000178',
    cnpj: '90.123.456/0001-78',
    cnpjRaw: '90123456000178',
    razaoSocial: 'COMERCIAL DE BEBIDAS E ALIMENTOS PAULISTANO LTDA',
    nomeFantasia: 'ADEGA PAULISTANO',
    cnaePrincipal: {
      codigo: '4723-7/00',
      descricao: 'Comércio varejista de bebidas'
    },
    cnaesSecundarios: [],
    situacaoCadastral: 'BAIXADA',
    dataSituacaoCadastral: '12/05/2021',
    dataAbertura: '05/01/2008',
    capitalSocial: 50000,
    naturezaJuridica: '206-2 - Sociedade Empresária Limitada',
    porte: 'MICROEMPRESA',
    endereco: {
      logradouro: 'Rua Pamplona',
      numero: '850',
      bairro: 'Jardim Paulista',
      municipio: 'São Paulo',
      uf: 'SP',
      cep: '01405-001'
    },
    contato: {},
    qsa: [],
    coordenadas: {
      lat: -23.5670,
      lng: -46.6550
    },
    isInDatabase: false,
    status: 'descartado'
  }
];
