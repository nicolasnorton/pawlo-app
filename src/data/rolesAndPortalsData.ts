/**
 * PAWLO™ Urban Pet Super-App — Role-Based Access Control (RBAC) & Portal Datasets
 * Cuenca, Ecuador • Quito • Bogotá
 *
 * Comprehensive TypeScript data models and initial state representations
 * for the 8 platform roles:
 * - Staff: Super Admin, Admin, Supervisor, Operator
 * - Partners: Veterinario, Comercio, Servicio
 * - Users: Usuario (Pet Owner / Tutor)
 */

// ============================================================================
// 1. ROLES & PERMISSIONS DEFINITION
// ============================================================================

export type PawloRoleId =
  | 'usuario'
  | 'veterinario'
  | 'comercio'
  | 'servicio'
  | 'operator'
  | 'supervisor'
  | 'admin'
  | 'super_admin';

export interface PawloRoleMeta {
  id: PawloRoleId;
  group: 'staff' | 'partner' | 'user';
  label: string;
  shortLabel: string;
  badgeColor: string;
  description: string;
  permissions: string[];
}

export const PAWLO_ROLES: PawloRoleMeta[] = [
  {
    id: 'super_admin',
    group: 'staff',
    label: 'Super Administrador Global',
    shortLabel: 'Super Admin',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    description: 'Acceso irrestricto al sistema, cortafuegos farmacológico, auditoría de seguridad inmutable y liquidación financiera.',
    permissions: [
      'all:access',
      'rbac:manage_roles',
      'pharma:firewall_override',
      'audit:read_immutable_logs',
      'finance:settlements',
      'system:config'
    ]
  },
  {
    id: 'admin',
    group: 'staff',
    label: 'Administrador Regional',
    shortLabel: 'Admin',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
    description: 'Validación de títulos SENESCYT, verificación de RUC/NIT, homologación de comercios y clínicas en Cuenca, Quito y Bogotá.',
    permissions: [
      'partners:approve_vets',
      'partners:approve_merchants',
      'partners:approve_services',
      'dispatches:supervise',
      'metrics:regional_view',
      'catalog:moderate'
    ]
  },
  {
    id: 'supervisor',
    group: 'staff',
    label: 'Supervisor de Emergencias & Triaje',
    shortLabel: 'Supervisor',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    description: 'Moderación de casos Código Rojo, auditoría de triaje veterinario, asignación prioritaria de flota Pet Taxi y alertas de extravío.',
    permissions: [
      'triage:override_protocol',
      'sos:moderate_queue',
      'fleet:priority_dispatch',
      'broadcast:lost_pet_alert',
      'telephony:direct_escalation'
    ]
  },
  {
    id: 'operator',
    group: 'staff',
    label: 'Operador de Despacho & Flota',
    shortLabel: 'Operador',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
    description: 'Gestión táctica de tickets SOS en tiempo real, asignación de unidades móviles, seguimiento GPS y enlace telefónico con tutores.',
    permissions: [
      'sos:view_queue',
      'fleet:assign_driver',
      'fleet:gps_telemetry',
      'chat:tutor_assistance',
      'tickets:update_status'
    ]
  },
  {
    id: 'veterinario',
    group: 'partner',
    label: 'Médico Veterinario Colegiado',
    shortLabel: 'Veterinario',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    description: 'Atención clínica presencial y telemedicina, emisión de recetas electrónicas con firma digital y actualización de carnet de vacunación.',
    permissions: [
      'clinical:create_record',
      'prescriptions:issue_digital',
      'carnet:sign_vaccines',
      'vault:access_patient_history',
      'telemedicine:video_consultation'
    ]
  },
  {
    id: 'comercio',
    group: 'partner',
    label: 'Comercio / Pet Shop & Farmacia',
    shortLabel: 'Comercio',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/40',
    description: 'Gestión de inventario de alimentos y accesorios, validación de recetas médicas de farmacia y despacho de pedidos motorizados.',
    permissions: [
      'store:manage_inventory',
      'prescriptions:validate_and_dispense',
      'orders:fulfill_and_dispatch',
      'payments:deuna_validation',
      'store:view_sales'
    ]
  },
  {
    id: 'servicio',
    group: 'partner',
    label: 'Proveedor de Servicios Especializados',
    shortLabel: 'Servicio',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
    description: 'Gestión de agenda y confirmación para Pet Taxi, Hotel Campestre, Grooming Spa móvil y Adiestramiento/Etología.',
    permissions: [
      'services:manage_calendar',
      'bookings:accept_reject',
      'bookings:update_progress',
      'checkin:qr_scanner',
      'reviews:view_ratings'
    ]
  },
  {
    id: 'usuario',
    group: 'user',
    label: 'Tutor / Propietario de Mascota',
    shortLabel: 'Tutor',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
    description: 'Bóveda digital de carnet e historial médico, activación de SOS 24/7, compras en tienda y reserva de movilidad y hospedaje.',
    permissions: [
      'pets:manage_vault',
      'sos:trigger_alert',
      'orders:create_purchase',
      'bookings:create_reservation',
      'prescriptions:view_my_pet'
    ]
  }
];

export function getRoleMeta(roleId: PawloRoleId): PawloRoleMeta {
  const role = PAWLO_ROLES.find(r => r.id === roleId);
  if (!role) {
    return PAWLO_ROLES[PAWLO_ROLES.length - 1]; // fallback to usuario
  }
  return role;
}

export function isStaffRole(roleId: PawloRoleId): boolean {
  return ['super_admin', 'admin', 'supervisor', 'operator'].includes(roleId);
}

export function isPartnerRole(roleId: PawloRoleId): boolean {
  return ['veterinario', 'comercio', 'servicio'].includes(roleId);
}

// ============================================================================
// 2. ADMIN PORTAL: PENDING APPROVALS (VETS, PET SHOPS, SERVICE PROVIDERS)
// ============================================================================

export interface PendingApprovalItem {
  id: string;
  entityType: 'veterinario' | 'comercio' | 'servicio';
  businessName: string;
  representativeName: string;
  email: string;
  phone: string;
  city: 'Cuenca' | 'Quito' | 'Bogotá';
  idDocument: {
    type: 'SENESCYT' | 'RUC' | 'MATRICULA_PROFESIONAL' | 'NIT';
    number: string;
    verified: boolean;
    verificationNotes?: string;
  };
  specialtiesOrCategory: string[];
  address: string;
  geoZone: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'in_review';
  notes?: string;
  riskScore: 'low' | 'medium' | 'high';
}

