-- ==============================================================================
-- MIGRATION SUPABASE : VERROUILLAGE ABONNEMENT APRES 14 JOURS D'ESSAI
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query > Run
-- ==============================================================================

-- 1. Sécuriser les colonnes d'abonnement sur la table 'salons'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_price INT DEFAULT 9900;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '14 days');
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS is_subscription_active BOOLEAN DEFAULT true;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS last_subscription_payment_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS last_subscription_ref TEXT;

-- 2. Table pour l'historique des paiements d'abonnement Wave (exclusif)
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id TEXT PRIMARY KEY,
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    salon_name TEXT,
    amount INT NOT NULL,
    currency TEXT DEFAULT 'XOF',
    payment_method TEXT NOT NULL,
    transaction_ref TEXT,
    period_start TIMESTAMP WITH TIME ZONE,
    period_end TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index d'optimisation
CREATE INDEX IF NOT EXISTS idx_sub_payments_salon ON public.subscription_payments(salon_id);

-- 3. Mise à jour de la vue 'public_salons' pour inclure le statut d'abonnement
-- (Le DROP CASCADE préalable évite l'erreur PostgreSQL 42P16)
DROP VIEW IF EXISTS public.public_salons CASCADE;

CREATE VIEW public.public_salons AS
SELECT 
    id,
    name,
    slug,
    tagline,
    description,
    address,
    city,
    phone,
    whatsapp,
    instagram,
    tiktok,
    facebook,
    hours,
    schedule,
    slot_interval,
    rating,
    reviews_count,
    deposit_rate,
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
    team,
    lookbook,
    team_mode
FROM public.salons;

-- Donner l'accès en lecture à la vue publique
GRANT SELECT ON public.public_salons TO anon, authenticated;

-- 4. Recharger le cache du schéma de l'API Supabase
NOTIFY pgrst, 'reload schema';
