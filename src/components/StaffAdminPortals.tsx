import React, { useState, useEffect } from 'react';
import {
  Globe, Building2, ShieldCheck, HeartPulse, ShieldAlert,
  Server, Cpu, Database, DollarSign, Percent, AlertTriangle,
  CheckCircle2, XCircle, Clock, MapPin, Activity, Flame,
  Phone, Send, Search, Filter, RefreshCw, Plus, Trash2,
  Check, X, ChevronRight, ChevronDown, Store, Stethoscope,
  Truck, Radio, Bell, Users, UserCheck, UserX, FileText,
  Lock, ArrowUpRight, ArrowDownRight, Eye, ExternalLink,
  Sparkles, Copy, Share2
} from 'lucide-react';

// ============================================================================
// Tipos y Modelos de Datos para Portales Staff & Admin PAWLO™
// ============================================================================

export type StaffRole = 'super_admin' | 'admin' | 'supervisor' | 'operator';

export interface StaffAdminPortalsProps {
  activeRole: StaffRole;
  onSelectRole: (role: StaffRole) => void;
  cityName: string;
  cityCode: string;
  currency: string;
  theme: 'dark' | 'light';
}

export interface CityNode {
  id: string;
  name: string;
  code: string;
  country: string;
  currency: string;
  primaryGateway: string;
  gatewayCommissionRate: number; // Porcentaje ej. 1.5%
  status: 'active' | 'paused' | 'maintenance';
  activePartnersCount: number;
  monthlyGmvUsd: number;
  latencyMs: number;
  lastSync: string;
}

export interface BlockedDrug {
  id: string;
  commercialName: string;
  genericName: string;
  riskLevel: 'critical_fatal' | 'high_risk' | 'controlled_special' | 'genetic_alert';
  affectedSpecies: 'felines' | 'canines' | 'all';
  clinicalReason: string;
  blockedAt: string;
  blockedBy: string;
  status: 'active_block' | 'under_review';
}

export interface ForensicAuditLog {
  id: string;
  timestamp: string;
  hashSha256: string;
  operatorRole: string;
  operatorId: string;
  cityNode: string;
  actionType: string;
  payloadSummary: string;
  ipAddress: string;
  integrityVerified: boolean;
}

export interface PartnerApplication {
  id: string;
  legalName: string;
  contactPerson: string;
  category: 'veterinarian' | 'pharmacy_store' | 'transport_pettaxi' | 'grooming_services';
  taxIdRuc: string;
  professionalLicenseSenescyt?: string;
  agrocalidadLicense?: string;
  phone: string;
  email: string;
  address: string;
  submissionDate: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  ratingScore?: number;
  documents: {
    senescytPdf?: boolean;
    rucSriPdf?: boolean;
    agrocalidadPdf?: boolean;
    sanitaryPermitPdf?: boolean;
  };
}

export interface ShelterPartnership {
  id: string;
  shelterName: string;
  agreementCode: string;
  receptionCapacity: number;
  currentAnimalsCount: number;
  solidarityDonationPercent: number; // ej: 2.5%
  accumulatedMonthUsd: number;
  adoptionsCompleted: number;
  contactPhone: string;
  location: string;
  verifiedOfficial: boolean;
}

export interface CommercialDispute {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  providerName: string;
  disputeType: 'delayed_delivery' | 'wrong_item' | 'service_no_show' | 'dosage_query';
  amountDisputed: number;
  status: 'open' | 'refunded' | 'dismissed' | 'under_investigation';
  createdAt: string;
  description: string;
}

export interface PrescriptionAuditEntry {
  id: string;
  rxNumber: string;
  petName: string;
  species: 'canine' | 'feline';
  vetName: string;
  senescytLicense: string;
  prescribedDrugs: string[];
  firewallStatus: 'passed_safe' | 'flagged_blocked' | 'requires_controlled_validation';
  issuedAt: string;
  signatureVerified: boolean;
}

export interface CommunityGeoAlert {
  id: string;
  type: 'lost_pet' | 'injured_animal' | 'cruelty_report' | 'sighting';
  title: string;
  petName?: string;
  species: 'canine' | 'feline' | 'other';
  description: string;
  locationName: string;
  coordinates: [number, number];
  reportedBy: string;
  reporterPhone: string;
  reportedAtMinutesAgo: number;
  radiusKm: number;
  status: 'pending_moderation' | 'broadcasting_5km' | 'resolved' | 'dismissed_fake';
  notifiedTutorsCount: number;
  imageUrl?: string;
}

export interface BiometricIsoAnomaly {
  id: string;
  chipNumberIso: string;
  standard: 'ISO 11784/11785 FDX-B' | 'Non-Standard 134.2kHz' | 'Invalid Length';
  countryCode: string; // 218 Ecuador, 170 Colombia, etc.
  anomalyType: 'reported_stolen_elsewhere' | 'duplicate_in_multiple_cities' | 'checksum_invalid' | 'unregistered_origin';
  flaggedAt: string;
  currentOwnerAttempt: string;
  previousRegisteredOwner?: string;
  status: 'investigating' | 'frozen_locked' | 'resolved_authorized';
  riskScore: 'CRITICAL' | 'HIGH' | 'MEDIUM';
}

export interface VitalEmergencySOS {
  id: string;
  emergencyCode: string; // EMG-911-01
  severity: 'code_red_vital' | 'code_yellow_urgent' | 'code_green_transfer';
  patientName: string;
  species: 'canine' | 'feline';
  weightKg: number;
  tutorName: string;
  tutorPhoneE164: string; // +593998408369
  locationAddress: string;
  clinicalNotes: string;
  elapsedSeconds: number;
  assignedUnit?: string;
  assignedClinic?: string;
  status: 'queued' | 'dispatched_en_route' | 'on_site' | 'arrived_hospital' | 'resolved';
}

// ============================================================================
// Datos Iniciales Resilientes (Fallback Autónomo Multi-Nodo)
// ============================================================================

const INITIAL_NODES: CityNode[] = [
  {
    id: 'node-cue',
    name: 'Cuenca',
    code: 'CUE',
    country: 'Ecuador',
    currency: 'USD',
    primaryGateway: 'Deuna P2P / Banco del Austro',
    gatewayCommissionRate: 1.5,
    status: 'active',
    activePartnersCount: 42,
    monthlyGmvUsd: 48920,
    latencyMs: 18,
    lastSync: 'Hace 1 min'
  },
  {
    id: 'node-uio',
    name: 'Quito',
    code: 'UIO',
    country: 'Ecuador',
    currency: 'USD',
    primaryGateway: 'Deuna / Payphone Red',
    gatewayCommissionRate: 1.8,
    status: 'active',
    activePartnersCount: 88,
    monthlyGmvUsd: 94100,
    latencyMs: 24,
    lastSync: 'Hace 2 min'
  },
  {
    id: 'node-bog',
    name: 'Bogotá',
    code: 'BOG',
    country: 'Colombia',
    currency: 'COP',
    primaryGateway: 'Nequi / Daviplata',
    gatewayCommissionRate: 1.6,
    status: 'active',
    activePartnersCount: 115,
    monthlyGmvUsd: 132400,
    latencyMs: 36,
    lastSync: 'Hace 4 min'
  },
  {
    id: 'node-lim',
    name: 'Lima',
    code: 'LIM',
    country: 'Perú',
    currency: 'PEN',
    primaryGateway: 'Yape / Plin Interbancario',
    gatewayCommissionRate: 1.5,
    status: 'active',
    activePartnersCount: 76,
    monthlyGmvUsd: 78300,
    latencyMs: 42,
    lastSync: 'Hace 3 min'
  }
];

const INITIAL_BLOCKED_DRUGS: BlockedDrug[] = [
  {
    id: 'drg-001',
    commercialName: 'Paracetamol / Tempra / Panadol Humano',
    genericName: 'Acetaminofén (Paracetamol)',
    riskLevel: 'critical_fatal',
    affectedSpecies: 'felines',
    clinicalReason: 'Toxicidad letal en felinos por déficit de glucuroniltransferasa. Provoca metahemoglobinemia fulminante, cianosis, edema facial y necrosis hepática.',
    blockedAt: '2026-01-15 09:00:00',
    blockedBy: 'Comité Toxicológico PAWLO',
    status: 'active_block'
  },
  {
    id: 'drg-002',
    commercialName: 'Ibuprofeno / Advil / Motrin',
    genericName: 'Ibuprofeno humano',
    riskLevel: 'critical_fatal',
    affectedSpecies: 'all',
    clinicalReason: 'Índice terapéutico extremadamente estrecho en caninos y felinos. Ocasiona ulceración gastroduodenal perforante y fracaso renal agudo oligoanúrico.',
    blockedAt: '2026-01-15 09:12:00',
    blockedBy: 'Comité Toxicológico PAWLO',
    status: 'active_block'
  },
  {
    id: 'drg-003',
    commercialName: 'Tramadol Gotas / Tramal',
    genericName: 'Clorhidrato de Tramadol',
    riskLevel: 'controlled_special',
    affectedSpecies: 'all',
    clinicalReason: 'Opioide de acción central sujeto a fiscalización. Venta online bloqueada salvo receta digital certificada con firma SENESCYT y registro de psicotrópicos.',
    blockedAt: '2026-01-20 11:30:00',
    blockedBy: 'Gobernanza Farmacológica',
    status: 'active_block'
  },
  {
    id: 'drg-004',
    commercialName: 'Ivermectina Oral Concentrada',
    genericName: 'Ivermectina Antiparasitaria',
    riskLevel: 'genetic_alert',
    affectedSpecies: 'canines',
    clinicalReason: 'Neurotoxicidad severa con ataxia, ceguera y paro respiratorio en caninos con mutación génica MDR1 (ABCB1) como Collies, Pastores Australianos y cruces.',
    blockedAt: '2026-02-01 14:22:00',
    blockedBy: 'Auditoría Clínica Genética',
    status: 'active_block'
  },
  {
    id: 'drg-005',
    commercialName: 'Diclofenaco Sódico / Voltaren',
    genericName: 'Diclofenaco',
    riskLevel: 'critical_fatal',
    affectedSpecies: 'all',
    clinicalReason: 'Toxicidad gastroentérica y nefrotoxicidad extrema en mamíferos de compañía, además de letalidad comprobada por colapso renal.',
    blockedAt: '2026-02-10 16:40:00',
    blockedBy: 'Comité Toxicológico PAWLO',
    status: 'active_block'
  }
];