export const INITIAL_PENDING_APPROVALS: PendingApprovalItem[] = [
  {
    id: 'appr-vet-01',
    entityType: 'veterinario',
    businessName: 'Clínica Veterinaria Tomebamba & Cirugía Especializada',
    representativeName: 'Dr. Mateo Valdivieso Calle',
    email: 'm.valdivieso@tomebambavet.ec',
    phone: '+593 99 840 8369',
    city: 'Cuenca',
    idDocument: {
      type: 'SENESCYT',
      number: '1024-2018-849201',
      verified: true,
      verificationNotes: 'Título de Médico Veterinario Zootecnista registrado en Universidad de Cuenca (2018).'
    },
    specialtiesOrCategory: ['Cirugía de Tejidos Blandos', 'Traumatología', 'Cuidados Críticos'],
    address: 'Av. Paseo 3 de Noviembre y Bajada de Todos Santos',
    geoZone: 'El Vergel / Tomebamba',
    submissionDate: '2026-10-18T10:30:00Z',
    status: 'pending',
    notes: 'Documentación completa. Habilitación de farmacia interna en trámite ARCSA.',
    riskScore: 'low'
  },
  {
    id: 'appr-vet-02',
    entityType: 'veterinario',
    businessName: 'Centro Médico & Dermatología Felina Chapinero',
    representativeName: 'Dra. Camila Rivas Restrepo',
    email: 'camila.rivas@felisanabogota.co',
    phone: '+57 310 492 8812',
    city: 'Bogotá',
    idDocument: {
      type: 'MATRICULA_PROFESIONAL',
      number: 'COMVEZCOL-38291',
      verified: true,
      verificationNotes: 'Certificación profesional COMVEZCOL vigente. Especialidad en Medicina Felina.'
    },
    specialtiesOrCategory: ['Medicina Felina Cat-Friendly', 'Dermatología', 'Citología Clínica'],
    address: 'Carrera 7 # 64-28, Chapinero Alto',
    geoZone: 'Chapinero / Zona G',
    submissionDate: '2026-10-19T08:15:00Z',
    status: 'in_review',
    notes: 'Solicitud de homologación para portal de telemedicina andina Bogotá-Cuenca.',
    riskScore: 'low'
  },
  {
    id: 'appr-merch-01',
    entityType: 'comercio',
    businessName: 'Pet Gourmet & Pharma Andina Cía. Ltda.',
    representativeName: 'Ing. Paulina Carvallo Merchán',
    email: 'contacto@petgourmetandina.com',
    phone: '+593 98 712 3456',
    city: 'Quito',
    idDocument: {
      type: 'RUC',
      number: '1792847192001',
      verified: true,
      verificationNotes: 'RUC activo en SRI, régimen general. Autorización sanitaria ARCSA vigente.'
    },
    specialtiesOrCategory: ['Alimentos Medicados Super-Premium', 'Farmacia Oncológica & Articular', 'Suplementos'],
    address: 'Av. Interoceánica km 11.5, Sector Cumbayá',
    geoZone: 'Cumbayá / Tumbaco',
    submissionDate: '2026-10-19T14:45:00Z',
    status: 'pending',
    notes: 'Distribuidor certificado de dietas Royal Canin Veterinary e insumos para el cortafuegos farmacológico.',
    riskScore: 'low'
  },
  {
    id: 'appr-serv-01',
    entityType: 'servicio',
    businessName: 'Pawlo Taxi VIP & Ambulancia Móvil Canina',
    representativeName: 'Marcelo Pesántez Ochoa',
    email: 'marcelo.taxi@pawlomobility.ec',
    phone: '+593 99 413 4520',
    city: 'Cuenca',
    idDocument: {
      type: 'RUC',
      number: '0104829104001',
      verified: true,
      verificationNotes: 'Permiso de operación de transporte comercial privado certificado por PAWLO Mobility.'
    },
    specialtiesOrCategory: ['Pet Taxi Climatizado', 'Traslado de Urgencia Código Rojo', 'Retorno Post-Quirúrgico'],
    address: 'Av. Ordóñez Lasso y Jacarandá',
    geoZone: 'Puertas del Sol / Yanuncay',
    submissionDate: '2026-10-20T09:00:00Z',
    status: 'pending',
    notes: 'Flota equipada con anclajes ISOFIX, oxígeno suplementario portátil y rampa para pacientes geriátricos.',
    riskScore: 'low'
  },
  {
    id: 'appr-vet-03',
    entityType: 'veterinario',
    businessName: 'Oncología & Medicina Interna Veterinaria La Carolina',
    representativeName: 'Dra. Sofía Ordóñez Echeverría',
    email: 'sofia.ordonez@oncovetquito.ec',
    phone: '+593 99 234 5678',
    city: 'Quito',
    idDocument: {
      type: 'SENESCYT',
      number: '1005-2019-948123',
      verified: true,
      verificationNotes: 'Título de Especialista en Oncología y Quimioterapia de Animales Pequeños.'
    },
    specialtiesOrCategory: ['Oncología', 'Medicina Interna', 'Manejo del Dolor'],
    address: 'Av. República de El Salvador y Moscú',
    geoZone: 'La Carolina / Iñaquito',
    submissionDate: '2026-10-17T16:20:00Z',
    status: 'in_review',
    notes: 'Requiere firma digital habilitada para prescripción de analgésicos narcóticos grado controlado.',
    riskScore: 'medium'
  },
  {
    id: 'appr-serv-02',
    entityType: 'servicio',
    businessName: 'Doggy Camp & Resort Sabana',
    representativeName: 'Felipe Gómez Santamaría',
    email: 'reservas@doggycampsabana.co',
    phone: '+57 315 889 0145',
    city: 'Bogotá',
    idDocument: {
      type: 'NIT',
      number: '900.839.120-1',
      verified: true,
      verificationNotes: 'Cámara de Comercio de Bogotá al día. Certificación de bienestar libre de jaulas.'
    },
    specialtiesOrCategory: ['Hospedaje Campestre Libre de Jaulas', 'Etología Positiva', 'Natación Terapéutica'],
    address: 'Km 3 Vía Chía - Cota, Vereda El Abra',
    geoZone: 'Sabana Norte / Chía',
    submissionDate: '2026-10-16T11:00:00Z',
    status: 'pending',
    notes: 'Instalaciones de 8.000 m² con monitoreo de cámaras HD 24/7 vinculadas a la app.',
    riskScore: 'low'
  },
  {
    id: 'appr-merch-02',
    entityType: 'comercio',
    businessName: 'Farmavet Austro Express',
    representativeName: 'Bioq. Farm. Esteban Mendieta',
    email: 'farmacia@farmavetaustro.com',
    phone: '+593 99 112 2334',
    city: 'Cuenca',
    idDocument: {
      type: 'RUC',
      number: '0190182746001',
      verified: false,
      verificationNotes: 'Pendiente copia legalizada de nombramiento de Regente Farmacéutico.'
    },
    specialtiesOrCategory: ['Farmacia Veterinaria', 'Vacunas con Cadena de Frío', 'Nutracéuticos'],
    address: 'Av. España y Sebastián de Benalcázar',
    geoZone: 'Terminal Terrestre / Totoracocha',
    submissionDate: '2026-10-20T11:45:00Z',
    status: 'pending',
    notes: 'Riesgo medio por falta de acreditación del regente farmacéutico para despacho de psicotrópicos.',
    riskScore: 'medium'
  }
];

