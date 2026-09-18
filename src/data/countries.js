// src/data/countries.js

export const COUNTRIES = {
  SN: {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    dialCode: '+221',
    phoneLength: 9,
    phoneMask: '7X XXX XX XX',
    popularCities: ['Dakar', 'Thiès', 'Touba', 'Saint-Louis', 'Mbour', 'Ziguinchor', 'Kaolack', 'Rufisque'],
    currency: 'FCFA',
    paymentMethods: [
      { id: 'wave', name: 'Wave Sénégal (100% Sans Frais)', color: 'bg-[#00D1FF]/10 text-[#008BB2] border-[#00D1FF]/30' }
    ]
  },
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    dialCode: '+225',
    phoneLength: 10,
    phoneMask: '07 XX XX XX XX',
    popularCities: ['Abidjan', 'Bouaké', 'Yamoussoukro', 'San-Pédro', 'Daloa', 'Korhogo', 'Bassam'],
    currency: 'FCFA',
    paymentMethods: [
      { id: 'paystack', name: 'Paystack CI (Wave, OM, MTN, Moov, Carte)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
    ]
  }
};

export const DEFAULT_COUNTRY = 'SN';

export function formatPhoneNumber(number, countryCode = 'SN') {
  if (!number) return '';
  const digits = number.replace(/\D/g, '');
  const country = COUNTRIES[countryCode] || COUNTRIES.SN;
  const maxLen = country.phoneLength || 9;
  const d = digits.slice(0, maxLen);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)} ${d.slice(2)}`;
  if (d.length <= 7) return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5)}`;
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
}

