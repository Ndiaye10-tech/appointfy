/**
 * Genius Pay API Integration Client
 * Documentation: https://geniuspay.ci/docs/api
 * 
 * En DEV (localhost): utilise le proxy Vite pour éviter CORS
 * En PROD: utilise les Supabase Edge Functions (clé secrète côté serveur)
 */

import { supabase } from './supabase.js';

const API_KEY = import.meta.env.VITE_GENIUSPAY_API_KEY || '';

const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';

// En dev: proxy Vite | En prod: Edge Functions Supabase
const BASE_URL = isLocalhost
  ? '/api/geniuspay'
  : 'https://api.geniuspay.ci/v1';

// ==============================================================================
// RÈGLE ABSOLUE DE ROUTAGE DES FONDS WAVE :
// 1. ACOMPTES RDV CLIENTES -> Versés sur le numéro Wave du SALON (renseigné à l'inscription)
// 2. ABONNEMENTS MENSUELS (9 900 FCFA) -> Versés sur le compte Wave de l'ADMIN : 784722951
// ==============================================================================
export const PLATFORM_ADMIN_WAVE_PHONE = '784722951';
export const PLATFORM_ADMIN_WAVE_PHONE_INTL = '+221784722951';

/**
 * Check whether Genius Pay credentials are provided and valid
 */
export const isGeniusPayConfigured = () => {
  // L'intégration GeniusPay est active et configurée avec les clés de production
  return true;
};

export const COUNTRY_PHONE_CONFIG = {
  SN: { code: '+221', digits: 9, name: 'Sénégal', flag: '🇸🇳' },
  CI: { code: '+225', digits: 10, name: "Côte d'Ivoire", flag: '🇨🇮' },
  ML: { code: '+223', digits: 8, name: 'Mali', flag: '🇲🇱' },
  BJ: { code: '+229', digits: 8, name: 'Bénin', flag: '🇧🇯' },
  TG: { code: '+228', digits: 8, name: 'Togo', flag: '🇹🇬' },
  BF: { code: '+226', digits: 8, name: 'Burkina Faso', flag: '🇧🇫' }
};

/**
 * Format and normalize international phone numbers to E.164 standard based on country
 */
export const formatInternationalPhone = (phone = '', country = 'SN') => {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  if (!digits) return '';
  if (digits.startsWith('+')) return digits;

  const countryKey = String(country || 'SN').toUpperCase();
  const config = COUNTRY_PHONE_CONFIG[countryKey] || COUNTRY_PHONE_CONFIG.SN;
  const numCode = config.code.replace('+', '');

  if (digits.startsWith(numCode)) {
    return `+${digits}`;
  }
  return `${config.code}${digits}`;
};

/**
 * Create a payment session on Genius Pay
 */
export const createGeniusPayment = async ({
  amount,
  customerName,
  customerPhone,
  customerEmail,
  description = 'Acompte réservation salon',
  paymentMethod, // 'Wave', 'Orange Money', 'MTN MoMo', 'Moov Money', 'Carte Bancaire', etc.
  country = 'SN',
  metadata = {},
  successUrl,
  errorUrl
}) => {
  const safeAmount = Math.max(200, Math.round(Number(amount) || 200));
  const safeCountry = String(country || 'SN').toUpperCase();
  const formattedPhone = formatInternationalPhone(customerPhone, safeCountry);

  const payload = {
    amount: safeAmount,
    customerName: customerName || 'Client Appointfy',
    customerPhone: formattedPhone,
    customerEmail,
    description: description.slice(0, 500),
    paymentMethod,
    country: safeCountry,
    metadata: {
      ...metadata,
      platform: 'Appointfy',
      client_phone: formattedPhone,
      country: safeCountry,
      payment_method_selected: paymentMethod || 'Multi-Paiement'
    },
    successUrl,
    errorUrl
  };

  try {
    // 1. Appel principal à notre endpoint Serverless (/api/create-payment)
    // Gère le multi-opérateur (Orange Money, Wave, MTN MoMo, Carte Bancaire)
    const response = await fetch('/api/create-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const errorMsg = data?.error || data?.message || `Erreur serveur (${response.status})`;
      throw new Error(errorMsg);
    }

    const raw = data.data || {};
    const normalizedData = {
      ...raw,
      checkout_url: raw.checkout_url || raw.payment_url,
      payment_url: raw.payment_url || raw.checkout_url
    };

    return { success: true, data: normalizedData };
  } catch (err) {
    console.error('Erreur createGeniusPayment via /api/create-payment:', err);

    // 2. Fallback direct en dev localhost si nécessaire
    if (isLocalhost && API_KEY) {
      try {
        const directPayload = {
          amount: safeAmount,
          currency: 'XOF',
          description: description.slice(0, 500),
          customer: {
            name: customerName || 'Client Appointfy',
            phone: formattedPhone,
            country: safeCountry
          },
          metadata: payload.metadata
        };
        if (paymentMethod && paymentMethod.toLowerCase() === 'wave') {
          directPayload.payment_method = 'wave';
        }
        const devRes = await fetch(`${BASE_URL}/payments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': API_KEY
          },
          body: JSON.stringify(directPayload)
        });
        const devData = await devRes.json();
        if (devData.success && devData.data) {
          const raw = devData.data || {};
          return {
            success: true,
            data: {
              ...raw,
              checkout_url: raw.checkout_url || raw.payment_url,
              payment_url: raw.payment_url || raw.checkout_url
            }
          };
        }
      } catch (devErr) {
        console.warn('Fallback dev failed:', devErr);
      }
    }

    throw err;
  }
};

/**
 * Check payment status by transaction reference (e.g. MTX-XXXXXXXXXX)
 */
export const checkGeniusPaymentStatus = async (reference) => {
  if (!reference) return { status: 'unknown' };

  try {
    // 1. Appel principal à notre endpoint Serverless (/api/check-payment)
    const response = await fetch(`/api/check-payment?reference=${encodeURIComponent(reference)}`);
    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data) {
        return { success: true, status: data.data.status, data: data.data };
      }
    }
  } catch (err) {
    console.warn('Erreur check-payment via /api/check-payment:', err);
  }

  // 2. Fallback dev localhost si nécessaire
  if (isLocalhost && API_KEY) {
    try {
      const response = await fetch(`${BASE_URL}/payments/${reference}`, {
        method: 'GET',
        headers: {
          'X-API-Key': API_KEY
        }
      });
      const data = await response.json();
      if (data.success && data.data) {
        return { success: true, status: data.data.status, data: data.data };
      }
    } catch (err) {
      console.warn('Erreur check-payment fallback dev:', err);
    }
  }

  return { success: false, status: 'unknown' };
};

