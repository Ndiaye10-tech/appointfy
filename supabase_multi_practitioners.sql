-- ==============================================================================
-- MISE À JOUR MULTI-PRATICIENNES & ANTI-CHEVAUCHEMENT DYNAMIQUE
-- Exécutez ce script dans le SQL Editor de votre projet Supabase
-- ==============================================================================

-- 1. Perfectionnement de la fonction de vérification anti-chevauchement
CREATE OR REPLACE FUNCTION public.check_appointment_overlap(
  p_salon_id UUID,
  p_date TEXT,
  p_time_slot TEXT,
  p_duration TEXT,
  p_practitioner_name TEXT DEFAULT NULL,
  p_exclude_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_start INT;
  v_new_end INT;
  v_team_mode TEXT;
  v_team_count INT;
  v_conflict_count INT;
BEGIN
  IF p_time_slot IS NULL OR p_time_slot = '' THEN
    RETURN FALSE;
  END IF;

  -- 1. Récupérer la configuration du salon (mode et nombre de praticiennes)
  SELECT 
    COALESCE(team_mode, 'solo'),
    COALESCE(jsonb_array_length(CASE WHEN jsonb_typeof(team) = 'array' THEN team ELSE '[]'::jsonb END), 0)
  INTO v_team_mode, v_team_count
  FROM public.salons
  WHERE id = p_salon_id;

  v_new_start := (split_part(p_time_slot, ':', 1)::INT * 60) + split_part(p_time_slot, ':', 2)::INT;
  v_new_end := v_new_start + public.parse_duration_to_minutes(p_duration);

  -- 2. Cas A : La cliente a choisi une praticienne précise (ex: 'Fatou Sow')
  IF p_practitioner_name IS NOT NULL AND p_practitioner_name != '' THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments a
    WHERE a.salon_id = p_salon_id
      AND a.date = p_date
      AND a.status IN ('confirmed', 'pending')
      AND (p_exclude_id IS NULL OR a.id != p_exclude_id)
      AND (a.status != 'pending' OR a.expires_at IS NULL OR a.expires_at > NOW())
      -- Conflit si c'est la même praticienne OU si c'est une fermeture globale du salon
      AND (
        a.practitioner_name = p_practitioner_name 
        OR (a.is_blocked = TRUE AND (a.practitioner_name IS NULL OR a.practitioner_name = ''))
      )
      AND v_new_start < (
        (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT + public.parse_duration_to_minutes(a.duration)
      )
      AND v_new_end > (
        (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT
      );

    RETURN v_conflict_count = 0;

  -- 3. Cas B : Mode Solo (ou salon avec 1 seule personne)
  ELSIF v_team_mode = 'solo' OR v_team_count <= 1 THEN
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments a
    WHERE a.salon_id = p_salon_id
      AND a.date = p_date
      AND a.status IN ('confirmed', 'pending')
      AND (p_exclude_id IS NULL OR a.id != p_exclude_id)
      AND (a.status != 'pending' OR a.expires_at IS NULL OR a.expires_at > NOW())
      AND v_new_start < (
        (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT + public.parse_duration_to_minutes(a.duration)
      )
      AND v_new_end > (
        (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT
      );

    RETURN v_conflict_count = 0;

  -- 4. Cas C : Mode Équipe avec option 'Toute l équipe' (première disponible)
  ELSE
    -- Vérifier d'abord s'il y a un blocage complet du salon (fermeture exceptionnelle)
    IF EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.salon_id = p_salon_id
        AND a.date = p_date
        AND a.is_blocked = TRUE
        AND (a.practitioner_name IS NULL OR a.practitioner_name = '')
        AND v_new_start < ((split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT + public.parse_duration_to_minutes(a.duration))
        AND v_new_end > ((split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT)
    ) THEN
      RETURN FALSE;
    END IF;

    -- Compter le nombre de prestations en cours sur ce créneau
    SELECT COUNT(*) INTO v_conflict_count
    FROM public.appointments a
    WHERE a.salon_id = p_salon_id
      AND a.date = p_date
      AND a.status IN ('confirmed', 'pending')
      AND (p_exclude_id IS NULL OR a.id != p_exclude_id)
      AND (a.status != 'pending' OR a.expires_at IS NULL OR a.expires_at > NOW())
      AND v_new_start < (
        (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT + public.parse_duration_to_minutes(a.duration)
      )
      AND v_new_end > (
        (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT
      );

    -- Disponible tant qu au moins une praticienne est libre
    RETURN v_conflict_count < v_team_count;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. Permissions
GRANT EXECUTE ON FUNCTION public.check_appointment_overlap(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
