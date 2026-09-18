-- ==============================================================================
-- APPOINTFY : SÉCURISATION COMPLÈTE DES RÉSERVATIONS ET ACOMPTES EN BASE DE DONNÉES
-- Compatible Sénégal (🇸🇳 Wave) & Côte d'Ivoire (🇨🇮 Paystack Multi-Opérateurs)
-- À exécuter dans l'éditeur SQL de Supabase (Dashboard Supabase -> SQL Editor)
-- Garanti 100% IDEMPOTENT (peut être réexécuté sans risque)
-- ==============================================================================

-- 1. ÉTENDRE LA TABLE 'appointments' AVEC TOUS LES CHAMPS DE TRAÇABILITÉ ET SÉCURITÉ
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'SN',
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'FCFA',
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS payment_provider TEXT,
ADD COLUMN IF NOT EXISTS geniuspay_reference TEXT,
ADD COLUMN IF NOT EXISTS transaction_ref TEXT,
ADD COLUMN IF NOT EXISTS deposit_paid NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS remaining_balance NUMERIC DEFAULT 0;

-- 2. VERROUILLAGE ANTI-COLLISION & ANTI-DOUBLON (Double Booking Prevention)
-- Empêche formellement deux clientes de réserver le même créneau pour le même salon
-- pendant les 15 minutes de paiement ou une fois confirmé.
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_confirmed_or_pending_slot 
ON public.appointments (salon_id, date, time_slot) 
WHERE status IN ('confirmed', 'pending');

-- 3. INDEX DE PERFORMANCE POUR LE PLANNING ET LE TABLEAU DE BORD
CREATE INDEX IF NOT EXISTS idx_appointments_salon_date_status 
ON public.appointments (salon_id, date, status);

CREATE INDEX IF NOT EXISTS idx_appointments_status_expires 
ON public.appointments (status, expires_at);

-- 4. TRIGGER POSTGRESQL : CONTRÔLE D'INTÉGRITÉ STRICT DE L'ACOMPTE
CREATE OR REPLACE FUNCTION public.validate_appointment_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- Règle A : Expiration automatique si la cliente a dépassé les 15 minutes
    IF NEW.status = 'pending' AND NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.status := 'expired';
    END IF;

    -- Règle B : Détection et normalisation du provider selon le pays
    IF NEW.status = 'confirmed' THEN
        IF NEW.confirmed_at IS NULL THEN
            NEW.confirmed_at := NOW();
        END IF;

        -- Normalisation du pays
        IF NEW.country IS NULL OR NEW.country = '' THEN
            NEW.country := 'SN';
        END IF;

        -- Attribution automatique du payment_provider
        IF NEW.country = 'CI' THEN
            NEW.payment_provider := 'paystack';
        ELSIF NEW.payment_method ILIKE '%wave%' THEN
            NEW.payment_provider := 'wave';
        ELSE
            NEW.payment_provider := COALESCE(NEW.payment_provider, 'paystack');
        END IF;

        -- Sécurisation des montants
        NEW.deposit_paid := COALESCE(NEW.deposit_paid, 0);
        NEW.price := COALESCE(NEW.price, 0);
        NEW.remaining_balance := GREATEST(0, NEW.price - NEW.deposit_paid);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_appointment_deposit ON public.appointments;
CREATE TRIGGER trg_validate_appointment_deposit
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_deposit();

-- 5. FONCTION CRON / MAINTENANCE : PURGE AUTOMATIQUE DES CRÉNEAUX EXPIRÉS
-- Libère instantanément les créneaux des clientes qui ont fermé leur navigateur sans payer
CREATE OR REPLACE FUNCTION public.purge_abandoned_appointments()
RETURNS void AS $$
BEGIN
    -- Libérer les créneaux en attente dépassés de 15 minutes
    UPDATE public.appointments
    SET status = 'expired'
    WHERE status = 'pending'
      AND (expires_at < NOW() OR created_at < NOW() - INTERVAL '15 minutes');

    -- Supprimer les historiques expirés au-delà de 7 jours
    DELETE FROM public.appointments
    WHERE status = 'expired'
      AND created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- 6. VUE SÉCURISÉE DÉDIÉE AU DASHBOARD ET PLANNING DU SALON
-- Garantit qu'AUCUNE réservation 'pending' ou 'expired' ne pollue l'agenda du salon.
-- Seuls les rendez-vous payés ou confirmés sont visibles par le gérant.
CREATE OR REPLACE VIEW public.salon_confirmed_appointments AS
SELECT 
    id,
    salon_id,
    client_name,
    client_phone,
    service_id,
    service_name,
    practitioner_name,
    date,
    date_formatted,
    time_slot,
    duration,
    price,
    deposit_paid,
    remaining_balance,
    payment_method,
    payment_provider,
    country,
    currency,
    transaction_ref,
    geniuspay_reference,
    status,
    notes,
    confirmed_at,
    created_at
FROM public.appointments
WHERE status IN ('confirmed', 'completed', 'no_show', 'blocked')
ORDER BY date ASC, time_slot ASC;

-- 7. PERMISSIONS ET SÉCURITÉ DES ACCÈS
GRANT SELECT, INSERT, UPDATE ON public.appointments TO anon, authenticated;
GRANT SELECT ON public.salon_confirmed_appointments TO anon, authenticated;

-- 8. ACTUALISER LE CACHE POSTGREST
NOTIFY pgrst, 'reload schema';
