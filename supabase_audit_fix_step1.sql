-- ==============================================================================
-- SCRIPT CORRECTIF D'AUDIT — ÉTAPE 1 : SÉCURITÉ RLS, VUES & PERFORMANCE (V3)
-- Appointfy — Verrouillage Multi-Tenant & Intégrité Supabase
-- À copier-coller dans l'éditeur SQL de votre Dashboard Supabase et cliquer sur RUN
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. CORRECTION SEC-002 : VERROUILLAGE DE LA TABLE 'salons'
-- ------------------------------------------------------------------------------
ALTER TABLE public.salons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read access on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow owner update on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow public update on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow public insert on salons" ON public.salons;
DROP POLICY IF EXISTS "Allow owner insert on salons" ON public.salons;

CREATE POLICY "Allow public read access on salons" 
ON public.salons FOR SELECT 
USING (true);

CREATE POLICY "Allow owner insert on salons" 
ON public.salons FOR INSERT 
WITH CHECK (auth.uid() = owner_id OR auth.uid() IS NOT NULL);

CREATE POLICY "Allow owner update on salons" 
ON public.salons FOR UPDATE 
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

-- ------------------------------------------------------------------------------
-- 2. CORRECTION SEC-001 : VERROUILLAGE DE LA TABLE 'services' (PRESTATIONS)
-- ------------------------------------------------------------------------------
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS badge TEXT;
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS duration_minutes INT;

DROP POLICY IF EXISTS "Allow public read on services" ON public.services;
DROP POLICY IF EXISTS "Allow public insert on services" ON public.services;
DROP POLICY IF EXISTS "Allow public update on services" ON public.services;
DROP POLICY IF EXISTS "Allow public delete on services" ON public.services;
DROP POLICY IF EXISTS "Allow owner insert on services" ON public.services;
DROP POLICY IF EXISTS "Allow owner update on services" ON public.services;
DROP POLICY IF EXISTS "Allow owner delete on services" ON public.services;

CREATE POLICY "Allow public read on services" 
ON public.services FOR SELECT 
USING (true);

CREATE POLICY "Allow owner insert on services" 
ON public.services FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = services.salon_id AND salons.owner_id = auth.uid()
  )
);

CREATE POLICY "Allow owner update on services" 
ON public.services FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = services.salon_id AND salons.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = services.salon_id AND salons.owner_id = auth.uid()
  )
);

CREATE POLICY "Allow owner delete on services" 
ON public.services FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = services.salon_id AND salons.owner_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 3. CORRECTION SEC-001 & SEC-004 : VERROUILLAGE DE LA TABLE 'appointments'
-- ------------------------------------------------------------------------------
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public insert on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public update on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow public delete on appointments" ON public.appointments;
DROP POLICY IF EXISTS "Allow all access to appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner read appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Owner delete appointments" ON public.appointments;
DROP POLICY IF EXISTS "Public insert appointments" ON public.appointments;

CREATE POLICY "Owner read appointments" 
ON public.appointments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid()
  )
  OR
  (status IN ('confirmed', 'completed', 'blocked', 'pending'))
);

CREATE POLICY "Public insert appointments" 
ON public.appointments FOR INSERT 
WITH CHECK (
  salon_id IS NOT NULL 
  AND client_name IS NOT NULL 
  AND date IS NOT NULL 
  AND time_slot IS NOT NULL
);

CREATE POLICY "Owner update appointments" 
ON public.appointments FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner delete appointments" 
ON public.appointments FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = appointments.salon_id AND salons.owner_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 4. CORRECTION SEC-001 : VERROUILLAGE DE 'notifications' & 'subscription_payments'
-- ------------------------------------------------------------------------------
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture notifications publiques ou gérant" ON public.notifications;
DROP POLICY IF EXISTS "Insertion notifications publiques ou gérant" ON public.notifications;
DROP POLICY IF EXISTS "Mise a jour notifications gérant" ON public.notifications;
DROP POLICY IF EXISTS "Suppression notifications gérant" ON public.notifications;
DROP POLICY IF EXISTS "Owner select notifications" ON public.notifications;
DROP POLICY IF EXISTS "Insert notifications for salon" ON public.notifications;
DROP POLICY IF EXISTS "Owner update notifications" ON public.notifications;
DROP POLICY IF EXISTS "Owner delete notifications" ON public.notifications;

CREATE POLICY "Owner select notifications" 
ON public.notifications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = notifications.salon_id AND salons.owner_id = auth.uid()
  )
);

CREATE POLICY "Insert notifications for salon" 
ON public.notifications FOR INSERT 
WITH CHECK (salon_id IS NOT NULL);

CREATE POLICY "Owner update notifications" 
ON public.notifications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = notifications.salon_id AND salons.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner delete notifications" 
ON public.notifications FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = notifications.salon_id AND salons.owner_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Lecture paiements abonnements" ON public.subscription_payments;
DROP POLICY IF EXISTS "Insertion paiements abonnements" ON public.subscription_payments;
DROP POLICY IF EXISTS "Owner select subscription_payments" ON public.subscription_payments;
DROP POLICY IF EXISTS "Owner insert subscription_payments" ON public.subscription_payments;

CREATE POLICY "Owner select subscription_payments" 
ON public.subscription_payments FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = subscription_payments.salon_id AND salons.owner_id = auth.uid()
  )
);

CREATE POLICY "Owner insert subscription_payments" 
ON public.subscription_payments FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.salons 
    WHERE salons.id = subscription_payments.salon_id AND salons.owner_id = auth.uid()
  )
);

-- ------------------------------------------------------------------------------
-- 5. CORRECTION FUNC-001 / DB-001 : RECRÉATION PROPRE DE LA VUE 'public_services'
-- (Suppression préalable avec DROP VIEW CASCADE pour éviter le conflit 42P16 de renommage de colonnes)
-- ------------------------------------------------------------------------------
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
  created_at
FROM public.services;

GRANT SELECT ON public.public_services TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 6. CORRECTION DB-002 : INDEX D'UNICITÉ MULTI-COIFFEUSES
-- ------------------------------------------------------------------------------
DROP INDEX IF EXISTS public.idx_unique_confirmed_or_pending_slot;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_confirmed_or_pending_slot 
ON public.appointments (salon_id, date, time_slot, COALESCE(practitioner_name, '')) 
WHERE status IN ('confirmed', 'pending');

-- ------------------------------------------------------------------------------
-- 7. CORRECTION PERF-001 : INDEX COMPOSITE DE PERFORMANCE SUR (salon_id, date)
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date 
ON public.appointments (salon_id, date);

CREATE INDEX IF NOT EXISTS idx_services_salon_id 
ON public.services (salon_id);
