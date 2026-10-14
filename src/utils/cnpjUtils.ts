/**
 * Utility functions for CNPJ validation, formatting, distance calculation and conversions.
 */

export function cleanDigits(value: string | number | undefined | null): string {
  if (!value) return '';
  return String(value).replace(/\D/g, '');
}

/**
 * Validates Brazilian CNPJ checksum
 */
export function isValidCNPJ(cnpj: string): boolean {
  const clean = cleanDigits(cnpj);
  if (clean.length !== 14) return false;

  // Reject known invalid repeated patterns
  if (/^(\d)\1{13}$/.test(clean)) return false;

  let length = clean.length - 2;
  let numbers = clean.substring(0, length);
  const digits = clean.substring(length);
  let sum = 0;
  let pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(0))) return false;

  length = length + 1;
  numbers = clean.substring(0, length);
  sum = 0;
  pos = length - 7;

  for (let i = length; i >= 1; i--) {
    sum += Number(numbers.charAt(length - i)) * pos--;
    if (pos < 2) pos = 9;
  }

  result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (result !== Number(digits.charAt(1))) return false;

  return true;
}

/**
 * Formats digits into 00.000.000/0000-00
 */
export function formatCNPJ(value: string): string {
  const clean = cleanDigits(value).slice(0, 14);
  if (!clean) return '';
  return clean
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');
}

/**
 * Formats CEP into 00000-000
 */
export function formatCEP(value: string): string {
  const clean = cleanDigits(value).slice(0, 8);
  if (!clean) return '';
  return clean.replace(/^(\d{5})(\d)/, '$1-$2');
}

/**
 * Formats phone number (10 or 11 digits)
 */
export function formatPhone(phone?: string): string {
  if (!phone) return '';
  const clean = cleanDigits(phone);
  if (clean.length === 11) {
    return clean.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
  } else if (clean.length === 10) {
    return clean.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  }
  return phone;
}

/**
 * Formats Brazilian Real currency
 */
export function formatCurrency(value?: number): string {
  if (value === undefined || value === null) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

/**
 * Haversine formula to compute great-circle distance between two coordinates in Kilometers
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // rounded to 2 decimal places
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

/**
 * Formats CNAE code (e.g. 6821801 -> 68.21-8-01 or 68.21-8/01)
 */
export function formatCNAE(cnae: string): string {
  const clean = cleanDigits(cnae).slice(0, 7);
  if (clean.length === 7) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}-${clean.slice(4, 5)}/${clean.slice(5, 7)}`;
  }
  if (clean.length >= 5) {
    return `${clean.slice(0, 2)}.${clean.slice(2, 4)}-${clean.slice(4)}`;
  }
  return cnae;
}

/**
 * Generates WhatsApp URL
 */
export function getWhatsAppUrl(phone?: string, text?: string): string | null {
  if (!phone) return null;
  let digits = cleanDigits(phone);
  if (!digits) return null;
  // If not starting with country code 55, add it
  if (!digits.startsWith('55') && (digits.length === 10 || digits.length === 11)) {
    digits = `55${digits}`;
  }
  const defaultText = text ? encodeURIComponent(text) : encodeURIComponent('Olá! Encontrei sua empresa e gostaria de conversar.');
  return `https://wa.me/${digits}?text=${defaultText}`;
}