// ============================================================================
// 3. SUPER ADMIN: IMMUTABLE AUDIT LOGS & PHARMACOLOGICAL FIREWALL
// ============================================================================

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: PawloRoleId;
  action:
    | 'PHARMA_RESTRICTED_DISPENSE_BLOCKED'
    | 'PHARMA_RESTRICTED_DISPENSE_AUTHORIZED'
    | 'RBAC_PERMISSION_ESCALATION_ATTEMPT'
    | 'VET_SENESCYT_VERIFICATION'
    | 'EMERGENCY_CODE_RED_OVERRIDE'
    | 'DEUNA_P2P_WEBHOOK_VALIDATED'
    | 'QR_INTERBANK_WEBHOOK_VALIDATED'
    | 'PET_VAULT_DECRYPTION_ACCESSED'
    | 'IMMUTABLE_CHAIN_HEARTBEAT';
  category: 'security' | 'pharmacological' | 'rbac' | 'financial' | 'compliance';
  ipAddress: string;
  city: string;
  resourceAffected: string;
  severity: 'info' | 'warning' | 'critical' | 'alert';
  details: {
    ruleTriggered?: string;
    targetPetMicrochip?: string;
    prescriptionCode?: string;
    payloadHash?: string;
    reason?: string;
    rawMessage?: string;
  };
  hashSignature: string; // SHA-256 tamper-evident proof
}

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-20T13:12:04Z',
    actorId: 'system-firewall',
    actorName: 'PAWLO PharmaFirewall Agent v2.4',
    actorRole: 'super_admin',
    action: 'PHARMA_RESTRICTED_DISPENSE_BLOCKED',
    category: 'pharmacological',
    ipAddress: '190.152.17.82',
    city: 'Cuenca',
    resourceAffected: 'prescription:RX-2026-VET-UNVERIFIED',
    severity: 'critical',
    details: {
      ruleTriggered: 'SEC-PHARMA-003: Tramadol/Gabapentina requiere firma digital RSA-PSS de Vet Activo',
      targetPetMicrochip: '981098104592831',
      prescriptionCode: 'RX-2026-VET-UNVERIFIED',
      reason: 'Intento de canje en farmacia externa sin hash de firma digital validado por SENESCYT.',
      rawMessage: 'Cortafuegos bloqueó la dispensación no autorizada de 20 cápsulas de Tramadol 50mg.'
    },
    hashSignature: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-20T12:45:19Z',
    actorId: 'usr-admin-cuenca',
    actorName: 'Dra. Elena Moscoso (Admin Cuenca)',
    actorRole: 'admin',
    action: 'VET_SENESCYT_VERIFICATION',
    category: 'compliance',
    ipAddress: '186.46.128.91',
    city: 'Cuenca',
    resourceAffected: 'vet:1024-2018-849201',
    severity: 'info',
    details: {
      ruleTriggered: 'SENESCYT_REGISTRY_SYNC_V1',
      payloadHash: 'a7c938d9284fa92019b88231c93a02847291a83b',
      reason: 'Validación en vivo contra Registro Público de Grados SENESCYT superada exitosamente.',
      rawMessage: 'Homologación de credencial médica Dr. Mateo Valdivieso Calle completada.'
    },
    hashSignature: 'f852b855e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b'
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-20T11:20:00Z',
    actorId: 'usr-sup-01',
    actorName: 'Capt. Juan Diego Serrano (Supervisor)',
    actorRole: 'supervisor',
    action: 'EMERGENCY_CODE_RED_OVERRIDE',
    category: 'compliance',
    ipAddress: '190.152.33.10',
    city: 'Cuenca',
    resourceAffected: 'ticket:SOS-2026-0841',
    severity: 'warning',
    details: {
      ruleTriggered: 'TRIAGE_FAST_TRACK_DISPATCH',
      targetPetMicrochip: '981098107734199',
      reason: 'Trauma vehicular múltiple canino en Av. Huayna Cápac. Autorizado traslado con rampa sin prepago.',
      rawMessage: 'Supervisor activó Pet Taxi Móvil 02 en código de urgencia médica hacia Hosp. El Paraíso.'
    },
    hashSignature: '849201e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b9201'
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-20T10:05:44Z',
    actorId: 'gateway-sec',
    actorName: 'PAWLO WAF & Rate Limiter',
    actorRole: 'super_admin',
    action: 'RBAC_PERMISSION_ESCALATION_ATTEMPT',
    category: 'security',
    ipAddress: '45.181.79.112',
    city: 'Bogotá',
    resourceAffected: 'endpoint:/api/v1/admin/roles/grant',
    severity: 'critical',
    details: {
      ruleTriggered: 'SEC-RBAC-001: Token JWT sin claim super_admin intentó mutar tabla user_roles',
      reason: 'Firma JWT alterada; claim de rol manipulado de usuario a super_admin.',
      rawMessage: 'Ataque de elevación de privilegios bloqueado. Dirección IP en lista negra 24h.'
    },
    hashSignature: 'c8996fb92427ae41e4649b934ca495991be3b0c44298fc1c149afbf47852b855'
  },
  {
    id: 'aud-005',
    timestamp: '2026-10-20T09:30:12Z',
    actorId: 'payment-webhook-qr',
    actorName: 'Pasarela Nacional QR Interbancario (DeUna / Sipy / Peigo)',
    actorRole: 'super_admin',
    action: 'QR_INTERBANK_WEBHOOK_VALIDATED',
    category: 'financial',
    ipAddress: '200.107.130.45',
    city: 'Quito',
    resourceAffected: 'order:ORD-2026-4412',
    severity: 'info',
    details: {
      ruleTriggered: 'QR_DEUNA_SIPY_PEIGO_RECONCILIATION',
      payloadHash: 'b492019b88231c93a02847291a83ba7c938d9284',
      reason: 'Liquidación de $68.50 USD confirmada vía QR P2P interbancario instantáneo (DeUna / Sipy / Peigo).',
      rawMessage: 'Orden ORD-2026-4412 liberada para validación farmacéutica de receta.'
    },
    hashSignature: '92427ae41e4649b934ca495991be3b0c44298fc1c149afbf4c8996fb7852b855'
  },
  {
    id: 'aud-006',
    timestamp: '2026-10-20T08:15:30Z',
    actorId: 'vet-dr-mateo',
    actorName: 'Dr. Mateo Valdivieso Calle',
    actorRole: 'veterinario',
    action: 'PHARMA_RESTRICTED_DISPENSE_AUTHORIZED',
    category: 'pharmacological',
    ipAddress: '186.46.128.91',
    city: 'Cuenca',
    resourceAffected: 'prescription:RX-2026-VET-7841',
    severity: 'info',
    details: {
      ruleTriggered: 'PHARMA_AUTHORIZED_DISPENSE',
      targetPetMicrochip: '981098104592831',
      prescriptionCode: 'RX-2026-VET-7841',
      reason: 'Prescripción de Apoquel (Oclacitinib) 5.4mg debidamente refrendada con firma digital.',
      rawMessage: 'Emisión electrónica aprobada para paciente Bruno. Válida por 30 días.'
    },
    hashSignature: '1c149afbf4c8996fb92427ae41e4649b934ca495991be3b0c44298fc7852b855'
  }
];

// ============================================================================
// 4. SUPERVISOR & OPERATOR: EMERGENCY SOS & PET TAXI DISPATCH TICKETS
// ============================================================================

export interface SosDispatchTicket {
  id: string;
  ticketNumber: string;
  petName: string;
  species: 'canine' | 'feline' | 'other';
  breed: string;
  microchipIso?: string;
  triageLevel: 'CODE_RED' | 'CODE_ORANGE' | 'CODE_YELLOW' | 'LOST_PET_ALERT';
  conditionSummary: string;
  reporterName: string;
  reporterPhone: string;
  reporterRole: 'tutor' | 'witness' | 'rescuer';
  locationName: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  sector: string;
  city: 'Cuenca' | 'Quito' | 'Bogotá';
  assignedUnit?: {
    id: string;
    driverName: string;
    vehicleType: string;
    plate: string;
    etaMinutes: number;
    contactPhone: string;
  };
  destinationClinic?: {
    name: string;
    address: string;
    isEmergency24h: boolean;
    vetOnDuty: string;
  };
  status:
    | 'OPEN_TRIAGE'
    | 'UNIT_DISPATCHED'
    | 'EN_ROUTE'
    | 'ON_SCENE'
    | 'TRANSPORTING_TO_CLINIC'
    | 'RESOLVED'
    | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  notes: string[];
}

