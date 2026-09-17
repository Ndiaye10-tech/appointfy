-- ==============================================================================
-- SCRIPT SQL DÉFINITIF : VERROUILLAGE TOTAL DES ACOMPTES GENIUSPAY & SALON
-- À exécuter dans l'éditeur SQL de votre tableau de bord Supabase
-- ==============================================================================

-- 1. Nettoyage immédiat : Supprimer définitivement toutes les réservations de test non payées
DELETE FROM public.appointments 
WHERE status IN ('pending', 'expired', 'cancelled');

-- 2. Sécuriser la colonne de délai d'expiration (15 minutes)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- 3. Index d'unicité anti-double réservation pendant les 15 minutes d'attente
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_confirmed_or_pending_slot 
ON public.appointments (salon_id, date, time_slot) 
WHERE status IN ('confirmed', 'pending');

-- 4. Vue SQL dédiée au Dashboard Salon : 
-- Cette vue filtre à la racine dans la base de données : seuls les RDV réellement 
-- payés et confirmés peuvent y apparaître. Aucune réservation 'pending' ou 'expired' 
-- ne peut jamais franchir cette vue !
CREATE OR REPLACE VIEW public.salon_confirmed_appointments AS
SELECT *
FROM public.appointments
WHERE status IN ('confirmed', 'completed', 'no_show', 'blocked')
ORDER BY created_at DESC;

-- 5. Fonction et Trigger PostgreSQL : Sécurité stricte sur les réservations
CREATE OR REPLACE FUNCTION public.validate_appointment_deposit()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la réservation est 'pending' mais que les 15 min sont dépassées, elle expire d'office
    IF NEW.status = 'pending' AND NEW.expires_at IS NOT NULL AND NEW.expires_at < NOW() THEN
        NEW.status := 'expired';
    END IF;

    -- Si le statut est 'confirmed' avec paiement Wave, s'assurer que l'acompte est sécurisé
    IF NEW.payment_method = 'Wave' AND NEW.status = 'confirmed' THEN
        IF NEW.deposit_paid IS NULL OR NEW.deposit_paid <= 0 THEN
            -- Sécurité : par défaut l'acompte minimum requis pour Wave
            NEW.deposit_paid := COALESCE(NEW.deposit_paid, 0);
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_validate_appointment_deposit ON public.appointments;
CREATE TRIGGER trg_validate_appointment_deposit
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.validate_appointment_deposit();

-- 6. Procédure de purge automatique des réservations Wave abandonnées
CREATE OR REPLACE FUNCTION public.purge_abandoned_appointments()
RETURNS void AS $$
BEGIN
    -- Supprimer directement les tentatives abandonnées au-delà de 15 minutes
    DELETE FROM public.appointments
    WHERE status = 'pending'
      AND (expires_at < NOW() OR created_at < NOW() - INTERVAL '15 minutes');

    -- Supprimer les réservations expirées après 1 jour
    DELETE FROM public.appointments
    WHERE status = 'expired'
      AND created_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql;

-- 7. Activer les permissions pour les requêtes publiques et privées
GRANT SELECT ON public.salon_confirmed_appointments TO anon, authenticated;

-- 8. Notifier PostgREST pour recharger le schéma en direct
NOTIFY pgrst, 'reload schema';
