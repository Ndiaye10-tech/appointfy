import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variables Supabase manquantes pour le webhook.');
    }

    // Client Supabase avec droits administrateur (Service Role)
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json();
    console.log('[GENIUSPAY WEBHOOK RECEIVED]:', JSON.stringify(body));

    // GeniusPay webhook payload standard
    const event = body.event || body.type;
    const payment = body.data || body.payment || body;

    const reference = payment.reference || payment.id;
    const status = payment.status;
    const metadata = payment.metadata || {};

    const isSuccess = status === 'completed' || status === 'successful' || event === 'payment.completed';

    if (!isSuccess) {
      console.log(`[GENIUSPAY WEBHOOK] Statut non finalisé (${status || event}).`);
      return new Response(JSON.stringify({ received: true, status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      });
    }

    // =========================================================================
    // CAS 1 : Confirmation d'un Acompte de Rendez-vous Cliente
    // =========================================================================
    const appointmentId = metadata.appointment_id || metadata.appointmentId;

    if (appointmentId) {
      console.log(`[GENIUSPAY WEBHOOK] Confirmation du RDV ID: ${appointmentId}`);
      
      const { data: updatedAppt, error: apptError } = await supabaseAdmin
        .from('appointments')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          expires_at: null,
          transaction_ref: reference,
          geniuspay_reference: reference
        })
        .eq('id', appointmentId)
        .select();

      if (apptError) {
        console.error('[GENIUSPAY WEBHOOK] Erreur update appointment:', apptError);
      } else {
        console.log('[GENIUSPAY WEBHOOK] RDV confirmé avec succès:', updatedAppt);
      }
    } else if (reference) {
      // Recherche de secours par référence GeniusPay
      await supabaseAdmin
        .from('appointments')
        .update({
          status: 'confirmed',
          payment_status: 'completed',
          expires_at: null
        })
        .eq('geniuspay_reference', reference);
    }

    // =========================================================================
    // CAS 2 : Renouvellement / Activation d'un Abonnement Salon SaaS
    // =========================================================================
    if (metadata.type === 'subscription' || metadata.plan_type) {
      const salonId = metadata.salon_id || metadata.salonId;
      if (salonId) {
        console.log(`[GENIUSPAY WEBHOOK] Activation abonnement pour le salon ID: ${salonId}`);
        
        await supabaseAdmin
          .from('salons')
          .update({
            subscription_status: 'active',
            subscription_ref: reference,
            last_subscription_payment: new Date().toISOString()
          })
          .eq('id', salonId);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: true, reference }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (err) {
    console.error('[GENIUSPAY WEBHOOK ERROR]:', err);
    return new Response(JSON.stringify({ success: false, error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400
    });
  }
});