const INITIAL_AUDIT_LOGS: ForensicAuditLog[] = [
  {
    id: 'aud-001',
    timestamp: '2026-10-20 18:24:12 UTC',
    hashSha256: '9f83b2a1c0d4e5f67890abcdef1234567890abcdef1234567890abcdef123456',
    operatorRole: 'Super Admin',
    operatorId: 'sys-root-01',
    cityNode: 'GLOBAL',
    actionType: 'FIREWALL_RULE_ENFORCED',
    payloadSummary: 'Actualización regla toxicológica: Acetaminofén bloqueado al 100% en pasarela de venta',
    ipAddress: '190.152.14.88 (Cuenca, EC)',
    integrityVerified: true
  },
  {
    id: 'aud-002',
    timestamp: '2026-10-20 18:10:04 UTC',
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    operatorRole: 'Admin de Ciudad',
    operatorId: 'admin-cue-04',
    cityNode: 'CUE',
    actionType: 'PARTNER_VERIFIED',
    payloadSummary: 'Aprobación de credenciales SENESCYT 1005-2018-849201 para Clínica Veterinaria Sur',
    ipAddress: '186.42.190.12 (Cuenca, EC)',
    integrityVerified: true
  },
  {
    id: 'aud-003',
    timestamp: '2026-10-20 17:45:33 UTC',
    hashSha256: 'ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb',
    operatorRole: 'Supervisor Calidad',
    operatorId: 'sup-geo-02',
    cityNode: 'CUE',
    actionType: 'GEO_PUSH_BROADCAST_5KM',
    payloadSummary: 'Emisión de alerta push comunitaria por perro herido en Av. de las Américas (3,120 tutores)',
    ipAddress: '190.152.18.204 (Cuenca, EC)',
    integrityVerified: true
  },
  {
    id: 'aud-004',
    timestamp: '2026-10-20 17:15:19 UTC',
    hashSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    operatorRole: 'Operador SOS',
    operatorId: 'op-sos-09',
    cityNode: 'CUE',
    actionType: 'DISPATCH_EMERGENCY_AMBULANCE',
    payloadSummary: 'Despacho unidad Alfa-1 a Solano y Doce de Abril. Hospital UCuenca notificado',
    ipAddress: '186.42.192.5 (Cuenca, EC)',
    integrityVerified: true
  }
];

const INITIAL_PARTNERS: PartnerApplication[] = [
  {
    id: 'app-01',
    legalName: 'Dr. Santiago Morales Cobos (MVZ)',
    contactPerson: 'Dr. Santiago Morales',
    category: 'veterinarian',
    taxIdRuc: '0104829103001',
    professionalLicenseSenescyt: '1005-2018-849201',
    agrocalidadLicense: 'AGRO-CUE-2024-VET-042',
    phone: '+593 99 840 8369',
    email: 'smorales.vet@cuencapets.ec',
    address: 'Av. Remigio Crespo y Agustín Cueva, Cuenca',
    submissionDate: '2026-10-19 14:30',
    status: 'pending',
    documents: {
      senescytPdf: true,
      rucSriPdf: true,
      agrocalidadPdf: true,
      sanitaryPermitPdf: true
    }
  },
  {
    id: 'app-02',
    legalName: 'Farmacia Veterinaria El Galgo Austral Cía. Ltda.',
    contactPerson: 'Bioq. Sandra Vintimilla',
    category: 'pharmacy_store',
    taxIdRuc: '0190348291001',
    agrocalidadLicense: 'AGRO-CUE-2025-FARM-118',
    phone: '+593 98 123 4567',
    email: 'farmacia@elgalgo.ec',
    address: 'Calle Larga y Mariano Cueva 5-21, Centro Histórico',
    submissionDate: '2026-10-18 10:15',
    status: 'pending',
    documents: {
      senescytPdf: false,
      rucSriPdf: true,
      agrocalidadPdf: true,
      sanitaryPermitPdf: true
    }
  },
  {
    id: 'app-03',
    legalName: 'Pet Taxi Express Yanuncay Móvil',
    contactPerson: 'Sr. Jorge Pesántez',
    category: 'transport_pettaxi',
    taxIdRuc: '0102938471001',
    phone: '+593 99 333 4455',
    email: 'contacto@pettaxiyanuncay.com',
    address: 'Sector Yanuncay, Calle Isabel La Católica',
    submissionDate: '2026-10-20 08:00',
    status: 'pending',
    documents: {
      senescytPdf: false,
      rucSriPdf: true,
      agrocalidadPdf: false,
      sanitaryPermitPdf: true
    }
  },
  {
    id: 'app-04',
    legalName: 'Dra. Valeria Cárdenas (Hospital UCuenca)',
    contactPerson: 'Dra. Valeria Cárdenas',
    category: 'veterinarian',
    taxIdRuc: '0105849102001',
    professionalLicenseSenescyt: '1008-2021-394812',
    agrocalidadLicense: 'AGRO-CUE-2023-VET-009',
    phone: '+593 99 777 8899',
    email: 'valeria.cardenas@ucuenca.edu.ec',
    address: 'Campus Quinta Balzay, Hospital Docente',
    submissionDate: '2026-10-12 11:00',
    status: 'approved',
    ratingScore: 4.95,
    documents: {
      senescytPdf: true,
      rucSriPdf: true,
      agrocalidadPdf: true,
      sanitaryPermitPdf: true
    }
  },
  {
    id: 'app-05',
    legalName: 'Distribuciones Zoosanitarias Cuenca',
    contactPerson: 'Ing. Carlos Cordero',
    category: 'pharmacy_store',
    taxIdRuc: '0199283746001',
    phone: '+593 98 444 1122',
    email: 'ventas@zoocuenca.ec',
    address: 'Parque Industrial de Cuenca',
    submissionDate: '2026-10-14 09:20',
    status: 'rejected',
    rejectionReason: 'RUC suspendido en el portal del SRI y falta regente veterinario con registro SENESCYT.',
    documents: {
      senescytPdf: false,
      rucSriPdf: true,
      agrocalidadPdf: false,
      sanitaryPermitPdf: false
    }
  }
];

const INITIAL_SHELTERS: ShelterPartnership[] = [
  {
    id: 'shl-01',
    shelterName: 'Fundación Patitas Azuayas (Red de Rescate Independiente PAWLO)',
    agreementCode: 'CONV-PAWLO-AZU-2024-08',
    receptionCapacity: 75,
    currentAnimalsCount: 68,
    solidarityDonationPercent: 2.5,
    accumulatedMonthUsd: 845.20,
    adoptionsCompleted: 19,
    contactPhone: '+593 99 840 8369',
    location: 'Sector Challuabamba, Vía a Gualaceo',
    verifiedOfficial: true
  },
  {
    id: 'shl-02',
    shelterName: 'Peluditos Cuenca Rescate Animal',
    agreementCode: 'CONV-IND-2025-14',
    receptionCapacity: 40,
    currentAnimalsCount: 36,
    solidarityDonationPercent: 1.5,
    accumulatedMonthUsd: 412.50,
    adoptionsCompleted: 11,
    contactPhone: '+593 98 123 4567',
    location: 'Sector Ricaurte, Calle Los Pinos',
    verifiedOfficial: true
  },
  {
    id: 'shl-03',
    shelterName: 'Refugio San Jerónimo de Baños',
    agreementCode: 'CONV-PARR-2025-02',
    receptionCapacity: 25,
    currentAnimalsCount: 22,
    solidarityDonationPercent: 1.0,
    accumulatedMonthUsd: 280.00,
    adoptionsCompleted: 6,
    contactPhone: '+593 99 222 3344',
    location: 'Parroquia Baños, Camino a Hostería Durán',
    verifiedOfficial: true
  }
];

const INITIAL_DISPUTES: CommercialDispute[] = [
  {
    id: 'dsp-01',
    orderNumber: 'PWL-ORD-8921',
    customerName: 'María José Carrión',
    customerPhone: '+593 99 111 2233',
    providerName: 'Farmacia El Galgo Austral',
    disputeType: 'wrong_item',
    amountDisputed: 24.50,
    status: 'open',
    createdAt: '2026-10-20 11:20',
    description: 'Compró Bravecto para perro 20-40kg y el paquete entregado fue para 10-20kg.'
  },
  {
    id: 'dsp-02',
    orderNumber: 'PWL-SRV-4102',
    customerName: 'Juan Pablo Torres',
    customerPhone: '+593 98 444 5566',
    providerName: 'Pet Taxi Express Yanuncay',
    disputeType: 'service_no_show',
    amountDisputed: 12.00,
    status: 'open',
    createdAt: '2026-10-20 13:45',
    description: 'Reserva de traslado veterinario programada a las 14:00 tuvo 35 minutos de retraso no notificado.'
  }
];

const INITIAL_RX_AUDIT: PrescriptionAuditEntry[] = [
  {
    id: 'rx-01',
    rxNumber: 'RX-CUE-2026-0089',
    petName: 'Rocky (Canino, 18kg)',
    species: 'canine',
    vetName: 'Dr. Santiago Morales Cobos',
    senescytLicense: '1005-2018-849201',
    prescribedDrugs: ['Amoxicilina + Ác. Clavulánico 250mg', 'Meloxicam 0.1mg/kg'],
    firewallStatus: 'passed_safe',
    issuedAt: '2026-10-20 15:10',
    signatureVerified: true
  },
  {
    id: 'rx-02',
    rxNumber: 'RX-CUE-2026-0090',
    petName: 'Mía (Felino, 3.5kg)',
    species: 'feline',
    vetName: 'Dra. Valeria Cárdenas',
    senescytLicense: '1008-2021-394812',
    prescribedDrugs: ['Tramadol Gotas 50mg/ml - Dosis Controlada 1mg/kg'],
    firewallStatus: 'requires_controlled_validation',
    issuedAt: '2026-10-20 16:30',
    signatureVerified: true
  },
  {
    id: 'rx-03',
    rxNumber: 'RX-CUE-2026-0091',
    petName: 'Luna (Felino, 4kg)',
    species: 'feline',
    vetName: 'Intento de prescripción externa no colegiada',
    senescytLicense: 'INV-000-00000',
    prescribedDrugs: ['Paracetamol Jarabe Infantil 120mg'],
    firewallStatus: 'flagged_blocked',
    issuedAt: '2026-10-20 17:05',
    signatureVerified: false
  }
];

