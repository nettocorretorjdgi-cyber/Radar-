import { Company, SituacaoCadastral, Socio } from '../types/company';
import { calculateDistanceKm, cleanDigits, formatCEP, formatCNPJ } from '../utils/cnpjUtils';

// Local coordinates cache to prevent repeated geocoding requests
const GEO_CACHE_KEY = 'radar_cnpj_geo_cache';

function getGeoCache(): Record<string, { lat: number; lng: number }> {
  try {
    const raw = localStorage.getItem(GEO_CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveGeoCache(key: string, coords: { lat: number; lng: number }) {
  try {
    const cache = getGeoCache();
    cache[key] = coords;
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Geocodes an address or city/CEP to latitude & longitude
 */
export async function geocodeAddress(
  addressStr: string
): Promise<{ lat: number; lng: number } | null> {
  const cleanKey = addressStr.trim().toLowerCase();
  const cache = getGeoCache();
  if (cache[cleanKey]) {
    return cache[cleanKey];
  }

  try {
    const encoded = encodeURIComponent(addressStr);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encoded}`,
      {
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9',
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lng = parseFloat(data[0].lon);
        const coords = { lat, lng };
        saveGeoCache(cleanKey, coords);
        return coords;
      }
    }
  } catch (err) {
    console.warn('Geocoding error for:', addressStr, err);
  }

  return null;
}

/**
 * Geocodes via CEP using BrasilAPI v2 (which returns coordinates for many CEPs)
 */
export async function geocodeCEP(cep: string): Promise<{
  lat: number;
  lng: number;
  street?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
} | null> {
  const clean = cleanDigits(cep);
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`);
    if (res.ok) {
      const data = await res.json();
      let coords: { lat: number; lng: number } | null = null;
      if (data.location?.coordinates?.latitude && data.location?.coordinates?.longitude) {
        coords = {
          lat: parseFloat(data.location.coordinates.latitude),
          lng: parseFloat(data.location.coordinates.longitude),
        };
      } else {
        // Fallback geocode address
        const fullAddr = `${data.street || ''}, ${data.neighborhood || ''}, ${data.city} - ${data.state}, Brasil`;
        coords = await geocodeAddress(fullAddr);
      }

      if (coords) {
        return {
          ...coords,
          street: data.street,
          neighborhood: data.neighborhood,
          city: data.city,
          state: data.state,
        };
      }
    }
  } catch (err) {
    console.warn('CEP lookup error:', err);
  }

  return null;
}

/**
 * Real-time public CNPJ consultation with fallback
 */
export async function consultarCNPJ(cnpjInput: string): Promise<Company> {
  const clean = cleanDigits(cnpjInput);
  if (clean.length !== 14) {
    throw new Error('CNPJ inválido. Digite os 14 números.');
  }

  let rawData: any = null;
  let source = '';

  // 1. Try BrasilAPI
  try {
    const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`);
    if (res.ok) {
      rawData = await res.json();
      source = 'brasilapi';
    }
  } catch (e) {
    console.warn('BrasilAPI failed, trying fallback...', e);
  }

  // 2. Fallback to Minha Receita if BrasilAPI failed
  if (!rawData) {
    try {
      const res = await fetch(`https://minhareceita.org/${clean}`);
      if (res.ok) {
        rawData = await res.json();
        source = 'minhareceita';
      }
    } catch (e) {
      console.warn('MinhaReceita fallback failed:', e);
    }
  }

  if (!rawData) {
    throw new Error('Não foi possível obter dados para este CNPJ nos servidores públicos da Receita. Verifique o número.');
  }

  // Standardize response
  const razaoSocial = rawData.razao_social || rawData.nome || 'NÃO INFORMADO';
  const nomeFantasia = rawData.nome_fantasia || rawData.fantasia || razaoSocial;
  const situacao = (rawData.descricao_situacao_cadastral || rawData.situacao_cadastral || 'ATIVA').toUpperCase() as SituacaoCadastral;
  
  const cnaePrincipal = {
    codigo: String(rawData.cnae_fiscal || rawData.cnae_fiscal_principal || rawData.codigo_cnae_fiscal || ''),
    descricao: rawData.cnae_fiscal_descricao || rawData.descricao_cnae_fiscal || 'Atividade econômica principal'
  };

  const cnaesSecundarios = Array.isArray(rawData.cnaes_secundarios)
    ? rawData.cnaes_secundarios.map((item: any) => ({
        codigo: String(item.codigo || ''),
        descricao: item.descricao || ''
      }))
    : [];

  const endereco = {
    logradouro: rawData.descricao_tipo_de_logradouro ? `${rawData.descricao_tipo_de_logradouro} ${rawData.logradouro}` : (rawData.logradouro || ''),
    numero: String(rawData.numero || 'S/N'),
    complemento: rawData.complemento || '',
    bairro: rawData.bairro || '',
    municipio: rawData.municipio || '',
    uf: rawData.uf || '',
    cep: formatCEP(String(rawData.cep || ''))
  };

  const contato = {
    telefone: rawData.ddd_telefone_1 || rawData.telefone || '',
    telefone2: rawData.ddd_telefone_2 || '',
    email: rawData.email || ''
  };

  const qsa: Socio[] = Array.isArray(rawData.qsa)
    ? rawData.qsa.map((s: any) => ({
        nome: s.nome_socio || s.nome || '',
        qual: s.qualificacao_socio || s.qualificacao_representante_legal || s.qual || 'Sócio',
        faixaEtaria: s.faixa_etaria || undefined
      }))
    : [];

  // Geocoding coordinates for the company address
  const fullAddress = `${endereco.logradouro}, ${endereco.numero}, ${endereco.bairro}, ${endereco.municipio} - ${endereco.uf}, Brasil`;
  let coords = await geocodeAddress(fullAddress);

  if (!coords && endereco.cep) {
    const cepGeo = await geocodeCEP(endereco.cep);
    if (cepGeo) coords = { lat: cepGeo.lat, lng: cepGeo.lng };
  }

  // Fallback to city/state center if specific street not found
  if (!coords && endereco.municipio) {
    coords = await geocodeAddress(`${endereco.municipio}, ${endereco.uf}, Brasil`);
  }

  // Default coordinate if all fail (Center of Brazil or SP)
  if (!coords) {
    coords = { lat: -23.55052, lng: -46.633308 };
  }

  const company: Company = {
    id: clean,
    cnpj: formatCNPJ(clean),
    cnpjRaw: clean,
    razaoSocial,
    nomeFantasia,
    cnaePrincipal,
    cnaesSecundarios,
    situacaoCadastral: situacao,
    dataSituacaoCadastral: rawData.data_situacao_cadastral,
    dataAbertura: rawData.data_inicio_atividade || rawData.data_abertura || '',
    capitalSocial: Number(rawData.capital_social || 0),
    naturezaJuridica: rawData.natureza_juridica || rawData.codigo_natureza_juridica || '',
    porte: rawData.porte || rawData.porte_empresa || '',
    simplesNacional: Boolean(rawData.opcao_pelo_simples),
    mei: Boolean(rawData.opcao_pelo_mei),
    endereco,
    contato,
    qsa,
    coordenadas: coords,
    status: 'prospeccao'
  };

  return company;
}

/**
 * Filter and compute distance for a list of companies based on center and radius
 */
export function filterCompaniesInRadius(
  companies: Company[],
  center: { lat: number; lng: number },
  radiusKm: number,
  filterCnae?: string,
  filterTerm?: string,
  filterStatus?: string
): Company[] {
  const termLower = filterTerm?.toLowerCase().trim() || '';
  const cnaeClean = filterCnae?.replace(/\D/g, '') || '';

  return companies
    .map(company => {
      const distance = calculateDistanceKm(
        center.lat,
        center.lng,
        company.coordenadas.lat,
        company.coordenadas.lng
      );
      return {
        ...company,
        distanciaKm: distance,
      };
    })
    .filter(company => {
      // 1. Radius check
      if (company.distanciaKm! > radiusKm) {
        return false;
      }

      // 2. CNAE check
      if (cnaeClean.length > 0) {
        const principalMatch = company.cnaePrincipal.codigo.replace(/\D/g, '').includes(cnaeClean);
        const secMatch = company.cnaesSecundarios.some(sec =>
          sec.codigo.replace(/\D/g, '').includes(cnaeClean)
        );
        if (!principalMatch && !secMatch) return false;
      }

      // 3. Search term check
      if (termLower) {
        const matchRazao = company.razaoSocial.toLowerCase().includes(termLower);
        const matchFantasia = company.nomeFantasia.toLowerCase().includes(termLower);
        const matchCnpj = company.cnpjRaw.includes(termLower.replace(/\D/g, ''));
        const matchBairro = company.endereco.bairro.toLowerCase().includes(termLower);
        const matchCnaeDesc = company.cnaePrincipal.descricao.toLowerCase().includes(termLower);

        if (!matchRazao && !matchFantasia && !matchCnpj && !matchBairro && !matchCnaeDesc) {
          return false;
        }
      }

      // 4. Status check
      if (filterStatus && filterStatus !== 'TODOS') {
        if (company.situacaoCadastral !== filterStatus) return false;
      }

      return true;
    })
    .sort((a, b) => (a.distanciaKm || 0) - (b.distanciaKm || 0));
}
