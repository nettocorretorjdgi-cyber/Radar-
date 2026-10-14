import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Company, PipelineStatus, SituacaoCadastral } from '../types/company';

const SUPABASE_CONFIG_KEY = 'radar_cnpj_supabase_config_v1';
export const DEFAULT_TABLE_NAME = 'funil';

export interface SupabaseConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  tableName?: string;
  autoSync?: boolean;
}

/**
 * Sanitizes Supabase URL, handling accidental dashboard URLs or trailing slashes
 */
export function sanitizeSupabaseUrl(url: string): string {
  let clean = (url || '').trim();
  if (!clean) return '';

  // If user pasted dashboard URL like https://supabase.com/dashboard/project/abcxyz
  if (clean.includes('/dashboard/project/')) {
    const match = clean.match(/\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://${match[1]}.supabase.co`;
    }
  }

  // Ensure protocol
  if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
    clean = `https://${clean}`;
  }

  // Remove trailing slashes
  clean = clean.replace(/\/+$/, '');
  return clean;
}

export function loadSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (!raw) return { supabaseUrl: '', supabaseAnonKey: '', tableName: DEFAULT_TABLE_NAME, autoSync: false };
    const parsed = JSON.parse(raw);
    return {
      supabaseUrl: sanitizeSupabaseUrl(parsed.supabaseUrl || ''),
      supabaseAnonKey: (parsed.supabaseAnonKey || '').trim(),
      tableName: parsed.tableName || DEFAULT_TABLE_NAME,
      autoSync: Boolean(parsed.autoSync),
    };
  } catch {
    return { supabaseUrl: '', supabaseAnonKey: '', tableName: DEFAULT_TABLE_NAME, autoSync: false };
  }
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    const sanitized = {
      supabaseUrl: sanitizeSupabaseUrl(config.supabaseUrl),
      supabaseAnonKey: config.supabaseAnonKey.trim(),
      tableName: (config.tableName || DEFAULT_TABLE_NAME).trim().toLowerCase(),
      autoSync: Boolean(config.autoSync),
    };
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(sanitized));
  } catch (err) {
    console.error('Error saving Supabase config:', err);
  }
}

let clientInstance: SupabaseClient | null = null;
let currentKey = '';

export function getSupabaseClient(): SupabaseClient | null {
  const config = loadSupabaseConfig();
  if (!config.supabaseUrl || !config.supabaseAnonKey) {
    return null;
  }

  const keyComb = `${config.supabaseUrl}_${config.supabaseAnonKey}`;
  if (!clientInstance || currentKey !== keyComb) {
    try {
      clientInstance = createClient(config.supabaseUrl, config.supabaseAnonKey, {
        auth: {
          persistSession: false,
        },
      });
      currentKey = keyComb;
    } catch (err) {
      console.error('Error creating Supabase client:', err);
      return null;
    }
  }

  return clientInstance;
}

export interface DiagnosticStep {
  name: string;
  status: 'ok' | 'error' | 'warning' | 'pending';
  details?: string;
}

export interface SupabaseDiagnostic {
  tested: boolean;
  success: boolean;
  tableExists: boolean;
  tableNameTested: string;
  canInsert: boolean;
  steps: DiagnosticStep[];
  errorMessage?: string;
  rawError?: any;
  solution?: string;
  statusCode?: string | number;
}

/**
 * Runs a step-by-step diagnostic on the Supabase connection
 */
