import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get('GENIUSPAY_API_KEY') || '';
    const API_SECRET = Deno.env.get('GENIUSPAY_API_SECRET') || '';

    const { reference } = await req.json();
    if (!reference) {
      throw new Error('Référence de paiement manquante.');
    }

    const res = await fetch('https://api.geniuspay.ci/v1/payments/' + reference, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'X-API-Key': API_KEY,
        'X-API-Secret': API_SECRET
      }
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
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
