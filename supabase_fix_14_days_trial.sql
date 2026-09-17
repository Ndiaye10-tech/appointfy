-- =========================================================================
-- MISE AU POINT : ESSAI GRATUIT STRICTEMENT DE 14 JOURS ET PRIX A 9 900 F
-- =========================================================================

-- 1. Realigner la periode d'essai de tous les salons en essai a 14 jours max depuis leur creation
UPDATE public.salons
SET 
  trial_ends_at = COALESCE(created_at, NOW()) + INTERVAL '14 days',
  subscription_expires_at = COALESCE(created_at, NOW()) + INTERVAL '14 days',
  subscription_price = 9900
WHERE subscription_status = 'trial' OR subscription_status IS NULL;

-- 2. Verrouiller la valeur par defaut pour les futurs salons a 14 jours et 9 900 FCFA
ALTER TABLE public.salons 
  ALTER COLUMN trial_ends_at SET DEFAULT (NOW() + INTERVAL '14 days'),
  ALTER COLUMN subscription_expires_at SET DEFAULT (NOW() + INTERVAL '14 days'),
  ALTER COLUMN subscription_price SET DEFAULT 9900;
