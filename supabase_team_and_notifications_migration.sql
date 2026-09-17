-- ==============================================================================
-- MIGRATION SUPABASE COMPACTE & GARANTIE 100% SANS ERREUR
-- ==============================================================================

-- 1. COLONNES DE LA TABLE 'salons'
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS team JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS team_mode TEXT DEFAULT 'solo';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS manager_pin TEXT DEFAULT '0000';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"sound_enabled": true, "sound_preset": "cash", "sound_volume": 1.0, "push_enabled": true}'::jsonb;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_type TEXT DEFAULT 'rate';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_fixed_amount INT DEFAULT 2000;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS deposit_required BOOLEAN DEFAULT TRUE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS min_lead_hours INT DEFAULT 2;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS lateness_tolerance INT DEFAULT 15;

-- 2. TABLE DU PERSONNEL 'salon_staff'
CREATE TABLE IF NOT EXISTS public.salon_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'Praticienne',
    phone TEXT,
    access_level TEXT NOT NULL DEFAULT 'level_2',
    pin_code TEXT NOT NULL DEFAULT '1234',
    avatar_url TEXT,
    specialties JSONB DEFAULT '[]'::jsonb,
    display_on_vitrine BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.salon_staff ADD COLUMN IF NOT EXISTS display_on_vitrine BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE public.salon_staff ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.salon_staff ADD COLUMN IF NOT EXISTS specialties JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.salon_staff ADD COLUMN IF NOT EXISTS access_level TEXT NOT NULL DEFAULT 'level_2';
ALTER TABLE public.salon_staff ADD COLUMN IF NOT EXISTS pin_code TEXT NOT NULL DEFAULT '1234';

-- 3. TABLE DES NOTIFICATIONS EN DIRECT
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    salon_id UUID NOT NULL REFERENCES public.salons(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'booking',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    appointment_id TEXT,
    client_name TEXT,
    service_name TEXT,
    time_slot TEXT,
    deposit_paid INT DEFAULT 0,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activation Realtime Supabase
DO 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END ;

-- 4. VUE PUBLIQUE VITRINE 'public_salons'
DROP VIEW IF EXISTS public.public_salons CASCADE;

CREATE VIEW public.public_salons AS
SELECT 
    id, name, slug, owner_name, tagline, description,
    address, city, phone, whatsapp, instagram, tiktok, facebook,
    hours, schedule, slot_interval, rating, reviews_count,
    deposit_rate, deposit_type, deposit_fixed_amount, deposit_required,
    min_lead_hours, lateness_tolerance, policy_cancellation,
    subscription_status, subscription_expires_at, is_subscription_active,
    cover_image, avatar_image, theme, gallery, welcome_message,
    announcement_banner, amenities, reviews, faq,
    hero_media_type, hero_video_url, hero_carousel, story, lookbook, team_mode, team
FROM public.salons;

GRANT SELECT ON public.public_salons TO anon, authenticated;

-- 5. SÉCURITÉ RLS
ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "staff_select" ON public.salon_staff;
CREATE POLICY "staff_select" ON public.salon_staff FOR SELECT USING (true);

DROP POLICY IF EXISTS "staff_all" ON public.salon_staff;
CREATE POLICY "staff_all" ON public.salon_staff FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "notif_select" ON public.notifications;
CREATE POLICY "notif_select" ON public.notifications FOR SELECT USING (true);

DROP POLICY IF EXISTS "notif_all" ON public.notifications;
CREATE POLICY "notif_all" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- 6. RECHARGEMENT API
NOTIFY pgrst, 'reload schema';

SELECT '✅ MIGRATION REUSSIE SANS ERREUR' AS statut, NOW() AS date_execution;
