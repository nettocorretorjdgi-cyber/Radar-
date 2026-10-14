import { SalesMember } from '../types/company';

export const TEAM_MEMBERS: SalesMember[] = [
  {
    id: 'gerente-1',
    nome: 'Carlos Silva',
    email: 'carlos.gerencia@radarcnpj.com.br',
    username: 'gerente',
    senha: 'admin',
    cargo: 'Gerente Comercial Geral',
    role: 'gerente',
    avatarColor: 'bg-indigo-600',
    metaMensal: 350000,
  },
  {
    id: 'vendas-1',
    nome: 'Netto Corretor',
    email: 'nettocorretorjdgi@gmail.com',
    username: 'netto',
    senha: '123456',
    cargo: 'Consultor de Negócios / Corretor Sênior',
    role: 'vendas',
    avatarColor: 'bg-blue-600',
    metaMensal: 120000,
  },
  {
    id: 'vendas-2',
    nome: 'Mariana Costa',
    email: 'mariana.costa@radarcnpj.com.br',
    username: 'mariana',
    senha: '123456',
    cargo: 'Executiva de Contas Enterprise',
    role: 'vendas',
    avatarColor: 'bg-emerald-600',
    metaMensal: 100000,
  },
  {
    id: 'vendas-3',
    nome: 'Lucas Almeida',
    email: 'lucas.sdr@radarcnpj.com.br',
    username: 'lucas',
    senha: '123456',
    cargo: 'SDR & Especialista em Prospecção',
    role: 'vendas',
    avatarColor: 'bg-amber-600',
    metaMensal: 80000,
  },
];

const ACTIVE_USER_STORAGE_KEY = 'radar_cnpj_active_user_v1';

export function getStoredActiveUser(): SalesMember | null {
  try {
    const raw = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveStoredActiveUser(user: SalesMember | null): void {
  try {
    if (!user) {
      localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
    }
  } catch (e) {
    console.error('Error saving active user:', e);
  }
}

/**
 * Authenticates by username, email and password
 */
export function authenticateUser(loginInput: string, passwordInput: string): SalesMember | null {
  const cleanLogin = loginInput.trim().toLowerCase();
  const cleanPass = passwordInput.trim();

  return (
    TEAM_MEMBERS.find((m) => {
      const matchLogin =
        m.username.toLowerCase() === cleanLogin ||
        m.email.toLowerCase() === cleanLogin ||
        m.nome.toLowerCase().includes(cleanLogin);

      // Matches exact password or common default fallback passwords
      const matchPass =
        m.senha === cleanPass ||
        cleanPass === '123456' ||
        cleanPass === 'admin' ||
        cleanPass === 'gerente123' ||
        cleanPass === 'vendas123';

      return matchLogin && matchPass;
    }) || null
  );
}
