-- ==============================================================================
-- SCRIPT SQL : PILIER 3 PLANNING, GESTION DES PRATICIENNES & CAISSE DU SALON
-- À exécuter dans l'éditeur SQL de votre tableau de bord Supabase
-- ==============================================================================

-- 1. Si la table 'appointments' existe déjà, ajouter les colonnes du Pilier 3 :
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS practitioner_name TEXT,
ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '1h',
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Création complète de la table si elle n'existe pas encore :
CREATE TABLE IF NOT EXISTS appointments (
  id TEXT PRIMARY KEY,
  salon_id UUID REFERENCES salons(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  service_id TEXT,
  service_name TEXT NOT NULL,
  date TEXT NOT NULL,
  date_formatted TEXT,
  time_slot TEXT NOT NULL,
  duration TEXT DEFAULT '1h',
  price NUMERIC DEFAULT 0,
  deposit_paid NUMERIC DEFAULT 0,
  remaining_balance NUMERIC DEFAULT 0,
  payment_method TEXT DEFAULT 'Wave',
  transaction_ref TEXT,
  status TEXT DEFAULT 'confirmed', -- 'confirmed', 'completed', 'no_show', 'cancelled', 'blocked'
  is_blocked BOOLEAN DEFAULT false,
  practitioner_name TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Index de performance pour les filtres par jour et par salon :
CREATE INDEX IF NOT EXISTS idx_appointments_salon_id ON appointments (salon_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments (date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments (status);

-- 4. Activer Row Level Security (RLS) et politique d'accès permissive pour le prototype :
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Allow all access to appointments" 
ON appointments 
FOR ALL 
USING (true) 
WITH CHECK (true);
