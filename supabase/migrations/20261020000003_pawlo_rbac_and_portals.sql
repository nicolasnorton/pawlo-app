-- =============================================================================
-- PAWLO™ URBAN PET SUPER-APP: RBAC, VENDOR & VET PORTALS, DISPATCH & AUDIT
-- Migration: 20261020000002_pawlo_rbac_and_portals.sql
-- Motor: Supabase PostgreSQL 15+ con Extensión Espacial PostGIS (EPSG:4326)
-- Cobertura: Cuenca, Ecuador • Quito • Bogotá
-- =============================================================================

-- 0. Garantizar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- 1. ENUM Y TABLA MAESTRA DE ROLES (8 ROLES DE PAWLO™)
-- =============================================================================

DO $$ BEGIN
  CREATE TYPE public.pawlo_role_enum AS ENUM (
    'super_admin',
    'admin',
    'supervisor',
    'operator',
    'veterinario',
    'comercio',
    'servicio',
    'usuario'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.app_roles (
  role_id public.pawlo_role_enum PRIMARY KEY,
  group_name VARCHAR(20) NOT NULL CHECK (group_name IN ('staff', 'partner', 'user')),
  label VARCHAR(80) NOT NULL,
  short_label VARCHAR(30) NOT NULL,
  badge_color VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Semilla de los 8 roles de la plataforma
INSERT INTO public.app_roles (role_id, group_name, label, short_label, badge_color, description, permissions)
VALUES
(
  'super_admin',
  'staff',
  'Super Administrador Global',
  'Super Admin',
  'bg-rose-500/20 text-rose-300 border-rose-500/40',
  'Acceso irrestricto, cortafuegos farmacológico, auditoría de seguridad inmutable y liquidación financiera.',
  ARRAY['all:access', 'rbac:manage_roles', 'pharma:firewall_override', 'audit:read_immutable_logs', 'finance:settlements', 'system:config']
),
(
  'admin',
  'staff',
  'Administrador Regional',
  'Admin',
  'bg-purple-500/20 text-purple-300 border-purple-500/40',
  'Validación de títulos SENESCYT, verificación de RUC/NIT, homologación de comercios y clínicas en Cuenca, Quito y Bogotá.',
  ARRAY['partners:approve_vets', 'partners:approve_merchants', 'partners:approve_services', 'dispatches:supervise', 'metrics:regional_view', 'catalog:moderate']
),
(
  'supervisor',
  'staff',
  'Supervisor de Emergencias & Triaje',
  'Supervisor',
  'bg-amber-500/20 text-amber-300 border-amber-500/40',
  'Moderación de casos Código Rojo, auditoría de triaje veterinario, asignación prioritaria de flota Pet Taxi y alertas de extravío.',
  ARRAY['triage:override_protocol', 'sos:moderate_queue', 'fleet:priority_dispatch', 'broadcast:lost_pet_alert', 'telephony:direct_escalation']
),
(
  'operator',
  'staff',
  'Operador de Despacho & Flota',
  'Operador',
  'bg-sky-500/20 text-sky-300 border-sky-500/40',
  'Gestión táctica de tickets SOS en tiempo real, asignación de unidades móviles, seguimiento GPS y enlace telefónico con tutores.',
  ARRAY['sos:view_queue', 'fleet:assign_driver', 'fleet:gps_telemetry', 'chat:tutor_assistance', 'tickets:update_status']
),
(
  'veterinario',
  'partner',
  'Médico Veterinario Colegiado',
  'Veterinario',
  'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
  'Atención clínica presencial y telemedicina, emisión de recetas electrónicas con firma digital y actualización de carnet de vacunación.',
  ARRAY['clinical:create_record', 'prescriptions:issue_digital', 'carnet:sign_vaccines', 'vault:access_patient_history', 'telemedicine:video_consultation']
),
(
  'comercio',
  'partner',
  'Comercio / Pet Shop & Farmacia',
  'Comercio',
  'bg-orange-500/20 text-orange-300 border-orange-500/40',
  'Gestión de inventario de alimentos y accesorios, validación de recetas médicas de farmacia y despacho de pedidos motorizados.',
  ARRAY['store:manage_inventory', 'prescriptions:validate_and_dispense', 'orders:fulfill_and_dispatch', 'payments:deuna_validation', 'store:view_sales']
),
(
  'servicio',
  'partner',
  'Proveedor de Servicios Especializados',
  'Servicio',
  'bg-teal-500/20 text-teal-300 border-teal-500/40',
  'Gestión de agenda y confirmación para Pet Taxi, Hotel Campestre, Grooming Spa móvil y Adiestramiento/Etología.',
  ARRAY['services:manage_calendar', 'bookings:accept_reject', 'bookings:update_progress', 'checkin:qr_scanner', 'reviews:view_ratings']
),
(
  'usuario',
  'user',
  'Tutor / Propietario de Mascota',
  'Tutor',
  'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
  'Bóveda digital de carnet e historial médico, activación de SOS 24/7, compras en tienda y reserva de movilidad y hospedaje.',
  ARRAY['pets:manage_vault', 'sos:trigger_alert', 'orders:create_purchase', 'bookings:create_reservation', 'prescriptions:view_my_pet']
)
ON CONFLICT (role_id) DO UPDATE
SET
  label = EXCLUDED.label,
  short_label = EXCLUDED.short_label,
  badge_color = EXCLUDED.badge_color,
  description = EXCLUDED.description,
  permissions = EXCLUDED.permissions;

-- =============================================================================
-- 2. TABLA: ASIGNACIÓN DE ROLES A USUARIOS (user_roles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.pawlo_role_enum NOT NULL DEFAULT 'usuario',
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_user_roles_user_role UNIQUE (user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON public.user_roles(is_active);

-- Triggers de actualización
DROP TRIGGER IF EXISTS trg_user_roles_updated_at ON public.user_roles;
CREATE TRIGGER trg_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 3. FUNCIONES DE APOYO RBAC (SECURITY DEFINER / EVALUACIÓN SEGURA DE POLÍTICAS)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.current_user_has_role(required_role public.pawlo_role_enum)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = required_role
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_is_staff()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin', 'supervisor', 'operator')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- =============================================================================
-- 4. TABLA: PERFILES VETERINARIOS Y COLEGIATURA SENESCYT (vet_profiles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vet_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(150) NOT NULL,
  clinic_name VARCHAR(150) NOT NULL,
  senescyt_license VARCHAR(50) UNIQUE NOT NULL, -- Matrícula SENESCYT (Ecuador) o COMVEZCOL (Colombia)
  specialties TEXT[] DEFAULT '{}',
  phone VARCHAR(50) NOT NULL,
  emergency_phone VARCHAR(50),
  city VARCHAR(50) NOT NULL DEFAULT 'Cuenca' CHECK (city IN ('Cuenca', 'Quito', 'Bogotá')),
  address_text TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326),
  digital_signature_pubkey TEXT,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_vet_profiles_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_vet_profiles_user_id ON public.vet_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vet_profiles_senescyt ON public.vet_profiles(senescyt_license);
CREATE INDEX IF NOT EXISTS idx_vet_profiles_approval ON public.vet_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_vet_profiles_city ON public.vet_profiles(city);
CREATE INDEX IF NOT EXISTS idx_vet_profiles_location ON public.vet_profiles USING GIST(location);

DROP TRIGGER IF EXISTS trg_vet_profiles_updated_at ON public.vet_profiles;
CREATE TRIGGER trg_vet_profiles_updated_at
BEFORE UPDATE ON public.vet_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 5. TABLA: COMERCIOS Y PROVEEDORES DE SERVICIOS (vendor_profiles)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.vendor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_type VARCHAR(20) NOT NULL CHECK (vendor_type IN ('comercio', 'servicio')),
  business_name VARCHAR(150) NOT NULL,
  tax_id_ruc VARCHAR(50) UNIQUE NOT NULL, -- RUC (Ecuador) o NIT (Colombia)
  legal_representative VARCHAR(150) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(150) NOT NULL,
  city VARCHAR(50) NOT NULL DEFAULT 'Cuenca' CHECK (city IN ('Cuenca', 'Quito', 'Bogotá')),
  address_text TEXT NOT NULL,
  location GEOGRAPHY(Point, 4326),
  categories TEXT[] DEFAULT '{}', -- ['Farmacia', 'Alimentos', 'Pet Taxi', 'Hospedaje', 'Grooming', 'Etología']
  service_zones TEXT[] DEFAULT '{}',
  bank_info JSONB DEFAULT '{}'::jsonb, -- Datos para liquidación Deuna P2P o transferencia bancaria
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected', 'suspended')),
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_vendor_profiles_user_id UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_profiles_user_id ON public.vendor_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_tax_id ON public.vendor_profiles(tax_id_ruc);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_type ON public.vendor_profiles(vendor_type);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_approval ON public.vendor_profiles(approval_status);
CREATE INDEX IF NOT EXISTS idx_vendor_profiles_location ON public.vendor_profiles USING GIST(location);

DROP TRIGGER IF EXISTS trg_vendor_profiles_updated_at ON public.vendor_profiles;
CREATE TRIGGER trg_vendor_profiles_updated_at
BEFORE UPDATE ON public.vendor_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 6. TABLA: RECETAS DIGITALES Y CORTAFUEGOS FARMACOLÓGICO (digital_prescriptions)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.digital_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_code VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'RX-2026-VET-7841'
  vet_id UUID NOT NULL REFERENCES public.vet_profiles(id) ON DELETE RESTRICT,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  pet_name VARCHAR(80) NOT NULL,
  pet_species VARCHAR(20) NOT NULL DEFAULT 'canine' CHECK (pet_species IN ('canine', 'feline', 'other')),
  microchip_iso VARCHAR(50),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  owner_name VARCHAR(150) NOT NULL,
  owner_identification VARCHAR(50),
  diagnosis TEXT NOT NULL,
  medications JSONB NOT NULL DEFAULT '[]'::jsonb,
  indications TEXT NOT NULL,
  digital_signature_hash VARCHAR(128) NOT NULL,
  digital_signature_algo VARCHAR(50) DEFAULT 'RSA-PSS-SHA256 (SENESCYT Pkix Token)',
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Activa' CHECK (status IN ('Activa', 'Dispensada', 'Expirada', 'Anulada')),
  dispensed_at TIMESTAMPTZ,
  dispensed_by_vendor_id UUID REFERENCES public.vendor_profiles(id) ON DELETE SET NULL,
  pharmacist_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_code ON public.digital_prescriptions(prescription_code);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_vet ON public.digital_prescriptions(vet_id);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_pet ON public.digital_prescriptions(pet_id);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_owner ON public.digital_prescriptions(owner_id);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_microchip ON public.digital_prescriptions(microchip_iso);
CREATE INDEX IF NOT EXISTS idx_digital_prescriptions_status ON public.digital_prescriptions(status);

DROP TRIGGER IF EXISTS trg_digital_prescriptions_updated_at ON public.digital_prescriptions;
CREATE TRIGGER trg_digital_prescriptions_updated_at
BEFORE UPDATE ON public.digital_prescriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 7. TABLA: COLA DE DESPACHO SOS & FLOTA PET TAXI (sos_dispatch_queue)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.sos_dispatch_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_number VARCHAR(50) UNIQUE NOT NULL, -- Ej: 'SOS-2026-0841'
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  pet_id UUID REFERENCES public.pets(id) ON DELETE SET NULL,
  pet_name VARCHAR(80) NOT NULL,
  species VARCHAR(20) NOT NULL DEFAULT 'canine' CHECK (species IN ('canine', 'feline', 'other')),
  breed VARCHAR(80),
  microchip_iso VARCHAR(50),
  triage_level VARCHAR(25) NOT NULL CHECK (triage_level IN ('CODE_RED', 'CODE_ORANGE', 'CODE_YELLOW', 'LOST_PET_ALERT')),
  condition_summary TEXT NOT NULL,
  reporter_name VARCHAR(150) NOT NULL,
  reporter_phone VARCHAR(50) NOT NULL,
  reporter_role VARCHAR(20) NOT NULL DEFAULT 'tutor' CHECK (reporter_role IN ('tutor', 'witness', 'rescuer')),
  location_name TEXT NOT NULL,
  sector VARCHAR(80) NOT NULL,
  city VARCHAR(50) NOT NULL DEFAULT 'Cuenca' CHECK (city IN ('Cuenca', 'Quito', 'Bogotá')),
  incident_location GEOGRAPHY(Point, 4326),
  status VARCHAR(30) NOT NULL DEFAULT 'OPEN_TRIAGE' CHECK (status IN (
    'OPEN_TRIAGE',
    'UNIT_DISPATCHED',
    'EN_ROUTE',
    'ON_SCENE',
    'TRANSPORTING_TO_CLINIC',
    'RESOLVED',
    'CANCELLED'
  )),
  assigned_unit_id VARCHAR(50),
  assigned_driver_name VARCHAR(150),
  assigned_driver_phone VARCHAR(50),
  assigned_vehicle_plate VARCHAR(20),
  eta_minutes INT,
  destination_clinic_name VARCHAR(150),
  destination_clinic_address TEXT,
  destination_vet_id UUID REFERENCES public.vet_profiles(id) ON DELETE SET NULL,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  triage_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sos_dispatch_ticket_number ON public.sos_dispatch_queue(ticket_number);
CREATE INDEX IF NOT EXISTS idx_sos_dispatch_status ON public.sos_dispatch_queue(status);
CREATE INDEX IF NOT EXISTS idx_sos_dispatch_triage ON public.sos_dispatch_queue(triage_level);
CREATE INDEX IF NOT EXISTS idx_sos_dispatch_reporter ON public.sos_dispatch_queue(reporter_id);
CREATE INDEX IF NOT EXISTS idx_sos_dispatch_location ON public.sos_dispatch_queue USING GIST(incident_location);

DROP TRIGGER IF EXISTS trg_sos_dispatch_updated_at ON public.sos_dispatch_queue;
CREATE TRIGGER trg_sos_dispatch_updated_at
BEFORE UPDATE ON public.sos_dispatch_queue
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =============================================================================
-- 8. TABLA: REGISTRO DE AUDITORÍA INMUTABLE & CORTAFUEGOS (audit_logs)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_name VARCHAR(150),
  actor_role public.pawlo_role_enum,
  action VARCHAR(100) NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('security', 'pharmacological', 'rbac', 'financial', 'compliance')),
  ip_address VARCHAR(45),
  city VARCHAR(50),
  resource_affected VARCHAR(200) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical', 'alert')),
  details JSONB DEFAULT '{}'::jsonb,
  hash_signature VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_category ON public.audit_logs(category);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON public.audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_affected);

-- TRIGGER DE INMUTABILIDAD: Prohibir UPDATE o DELETE en audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Violación de Seguridad PAWLO: La tabla audit_logs es de sólo adición e inmutable.'
    USING ERRCODE = 'integrity_constraint_violation';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_audit_logs_immutable ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_immutable
BEFORE UPDATE OR DELETE ON public.audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- =============================================================================
-- 9. CONFIGURACIÓN DE ROW LEVEL SECURITY (RLS) Y POLÍTICAS RBAC GRANULARES
-- =============================================================================

-- Habilitar RLS en todas las nuevas tablas
ALTER TABLE public.app_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vet_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sos_dispatch_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 9.1 Políticas para public.app_roles
-- -----------------------------------------------------------------------------
CREATE POLICY "app_roles_select_public"
  ON public.app_roles
  FOR SELECT
  USING (true);

-- -----------------------------------------------------------------------------
-- 9.2 Políticas para public.user_roles
-- -----------------------------------------------------------------------------
CREATE POLICY "user_roles_select_own"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "user_roles_select_staff"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (public.current_user_is_staff());

CREATE POLICY "user_roles_manage_admin"
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 9.3 Políticas para public.vet_profiles
-- -----------------------------------------------------------------------------
-- Lectura pública de veterinarios formalmente aprobados
CREATE POLICY "vet_profiles_select_approved"
  ON public.vet_profiles
  FOR SELECT
  USING (approval_status = 'approved');

-- El veterinario puede consultar y editar su propio perfil
CREATE POLICY "vet_profiles_manage_own"
  ON public.vet_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los administradores pueden ver todos los perfiles veterinarios y aprobarlos
CREATE POLICY "vet_profiles_admin_all"
  ON public.vet_profiles
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 9.4 Políticas para public.vendor_profiles
-- -----------------------------------------------------------------------------
-- Lectura pública de comercios y servicios aprobados
CREATE POLICY "vendor_profiles_select_approved"
  ON public.vendor_profiles
  FOR SELECT
  USING (approval_status = 'approved');

-- El comercio o prestador puede consultar y editar su propio perfil
CREATE POLICY "vendor_profiles_manage_own"
  ON public.vendor_profiles
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Los administradores gestionan aprobaciones y verificaciones RUC
CREATE POLICY "vendor_profiles_admin_all"
  ON public.vendor_profiles
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 9.5 Políticas para public.digital_prescriptions
-- -----------------------------------------------------------------------------
-- El veterinario emisor gestiona las recetas que ha firmado
CREATE POLICY "prescriptions_manage_by_vet"
  ON public.digital_prescriptions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.vet_profiles vp
      WHERE vp.id = digital_prescriptions.vet_id
        AND vp.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.vet_profiles vp
      WHERE vp.id = digital_prescriptions.vet_id
        AND vp.user_id = auth.uid()
    )
  );

