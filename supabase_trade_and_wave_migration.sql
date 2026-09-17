-- ==============================================================================
-- MIGRATION SUPABASE : DISTINCTION BARBERSHOP HOMME VS STUDIO BEAUTÉ FÉMININE
-- À exécuter dans le Supabase SQL Editor
-- ==============================================================================

-- 1. Mise à jour de la colonne business_type avec valeur par défaut 'beauty_studio'
ALTER TABLE public.salons 
ALTER COLUMN business_type SET DEFAULT 'beauty_studio';

-- 2. Commentaires clairs pour documenter les types dans Supabase
COMMENT ON COLUMN public.salons.business_type IS 'Univers beauté : barber (Barbershop & Coiffure Homme), beauty_studio (Studio de Beauté Féminine : Coiffure, Ongles, Makeup, Cils & Soins), mixte (Salon Mixte Homme & Femme)';

-- 3. Migration des anciens enregistrements vers la nouvelle typologie
UPDATE public.salons
SET business_type = 'beauty_studio'
WHERE business_type IN ('hair', 'nails', 'makeup', 'spa', 'freelance')
   OR business_type IS NULL;

-- 4. Vérification du résultat
SELECT id, name, business_type, country, wave_number 
FROM public.salons 
LIMIT 10;
