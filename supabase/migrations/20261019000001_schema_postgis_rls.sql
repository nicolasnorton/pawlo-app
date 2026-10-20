-- ============================================================================
-- PROYECTO: PLATAFORMA CÍVICO-COMERCIAL DE BIENESTAR ANIMAL (CUENCA, ECUADOR)
-- MOTOR: Supabase PostgreSQL 15+ con Extensión Espacial PostGIS (EPSG:4326)
-- ARCHIVO: supabase/migrations/20261019000001_schema_postgis_rls.sql
-- ============================================================================

-- 0. Habilitación de extensiones requeridas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- Función utilitaria para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. FICHA DIGITAL DE MASCOTAS (HOMOLOGADA CON REGISTRO CGA CUENCA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(80) NOT NULL,
    species VARCHAR(20) NOT NULL DEFAULT 'canine' CHECK (species IN ('canine', 'feline', 'other')),
    breed VARCHAR(80) DEFAULT 'Mestizo',
    age_months INT CHECK (age_months >= 0),
    weight_kg NUMERIC(4,2) CHECK (weight_kg > 0),
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    is_sterilized BOOLEAN DEFAULT false,
    -- Formato compatible con ISO 11784/11785 (15 dígitos) o código cantonal CGA Cuenca
    microchip_id VARCHAR(50) UNIQUE CHECK (
        microchip_id IS NULL OR microchip_id ~ '^(CGA-CUE-[0-9]{6,10}|[0-9]{15})$'
    ),
    cga_registration_status VARCHAR(25) DEFAULT 'pending' CHECK (
        cga_registration_status IN ('pending', 'homologated', 'exempt')
    ),
    allergies TEXT[] DEFAULT ARRAY[]::TEXT[],
    chronic_conditions TEXT[] DEFAULT ARRAY[]::TEXT[],
    vaccination_card JSONB DEFAULT '[]'::jsonb,
    photo_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pets_owner_id ON public.pets(owner_id);
CREATE INDEX IF NOT EXISTS idx_pets_microchip_id ON public.pets(microchip_id);

DROP TRIGGER IF EXISTS trg_pets_updated_at ON public.pets;
CREATE TRIGGER trg_pets_updated_at
BEFORE UPDATE ON public.pets
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. ALERTAS DE MASCOTAS EXTRAVIADAS Y AVISTAMIENTOS (GEORREFERENCIADAS)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lost_pet_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
    pet_name VARCHAR(80),
    species VARCHAR(20) DEFAULT 'canine' CHECK (species IN ('canine', 'feline', 'other')),
    alert_type VARCHAR(20) NOT NULL CHECK (alert_type IN ('lost', 'sighted')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reunited', 'closed')),
    sector_reference VARCHAR(120), -- Ej: Parque Calderón, El Vergel, Puertas del Sol
    description TEXT NOT NULL,
    distinctive_traits TEXT,
    contact_phone VARCHAR(20) NOT NULL,
    photos TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    incident_location GEOGRAPHY(Point, 4326) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice espacial GiST para acelerar ST_DWithin y búsquedas por radio en <10ms
CREATE INDEX IF NOT EXISTS idx_lost_pet_location
    ON public.lost_pet_alerts USING GIST (incident_location);

-- Índice compuesto para filtrar alertas activas rápidamente
CREATE INDEX IF NOT EXISTS idx_lost_pet_status_created
    ON public.lost_pet_alerts (status, created_at DESC);

DROP TRIGGER IF EXISTS trg_lost_pet_alerts_updated_at ON public.lost_pet_alerts;
CREATE TRIGGER trg_lost_pet_alerts_updated_at
BEFORE UPDATE ON public.lost_pet_alerts
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Función RPC para resolver alertas activas en un radio geográfico (Cuenca)
CREATE OR REPLACE FUNCTION public.get_active_alerts_in_radius(
    center_lng DOUBLE PRECISION,
    center_lat DOUBLE PRECISION,
    radius_meters DOUBLE PRECISION DEFAULT 5000
)
RETURNS SETOF public.lost_pet_alerts AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.lost_pet_alerts
    WHERE status = 'active'
      AND ST_DWithin(
            incident_location,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography,
            radius_meters
          )
    ORDER BY
        ST_Distance(
            incident_location,
            ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
        ) ASC,
        created_at DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, extensions;

-- ============================================================================
-- 3. DIRECTORIO CLÍNICO, ALBERGUES Y COMERCIO CONVERSACIONAL (CUENCA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(120) NOT NULL,
    category VARCHAR(40) NOT NULL CHECK (
        category IN ('veterinary_24h', 'clinic', 'groomer', 'trainer', 'shelter', 'pet_shop')
    ),
    phone VARCHAR(20) NOT NULL,
    whatsapp_e164 VARCHAR(20), -- Formato 593XXXXXXXXX para wa.me
    address_text TEXT NOT NULL,
    parish VARCHAR(80) DEFAULT 'Cuenca Urbano',
    location GEOGRAPHY(Point, 4326) NOT NULL,
    estimated_price_usd NUMERIC(6,2) DEFAULT 0.00,
    service_catalog JSONB DEFAULT '[]'::jsonb,
    is_emergency_24h BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_providers_location
    ON public.service_providers USING GIST (location);

CREATE INDEX IF NOT EXISTS idx_providers_category_emergency
    ON public.service_providers (category, is_emergency_24h);

-- Función RPC para localizar la emergencia veterinaria 24h más cercana (Nivel ROJO)
CREATE OR REPLACE FUNCTION public.get_nearest_emergency_providers(
    center_lng DOUBLE PRECISION,
    center_lat DOUBLE PRECISION,
    max_results INT DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    business_name VARCHAR(120),
    category VARCHAR(40),
    phone VARCHAR(20),
    whatsapp_e164 VARCHAR(20),
    address_text TEXT,
    is_emergency_24h BOOLEAN,
    distance_meters DOUBLE PRECISION,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        sp.id,
        sp.business_name,
        sp.category,
        sp.phone,
        sp.whatsapp_e164,
        sp.address_text,
        sp.is_emergency_24h,
        ROUND(
            ST_Distance(
                sp.location,
                ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
            )::numeric, 1
        )::double precision AS distance_meters,
        ST_Y(sp.location::geometry) AS lat,
        ST_X(sp.location::geometry) AS lng
    FROM public.service_providers sp
    WHERE sp.is_verified = true
      AND (sp.is_emergency_24h = true OR sp.category IN ('veterinary_24h', 'clinic'))
    ORDER BY
        sp.is_emergency_24h DESC,
        sp.location <-> ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)::geography
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, extensions;

-- ============================================================================
-- 4. CENTRO DE ADOPCIONES RESPONSABLES (ORDENANZA MUNICIPAL CUENCA / ARCA)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.adoption_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    shelter_name VARCHAR(120) NOT NULL DEFAULT 'Fundación ARCA Cuenca',
    rescue_pet_code VARCHAR(40) NOT NULL,
    rescue_pet_name VARCHAR(80) NOT NULL,
    applicant_full_name VARCHAR(120) NOT NULL,
    applicant_phone VARCHAR(20) NOT NULL,
    parish_sector VARCHAR(120) NOT NULL,
    has_perimeter_enclosure BOOLEAN NOT NULL DEFAULT false,
    accepts_financial_prophylaxis BOOLEAN NOT NULL DEFAULT false,
    accepts_mandatory_sterilization BOOLEAN NOT NULL DEFAULT false,
    housing_type VARCHAR(40) CHECK (housing_type IN ('house_enclosed', 'apartment_mesh', 'rural_fenced')),
    status VARCHAR(25) DEFAULT 'submitted' CHECK (
        status IN ('submitted', 'home_visit_scheduled', 'approved', 'rejected')
    ),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    -- Restricción dura: la ordenanza municipal y ARCA exigen los 3 compromisos
    CONSTRAINT chk_responsible_adoption_requirements CHECK (
        has_perimeter_enclosure = true
        AND accepts_financial_prophylaxis = true
        AND accepts_mandatory_sterilization = true
    )
);

CREATE INDEX IF NOT EXISTS idx_adoptions_applicant
    ON public.adoption_applications (applicant_id, created_at DESC);

-- ============================================================================
-- 5. AUDITORÍA DE REGISTROS DE TRIAJE Y CONSENTIMIENTO CLICKWRAP (ART. 31)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.triage_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
    clickwrap_accepted BOOLEAN NOT NULL CHECK (clickwrap_accepted = true),
    route_type VARCHAR(20) NOT NULL CHECK (route_type IN ('ethology_flash', 'triage_reasoner', 'pharma_blocked')),
    triage_level VARCHAR(10) CHECK (triage_level IN ('RED', 'YELLOW', 'GREEN', 'BLOCKED')),
    user_query TEXT NOT NULL,
    structured_response JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. POLÍTICAS ESTRICTAS DE ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lost_pet_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.adoption_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.triage_audit_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Políticas para public.pets (Solo el tutor propietario administra sus fichas)
CREATE POLICY "pets_select_own"
    ON public.pets FOR SELECT
    TO authenticated
    USING (auth.uid() = owner_id);

CREATE POLICY "pets_insert_own"
    ON public.pets FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pets_update_own"
    ON public.pets FOR UPDATE
    TO authenticated
    USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "pets_delete_own"
    ON public.pets FOR DELETE
    TO authenticated
    USING (auth.uid() = owner_id);

-- 6.2 Políticas para public.lost_pet_alerts (Lectura pública comunitaria, escritura autenticada)
CREATE POLICY "alerts_select_public"
    ON public.lost_pet_alerts FOR SELECT
    TO anon, authenticated
    USING (true);

CREATE POLICY "alerts_insert_own"
    ON public.lost_pet_alerts FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alerts_update_own"
    ON public.lost_pet_alerts FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "alerts_delete_own"
    ON public.lost_pet_alerts FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6.3 Políticas para public.service_providers (Lectura pública de nodos verificados)
CREATE POLICY "providers_select_verified"
    ON public.service_providers FOR SELECT
    TO anon, authenticated
    USING (is_verified = true);

-- 6.4 Políticas para public.adoption_applications (Solo el postulante ve y crea sus solicitudes)
CREATE POLICY "adoptions_select_own"
    ON public.adoption_applications FOR SELECT
    TO authenticated
    USING (auth.uid() = applicant_id);

CREATE POLICY "adoptions_insert_own"
    ON public.adoption_applications FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = applicant_id);

-- 6.5 Políticas para public.triage_audit_logs
CREATE POLICY "triage_logs_select_own"
    ON public.triage_audit_logs FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "triage_logs_insert_own"
    ON public.triage_audit_logs FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- 7. SEMILLAS GEOESPACIALES DE REFERENCIA EN CUENCA (WGS84 / EPSG:4326)
-- ============================================================================
INSERT INTO public.service_providers (
    business_name, category, address_text, parish, location, phone, whatsapp_e164,
    estimated_price_usd, service_catalog, is_emergency_24h, is_verified
)
VALUES
(
    'Clínica Veterinaria Austrovet',
    'veterinary_24h',
    'Av. González Suárez (frente a Monay Shopping)',
    'Monay / Huayna Cápac',
    ST_SetSRID(ST_MakePoint(-78.9805, -2.8988), 4326)::geography,
    '074083691',
    '593998408369',
    35.00,
    '[{"title":"Urgencia / Trauma 24h","price":35},{"title":"Chequeo Preventivo + Ecografía Fast","price":42},{"title":"Profilaxis Dental Ultrasónica","price":65}]'::jsonb,
    true,
    true
),
(
    'Hospital Municipal de la Mascota',
    'clinic',
    'Complejo Bolivariano / Coliseo Jefferson Pérez (Av. Primero de Mayo)',
    'Yanuncay',
    ST_SetSRID(ST_MakePoint(-79.0112, -2.9065), 4326)::geography,
    '074134520',
    '593994134520',
    10.00,
    '[{"title":"Consulta General Subsidiada CGA","price":10},{"title":"Esterilización Quirúrgica (Campaña Municipal)","price":18},{"title":"Registro e Implantación Microchip CGA","price":12}]'::jsonb,
    false,
    true
),
(
    'Fundación ARCA Cuenca (Albergue y Rescate)',
    'shelter',
    'Sector Patamarca / Red de Hogares Temporales Cuenca',
    'Machángara',
    ST_SetSRID(ST_MakePoint(-78.9724, -2.8742), 4326)::geography,
    '0995412890',
    '593995412890',
    0.00,
    '[{"title":"Entrevista de Adopción Responsable","price":0},{"title":"Apadrinamiento Mensual de Rehabilitación","price":15}]'::jsonb,
    false,
    true
),
(
    'Tomebamba Grooming & Spa Canino Móvil',
    'groomer',
    'Av. Solano y Av. 12 de Abril (El Vergel)',
    'El Sagrario',
    ST_SetSRID(ST_MakePoint(-79.0041, -2.9039), 4326)::geography,
    '0987654321',
    '593987654321',
    22.00,
    '[{"title":"Peluquería Canina a Domicilio (Baño Hipoalergénico + Corte)","price":22},{"title":"Deslanado Terapéutico Razas Doble Manto","price":28}]'::jsonb,
    false,
    true
),
(
    'K9 Etología & Adiestramiento Positivo El Cajas',
    'trainer',
    'Av. Ordóñez Lasso (Sector Puertas del Sol)',
    'San Sebastián',
    ST_SetSRID(ST_MakePoint(-79.0285, -2.8915), 4326)::geography,
    '0984112233',
    '593984112233',
    30.00,
    '[{"title":"Evaluación Etológica Presencial (Ansiedad por Separación)","price":30},{"title":"Plan Mensual Socialización en Parque Paraíso","price":95}]'::jsonb,
    false,
    true
),
(
    'AustroPet Nutrición & Farmacia Veterinaria',
    'pet_shop',
    'Av. Remigio Crespo Toral y Agustín Cueva',
    'Sucre',
    ST_SetSRID(ST_MakePoint(-79.0108, -2.9012), 4326)::geography,
    '0991122334',
    '593991122334',
    45.00,
    '[{"title":"Saco Alimento Super Premium 15kg (Entrega a Domicilio)","price":58},{"title":"Kit Antiparasitario Externo + Collar Reflectivo CGA","price":24}]'::jsonb,
    false,
    true
);
