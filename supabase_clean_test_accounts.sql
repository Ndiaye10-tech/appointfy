-- ==============================================================================
-- SCRIPT DE NETTOYAGE COMPLET & ATTRIBUTION DES DROITS SUPER ADMIN
-- Conserve EXCLUSIVEMENT le compte : mahmoudndiaye100@gmail.com
-- Supprime tous les faux comptes, salons et données de test
-- Attribue les droits Super Admin / Abonnement à vie gratuit illimité
-- ==============================================================================

DO $$
DECLARE
    v_admin_user_id UUID;
    v_kept_salon_id UUID;
    v_deleted_users_count INT;
    v_deleted_salons_count INT;
BEGIN
    -- 1. Récupérer l'ID Auth de mahmoudndiaye100@gmail.com
    SELECT id INTO v_admin_user_id 
    FROM auth.users 
    WHERE LOWER(email) = 'mahmoudndiaye100@gmail.com'
    LIMIT 1;

    -- Si l'utilisateur n'est pas encore dans auth.users
    IF v_admin_user_id IS NULL THEN
        RAISE EXCEPTION 'ATTENTION : Aucun compte auth trouvé avec l''email mahmoudndiaye100@gmail.com dans auth.users. Veuillez d''abord vous inscrire/connecter avec cet email, puis relancer ce script.';
    END IF;

    RAISE NOTICE '✅ Compte Admin identifié avec l''ID : %', v_admin_user_id;

    -- 2. Trouver ou associer le salon de cet utilisateur
    -- On recherche le salon dont owner_id = v_admin_user_id ou dont le nom correspond à Mamadou Ndiaye
    SELECT id INTO v_kept_salon_id 
    FROM public.salons 
    WHERE owner_id = v_admin_user_id 
       OR slug LIKE '%mamadou-ndiaye%' 
    ORDER BY created_at DESC 
    LIMIT 1;

    -- Si le salon a été trouvé, on s'assure qu'il est rattaché à son owner_id
    IF v_kept_salon_id IS NOT NULL THEN
        UPDATE public.salons 
        SET 
            owner_id = v_admin_user_id,
            owner_email = 'mahmoudndiaye100@gmail.com',
            owner_name = COALESCE(owner_name, 'Mamadou Ndiaye'),
            subscription_status = 'active',
            is_subscription_active = TRUE,
            trial_ends_at = NOW() + INTERVAL '100 years',
            subscription_expires_at = NOW() + INTERVAL '100 years',
            subscription_price = 0
        WHERE id = v_kept_salon_id;

        RAISE NOTICE '✅ Salon principal conservé et configuré en ADMIN ILLIMITÉ (ID: %)', v_kept_salon_id;

        -- 3. Supprimer tous les AUTRES salons de test (Beauty Africa, Ya Fa Beauty, etc.)
        DELETE FROM public.salons 
        WHERE id != v_kept_salon_id;

        GET DIAGNOSTICS v_deleted_salons_count = ROW_COUNT;
        RAISE NOTICE '🗑️ Salons de test supprimés : %', v_deleted_salons_count;
    ELSE
        -- Aucun salon rattaché : on supprime tous les salons de test existants
        DELETE FROM public.salons;
        RAISE NOTICE '🗑️ Tous les anciens salons de test ont été purgés.';
    END IF;

    -- 4. Nettoyer les rendez-vous, produits et staff orphelins
    DELETE FROM public.appointments WHERE salon_id != v_kept_salon_id OR salon_id IS NULL;
    DELETE FROM public.services WHERE salon_id != v_kept_salon_id OR salon_id IS NULL;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        DELETE FROM public.products WHERE salon_id != v_kept_salon_id OR salon_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'salon_staff') THEN
        DELETE FROM public.salon_staff WHERE salon_id != v_kept_salon_id OR salon_id IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'client_loyalty') THEN
        DELETE FROM public.client_loyalty WHERE salon_id != v_kept_salon_id OR salon_id IS NULL;
    END IF;

    -- 5. Supprimer tous les AUTRES comptes utilisateurs de test dans auth.users
    DELETE FROM auth.users 
    WHERE id != v_admin_user_id;

    GET DIAGNOSTICS v_deleted_users_count = ROW_COUNT;
    RAISE NOTICE '🗑️ Comptes de test supprimés de auth.users : %', v_deleted_users_count;

END $$;

-- Recharger le schéma PostgREST
NOTIFY pgrst, 'reload schema';

SELECT 
    'PURGE REUSSIE : Seul le compte mahmoudndiaye100@gmail.com est conserve avec droits Admin a vie' AS statut;