export const INITIAL_SOS_TICKETS: SosDispatchTicket[] = [
  {
    id: 'sos-tick-01',
    ticketNumber: 'SOS-2026-0841',
    petName: 'Thor',
    species: 'canine',
    breed: 'Golden Retriever',
    microchipIso: '981098107734199',
    triageLevel: 'CODE_RED',
    conditionSummary: 'Atropellamiento en vía principal con sospecha de fractura pélvica y hemorragia moderada. Consciencia conservada.',
    reporterName: 'Carlos Dávila (Tutor)',
    reporterPhone: '+593 99 840 8369',
    reporterRole: 'tutor',
    locationName: 'Av. Huayna Cápac y Pío Bravo',
    coordinates: { lat: -2.8954, lng: -78.9982 },
    sector: 'San Blas / Huayna Cápac',
    city: 'Cuenca',
    assignedUnit: {
      id: 'unit-taxi-02',
      driverName: 'Marcelo Pesántez (Móvil 02)',
      vehicleType: 'Van Climatizada Isofix + Camilla Ortopédica',
      plate: 'AFA-1892',
      etaMinutes: 4,
      contactPhone: '+593 99 413 4520'
    },
    destinationClinic: {
      name: 'Hospital Veterinario El Paraíso (Emergencias 24h)',
      address: 'Av. 10 de Agosto y Av. Fray Vicente Solano',
      isEmergency24h: true,
      vetOnDuty: 'Dr. Fernando Arízaga'
    },
    status: 'TRANSPORTING_TO_CLINIC',
    createdAt: '2026-10-20T13:05:00Z',
    updatedAt: '2026-10-20T13:22:00Z',
    notes: [
      '13:05 - Alerta de Código Rojo recibida por app con geolocalización GPS activa.',
      '13:07 - Operador asignó Móvil 02 con rampa y botiquín hemostático.',
      '13:14 - Conductor en escena; paciente estabilizado sobre camilla rígida.',
      '13:19 - En traslado hacia Hospital El Paraíso. Shock room alertado.'
    ]
  },
  {
    id: 'sos-tick-02',
    ticketNumber: 'SOS-2026-0842',
    petName: 'Luna',
    species: 'canine',
    breed: 'Siberian Husky',
    microchipIso: '981098109923841',
    triageLevel: 'LOST_PET_ALERT',
    conditionSummary: 'Hembra extraviada tras asustarse con petardos en área del parque. Lleva collar celeste reflectivo con placa QR PAWLO.',
    reporterName: 'María Valentina Cordero',
    reporterPhone: '+593 98 411 2233',
    reporterRole: 'tutor',
    locationName: 'Parque de la Madre (Sector Planetario)',
    coordinates: { lat: -2.9034, lng: -79.0062 },
    sector: 'El Vergel / Tomebamba',
    city: 'Cuenca',
    status: 'OPEN_TRIAGE',
    createdAt: '2026-10-20T12:40:00Z',
    updatedAt: '2026-10-20T13:00:00Z',
    notes: [
      '12:40 - Tutor activó modo Pérdida en la Bóveda Digital.',
      '12:42 - Sistema emitió radio-alerta perimetral de 2.5 km a 340 tutores cercanos.',
      '12:55 - Testigo reportó avistamiento cerca de Puente Roto.'
    ]
  },
  {
    id: 'sos-tick-03',
    ticketNumber: 'SOS-2026-0839',
    petName: 'Simba',
    species: 'feline',
    breed: 'Persa Americano',
    microchipIso: '981098103348120',
    triageLevel: 'CODE_ORANGE',
    conditionSummary: 'Obstrucción uretral felina aguda (estranguria > 18 horas), vocalización de dolor y temperatura rectal subnormal (37.2°C).',
    reporterName: 'Ing. Gabriela Malo',
    reporterPhone: '+593 99 712 3456',
    reporterRole: 'tutor',
    locationName: 'Edificio Los Cerezos, Av. Ordóñez Lasso',
    coordinates: { lat: -2.8912, lng: -79.0298 },
    sector: 'Puertas del Sol',
    city: 'Cuenca',
    assignedUnit: {
      id: 'unit-taxi-05',
      driverName: 'Jorge Cabrera (Móvil 05)',
      vehicleType: 'Sedán Eco Climatizado con Cabina Felina Tranquila',
      plate: 'ABC-4581',
      etaMinutes: 8,
      contactPhone: '+593 99 112 2334'
    },
    destinationClinic: {
      name: 'Clínica Veterinaria Tomebamba & Cat Clinic',
      address: 'Paseo 3 de Noviembre y Bajada de Todos Santos',
      isEmergency24h: true,
      vetOnDuty: 'Dr. Mateo Valdivieso'
    },
    status: 'EN_ROUTE',
    createdAt: '2026-10-20T12:15:00Z',
    updatedAt: '2026-10-20T13:10:00Z',
    notes: [
      '12:15 - Solicitud de traslado especializado felino por retención de orina.',
      '12:20 - Operador validó carnet y antecedentes de FLUTD en la Bóveda.',
      '12:28 - Móvil 05 en camino con difusor de feromonas Feliway a bordo.'
    ]
  },
  {
    id: 'sos-tick-04',
    ticketNumber: 'SOS-2026-0835',
    petName: 'Rocky',
    species: 'canine',
    breed: 'Bulldog Francés',
    microchipIso: '981098101192834',
    triageLevel: 'CODE_RED',
    conditionSummary: 'Golpe de calor por ejercicio al mediodía con hipertermia 40.8°C, cianosis lingual y estridor inspiratorio severo.',
    reporterName: 'David Cárdenas',
    reporterPhone: '+593 99 345 6789',
    reporterRole: 'tutor',
    locationName: 'Pista Atlética Parque La Carolina',
    coordinates: { lat: -0.1807, lng: -78.4842 },
    sector: 'La Carolina',
    city: 'Quito',
    assignedUnit: {
      id: 'unit-uio-01',
      driverName: 'Santiago Paz (Ambulancia Quito 01)',
      vehicleType: 'Ambulancia Veterinaria con Oxigenoterapia',
      plate: 'PBA-9201',
      etaMinutes: 2,
      contactPhone: '+593 99 901 2345'
    },
    destinationClinic: {
      name: 'Hospital Veterinario Metropolitano Quito',
      address: 'Av. Eloy Alfaro y Mariana de Jesús',
      isEmergency24h: true,
      vetOnDuty: 'Dra. Patricia Alarcón'
    },
    status: 'ON_SCENE',
    createdAt: '2026-10-20T11:45:00Z',
    updatedAt: '2026-10-20T12:10:00Z',
    notes: [
      '11:45 - Tutor reportó colapso respiratorio en parque La Carolina.',
      '11:48 - Ambulancia UIO-01 arribó al punto; paciente bajo carpa de enfriamiento progresivo y flujo de O2.'
    ]
  },
  {
    id: 'sos-tick-05',
    ticketNumber: 'SOS-2026-0820',
    petName: 'Milo',
    species: 'canine',
    breed: 'Beagle',
    microchipIso: '981098106629182',
    triageLevel: 'LOST_PET_ALERT',
    conditionSummary: 'Beagle macho tricolor de 3 años, collar verde limón con teléfono bordado, perdido en zona occidental de Bogotá.',
    reporterName: 'Catalina Suárez',
    reporterPhone: '+57 312 901 8492',
    reporterRole: 'tutor',
    locationName: 'Parque Metropolitano Simón Bolívar',
    coordinates: { lat: 4.6584, lng: -74.0935 },
    sector: 'Teusaquillo / Salitre',
    city: 'Bogotá',
    status: 'RESOLVED',
    createdAt: '2026-10-19T15:20:00Z',
    updatedAt: '2026-10-19T18:45:00Z',
    notes: [
      '15:20 - Alerta de pérdida activada.',
      '17:10 - Vecino escaneó código QR de la placa PAWLO en sector Ciudad Salitre.',
      '18:45 - Reencuentro confirmado y ticket cerrado con éxito.'
    ]
  }
];

// ============================================================================
// 5. VETERINARIAN PORTAL: PATIENT CONSULTATIONS & CLINICAL TRIAGE
// ============================================================================

export interface VetPatientConsultation {
  id: string;
  petId: string;
  petName: 'Bruno' | 'Mía' | 'Thor' | 'Luna' | string;
  species: 'canine' | 'feline';
  breed: string;
  microchipIso: string;
  cmvCode?: string; // Colegio de Médicos Veterinarios (Registro Privado)
  pawloCode?: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string;
  consultationDate: string;
  reason: string;
  symptoms: string[];
  vitalSigns: {
    weightKg: number;
    tempCelsius: number;
    heartRateBpm: number;
    capillaryRefillSec: number;
  };
  diagnosis: string;
  treatmentPlan: string;
  prescriptionStatus: 'Sin Receta' | 'Receta Emitida' | 'Receta Dispensada' | 'En Espera de Exámenes';
  prescriptionId?: string;
  attendingVet: {
    name: string;
    senescytLicense: string;
    clinic: string;
  };
  followUpDate?: string;
  notes?: string;
}