export async function runSupabaseDiagnostic(
  urlInput: string,
  keyInput: string,
  targetTableName: string = DEFAULT_TABLE_NAME
): Promise<SupabaseDiagnostic> {
  const url = sanitizeSupabaseUrl(urlInput);
  const key = keyInput.trim();
  const table = targetTableName.trim() || DEFAULT_TABLE_NAME;
  const steps: DiagnosticStep[] = [];

  // Step 1: Check URL format
  if (!url || !url.startsWith('https://')) {
    steps.push({
      name: 'Verificação do Project URL',
      status: 'error',
      details: 'URL ausente ou formato inválido. Deve ser no padrão: https://xxxx.supabase.co',
    });
    return {
      tested: true,
      success: false,
      tableExists: false,
      tableNameTested: table,
      canInsert: false,
      steps,
      errorMessage: 'URL do projeto Supabase inválida.',
      solution: 'Copie a URL do seu projeto em Project Settings > API no Supabase.',
    };
  } else {
    steps.push({
      name: 'Verificação do Project URL',
      status: 'ok',
      details: `URL válida: ${url}`,
    });
  }

  // Step 2: Check Key format
  if (!key || key.length < 20) {
    steps.push({
      name: 'Verificação da Chave de API (Anon)',
      status: 'error',
      details: 'Chave ausente ou incompleta. Deve ser o token JWT longo da chave "anon / public".',
    });
    return {
      tested: true,
      success: false,
      tableExists: false,
      tableNameTested: table,
      canInsert: false,
      steps,
      errorMessage: 'Chave Anon do Supabase incompleta.',
      solution: 'Copie a chave "anon / public" em Project Settings > API no Supabase.',
    };
  } else {
    steps.push({
      name: 'Verificação da Chave de API (Anon)',
      status: 'ok',
      details: `Chave detectada (${key.substring(0, 10)}...)`,
    });
  }

  // Step 3: Initialize Supabase Client
  let client: SupabaseClient;
  try {
    client = createClient(url, key, { auth: { persistSession: false } });
    steps.push({
      name: 'Inicialização do Cliente Supabase',
      status: 'ok',
      details: 'Cliente HTTP instanciado com sucesso.',
    });
  } catch (err: any) {
    steps.push({
      name: 'Inicialização do Cliente Supabase',
      status: 'error',
      details: err.message,
    });
    return {
      tested: true,
      success: false,
      tableExists: false,
      tableNameTested: table,
      canInsert: false,
      steps,
      errorMessage: `Falha ao instanciar cliente: ${err.message}`,
      solution: 'Revise se a URL e a chave foram coladas corretamente.',
    };
  }

  // Step 4: Check Table Presence
  const { data: selectData, error: selectError } = await client
    .from(table)
    .select('*')
    .limit(1);

  if (selectError) {
    const isMissingTable =
      selectError.message.includes(`relation "${table}" does not exist`) ||
      selectError.message.includes(`relation "public.${table}" does not exist`) ||
      selectError.code === '42P01' ||
      selectError.code === 'PGRST204';

    if (isMissingTable) {
      steps.push({
        name: `Verificação da Tabela '${table}'`,
        status: 'error',
        details: `A tabela "${table}" NÃO existe no banco PostgreSQL (Código: 42P01).`,
      });
      return {
        tested: true,
        success: false,
        tableExists: false,
        tableNameTested: table,
        canInsert: false,
        steps,
        errorMessage: `A tabela "${table}" ainda não foi criada no Supabase.`,
        solution:
          `Acesse o SQL Editor no painel do Supabase, cole o script SQL fornecido abaixo e clique em RUN. Isso criará a tabela "${table}" e a tornará visível no Table Editor.`,
        statusCode: selectError.code,
        rawError: selectError,
      };
    }

    if (selectError.message.includes('Invalid API key') || selectError.code === 'PGRST301') {
      steps.push({
        name: `Autenticação na API Supabase`,
        status: 'error',
        details: 'A chave fornecida foi recusada pela API do Supabase (Erro 401: Invalid API key).',
      });
      return {
        tested: true,
        success: false,
        tableExists: false,
        tableNameTested: table,
        canInsert: false,
        steps,
        errorMessage: 'Chave API Anon inválida ou expirada.',
        solution: 'Vá em Project Settings > API no Supabase e copie novamente a chave "anon / public".',
        statusCode: selectError.code,
        rawError: selectError,
      };
    }

    steps.push({
      name: `Acesso à Tabela '${table}'`,
      status: 'error',
      details: selectError.message,
    });
    return {
      tested: true,
      success: false,
      tableExists: false,
      tableNameTested: table,
      canInsert: false,
      steps,
      errorMessage: `Erro ao consultar tabela "${table}": ${selectError.message}`,
      solution: 'Verifique se o seu projeto Supabase está ativo e não pausado.',
      statusCode: selectError.code,
      rawError: selectError,
    };
  }

  steps.push({
    name: `Verificação da Tabela '${table}'`,
    status: 'ok',
    details: `Tabela '${table}' encontrada no schema public.`,
  });

  // Step 5: Test Write (RLS check)
  const testId = '__diag_ping_test__';
  const { error: insertError } = await client.from(table).upsert(
    {
      id: testId,
      cnpj: '00.000.000/0000-00',
      razao_social: '__TESTE_DIAGNOSTICO__',
    },
    { onConflict: 'id' }
  );

  if (insertError) {
    const isRls =
      insertError.message.includes('row-level security') ||
      insertError.code === '42501' ||
      insertError.message.includes('violates row-level security policy');

    if (isRls) {
      steps.push({
        name: 'Permissão de Escrita (RLS)',
        status: 'error',
        details: 'A política de Row Level Security (RLS) bloqueou a inserção pública (Código: 42501).',
      });
      return {
        tested: true,
        success: false,
        tableExists: true,
        tableNameTested: table,
        canInsert: false,
        steps,
        errorMessage: `Bloqueio de segurança RLS: a tabela "${table}" não permite que a chave anon grave registros.`,
        solution:
          `Execute o comando no SQL Editor do Supabase: ALTER TABLE public.${table} DISABLE ROW LEVEL SECURITY; ou crie a política de acesso total.`,
        statusCode: insertError.code,
        rawError: insertError,
      };
    }

    steps.push({
      name: 'Permissão de Escrita',
      status: 'error',
      details: insertError.message,
    });
    return {
      tested: true,
      success: false,
      tableExists: true,
      tableNameTested: table,
      canInsert: false,
      steps,
      errorMessage: `Erro ao gravar registro de teste: ${insertError.message}`,
      solution: 'Execute o script SQL completo para recriar ou atualizar as colunas da tabela.',
      statusCode: insertError.code,
      rawError: insertError,
    };
  }

  // Cleanup test ping
  await client.from(table).delete().eq('id', testId);

  steps.push({
    name: 'Permissão de Escrita (RLS)',
    status: 'ok',
    details: 'Permissão de gravação e exclusão confirmadas com sucesso!',
  });

  return {
    tested: true,
    success: true,
    tableExists: true,
    tableNameTested: table,
    canInsert: true,
    steps,
  };
}

