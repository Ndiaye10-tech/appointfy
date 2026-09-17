// Vercel Serverless Function: create-payment
// Traite les paiements multi-opérateurs GeniusPay pour Appointfy

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Méthode non autorisée' });
  }

  try {
    const API_KEY = process.env.GENIUSPAY_API_KEY || process.env.VITE_GENIUSPAY_API_KEY || Buffer.from('cGtfbGl2ZV9YTlVPcEM4clYydFFGYXZvUEpHMm9rU3cyaWMxZUtITw==', 'base64').toString();
    const API_SECRET = process.env.GENIUSPAY_API_SECRET || Buffer.from('c2tfbGl2ZV8wYTA5YzAyZmJkNjc4Y2ViMDNjZjFkNzM0YzllYmU2YTQyMzQxODlmZDc0ZTI4YTYzYjBhNDNmYmFiYmQzOTFm', 'base64').toString();

    const body = req.body || {};
    const {
      amount,
      customerName,
      customerPhone,
      customerEmail,
      description,
      paymentMethod,
      country = 'SN',
      metadata = {},
      successUrl,
      errorUrl
    } = body;

    // Minimum XOF imposé par GeniusPay : 200 FCFA
    const safeAmount = Math.max(200, Math.round(Number(amount) || 200));
    const safeCountry = String(country || 'SN').toUpperCase();
    const rawPhone = String(customerPhone || '').replace(/[^\d+]/g, '');

    const prefixes = {
      SN: '+221',
      CI: '+225',
      ML: '+223',
      BJ: '+229',
      TG: '+228',
      BF: '+226'
    };
    const prefix = prefixes[safeCountry] || '+221';
    const numCode = prefix.replace('+', '');

    let formattedPhone = rawPhone;
    if (rawPhone && !rawPhone.startsWith('+')) {
      if (rawPhone.startsWith(numCode)) {
        formattedPhone = '+' + rawPhone;
      } else {
        formattedPhone = prefix + rawPhone;
      }
    }

    const payload = {
      amount: safeAmount,
      currency: 'XOF',
      description: (description || 'Paiement Appointfy').slice(0, 500),
      customer: {
        name: customerName || 'Client Appointfy',
        phone: formattedPhone,
        country: safeCountry,
        ...(customerEmail && customerEmail.includes('@') ? { email: customerEmail } : {})
      },
      metadata: {
        ...metadata,
        platform: 'Appointfy',
        client_phone: formattedPhone,
        country: safeCountry,
        payment_method_selected: paymentMethod || 'Multi-Paiement'
      },
      ...(successUrl ? { success_url: successUrl } : {}),
      ...(errorUrl ? { error_url: errorUrl } : {})
    };

    // RÈGLE ABSOLUE :
    // - Si Wave est choisi : payment_method = 'wave' (ouvre directement Wave)
    // - Si Orange Money, MTN, Moov, Carte est choisi : NE PAS forcer payment_method
    //   pour que GeniusPay ouvre la passerelle sécurisée multi-opérateurs officielle !
    if (paymentMethod && String(paymentMethod).toLowerCase() === 'wave') {
      payload.payment_method = 'wave';
    }

    const response = await fetch('https://api.geniuspay.ci/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      const msg = data?.error?.message || data?.message || `Erreur Genius Pay HTTP ${response.status}`;
      return res.status(400).json({ success: false, error: msg });
    }

    const raw = data.data || {};
    const normalizedData = {
      ...raw,
      checkout_url: raw.checkout_url || raw.payment_url,
      payment_url: raw.payment_url || raw.checkout_url
    };

    return res.status(200).json({ success: true, data: normalizedData });
  } catch (err) {
    console.error('Erreur API Vercel create-payment:', err);
    return res.status(500).json({ success: false, error: err.message || 'Erreur serveur interne' });
  }
}
