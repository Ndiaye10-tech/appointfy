-- ==================================================================
-- MIGRATION SUPABASE : STOCKAGE DES NOTIFICATIONS ET PARAMÈTRES PWA
-- À exécuter dans votre Supabase > SQL Editor
-- ==================================================================

-- 1. Ajout de la colonne des préférences de notification sur la table des salons
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{
  "sound_enabled": true,
  "sound_volume": 1.0,
  "sound_preset": "chime",
  "push_enabled": true,
  "pwa_installed": false
}'::jsonb;

-- 2. Table dédiée à l'historique complet des notifications du salon
CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'booking', -- 'booking', 'cancellation', 'reminder', 'system'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    appointment_id TEXT,
    client_name TEXT,
    service_name TEXT,
    time_slot TEXT,
    deposit_paid INT DEFAULT 0,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Activer la réplication Realtime sur la table des notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

-- 4. Index de performance
CREATE INDEX IF NOT EXISTS idx_notifications_salon_id ON public.notifications(salon_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- 5. Sécurité RLS (Row Level Security) permissif pour le salon
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture notifications publiques ou gérant" ON public.notifications;
CREATE POLICY "Lecture notifications publiques ou gérant" 
ON public.notifications FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insertion notifications publiques ou gérant" ON public.notifications;
CREATE POLICY "Insertion notifications publiques ou gérant" 
ON public.notifications FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Mise a jour notifications gérant" ON public.notifications;
CREATE POLICY "Mise a jour notifications gérant" 
ON public.notifications FOR UPDATE 
USING (true);

DROP POLICY IF EXISTS "Suppression notifications gérant" ON public.notifications;
CREATE POLICY "Suppression notifications gérant" 
ON public.notifications FOR DELETE 
USING (true);