const INITIAL_GEO_ALERTS: CommunityGeoAlert[] = [
  {
    id: 'alr-01',
    type: 'lost_pet',
    title: 'Golden Retriever macho con collar rojo visto desorientado',
    petName: 'Simba',
    species: 'canine',
    description: 'Visto cruzando la ciclovía cerca del Puente de la Escalinata hacia Parque El Paraíso. No es agresivo, responde por Simba.',
    locationName: 'Parque El Paraíso / Río Yanuncay, Cuenca',
    coordinates: [-2.9092, -78.9912],
    reportedBy: 'Carlos Méndez (Tutor Verificado)',
    reporterPhone: '+593 99 840 8369',
    reportedAtMinutesAgo: 14,
    radiusKm: 5,
    status: 'pending_moderation',
    notifiedTutorsCount: 0,
    imageUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80'
  },
  {
    id: 'alr-02',
    type: 'injured_animal',
    title: 'Perro atropellado con hemorragia en pata trasera derecha',
    petName: 'Sin collar identificado',
    species: 'canine',
    description: 'Animal en berma de la avenida con dolor evidente tras ser golpeado por automóvil. Requiere ambulancia o traslado de urgencia a clínica.',
    locationName: 'Av. de las Américas y Miraflores, frente a Coral',
    coordinates: [-2.8834, -79.0145],
    reportedBy: 'Lucía Barzallo (Vecina Comunitaria)',
    reporterPhone: '+593 98 123 4567',
    reportedAtMinutesAgo: 6,
    radiusKm: 5,
    status: 'pending_moderation',
    notifiedTutorsCount: 0
  },
  {
    id: 'alr-03',
    type: 'sighting',
    title: 'Gato siamés con cascabel azul en tejado de Bellavista',
    petName: 'Desconocido',
    species: 'feline',
    description: 'Lleva maullando varias horas en cornisa. Muy asustado.',
    locationName: 'Sector Bellavista / Totoracocha, Cuenca',
    coordinates: [-2.8945, -78.9830],
    reportedBy: 'David Cordero',
    reporterPhone: '+593 99 555 4321',
    reportedAtMinutesAgo: 38,
    radiusKm: 5,
    status: 'broadcasting_5km',
    notifiedTutorsCount: 2450
  }
];

const INITIAL_BIOMETRIC_ANOMALIES: BiometricIsoAnomaly[] = [
  {
    id: 'bio-01',
    chipNumberIso: '981098102384712',
    standard: 'ISO 11784/11785 FDX-B',
    countryCode: '981 (Fabricante Certificado)',
    anomalyType: 'reported_stolen_elsewhere',
    flaggedAt: '2026-10-20 17:50',
    currentOwnerAttempt: 'Usuario anónimo en Cuenca (Registro web con foto de Husky)',
    previousRegisteredOwner: 'Familia Maldonado (Guayaquil, reportado extraviado/robado en 2025)',
    status: 'investigating',
    riskScore: 'CRITICAL'
  },
  {
    id: 'bio-02',
    chipNumberIso: '218001928471928',
    standard: 'ISO 11784/11785 FDX-B',
    countryCode: '218 (Ecuador)',
    anomalyType: 'duplicate_in_multiple_cities',
    flaggedAt: '2026-10-20 16:15',
    currentOwnerAttempt: 'Clínica Veterinaria Norte (Quito)',
    previousRegisteredOwner: 'Veterinaria El Batán (Cuenca)',
    status: 'investigating',
    riskScore: 'HIGH'
  },
  {
    id: 'bio-03',
    chipNumberIso: '90012345678901',
    standard: 'Invalid Length',
    countryCode: 'Desconocido',
    anomalyType: 'checksum_invalid',
    flaggedAt: '2026-10-20 14:02',
    currentOwnerAttempt: 'Intento de registro con 14 dígitos (Falta dígito de paridad)',
    status: 'frozen_locked',
    riskScore: 'MEDIUM'
  }
];

const INITIAL_EMERGENCIES: VitalEmergencySOS[] = [
  {
    id: 'emg-01',
    emergencyCode: 'EMG-911-01',
    severity: 'code_red_vital',
    patientName: 'Toby',
    species: 'canine',
    weightKg: 14.5,
    tutorName: 'David Serrano',
    tutorPhoneE164: '+593998408369',
    locationAddress: 'Av. Solano y Doce de Abril (Cerca del Colegio Benigno Malo), Cuenca',
    clinicalNotes: 'Atropellamiento reciente. Mucosas pálidas, taquipnea severa, posible fractura pélvica abierta. Requiere oxigenoterapia y estabilización inmediata.',
    elapsedSeconds: 165,
    status: 'queued'
  },
  {
    id: 'emg-02',
    emergencyCode: 'EMG-911-02',
    severity: 'code_yellow_urgent',
    patientName: 'Mía',
    species: 'feline',
    weightKg: 3.4,
    tutorName: 'Elena Vintimilla',
    tutorPhoneE164: '+593981234567',
    locationAddress: 'Sector Puertas del Sol, Edificio Los Robles Depto 3B, Cuenca',
    clinicalNotes: 'Ingestión accidental de hojas de lirio (Lilium). Presenta ptialismo abundante y emesis. Riesgo inminente de fallo renal agudo en <12h.',
    elapsedSeconds: 430,
    assignedUnit: 'Ambulancia Alfa-2 (Soporte Básico)',
    assignedClinic: 'Hospital Veterinario UCuenca 24/7',
    status: 'dispatched_en_route'
  },
  {
    id: 'emg-03',
    emergencyCode: 'EMG-911-03',
    severity: 'code_red_vital',
    patientName: 'Bruno',
    species: 'canine',
    weightKg: 11.2,
    tutorName: 'Carlos Cordero',
    tutorPhoneE164: '+593995554321',
    locationAddress: 'Av. Pumapungo y Paseo Tres de Noviembre, Cuenca',
    clinicalNotes: 'Shock anafiláctico por picaduras masivas de avispas. Edema facial angioneurótico severo, disnea laríngea.',
    elapsedSeconds: 78,
    status: 'queued'
  }
];

// ============================================================================
// Componente Principal StaffAdminPortals
// ============================================================================

