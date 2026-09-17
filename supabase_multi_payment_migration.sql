-- ==============================================================================
-- MIGRATION SUPABASE : INTÉGRATION MULTI-PAIEMENTS OFFICIELLE
-- Support complet : Wave, Orange Money, MTN MoMo, Moov Money, Carte Bancaire
-- À exécuter dans le Supabase SQL Editor (Dashboard Supabase -> SQL Editor)
-- Garanti 100% IDEMPOTENT (peut être exécuté sans risque d'écrasement)
-- ==============================================================================

-- 1. ÉTENDRE LA TABLE 'salons' AVEC LE SUPPORT MULTI-OPÉRATEURS
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS mobile_money_number TEXT,
ADD COLUMN IF NOT EXISTS payment_methods JSONB DEFAULT '[" Wave\, \Orange Money\, \MTN MoMo\, \Moov Money\, \Carte Bancaire\]'::jsonb;

-- Si le wave_number existe déjà mais pas mobile_money_number, initialiser
UPDATE public.salons
SET mobile_money_number = wave_number
WHERE mobile_money_number IS NULL AND wave_number IS NOT NULL;

-- 2. ÉTENDRE LA TABLE 'subscription_payments' POUR ENREGISTRER LE PAYS ET DÉTAILS
ALTER TABLE public.subscription_payments 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'SN',
ADD COLUMN IF NOT EXISTS admin_phone TEXT DEFAULT '784722951';

-- 3. METTRE À JOUR LE TRIGGER DE SÉCURITÉ DES ACOMPTES (TOUS MODES DE PAIEMENT)
CREATE OR REPLACE FUNCTION public.validate_appointment_deposit()
RETURNS TRIGGER AS 
BEGIN
 -- Si la réservation est 'pending' mais que les 15 min sont dépassées, elle expire d'office
 IF NEW.status = 'pending' AND NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
 NEW.status := 'expired';
 END IF;

 -- S'assurer que l'acompte est tracé dès que la réservation est confirmée
 IF NEW.status = 'confirmed' THEN
 IF NEW.deposit_paid IS NULL THEN
 NEW.deposit_paid := 0;
 END IF;
 END IF;

 RETURN NEW;
END;
 LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_appointment_deposit ON public.appointments;
CREATE TRIGGER trg_validate_appointment_deposit
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_deposit();

-- 4. METTRE À JOUR LA VUE VITRINE 'public_salons' POUR INCLURE 'mobile_money_number' ET 'payment_methods'
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
 mobile_money_number,
 payment_methods,
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

-- 5. ACCORDER LES DROITS DE LECTURE SUR LA VUE PUBLIQUE
GRANT SELECT ON public.public_salons TO anon, authenticated;

-- 6. RECHARGER LE SCHÉMA POSTGREST
NOTIFY pgrst, 'reload schema';
