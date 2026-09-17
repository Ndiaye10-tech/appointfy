import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Gestion du preflight CORS pour les navigateurs
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('GENIUSPAY_API_KEY') || '';
    const API_SECRET = Deno.env.get('GENIUSPAY_API_SECRET') || '';

    if (!API_KEY || !API_SECRET) {
      throw new Error('Identifiants Genius Pay non configurés dans les secrets Supabase.');
    }

    const body = await req.json();
    const {
      amount,
      customerName,
      customerPhone,
      customerEmail,
      description,
      metadata = {},
      successUrl,
      errorUrl
    } = body;

    const safeAmount = Math.max(100, Math.round(Number(amount) || 100));
    const rawPhone = String(customerPhone || '').replace(/[^\d+]/g, '');
    const formattedPhone = rawPhone.startsWith('+')
      ? rawPhone
      : rawPhone.startsWith('221')
      ? '+' + rawPhone
      : '+221' + rawPhone;

    const payload = {
      amount: safeAmount,
      currency: 'XOF',
      description: (description || 'Acompte réservation salon').slice(0, 500),
      payment_method: 'wave',
      customer: {
        name: customerName || 'Client Appointfy',
        phone: formattedPhone,
        country: 'SN',
        ...(customerEmail && customerEmail.includes('@') ? { email: customerEmail } : {})
      },
      metadata: {
        ...metadata,
        platform: 'Appointfy',
        client_phone: formattedPhone
      },
      ...(successUrl ? { success_url: successUrl } : {}),
      ...(errorUrl ? { error_url: errorUrl } : {})
    };

    const res = await fetch('https://api.geniuspay.ci/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET
      },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const msg = data?.error?.message || data?.message || ('Erreur Genius Pay HTTP ' + res.status);
      throw new Error(msg);
    }

    return new Response(JSON.stringify({ success: true, data: data.data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });
  } catch (err) {
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