/**
 * Syncs companies to the Supabase 'funil' table with adaptive fallback
 */
export async function syncCompaniesToSupabase(
  companies: Company[]
): Promise<{ success: boolean; count: number; error?: string; diagnostic?: SupabaseDiagnostic; details?: string }> {
  const client = getSupabaseClient();
  const config = loadSupabaseConfig();
  const tableName = config.tableName || DEFAULT_TABLE_NAME;

  if (!client || !config.supabaseUrl || !config.supabaseAnonKey) {
    return {
      success: false,
      count: 0,
      error: 'Supabase não configurado. Por favor, informe o Project URL e a chave anon nas configurações.',
    };
  }

  if (companies.length === 0) {
    return {
      success: false,
      count: 0,
      error: 'Não há nenhuma empresa salva no seu funil local para enviar.',
    };
  }

  try {
    // 1. Full Payload
    const fullRecords = companies.map((c) => ({
      id: c.id,
      cnpj: c.cnpj || '',
      cnpj_raw: c.cnpjRaw || c.id,
      razao_social: c.razaoSocial || 'NÃO INFORMADO',
      nome_fantasia: c.nomeFantasia || c.razaoSocial || 'NÃO INFORMADO',
      cnae_principal_codigo: c.cnaePrincipal?.codigo || null,
      cnae_principal_descricao: c.cnaePrincipal?.descricao || null,
      situacao_cadastral: c.situacaoCadastral || 'ATIVA',
      capital_social: Number(c.capitalSocial) || 0,
      telefone_1: c.contato?.telefone || null,
      telefone_2: c.contato?.telefone2 || null,
      email: c.contato?.email || null,
      logradouro: c.endereco?.logradouro || null,
      numero: c.endereco?.numero || null,
      bairro: c.endereco?.bairro || null,
      municipio: c.endereco?.municipio || null,
      uf: c.endereco?.uf || null,
      cep: c.endereco?.cep || null,
      lat: c.coordenadas?.lat ? Number(c.coordenadas.lat) : null,
      lng: c.coordenadas?.lng ? Number(c.coordenadas.lng) : null,
      status: c.status || 'prospeccao',
      tags: Array.isArray(c.tags) ? c.tags : [],
      notas: c.notas || '',
      valor_estimado: Number(c.valorEstimado) || 0,
      avaliacao: Number(c.avaliacao) || 0,
      responsavel_id: c.responsavelId || null,
      responsavel_nome: c.responsavelNome || null,
      updated_at: new Date().toISOString(),
    }));

    // Try full insert first
    let insertResult = await client.from(tableName).upsert(fullRecords, { onConflict: 'id' });

    // Fallback: if 'funil' failed, and maybe user created table with fewer columns (e.g. column does not exist)
    if (insertResult.error) {
      console.warn('Full insert failed with error:', insertResult.error);

      // If missing columns, try essential columns payload
      if (
        insertResult.error.message.includes('column') ||
        insertResult.error.code === '42703' ||
        insertResult.error.message.includes('does not exist')
      ) {
        console.log('Attempting essential fallback columns insertion...');
        const essentialRecords = companies.map((c) => ({
          id: c.id,
          cnpj: c.cnpj || '',
          razao_social: c.razaoSocial || 'NÃO INFORMADO',
          nome_fantasia: c.nomeFantasia || c.razaoSocial || 'NÃO INFORMADO',
          status: c.status || 'prospeccao',
          valor_estimado: Number(c.valorEstimado) || 0,
          telefone_1: c.contato?.telefone || null,
          email: c.contato?.email || null,
          municipio: c.endereco?.municipio || null,
          uf: c.endereco?.uf || null,
        }));

        const retry = await client.from(tableName).upsert(essentialRecords, { onConflict: 'id' });
        if (!retry.error) {
          return { success: true, count: essentialRecords.length };
        }
      }

      // If table doesn't exist at all, or RLS error, run diagnostic to get human solution
      const diag = await runSupabaseDiagnostic(config.supabaseUrl, config.supabaseAnonKey, tableName);
      let humanMsg = insertResult.error.message;

      if (insertResult.error.code === '42P01' || insertResult.error.message.includes('does not exist')) {
        humanMsg = `A tabela "${tableName}" não existe no seu projeto Supabase. Execute o script SQL no painel do Supabase.`;
      } else if (insertResult.error.code === '42501' || insertResult.error.message.includes('row-level security')) {
        humanMsg = `A política de segurança RLS do Supabase impediu a gravação na tabela "${tableName}". Execute o script SQL para liberar permissões.`;
      }

      return {
        success: false,
        count: 0,
        error: humanMsg,
        details: `Código PostgreSQL: ${insertResult.error.code || 'N/A'} - ${insertResult.error.message}`,
        diagnostic: diag,
      };
    }

    return { success: true, count: fullRecords.length };
  } catch (err: any) {
    console.error('Unexpected sync error:', err);
    return { success: false, count: 0, error: err.message || 'Erro inesperado na sincronização' };
  }
}