export const INITIAL_VET_CONSULTATIONS: VetPatientConsultation[] = [
  {
    id: 'vcon-bruno-01',
    petId: 'pet-bruno-01',
    petName: 'Bruno',
    species: 'canine',
    breed: 'Schnauzer Miniatura',
    microchipIso: '981098104592831',
    cmvCode: 'CMV-CUE-004592',
    ownerName: 'Carlos E. Serrano',
    ownerPhone: '+593 99 840 8369',
    ownerEmail: 'carlos.serrano@pawlo.ec',
    consultationDate: '2026-10-20T09:30:00Z',
    reason: 'Control dermatológico y prurito podal persistente',
    symptoms: [
      'Lamedo compulsivo de miembros anteriores',
      'Eritema interdigital bilateral',
      'Descamación leve en pabellón auricular',
      'Otitis externa ceruminosa incipiente'
    ],
    vitalSigns: {
      weightKg: 8.6,
      tempCelsius: 38.4,
      heartRateBpm: 98,
      capillaryRefillSec: 1.5
    },
    diagnosis: 'Dermatitis atópica canina estacional exacerbada por polen andino + Sobrecrecimiento secundario de Malassezia pachydermatis en pabellón ótico.',
    treatmentPlan: 'Oclacitinib 5.4mg cada 12 horas por 14 días, luego cada 24 horas. Limpieza ótica con solución astringente y gotas antibacterianas/antifúngicas por 7 días. Baño terapéutico con champú de clorhexidina al 3%.',
    prescriptionStatus: 'Receta Emitida',
    prescriptionId: 'RX-2026-VET-7841',
    attendingVet: {
      name: 'Dr. Mateo Valdivieso Calle',
      senescytLicense: '1024-2018-849201',
      clinic: 'Clínica Veterinaria Tomebamba'
    },
    followUpDate: '2026-11-04',
    notes: 'Paciente cooperativo. Carnet de vacunas al día. Se programa control de peso y revisión dérmica en dos semanas.'
  },
  {
    id: 'vcon-mia-01',
    petId: 'pet-mia-02',
    petName: 'Mía',
    species: 'feline',
    breed: 'Siamés Mestizo',
    microchipIso: '981098108843120',
    cmvCode: 'CMV-CUE-008843',
    ownerName: 'Andrea Montesdeoca',
    ownerPhone: '+593 98 765 4321',
    ownerEmail: 'andrea.montes@cuencamail.ec',
    consultationDate: '2026-10-18T16:00:00Z',
    reason: 'Vómito de bolas de pelo, disorexia y heces secas',
    symptoms: [
      'Arcadas no productivas postprandiales',
      'Reducción moderada del consumo de agua',
      'Episodio de estreñimiento (48 horas sin defecar)',
      'Apatía leve al juego'
    ],
    vitalSigns: {
      weightKg: 4.1,
      tempCelsius: 38.6,
      heartRateBpm: 154,
      capillaryRefillSec: 1.2
    },
    diagnosis: 'Tricobezoares gástricos e hipomotilidad colónica leve por ingesta excesiva de pelo durante muda estacional.',
    treatmentPlan: 'Administración de pasta de malta palatable 3 cm diarios por 5 días. Transición a dieta alta en fibra soluble (Royal Canin Hairball Care). Hidratación parenteral subcutánea de soporte (80 ml solución Ringer Lactato) aplicada en clínica.',
    prescriptionStatus: 'Receta Dispensada',
    prescriptionId: 'RX-2026-VET-5104',
    attendingVet: {
      name: 'Dra. María Belén Alvarado',
      senescytLicense: '1012-2019-748392',
      clinic: 'Hospital Veterinario El Paraíso'
    },
    followUpDate: '2026-10-25',
    notes: 'Evolución favorable tras enema suave y malta. Se sugiere cepillado diario con carda suave antinudos.'
  },
  {
    id: 'vcon-thor-01',
    petId: 'pet-thor-03',
    petName: 'Thor',
    species: 'canine',
    breed: 'Golden Retriever',
    microchipIso: '981098107734199',
    cmvCode: 'CMV-CUE-007734',
    ownerName: 'Dr. Fernando Dávila',
    ownerPhone: '+593 99 840 8369',
    ownerEmail: 'fdavila@austromed.com',
    consultationDate: '2026-10-20T13:30:00Z',
    reason: 'Urgencia por atropellamiento y claudicación posterior derecha Grado IV',
    symptoms: [
      'Incapacidad de apoyo en miembro pélvico derecho',
      'Dolor agudo a la palpación de articulación coxofemoral',
      'Edema moderado en zona glútea',
      'Signos de abrasión superficial en flanco derecho'
    ],
    vitalSigns: {
      weightKg: 34.2,
      tempCelsius: 38.9,
      heartRateBpm: 128,
      capillaryRefillSec: 2.0
    },
    diagnosis: 'Contusión pélvica severa con esguince de ligamento cruzado anterior sin fractura ósea evidente en radiografía digital bidireccional. Abrasiones dérmicas sin compromiso vascular.',
    treatmentPlan: 'Infiltración analgésica de rescate con Meloxicam inyectable. Protocolo de reposo estricto de 21 días. Meloxicam jarabe 2.5mg cada 24 horas por 7 días + Condroprotector Cosequin DS 2 tabletas/día.',
    prescriptionStatus: 'Receta Emitida',
    prescriptionId: 'RX-2026-VET-6920',
    attendingVet: {
      name: 'Dr. Fernando Arízaga',
      senescytLicense: '1008-2015-384910',
      clinic: 'Hospital Veterinario El Paraíso'
    },
    followUpDate: '2026-10-27',
    notes: 'Ingreso facilitado por unidad SOS Móvil 02 de PAWLO. Se programa control radiológico a los 10 días para descartar fisuras tardías.'
  },
  {
    id: 'vcon-luna-01',
    petId: 'pet-luna-04',
    petName: 'Luna',
    species: 'canine',
    breed: 'Siberian Husky',
    microchipIso: '981098109923841',
    cmvCode: 'CMV-CUE-009923',
    ownerName: 'María Valentina Cordero',
    ownerPhone: '+593 98 411 2233',
    ownerEmail: 'valentina.cordero@outlook.ec',
    consultationDate: '2026-10-20T13:45:00Z',
    reason: 'Chequeo médico post-rescate y evaluación de estrés agudo',
    symptoms: [
      'Deshidratación clínica estimada en 5%',
      'Cojinetes plantares erosionados por asfalto caliente',
      'Temblor por ansiedad y taquipnea',
      'Agotamiento físico extremo'
    ],
    vitalSigns: {
      weightKg: 21.8,
      tempCelsius: 38.5,
      heartRateBpm: 110,
      capillaryRefillSec: 1.8
    },
    diagnosis: 'Excoriaciones por fricción en cojinetes plantares post-extravío urbano + Deshidratación moderada y estrés fóbico inducido por pirotecnia.',
    treatmentPlan: 'Limpieza con clorhexidina 0.5% en cojinetes y curación con ungüento dérmico regenerador de caléndula, óxido de zinc y neomicina. Suero oral electrolítico sabor carne ad libitum. Suplementación con L-teanina para reducción de ansiedad.',
    prescriptionStatus: 'Receta Emitida',
    prescriptionId: 'RX-2026-VET-3301',
    attendingVet: {
      name: 'Dr. Mateo Valdivieso Calle',
      senescytLicense: '1024-2018-849201',
      clinic: 'Clínica Veterinaria Tomebamba'
    },
    followUpDate: '2026-10-28',
    notes: 'Microchip verificado en lector ISO 11784. Coincide exactamente con el registro del carnet de PAWLO.'
  }
];

// ============================================================================
// 6. VETERINARIAN & PHARMACY: DIGITAL PRESCRIPTIONS WITH ELECTRONIC SIGNATURE
// ============================================================================

export interface PrescriptionMedicationItem {
  tradeName: string;
  genericName: string;
  presentation: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  quantity: number;
  requiresPharmacologicalControl: boolean;
}

export interface DigitalPrescription {
  id: string;
  prescriptionCode: string;
  petName: string;
  petSpecies: 'canine' | 'feline';
  microchipIso: string;
  ownerName: string;
  ownerIdDoc: string;
  vetName: string;
  vetSenescytLicense: string;
  clinicName: string;
  issuedAt: string;
  expiresAt: string;
  medications: PrescriptionMedicationItem[];
  indications: string;
  digitalSignature: {
    hash: string;
    algorithm: string;
    timestamp: string;
    verified: boolean;
  };
  status: 'Activa' | 'Dispensada' | 'Expirada';
  dispensedBy?: {
    pharmacyName: string;
    ruc: string;
    dispensedAt: string;
    pharmacistNotes?: string;
  };
}

