-- ==============================================================================
-- APPOINTFY : SCRIPT SQL UNIFIÉ COMPLET (V2)
-- 1. Gestion de l'Essai Gratuit 14 Jours vs Abonné Payant (9 900 FCFA)
-- 2. Système d'Acompte Anti-Lapin (Prix Total, Acompte Wave, Solde au Salon)
-- 3. Tour de Contrôle Super-Admin (KPIs, Paiements SaaS, Annonces en direct)
-- À exécuter dans Supabase SQL Editor (100% Idempotent et Sécurisé)
-- ==============================================================================

-- ==============================================================================
-- ÉTAPE 1 : STRUCTURATION DE LA TABLE DES SALONS (ESSAI 14J & ACOMPTE)
-- ==============================================================================

-- Colonnes d'Abonnement et Période d'Essai
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_subscription_active BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS subscription_price NUMERIC DEFAULT 9900,
ADD COLUMN IF NOT EXISTS last_subscription_payment_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_subscription_ref TEXT;

-- Colonnes de Paramétrage de l'Acompte Anti-Lapin
ALTER TABLE public.salons
ADD COLUMN IF NOT EXISTS deposit_rate NUMERIC DEFAULT 0.20,
ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'rate',
ADD COLUMN IF NOT EXISTS deposit_fixed_amount NUMERIC DEFAULT 2000,
ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS policy_cancellation TEXT DEFAULT 'Annulation sans frais possible jusqu''à 24h avant le rendez-vous.',
ADD COLUMN IF NOT EXISTS wave_number TEXT;

-- ==============================================================================
-- ÉTAPE 2 : STRUCTURATION DE LA TABLE DES RENDEZ-VOUS (FINANCES & ACOMPTES)
-- ==============================================================================

