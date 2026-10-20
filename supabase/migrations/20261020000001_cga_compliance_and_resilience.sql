-- ============================================================================
-- MIGRACIÓN FASE 2 & FASE 3: AUDITORÍA DE CONSENTIMIENTO CGA Y VALIDACIÓN DE IDENTIFICACIÓN
-- ARCHIVO: supabase/migrations/20261020000001_cga_compliance_and_resilience.sql
-- ============================================================================

-- 1. TABLA DE AUDITORÍA Y TRAZABILIDAD DE CONSENTIMIENTO JURÍDICO (CLICKWRAP)
CREATE TABLE IF NOT EXISTS public.legal_consent_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    terms_version VARCHAR(20) NOT NULL DEFAULT 'CGA-2026.1',
    consent_type VARCHAR(50) NOT NULL DEFAULT 'triage_disclaimer',
    ip_hash VARCHAR(64) NOT NULL,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_legal_consent_logs_user_id ON public.legal_consent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_legal_consent_logs_accepted_at ON public.legal_consent_logs(accepted_at);

-- RLS: Solo lectura de propios consentimientos o inserción autenticada/anónima
ALTER TABLE public.legal_consent_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Cualquier cliente puede registrar su aceptacion de consentimiento"
    ON public.legal_consent_logs
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Los usuarios pueden consultar sus propios consentimientos"
    ON public.legal_consent_logs
    FOR SELECT
    USING (auth.uid() = user_id);

-- 2. FUNCIÓN RPC PARA VALIDACIÓN FORMAL DE MICROCHIP SEGÚN NORMATIVA CGA CUENCA
-- Formatos aceptados:
-- a) Identificador Cantonal CGA: CGA-CUE-XXXXXX (6 a 10 dígitos)
-- b) Estándar Internacional ISO 11784/11785 (exactamente 15 dígitos numéricos)
CREATE OR REPLACE FUNCTION public.validate_cga_microchip(microchip_input TEXT)
RETURNS JSONB AS $$
DECLARE
    clean_chip TEXT := UPPER(TRIM(microchip_input));
    is_valid BOOLEAN := false;
    standard_type TEXT := 'INVALID';
    details TEXT := '';
BEGIN
    IF clean_chip IS NULL OR clean_chip = '' THEN
        RETURN jsonb_build_object(
            'is_valid', false,
            'standard', 'NONE',
            'error', 'El número de microchip no puede estar vacío.'
        );
    END IF;

    -- Validación Formato Cantonal CGA Cuenca
    IF clean_chip ~ '^CGA-CUE-[0-9]{6,10}$' THEN
        is_valid := true;
        standard_type := 'CGA_CANTONAL_CUENCA';
        details := 'Identificador expedido bajo homologación de la Comisión de Gestión Ambiental de Cuenca.';
    -- Validación Estándar Internacional ISO 11784/11785
    ELSIF clean_chip ~ '^[0-9]{15}$' THEN
        is_valid := true;
        standard_type := 'ISO_11784_11785';
        details := 'Microchip transponder estándar de 15 dígitos compatible con lectores veterinarios universales.';
    ELSE
        is_valid := false;
        standard_type := 'NON_COMPLIANT';
        details := 'El microchip no cumple con el formato oficial CGA-CUE-[0-9]{6,10} ni el estándar ISO de 15 dígitos.';
    END IF;

    RETURN jsonb_build_object(
        'microchip', clean_chip,
        'is_valid', is_valid,
        'standard', standard_type,
        'message', details
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY DEFINER;

-- 3. COLA DE RESILIENCIA (OUTBOX) PARA EVENTOS GHL/WHATSAPP FALLIDOS
CREATE TABLE IF NOT EXISTS public.ghl_lead_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contact_name VARCHAR(150) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    service_title VARCHAR(150) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'failed')),
    error_log TEXT,
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ghl_lead_outbox ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Servicio Edge Functions gestiona outbox"
    ON public.ghl_lead_outbox
    FOR ALL
    USING (true)
    WITH CHECK (true);