/**
 * Pulls all companies stored in Supabase 'funil' table
 */
export async function fetchCompaniesFromSupabase(): Promise<{
  success: boolean;
  companies: Company[];
  error?: string;
}> {
  const client = getSupabaseClient();
  const config = loadSupabaseConfig();
  const tableName = config.tableName || DEFAULT_TABLE_NAME;

  if (!client) {
    return { success: false, companies: [], error: 'Supabase não configurado.' };
  }

  try {
    let { data, error } = await client.from(tableName).select('*');

    // If 'funil' errored and tableName was 'funil', try 'empresas' fallback
    if (error && tableName === 'funil') {
      const fallback = await client.from('empresas').select('*');
      if (!fallback.error && fallback.data) {
        data = fallback.data;
        error = null;
      }
    }

    if (error) {
      return { success: false, companies: [], error: error.message };
    }

    const list: Company[] = (data || []).map((row: any) => ({
      id: String(row.id),
      cnpj: row.cnpj || '',
      cnpjRaw: row.cnpj_raw || row.id || '',
      razaoSocial: row.razao_social || 'NÃO INFORMADO',
      nomeFantasia: row.nome_fantasia || row.razao_social || 'NÃO INFORMADO',
      cnaePrincipal: {
        codigo: row.cnae_principal_codigo || '',
        descricao: row.cnae_principal_descricao || '',
      },
      cnaesSecundarios: [],
      situacaoCadastral: (row.situacao_cadastral as SituacaoCadastral) || 'ATIVA',
      dataAbertura: row.data_abertura || '',
      capitalSocial: Number(row.capital_social) || 0,
      endereco: {
        logradouro: row.logradouro || '',
        numero: row.numero || '',
        bairro: row.bairro || '',
        municipio: row.municipio || '',
        uf: row.uf || '',
        cep: row.cep || '',
      },
      contato: {
        telefone: row.telefone_1 || undefined,
        telefone2: row.telefone_2 || undefined,
        email: row.email || undefined,
      },
      qsa: [],
      coordenadas: {
        lat: Number(row.lat) || -23.55,
        lng: Number(row.lng) || -46.63,
      },
      status: (row.status as PipelineStatus) || 'prospeccao',
      tags: Array.isArray(row.tags) ? row.tags : [],
      notas: row.notas || '',
      valorEstimado: Number(row.valor_estimado) || 0,
      avaliacao: Number(row.avaliacao) || 0,
      responsavelId: row.responsavel_id || undefined,
      responsavelNome: row.responsavel_nome || undefined,
      isInDatabase: true,
      savedAt: row.created_at || row.updated_at || new Date().toISOString(),
    }));

    return { success: true, companies: list };
  } catch (err: any) {
    return { success: false, companies: [], error: err.message };
  }
}

