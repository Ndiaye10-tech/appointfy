// src/data/countries.js

export const COUNTRIES = {
  SN: {
    code: 'SN',
    name: 'Sénégal',
    flag: '🇸🇳',
    dialCode: '+221',
    phoneLength: 9,
    phoneMask: '7X XXX XX XX',
    defaultCity: 'Dakar',
    currency: 'FCFA',
    paymentMethods: [
      { id: 'wave', name: 'Wave', color: 'bg-[#00D1FF]/10 text-[#008BB2] border-[#00D1FF]/30' },
      { id: 'orange', name: 'Orange Money', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      { id: 'card', name: 'Carte bancaire', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    ]
  },
  CI: {
    code: 'CI',
    name: 'Côte d\'Ivoire',
    flag: '🇨🇮',
    dialCode: '+225',
    phoneLength: 10,
    phoneMask: '07 XX XX XX XX',
    defaultCity: 'Abidjan',
    currency: 'FCFA',
    paymentMethods: [
      { id: 'wave', name: 'Wave', color: 'bg-[#00D1FF]/10 text-[#008BB2] border-[#00D1FF]/30' },
      { id: 'orange', name: 'Orange Money', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      { id: 'mtn', name: 'MTN MoMo', color: 'bg-amber-50 text-amber-800 border-amber-200' },
      { id: 'moov', name: 'Moov Money', color: 'bg-sky-50 text-sky-800 border-sky-200' },
      { id: 'card', name: 'Carte bancaire', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    ]
  },
  ML: {
    code: 'ML',
    name: 'Mali',
    flag: '🇲🇱',
    dialCode: '+223',
    phoneLength: 8,
    phoneMask: '7X XX XX XX',
    defaultCity: 'Bamako',
    currency: 'FCFA',
    paymentMethods: [
      { id: 'orange', name: 'Orange Money', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      { id: 'moov', name: 'Moov Money', color: 'bg-sky-50 text-sky-800 border-sky-200' },
      { id: 'card', name: 'Carte bancaire', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    ]
  },
  BJ: {
    code: 'BJ',
    name: 'Bénin',
    flag: '🇧🇯',
    dialCode: '+229',
    phoneLength: 8,
    phoneMask: '9X XX XX XX',
    defaultCity: 'Cotonou',
    currency: 'FCFA',
    paymentMethods: [
      { id: 'mtn', name: 'MTN MoMo', color: 'bg-amber-50 text-amber-800 border-amber-200' },
      { id: 'moov', name: 'Moov Money', color: 'bg-sky-50 text-sky-800 border-sky-200' },
      { id: 'wave', name: 'Wave', color: 'bg-[#00D1FF]/10 text-[#008BB2] border-[#00D1FF]/30' },
      { id: 'card', name: 'Carte bancaire', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    ]
  },
  TG: {
    code: 'TG',
    name: 'Togo',
    flag: '🇹🇬',
    dialCode: '+228',
    phoneLength: 8,
    phoneMask: '9X XX XX XX',
    defaultCity: 'Lomé',
    currency: 'FCFA',
    paymentMethods: [
      { id: 'moov', name: 'Moov Money', color: 'bg-sky-50 text-sky-800 border-sky-200' },
      { id: 'tmoney', name: 'T-Money', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
      { id: 'card', name: 'Carte bancaire', color: 'bg-slate-50 text-slate-700 border-slate-200' }
    ]
  },
  BF: {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    dialCode: '+226',
    phoneLength: 8,
    phoneMask: '7X XX XX XX',
    defaultCity: 'Ouagadougou',
    currency: 'FCFA',
    paymentMethods: [
      { id: 'orange', name: 'Orange Money', color: 'bg-orange-50 text-orange-700 border-orange-200' },
      { id: 'moov', name: 'Moov Money', color: 'bg-sky-50 text-sky-800 border-sky-200' },
      { id: 'card', name: 'Carte bancaire', color: 'bg-slate-50 text-slate-700 border-slate-200' }
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

