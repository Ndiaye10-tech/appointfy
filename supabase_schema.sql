-- ==================================================================
-- SCHEMA SQL OFFICIEL MIS A JOUR POUR ANTILAPIN
-- A exécuter dans Supabase > SQL Editor
-- ==================================================================

-- 1. Table des Salons (avec liaison gérant Supabase Auth)
CREATE TABLE IF NOT EXISTS public.salons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID,
    owner_email TEXT,
    owner_name TEXT,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    tagline TEXT,
    description TEXT,
    address TEXT,
    city TEXT DEFAULT 'Dakar, Sénégal',
    phone TEXT NOT NULL,
    whatsapp TEXT,
    rating NUMERIC(2,1) DEFAULT 4.9,
    reviews_count INT DEFAULT 168,
    deposit_rate NUMERIC(3,2) DEFAULT 0.20,
    hours TEXT,
    cover_image TEXT,
    avatar_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la table existait déjà, ajouter toutes les colonnes requises
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS owner_id UUID;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS owner_name TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'pink';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS gallery TEXT[];
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS welcome_message TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS announcement_banner TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS instagram TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS tiktok TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS facebook TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS policy_cancellation TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS schedule JSONB;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS slot_interval INT DEFAULT 45;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS reviews JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS hero_media_type TEXT DEFAULT 'photo';
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS hero_video_url TEXT;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS hero_carousel TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS story JSONB;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS team JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS lookbook JSONB DEFAULT '[]'::jsonb;

-- 2. Table des Prestations / Services (avec contrainte anti-prix négatifs)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    duration TEXT NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    deposit INT NOT NULL CHECK (deposit >= 0),
    popular BOOLEAN DEFAULT false,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Si la table services existait déjà, ajouter la colonne image_url et badge
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS badge TEXT;

-- 3. Table des Rendez-vous & Acomptes (Wave, Orange Money, Espèces)
CREATE TABLE IF NOT EXISTS public.appointments (
    id TEXT PRIMARY KEY, -- Ex: AL-9182
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    client_name TEXT NOT NULL,
    client_phone TEXT NOT NULL,
    service_id TEXT,
    service_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time_slot TEXT NOT NULL,
    price INT NOT NULL CHECK (price >= 0),
    deposit_paid INT NOT NULL CHECK (deposit_paid >= 0),
    remaining_balance INT NOT NULL CHECK (remaining_balance >= 0),
    payment_method TEXT NOT NULL, -- Wave, Orange Money, Espèces
    transaction_ref TEXT,
    status TEXT DEFAULT 'confirmed', -- confirmed | completed | no_show | cancelled
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Nettoyage des anciennes données factices éventuelles
DELETE FROM public.appointments WHERE id LIKE 'BK-%';

-- 5. Colonnes supplémentaires pour la gestion Genius Pay & Dates
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS date_formatted TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS client_email TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS geniuspay_reference TEXT;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'completed';

-- 6. Colonnes de Gestion du Modèle SaaS pour les Salons (Essai 30 jours puis 12 000 FCFA)
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days');
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial'; -- trial | active | expired
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_price INT DEFAULT 12000;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS last_subscription_payment TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.salons ADD COLUMN IF NOT EXISTS subscription_ref TEXT;

-- 7. Contrainte Anti-Double-Booking (Verrouillage strict des créneaux en base de données)
-- Empêche formellement d'avoir deux rendez-vous confirmés sur le même créneau pour un salon
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_confirmed_slot 
ON public.appointments (date, time_slot) 
WHERE status = 'confirmed';

-- 8. Index pour optimiser les performances de recherche du Planning
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_salon ON public.appointments(salon_id);

-- 9. Vue Statistiques & KPIs en temps réel pour le Dashboard Gérante
CREATE OR REPLACE VIEW public.salon_planning_metrics AS
SELECT 
    COALESCE(salon_id::text, 'default') as salon_id,
    COUNT(*) AS total_appointments,
    COUNT(*) FILTER (WHERE status = 'confirmed') AS upcoming_count,
    COUNT(*) FILTER (WHERE status = 'completed') AS completed_count,
    COUNT(*) FILTER (WHERE status = 'no_show') AS no_show_count,
    COUNT(*) FILTER (WHERE status = 'cancelled') AS cancelled_count,
    COALESCE(SUM(deposit_paid) FILTER (WHERE status IN ('confirmed', 'completed', 'no_show')), 0) AS total_deposits_secured,
    COALESCE(SUM(price) FILTER (WHERE status IN ('confirmed', 'completed')), 0) AS total_revenue_projected,
    COALESCE(SUM(remaining_balance) FILTER (WHERE status = 'confirmed'), 0) AS balance_to_collect_on_site,
    CASE 
        WHEN (COUNT(*) FILTER (WHERE status = 'completed') + COUNT(*) FILTER (WHERE status = 'no_show')) > 0 
        THEN ROUND(
            (COUNT(*) FILTER (WHERE status = 'completed')::NUMERIC / 
            (COUNT(*) FILTER (WHERE status = 'completed') + COUNT(*) FILTER (WHERE status = 'no_show'))::NUMERIC) * 100
        )
        ELSE 100
    END AS presence_rate
FROM public.appointments
GROUP BY salon_id;

-- 10. Activation de Row Level Security (RLS)
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour 'salons'
DROP POLICY IF EXISTS "Allow public read access on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow public insert on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow public update on salons" ON public.salons;

CREATE POLICY "Allow public read access on salons" ON public.salons FOR SELECT USING (true);
CREATE POLICY "Allow public insert on salons" ON public.salons FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on salons" ON public.salons FOR UPDATE USING (true);

-- Politiques RLS pour 'services'
DROP POLICY IF EXISTS "Allow public read on services" ON public.services;
DROP POLICY IF EXISTS "Allow public insert on services" ON public.services;
DROP POLICY IF EXISTS "Allow public update on services" ON public.services;
DROP POLICY IF EXISTS "Allow public delete on services" ON public.services;

CREATE POLICY "Allow public read on services" ON public.services FOR SELECT USING (true);
CREATE POLICY "Allow public insert on services" ON public.services FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on services" ON public.services FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on services" ON public.services FOR DELETE USING (true);

-- Politiques RLS pour 'appointments'
DROP POLICY IF EXISTS "Allow public read on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public delete on appointments" ON public.appointments;

CREATE POLICY "Allow public read on appointments" ON public.appointments FOR SELECT USING (true);
CREATE POLICY "Allow public insert on appointments" ON public.appointments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on appointments" ON public.appointments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete on appointments" ON public.appointments FOR DELETE USING (true);

-- 11. Activation du Temps Réel Supabase (Realtime)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.salons;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

-- 12. Rafraîchir le cache PostgREST
NOTIFY pgrst, 'reload schema';