export const INITIAL_PRESCRIPTIONS: DigitalPrescription[] = [
  {
    id: 'rx-001',
    prescriptionCode: 'RX-2026-VET-7841',
    petName: 'Bruno',
    petSpecies: 'canine',
    microchipIso: '981098104592831',
    ownerName: 'Carlos E. Serrano',
    ownerIdDoc: '0104829104',
    vetName: 'Dr. Mateo Valdivieso Calle',
    vetSenescytLicense: '1024-2018-849201',
    clinicName: 'Clínica Veterinaria Tomebamba',
    issuedAt: '2026-10-20T09:40:00Z',
    expiresAt: '2026-11-20T23:59:59Z',
    medications: [
      {
        tradeName: 'Apoquel Tabletas 5.4mg',
        genericName: 'Oclacitinib Maleato',
        presentation: 'Caja con 20 comprimidos orales ranurados',
        dosage: '1 tableta (5.4mg)',
        frequency: 'Cada 12 horas por 14 días, luego 1 tableta cada 24 horas',
        durationDays: 30,
        quantity: 1,
        requiresPharmacologicalControl: true
      },
      {
        tradeName: 'Otovet Gotas Óticas',
        genericName: 'Marbofloxacino + Clotrimazol + Dexametasona',
        presentation: 'Frasco gotero de 15 ml',
        dosage: '4 gotas en canal auditivo externo bilateral',
        frequency: 'Cada 12 horas previo aseo suave',
        durationDays: 7,
        quantity: 1,
        requiresPharmacologicalControl: false
      }
    ],
    indications: 'No interrumpir abruptamente el tratamiento anti-pruriginoso. Aplicar las gotas óticas siempre después del aseo con solución neutra. Control médico al término del tratamiento.',
    digitalSignature: {
      hash: 'sha256:d8a9201f8247ca8996fb92427ae41e4649b934ca495991be3b0c44298fc7852b',
      algorithm: 'RSA-PSS-SHA256 (SENESCYT Pkix Token)',
      timestamp: '2026-10-20T09:42:15Z',
      verified: true
    },
    status: 'Activa'
  },
  {
    id: 'rx-002',
    prescriptionCode: 'RX-2026-VET-6920',
    petName: 'Thor',
    petSpecies: 'canine',
    microchipIso: '981098107734199',
    ownerName: 'Dr. Fernando Dávila',
    ownerIdDoc: '0102938475',
    vetName: 'Dr. Fernando Arízaga',
    vetSenescytLicense: '1008-2015-384910',
    clinicName: 'Hospital Veterinario El Paraíso',
    issuedAt: '2026-10-20T13:40:00Z',
    expiresAt: '2026-11-05T23:59:59Z',
    medications: [
      {
        tradeName: 'MeloxiVet Suspensión Oral 1.5mg/ml',
        genericName: 'Meloxicam Oral Canino',
        presentation: 'Frasco con jeringa dosificadora calibrada por kg',
        dosage: '0.1 mg/kg con el alimento del mediodía',
        frequency: 'Cada 24 horas por 6 días',
        durationDays: 6,
        quantity: 1,
        requiresPharmacologicalControl: true
      },
      {
        tradeName: 'Cosequin Ultra Máxima Fuerza',
        genericName: 'Glucosamina HCl + Condroitín Sulfato + ASU',
        presentation: 'Frasco con 80 comprimidos masticables sabor a pollo',
        dosage: '2 comprimidos diarios con el desayuno',
        frequency: 'Cada 24 horas continuo',
        durationDays: 40,
        quantity: 1,
        requiresPharmacologicalControl: false
      }
    ],
    indications: 'Proteger mucosa gástrica administrando el AINE inmediatamente con comida sólida. Suspender en caso de vómito o melena.',
    digitalSignature: {
      hash: 'sha256:7b9201a83ba7c938d9284fa92019b88231c93a02847291a83be3b0c44298fc1c14',
      algorithm: 'RSA-PSS-SHA256 (SENESCYT Pkix Token)',
      timestamp: '2026-10-20T13:44:00Z',
      verified: true
    },
    status: 'Dispensada',
    dispensedBy: {
      pharmacyName: 'Farmavet Austro Express',
      ruc: '0190182746001',
      dispensedAt: '2026-10-20T14:15:00Z',
      pharmacistNotes: 'Validado lote de fábrica y fecha de caducidad vigente (Vencimiento: 08/2028).'
    }
  },
  {
    id: 'rx-003',
    prescriptionCode: 'RX-2026-VET-5104',
    petName: 'Mía',
    petSpecies: 'feline',
    microchipIso: '981098108843120',
    ownerName: 'Andrea Montesdeoca',
    ownerIdDoc: '0105829102',
    vetName: 'Dra. María Belén Alvarado',
    vetSenescytLicense: '1012-2019-748392',
    clinicName: 'Hospital Veterinario El Paraíso',
    issuedAt: '2026-10-18T16:25:00Z',
    expiresAt: '2026-11-18T23:59:59Z',
    medications: [
      {
        tradeName: 'Gastri-Cat Pasta Malteada Reguladora',
        genericName: 'Extracto de malta con aceite mineral purificado y taurina',
        presentation: 'Tubo de pasta oral de 100g',
        dosage: '3 cm de pasta directo en pata o boca',
        frequency: 'Cada 24 horas por 7 días, luego 2 veces por semana',
        durationDays: 30,
        quantity: 1,
        requiresPharmacologicalControl: false
      },
      {
        tradeName: 'Cystease Feline Suplemento Urinario',
        genericName: 'N-Acetil D-Glucosamina + L-Triptófano',
        presentation: 'Caja con 30 cápsulas para abrir sobre la comida húmeda',
        dosage: '1 cápsula espolvoreada',
        frequency: 'Cada 24 horas',
        durationDays: 30,
        quantity: 1,
        requiresPharmacologicalControl: false
      }
    ],
    indications: 'Proveer fuentes de agua fresca filtrada permanente en distintos ambientes de la casa.',
    digitalSignature: {
      hash: 'sha256:92427ae41e4649b934ca495991be3b0c44298fc1c149afbf4c8996fb7852b855a',
      algorithm: 'RSA-PSS-SHA256 (SENESCYT Pkix Token)',
      timestamp: '2026-10-18T16:28:10Z',
      verified: true
    },
    status: 'Dispensada',
    dispensedBy: {
      pharmacyName: 'Pet Gourmet & Pharma Andina',
      ruc: '1792847192001',
      dispensedAt: '2026-10-18T17:30:00Z',
      pharmacistNotes: 'Dispensado en sucursal con comprobante de factura electrónica RUC 1792847192001.'
    }
  },
  {
    id: 'rx-004',
    prescriptionCode: 'RX-2026-VET-3301',
    petName: 'Luna',
    petSpecies: 'canine',
    microchipIso: '981098109923841',
    ownerName: 'María Valentina Cordero',
    ownerIdDoc: '0103948572',
    vetName: 'Dr. Mateo Valdivieso Calle',
    vetSenescytLicense: '1024-2018-849201',
    clinicName: 'Clínica Veterinaria Tomebamba',
    issuedAt: '2026-10-20T14:00:00Z',
    expiresAt: '2026-11-20T23:59:59Z',
    medications: [
      {
        tradeName: 'Bálsamo Dérmico Plantar Reparador',
        genericName: 'Caléndula + Óxido de Zinc + Manteca de Karité',
        presentation: 'Pote ungüento de 60g',
        dosage: 'Capa fina sobre las 4 almohadillas plantares',
        frequency: 'Cada 8 horas con masaje suave',
        durationDays: 10,
        quantity: 1,
        requiresPharmacologicalControl: false
      },
      {
        tradeName: 'Pro-Flora Vientre Sano Probiótico',
        genericName: 'Enterococcus faecium microencapsulado',
        presentation: 'Caja con 15 sobres monodosis en polvo',
        dosage: '1 sobre mezclado con comida húmeda',
        frequency: 'Cada 24 horas',
        durationDays: 15,
        quantity: 1,
        requiresPharmacologicalControl: false
      }
    ],
    indications: 'Evitar paseos sobre pavimento o adoquín caliente durante el periodo de regeneración.',
    digitalSignature: {
      hash: 'sha256:3a02847291a83ba7c938d9284fa92019b88231c9e3b0c44298fc1c149afbf4c8',
      algorithm: 'RSA-PSS-SHA256 (SENESCYT Pkix Token)',
      timestamp: '2026-10-20T14:03:22Z',
      verified: true
    },
    status: 'Activa'
  },
  {
    id: 'rx-005',
    prescriptionCode: 'RX-2026-VET-1029',
    petName: 'Thor',
    petSpecies: 'canine',
    microchipIso: '981098107734199',
    ownerName: 'Dr. Fernando Dávila',
    ownerIdDoc: '0102938475',
    vetName: 'Dr. Fernando Arízaga',
    vetSenescytLicense: '1008-2015-384910',
    clinicName: 'Hospital Veterinario El Paraíso',
    issuedAt: '2026-09-01T10:00:00Z',
    expiresAt: '2026-10-01T23:59:59Z',
    medications: [
      {
        tradeName: 'Tramadol Clorhidrato Gotas 50mg/ml',
        genericName: 'Tramadol Clorhidrato Solución Oral',
        presentation: 'Frasco gotero de 20 ml',
        dosage: '2 mg/kg',
        frequency: 'Cada 8 horas por 3 días',
        durationDays: 3,
        quantity: 1,
        requiresPharmacologicalControl: true
      }
    ],
    indications: 'Medicamento sometido a fiscalización. Prescripción archivada y vencida.',
    digitalSignature: {
      hash: 'sha256:02847291a83ba7c938d9284fa92019b88231c93ae3b0c44298fc1c149afbf4c8',
      algorithm: 'RSA-PSS-SHA256 (SENESCYT Pkix Token)',
      timestamp: '2026-09-01T10:02:11Z',
      verified: true
    },
    status: 'Expirada'
  }
];