export const StaffAdminPortals: React.FC<StaffAdminPortalsProps> = ({
  activeRole = 'super_admin',
  onSelectRole,
  cityName = 'Cuenca',
  cityCode = 'CUE',
  currency = 'USD',
  theme = 'dark'
}) => {
  // Estado Global Multi-Nodo y Portales
  const [nodes, setNodes] = useState<CityNode[]>(INITIAL_NODES);
  const [blockedDrugs, setBlockedDrugs] = useState<BlockedDrug[]>(INITIAL_BLOCKED_DRUGS);
  const [auditLogs, setAuditLogs] = useState<ForensicAuditLog[]>(INITIAL_AUDIT_LOGS);
  const [partners, setPartners] = useState<PartnerApplication[]>(INITIAL_PARTNERS);
  const [shelters, setShelters] = useState<ShelterPartnership[]>(INITIAL_SHELTERS);
  const [disputes, setDisputes] = useState<CommercialDispute[]>(INITIAL_DISPUTES);
  const [rxAudits, setRxAudits] = useState<PrescriptionAuditEntry[]>(INITIAL_RX_AUDIT);
  const [geoAlerts, setGeoAlerts] = useState<CommunityGeoAlert[]>(INITIAL_GEO_ALERTS);
  const [biometricAnomalies, setBiometricAnomalies] = useState<BiometricIsoAnomaly[]>(INITIAL_BIOMETRIC_ANOMALIES);
  const [emergencies, setEmergencies] = useState<VitalEmergencySOS[]>(INITIAL_EMERGENCIES);

  // Estados de retroalimentación en pantalla (Toasts & Modales)
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'warning' | 'error' } | null>(null);
  const [selectedPartnerForModal, setSelectedPartnerForModal] = useState<PartnerApplication | null>(null);
  const [newDrugModalOpen, setNewDrugModalOpen] = useState(false);
  const [newDrugForm, setNewDrugForm] = useState({
    commercialName: '',
    genericName: '',
    riskLevel: 'critical_fatal' as BlockedDrug['riskLevel'],
    affectedSpecies: 'all' as BlockedDrug['affectedSpecies'],
    clinicalReason: ''
  });

  // Filtros interactivos
  const [partnerFilter, setPartnerFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [biometricSearchQuery, setBiometricSearchQuery] = useState('');

  // Contador de tiempo en vivo para emergencias (SLA en segundos)
  useEffect(() => {
    const timer = setInterval(() => {
      setEmergencies(prev =>
        prev.map(emg => ({
          ...emg,
          elapsedSeconds: emg.status === 'resolved' ? emg.elapsedSeconds : emg.elapsedSeconds + 1
        }))
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Función auxiliar para emitir Toasts interactivos
  const triggerToast = (text: string, type: 'success' | 'warning' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Función de registro criptográfico en el Log Forense Inmutable
  const appendAuditLog = (actionType: string, summary: string, targetNode = cityCode) => {
    const newLog: ForensicAuditLog = {
      id: `aud-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC',
      hashSha256: Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
      operatorRole: activeRole.toUpperCase(),
      operatorId: `op-${activeRole}-${Date.now().toString().slice(-4)}`,
      cityNode: targetNode,
      actionType,
      payloadSummary: summary,
      ipAddress: '190.152.14.88 (Verified SSL Session)',
      integrityVerified: true
    };
    setAuditLogs(prev => [newLog, ...prev]);
  };

  // Helper para formato de tiempo
  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')} min`;
  };

  // Helpers de Estilo Temático
  const isDark = theme === 'dark';
  const panelBg = isDark ? 'bg-[#080E1C]/85 border-white/10 text-slate-100' : 'bg-white border-slate-200 text-slate-900 shadow-sm';
  const subtleCardBg = isDark ? 'bg-slate-900/60 border-white/5' : 'bg-slate-50 border-slate-200/80';
  const textMuted = isDark ? 'text-slate-400' : 'text-slate-600';
  const inputBg = isDark ? 'bg-slate-950/80 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900';

  // ============================================================================
  // Acciones Super Admin (Gobernanza Global & Multi-Nodo)
  // ============================================================================

  const handleToggleNodeStatus = (nodeId: string) => {
    setNodes(prev =>
      prev.map(node => {
        if (node.id === nodeId) {
          const nextStatus = node.status === 'active' ? 'paused' : node.status === 'paused' ? 'maintenance' : 'active';
          appendAuditLog('NODE_STATUS_CHANGE', `Nodo ${node.name} [${node.code}] cambió a estado ${nextStatus.toUpperCase()}`, node.code);
          triggerToast(`Estado del nodo ${node.name} actualizado a "${nextStatus.toUpperCase()}"`, 'warning');
          return { ...node, status: nextStatus };
        }
        return node;
      })
    );
  };

  const handleUpdateCommissionRate = (nodeId: string, delta: number) => {
    setNodes(prev =>
      prev.map(node => {
        if (node.id === nodeId) {
          const newRate = Math.max(0.5, Math.min(5.0, Number((node.gatewayCommissionRate + delta).toFixed(1))));
          appendAuditLog('GATEWAY_COMMISSION_UPDATE', `Comisión pasarela ${node.primaryGateway} ajustada a ${newRate}% en nodo ${node.name}`, node.code);
          triggerToast(`Comisión de pasarela para ${node.name} ajustada al ${newRate}%`, 'success');
          return { ...node, gatewayCommissionRate: newRate };
        }
        return node;
      })
    );
  };

  const handleAddBlockedDrug = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDrugForm.commercialName || !newDrugForm.genericName) return;

    const newDrug: BlockedDrug = {
      id: `drg-${Date.now().toString(36)}`,
      commercialName: newDrugForm.commercialName,
      genericName: newDrugForm.genericName,
      riskLevel: newDrugForm.riskLevel,
      affectedSpecies: newDrugForm.affectedSpecies,
      clinicalReason: newDrugForm.clinicalReason || 'Toxicidad confirmada en guías clínicas veterinarias.',
      blockedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
      blockedBy: `Gobernanza Super Admin (${activeRole})`,
      status: 'active_block'
    };

    setBlockedDrugs(prev => [newDrug, ...prev]);
    appendAuditLog('PHARMA_FIREWALL_ADD', `Nuevo fármaco añadido al cortafuegos: ${newDrug.commercialName} (${newDrug.genericName})`);
    triggerToast(`Fármaco "${newDrug.commercialName}" bloqueado con éxito en el cortafuegos.`, 'success');
    setNewDrugModalOpen(false);
    setNewDrugForm({
      commercialName: '',
      genericName: '',
      riskLevel: 'critical_fatal',
      affectedSpecies: 'all',
      clinicalReason: ''
    });
  };

  const handleRemoveBlockedDrug = (drugId: string, name: string) => {
    setBlockedDrugs(prev => prev.filter(d => d.id !== drugId));
    appendAuditLog('PHARMA_FIREWALL_REMOVE', `Fármaco ${name} retirado del cortafuegos activo`);
    triggerToast(`Fármaco "${name}" retirado de la lista activa de bloqueos.`, 'warning');
  };

  // ============================================================================
  // Acciones Admin de Ciudad (Nodo Territorial)
  // ============================================================================

  const handleApprovePartner = (partnerId: string, partnerName: string) => {
    setPartners(prev =>
      prev.map(p => {
        if (p.id === partnerId) {
          appendAuditLog('PARTNER_APPROVED', `Aliado aprobado y verificado: ${partnerName} (RUC: ${p.taxIdRuc})`);
          triggerToast(`Aliado "${partnerName}" verificado con éxito con credenciales válidas.`, 'success');
          return { ...p, status: 'approved' as const };
        }
        return p;
      })
    );
  };

  const handleRejectPartner = (partnerId: string, partnerName: string, reason: string) => {
    setPartners(prev =>
      prev.map(p => {
        if (p.id === partnerId) {
          appendAuditLog('PARTNER_REJECTED', `Aliado rechazado: ${partnerName}. Motivo: ${reason}`);
          triggerToast(`Solicitud de "${partnerName}" rechazada: ${reason}`, 'error');
          return { ...p, status: 'rejected' as const, rejectionReason: reason };
        }
        return p;
      })
    );
  };

  const handleUpdateShelterPercent = (shelterId: string, delta: number) => {
    setShelters(prev =>
      prev.map(s => {
        if (s.id === shelterId) {
          const newPct = Math.max(0.5, Math.min(5.0, Number((s.solidarityDonationPercent + delta).toFixed(1))));
          appendAuditLog('SHELTER_DONATION_PCT_CHANGE', `Tasa solidaria ajustada a ${newPct}% para ${s.shelterName}`);
          triggerToast(`Fondo solidario de ${s.shelterName} ajustado al ${newPct}%`, 'success');
          return { ...s, solidarityDonationPercent: newPct };
        }
        return s;
      })
    );
  };

  const handleResolveDispute = (disputeId: string, action: 'refund' | 'dismiss') => {
    setDisputes(prev =>
      prev.map(d => {
        if (d.id === disputeId) {
          const newStatus = action === 'refund' ? ('refunded' as const) : ('dismissed' as const);
          appendAuditLog('DISPUTE_RESOLVED', `Disputa ${d.orderNumber} resuelta como: ${newStatus.toUpperCase()}`);
          triggerToast(`Disputa #${d.orderNumber} resuelta (${action === 'refund' ? 'Reembolso emitido vía Deuna' : 'Desestimada con comprobante'})`, 'success');
          return { ...d, status: newStatus };
        }
        return d;
      })
    );
  };

  // ============================================================================
  // Acciones Supervisor (Moderación & Control de Calidad)
  // ============================================================================

  const handleApproveGeoPush = (alertId: string, title: string) => {
    setGeoAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          const notifiedCount = 3120;
          appendAuditLog('GEO_PUSH_APPROVED_5KM', `Alerta comunitaria aprobada con difusión push 5km: "${title}" (${notifiedCount} tutores)`);
          triggerToast(`¡Alerta Push activada! Notificados ${notifiedCount} tutores en radio de 5km en ${cityName}.`, 'success');
          return { ...a, status: 'broadcasting_5km' as const, notifiedTutorsCount: notifiedCount };
        }
        return a;
      })
    );
  };

  const handleResolveGeoAlert = (alertId: string) => {
    setGeoAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          appendAuditLog('GEO_ALERT_RESOLVED', `Alerta #${a.id} marcada como resuelta / Mascota rescatada`);
          triggerToast('Alerta marcada como resuelta satisfactoriamente.', 'success');
          return { ...a, status: 'resolved' as const };
        }
        return a;
      })
    );
  };

  const handleDismissGeoAlert = (alertId: string) => {
    setGeoAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          appendAuditLog('GEO_ALERT_DISMISSED', `Alerta #${a.id} descartada por falsa alarma`);
          triggerToast('Alerta descartada del mapa comunitario.', 'warning');
          return { ...a, status: 'dismissed_fake' as const };
        }
        return a;
      })
    );
  };

  const handleResolveBiometricAnomaly = (anomalyId: string, action: 'freeze' | 'authorize') => {
    setBiometricAnomalies(prev =>
      prev.map(b => {
        if (b.id === anomalyId) {
          const newStatus = action === 'freeze' ? ('frozen_locked' as const) : ('resolved_authorized' as const);
          appendAuditLog('BIOMETRIC_ISO_ACTION', `Microchip ${b.chipNumberIso} marcado como ${newStatus.toUpperCase()}`);
          triggerToast(`Microchip ${b.chipNumberIso} actualizado a: ${newStatus.toUpperCase()}`, 'warning');
          return { ...b, status: newStatus };
        }
        return b;
      })
    );
  };

  // ============================================================================
  // Acciones Operador SOS (Consola Despacho & WebMCP)
  // ============================================================================

  const handleDispatchEmergency = (emergencyId: string, unitName: string, clinicName: string) => {
    setEmergencies(prev =>
      prev.map(e => {
        if (e.id === emergencyId) {
          appendAuditLog('SOS_DISPATCH_1CLICK', `Despachada ${unitName} para emergencia ${e.emergencyCode} hacia ${clinicName}`);
          triggerToast(`¡Unidad ${unitName} despachada hacia ${clinicName}! Paciente: ${e.patientName}`, 'success');
          return {
            ...e,
            assignedUnit: unitName,
            assignedClinic: clinicName,
            status: 'dispatched_en_route' as const
          };
        }
        return e;
      })
    );
  };

  const handleWebMCPDispatchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const emergencyId = formData.get('emergencyId') as string;
    const dispatchType = formData.get('dispatchType') as string;
    const destinationClinic = formData.get('destinationClinic') as string;
    const priority = formData.get('priority') as string;
    const operatorNotes = formData.get('operatorNotes') as string;

    const targetEmg = emergencies.find(emg => emg.id === emergencyId) || emergencies[0];
    if (targetEmg) {
      handleDispatchEmergency(targetEmg.id, `${dispatchType} (Móvil Rápido)`, destinationClinic);
      appendAuditLog('WEBMCP_TOOL_INVOKED', `Tool declarativa "pawlo_operator_dispatch_sos" ejecutada. Prioridad: ${priority}. Notas: ${operatorNotes}`);
    }
  };

  // Helper para generar enlaces de WhatsApp con formato internacional E.164
  const getWhatsAppEmergencyUrl = (phoneE164: string, patientName: string, emergencyCode: string) => {
    const cleanPhone = phoneE164.replace(/\D/g, '');
    const message = `PAWLO SOS 24/7 [${emergencyCode}]: Hola estimado/a tutor/a de ${patientName}. Soy el Operador de Emergencias de PAWLO Cuenca. Hemos activado la unidad de respuesta y asignado clínica de urgencias. Por favor mantenga la calma y confirme si el paciente responde a estímulos.`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  };

  // Copiar al portapapeles
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    triggerToast(`${label} copiado al portapapeles.`, 'success');
  };

  // ============================================================================
  // RENDERIZADO DEL COMPONENTE
  // ============================================================================

  return (
    <div className="space-y-6">
      {/* Toast Flotante Interactivo */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 animate-bounce max-w-md">
          <div className={`p-4 rounded-2xl shadow-2xl border flex items-center space-x-3 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/95 border-emerald-500/50 text-emerald-200'
              : toastMessage.type === 'warning'
              ? 'bg-amber-950/95 border-amber-500/50 text-amber-200'
              : 'bg-rose-950/95 border-rose-500/50 text-rose-200'
          }`}>
            {toastMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
            {toastMessage.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />}
            {toastMessage.type === 'error' && <XCircle className="w-5 h-5 text-rose-400 shrink-0" />}
            <span className="text-sm font-semibold">{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* CABECERA PRINCIPAL Y SELECTOR DE ROL ERGONÓMICO */}
      <div className={`glass-panel rounded-3xl p-6 sm:p-8 ${panelBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10 dark:border-white/10 border-slate-200">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full badge-emerald text-xs font-mono font-bold tracking-wider uppercase">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>PAWLO STAFF & ADMIN CONSOLE 2026</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full badge-sky text-xs font-mono font-semibold">
                <MapPin className="w-3.5 h-3.5" />
                <span>NODO {cityCode} • {cityName.toUpperCase()}</span>
              </span>
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                <Lock className="w-3 h-3" />
                <span>FORENSE SHA-256</span>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Consola Operativa, Gobernanza y Despacho Territorial
            </h1>
            <p className={`text-sm mt-1 ${textMuted}`}>
              Supervisión de nodos urbanos, validación de aliados SENESCYT, cortafuegos farmacológico y despacho de emergencias en tiempo real.
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2.5 rounded-2xl border text-right ${subtleCardBg}`}>
              <div className="text-[11px] font-mono text-emerald-400 uppercase tracking-wider font-bold">Estado del Nodo</div>
              <div className="text-sm font-bold text-emerald-400 flex items-center justify-end space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>En Línea (18ms)</span>
              </div>
            </div>
            <div className={`px-4 py-2.5 rounded-2xl border text-right ${subtleCardBg}`}>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider font-bold">Moneda / Rail</div>
              <div className="text-sm font-bold font-mono text-cyan-400">{currency} • Deuna / P2P</div>
            </div>
          </div>
        </div>

        {/* NAVEGACIÓN ERGONÓMICA DE ROLES (Touch targets >= 44px, scroll horizontal en móvil) */}
        <div className="mt-6">
          <div className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-2">
            Seleccionar Perfil Operativo Activo:
          </div>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2 pt-1">
            {/* 1. Super Admin */}
            <button
              onClick={() => onSelectRole('super_admin')}
              className={`min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2.5 transition-all shrink-0 cursor-pointer ${
                activeRole === 'super_admin'
                  ? 'btn-primary-2026 shadow-lg scale-102 ring-2 ring-emerald-400/50'
                  : isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>1. Super Admin (Global & Multi-Nodo)</span>
            </button>

            {/* 2. Admin de Ciudad */}
            <button
              onClick={() => onSelectRole('admin')}
              className={`min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2.5 transition-all shrink-0 cursor-pointer ${
                activeRole === 'admin'
                  ? 'btn-primary-2026 shadow-lg scale-102 ring-2 ring-emerald-400/50'
                  : isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>2. Admin de Ciudad ({cityName})</span>
            </button>

            {/* 3. Supervisor */}
            <button
              onClick={() => onSelectRole('supervisor')}
              className={`min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2.5 transition-all shrink-0 cursor-pointer ${
                activeRole === 'supervisor'
                  ? 'btn-primary-2026 shadow-lg scale-102 ring-2 ring-emerald-400/50'
                  : isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>3. Supervisor (Calidad & Biometría)</span>
            </button>

            {/* 4. Operator */}
            <button
              onClick={() => onSelectRole('operator')}
              className={`min-h-[48px] px-5 py-3 rounded-2xl font-bold text-sm flex items-center space-x-2.5 transition-all shrink-0 cursor-pointer ${
                activeRole === 'operator'
                  ? 'bg-gradient-to-r from-rose-500 to-amber-500 text-white shadow-lg scale-102 ring-2 ring-rose-400/50'
                  : isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-white/10'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              <Flame className="w-4 h-4 text-amber-300" />
              <span>4. Operador SOS (Despacho 24/7)</span>
            </button>
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 1. PORTAL SUPER ADMIN (Gobernanza Global & Multi-Nodo)               */}
      {/* ==================================================================== */}
      {activeRole === 'super_admin' && (
        <div className="space-y-6">
          {/* KPI CARDS GLOBALES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Nodos Activos */}
            <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${panelBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textMuted}`}>Nodos Urbanos</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Globe className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {nodes.filter(n => n.status === 'active').length} / {nodes.length}
              </div>
              <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                <span className="text-emerald-400 font-semibold">100% Cobertura Andina</span>
                <span>Cuenca, UIO, BOG, LIM</span>
              </div>
            </div>

            {/* Card 2: Consultas Edge IA */}
            <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${panelBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textMuted}`}>Edge IA ($0.00 Cost)</span>
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                  <Cpu className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-cyan-400">
                54,820 <span className="text-xs font-normal text-slate-400">queries</span>
              </div>
              <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                <span className="text-cyan-400 font-semibold">$384.60 ahorrados</span>
                <span>18.2M tokens offline</span>
              </div>
            </div>

            {/* Card 3: Volumen Transaccional GMV */}
            <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${panelBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textMuted}`}>GMV Consolidado</span>
                <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                  <DollarSign className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                $353,720 <span className="text-xs font-normal text-slate-400">USD/mes</span>
              </div>
              <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                <span className="text-indigo-400 font-semibold">Take Rate: 2.1%</span>
                <span>Comisión: $7,428.12</span>
              </div>
            </div>

            {/* Card 4: Bloqueos Cortafuegos */}
            <div className={`p-5 rounded-2xl border transition-all hover:scale-[1.01] ${panelBg}`}>
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold uppercase tracking-wider ${textMuted}`}>Cortafuegos Farmacia</span>
                <span className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                  <ShieldAlert className="w-5 h-5" />
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-rose-400">
                1,642 <span className="text-xs font-normal text-slate-400">bloqueos</span>
              </div>
              <div className="mt-2 text-xs flex items-center justify-between text-slate-400">
                <span className="text-rose-400 font-semibold">0 Intoxicaciones</span>
                <span>{blockedDrugs.length} Fármacos vetados</span>
              </div>
            </div>
          </div>

          {/* MULTI-CITY NODE SWITCHER & CONTROL DE PASARELAS */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2">
                  <Server className="w-5 h-5 text-emerald-400" />
                  <span>Matriz de Nodos Territoriales & Pasarelas de Pago</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Gestión de disponibilidad territorial y tasas de comisión para Deuna, Yape, Nequi y tarjetas.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                  Global Mesh Status: ÓPTIMO
                </span>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className={`border-b text-xs font-mono uppercase tracking-wider ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-3 px-4">Ciudad / Nodo</th>
                    <th className="py-3 px-4">País & Moneda</th>
                    <th className="py-3 px-4">Pasarela P2P Principal</th>
                    <th className="py-3 px-4">% Comisión PAWLO</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Aliados / GMV</th>
                    <th className="py-3 px-4 text-right">Acción Operativa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100">
                  {nodes.map(node => (
                    <tr key={node.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="py-4 px-4 font-bold flex items-center space-x-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                        <span>{node.name}</span>
                        <span className="text-xs font-mono text-slate-400">[{node.code}]</span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono">
                        {node.country} • <span className="font-bold text-cyan-400">{node.currency}</span>
                      </td>
                      <td className="py-4 px-4 text-xs">
                        <span className="font-semibold">{node.primaryGateway}</span>
                        <div className="text-[11px] text-slate-400 font-mono">Latencia: {node.latencyMs}ms</div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-sm text-emerald-400">{node.gatewayCommissionRate.toFixed(1)}%</span>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => handleUpdateCommissionRate(node.id, -0.1)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                              title="Reducir 0.1%"
                            >
                              -
                            </button>
                            <button
                              onClick={() => handleUpdateCommissionRate(node.id, 0.1)}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                                isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                              }`}
                              title="Aumentar 0.1%"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-mono font-bold ${
                          node.status === 'active'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : node.status === 'paused'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}>
                          {node.status === 'active' ? '● ACTIVO' : node.status === 'paused' ? '❚❚ EN PAUSA' : '▲ MANTENIMIENTO'}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-xs font-mono">
                        <div>{node.activePartnersCount} Aliados</div>
                        <div className="text-slate-400">${node.monthlyGmvUsd.toLocaleString()} GMV</div>
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleToggleNodeStatus(node.id)}
                          className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                            node.status === 'active'
                              ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40'
                              : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          }`}
                        >
                          {node.status === 'active' ? 'Pausar Nodo' : 'Activar Nodo'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CONFIGURACIÓN EN VIVO DEL CORTAFUEGOS FARMACOLÓGICO */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2 text-rose-400">
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                  <span>Cortafuegos Farmacológico & Lista de Fármacos Prohibidos</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Reglas clínicas activas que bloquean compras y dispensaciones no autorizadas para prevenir intoxicaciones caninas y felinas.
                </p>
              </div>
              <button
                onClick={() => setNewDrugModalOpen(true)}
                className="min-h-[44px] px-4 py-2 rounded-2xl btn-primary-2026 text-xs font-bold flex items-center space-x-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir Fármaco al Cortafuegos</span>
              </button>
            </div>

            {/* Modal para añadir nuevo fármaco */}
            {newDrugModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
                <div className={`max-w-xl w-full p-6 sm:p-8 rounded-3xl border shadow-2xl ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
                    <h4 className="text-lg font-bold flex items-center space-x-2 text-rose-400">
                      <ShieldAlert className="w-5 h-5" />
                      <span>Registrar Fármaco Restringido en Cortafuegos</span>
                    </h4>
                    <button
                      onClick={() => setNewDrugModalOpen(false)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <form onSubmit={handleAddBlockedDrug} className="space-y-4">
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">Nombre Comercial / Marcas</label>
                      <input
                        type="text"
                        placeholder="Ej. Ketoprofeno Humano / Doloforte"
                        value={newDrugForm.commercialName}
                        onChange={e => setNewDrugForm({ ...newDrugForm, commercialName: e.target.value })}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none ${inputBg}`}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">Principio Activo Genérico</label>
                      <input
                        type="text"
                        placeholder="Ej. Ketoprofeno sódico"
                        value={newDrugForm.genericName}
                        onChange={e => setNewDrugForm({ ...newDrugForm, genericName: e.target.value })}
                        className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none ${inputBg}`}
                        required
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">Nivel de Riesgo</label>
                        <select
                          value={newDrugForm.riskLevel}
                          onChange={e => setNewDrugForm({ ...newDrugForm, riskLevel: e.target.value as any })}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none ${inputBg}`}
                        >
                          <option value="critical_fatal">Crítico / Mortal</option>
                          <option value="high_risk">Alto Riesgo Renal/Hepático</option>
                          <option value="controlled_special">Controlado Especial (Psicotrópico)</option>
                          <option value="genetic_alert">Alerta Genética (MDR1 / Collies)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">Especies Afectadas</label>
                        <select
                          value={newDrugForm.affectedSpecies}
                          onChange={e => setNewDrugForm({ ...newDrugForm, affectedSpecies: e.target.value as any })}
                          className={`w-full min-h-[44px] px-3.5 py-2.5 rounded-xl text-sm border focus:outline-none ${inputBg}`}
                        >
                          <option value="all">Todas las Especies</option>
                          <option value="felines">Felinos Exclusivo</option>
                          <option value="canines">Caninos Exclusivo</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">Fundamento Clínico y Toxicológico</label>
                      <textarea
                        rows={3}
                        placeholder="Describa el mecanismo toxicológico (ej. necrosis tubular aguda, hemorragia gástrica, metahemoglobinemia)..."
                        value={newDrugForm.clinicalReason}
                        onChange={e => setNewDrugForm({ ...newDrugForm, clinicalReason: e.target.value })}
                        className={`w-full p-3 rounded-xl text-sm border focus:outline-none ${inputBg}`}
                        required
                      ></textarea>
                    </div>
                    <div className="flex justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setNewDrugModalOpen(false)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer ${
                          isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="min-h-[44px] px-6 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm cursor-pointer shadow-lg"
                      >
                        Bloquear en Cortafuegos Inmediatamente
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* Listado de fármacos bloqueados */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {blockedDrugs.map(drug => (
                <div
                  key={drug.id}
                  className={`p-4 rounded-2xl border flex flex-col justify-between ${
                    drug.riskLevel === 'critical_fatal'
                      ? 'border-rose-500/30 bg-rose-950/20'
                      : drug.riskLevel === 'genetic_alert'
                      ? 'border-amber-500/30 bg-amber-950/20'
                      : subtleCardBg
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                        drug.riskLevel === 'critical_fatal'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : drug.riskLevel === 'genetic_alert'
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                      }`}>
                        {drug.riskLevel === 'critical_fatal' ? 'Mortal / Prohibido' : drug.riskLevel === 'genetic_alert' ? 'Mutación MDR1' : 'Controlado'}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {drug.affectedSpecies === 'felines' ? '🐱 Felinos' : drug.affectedSpecies === 'canines' ? '🐶 Caninos' : '🐾 Todas'}
                      </span>
                    </div>
                    <div className="font-bold text-sm text-slate-100 dark:text-slate-100">{drug.commercialName}</div>
                    <div className="text-xs font-mono text-cyan-400">{drug.genericName}</div>
                    <p className={`text-xs leading-relaxed ${textMuted}`}>{drug.clinicalReason}</p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-white/5 dark:border-white/5 border-slate-200 flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400 text-[10px]">Bloqueado por: {drug.blockedBy}</span>
                    <button
                      onClick={() => handleRemoveBlockedDrug(drug.id, drug.commercialName)}
                      className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/10 cursor-pointer"
                      title="Retirar bloqueo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* REGISTRO FORENSE INMUTABLE (AUDIT LOGS) */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2 text-indigo-400">
                  <Database className="w-5 h-5 text-indigo-400" />
                  <span>Registro Forense Inmutable de Auditoría (Audit Ledger)</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Traza criptográfica inalterable con hashes SHA-256 para cumplimiento ISO-27001 y auditorías regulatorias.
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Filtrar por acción o nodo..."
                  value={auditSearchQuery}
                  onChange={e => setAuditSearchQuery(e.target.value)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs border focus:outline-none ${inputBg}`}
                />
                <button
                  onClick={() => copyToClipboard(JSON.stringify(auditLogs, null, 2), 'Historial Forense JSON')}
                  className={`min-h-[40px] px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center space-x-1 cursor-pointer ${
                    isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                  }`}
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Exportar</span>
                </button>
              </div>
            </div>

            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b font-mono uppercase tracking-wider ${isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'}`}>
                    <th className="py-2.5 px-3">Timestamp (UTC)</th>
                    <th className="py-2.5 px-3">Hash SHA-256</th>
                    <th className="py-2.5 px-3">Operador / Rol</th>
                    <th className="py-2.5 px-3">Nodo</th>
                    <th className="py-2.5 px-3">Acción Crítica</th>
                    <th className="py-2.5 px-3">Detalle Operativo</th>
                    <th className="py-2.5 px-3 text-right">Integridad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 dark:divide-white/5 divide-slate-100 font-mono">
                  {auditLogs
                    .filter(log =>
                      !auditSearchQuery ||
                      log.actionType.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                      log.cityNode.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
                      log.payloadSummary.toLowerCase().includes(auditSearchQuery.toLowerCase())
                    )
                    .map(log => (
                      <tr key={log.id} className="hover:bg-indigo-500/5 transition-colors">
                        <td className="py-3 px-3 text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                        <td className="py-3 px-3">
                          <span
                            onClick={() => copyToClipboard(log.hashSha256, 'Hash SHA-256')}
                            className="cursor-pointer text-indigo-400 hover:text-indigo-300 font-mono"
                            title="Click para copiar hash completo"
                          >
                            {log.hashSha256.substring(0, 10)}...{log.hashSha256.substring(58)}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-200 dark:text-slate-200">
                          {log.operatorRole} <span className="text-[10px] text-slate-400">({log.operatorId})</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-bold">{log.cityNode}</span>
                        </td>
                        <td className="py-3 px-3 font-bold text-amber-400">{log.actionType}</td>
                        <td className="py-3 px-3 max-w-xs truncate text-slate-300" title={log.payloadSummary}>
                          {log.payloadSummary}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <span className="inline-flex items-center space-x-1 text-emerald-400 font-bold text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>VÁLIDO</span>
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 2. PORTAL ADMIN DE CIUDAD (Gestión de Nodo Territorial)             */}
      {/* ==================================================================== */}
      {activeRole === 'admin' && (
        <div className="space-y-6">
          {/* Banner de Contexto Territorial */}
          <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-emerald-400">
                  Gobernanza Territorial: Nodo {cityName} [{cityCode}]
                </h3>
                <p className="text-xs text-slate-300">
                  Entidades reguladoras integradas: Agrocalidad Ecuador, SRI RIMPE, SENESCYT y Colegio de Médicos Veterinarios.
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono">
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300">
                Aliados Activos: <strong className="text-emerald-400">42</strong>
              </span>
              <span className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/10 text-slate-300">
                Donaciones Albergues: <strong className="text-cyan-400">$1,537.70 USD</strong>
              </span>
            </div>
          </div>

          {/* BANDEJA DE APROBACIÓN DE ALIADOS (SENESCYT & RUC) */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2 text-cyan-400">
                  <UserCheck className="w-5 h-5 text-cyan-400" />
                  <span>Bandeja de Acreditación de Aliados & Profesionales</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Verificación de títulos médicos veterinarios SENESCYT, RUC SRI y licencias sanitarias de funcionamiento.
                </p>
              </div>

              {/* Filtros de estado */}
              <div className="flex space-x-2 overflow-x-auto no-scrollbar">
                {(['all', 'pending', 'approved', 'rejected'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setPartnerFilter(tab)}
                    className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partnerFilter === tab
                        ? 'bg-cyan-500 text-slate-950 font-extrabold shadow-sm'
                        : isDark
                        ? 'bg-slate-900 text-slate-400 hover:text-white border border-white/10'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-300'
                    }`}
                  >
                    {tab === 'all'
                      ? `Todos (${partners.length})`
                      : tab === 'pending'
                      ? `Pendientes (${partners.filter(p => p.status === 'pending').length})`
                      : tab === 'approved'
                      ? `Aprobados (${partners.filter(p => p.status === 'approved').length})`
                      : `Rechazados (${partners.filter(p => p.status === 'rejected').length})`}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de aplicaciones */}
            <div className="space-y-4">
              {partners
                .filter(p => (partnerFilter === 'all' ? true : p.status === partnerFilter))
                .map(partner => (
                  <div
                    key={partner.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      partner.status === 'approved'
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : partner.status === 'rejected'
                        ? 'border-rose-500/30 bg-rose-950/10'
                        : subtleCardBg
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full uppercase ${
                            partner.category === 'veterinarian'
                              ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                              : partner.category === 'pharmacy_store'
                              ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                              : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                          }`}>
                            {partner.category === 'veterinarian' ? '🩺 Médico Veterinario' : partner.category === 'pharmacy_store' ? '💊 Farmacia / Pet Shop' : '🚗 Pet Taxi & Traslado'}
                          </span>
                          <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full ${
                            partner.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : partner.status === 'rejected'
                              ? 'bg-rose-500/20 text-rose-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {partner.status === 'approved' ? 'VERIFICADO SENESCYT' : partner.status === 'rejected' ? 'RECHAZADO' : 'PENDIENTE DE VALIDACIÓN'}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-100 dark:text-slate-100">{partner.legalName}</h4>
                        <div className="text-xs font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                          <span>RUC: <strong className="text-slate-200">{partner.taxIdRuc}</strong></span>
                          {partner.professionalLicenseSenescyt && (
                            <span>SENESCYT: <strong className="text-cyan-400">{partner.professionalLicenseSenescyt}</strong></span>
                          )}
                          {partner.agrocalidadLicense && (
                            <span>Agrocalidad: <strong className="text-emerald-400">{partner.agrocalidadLicense}</strong></span>
                          )}
                          <span>Ubicación: {partner.address}</span>
                        </div>
                        {partner.rejectionReason && (
                          <p className="text-xs text-rose-400 font-mono mt-1">
                            Motivo de rechazo: {partner.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Botones de Acción Inmediata (44px touch targets) */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={() => setSelectedPartnerForModal(partner)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center space-x-1.5 cursor-pointer ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          }`}
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Ver Expediente</span>
                        </button>

                        {partner.status !== 'approved' && (
                          <button
                            onClick={() => handleApprovePartner(partner.id, partner.legalName)}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aprobar / Verificar</span>
                          </button>
                        )}

                        {partner.status !== 'rejected' && (
                          <button
                            onClick={() => handleRejectPartner(partner.id, partner.legalName, 'Inconsistencia en títulos o falta de registro en SRI.')}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs flex items-center space-x-1.5 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>Rechazar</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Modal de Detalle de Expediente */}
          {selectedPartnerForModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
              <div className={`max-w-lg w-full p-6 rounded-3xl border shadow-2xl ${isDark ? 'bg-slate-900 border-white/15 text-white' : 'bg-white border-slate-300 text-slate-900'}`}>
                <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10 dark:border-white/10 border-slate-200">
                  <h4 className="text-base font-bold flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-cyan-400" />
                    <span>Expediente Regulatorio Digital</span>
                  </h4>
                  <button onClick={() => setSelectedPartnerForModal(null)} className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 font-mono">Nombre Jurídico:</span>
                    <div className="font-bold text-sm">{selectedPartnerForModal.legalName}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 font-mono">
                    <div>
                      <span className="text-slate-400">RUC SRI:</span>
                      <div className="font-bold">{selectedPartnerForModal.taxIdRuc}</div>
                    </div>
                    <div>
                      <span className="text-slate-400">SENESCYT Registro:</span>
                      <div className="font-bold text-cyan-400">{selectedPartnerForModal.professionalLicenseSenescyt || 'N/A'}</div>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 font-mono">Documentos Adjuntos Digitalizados:</span>
                    <div className="mt-2 space-y-1.5">
                      <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                        <span>Título Profesional SENESCYT</span>
                        <span className="text-emerald-400 font-bold">✓ PDF Firmado</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                        <span>RUC SRI Activo con Actividad Veterinaria</span>
                        <span className="text-emerald-400 font-bold">✓ Validado Web SRI</span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-800/80 flex items-center justify-between">
                        <span>Permiso Sanitario Agrocalidad</span>
                        <span className="text-emerald-400 font-bold">✓ Vigente 2026</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedPartnerForModal(null)}
                    className="min-h-[44px] px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs cursor-pointer"
                  >
                    Cerrar Expediente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* CONTROL DE CONVENIOS CON REFUGIOS & ALBERGUES */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2 text-emerald-400">
                  <HeartPulse className="w-5 h-5 text-emerald-400" />
                  <span>Convenios de Solidaridad con Albergues & Refugios ({cityName})</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Distribución automática del % solidario recaudado en cada checkout del marketplace para alimentación y esterilización.
                </p>
              </div>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/30">
                Total Recaudado este Mes: $1,537.70 USD
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {shelters.map(shelter => (
                <div key={shelter.id} className={`p-5 rounded-2xl border flex flex-col justify-between ${subtleCardBg}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-slate-400">{shelter.agreementCode}</span>
                      <span className="text-xs font-mono font-bold text-emerald-400">
                        {shelter.currentAnimalsCount} / {shelter.receptionCapacity} Huéspedes
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-100 dark:text-slate-100">{shelter.shelterName}</h4>
                    <p className={`text-xs ${textMuted}`}>{shelter.location}</p>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-white/5 space-y-1 text-xs font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fondos Mes:</span>
                        <span className="font-bold text-emerald-400">${shelter.accumulatedMonthUsd.toFixed(2)} USD</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Adopciones Vía App:</span>
                        <span className="font-bold text-cyan-400">{shelter.adoptionsCompleted} mascotas</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-3 border-t border-white/5 flex items-center justify-between">
                    <div className="text-xs font-mono">
                      <span className="text-slate-400">Tasa Solidaria:</span>{' '}
                      <strong className="text-emerald-400">{shelter.solidarityDonationPercent.toFixed(1)}%</strong>
                    </div>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleUpdateShelterPercent(shelter.id, -0.5)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleUpdateShelterPercent(shelter.id, 0.5)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs cursor-pointer ${
                          isDark ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DISPUTAS COMERCIALES & AUDITORÍA DE RECETAS */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Panel de Disputas */}
            <div className={`p-6 rounded-3xl border ${panelBg}`}>
              <h3 className="text-base font-bold flex items-center space-x-2 text-amber-400 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <span>Disputas Comerciales Abiertas</span>
              </h3>
              <div className="space-y-3">
                {disputes.map(dispute => (
                  <div key={dispute.id} className={`p-4 rounded-2xl border ${subtleCardBg} space-y-2`}>
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="font-bold text-amber-400">{dispute.orderNumber}</span>
                      <span className="text-slate-400">${dispute.amountDisputed.toFixed(2)} USD</span>
                    </div>
                    <div className="text-xs text-slate-300 leading-relaxed">{dispute.description}</div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/5 text-xs">
                      <span className="text-slate-400 font-mono">Cliente: {dispute.customerName}</span>
                      {dispute.status === 'open' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleResolveDispute(dispute.id, 'refund')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] cursor-pointer"
                          >
                            Reembolsar Deuna
                          </button>
                          <button
                            onClick={() => handleResolveDispute(dispute.id, 'dismiss')}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[11px] cursor-pointer"
                          >
                            Desestimar
                          </button>
                        </div>
                      ) : (
                        <span className="text-emerald-400 font-mono font-bold text-[11px]">
                          {dispute.status === 'refunded' ? 'REEMBOLSADO' : 'CERRADO'}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel de Auditoría de Recetas del Nodo */}
            <div className={`p-6 rounded-3xl border ${panelBg}`}>
              <h3 className="text-base font-bold flex items-center space-x-2 text-cyan-400 mb-3">
                <FileText className="w-5 h-5 text-cyan-400" />
                <span>Auditoría de Recetas Digitales Emitidas</span>
              </h3>
              <div className="space-y-3">
                {rxAudits.map(rx => (
                  <div key={rx.id} className={`p-4 rounded-2xl border ${subtleCardBg} space-y-1.5 text-xs`}>
                    <div className="flex items-center justify-between font-mono">
                      <span className="font-bold text-cyan-400">{rx.rxNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rx.firewallStatus === 'passed_safe'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : rx.firewallStatus === 'requires_controlled_validation'
                          ? 'bg-amber-500/20 text-amber-400'
                          : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {rx.firewallStatus === 'passed_safe' ? 'PASÓ CORTAFUEGOS' : rx.firewallStatus === 'requires_controlled_validation' ? 'CONTROLADO SENESCYT' : 'BLOQUEADO'}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-200">Paciente: {rx.petName}</div>
                    <div className="text-slate-400 font-mono">Fármacos: {rx.prescribedDrugs.join(', ')}</div>
                    <div className="text-[11px] text-slate-500 flex justify-between">
                      <span>Médico: {rx.vetName}</span>
                      <span>Firma: {rx.signatureVerified ? '✓ Válida' : '✗ Inválida'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 3. PORTAL SUPERVISOR (Moderación & Control de Calidad)              */}
      {/* ==================================================================== */}
      {activeRole === 'supervisor' && (
        <div className="space-y-6">
          {/* MODERACIÓN DE ALERTAS GEOESPACIALES COMUNITARIAS */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2 text-amber-400">
                  <Radio className="w-5 h-5 text-amber-400" />
                  <span>Moderación de Alertas Geoespaciales Comunitarias</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Aprobación de difusión push geocercada (5 km) a tutores de la zona para rescates inmediatos y mascotas perdidas.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-3 py-1.5 rounded-full border border-cyan-500/30">
                Radio de Cobertura Activo: 5.0 KM
              </span>
            </div>

            <div className="space-y-4">
              {geoAlerts.map(alert => (
                <div
                  key={alert.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    alert.status === 'broadcasting_5km'
                      ? 'border-cyan-500/40 bg-cyan-950/20'
                      : alert.status === 'resolved'
                      ? 'border-emerald-500/30 bg-emerald-950/10 opacity-75'
                      : subtleCardBg
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 max-w-3xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase ${
                          alert.type === 'injured_animal'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                            : alert.type === 'lost_pet'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/40'
                        }`}>
                          {alert.type === 'injured_animal' ? '🚨 ANIMAL HERIDO' : alert.type === 'lost_pet' ? '🔍 MASCOTA EXTRAVIADA' : '👀 AVISTAMIENTO'}
                        </span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          alert.status === 'broadcasting_5km'
                            ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                            : alert.status === 'resolved'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {alert.status === 'broadcasting_5km'
                            ? `DIFUNDIENDO PUSH 5KM (${alert.notifiedTutorsCount} tutores)`
                            : alert.status === 'resolved'
                            ? 'RESCATE RESUELTO'
                            : alert.status === 'dismissed_fake'
                            ? 'FALSA ALARMA DESCARTADA'
                            : 'PENDIENTE DE MODERACIÓN'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">Hace {alert.reportedAtMinutesAgo} min</span>
                      </div>

                      <h4 className="text-base font-bold text-slate-100 dark:text-slate-100">{alert.title}</h4>
                      <p className={`text-xs leading-relaxed ${textMuted}`}>{alert.description}</p>

                      <div className="text-xs font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center space-x-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>{alert.locationName}</span>
                        </span>
                        <span>Reportó: <strong>{alert.reportedBy}</strong></span>
                        <span>Teléfono: {alert.reporterPhone}</span>
                      </div>
                    </div>

                    {/* Acciones de Moderación */}
                    <div className="flex flex-wrap items-center gap-2">
                      {alert.status === 'pending_moderation' && (
                        <button
                          onClick={() => handleApproveGeoPush(alert.id, alert.title)}
                          className="min-h-[44px] px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-md cursor-pointer"
                        >
                          <Radio className="w-4 h-4" />
                          <span>Aprobar Push (5 km)</span>
                        </button>
                      )}

                      {alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleResolveGeoAlert(alert.id)}
                          className="min-h-[44px] px-3.5 py-2 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Marcar Resuelta</span>
                        </button>
                      )}

                      {alert.status !== 'dismissed_fake' && alert.status !== 'resolved' && (
                        <button
                          onClick={() => handleDismissGeoAlert(alert.id)}
                          className="min-h-[44px] px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-400 font-bold text-xs flex items-center space-x-1 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                          <span>Descartar Falsa</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AUDITORÍA DE ANOMALÍAS BIOMÉTRICAS ISO 11784/11785 */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <h3 className="text-lg font-bold flex items-center space-x-2 text-indigo-400">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  <span>Auditoría de Anomalías Biométricas (ISO 11784/11785 FDX-B)</span>
                </h3>
                <p className={`text-xs mt-0.5 ${textMuted}`}>
                  Detección de chips duplicados, microchips reportados como extraviados y números no conformes con estándar RFID 134.2 kHz.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Verificar chip (15 dígitos)..."
                  value={biometricSearchQuery}
                  onChange={e => setBiometricSearchQuery(e.target.value)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-mono border focus:outline-none ${inputBg}`}
                />
              </div>
            </div>

            <div className="space-y-4">
              {biometricAnomalies.map(anomaly => (
                <div key={anomaly.id} className={`p-4 rounded-2xl border ${subtleCardBg} space-y-2`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-base text-cyan-400">{anomaly.chipNumberIso}</span>
                      <span className="text-xs font-mono text-slate-400">({anomaly.standard})</span>
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                        anomaly.riskScore === 'CRITICAL' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        RIESGO {anomaly.riskScore}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-slate-400">Detectado: {anomaly.flaggedAt}</div>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-slate-300">
                      <strong>Anomalía:</strong> {anomaly.anomalyType === 'reported_stolen_elsewhere' ? 'Alerta: Chip reportado como EXTRAVIADO intenta registrarse por nuevo usuario' : anomaly.anomalyType === 'duplicate_in_multiple_cities' ? 'Duplicado simultáneo detectado en dos ciudades' : 'Formato o dígito de verificación checksum no conforme'}
                    </div>
                    <div className="text-slate-400">
                      Intento Actual: {anomaly.currentOwnerAttempt}
                    </div>
                    {anomaly.previousRegisteredOwner && (
                      <div className="text-amber-400">
                        Propietario Original Registrado: {anomaly.previousRegisteredOwner}
                      </div>
                    )}
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">
                      Estado: <strong className="text-slate-200">{anomaly.status.toUpperCase()}</strong>
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResolveBiometricAnomaly(anomaly.id, 'freeze')}
                        className="px-3 py-1.5 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Bloquear Microchip
                      </button>
                      <button
                        onClick={() => handleResolveBiometricAnomaly(anomaly.id, 'authorize')}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600/80 hover:bg-emerald-600 text-white font-bold text-xs cursor-pointer"
                      >
                        Autorizar Tras Validación
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* MONITOREO DE SLA DE OPERADORES DE TURNO */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <h3 className="text-base font-bold flex items-center space-x-2 text-emerald-400 mb-4">
              <Activity className="w-5 h-5 text-emerald-400" />
              <span>Monitoreo de SLA de Operadores de Turno (Cuenca SOS)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`p-4 rounded-2xl border ${subtleCardBg} text-center`}>
                <div className="text-xs font-mono text-slate-400 uppercase">Tiempo Medio de Despacho (Código Rojo)</div>
                <div className="text-3xl font-extrabold text-emerald-400 mt-1 font-mono">41 seg</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">Objetivo: &lt; 90 segundos</div>
              </div>
              <div className={`p-4 rounded-2xl border ${subtleCardBg} text-center`}>
                <div className="text-xs font-mono text-slate-400 uppercase">Cumplimiento SLA 24h</div>
                <div className="text-3xl font-extrabold text-cyan-400 mt-1 font-mono">98.4%</div>
                <div className="text-[11px] text-emerald-400 mt-1 font-mono">48 de 49 dentro de norma</div>
              </div>
              <div className={`p-4 rounded-2xl border ${subtleCardBg} text-center`}>
                <div className="text-xs font-mono text-slate-400 uppercase">Operadores en Línea</div>
                <div className="text-3xl font-extrabold text-indigo-400 mt-1 font-mono">3 / 4</div>
                <div className="text-[11px] text-slate-400 mt-1 font-mono">2 Consola, 1 Guardia, 1 Descanso</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* 4. PORTAL OPERATOR (Consola SOS & Despacho en Tiempo Real)           */}
      {/* ==================================================================== */}
      {activeRole === 'operator' && (
        <div className="space-y-6">
          {/* COLA DE EMERGENCIAS VITALES Y MASCOTAS PERDIDAS */}
          <div className={`p-6 rounded-3xl border border-rose-500/30 bg-rose-950/15 ${panelBg}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold uppercase tracking-wider mb-2">
                  <Flame className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  <span>CONSOLA SOS & EMERGENCIAS CRÍTICAS 24/7</span>
                </div>
                <h3 className="text-xl font-extrabold text-slate-100 flex items-center space-x-2">
                  <span>Cola Activa de Emergencias Vitales (Código Rojo 0h)</span>
                </h3>
              </div>
              <span className="text-xs font-mono text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-full border border-amber-500/30">
                SLA en Curso: 3 Casos Prioritarios
              </span>
            </div>

            <div className="space-y-4">
              {emergencies.map(emg => (
                <div
                  key={emg.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    emg.status === 'dispatched_en_route'
                      ? 'border-cyan-500/40 bg-cyan-950/20'
                      : emg.severity === 'code_red_vital'
                      ? 'border-rose-500/40 bg-rose-950/30'
                      : subtleCardBg
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="space-y-2 max-w-2xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-extrabold uppercase ${
                          emg.severity === 'code_red_vital'
                            ? 'bg-rose-600 text-white animate-pulse'
                            : 'bg-amber-500 text-slate-950'
                        }`}>
                          {emg.severity === 'code_red_vital' ? '● CÓDIGO ROJO (VITAL)' : '▲ CÓDIGO AMARILLO (URGENCIA)'}
                        </span>
                        <span className="font-mono font-bold text-sm text-cyan-300">{emg.emergencyCode}</span>
                        <span className="text-xs font-mono text-rose-400 font-bold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatSeconds(emg.elapsedSeconds)}</span>
                        </span>
                        {emg.assignedUnit && (
                          <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            Unidad: {emg.assignedUnit}
                          </span>
                        )}
                      </div>

                      <h4 className="text-base font-extrabold text-slate-100 dark:text-slate-100">
                        {emg.patientName} ({emg.species === 'canine' ? 'Canino' : 'Felino'}, {emg.weightKg} kg)
                      </h4>

                      <p className="text-xs text-rose-200 dark:text-rose-200 font-medium leading-relaxed">
                        {emg.clinicalNotes}
                      </p>

                      <div className="text-xs font-mono text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                        <span className="flex items-center space-x-1 text-slate-300">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />
                          <span>{emg.locationAddress}</span>
                        </span>
                        <span>Tutor: <strong className="text-slate-200">{emg.tutorName}</strong></span>
                        <span>Teléfono: <strong className="text-cyan-300">{emg.tutorPhoneE164}</strong></span>
                      </div>
                    </div>

                    {/* Acciones de Despacho 1-Clic & Puente WhatsApp E.164 */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">
                      {/* Botón WhatsApp E.164 */}
                      <a
                        href={getWhatsAppEmergencyUrl(emg.tutorPhoneE164, emg.patientName, emg.emergencyCode)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-h-[44px] px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow cursor-pointer"
                      >
                        <Phone className="w-4 h-4" />
                        <span>Puente WhatsApp (E.164)</span>
                      </a>

                      {/* Despacho en 1-Clic */}
                      {emg.status === 'queued' ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDispatchEmergency(emg.id, 'Ambulancia Alfa-1 (UCI Móvil)', 'Hospital Veterinario UCuenca 24/7')}
                            className="min-h-[44px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center space-x-1.5 shadow-lg cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Despachar Ambulancia Alfa-1</span>
                          </button>
                          <button
                            onClick={() => handleDispatchEmergency(emg.id, 'Pet Taxi Express #04', 'Clínica Veterinaria del Sur 24h')}
                            className="min-h-[44px] px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center space-x-1 cursor-pointer"
                          >
                            <Truck className="w-4 h-4" />
                            <span>Pet Taxi</span>
                          </button>
                        </div>
                      ) : (
                        <div className="p-2 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-center">
                          <div className="text-xs font-mono font-bold text-emerald-400">DESPACHADO EN RUTA</div>
                          <div className="text-[10px] text-slate-300 font-mono">Destino: {emg.assignedClinic}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* FORMULARIO DECLARATIVO WEBMCP (Agentic Dispatch) */}
          <div className={`p-6 rounded-3xl border ${panelBg}`}>
            <div className="flex items-center space-x-2 mb-3">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h3 className="text-base font-bold text-cyan-400">
                Formulario Declarativo WebMCP: Despacho de Unidades de Emergencia
              </h3>
            </div>
            <p className={`text-xs mb-4 ${textMuted}`}>
              Integración declarativa nativa con WebMCP. Compatible con ejecución humana o invocación automática por agentes IA.
            </p>

            <form
              toolname="pawlo_operator_dispatch_sos"
              tooldescription="Despacha unidad Pet Taxi o alerta SOS comunitaria"
              toolautosubmit="true"
              onSubmit={handleWebMCPDispatchSubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">
                    Caso de Emergencia
                  </label>
                  <select
                    name="emergencyId"
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${inputBg}`}
                  >
                    {emergencies.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.emergencyCode} - {e.patientName} ({e.severity === 'code_red_vital' ? 'ROJO' : 'AMARILLO'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">
                    Tipo de Despacho
                  </label>
                  <select
                    name="dispatchType"
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${inputBg}`}
                  >
                    <option value="Ambulancia UCI Veterinaria">Ambulancia UCI Veterinaria (Alfa-1)</option>
                    <option value="Ambulancia Básica">Ambulancia Soporte Básico (Alfa-2)</option>
                    <option value="Pet Taxi Asistido">Pet Taxi Asistido con Camilla</option>
                    <option value="Unidad Rescate Rápido">Unidad de Rescate Comunitario</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">
                    Clínica de Destino 24/7
                  </label>
                  <select
                    name="destinationClinic"
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${inputBg}`}
                  >
                    <option value="Hospital Veterinario UCuenca 24/7">Hospital Veterinario UCuenca 24/7</option>
                    <option value="Clínica Veterinaria del Sur 24 Horas">Clínica Veterinaria del Sur 24 Horas</option>
                    <option value="Animal Medical Center Ordóñez Lasso">Animal Medical Center Ordóñez Lasso</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">
                    Prioridad de Tráfico
                  </label>
                  <select
                    name="priority"
                    className={`w-full min-h-[44px] px-3.5 py-2 rounded-xl text-xs border focus:outline-none ${inputBg}`}
                  >
                    <option value="inmediata_codigo_rojo">Inmediata (Sirena + Baliza)</option>
                    <option value="urgente_alta">Urgente Alta</option>
                    <option value="prioritaria_estabilizada">Prioritaria Estabilizada</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono font-bold uppercase text-slate-400 mb-1">
                  Instrucciones Clínicas para la Tripulación y Triaje Telefónico
                </label>
                <textarea
                  name="operatorNotes"
                  rows={2}
                  defaultValue="Canalización venosa periférica prioritaria con Ringer Lactato al llegar. Notificar a quirófano del hospital docente."
                  className={`w-full p-3 rounded-xl text-xs border focus:outline-none ${inputBg}`}
                ></textarea>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                <div className="text-[11px] font-mono text-slate-400">
                  Tool WebMCP: <code className="text-cyan-400">pawlo_operator_dispatch_sos</code> • autosubmit habilitado
                </div>
                <button
                  type="submit"
                  className="min-h-[44px] px-6 py-2.5 rounded-xl btn-primary-2026 text-xs font-bold flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>Ejecutar Despacho Agéntico WebMCP</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffAdminPortals;
