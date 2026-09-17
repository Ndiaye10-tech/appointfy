-- ==================================================================
-- MIGRATION SUPABASE : GESTION DES ABONNEMENTS SAAS (12 900 FCFA/MOIS)
-- À exécuter dans votre Supabase > SQL Editor
-- ==================================================================

-- 1. Ajout des colonnes d'abonnement sur la table des salons
ALTER TABLE public.salons 
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'trial', -- 'trial', 'active', 'past_due', 'expired'
ADD COLUMN IF NOT EXISTS subscription_price INT DEFAULT 12900,
ADD COLUMN IF NOT EXISTS trial_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
ADD COLUMN IF NOT EXISTS is_subscription_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS last_subscription_payment_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_subscription_ref TEXT;

-- 2. Table pour enregistrer chaque paiement d'abonnement (12 900 FCFA) encaissé par VOUS
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id TEXT PRIMARY KEY, -- Ex: SUB-10293
    salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
    salon_name TEXT NOT NULL,
    amount INT NOT NULL DEFAULT 12900,
    currency TEXT DEFAULT 'XOF',
    payment_method TEXT NOT NULL, -- 'Wave', 'Orange Money'
    transaction_ref TEXT,
    geniuspay_reference TEXT,
    period_start TIMESTAMP WITH TIME ZONE NOT NULL,
    period_end TIMESTAMP WITH TIME ZONE NOT NULL,
    status TEXT DEFAULT 'completed', -- 'completed', 'pending', 'failed'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Activer la réplication Realtime sur la table des paiements d'abonnements
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'subscription_payments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscription_payments;
  END IF;
END $$;

-- 4. Index de performance
CREATE INDEX IF NOT EXISTS idx_subscription_payments_salon_id ON public.subscription_payments(salon_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_created_at ON public.subscription_payments(created_at DESC);

-- 5. Politiques de sécurité (RLS)
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lecture paiements abonnements" ON public.subscription_payments;
CREATE POLICY "Lecture paiements abonnements" 
ON public.subscription_payments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Insertion paiements abonnements" ON public.subscription_payments;
CREATE POLICY "Insertion paiements abonnements" 
ON public.subscription_payments FOR INSERT 
WITH CHECK (true);