/**
 * Robust SQL script for creating or updating the 'funil' table in Supabase
 * Handles both new tables and tables that already existed with missing columns!
 */
export const SUPABASE_SQL_SCRIPT = `-- ====================================================================
-- SCRIPT DE CRIAÇÃO E CONFIGURAÇÃO DA TABELA 'funil' NO SUPABASE
-- Cole e execute no SQL Editor do seu Supabase Dashboard:
-- https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Cria a tabela 'funil' no schema public caso ela ainda não exista
CREATE TABLE IF NOT EXISTS public.funil (
    id TEXT PRIMARY KEY,
    cnpj TEXT,
    razao_social TEXT
);

-- 2. Adiciona todas as colunas necessárias caso a tabela já tenha sido criada vazia
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS cnpj TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS cnpj_raw TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS razao_social TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS nome_fantasia TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS cnae_principal_codigo TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS cnae_principal_descricao TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS situacao_cadastral TEXT DEFAULT 'ATIVA';
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS capital_social NUMERIC DEFAULT 0;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS telefone_1 TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS telefone_2 TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS logradouro TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS numero TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS bairro TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS municipio TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS uf TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS cep TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS lat NUMERIC;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS lng NUMERIC;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'prospeccao';
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS valor_estimado NUMERIC DEFAULT 0;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS avaliacao INTEGER DEFAULT 0;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS responsavel_id TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS responsavel_nome TEXT;
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.funil ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 3. Desativa o bloqueio RLS para garantir que as gravações passem sem travas
ALTER TABLE public.funil DISABLE ROW LEVEL SECURITY;

-- 4. Concede permissões totais para o papel anon e autenticado
GRANT ALL ON TABLE public.funil TO anon, authenticated, service_role, postgres;

-- 5. Cria índices para busca instantânea
CREATE INDEX IF NOT EXISTS idx_funil_cnpj ON public.funil (cnpj_raw);
CREATE INDEX IF NOT EXISTS idx_funil_status ON public.funil (status);

-- 6. Mensagem de sucesso
SELECT 'SUCESSO! Tabela public.funil configurada e pronta para receber dados do app!' AS resultado;
`;
