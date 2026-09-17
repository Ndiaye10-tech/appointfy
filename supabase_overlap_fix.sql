-- ==============================================================================
-- CORRECTIF AUDIT : DÉTECTION ET VERROUILLAGE DES CHEVAUCHEMENTS DE CRÉNEAUX
-- ==============================================================================

-- 1. Fonction de parsing de durée ('2h', '1h30', '45 min' -> minutes entières)
CREATE OR REPLACE FUNCTION public.parse_duration_to_minutes(p_duration TEXT)
RETURNS INT AS $$
DECLARE
  v_str TEXT := LOWER(TRIM(COALESCE(p_duration, '45 min')));
  v_h INT := 0;
  v_m INT := 0;
  v_h_match TEXT[];
  v_m_match TEXT[];
BEGIN
  -- Heures
  v_h_match := regexp_matches(v_str, '(\d+)\s*h');
  IF array_length(v_h_match, 1) > 0 THEN
    v_h := v_h_match[1]::INT;
  END IF;

  -- Minutes
  v_m_match := regexp_matches(v_str, '(?:h\s*(\d+)|(\d+)\s*(?:min|m))');
  IF array_length(v_m_match, 1) > 0 THEN
    v_m := COALESCE(v_m_match[1], v_m_match[2])::INT;
  ELSEIF v_h = 0 AND v_str ~ '^\d+$' THEN
    v_m := v_str::INT;
  END IF;

  IF v_h = 0 AND v_m = 0 THEN
    RETURN 45;
  END IF;

  RETURN (v_h * 60) + v_m;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Fonction de vérification de non-chevauchement
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
  v_conflict_count INT;
BEGIN
  IF p_time_slot IS NULL OR p_time_slot = '' THEN
    RETURN FALSE;
  END IF;

  v_new_start := (split_part(p_time_slot, ':', 1)::INT * 60) + split_part(p_time_slot, ':', 2)::INT;
  v_new_end := v_new_start + public.parse_duration_to_minutes(p_duration);

  SELECT COUNT(*) INTO v_conflict_count
  FROM public.appointments a
  WHERE a.salon_id = p_salon_id
    AND a.date = p_date
    AND a.status IN ('confirmed', 'pending')
    AND (p_exclude_id IS NULL OR a.id != p_exclude_id)
    AND (a.status != 'pending' OR a.expires_at IS NULL OR a.expires_at > NOW())
    AND (
      p_practitioner_name IS NULL 
      OR p_practitioner_name = '' 
      OR a.practitioner_name IS NULL 
      OR a.practitioner_name = '' 
      OR a.practitioner_name = p_practitioner_name
    )
    AND v_new_start < (
      (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT + public.parse_duration_to_minutes(a.duration)
    )
    AND v_new_end > (
      (split_part(a.time_slot, ':', 1)::INT * 60) + split_part(a.time_slot, ':', 2)::INT
    );

  RETURN v_conflict_count = 0;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

DROP FUNCTION IF EXISTS public.check_appointment_overlap(UUID, DATE, TEXT, TEXT, TEXT, TEXT);
GRANT EXECUTE ON FUNCTION public.parse_duration_to_minutes(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_appointment_overlap(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- 3. Mise à jour de la policy d'insertion publique pour appliquer l'anti-chevauchement
DROP POLICY IF EXISTS "Client insert pending appointment" ON public.appointments;

CREATE POLICY "Client insert pending appointment" 
ON public.appointments FOR INSERT 
WITH CHECK (
  salon_id IS NOT NULL 
  AND status IN ('pending', 'confirmed')
  AND public.check_appointment_overlap(salon_id, date, time_slot, duration, practitioner_name, id)
);
