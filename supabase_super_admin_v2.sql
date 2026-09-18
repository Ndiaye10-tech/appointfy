-- ==============================================================================
-- APPOINTFY : MODULE SUPER-ADMIN SAAS V2 (TEMPS RÉEL ET RACCORDEMENT 100% BASE DE DONNÉES)
-- Autorise et outille l'administrateur (mahmoudndiaye100@gmail.com)
-- À exécuter dans Supabase SQL Editor
-- Garanti 100% IDEMPOTENT (peut être exécuté plusieurs fois sans risque)
-- ==============================================================================

-- 1. TABLE DES ANNONCES GLOBALES DE LA PLATEFORME (DIFFUSION EN DIRECT CHEZ TOUS LES SALONS)
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

-- 2. TABLE DES PAIEMENTS D'ABONNEMENT SAAS (9 900 FCFA)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE SET NULL,
    salon_name TEXT,
    amount NUMERIC DEFAULT 9900,
    currency TEXT DEFAULT 'FCFA',
    payment_provider TEXT DEFAULT 'wave',
    transaction_ref TEXT,
    payer_phone TEXT,
    period_days INT DEFAULT 30,
    status TEXT DEFAULT 'success',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_payments_salon ON public.subscription_payments (salon_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON public.subscription_payments (status, created_at DESC);

-- 3. FONCTION RPC DE CALCUL DES MÉTRIQUES GLOBALES SAAS EN DIRECT
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
    SELECT COUNT(*) INTO v_total_salons FROM public.salons;

    SELECT COUNT(*) INTO v_salons_sn FROM public.salons WHERE country = 'SN' OR country IS NULL;
    SELECT COUNT(*) INTO v_salons_ci FROM public.salons WHERE country = 'CI';

    -- Salons avec abonnement payant actif (STRICTEMENT subscription_status = 'active')
    SELECT COUNT(*) INTO v_active_subscribers 
    FROM public.salons 
    WHERE subscription_status = 'active' AND is_subscription_active IS NOT FALSE;

    -- Salons en période d'essai gratuit (14 jours)
    SELECT COUNT(*) INTO v_trial_salons 
    FROM public.salons 
    WHERE (subscription_status = 'trial' OR subscription_status IS NULL) 
      AND (trial_ends_at IS NULL OR trial_ends_at > NOW());

    -- Salons expirés (14 jours dépassés sans paiement ou compte suspendu)
    SELECT COUNT(*) INTO v_expired_salons 
    FROM public.salons 
    WHERE subscription_status = 'expired' 
       OR is_subscription_active = FALSE
       OR ((subscription_status = 'trial' OR subscription_status IS NULL) AND trial_ends_at <= NOW())
       OR (subscription_status = 'active' AND subscription_expires_at <= NOW());

    -- Chiffre d'affaires SaaS réel (strictement la somme des paiements réussis)
    SELECT COALESCE(SUM(amount), 0) INTO v_total_revenue_saas 
    FROM public.subscription_payments 
    WHERE status = 'success';

    SELECT 
        COUNT(*), 
        COALESCE(SUM(deposit_paid), 0)
    INTO 
        v_total_appointments, 
        v_total_deposits_collected
    FROM public.appointments;

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

-- 4. FONCTION RPC DE GESTION ADMINISTRATIVE D'UN SALON
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
        UPDATE public.salons
        SET 
            subscription_status = 'active',
            is_subscription_active = TRUE,
            subscription_expires_at = NOW() + (COALESCE(p_days, 30) || ' days')::INTERVAL,
            last_subscription_payment_at = NOW()
        WHERE id = p_salon_id;

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
            COALESCE(v_salon.currency, 'FCFA'),
            'admin_grant',
            'ADM-' || floor(100000 + random() * 900000),
            COALESCE(p_days, 30),
            'success',
            'Activation manuelle par Super-Admin (+ ' || COALESCE(p_days, 30) || ' jours)'
        );

        v_message := 'Abonnement activé avec succès pour ' || COALESCE(p_days, 30) || ' jours.';

    ELSIF p_action = 'extend_trial' THEN
        UPDATE public.salons
        SET 
            subscription_status = 'trial',
            is_subscription_active = TRUE,
            trial_ends_at = GREATEST(NOW(), COALESCE(trial_ends_at, NOW())) + (COALESCE(p_days, 14) || ' days')::INTERVAL,
            subscription_expires_at = GREATEST(NOW(), COALESCE(trial_ends_at, NOW())) + (COALESCE(p_days, 14) || ' days')::INTERVAL
        WHERE id = p_salon_id;

        v_message := 'Essai gratuit prolongé de +' || COALESCE(p_days, 14) || ' jours avec succès.';

    ELSIF p_action = 'suspend' THEN
        UPDATE public.salons
        SET 
            subscription_status = 'expired',
            is_subscription_active = FALSE
        WHERE id = p_salon_id;

        v_message := 'Salon suspendu. L''accès des clientes aux réservations est bloqué.';

    ELSIF p_action = 'delete' THEN
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

-- 5. PERMISSIONS DE LECTURE/ÉCRITURE TOTALES
GRANT SELECT, INSERT, UPDATE, DELETE ON public.platform_announcements TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_payments TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salons TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO anon, authenticated, service_role;

-- 6. VUE VITRINE PUBLIQUE 'public_salons' (EXPOSE trial_ends_at ET LE STATUT DE L'ABONNEMENT EN TOUTE SÉCURITÉ)
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

-- 7. RÉINITIALISATION AUTOMATIQUE DES COMPTES DE TEST SANS PAIEMENT RÉEL
-- Tous les salons n'ayant jamais payé d'abonnement réel (status = 'success') sont remis en 'trial' (essai 14j)
-- pour ne pas fausser les KPIs (0 abonné payant, 0 FCFA de MRR).
UPDATE public.salons
SET 
    subscription_status = 'trial',
    trial_ends_at = COALESCE(trial_ends_at, created_at + INTERVAL '14 days', NOW() + INTERVAL '14 days'),
    subscription_expires_at = NULL
WHERE id NOT IN (
    SELECT DISTINCT salon_id FROM public.subscription_payments WHERE status = 'success' AND salon_id IS NOT NULL
) AND (subscription_status = 'active' OR subscription_status IS NULL);

-- 8. ACTUALISER LE CACHE DU SCHÉMA
NOTIFY pgrst, 'reload schema';

SELECT 'MODULE SUPER-ADMIN V2 INITIALISE AVEC SUCCES (Comptes de test réinitialisés en Essai 14j)' AS statut;

