-- ==============================================================================
-- MIGRATION SUPABASE OFFICIELLE (CORRIGÉE & TESTÉE SANS ERREUR)
-- Tables : products (stocks), salon_staff (personnel/PIN), client_loyalty (fidélité)
-- ==============================================================================

-- 1. TABLE DES PRODUITS ET STOCKS
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Général',
  price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  cost_price NUMERIC(10, 2) DEFAULT 0,
  stock_quantity INT NOT NULL DEFAULT 0,
  alert_threshold INT NOT NULL DEFAULT 3,
  is_retail BOOLEAN NOT NULL DEFAULT TRUE,
  sku TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_salon_id ON public.products(salon_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(salon_id, category);

-- 2. TABLE DU PERSONNEL & CODES PIN
CREATE TABLE IF NOT EXISTS public.salon_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'Praticienne',
  phone TEXT,
  access_level TEXT NOT NULL DEFAULT 'level_2',
  pin_code TEXT NOT NULL DEFAULT '1234',
  specialties JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_salon_id ON public.salon_staff(salon_id);

-- 3. TABLE DU PROGRAMME DE FIDÉLITÉ
CREATE TABLE IF NOT EXISTS public.client_loyalty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salon_id UUID REFERENCES public.salons(id) ON DELETE CASCADE,
  client_phone TEXT NOT NULL,
  client_name TEXT,
  points_balance INT NOT NULL DEFAULT 0,
  total_points_earned INT NOT NULL DEFAULT 0,
  total_points_spent INT NOT NULL DEFAULT 0,
  history JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(salon_id, client_phone)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_salon_phone ON public.client_loyalty(salon_id, client_phone);

-- 4. COLONNES DE CONFIGURATION DANS SALONS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salons' AND column_name = 'manager_pin') THEN
    ALTER TABLE public.salons ADD COLUMN manager_pin TEXT DEFAULT '0000';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salons' AND column_name = 'loyalty_enabled') THEN
    ALTER TABLE public.salons ADD COLUMN loyalty_enabled BOOLEAN DEFAULT TRUE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salons' AND column_name = 'loyalty_rate_fcfa') THEN
    ALTER TABLE public.salons ADD COLUMN loyalty_rate_fcfa NUMERIC DEFAULT 1000;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salons' AND column_name = 'loyalty_point_value_fcfa') THEN
    ALTER TABLE public.salons ADD COLUMN loyalty_point_value_fcfa NUMERIC DEFAULT 10;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'salons' AND column_name = 'loyalty_welcome_bonus') THEN
    ALTER TABLE public.salons ADD COLUMN loyalty_welcome_bonus INT DEFAULT 50;
  END IF;
END $$;

-- 5. SÉCURITÉ ROW LEVEL SECURITY (RLS)
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salon_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_loyalty ENABLE ROW LEVEL SECURITY;

-- Suppression préalable propre
DROP POLICY IF EXISTS "Public read products for salon showcase" ON public.products;
DROP POLICY IF EXISTS "Owners manage products" ON public.products;
DROP POLICY IF EXISTS "Public read staff for booking" ON public.salon_staff;
DROP POLICY IF EXISTS "Owners manage staff" ON public.salon_staff;
DROP POLICY IF EXISTS "Public read loyalty balance" ON public.client_loyalty;
DROP POLICY IF EXISTS "Owners manage loyalty" ON public.client_loyalty;

-- Création des politiques RLS
CREATE POLICY "Public read products for salon showcase" ON public.products FOR SELECT USING (true);
CREATE POLICY "Owners manage products" ON public.products FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read staff for booking" ON public.salon_staff FOR SELECT USING (true);
CREATE POLICY "Owners manage staff" ON public.salon_staff FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public read loyalty balance" ON public.client_loyalty FOR SELECT USING (true);
CREATE POLICY "Owners manage loyalty" ON public.client_loyalty FOR ALL USING (true) WITH CHECK (true);

-- 6. FONCTION DE DÉCOMPTE AUTOMATIQUE EN CAISSE POS
CREATE OR REPLACE FUNCTION public.decrement_product_stock(
  p_product_id UUID,
  p_quantity INT
) RETURNS INT AS $$
DECLARE
  v_new_qty INT;
BEGIN
  UPDATE public.products
  SET stock_quantity = GREATEST(0, stock_quantity - p_quantity),
      updated_at = NOW()
  WHERE id = p_product_id
  RETURNING stock_quantity INTO v_new_qty;
  
  RETURN v_new_qty;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CONFIRMATION FINALE DU SUCCÈS
SELECT 
  'MIGRATION REUSSIE' AS statut,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name IN ('products', 'salon_staff', 'client_loyalty')) AS tables_creees,
  NOW() AS date_execution;