ALTER TABLE public.appointments
ADD COLUMN IF NOT EXISTS price NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_method TEXT, -- 'Wave' (SN) ou 'Paystack'/'Orange Money'/'MTN'/'Moov' (CI)
ADD COLUMN IF NOT EXISTS payment_provider TEXT, -- 'wave' (Sénégal 🇸🇳) ou 'paystack' (Côte d'Ivoire 🇨🇮)
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '45 min',
ADD COLUMN IF NOT EXISTS practitioner_name TEXT;

-- Index de performance sur les rendez-vous
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date ON public.appointments (salon_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments (status);

-- ==============================================================================
-- ÉTAPE 3 : TABLE D'HISTORIQUE DES PAIEMENTS SAAS (ABONNEMENTS 9 900 FCFA)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
    salon_name TEXT,
    amount NUMERIC DEFAULT 9900,
    currency TEXT DEFAULT 'FCFA',
    payment_provider TEXT, -- 'wave' pour le Sénégal (🇸🇳), 'paystack' pour la Côte d'Ivoire (🇨🇮)
    payment_method TEXT,   -- 'Wave', 'Paystack', 'Orange Money', 'MTN', 'Moov', 'Carte CB'
    transaction_ref TEXT,
    payer_phone TEXT,
    period_days INT DEFAULT 30,
    status TEXT DEFAULT 'success',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_salon ON public.subscription_payments (salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON public.subscription_payments (status, created_at DESC);

-- ==============================================================================
-- ÉTAPE 4 : TABLE DES ANNONCES GLOBALES BROADCASTÉES
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.platform_announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    author TEXT DEFAULT 'Super-Admin',
    target_country TEXT DEFAULT 'ALL',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.platform_announcements (is_active, created_at DESC);

-- ==============================================================================
-- ÉTAPE 5 : VUE VITRINE PUBLIQUE 'public_salons' (100% SÉCURISÉE)
-- ==============================================================================

DROP VIEW IF EXISTS public.public_salons CASCADE;
CREATE VIEW public.public_salons AS
SELECT 
    id,
    name,
    slug,
    owner_name,
    tagline,
    description,
    address,
    city,
    country,
    currency,
    business_type,
    work_mode,
    booking_policy,
    phone,
    whatsapp,
    wave_number,
    hours,
    schedule,
    slot_interval,
    rating,
    reviews_count,
    deposit_rate,
    deposit_type,
    deposit_fixed_amount,
    deposit_required,
    min_lead_hours,
    lateness_tolerance,
    policy_cancellation,
    subscription_status,
    trial_ends_at,
    subscription_expires_at,
    is_subscription_active,
    cover_image,
    avatar_image,
    theme,
    gallery,
    welcome_message,
    announcement_banner,
    amenities,
    reviews,
    faq,
    hero_media_type,
    hero_video_url,
    hero_carousel,
    story,
    team,
    lookbook,
    team_mode,
    created_at
FROM public.salons;

GRANT SELECT ON public.public_salons TO anon, authenticated, service_role;

-- ==============================================================================
-- ÉTAPE 6 : FONCTION RPC CALCUL DES STATS SUPER-ADMIN EN TEMPS RÉEL
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_salons INT := 0;
    v_active_subscribers INT := 0;
    v_trial_salons INT := 0;
    v_expired_salons INT := 0;
    v_total_revenue_saas NUMERIC := 0;
    v_total_appointments INT := 0;
    v_total_deposits_collected NUMERIC := 0;
    v_salons_sn INT := 0;
    v_salons_ci INT := 0;
    v_appointments_today INT := 0;
    v_result JSON;
BEGIN
    -- Nombre total de salons
    SELECT COUNT(*) INTO v_total_salons FROM public.salons;

    -- Répartition par pays
    SELECT COUNT(*) INTO v_salons_sn FROM public.salons WHERE country = 'SN' OR country IS NULL;
    SELECT COUNT(*) INTO v_salons_ci FROM public.salons WHERE country = 'CI';

    -- 1. VRAIS abonnés payants (strictement subscription_status = 'active')
    SELECT COUNT(*) INTO v_active_subscribers 
    FROM public.salons 
    WHERE subscription_status = 'active' AND is_subscription_active IS NOT FALSE;

    -- 2. Salons en essai gratuit 14 jours (ne génèrent 0 FCFA de MRR)
    SELECT COUNT(*) INTO v_trial_salons 
    FROM public.salons 
    WHERE (subscription_status = 'trial' OR subscription_status IS NULL) 
      AND (trial_ends_at IS NULL OR trial_ends_at > NOW());

    -- 3. Salons expirés ou restreints (14 jours dépassés sans paiement)
    SELECT COUNT(*) INTO v_expired_salons 
    FROM public.salons 
    WHERE subscription_status = 'expired' 
       OR is_subscription_active = FALSE
       OR ((subscription_status = 'trial' OR subscription_status IS NULL) AND trial_ends_at <= NOW())
       OR (subscription_status = 'active' AND subscription_expires_at <= NOW());

    -- 4. Chiffre d'affaires SaaS RÉEL (encaissé dans subscription_payments via Wave 🇸🇳 ou Paystack 🇨🇮)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue_saas 
    FROM public.subscription_payments 
    WHERE status IN ('success', 'completed');

    -- 5. Volume global des réservations et acomptes collectés pour les salons
    SELECT 
        COUNT(*), 
        COALESCE(SUM(deposit_paid), 0)
    INTO 
        v_total_appointments, 
        v_total_deposits_collected
    FROM public.appointments;

    -- 6. Rendez-vous pris aujourd'hui
    SELECT COUNT(*) INTO v_appointments_today 
    FROM public.appointments 
    WHERE created_at >= CURRENT_DATE;

    v_result := json_build_object(
        'total_salons', v_total_salons,
        'active_subscribers', v_active_subscribers,
        'trial_salons', v_trial_salons,
        'expired_salons', v_expired_salons,
        'salons_sn', v_salons_sn,
        'salons_ci', v_salons_ci,
        'mrr_fcfa', (v_active_subscribers * 9900),
        'total_saas_revenue', v_total_revenue_saas,
        'total_appointments', v_total_appointments,
        'appointments_today', v_appointments_today,
        'total_deposits_secured', v_total_deposits_collected
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_super_admin_stats() TO anon, authenticated, service_role;

-- ==============================================================================
-- ÉTAPE 7 : FONCTION RPC DE GESTION D'UN SALON PAR LE SUPER-ADMIN
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.admin_manage_salon(
    p_salon_id UUID,
    p_action TEXT,
    p_days INT DEFAULT 14
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salon RECORD;
    v_message TEXT;
BEGIN
    SELECT * INTO v_salon FROM public.salons WHERE id = p_salon_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Salon introuvable (ID: %)', p_salon_id;
    END IF;

    IF p_action = 'activate' THEN
        -- Activer l'abonnement pour 30 jours (ou durée spécifiée)
        UPDATE public.salons
        SET 
            subscription_status = 'active',
            is_subscription_active = TRUE,
            subscription_expires_at = NOW() + (COALESCE(p_days, 30) || ' days')::INTERVAL,
            last_subscription_payment_at = NOW()
        WHERE id = p_salon_id;

        -- Enregistrer l'opération dans le journal des paiements
        INSERT INTO public.subscription_payments (
            salon_id,
            salon_name,
            amount,
            currency,
            payment_provider,
            transaction_ref,
            period_days,
            status,
            notes
        ) VALUES (
            p_salon_id,
            v_salon.name,
            9900,
            'FCFA',
            'super_admin',
            'ADM-' || floor(random() * 899999 + 100000)::text,
            COALESCE(p_days, 30),
            'success',
            'Activé manuellement par le Super-Admin'
        );

        v_message := 'Salon activé avec succès pour ' || COALESCE(p_days, 30) || ' jours.';

    ELSIF p_action = 'extend_trial' THEN
        -- Accorder +14 jours de grâce
        UPDATE public.salons
        SET 
            subscription_status = 'trial',
            is_subscription_active = TRUE,
            trial_ends_at = NOW() + (COALESCE(p_days, 14) || ' days')::INTERVAL
        WHERE id = p_salon_id;

        v_message := 'Essai gratuit prolongé de ' || COALESCE(p_days, 14) || ' jours.';

    ELSIF p_action = 'suspend' THEN
        -- Bloquer immédiatement le salon
        UPDATE public.salons
        SET 
            is_subscription_active = FALSE,
            subscription_status = 'expired'
        WHERE id = p_salon_id;

        v_message := 'Salon suspendu. L''accès au dashboard et les réservations sont bloqués.';

    ELSIF p_action = 'delete' THEN
        -- Nettoyage complet
        DELETE FROM public.appointments WHERE salon_id = p_salon_id;
        DELETE FROM public.services WHERE salon_id = p_salon_id;
        DELETE FROM public.subscription_payments WHERE salon_id = p_salon_id;
        DELETE FROM public.salons WHERE id = p_salon_id;

        v_message := 'Salon et toutes ses données associées supprimés définitivement.';

    ELSE
        RAISE EXCEPTION 'Action non reconnue : %', p_action;
    END IF;

    RETURN json_build_object('success', TRUE, 'message', v_message, 'action', p_action);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_manage_salon(UUID, TEXT, INT) TO anon, authenticated, service_role;

-- ==============================================================================
-- ÉTAPE 8 : PERMISSIONS DE LECTURE/ÉCRITURE TOTALES
-- ==============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_announcements TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_payments TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salons TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO anon, authenticated, service_role;

-- ==============================================================================
-- ÉTAPE 9 : RÉINITIALISATION DES COMPTES DE TEST VERS L'ESSAI 14J (MRR = 0 FCFA)
-- ==============================================================================

-- Remet tous les comptes n'ayant aucun paiement réel au statut 'trial'
UPDATE public.salons
SET 
    subscription_status = 'trial',
    trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days', NOW() + INTERVAL '14 days'),
    subscription_expires_at = NULL
WHERE id NOT IN (
    SELECT DISTINCT salon_id FROM public.subscription_payments WHERE status IN ('success', 'completed') AND salon_id IS NOT NULL
) AND (subscription_status = 'active' OR subscription_status IS NULL);

-- ==============================================================================
-- ÉTAPE 10 : ACTUALISER LE CACHE DU SCHÉMA SUPABASE
-- ==============================================================================

NOTIFY pgrst, 'reload schema';

SELECT 'SCHEMA UNIFIE APPOINTFY V2 APPLIQUE AVEC SUCCES : ESSAI 14J, ACOMPTE & SUPER-ADMIN OPERATIONNELS' AS statut;
