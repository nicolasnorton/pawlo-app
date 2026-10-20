-- =============================================================================
-- PAWLO™ URBAN PET SUPER-APP: PET VAULT, CARNETS, CLINICAL RECORDS & STORE
-- Migration: 20261020000002_pet_vault_and_marketplace.sql
-- =============================================================================

-- 1. Extend Pets table with complete individual owner profile fields
ALTER TABLE public.pets
  ADD COLUMN IF NOT EXISTS birth_date DATE,
  ADD COLUMN IF NOT EXISTS age_label TEXT,
  ADD COLUMN IF NOT EXISTS weight_kg NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('Macho', 'Hembra')),
  ADD COLUMN IF NOT EXISTS is_sterilized BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS coat_color TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS dietary_notes TEXT,
  ADD COLUMN IF NOT EXISTS behavior_notes TEXT,
  ADD COLUMN IF NOT EXISTS gallery_urls TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS insurance_policy TEXT;

-- 2. Digital Vaccination & Deworming Carnet (Carnet de Vacunas y Desparasitación)
CREATE TABLE IF NOT EXISTS public.pet_vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  vaccine_type TEXT NOT NULL, -- 'Polivalente Séxtuple', 'Antirrábica', 'Triple Felina', 'Desparasitación Interna/Externa'
  batch_number TEXT,
  applied_date DATE NOT NULL,
  next_due_date DATE NOT NULL,
  clinic_name TEXT NOT NULL,
  veterinarian_name TEXT NOT NULL,
  veterinarian_license TEXT,
  status TEXT NOT NULL DEFAULT 'vigente' CHECK (status IN ('vigente', 'proximo', 'vencido')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Clinical History & Medical Records (Historia Clínica Centralizada)
CREATE TABLE IF NOT EXISTS public.pet_clinical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  consultation_date DATE NOT NULL,
  record_type TEXT NOT NULL CHECK (record_type IN ('Consulta General', 'Cirugía', 'Laboratorio', 'Urgencia', 'Control Peso', 'Odontología', 'Etología')),
  title TEXT NOT NULL,
  diagnosis TEXT NOT NULL,
  treatment_plan TEXT,
  weight_at_visit_kg NUMERIC(5,2),
  temperature_c NUMERIC(4,1),
  clinic_name TEXT NOT NULL,
  veterinarian_name TEXT NOT NULL,
  attachment_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Pet Owner Personal Notes & Reminders (Notas, Diario y Recordatorios)
CREATE TABLE IF NOT EXISTS public.pet_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES public.pets(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'General' CHECK (category IN ('Nutrición', 'Medicación', 'Conducta', 'Cuidado Diario', 'General')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  reminder_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Pet Store Catalog (Comida, Medicamentos, Juguetes, Camas, Casas)
CREATE TABLE IF NOT EXISTS public.store_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('Comida', 'Medicamentos', 'Juguetes', 'Camas', 'Casas')),
  target_species TEXT NOT NULL DEFAULT 'all' CHECK (target_species IN ('canine', 'feline', 'all')),
  price_usd NUMERIC(10,2) NOT NULL,
  requires_prescription BOOLEAN NOT NULL DEFAULT false,
  stock_status TEXT NOT NULL DEFAULT 'in_stock' CHECK (stock_status IN ('in_stock', 'low_stock', 'out_of_stock')),
  weight_recommendation TEXT,
  description TEXT NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.pet_vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_clinical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_products ENABLE ROW LEVEL SECURITY;

-- Policies for Pet Owners
CREATE POLICY "Owners manage their pet vaccinations"
  ON public.pet_vaccinations
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_vaccinations.pet_id AND p.owner_id = auth.uid()));

CREATE POLICY "Owners manage their pet clinical records"
  ON public.pet_clinical_records
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_clinical_records.pet_id AND p.owner_id = auth.uid()));

CREATE POLICY "Owners manage their pet notes"
  ON public.pet_notes
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.pets p WHERE p.id = pet_notes.pet_id AND p.owner_id = auth.uid()));

CREATE POLICY "Public read access to store products"
  ON public.store_products
  FOR SELECT
  USING (true);
