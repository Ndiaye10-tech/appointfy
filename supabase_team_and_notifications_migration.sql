-- ==============================================================================
-- MIGRATION SUPABASE : ÉQUIPE, DROITS (RBAC), VITRINE & SYSTÈME DE NOTIFICATIONS
-- À exécuter dans votre projet Supabase > SQL Editor
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. EXTENSIONS ET COLONNES NÉCESSAIRES DANS LA TABLE 'salons'
-- ------------------------------------------------------------------------------
DO 
BEGIN
  -- A. Colonnes Équipe, Droits & Vitrine
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'team') THEN
    ALTER TABLE public.salons ADD COLUMN team JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'team_mode') THEN
    ALTER TABLE public.salons ADD COLUMN team_mode TEXT DEFAULT 'solo';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'manager_pin') THEN
    ALTER TABLE public.salons ADD COLUMN manager_pin TEXT DEFAULT '0000';
  END IF;

  -- B. Colonnes Notifications & Alertes Sonores
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'notification_settings') THEN
    ALTER TABLE public.salons ADD COLUMN notification_settings JSONB DEFAULT '{
      "sound_enabled": true,
      "sound_volume": 1.0,
      "sound_preset": "cash",
      "push_enabled": true,
      "pwa_installed": false
    }'::jsonb;
  END IF;

  -- C. Colonnes de Gestion des Acomptes & Délais
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'deposit_type') THEN
    ALTER TABLE public.salons ADD COLUMN deposit_type TEXT DEFAULT 'rate';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'deposit_fixed_amount') THEN
    ALTER TABLE public.salons ADD COLUMN deposit_fixed_amount INT DEFAULT 2000;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'deposit_required') THEN
    ALTER TABLE public.salons ADD COLUMN deposit_required BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'min_lead_hours') THEN
    ALTER TABLE public.salons ADD COLUMN min_lead_hours INT DEFAULT 2;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'salons' AND column_name = 'lateness_tolerance') THEN
    ALTER TABLE public.salons ADD COLUMN lateness_tolerance INT DEFAULT 15;
  END IF;
END ;


-- ------------------------------------------------------------------------------
-- 2. TABLE DU PERSONNEL : 'salon_staff' (ÉQUIPE & DROITS)
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON public.salon_staff(salon_id);
CREATE INDEX IF NOT EXISTS idx_staff_active ON public.salon_staff(salon_id, is_active);


-- ------------------------------------------------------------------------------
-- 3. TABLE DES NOTIFICATIONS EN TEMPS RÉEL : 'notifications'
-- ------------------------------------------------------------------------------
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

CREATE INDEX IF NOT EXISTS idx_notifications_salon_id ON public.notifications(salon_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(salon_id, is_read);

-- Publication Realtime pour synchronisation instantanée
DO 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END ;


-- ------------------------------------------------------------------------------
-- 4. VUE PUBLIQUE SÉCURISÉE SANS CODE PIN : 'public_salons'
-- ------------------------------------------------------------------------------
DROP VIEW IF EXISTS public.public_salons CASCADE;

CREATE VIEW public.public_salons AS
SELECT 
    s.id,
    s.name,
    s.slug,
    s.owner_name,
    s.tagline,
    s.description,
    s.address,
    s.city,
    s.phone,
    s.whatsapp,
    s.instagram,
    s.tiktok,
    s.facebook,
    s.hours,
    s.schedule,
    s.slot_interval,
    s.rating,
    s.reviews_count,
    s.deposit_rate,
    s.deposit_type,
    s.deposit_fixed_amount,
    s.deposit_required,
    s.min_lead_hours,
    s.lateness_tolerance,
    s.policy_cancellation,
    s.subscription_status,
    s.subscription_expires_at,
    s.is_subscription_active,
    s.cover_image,
    s.avatar_image,
    s.theme,
    s.gallery,
    s.welcome_message,
    s.announcement_banner,
    s.amenities,
    s.reviews,
    s.faq,
    s.hero_media_type,
    s.hero_video_url,
    s.hero_carousel,
    s.story,
    s.lookbook,
    s.team_mode,
    COALESCE(
      (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', elem->>'id',
            'name', elem->>'name',
            'role', elem->>'role',
            'avatar', COALESCE(elem->>'avatar', elem->>'image'),
            'specialties', elem->'specialties'
          )
        )
        FROM jsonb_array_elements(s.team) elem
      ),
      '[]'::jsonb
    ) AS team
FROM public.salons s;

GRANT SELECT ON public.public_salons TO anon, authenticated;


-- ------------------------------------------------------------------------------
-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read staff showcase" ON public.salon_staff;
CREATE POLICY "Public read staff showcase" 
ON public.salon_staff FOR SELECT 
USING (is_active = true AND display_on_vitrine = true);

DROP POLICY IF EXISTS "Owners manage salon staff" ON public.salon_staff;
CREATE POLICY "Owners manage salon staff" 
ON public.salon_staff FOR ALL 
USING (true) 
WITH CHECK (true);

DROP POLICY IF EXISTS "Salon notifications select" ON public.notifications;
CREATE POLICY "Salon notifications select" 
ON public.notifications FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Salon notifications insert" ON public.notifications;
CREATE POLICY "Salon notifications insert" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Salon notifications update" ON public.notifications;
CREATE POLICY "Salon notifications update" 
ON public.notifications FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Salon notifications delete" ON public.notifications;
CREATE POLICY "Salon notifications delete" 
ON public.notifications FOR DELETE 
USING (true);


-- ------------------------------------------------------------------------------
-- 6. RECHARGEMENT DU CACHE DU SCHÉMA POSTGREST
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';

SELECT '✅ MIGRATION REUSSIE' AS statut, NOW() AS date_execution;