// ============================================================================
// 7. MERCHANT PORTAL: STORE ORDERS & PHARMACY VERIFICATION
// ============================================================================

export interface MerchantOrderItem {
  productId: string;
  title: string;
  quantity: number;
  unitPrice: number;
  requiresPrescription: boolean;
}

export interface MerchantOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  sector: string;
  city: 'Cuenca' | 'Quito' | 'Bogotá';
  orderDate: string;
  items: MerchantOrderItem[];
  subtotalUsd: number;
  deliveryFeeUsd: number;
  totalUsd: number;
  paymentMethod:
    | 'Payphone'
    | 'QR_Deuna_Sipy_Peigo'
    | 'Transferencia_Bancaria'
    | 'Efectivo_Contraentrega'
    | 'Deuna_P2P'
    | 'Tarjeta';
  paymentStatus: 'Aprobado' | 'En Verificación' | 'Pendiente';
  paymentReference?: string;
  requiresPrescriptionVerification: boolean;
  prescriptionCodeLinked?: string;
  prescriptionStatus?: 'Verificada y Aprobada' | 'Pendiente de Validación Farmacéutica' | 'No Requerida';
  deliveryStatus: 'Pendiente' | 'Validando Receta' | 'En Motorizado' | 'Entregado';
  motorcycleCourier?: {
    name: string;
    plate: string;
    phone: string;
    liveCoordinates?: {
      lat: number;
      lng: number;
    };
  };
}

export const INITIAL_MERCHANT_ORDERS: MerchantOrder[] = [
  {
    id: 'ord-001',
    orderNumber: 'ORD-2026-4412',
    customerName: 'Carlos E. Serrano',
    customerPhone: '+593 99 840 8369',
    deliveryAddress: 'Av. Ordóñez Lasso 5-42 y Jacarandá, Conjunto Bellavista',
    sector: 'Puertas del Sol',
    city: 'Cuenca',
    orderDate: '2026-10-20T10:15:00Z',
    items: [
      {
        productId: 'prd-02',
        title: 'Apoquel 5.4mg Anti-Pruriginoso (Caja x 20 tabs)',
        quantity: 1,
        unitPrice: 42.50,
        requiresPrescription: true
      },
      {
        productId: 'prd-03',
        title: 'NexGard Spectra Antiparasitario Integral 7.6-15 kg',
        quantity: 1,
        unitPrice: 22.00,
        requiresPrescription: false
      }
    ],
    subtotalUsd: 64.50,
    deliveryFeeUsd: 4.00,
    totalUsd: 68.50,
    paymentMethod: 'QR_Deuna_Sipy_Peigo',
    paymentStatus: 'Aprobado',
    paymentReference: 'QR-DEUNA-884920',
    requiresPrescriptionVerification: true,
    prescriptionCodeLinked: 'RX-2026-VET-7841',
    prescriptionStatus: 'Pendiente de Validación Farmacéutica',
    deliveryStatus: 'Validando Receta',
    motorcycleCourier: {
      name: 'Edison Guartambel',
      plate: 'IC-492K',
      phone: '+593 99 321 6549',
      liveCoordinates: { lat: -2.8988, lng: -79.0112 }
    }
  },
  {
    id: 'ord-002',
    orderNumber: 'ORD-2026-4413',
    customerName: 'Dr. Fernando Dávila',
    customerPhone: '+593 99 840 8369',
    deliveryAddress: 'Calle Larga 8-22 y Benigno Malo',
    sector: 'Centro Histórico',
    city: 'Cuenca',
    orderDate: '2026-10-20T11:00:00Z',
    items: [
      {
        productId: 'prd-06',
        title: 'Cama Ortopédica Memory Foam Viscoelástica Impermeable (Talla L/XL)',
        quantity: 1,
        unitPrice: 89.00,
        requiresPrescription: false
      },
      {
        productId: 'prd-01',
        title: 'Royal Canin Maxi Adult 15kg Nutrición Articular',
        quantity: 1,
        unitPrice: 85.00,
        requiresPrescription: false
      }
    ],
    subtotalUsd: 174.00,
    deliveryFeeUsd: 0.00, // Envío gratis superando $100
    totalUsd: 174.00,
    paymentMethod: 'Payphone',
    paymentStatus: 'Aprobado',
    paymentReference: 'PAYPHONE-TX-9938210',
    requiresPrescriptionVerification: false,
    prescriptionStatus: 'No Requerida',
    deliveryStatus: 'En Motorizado',
    motorcycleCourier: {
      name: 'Juan Carlos Guamán',
      plate: 'CUE-892A',
      phone: '+593 98 765 0912',
      liveCoordinates: { lat: -2.8995, lng: -79.0045 }
    }
  },
  {
    id: 'ord-003',
    orderNumber: 'ORD-2026-4414',
    customerName: 'Andrea Montesdeoca',
    customerPhone: '+593 98 765 4321',
    deliveryAddress: 'Urbanización El Ingenio Casa 14, Challuabamba',
    sector: 'Challuabamba',
    city: 'Cuenca',
    orderDate: '2026-10-18T17:00:00Z',
    items: [
      {
        productId: 'prd-05',
        title: 'Hills Prescription Diet c/d Multicare Feline 3kg',
        quantity: 1,
        unitPrice: 44.70,
        requiresPrescription: true
      },
      {
        productId: 'prd-04',
        title: 'Juguete KONG Dispensador Dental + Catnip Orgánico',
        quantity: 1,
        unitPrice: 3.50,
        requiresPrescription: false
      }
    ],
    subtotalUsd: 48.20,
    deliveryFeeUsd: 5.00,
    totalUsd: 53.20,
    paymentMethod: 'QR_Deuna_Sipy_Peigo',
    paymentStatus: 'Aprobado',
    paymentReference: 'QR-SIPY-773120',
    requiresPrescriptionVerification: true,
    prescriptionCodeLinked: 'RX-2026-VET-5104',
    prescriptionStatus: 'Verificada y Aprobada',
    deliveryStatus: 'Entregado'
  },
  {
    id: 'ord-004',
    orderNumber: 'ORD-2026-4415',
    customerName: 'María Valentina Cordero',
    customerPhone: '+593 98 411 2233',
    deliveryAddress: 'Calle de los Capulíes 3-18 y Guayas',
    sector: 'El Vergel',
    city: 'Cuenca',
    orderDate: '2026-10-20T14:10:00Z',
    items: [
      {
        productId: 'prd-08',
        title: 'Arnés de Alta Visibilidad Julius-K9 Reflectivo Talla M',
        quantity: 1,
        unitPrice: 36.00,
        requiresPrescription: false
      },
      {
        productId: 'prd-09',
        title: 'Snack Liofilizado de Salmón Patagónico Puro 100g',
        quantity: 2,
        unitPrice: 8.00,
        requiresPrescription: false
      }
    ],
    subtotalUsd: 52.00,
    deliveryFeeUsd: 3.50,
    totalUsd: 55.50,
    paymentMethod: 'Payphone',
    paymentStatus: 'Aprobado',
    paymentReference: 'PAYPHONE-TX-884920',
    requiresPrescriptionVerification: false,
    prescriptionStatus: 'No Requerida',
    deliveryStatus: 'Pendiente'
  }
];

