-- ==============================================================================
-- MIGRATION SUPABASE : PARAMÈTRES DU SALON & RÈGLES DE RÉSERVATION
-- À exécuter dans votre projet Supabase : Dashboard > SQL Editor > Run
-- ==============================================================================

-- 1. Ajout des colonnes directes de Paramètres & Coordonnées sur la table 'salons'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS city TEXT DEFAULT 'Dakar';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS tagline TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS description TEXT;

-- Réseaux sociaux
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Règles d'acompte & politique d'annulation
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_rate NUMERIC(3,2) DEFAULT 0.20;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS policy_cancellation TEXT DEFAULT 'Annulation sans frais possible jusqu''à 24h avant le rendez-vous.';

-- Stockage JSONB pour les paramètres étendus (règles de réservation, WhatsApp, caisse sur place, notifications)
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "depositRequired": true,
  "depositType": "rate",
  "depositFixedAmount": 2000,
  "minLeadHours": 2,
  "latenessTolerance": 15,
  "acceptCash": true,
  "acceptWave": true,
  "paymentRecipientPhone": "",
  "sendDigitalReceipt": true,
  "whatsappConfirmEnabled": true,
  "whatsappReminderEnabled": true,
  "whatsappReminderHours": 24,
  "whatsappTemplate": "Bonjour {nom_cliente} ! Votre rendez-vous pour {prestation} chez {nom_salon} est confirmé pour le {date} à {heure}. Acompte Wave validé. Merci et à très vite !"
}'::jsonb;

-- Horaires & créneaux
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS schedule JSONB;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS slot_interval INT DEFAULT 45;

-- 2. Mise à jour de la vue publique 'public_salons' pour les réservations clientes
-- Permet aux clientes de lire les coordonnées, réseaux, taux d'acompte et politique d'annulation
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

-- Donner l'accès en lecture publique à la vue
GRANT SELECT ON public.public_salons TO anon, authenticated;

-- 3. Politiques de Sécurité Row Level Security (RLS) pour les Salons
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

-- Lecture publique pour la navigation et les pages des salons
DROP POLICY IF EXISTS "Allow public read access on salons" ON public.salons;
CREATE POLICY "Allow public read access on salons" 
ON public.salons FOR SELECT 
USING (true);

-- Mise à jour : autorisée pour le propriétaire connecté (ou fallback si admin)
DROP POLICY IF EXISTS "Allow owner update on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow public update on salons" ON public.salons;

CREATE POLICY "Allow owner update on salons" 
ON public.salons FOR UPDATE 
USING (
  auth.uid() = owner_id 
  OR owner_id IS NULL 
  OR auth.role() = 'authenticated'
)
WITH CHECK (
  auth.uid() = owner_id 
  OR owner_id IS NULL 
  OR auth.role() = 'authenticated'
);

-- 4. Recharger le cache du schéma de l'API Supabase
NOTIFY pgrst, 'reload schema';
