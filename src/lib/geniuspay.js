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
  if (isLocalhost) {
    return Boolean(API_KEY && API_KEY.startsWith('pk_'));
  }
  // En production, les Edge Functions Supabase gèrent les clés de manière sécurisée
  return Boolean(import.meta.env.VITE_SUPABASE_URL);
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
  if (!isGeniusPayConfigured()) {
    throw new Error('Identifiants Genius Pay manquants. Vérifiez votre configuration.');
  }

  // Minimum requis par Genius Pay en XOF : 200 FCFA
  const safeAmount = Math.max(200, Math.round(Number(amount) || 200));
  const safeCountry = String(country || 'SN').toUpperCase();
  const formattedPhone = formatInternationalPhone(customerPhone, safeCountry);

  const payload = {
    amount: safeAmount,
    currency: 'XOF',
    description: description.slice(0, 500),
    customer: {
      name: customerName || 'Client Appointfy',
      phone: formattedPhone,
      country: safeCountry
    },
    metadata: {
      ...metadata,
      platform: 'Appointfy',
      client_phone: formattedPhone,
      country: safeCountry,
      payment_method_selected: paymentMethod || 'Multi-Paiement'
    }
  };

  if (customerEmail && customerEmail.includes('@')) {
    payload.customer.email = customerEmail;
  }

  // Si Wave est explicitement sélectionné, rediriger directement vers Wave
  if (paymentMethod && paymentMethod.toLowerCase() === 'wave') {
    payload.payment_method = 'wave';
  }
  // Sinon (Orange Money, MTN, Moov, Carte ou Multi), laisser payment_method vide
  // pour que GeniusPay affiche sa passerelle multi-opérateurs sécurisée.

  if (successUrl) payload.success_url = successUrl;
  if (errorUrl) payload.error_url = errorUrl;

  try {
    // En dev (localhost): appel direct via proxy Vite
    if (isLocalhost) {
      const response = await fetch(`${BASE_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': API_KEY
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        const errorMsg = data?.error?.message || data?.message || `Erreur Genius Pay (${response.status})`;
        throw new Error(errorMsg);
      }

      const raw = data.data || {};
      const normalizedData = {
        ...raw,
        checkout_url: raw.checkout_url || raw.payment_url,
        payment_url: raw.payment_url || raw.checkout_url
      };

      return { success: true, data: normalizedData };
    }

    // En production: appel via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: {
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
      }
    });

    if (error) throw new Error(error.message || 'Erreur Edge Function');
    if (!data || !data.success) throw new Error(data?.error || 'Erreur Genius Pay inconnue');

    const raw = data.data || {};
    const normalizedData = {
      ...raw,
      checkout_url: raw.checkout_url || raw.payment_url,
      payment_url: raw.payment_url || raw.checkout_url
    };

    return { success: true, data: normalizedData };
  } catch (err) {
    console.error('Erreur API Genius Pay (createPayment):', err);
    throw err;
  }
};

/**
 * Check payment status by transaction reference (e.g. MTX-XXXXXXXXXX)
 */
export const checkGeniusPaymentStatus = async (reference) => {
  if (!reference) return { status: 'unknown' };

  try {
    // En dev: appel direct via proxy
    if (isLocalhost) {
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
      return { success: false, status: 'unknown' };
    }

    // En production: appel via Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('check-payment', {
      body: { reference }
    });

    if (error) return { success: false, status: 'unknown', error: error.message };
    if (data && data.success) return { success: true, status: data.data.status, data: data.data };
    return { success: false, status: data?.status || 'unknown' };
  } catch (err) {
    console.warn('Erreur API Genius Pay (checkPaymentStatus):', err);
    return { success: false, status: 'unknown', error: err.message };
  }
};
