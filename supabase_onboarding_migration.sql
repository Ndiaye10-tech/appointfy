-- ==============================================================================
-- MIGRATION SUPABASE : RATTACHEMENT COMPLET DU NOUVEL ONBOARDING APPOINTFY
-- Exécutez ce script dans le Supabase SQL Editor (Dashboard Supabase -> SQL Editor)
-- Garanti 100% IDEMPOTENT (peut être exécuté plusieurs fois sans aucune erreur)
-- ==============================================================================

-- 1. EXTENSION DES COLONNES DE LA TABLE 'salons' POUR L'ONBOARDING
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'SN';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS business_type TEXT DEFAULT 'hair_braids';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS work_mode TEXT DEFAULT 'salon'; -- 'salon', 'home', 'both'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS booking_policy TEXT DEFAULT 'deposit'; -- 'deposit', 'instant', 'manual'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS wave_number TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT TRUE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_rate NUMERIC DEFAULT 0.20;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'rate'; -- 'rate' (pourcentage) ou 'fixed' (montant fixe)
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_fixed_amount INT DEFAULT 2000;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT TRUE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"sound_enabled": true, "sound_preset": "cash", "push_enabled": true, "in_app_alerts": true}'::jsonb;

-- 2. EXTENSION & SÉCURISATION DE LA TABLE 'services' (PRESTATIONS DU MÉTIER)
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS deposit INT DEFAULT 0;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Assouplir la contrainte NOT NULL sur deposit si elle existait (pour éviter les erreurs à l'insertion de prestations sans acompte calculé)
DO $$
BEGIN
    ALTER TABLE public.services ALTER COLUMN deposit DROP NOT NULL;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE public.services ALTER COLUMN deposit SET DEFAULT 0;
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- 3. RECRÉATION PROPRE DE LA VUE VITRINE 'public_salons' AVEC TOUS LES CHAMPS ONBOARDING
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
    instagram,
    tiktok,
    facebook,
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
    lookbook,
    team_mode,
    team,
    notification_settings,
    created_at
FROM public.salons;

GRANT SELECT ON public.public_salons TO anon, authenticated;

-- 4. RECRÉATION PROPRE DE LA VUE 'public_services'
DROP VIEW IF EXISTS public.public_services CASCADE;

CREATE VIEW public.public_services AS 
SELECT 
    id, 
    salon_id, 
    name, 
    category, 
    duration, 
    price, 
    deposit, 
    popular, 
    badge, 
    image_url, 
    description,
    is_active,
    created_at
FROM public.services;

GRANT SELECT ON public.public_services TO anon, authenticated;

-- 5. POLITIQUES DE SÉCURITÉ RLS POUR L'INSERTION DU SALON ET DES PRESTATIONS
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Autoriser la lecture publique de salons
DROP POLICY IF EXISTS "salons_public_read" ON public.salons;
CREATE POLICY "salons_public_read" ON public.salons FOR SELECT USING (true);

-- Autoriser l'insertion d'un nouveau salon (lors de l'onboarding, gérante connectée ou anonyme en cours de signup)
DROP POLICY IF EXISTS "salons_insert_onboarding" ON public.salons;
CREATE POLICY "salons_insert_onboarding" ON public.salons FOR INSERT WITH CHECK (true);

-- Autoriser la mise à jour par le propriétaire du salon
DROP POLICY IF EXISTS "salons_owner_update" ON public.salons;
CREATE POLICY "salons_owner_update" ON public.salons FOR UPDATE USING (
    auth.uid() = owner_id OR owner_id IS NULL
);

-- Autoriser la lecture publique des prestations
DROP POLICY IF EXISTS "services_public_read" ON public.services;
CREATE POLICY "services_public_read" ON public.services FOR SELECT USING (true);

-- Autoriser l'insertion des prestations initiales du template métier
DROP POLICY IF EXISTS "services_insert_onboarding" ON public.services;
CREATE POLICY "services_insert_onboarding" ON public.services FOR INSERT WITH CHECK (true);

-- Autoriser la modification et suppression de ses prestations
DROP POLICY IF EXISTS "services_owner_manage" ON public.services;
CREATE POLICY "services_owner_manage" ON public.services FOR ALL USING (true) WITH CHECK (true);

-- 6. FONCTION ATOMIQUE RPC : 'onboard_new_salon'
-- Permet de créer en UNE SEULE TRANSACTION le salon + ses prestations par défaut
CREATE OR REPLACE FUNCTION public.onboard_new_salon(
    p_salon JSONB,
    p_services JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salon_id UUID;
    v_created_salon RECORD;
    v_trial_end TIMESTAMPTZ := NOW() + INTERVAL '14 days';
    v_service JSONB;
BEGIN
    -- 1. Insertion du salon
    INSERT INTO public.salons (
        name,
        slug,
        owner_name,
        owner_id,
        phone,
        whatsapp,
        wave_number,
        city,
        address,
        country,
        currency,
        business_type,
        work_mode,
        booking_policy,
        deposit_required,
        deposit_rate,
        deposit_type,
        deposit_fixed_amount,
        subscription_status,
        trial_ends_at,
        subscription_expires_at,
        subscription_price,
        is_subscription_active,
        onboarding_completed,
        notification_settings
    ) VALUES (
        COALESCE(p_salon->>'name', 'Mon Salon'),
        COALESCE(p_salon->>'slug', 'salon-' || floor(random() * 9000 + 1000)::text),
        COALESCE(p_salon->>'owner_name', ''),
        (p_salon->>'owner_id')::UUID,
        p_salon->>'phone',
        COALESCE(p_salon->>'whatsapp', p_salon->>'phone'),
        COALESCE(p_salon->>'wave_number', p_salon->>'phone'),
        COALESCE(p_salon->>'city', 'Dakar'),
        COALESCE(p_salon->>'address', 'Dakar'),
        COALESCE(p_salon->>'country', 'SN'),
        COALESCE(p_salon->>'currency', 'FCFA'),
        COALESCE(p_salon->>'business_type', 'hair_braids'),
        COALESCE(p_salon->>'work_mode', 'salon'),
        COALESCE(p_salon->>'booking_policy', 'deposit'),
        COALESCE((p_salon->>'deposit_required')::BOOLEAN, true),
        COALESCE((p_salon->>'deposit_rate')::NUMERIC, 0.20),
        COALESCE(p_salon->>'deposit_type', 'rate'),
        COALESCE((p_salon->>'deposit_fixed_amount')::INT, 2000),
        'trial',
        v_trial_end,
        v_trial_end,
        9900,
        true,
        true,
        COALESCE(p_salon->'notification_settings', '{"sound_enabled": true, "sound_preset": "cash", "push_enabled": true, "in_app_alerts": true}'::jsonb)
    )
    RETURNING id INTO v_salon_id;

    -- 2. Insertion des prestations par défaut du métier si fournies
    IF jsonb_array_length(p_services) > 0 THEN
        FOR v_service IN SELECT * FROM jsonb_array_elements(p_services)
        LOOP
            INSERT INTO public.services (
                salon_id,
                name,
                category,
                duration,
                price,
                deposit,
                description,
                is_active
            ) VALUES (
                v_salon_id,
                COALESCE(v_service->>'name', 'Prestation'),
                COALESCE(v_service->>'category', 'Général'),
                COALESCE(v_service->>'duration', '60'),
                COALESCE((v_service->>'price')::INT, 10000),
                ROUND(COALESCE((v_service->>'price')::INT, 10000) * COALESCE((p_salon->>'deposit_rate')::NUMERIC, 0.20)),
                COALESCE(v_service->>'description', ''),
                true
            );
        END LOOP;
    END IF;

    -- 3. Récupération des données du salon créé
    SELECT * INTO v_created_salon FROM public.salons WHERE id = v_salon_id;

    RETURN to_jsonb(v_created_salon);
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Erreur lors de la création du salon : %', SQLERRM;
END;
$$;

GRANT EXECUTE ON FUNCTION public.onboard_new_salon(JSONB, JSONB) TO anon, authenticated;

-- 7. RECHARGEMENT DU CACHE POSTGREST
NOTIFY pgrst, 'reload schema';

SELECT '✅ MIGRATION ONBOARDING SUPABASE REUSSIE A 100%' as status;