// ============================================================================
// 8. SERVICE PROVIDER PORTAL: BOOKINGS (PET TAXI, HOTEL, GROOMING, ETOLOGÍA)
// ============================================================================

export interface ProviderBooking {
  id: string;
  bookingReference: string;
  serviceType: 'Pet Taxi' | 'Hotel Campestre' | 'Grooming Spa' | 'Etología';
  providerName: string;
  customerName: string;
  customerPhone: string;
  petName: string;
  petSpecies: 'canine' | 'feline';
  petBreed: string;
  microchipIso: string;
  sector: string;
  city: 'Cuenca' | 'Quito' | 'Bogotá';
  pickupAddress?: string;
  destinationAddress?: string;
  scheduledDate: string;
  scheduledTimeSlot: string;
  priceUsd: number;
  paymentStatus: 'Pagado' | 'Contra Entrega' | 'Pendiente';
  liveStatus: 'Solicitado' | 'Confirmado' | 'En Ruta / En Curso' | 'Finalizado';
  specialInstructions?: string;
  assignedStaff?: {
    name: string;
    role: string;
    contactPhone: string;
  };
  createdAt: string;
}

export const INITIAL_PROVIDER_BOOKINGS: ProviderBooking[] = [
  {
    id: 'bkg-001',
    bookingReference: 'BKG-2026-9021',
    serviceType: 'Pet Taxi',
    providerName: 'PAWLO Mobility Fleet Cuenca',
    customerName: 'Carlos E. Serrano',
    customerPhone: '+593 99 840 8369',
    petName: 'Bruno',
    petSpecies: 'canine',
    petBreed: 'Schnauzer Miniatura',
    microchipIso: '981098104592831',
    sector: 'Puertas del Sol a El Vergel',
    city: 'Cuenca',
    pickupAddress: 'Av. Ordóñez Lasso 5-42 (Edif. Bellavista)',
    destinationAddress: 'Clínica Veterinaria Tomebamba, Paseo 3 de Noviembre',
    scheduledDate: '2026-10-20',
    scheduledTimeSlot: '15:30 - 16:00',
    priceUsd: 8.50,
    paymentStatus: 'Pagado',
    liveStatus: 'En Ruta / En Curso',
    specialInstructions: 'El perrito viaja con arnés de sujeción ISOFIX. Muy tranquilo pero asustadizo con ruidos fuertes.',
    assignedStaff: {
      name: 'Marcelo Pesántez Ochoa',
      role: 'Conductor Certificado Pet Mobility',
      contactPhone: '+593 99 413 4520'
    },
    createdAt: '2026-10-20T10:00:00Z'
  },
  {
    id: 'bkg-002',
    bookingReference: 'BKG-2026-9022',
    serviceType: 'Grooming Spa',
    providerName: 'Tomebamba Pet Spa Studio Móvil',
    customerName: 'Andrea Montesdeoca',
    customerPhone: '+593 98 765 4321',
    petName: 'Mía',
    petSpecies: 'feline',
    petBreed: 'Siamés Mestizo',
    microchipIso: '981098108843120',
    sector: 'Challuabamba',
    city: 'Cuenca',
    pickupAddress: 'Urbanización El Ingenio Casa 14 (Atención en Van Móvil)',
    scheduledDate: '2026-10-21',
    scheduledTimeSlot: '10:00 - 11:30',
    priceUsd: 28.00,
    paymentStatus: 'Pagado',
    liveStatus: 'Confirmado',
    specialInstructions: 'Spa felino con ozonoterapia desestresante. Sin jaula ni secador ruidoso (usar toallas térmicas).',
    assignedStaff: {
      name: 'Andrea Vivar',
      role: 'Groomer Especialista Felina Cat-Friendly',
      contactPhone: '+593 98 765 4321'
    },
    createdAt: '2026-10-19T14:20:00Z'
  },
  {
    id: 'bkg-003',
    bookingReference: 'BKG-2026-9023',
    serviceType: 'Hotel Campestre',
    providerName: 'Valle Verde Pet Resort & Suites',
    customerName: 'Dr. Fernando Dávila',
    customerPhone: '+593 99 840 8369',
    petName: 'Thor',
    petSpecies: 'canine',
    petBreed: 'Golden Retriever',
    microchipIso: '981098107734199',
    sector: 'Yunguilla / Valle Verde',
    city: 'Cuenca',
    pickupAddress: 'Traslado coordinado con Pet Taxi desde Centro Histórico',
    destinationAddress: 'Valle Verde Resort Km 47 Vía Girón-Pasaje',
    scheduledDate: '2026-10-24 a 2026-10-27',
    scheduledTimeSlot: 'Check-in: 09:00 | Check-out: 18:00',
    priceUsd: 66.00,
    paymentStatus: 'Pagado',
    liveStatus: 'Confirmado',
    specialInstructions: 'Suite con cámara HD activa. Administrar Meloxicam y condroprotectores según receta RX-2026-VET-6920.',
    assignedStaff: {
      name: 'Esteban Cárdenas',
      role: 'Jefe de Bienestar y Cuidadores de Campo',
      contactPhone: '+593 99 555 4321'
    },
    createdAt: '2026-10-20T12:00:00Z'
  },
  {
    id: 'bkg-004',
    bookingReference: 'BKG-2026-9024',
    serviceType: 'Etología',
    providerName: 'K9 Behavior & Mind Lab',
    customerName: 'María Valentina Cordero',
    customerPhone: '+593 98 411 2233',
    petName: 'Luna',
    petSpecies: 'canine',
    petBreed: 'Siberian Husky',
    microchipIso: '981098109923841',
    sector: 'Parque de la Madre / El Vergel',
    city: 'Cuenca',
    pickupAddress: 'Punto de Encuentro: Parque de la Madre (Frente al Planetario), Cuenca',
    scheduledDate: '2026-10-25',
    scheduledTimeSlot: '09:00 - 10:15',
    priceUsd: 35.00,
    paymentStatus: 'Pendiente',
    liveStatus: 'Solicitado',
    specialInstructions: 'Desensibilización sonora contra pirotecnia y manejo de fobia acústica tras escape reciente.',
    assignedStaff: {
      name: 'Lic. Mateo Ochoa',
      role: 'Etólogo Clínico Canino Certificado',
      contactPhone: '+593 99 888 1234'
    },
    createdAt: '2026-10-20T14:15:00Z'
  },
  {
    id: 'bkg-005',
    bookingReference: 'BKG-2026-9025',
    serviceType: 'Pet Taxi',
    providerName: 'PAWLO Mobility Fleet Cuenca',
    customerName: 'Dr. Fernando Dávila',
    customerPhone: '+593 99 840 8369',
    petName: 'Thor',
    petSpecies: 'canine',
    petBreed: 'Golden Retriever',
    microchipIso: '981098107734199',
    sector: 'El Paraíso a Misicata',
    city: 'Cuenca',
    pickupAddress: 'Hospital Veterinario El Paraíso',
    destinationAddress: 'Residencia Particular, Misicata',
    scheduledDate: '2026-10-20',
    scheduledTimeSlot: '14:30 - 15:00',
    priceUsd: 8.50,
    paymentStatus: 'Pagado',
    liveStatus: 'Finalizado',
    specialInstructions: 'Retorno seguro tras control de RX pélvica.',
    assignedStaff: {
      name: 'Marcelo Pesántez Ochoa',
      role: 'Conductor Móvil 02',
      contactPhone: '+593 99 413 4520'
    },
    createdAt: '2026-10-20T13:45:00Z'
  }
];
