// src/data/countries.js

export const COUNTRIES = {
  SN: {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    dialCode: '+221',
    phoneLength: 9,
    phoneMask: '7X XXX XX XX',
    defaultCity: 'Dakar (Almadies)',
    popularCities: [
      'Dakar (Almadies)',
      'Dakar (Mermoz / Sacré-Cœur)',
      'Dakar (Plateau)',
      'Dakar (Yoff / Ngor)',
      'Dakar (Ouakam)',
      'Thiès',
      'Saly / Mbour',
      'Saint-Louis'
    ],
    currency: 'FCFA',
    waveName: 'Wave Sénégal'
  }
};

export const DEFAULT_COUNTRY = 'SN';

export function formatPhoneNumber(number, countryCode = 'SN') {
  if (!number) return '';
  const digits = number.replace(/\D/g, '');
  // Sénégal: 77 123 45 67 (9 digits)
  const d = digits.slice(0, 9);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7, 9)}`;
}
