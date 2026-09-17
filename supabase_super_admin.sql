-- ==============================================================================
-- MODULE SUPER-ADMIN SAAS APPOINTFY
-- Autorise et outille mahmoudndiaye100@gmail.com pour piloter toute la plateforme
-- ==============================================================================

-- 1. FONCTION RPC DE CALCUL DES MÉTRIQUES GLOBALES SAAS (POUR LE FONDATEUR)
CREATE OR REPLACE FUNCTION public.get_super_admin_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_salons INT := 0;
    v_active_subscribers INT := 0;
    v_trial_salons INT := 0;
    v_expired_salons INT := 0;
    v_monthly_revenue INT := 0;
    v_total_appointments INT := 0;
    v_total_deposits_collected INT := 0;
    v_result JSON;
BEGIN
    -- Nombre total de salons
    SELECT COUNT(*) INTO v_total_salons FROM public.salons;

    -- Salons avec abonnement payant actif
    SELECT COUNT(*) INTO v_active_subscribers 
    FROM public.salons 
    WHERE subscription_status = 'active' OR is_subscription_active = TRUE;

    -- Salons en période d'essai
    SELECT COUNT(*) INTO v_trial_salons 
    FROM public.salons 
    WHERE subscription_status = 'trial' 
      AND (trial_ends_at IS NULL OR trial_ends_at > NOW());

    -- Salons expirés
    SELECT COUNT(*) INTO v_expired_salons 
    FROM public.salons 
    WHERE subscription_status = 'expired' 
       OR (subscription_status = 'trial' AND trial_ends_at <= NOW());

    -- Calcul du MRR récurrent (abonnements mensuels à 9 900 FCFA)
    v_monthly_revenue := v_active_subscribers * 9900;

    -- Rendez-vous et volume global traité
    SELECT COUNT(*), COALESCE(SUM(deposit_paid), 0)
    INTO v_total_appointments, v_total_deposits_collected
    FROM public.appointments;

    v_result := json_build_object(
        'total_salons', v_total_salons,
        'active_subscribers', v_active_subscribers,
        'trial_salons', v_trial_salons,
        'expired_salons', v_expired_salons,
        'mrr_fcfa', v_monthly_revenue,
        'total_appointments', v_total_appointments,
        'total_deposits_secured', v_total_deposits_collected
    );

    RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_super_admin_stats() TO anon, authenticated, service_role;


-- 2. FONCTION RPC D'ACTIONS SUPER-ADMIN SUR UN SALON (PROLONGER, ACTIVER, SUSPENDRE)
CREATE OR REPLACE FUNCTION public.admin_manage_salon(
    p_salon_id UUID,
    p_action TEXT, -- 'activate', 'extend_trial', 'suspend'
    p_days INT DEFAULT 14
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_salon RECORD;
    v_message TEXT;
BEGIN
    SELECT * INTO v_salon FROM public.salons WHERE id = p_salon_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Salon introuvable (ID: %)', p_salon_id;
    END IF;

    IF p_action = 'activate' THEN
        -- Activation d'un abonnement 30 jours (ou paiement hors-ligne reçu)
        UPDATE public.salons
        SET 
            subscription_status = 'active',
            is_subscription_active = TRUE,
            subscription_expires_at = NOW() + (COALESCE(p_days, 30) || ' days')::INTERVAL,
            last_subscription_payment = NOW()
        WHERE id = p_salon_id;
        v_message := 'Abonnement activé avec succès pour ' || COALESCE(p_days, 30) || ' jours.';

    ELSIF p_action = 'extend_trial' THEN
        -- Prolonger l'essai gratuit de X jours
        UPDATE public.salons
        SET 
            subscription_status = 'trial',
            is_subscription_active = TRUE,
            trial_ends_at = GREATEST(NOW(), COALESCE(trial_ends_at, NOW())) + (p_days || ' days')::INTERVAL
        WHERE id = p_salon_id;
        v_message := 'Essai gratuit prolongé de +' || p_days || ' jours avec succès.';

    ELSIF p_action = 'suspend' THEN
        -- Suspendre le compte
        UPDATE public.salons
        SET 
            subscription_status = 'expired',
            is_subscription_active = FALSE
        WHERE id = p_salon_id;
        v_message := 'Salon suspendu.';
    ELSE
        RAISE EXCEPTION 'Action non reconnue : %', p_action;
    END IF;

    RETURN json_build_object('success', TRUE, 'message', v_message, 'action', p_action);
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_manage_salon(UUID, TEXT, INT) TO anon, authenticated, service_role;


-- 3. POLITIQUES RLS ÉTENDUES POUR LE SUPER-ADMIN SUR SALONS ET APPOINTMENTS
-- Autorise mahmoudndiaye100@gmail.com à voir et administrer tous les salons
DO $$
BEGIN
    DROP POLICY IF EXISTS "Super Admin full control on salons" ON public.salons;
    CREATE POLICY "Super Admin full control on salons" 
    ON public.salons FOR ALL 
    USING (
        auth.jwt() ->> 'email' = 'mahmoudndiaye100@gmail.com'
        OR auth.uid() IS NULL 
        OR owner_id = auth.uid()
        OR auth.role() = 'service_role'
    );
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;

NOTIFY pgrst, 'reload schema';

SELECT 'MODULE SUPER-ADMIN SQL INITIALISE AVEC SUCCES' AS statut;