-- El tutor/propietario puede ver las recetas emitidas para sus mascotas
CREATE POLICY "prescriptions_select_by_owner"
  ON public.digital_prescriptions
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = owner_id
    OR EXISTS (
      SELECT 1 FROM public.pets p
      WHERE p.id = digital_prescriptions.pet_id
        AND p.owner_id = auth.uid()
    )
  );

-- Comercios / Farmacias autorizadas pueden consultar recetas para validación y dispensación
CREATE POLICY "prescriptions_select_by_merchant"
  ON public.digital_prescriptions
  FOR SELECT
  TO authenticated
  USING (public.current_user_has_role('comercio'));

-- Comercios pueden actualizar estado a 'Dispensada' y registrar sus notas
CREATE POLICY "prescriptions_dispense_by_merchant"
  ON public.digital_prescriptions
  FOR UPDATE
  TO authenticated
  USING (public.current_user_has_role('comercio'))
  WITH CHECK (public.current_user_has_role('comercio'));

-- Super Admin y Administradores tienen visibilidad total y auditoría
CREATE POLICY "prescriptions_admin_all"
  ON public.digital_prescriptions
  FOR ALL
  TO authenticated
  USING (public.current_user_is_admin())
  WITH CHECK (public.current_user_is_admin());

-- -----------------------------------------------------------------------------
-- 9.6 Políticas para public.sos_dispatch_queue
-- -----------------------------------------------------------------------------
-- Cualquier usuario autenticado puede solicitar auxilio SOS
CREATE POLICY "sos_queue_insert_authenticated"
  ON public.sos_dispatch_queue
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id OR reporter_id IS NULL);

-- Los usuarios ven los tickets que ellos reportaron
CREATE POLICY "sos_queue_select_own"
  ON public.sos_dispatch_queue
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

-- Operadores, Supervisores y Admins gestionan toda la cola de despacho y asignación de unidades
CREATE POLICY "sos_queue_manage_by_staff"
  ON public.sos_dispatch_queue
  FOR ALL
  TO authenticated
  USING (public.current_user_is_staff())
  WITH CHECK (public.current_user_is_staff());

-- -----------------------------------------------------------------------------
-- 9.7 Políticas para public.audit_logs
-- -----------------------------------------------------------------------------
-- Inserción permitida para registrar eventos de auditoría del sistema
CREATE POLICY "audit_logs_insert_system"
  ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

-- Solo Super Admin y Admin tienen acceso a la lectura de auditoría inmutable
CREATE POLICY "audit_logs_select_admin"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.current_user_is_admin());

-- Usuarios pueden consultar únicamente sus propios eventos de auditoría
CREATE POLICY "audit_logs_select_own"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = actor_id);

-- =============================================================================
-- FIN DE LA MIGRACIÓN
-- =============================================================================
