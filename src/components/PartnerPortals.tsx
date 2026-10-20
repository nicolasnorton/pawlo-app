import React, { useState, useMemo, useEffect } from 'react';
import { loadLocalState, saveLocalState, subscribeLocalState } from '../services/localStore';
import {
  Stethoscope, Store, Truck, ShieldCheck, CheckCircle2, Clock, AlertTriangle,
  Search, Plus, Package, Car, Sparkles, Send, MessageSquare, Calendar,
  ChevronRight, RefreshCw, Filter, Tag, Eye, Heart, Camera, Check, X,
  Pill, BadgeCheck, DollarSign, ArrowUpRight, FileCheck, PhoneCall,
  Building2, MapPin, QrCode, Sliders, Activity, UserCheck
} from 'lucide-react';
import {
  UserPet,
  StoreProduct,
  PetServiceItem,
  ClinicalEntry,
  VaccineRecord
} from '../data/pawloData';

export interface PartnerPortalsProps {
  activeRole: 'veterinario' | 'comercio' | 'servicio';
  onSelectRole: (role: 'veterinario' | 'comercio' | 'servicio') => void;
  pets: UserPet[];
  products: StoreProduct[];
  services: PetServiceItem[];
  cityName: string;
  currency: string;
  paymentRail: string;
  theme: 'dark' | 'light';
}

// Interfaces internas para el estado de los portales B2B
export interface IssuedPrescription {
  id: string; // RX-PWL-2026-XXXXX
  petId: string;
  petName: string;
  microchipIso: string;
  species: 'canine' | 'feline';
  breed: string;
  tutorName: string;
  diagnosis: string;
  medication: string;
  dosage: string;
  durationDays: number;
  instructions: string;
  issuedAt: string;
  validUntil: string;
  vetName: string;
  vetLicense: string;
  clinic: string;
  status: 'activa' | 'dispensada' | 'vencida';
  signatureHash: string;
}

export interface ClinicalAppointment {
  id: string;
  time: string;
  patientName: string;
  patientSpecies: 'canine' | 'feline';
  breed: string;
  microchipIso: string;
  reason: string;
  urgency: boolean;
  status: 'en_espera' | 'en_atencion' | 'completado' | 'derivado';
  tutorName: string;
  tutorPhone: string;
}

export interface StoreOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  petName: string;
  petSpecies: 'canine' | 'feline';
  microchipIso: string;
  items: Array<{
    title: string;
    qty: number;
    price: number;
    requiresPrescription: boolean;
  }>;
  totalAmount: number;
  paymentMethod: string;
  prescriptionCode?: string;
  prescriptionStatus?: 'no_requiere' | 'pendiente_validacion' | 'aprobada' | 'rechazada';
  vetPrescriber?: string;
  orderStatus: 'validando_receta' | 'preparando' | 'en_motorizado' | 'entregado';
  motorizedDriver?: string;
  createdAt: string;
}

export interface ServiceBookingItem {
  id: string;
  serviceCategory: 'Transporte' | 'Hospedaje' | 'Grooming' | 'Etología';
  serviceTitle: string;
  provider: string;
  petName: string;
  petBreed: string;
  petWeightKg: number;
  microchipIso: string;
  tutorName: string;
  tutorPhone: string;
  scheduledTime: string;
  locationDetails: string;
  specialNotes: string;
  status: 'confirmado' | 'en_atencion' | 'completado';
  assignedOperator: string;
  activeLogCount: number;
}

export interface WelfareReportLog {
  id: string;
  bookingId: string;
  petName: string;
  timestamp: string;
  reportType: 'Ubicación GPS en Ruta' | 'Alimentación & Hidratación' | 'Bienestar & Recreo' | 'Incidencia Médica';
  mood: 'Relajado y Feliz' | 'Enérgico y Jugando' | 'Tranquilo / Descansando' | 'Alerta y Curioso';
  message: string;
  photoUrl: string;
  verifiedBy: string;
}

export const PartnerPortals: React.FC<PartnerPortalsProps> = ({
  activeRole,
  onSelectRole,
  pets,
  products,
  services,
  cityName,
  currency,
  paymentRail,
  theme
}) => {
  // ==========================================
  // ESTADO: PORTAL VETERINARIO
  // ==========================================
  const [selectedPetId, setSelectedPetId] = useState<string>(pets[0]?.id || 'pet-bruno');
  const [searchChipQuery, setSearchChipQuery] = useState<string>('');
  const [localPetsState, setLocalPetsState] = useState<UserPet[]>(pets);

  const activePet = useMemo(() => {
    return localPetsState.find(p => p.id === selectedPetId) || localPetsState[0];
  }, [localPetsState, selectedPetId]);

  // Recetas emitidas
  const [issuedPrescriptions, setIssuedPrescriptions] = useState<IssuedPrescription[]>([
    {
      id: 'RX-PWL-84920-BRU',
      petId: 'pet-bruno',
      petName: 'Bruno',
      microchipIso: '981098104592831',
      species: 'canine',
      breed: 'Golden Retriever',
      tutorName: 'Nicolás Norton',
      diagnosis: 'Dermatitis alérgica atópica por hipersensibilidad a pulgas / DAPP estacional',
      medication: 'Tratamiento Dermatológico Antialérgico (Apoquel 16mg)',
      dosage: '1 comprimido vía oral cada 24 horas por 14 días con comida matutina',
      durationDays: 14,
      instructions: 'Evitar alimentos con harina de ave. Mantener dieta de salmón e hidratación.',
      issuedAt: '20 Oct 2026 09:15',
      validUntil: '19 Nov 2026',
      vetName: 'Dr. Esteban Cordero',
      vetLicense: 'SENESCYT 1049-VET',
      clinic: 'Hospital Veterinario El Paraíso',
      status: 'activa',
      signatureHash: '0x8f3c7e4a19b25d88f01c94e82b71d93aa52bce81'
    },
    {
      id: 'RX-PWL-21049-MIA',
      petId: 'pet-mia',
      petName: 'Mía',
      microchipIso: '981098108843120',
      species: 'feline',
      breed: 'Siamés Moderno Seal Point',
      tutorName: 'Nicolás Norton',
      diagnosis: 'Control preventivo urinario / FUS en remisión',
      medication: 'Suplemento Urinario Feline D-Manosa + Glucosamina Oral',
      dosage: '0.5 ml vía oral cada 12 horas por 20 días',
      durationDays: 20,
      instructions: 'Estimular consumo de agua en fuente filtrada y racionar en tomas pequeñas.',
      issuedAt: '18 Oct 2026 14:30',
      validUntil: '17 Nov 2026',
      vetName: 'Dra. Camila Vélez',
      vetLicense: 'SENESCYT 2104-VET',
      clinic: 'Cat Clinic Especialidades Felinas',
      status: 'dispensada',
      signatureHash: '0x3a71f009b8d21c33a9217ef00192ccaa45698011'
    }
  ]);

  // Receta recién emitida para modal/alerta de éxito
  const [latestIssuedRx, setLatestIssuedRx] = useState<IssuedPrescription | null>(null);

  // Formulario de emisión de receta
  const [rxForm, setRxForm] = useState({
    petId: activePet.id,
    diagnosis: 'Dermatitis alérgica atópica / Control de Prurito',
    medication: 'Tratamiento Dermatológico Antialérgico (Apoquel 16mg)',
    dosage: '1 comprimido cada 24 horas por 14 días',
    durationDays: 14,
    instructions: 'Administrar con el alimento. Válido en Farmacia PAWLO Cuenca y motorizado express.',
    vetName: 'Dr. Esteban Cordero',
    vetLicense: 'SENESCYT 1049-VET'
  });

  // Formulario de nueva consulta / vacuna
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [entryForm, setEntryForm] = useState({
    type: 'Consulta General' as ClinicalEntry['type'],
    title: 'Control Clínico Periódico',
    diagnosis: 'Paciente en condición corporal óptima 5/9. Mucosas normocoloreadas.',
    treatment: 'Continuar profilaxis antiparasitaria y control de dieta hidrolizada.',
    weightKg: activePet.weightKg.toString(),
    tempC: '38.4',
    clinic: 'Hospital Veterinario El Paraíso',
    vetName: 'Dr. Esteban Cordero'
  });

  // Agenda de citas veterinarias
  const [appointments, setAppointments] = useState<ClinicalAppointment[]>([
    {
      id: 'apt-01',
      time: '09:30 AM',
      patientName: 'Bruno',
      patientSpecies: 'canine',
      breed: 'Golden Retriever',
      microchipIso: '981098104592831',
      reason: 'Revisión Dermatológica & Refuerzo Vacunal',
      urgency: false,
      status: 'en_atencion',
      tutorName: 'Nicolás Norton',
      tutorPhone: '0998408369'
    },
    {
      id: 'apt-02',
      time: '11:15 AM',
      patientName: 'Mía',
      patientSpecies: 'feline',
      breed: 'Siamés Seal Point',
      microchipIso: '981098108843120',
      reason: 'Monitoreo Renal & Ecografía Vesical',
      urgency: false,
      status: 'en_espera',
      tutorName: 'Nicolás Norton',
      tutorPhone: '0998408369'
    },
    {
      id: 'apt-03',
      time: '14:00 PM',
      patientName: 'Rocky',
      patientSpecies: 'canine',
      breed: 'Pastor Alemán',
      microchipIso: '981098107712399',
      reason: 'Vacunación Séxtuple Refuerzo Anual',
      urgency: false,
      status: 'en_espera',
      tutorName: 'Mateo Vázquez',
      tutorPhone: '0987123456'
    },
    {
      id: 'apt-04',
      time: '16:30 PM',
      patientName: 'Luna',
      patientSpecies: 'canine',
      breed: 'Border Collie',
      microchipIso: '981098103348122',
      reason: 'Urgencia Traumatología: Cojera súbita en miembro posterior',
      urgency: true,
      status: 'en_espera',
      tutorName: 'Camila Ríos',
      tutorPhone: '0991238877'
    }
  ]);

  // ==========================================
  // ESTADO: PORTAL COMERCIO & FARMACIA
  // ==========================================
  const [localCatalog, setLocalCatalog] = useState<StoreProduct[]>(products);
  const [catalogCategory, setCatalogCategory] = useState<string>('Todos');
  const [searchCatalogQuery, setSearchCatalogQuery] = useState<string>('');
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);

  // Formulario nuevo producto comercio
  const [newProductForm, setNewProductForm] = useState({
    sku: 'MED-BRV-2040',
    title: 'Bravecto Antiparasitario Canino Masticable (20 a 40 kg)',
    brand: 'MSD Animal Health',
    category: 'Medicamentos' as StoreProduct['category'],
    species: 'canine' as StoreProduct['species'],
    price: 36.50,
    requiresPrescription: false,
    badge: 'Protección 12 Semanas',
    idealFor: 'Perros Grandes (20-40 kg)',
    stockStatus: 'Disponible • Entrega Hoy',
    description: 'Fluralaner de acción sistémica contra garrapatas y pulgas con eficacia sostenida por 3 meses completos.'
  });

  // Pedidos del comercio con persistencia local y sincronización en tiempo real
  const [storeOrders, setStoreOrders] = useState<StoreOrder[]>(() =>
    loadLocalState<StoreOrder[]>('pawlo_store_orders', [
      {
        id: 'PWL-9041',
        customerName: 'Nicolás Norton',
        customerPhone: '0998408369',
        deliveryAddress: 'Sector El Vergel, Calle Larga y Doce de Abril',
        petName: 'Bruno',
        petSpecies: 'canine',
        microchipIso: '981098104592831',
        items: [
          {
            title: 'Tratamiento Dermatológico Antialérgico (Apoquel 16mg)',
            qty: 1,
            price: 48.00,
            requiresPrescription: true
          },
          {
            title: 'Alimento Super Premium Salmón & Arroz (15 kg)',
            qty: 1,
            price: 78.50,
            requiresPrescription: false
          }
        ],
        totalAmount: 126.50,
        paymentMethod: 'Pago QR Instantáneo (DeUna / Sipy / Peigo)',
        prescriptionCode: 'RX-PWL-84920-BRU',
        prescriptionStatus: 'pendiente_validacion',
        vetPrescriber: 'Dr. Esteban Cordero (Reg. 1049)',
        orderStatus: 'validando_receta',
        motorizedDriver: 'Carlos M. (Moto #08)',
        createdAt: 'Hace 12 min'
      },
      {
        id: 'PWL-9038',
        customerName: 'Sofía Andrade',
        customerPhone: '0981122334',
        deliveryAddress: 'Av. Remigio Crespo y Lorenzo Piedra',
        petName: 'Mía',
        petSpecies: 'feline',
        microchipIso: '981098108843120',
        items: [
          {
            title: 'Fórmula Felina Urinary Care & Hairball Control (4 kg)',
            qty: 2,
            price: 42.00,
            requiresPrescription: false
          }
        ],
        totalAmount: 84.00,
        paymentMethod: 'Transferencia Bancaria Directa',
        prescriptionStatus: 'no_requiere',
        orderStatus: 'en_motorizado',
        motorizedDriver: 'Juan P. (Moto #03)',
        createdAt: 'Hace 38 min'
      },
      {
        id: 'PWL-9035',
        customerName: 'Mateo Vázquez',
        customerPhone: '0987123456',
        deliveryAddress: 'Puertas del Sol, Edificio Los Sauces',
        petName: 'Rocky',
        petSpecies: 'canine',
        microchipIso: '981098107712399',
        items: [
          {
            title: 'Antiparasitario Total NexGard Spectra (15-30kg)',
            qty: 1,
            price: 54.00,
            requiresPrescription: false
          },
          {
            title: 'Dispensador KONG Caucho XL + Alfombra Olfativa',
            qty: 1,
            price: 26.50,
            requiresPrescription: false
          }
        ],
        totalAmount: 80.50,
        paymentMethod: 'Payphone (Tarjeta Crédito / Débito)',
        prescriptionStatus: 'no_requiere',
        orderStatus: 'entregado',
        motorizedDriver: 'David T. (Moto #05)',
        createdAt: 'Hace 2 horas'
      }
    ])
  );

  useEffect(() => {
    saveLocalState('pawlo_store_orders', storeOrders);
  }, [storeOrders]);

  useEffect(() => {
    return subscribeLocalState<StoreOrder[]>('pawlo_store_orders', (updated) => {
      if (Array.isArray(updated)) {
        setStoreOrders(updated);
      }
    });
  }, []);

  const [orderFilter, setOrderFilter] = useState<'todos' | 'validando_receta' | 'en_motorizado' | 'entregado'>('todos');

  // ==========================================
  // ESTADO: PORTAL SERVICIO & OPERACIONES CON PERSISTENCIA
  // ==========================================
  const [serviceBookings, setServiceBookings] = useState<ServiceBookingItem[]>(() =>
    loadLocalState<ServiceBookingItem[]>('pawlo_service_bookings', [
      {
        id: 'srv-bk-01',
        serviceCategory: 'Transporte',
        serviceTitle: 'PAWLO Pet Taxi — Traslado Climatizado con GPS en Vivo',
        provider: 'PAWLO Mobility Fleet',
        petName: 'Bruno',
        petBreed: 'Golden Retriever',
        petWeightKg: 29.4,
        microchipIso: '981098104592831',
        tutorName: 'Nicolás Norton',
        tutorPhone: '0998408369',
        scheduledTime: 'Hoy 10:15 AM (En trayecto)',
        locationDetails: 'Origen: Calle Larga 4-12 -> Destino: Hospital Veterinario El Paraíso',
        specialNotes: 'Arnés ISOFIX talla XL. Prohibido darle snacks con pollo por alergia severa DAPP.',
        status: 'en_atencion',
        assignedOperator: 'Conductor Ricardo Mora (Furgoneta PAWLO Móvil #04)',
        activeLogCount: 3
      },
      {
        id: 'srv-bk-02',
        serviceCategory: 'Hospedaje',
        serviceTitle: 'Hospedaje Boutique Libre de Jaulas — Suite Campestre',
        provider: 'Valle Verde Pet Resort & Suites',
        petName: 'Bruno',
        petBreed: 'Golden Retriever',
        petWeightKg: 29.4,
        microchipIso: '981098104592831',
        tutorName: 'Nicolás Norton',
        tutorPhone: '0998408369',
        scheduledTime: 'Check-in: 24 Oct — Check-out: 27 Oct',
        locationDetails: 'Valle Verde Resort, Sector Challuabamba / Km 7',
        specialNotes: 'Dieta de salmón 190g mañana / 190g noche + 1 cápsula Omega 3. Música relajante en tormentas.',
        status: 'confirmado',
        assignedOperator: 'Dra. Andrea Morales (Coordinadora de Bienestar)',
        activeLogCount: 1
      },
      {
        id: 'srv-bk-03',
        serviceCategory: 'Grooming',
        serviceTitle: 'Full Grooming Dermocosmético & Baño de Ozono Móvil',
        provider: 'Tomebamba Pet Spa Studio',
        petName: 'Mía',
        petBreed: 'Siamés Seal Point',
        petWeightKg: 4.1,
        microchipIso: '981098108843120',
        tutorName: 'Nicolás Norton',
        tutorPhone: '0998408369',
        scheduledTime: 'Mañana 15:00 PM (En Domicilio)',
        locationDetails: 'Furgoneta Móvil frente a Edificio El Vergel, Calle Larga',
        specialNotes: 'Manejo suave sin jaulas ni turbina ruidosa. Shampoo hipoalergénico pH neutro.',
        status: 'confirmado',
        assignedOperator: 'Estilista Mayra Guamán (EcoVan #02)',
        activeLogCount: 0
      },
      {
        id: 'srv-bk-04',
        serviceCategory: 'Etología',
        serviceTitle: 'Etología Clínica & Modificación Conductual',
        provider: 'K9 Behavior & Mind Lab',
        petName: 'Rocky',
        petBreed: 'Pastor Alemán',
        petWeightKg: 32.0,
        microchipIso: '981098107712399',
        tutorName: 'Mateo Vázquez',
        tutorPhone: '0987123456',
        scheduledTime: 'Hoy 16:00 PM',
        locationDetails: 'Parque Lineal Tomebamba / Domicilio',
        specialNotes: 'Desensibilización sonora ante pirotecnia y reactividad con perros desconocidos.',
        status: 'confirmado',
        assignedOperator: 'Etólogo Lic. Gabriel Vega',
        activeLogCount: 2
      }
    ])
  );

  useEffect(() => {
    saveLocalState('pawlo_service_bookings', serviceBookings);
  }, [serviceBookings]);

  // Bitácora de reportes de bienestar en tiempo real
  const [welfareReports, setWelfareReports] = useState<WelfareReportLog[]>([
    {
      id: 'rep-01',
      bookingId: 'srv-bk-01',
      petName: 'Bruno',
      timestamp: '10:18 AM',
      reportType: 'Ubicación GPS en Ruta',
      mood: 'Tranquilo / Descansando',
      message: 'Bruno viaja seguro en el vehículo climatizado PAWLO Móvil #04 con su arnés ISOFIX. Todo en orden cruzando Av. Solano hacia El Paraíso.',
      photoUrl: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80',
      verifiedBy: 'Ricardo Mora (Conductor Certificado)'
    },
    {
      id: 'rep-02',
      bookingId: 'srv-bk-02',
      petName: 'Bruno',
      timestamp: 'Ayer 18:30 PM',
      reportType: 'Alimentación & Hidratación',
      mood: 'Relajado y Feliz',
      message: 'Bruno terminó con apetito excelente su ración de 190g de salmón e ingirió su cápsula de Omega 3. Hidratación normal y paseo por los jardines completado.',
      photoUrl: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80',
      verifiedBy: 'Dra. Andrea Morales'
    }
  ]);

  // Formulario nuevo reporte de servicio
  const [reportForm, setReportForm] = useState({
    bookingId: 'srv-bk-01',
    reportType: 'Bienestar & Recreo' as WelfareReportLog['reportType'],
    mood: 'Relajado y Feliz' as WelfareReportLog['mood'],
    message: 'Bruno disfrutó de 25 minutos de paseo olfativo y estimulación mental. Se encuentra muy tranquilo y sociable.',
    photoUrl: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80'
  });
  const [reportSuccessNotice, setReportSuccessNotice] = useState<string | null>(null);

  // ==========================================
  // HANDLERS: VETERINARIO
  // ==========================================
  const handleSelectPatientByChipOrName = (term: string) => {
    setSearchChipQuery(term);
    const clean = term.toLowerCase().trim();
    const found = localPetsState.find(
      p => p.microchipIso.includes(clean) || p.name.toLowerCase().includes(clean)
    );
    if (found) {
      setSelectedPetId(found.id);
      setRxForm(prev => ({
        ...prev,
        petId: found.id
      }));
    }
  };

  const handleIssuePrescription = (e: React.FormEvent) => {
    e.preventDefault();
    const targetPet = localPetsState.find(p => p.id === rxForm.petId) || activePet;
    const randomHex = Math.random().toString(16).substring(2, 8).toUpperCase();
    const generatedRxId = `RX-PWL-${randomHex}-${targetPet.name.substring(0, 3).toUpperCase()}`;
    const hash = '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

    const newPrescription: IssuedPrescription = {
      id: generatedRxId,
      petId: targetPet.id,
      petName: targetPet.name,
      microchipIso: targetPet.microchipIso,
      species: targetPet.species,
      breed: targetPet.breed,
      tutorName: 'Nicolás Norton (Tutor Registrado)',
      diagnosis: rxForm.diagnosis,
      medication: rxForm.medication,
      dosage: rxForm.dosage,
      durationDays: Number(rxForm.durationDays) || 14,
      instructions: rxForm.instructions,
      issuedAt: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
      vetName: rxForm.vetName,
      vetLicense: rxForm.vetLicense,
      clinic: 'Hospital Veterinario El Paraíso',
      status: 'activa',
      signatureHash: hash
    };

    setIssuedPrescriptions([newPrescription, ...issuedPrescriptions]);
    setLatestIssuedRx(newPrescription);

    // Si coincide con orden de comercio pendiente, actualizarla
    setStoreOrders(prev => prev.map(ord => {
      if (ord.petName.toLowerCase() === targetPet.name.toLowerCase() && ord.prescriptionStatus === 'pendiente_validacion') {
        return {
          ...ord,
          prescriptionCode: generatedRxId,
          prescriptionStatus: 'aprobada',
          orderStatus: 'en_motorizado'
        };
      }
      return ord;
    }));
  };

  const handleAddNewClinicalEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newEntry: ClinicalEntry = {
      id: `clin-${Date.now()}`,
      date: new Date().toLocaleDateString('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }),
      type: entryForm.type,
      title: entryForm.title,
      diagnosis: entryForm.diagnosis,
      treatment: entryForm.treatment,
      weightKg: parseFloat(entryForm.weightKg) || activePet.weightKg,
      tempC: parseFloat(entryForm.tempC) || 38.5,
      clinic: entryForm.clinic,
      vetName: entryForm.vetName
    };

    setLocalPetsState(prev => prev.map(pet => {
      if (pet.id === activePet.id) {
        return {
          ...pet,
          weightKg: parseFloat(entryForm.weightKg) || pet.weightKg,
          clinicalHistory: [newEntry, ...pet.clinicalHistory]
        };
      }
      return pet;
    }));

    setIsNewEntryOpen(false);
  };

  const handleUpdateAppointmentStatus = (
    id: string,
    newStatus: ClinicalAppointment['status']
  ) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: newStatus } : a)));
  };

  // ==========================================
  // HANDLERS: COMERCIO & INVENTARIO
  // ==========================================
  const handleToggleProductStock = (productId: string) => {
    setLocalCatalog(prev => prev.map(p => {
      if (p.id === productId) {
        const isCurrentlyAvailable = p.stock.includes('Disponible') || p.stock.includes('En Stock');
        return {
          ...p,
          stock: isCurrentlyAvailable ? 'Agotado Temporalmente' : 'Disponible • Entrega Inmediata'
        };
      }
      return p;
    }));
  };

  const handleAdjustPrice = (productId: string, delta: number) => {
    setLocalCatalog(prev => prev.map(p => {
      if (p.id === productId) {
        const newPrice = Math.max(1, parseFloat((p.price + delta).toFixed(2)));
        return { ...p, price: newPrice };
      }
      return p;
    }));
  };

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const newProd: StoreProduct = {
      id: `prd-${Date.now()}`,
      sku: newProductForm.sku,
      title: newProductForm.title,
      brand: newProductForm.brand,
      category: newProductForm.category,
      species: newProductForm.species,
      price: Number(newProductForm.price) || 25,
      requiresPrescription: newProductForm.requiresPrescription,
      badge: newProductForm.badge,
      idealFor: newProductForm.idealFor,
      rating: '5.00',
      reviews: 1,
      stock: newProductForm.stockStatus,
      description: newProductForm.description,
      photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
    };

    setLocalCatalog([newProd, ...localCatalog]);
    setIsAddProductOpen(false);
  };

  const handleValidateOrderPrescription = (orderId: string) => {
    setStoreOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        return {
          ...order,
          prescriptionStatus: 'aprobada',
          orderStatus: 'en_motorizado'
        };
      }
      return order;
    }));
  };

  const handleAdvanceOrderStatus = (orderId: string) => {
    setStoreOrders(prev => prev.map(order => {
      if (order.id === orderId) {
        if (order.orderStatus === 'validando_receta') return { ...order, orderStatus: 'en_motorizado' };
        if (order.orderStatus === 'en_motorizado') return { ...order, orderStatus: 'entregado' };
      }
      return order;
    }));
  };

  // ==========================================
  // HANDLERS: SERVICIOS
  // ==========================================
  const handleAdvanceBookingStatus = (bookingId: string) => {
    setServiceBookings(prev => prev.map(bk => {
      if (bk.id === bookingId) {
        if (bk.status === 'confirmado') return { ...bk, status: 'en_atencion' };
        if (bk.status === 'en_atencion') return { ...bk, status: 'completado' };
      }
      return bk;
    }));
  };

  const handleSendServiceReport = (e: React.FormEvent) => {
    e.preventDefault();
    const targetBooking = serviceBookings.find(b => b.id === reportForm.bookingId) || serviceBookings[0];

    const newReport: WelfareReportLog = {
      id: `rep-${Date.now()}`,
      bookingId: targetBooking.id,
      petName: targetBooking.petName,
      timestamp: new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' }),
      reportType: reportForm.reportType,
      mood: reportForm.mood,
      message: reportForm.message,
      photoUrl: reportForm.photoUrl,
      verifiedBy: targetBooking.assignedOperator
    };

    setWelfareReports([newReport, ...welfareReports]);
    setServiceBookings(prev => prev.map(b => b.id === targetBooking.id ? { ...b, activeLogCount: b.activeLogCount + 1 } : b));
    setReportSuccessNotice(`¡Reporte de bienestar para ${targetBooking.petName} enviado al carnet digital del tutor con éxito!`);
    setTimeout(() => setReportSuccessNotice(null), 5000);
  };

  // Filtrado de catálogo de comercio
  const filteredCatalog = localCatalog.filter(p => {
    const matchesCat = catalogCategory === 'Todos' || p.category === catalogCategory;
    const q = searchCatalogQuery.toLowerCase().trim();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    return matchesCat && matchesQuery;
  });

  // Filtrado de pedidos de comercio
  const filteredOrders = storeOrders.filter(o => {
    if (orderFilter === 'validando_receta') return o.orderStatus === 'validando_receta';
    if (orderFilter === 'en_motorizado') return o.orderStatus === 'en_motorizado';
    if (orderFilter === 'entregado') return o.orderStatus === 'entregado';
    return true;
  });

  return (
    <div className="w-full min-h-screen pb-24 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* ======================================================== */}
      {/* BARRA SUPERIOR: SELECTOR DE ROL DE PARTNER & CONTEXTO     */}
      {/* ======================================================== */}
      <div className="sticky top-0 z-30 bg-white/90 dark:bg-slate-950/90 backdrop-blur-md border-b border-slate-200 dark:border-white/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00F5A0] border border-emerald-500/30">
                  PAWLO™ B2B PARTNERS
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {cityName} • Hub Operativo v2026.1
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 dark:text-white mt-0.5">
                Consola Profesional de Aliados
              </h2>
            </div>

            {/* Selector de Rol Profesional */}
            <div className="inline-flex p-1 rounded-2xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-white/10 shadow-inner">
              <button
                type="button"
                onClick={() => onSelectRole('veterinario')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeRole === 'veterinario'
                    ? 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-[#00F5A0] shadow-md border border-emerald-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Stethoscope className="w-4 h-4" />
                <span>Clínica Vet</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRole('comercio')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeRole === 'comercio'
                    ? 'bg-white dark:bg-slate-800 text-sky-700 dark:text-[#00D9F5] shadow-md border border-sky-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Pet Shop & Rx</span>
              </button>

              <button
                type="button"
                onClick={() => onSelectRole('servicio')}
                className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  activeRole === 'servicio'
                    ? 'bg-white dark:bg-slate-800 text-indigo-700 dark:text-indigo-400 shadow-md border border-indigo-500/30'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Truck className="w-4 h-4" />
                <span>Flota & Servicios</span>
              </button>
            </div>
          </div>

          {/* Credencial del Aliado activo */}
          <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
            <div className="flex items-center space-x-2">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              {activeRole === 'veterinario' && (
                <span>Aliado Médico: <strong>Hospital Veterinario El Paraíso</strong> (Dr. Esteban Cordero — Reg. 1049-VET)</span>
              )}
              {activeRole === 'comercio' && (
                <span>Comercio Oficial: <strong>PAWLO Pet Shop & Farmacia Central</strong> (RUC 0190458291001)</span>
              )}
              {activeRole === 'servicio' && (
                <span>Operador Logístico: <strong>PAWLO Mobility & Resort Operations</strong> (Red Urbana {cityName})</span>
              )}
            </div>
            <div className="flex items-center space-x-3 font-mono">
              <span className="flex items-center space-x-1 text-emerald-700 dark:text-[#00F5A0]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>WebMCP Declarativo Activo</span>
              </span>
              <span>•</span>
              <span>{paymentRail}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* ======================================================== */}
        {/* 1. PORTAL VETERINARIO: CLÍNICA, EXPEDIENTE & RECETARIO   */}
        {/* ======================================================== */}
        {activeRole === 'veterinario' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Panel Superior: Buscador Biométrico de Microchip ISO 11784/11785 */}
            <div className="glass-panel rounded-3xl p-6 relative overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="badge-emerald px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center space-x-1">
                      <QrCode className="w-3.5 h-3.5" />
                      <span>LECTOR BIOMÉTRICO ISO 11784 / 11785</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono">134.2 kHz FDX-B Compatible</span>
                  </div>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">
                    Buscador de Pacientes & Historial Clínico
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
                    Escanea o ingresa el chip transpondedor RFID de 15 dígitos o selecciona un paciente registrado para auditar antecedentes.
                  </p>
                </div>

                {/* Acceso Rápido a Bruno y Mía */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pacientes Frecuentes:</span>
                  {localPetsState.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setSelectedPetId(p.id);
                        setRxForm(prev => ({ ...prev, petId: p.id }));
                      }}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                        selectedPetId === p.id
                          ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/10 hover:border-emerald-500/40'
                      }`}
                    >
                      <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                      <span>{p.name}</span>
                      <span className="font-mono text-[10px] opacity-75">({p.species === 'canine' ? 'Canino' : 'Felino'})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input de Búsqueda Biométrico */}
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchChipQuery}
                    onChange={(e) => handleSelectPatientByChipOrName(e.target.value)}
                    placeholder="Ingresa número de Microchip ISO de 15 dígitos (Ej. 981098104592831) o nombre del paciente..."
                    className="w-full glass-input rounded-2xl pl-11 pr-4 py-3 text-sm font-mono tracking-wider focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleSelectPatientByChipOrName(activePet.microchipIso)}
                  className="btn-primary-2026 px-6 py-3 text-sm font-bold inline-flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <Activity className="w-4 h-4" />
                  <span>Validar Transpondedor</span>
                </button>
              </div>

              {/* Ficha Clínica Activa del Paciente Seleccionado */}
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-white/10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Columna 1: Datos Biométricos & Alergias */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <img
                      src={activePet.avatar}
                      alt={activePet.name}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                    />
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xl font-black text-slate-950 dark:text-white">{activePet.name}</h4>
                        <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {activePet.gender}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{activePet.breed}</p>
                      <p className="text-xs font-mono text-emerald-700 dark:text-[#00F5A0] mt-0.5">
                        ISO Chip: {activePet.microchipIso}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Peso Actual</span>
                      <span className="font-extrabold text-sm">{activePet.weightKg} kg</span>
                      <span className="text-[10px] text-slate-400 block">Objetivo: {activePet.targetWeightKg} kg</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/5">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Grupo Sanguíneo</span>
                      <span className="font-bold text-xs">{activePet.bloodType}</span>
                      <span className="text-[10px] text-slate-400 block">{activePet.isSterilized ? 'Esterilizado' : 'Entero'}</span>
                    </div>
                  </div>

                  {/* Alerta Médica de Alergias Críticas */}
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                    <div className="flex items-center space-x-1.5 font-bold text-xs mb-1">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>Alergias & Contraindicaciones Clínicas</span>
                    </div>
                    <ul className="text-xs space-y-1 pl-4 list-disc font-medium">
                      {activePet.allergies.map((al, idx) => (
                        <li key={idx} className="text-amber-800 dark:text-amber-300 font-semibold">{al}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Columna 2: Carnet de Vacunación Oficial */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <span>Carnet Vacunal Activo ({activePet.vaccines.length})</span>
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 dark:text-[#00F5A0]">Sincronizado</span>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activePet.vaccines.map(vac => (
                      <div
                        key={vac.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{vac.name}</p>
                          <p className="text-[10px] font-mono text-slate-500">Lote: {vac.batch} • {vac.clinic}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            vac.status === 'vigente'
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-[#00F5A0] border border-emerald-500/30'
                              : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                          }`}>
                            {vac.status === 'vigente' ? 'Vigente' : 'Próximo Refuerzo'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Vence: {vac.nextDueDate}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Columna 3: Historial Clínico Reciente & Registro Rápido */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center space-x-1">
                      <FileCheck className="w-4 h-4 text-indigo-500" />
                      <span>Historial Clínico ({activePet.clinicalHistory.length})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsNewEntryOpen(!isNewEntryOpen)}
                      className="text-xs font-bold text-emerald-700 dark:text-[#00F5A0] hover:underline inline-flex items-center space-x-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Añadir Consulta</span>
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {activePet.clinicalHistory.map(entry => (
                      <div
                        key={entry.id}
                        className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/70 border border-slate-200 dark:border-white/5 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white">{entry.title}</span>
                          <span className="text-[10px] font-mono text-slate-400">{entry.date}</span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2">
                          <strong>Dx:</strong> {entry.diagnosis}
                        </p>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-white/5">
                          <span>{entry.vetName}</span>
                          <span>{entry.weightKg} kg • {entry.tempC}°C</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Formulario Desplegable: Registro de Nueva Consulta / Vacuna */}
              {isNewEntryOpen && (
                <div className="mt-6 p-4 sm:p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/30 animate-fadeIn">
                  <div className="flex items-center justify-between mb-4">
                    <h5 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center space-x-2">
                      <Stethoscope className="w-5 h-5 text-emerald-600 dark:text-[#00F5A0]" />
                      <span>Registrar Nueva Entrada Médica en Carnet Digital</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsNewEntryOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleAddNewClinicalEntry} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">Tipo de Atención</label>
                        <select
                          value={entryForm.type}
                          onChange={e => setEntryForm({ ...entryForm, type: e.target.value as any })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="Consulta General">Consulta General</option>
                          <option value="Odontología">Odontología</option>
                          <option value="Laboratorio">Laboratorio / Exámenes</option>
                          <option value="Control Peso">Control de Peso</option>
                          <option value="Cirugía">Cirugía / Procedimiento</option>
                          <option value="Urgencia">Atención de Urgencia</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">Título de la Consulta</label>
                        <input
                          type="text"
                          required
                          value={entryForm.title}
                          onChange={e => setEntryForm({ ...entryForm, title: e.target.value })}
                          placeholder="Ej. Chequeo preventivo semestral"
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-bold mb-1">Peso (kg)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={entryForm.weightKg}
                            onChange={e => setEntryForm({ ...entryForm, weightKg: e.target.value })}
                            className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold mb-1">Temp (°C)</label>
                          <input
                            type="number"
                            step="0.1"
                            value={entryForm.tempC}
                            onChange={e => setEntryForm({ ...entryForm, tempC: e.target.value })}
                            className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">Diagnóstico Clínico</label>
                        <textarea
                          rows={2}
                          required
                          value={entryForm.diagnosis}
                          onChange={e => setEntryForm({ ...entryForm, diagnosis: e.target.value })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                          placeholder="Hallazgos del examen físico..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold mb-1">Tratamiento & Indicaciones</label>
                        <textarea
                          rows={2}
                          required
                          value={entryForm.treatment}
                          onChange={e => setEntryForm({ ...entryForm, treatment: e.target.value })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                          placeholder="Fórmula médica o pautas recomendadas..."
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsNewEntryOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-primary-2026 px-5 py-2 text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Sellar y Guardar en Bóveda PAWLO</span>
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>

            {/* Fila Dividida: Emisor de Recetas Electrónicas WebMCP & Agenda de Citas */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Emisor de Receta Médica Electrónica Firmada (WebMCP Declarativo) */}
              <div className="lg:col-span-7 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="badge-sky px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1">
                        <Pill className="w-3.5 h-3.5" />
                        <span>FARMACIA CLÍNICA DIGITAL</span>
                      </span>
                      <span className="text-xs text-slate-500 font-mono">SENESCYT Firmado</span>
                    </div>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white mt-1">
                      Emisor de Receta Médica Veterinaria
                    </h3>
                  </div>
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 text-sky-600 dark:text-[#00D9F5] flex items-center justify-center border border-sky-500/20">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Emite prescripciones digitales vinculadas criptográficamente al microchip ISO del paciente. Habilita de inmediato la dispensación y despacho en la Farmacia PAWLO.
                </p>

                {/* Formulario WebMCP Declarativo con toolname, tooldescription y toolautosubmit */}
                <form
                  toolname="pawlo_vet_issue_prescription"
                  tooldescription="Emite una receta médica veterinaria electrónica vinculada al microchip ISO de la mascota"
                  toolautosubmit="true"
                  onSubmit={handleIssuePrescription}
                  className="space-y-4 pt-2"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Paciente & Microchip</label>
                      <select
                        value={rxForm.petId}
                        onChange={e => {
                          setRxForm({ ...rxForm, petId: e.target.value });
                          setSelectedPetId(e.target.value);
                        }}
                        className="w-full glass-input rounded-xl px-3 py-2.5 text-xs font-bold"
                      >
                        {localPetsState.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.breed} • Chip: {p.microchipIso.slice(-6)})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Veterinario Prescriptor</label>
                      <input
                        type="text"
                        required
                        value={rxForm.vetName}
                        onChange={e => setRxForm({ ...rxForm, vetName: e.target.value })}
                        className="w-full glass-input rounded-xl px-3 py-2.5 text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Diagnóstico Clínico</label>
                    <input
                      type="text"
                      required
                      value={rxForm.diagnosis}
                      onChange={e => setRxForm({ ...rxForm, diagnosis: e.target.value })}
                      placeholder="Ej. Dermatitis atópica estacional / Prurito intenso"
                      className="w-full glass-input rounded-xl px-3 py-2.5 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold mb-1">Medicamento / Fármaco</label>
                      <input
                        type="text"
                        required
                        value={rxForm.medication}
                        onChange={e => setRxForm({ ...rxForm, medication: e.target.value })}
                        placeholder="Ej. Apoquel 16mg Comprimidos / NexGard Spectra"
                        className="w-full glass-input rounded-xl px-3 py-2.5 text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Duración (Días)</label>
                      <input
                        type="number"
                        min="1"
                        max="90"
                        value={rxForm.durationDays}
                        onChange={e => setRxForm({ ...rxForm, durationDays: parseInt(e.target.value) || 14 })}
                        className="w-full glass-input rounded-xl px-3 py-2.5 text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Dosificación & Frecuencia Exacta</label>
                    <input
                      type="text"
                      required
                      value={rxForm.dosage}
                      onChange={e => setRxForm({ ...rxForm, dosage: e.target.value })}
                      placeholder="Ej. 1 comprimido cada 24 horas por 14 días vía oral"
                      className="w-full glass-input rounded-xl px-3 py-2.5 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Instrucciones de Dispensación para el Tutor & Farmacia</label>
                    <textarea
                      rows={2}
                      value={rxForm.instructions}
                      onChange={e => setRxForm({ ...rxForm, instructions: e.target.value })}
                      placeholder="Indicaciones dietarias, horarios y precauciones..."
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-2026 w-full py-3.5 text-sm font-black flex items-center justify-center space-x-2 cursor-pointer shadow-lg"
                  >
                    <ShieldCheck className="w-5 h-5" />
                    <span>Firmar & Emitir Receta Digital (RX-PWL)</span>
                  </button>
                </form>

                {/* Banner / Receta Criptográfica Emitida */}
                {latestIssuedRx && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border-2 border-emerald-500/40 text-xs space-y-3 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <BadgeCheck className="w-5 h-5 text-emerald-600 dark:text-[#00F5A0]" />
                        <span className="font-mono font-black text-emerald-800 dark:text-[#00F5A0]">
                          {latestIssuedRx.id}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        Firma Criptográfica Válida
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-900/80 border border-slate-200 dark:border-white/5 space-y-1">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {latestIssuedRx.medication}
                      </p>
                      <p className="text-slate-600 dark:text-slate-300">
                        <strong>Dosis:</strong> {latestIssuedRx.dosage}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        <strong>Paciente:</strong> {latestIssuedRx.petName} ({latestIssuedRx.breed}) • Chip: {latestIssuedRx.microchipIso}
                      </p>
                      <p className="text-[10px] font-mono text-slate-400 break-all pt-1 border-t border-slate-200 dark:border-white/5">
                        Hash SHA-256: {latestIssuedRx.signatureHash}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-500">
                        Habilitado para despacho express en Farmacia PAWLO.
                      </span>
                      <a
                        href={`https://wa.me/593998408369?text=${encodeURIComponent(
                          `Hola Nicolás, el Dr. Esteban Cordero emitió la receta electrónica ${latestIssuedRx.id} para ${latestIssuedRx.petName}. Puedes dispensarla en la farmacia PAWLO con entrega en 45 min.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs inline-flex items-center space-x-1 hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Compartir por WhatsApp al Tutor</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Agenda de Turnos Clínicos del Día */}
              <div className="lg:col-span-5 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="badge-indigo px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>AGENDA DE HOY</span>
                    </span>
                    <h3 className="text-xl font-black text-slate-950 dark:text-white mt-1">
                      Turnos Clínicos
                    </h3>
                  </div>
                  <span className="text-xs font-mono px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {appointments.length} Citas
                  </span>
                </div>

                <div className="space-y-3">
                  {appointments.map(apt => (
                    <div
                      key={apt.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        apt.urgency
                          ? 'bg-rose-500/10 border-rose-500/40 text-rose-900 dark:text-rose-100'
                          : apt.status === 'en_atencion'
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-mono font-extrabold flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{apt.time}</span>
                        </span>
                        <div className="flex items-center space-x-1">
                          {apt.urgency && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white uppercase tracking-wider animate-pulse">
                              Urgencia
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            apt.status === 'en_atencion'
                              ? 'bg-emerald-500/20 text-emerald-700 dark:text-[#00F5A0]'
                              : apt.status === 'completado'
                              ? 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                          }`}>
                            {apt.status === 'en_atencion' ? 'En Atención' : apt.status === 'completado' ? 'Completado' : 'En Sala de Espera'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="font-black text-sm text-slate-900 dark:text-white">{apt.patientName}</span>
                        <span className="text-xs text-slate-500">({apt.breed})</span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        {apt.reason}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-2 border-t border-slate-200 dark:border-white/5">
                        <span>Tutor: {apt.tutorName}</span>
                        <div className="flex items-center space-x-1.5">
                          {apt.status === 'en_espera' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'en_atencion')}
                              className="px-2 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-700 transition"
                            >
                              Recibir en Sala
                            </button>
                          )}
                          {apt.status === 'en_atencion' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'completado')}
                              className="px-2 py-1 rounded-lg bg-slate-800 text-white dark:bg-slate-700 font-bold text-[10px] hover:bg-slate-900 transition"
                            >
                              Finalizar Consulta
                            </button>
                          )}
                          {apt.urgency && apt.status !== 'derivado' && (
                            <button
                              type="button"
                              onClick={() => handleUpdateAppointmentStatus(apt.id, 'derivado')}
                              className="px-2 py-1 rounded-lg bg-rose-600 text-white font-bold text-[10px] hover:bg-rose-700 transition"
                            >
                              Derivar Quirófano
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Historial Rápido de Recetas Clínicas Emitidas */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
                    Recetas Emitidas en esta Sesión ({issuedPrescriptions.length})
                  </span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {issuedPrescriptions.map(rx => (
                      <div
                        key={rx.id}
                        className="p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-mono font-bold text-sky-700 dark:text-[#00D9F5] block">
                            {rx.id}
                          </span>
                          <span className="text-[10px] text-slate-500">{rx.petName} • {rx.medication}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          rx.status === 'activa'
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-[#00F5A0]'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {rx.status.toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 2. PORTAL COMERCIO: PET SHOP, FARMACIA & MOTORIZADOS    */}
        {/* ======================================================== */}
        {activeRole === 'comercio' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Métricas Financieras y de Operación de Tienda */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Ventas de Hoy</span>
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-[#00F5A0] flex items-center justify-center">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950 dark:text-white">$1,482.50 {currency}</div>
                <div className="flex items-center space-x-1 text-xs text-emerald-600 dark:text-[#00F5A0] font-bold">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+18.4% vs promedio diario</span>
                </div>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Liquidación Deuna P2P</span>
                  <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-600 dark:text-[#00D9F5] flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950 dark:text-white">$920.00 {currency}</div>
                <div className="text-xs text-slate-500 font-mono">
                  Acreditación directa en Produbanco / Pichincha
                </div>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Recetas por Validar</span>
                  <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Pill className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
                  {storeOrders.filter(o => o.orderStatus === 'validando_receta').length} Pedidos
                </div>
                <div className="text-xs text-slate-500">
                  Requieren verificación de código RX-PWL
                </div>
              </div>

              <div className="glass-panel p-5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500 uppercase">Flota de Despacho</span>
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Truck className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-950 dark:text-white">4 Motorizados</div>
                <div className="text-xs text-slate-500">
                  Promedio de entrega: <strong>26 min en Cuenca</strong>
                </div>
              </div>
            </div>

            {/* Cola de Pedidos & Verificador de Recetas Veterinarias */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="badge-sky px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                    DESPACHO EXPRESS & FARMACIA
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">
                    Cola de Pedidos & Validación de Recetas
                  </h3>
                  <p className="text-xs text-slate-500">
                    Dispensación controlada de medicamentos veterinarios auditados con microchip ISO y código criptográfico.
                  </p>
                </div>

                {/* Filtro de Órdenes */}
                <div className="inline-flex p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrderFilter('todos')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      orderFilter === 'todos' ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Todos ({storeOrders.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderFilter('validando_receta')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      orderFilter === 'validando_receta' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    Validando Rx ({storeOrders.filter(o => o.orderStatus === 'validando_receta').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderFilter('en_motorizado')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition ${
                      orderFilter === 'en_motorizado' ? 'bg-sky-500 text-white shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    En Motorizado ({storeOrders.filter(o => o.orderStatus === 'en_motorizado').length})
                  </button>
                </div>
              </div>

              {/* Lista de Órdenes */}
              <div className="grid grid-cols-1 gap-4">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 hover:border-sky-500/40 transition-all space-y-4"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono font-black text-sm text-sky-700 dark:text-[#00D9F5]">
                          #{order.id}
                        </span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {order.customerName}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({order.createdAt})
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.orderStatus === 'validando_receta'
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30'
                            : order.orderStatus === 'en_motorizado'
                            ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                            : 'bg-emerald-500/15 text-emerald-700 dark:text-[#00F5A0] border border-emerald-500/30'
                        }`}>
                          {order.orderStatus === 'validando_receta'
                            ? 'Validando Receta Clínica'
                            : order.orderStatus === 'en_motorizado'
                            ? `En Motorizado (${order.motorizedDriver})`
                            : 'Entregado'}
                        </span>

                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                          ${order.totalAmount.toFixed(2)} {currency} • {order.paymentMethod}
                        </span>
                      </div>
                    </div>

                    {/* Detalle de Productos & Microchip */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-xs">
                      <div className="lg:col-span-7 space-y-2">
                        <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                          Productos en la Orden:
                        </span>
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-white/60 dark:bg-slate-950/60 border border-slate-200 dark:border-white/5">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-white">x{it.qty}</span>
                              <span className="text-slate-800 dark:text-slate-200">{it.title}</span>
                              {it.requiresPrescription && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-400">
                                  REQUIERE RX
                                </span>
                              )}
                            </div>
                            <span className="font-bold text-slate-900 dark:text-white">${(it.price * it.qty).toFixed(2)}</span>
                          </div>
                        ))}
                        <p className="text-[11px] text-slate-500">
                          <strong>Dirección de Entrega:</strong> {order.deliveryAddress}
                        </p>
                      </div>

                      {/* Recuadro de Validación de Receta */}
                      <div className="lg:col-span-5 p-3.5 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-white/10 space-y-2">
                        <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
                          Certificado de Prescripción & Paciente
                        </span>

                        <div className="space-y-1">
                          <p className="text-slate-800 dark:text-slate-200">
                            <strong>Paciente:</strong> {order.petName} ({order.petSpecies === 'canine' ? 'Perro' : 'Gato'})
                          </p>
                          <p className="font-mono text-[11px] text-slate-600 dark:text-slate-400">
                            <strong>Microchip ISO:</strong> {order.microchipIso}
                          </p>

                          {order.prescriptionCode ? (
                            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-[11px] space-y-0.5">
                              <p className="font-mono font-bold text-emerald-800 dark:text-[#00F5A0]">
                                Código: {order.prescriptionCode}
                              </p>
                              <p className="text-[10px] text-slate-500">
                                Médico: {order.vetPrescriber || 'Dr. Esteban Cordero (Reg. 1049)'}
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-slate-400">Venta libre sin restricción de receta.</p>
                          )}
                        </div>

                        {/* Botones de acción sobre el pedido */}
                        <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex flex-wrap gap-2">
                          {order.orderStatus === 'validando_receta' && (
                            <button
                              type="button"
                              onClick={() => handleValidateOrderPrescription(order.id)}
                              className="btn-primary-2026 px-3 py-1.5 text-xs font-bold inline-flex items-center space-x-1 cursor-pointer"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Validar Receta & Despachar</span>
                            </button>
                          )}

                          {order.orderStatus === 'en_motorizado' && (
                            <button
                              type="button"
                              onClick={() => handleAdvanceOrderStatus(order.id)}
                              className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center space-x-1 hover:bg-emerald-700 transition cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Marcar como Entregado</span>
                            </button>
                          )}

                          <a
                            href={`https://wa.me/593${order.customerPhone.replace(/^0/, '')}?text=${encodeURIComponent(
                              `Hola ${order.customerName}, tu pedido #${order.id} en PAWLO Pet Shop está ${
                                order.orderStatus === 'validando_receta' ? 'en validación médica de receta' : 'en ruta con el motorizado'
                              }.`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold inline-flex items-center space-x-1 hover:bg-slate-300 dark:hover:bg-slate-700 transition"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp Tutor</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Gestor Rápido de Inventario & Precios (WebMCP Declarativo) */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="badge-emerald px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                    CATÁLOGO & STOCK
                  </span>
                  <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">
                    Gestor Rápido de Inventario & Precios
                  </h3>
                  <p className="text-xs text-slate-500">
                    Controla en tiempo real la disponibilidad, ajusta precios o añade nuevos SKUs farmacéuticos y de nutrición.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(!isAddProductOpen)}
                  className="btn-primary-2026 px-4 py-2.5 text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Nuevo SKU en Catálogo</span>
                </button>
              </div>

              {/* Formulario WebMCP Declarativo para Agregar Producto */}
              {isAddProductOpen && (
                <div className="p-5 rounded-2xl bg-sky-500/5 border border-sky-500/30 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center space-x-2">
                      <Package className="w-4 h-4 text-sky-600 dark:text-[#00D9F5]" />
                      <span>Agregar / Actualizar SKU con WebMCP Agéntico</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsAddProductOpen(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form
                    toolname="pawlo_commerce_add_product"
                    tooldescription="Agrega o actualiza stock y precio de productos en el catálogo del comercio"
                    toolautosubmit="true"
                    onSubmit={handleAddProduct}
                    className="space-y-4"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">Código SKU</label>
                        <input
                          type="text"
                          required
                          value={newProductForm.sku}
                          onChange={e => setNewProductForm({ ...newProductForm, sku: e.target.value })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono uppercase"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold mb-1">Nombre Comercial del Producto</label>
                        <input
                          type="text"
                          required
                          value={newProductForm.title}
                          onChange={e => setNewProductForm({ ...newProductForm, title: e.target.value })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-bold mb-1">Categoría</label>
                        <select
                          value={newProductForm.category}
                          onChange={e => setNewProductForm({ ...newProductForm, category: e.target.value as any })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="Comida">Comida & Dieta</option>
                          <option value="Medicamentos">Medicamentos & Farmacia</option>
                          <option value="Juguetes">Juguetes</option>
                          <option value="Camas">Camas</option>
                          <option value="Casas">Casas & Kennels</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">Especie</label>
                        <select
                          value={newProductForm.species}
                          onChange={e => setNewProductForm({ ...newProductForm, species: e.target.value as any })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                        >
                          <option value="canine">Canino</option>
                          <option value="feline">Felino</option>
                          <option value="all">Todas las Especies</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold mb-1">Precio USD ({currency})</label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={newProductForm.price}
                          onChange={e => setNewProductForm({ ...newProductForm, price: parseFloat(e.target.value) || 0 })}
                          className="w-full glass-input rounded-xl px-3 py-2 text-xs font-bold"
                        />
                      </div>

                      <div className="flex items-center pt-5">
                        <label className="flex items-center space-x-2 text-xs font-bold cursor-pointer">
                          <input
                            type="checkbox"
                            checked={newProductForm.requiresPrescription}
                            onChange={e => setNewProductForm({ ...newProductForm, requiresPrescription: e.target.checked })}
                            className="rounded text-emerald-600 w-4 h-4"
                          />
                          <span>Requiere Receta Médica</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Descripción Corta</label>
                      <input
                        type="text"
                        value={newProductForm.description}
                        onChange={e => setNewProductForm({ ...newProductForm, description: e.target.value })}
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                      />
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setIsAddProductOpen(false)}
                        className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className="btn-primary-2026 px-5 py-2 text-xs font-bold cursor-pointer"
                      >
                        Guardar SKU en Inventario
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Filtros de Inventario */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchCatalogQuery}
                    onChange={e => setSearchCatalogQuery(e.target.value)}
                    placeholder="Filtrar por SKU o título de producto..."
                    className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-xs"
                  />
                </div>

                <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
                  {['Todos', 'Comida', 'Medicamentos', 'Juguetes', 'Camas', 'Casas'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCatalogCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-bold transition whitespace-nowrap cursor-pointer ${
                        catalogCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grilla de Productos con Toggle de Disponibilidad y Ajuste de Precio */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCatalog.map(prod => {
                  const isAvailable = prod.stock.includes('Disponible') || prod.stock.includes('En Stock');
                  return (
                    <div
                      key={prod.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-start space-x-3">
                          <img
                            src={prod.photo}
                            alt={prod.title}
                            className="w-14 h-14 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                          />
                          <div className="space-y-0.5 min-w-0">
                            <span className="text-[10px] font-mono text-slate-400 block truncate">
                              SKU: {prod.sku}
                            </span>
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-white line-clamp-2">
                              {prod.title}
                            </h5>
                            <span className="text-[10px] text-slate-500 block">{prod.brand}</span>
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          {prod.requiresPrescription ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                              Exige Receta
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-[#00F5A0]">
                              Venta Libre
                            </span>
                          )}

                          <div className="flex items-center space-x-1.5">
                            <button
                              type="button"
                              onClick={() => handleAdjustPrice(prod.id, -1)}
                              className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-300"
                            >
                              -
                            </button>
                            <span className="font-mono font-extrabold text-sm text-slate-900 dark:text-white">
                              ${prod.price.toFixed(2)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleAdjustPrice(prod.id, +1)}
                              className="w-6 h-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center hover:bg-slate-300"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                        <span className={`text-[11px] font-bold ${isAvailable ? 'text-emerald-600 dark:text-[#00F5A0]' : 'text-rose-500'}`}>
                          {isAvailable ? 'En Stock' : 'Agotado'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleProductStock(prod.id)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer transition ${
                            isAvailable
                              ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-500/20'
                              : 'bg-emerald-500/10 text-emerald-600 dark:text-[#00F5A0] hover:bg-emerald-500/20'
                          }`}
                        >
                          {isAvailable ? 'Marcar Agotado' : 'Reactivar Stock'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 3. PORTAL SERVICIOS: PET TAXI, HOSPEDAJE, GROOMING & ETO */}
        {/* ======================================================== */}
        {activeRole === 'servicio' && (
          <div className="space-y-8 animate-fadeIn">
            {/* Header de Operaciones de Servicios */}
            <div className="glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="badge-indigo px-2.5 py-0.5 rounded-full text-xs font-mono font-bold">
                  RED LOGÍSTICA & BIENESTAR ANIMAL
                </span>
                <h3 className="text-2xl font-black text-slate-950 dark:text-white mt-1">
                  Operaciones de Pet Taxi, Hospedaje, Grooming & Etología
                </h3>
                <p className="text-xs text-slate-500">
                  Controla traslados climatizados con GPS, monitoreo en hotel campestre y envía reportes de bienestar en vivo al tutor.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-[#00F5A0] border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping mr-1"></span>
                  4 Servicios Activos en {cityName}
                </span>
              </div>
            </div>

            {/* Tablero de Reservas y Rutas Activas */}
            <div className="space-y-4">
              <h4 className="text-lg font-black text-slate-950 dark:text-white flex items-center space-x-2">
                <Car className="w-5 h-5 text-indigo-500" />
                <span>Reservas y Servicios en Progreso</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {serviceBookings.map(booking => (
                  <div
                    key={booking.id}
                    className="glass-panel rounded-3xl p-5 border border-slate-200 dark:border-white/10 hover:border-indigo-500/40 transition-all space-y-4 shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Cabecera de la Tarjeta */}
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
                          {booking.serviceCategory.toUpperCase()}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                          booking.status === 'en_atencion'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-[#00F5A0] animate-pulse'
                            : booking.status === 'completado'
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                            : 'bg-sky-500/20 text-sky-700 dark:text-sky-300'
                        }`}>
                          {booking.status === 'en_atencion' ? 'En Ruta / En Atención' : booking.status === 'completado' ? 'Completado' : 'Confirmado'}
                        </span>
                      </div>

                      <h5 className="font-extrabold text-base text-slate-900 dark:text-white mt-2">
                        {booking.serviceTitle}
                      </h5>

                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        {booking.scheduledTime} • {booking.provider}
                      </p>

                      {/* Datos de la Mascota */}
                      <div className="mt-3 p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-black text-slate-900 dark:text-white">
                            {booking.petName} ({booking.petBreed})
                          </span>
                          <span className="font-mono text-[11px] text-slate-500">
                            {booking.petWeightKg} kg
                          </span>
                        </div>

                        <p className="font-mono text-[10px] text-emerald-700 dark:text-[#00F5A0]">
                          Chip ISO: {booking.microchipIso}
                        </p>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300">
                          <strong>Ubicación / Ruta:</strong> {booking.locationDetails}
                        </p>

                        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-800 dark:text-amber-200 font-medium">
                          <strong>Indicaciones:</strong> {booking.specialNotes}
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-slate-500 flex items-center justify-between">
                        <span>Operador: <strong>{booking.assignedOperator}</strong></span>
                        <span className="text-[10px] font-mono text-indigo-500 font-bold">
                          {booking.activeLogCount} reportes enviados
                        </span>
                      </div>
                    </div>

                    {/* Botones Operativos en Vivo */}
                    <div className="pt-3 border-t border-slate-200 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {booking.status !== 'completado' && (
                          <button
                            type="button"
                            onClick={() => handleAdvanceBookingStatus(booking.id)}
                            className="btn-primary-2026 px-3.5 py-2 text-xs font-bold inline-flex items-center space-x-1.5 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>
                              {booking.status === 'confirmado' ? 'Iniciar Servicio / En Ruta' : 'Completar y Cerrar'}
                            </span>
                          </button>
                        )}
                      </div>

                      <a
                        href={`https://wa.me/593${booking.tutorPhone.replace(/^0/, '')}?text=${encodeURIComponent(
                          `Hola ${booking.tutorName}, te saludamos desde ${booking.provider} sobre el servicio de ${booking.petName}. Todo marcha excelente.`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center space-x-1.5 hover:bg-emerald-700 transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat WhatsApp Tutor</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emisión de Reporte Fotográfico / Bitácora de Bienestar (WebMCP Declarativo) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Formulario de Reporte al Tutor */}
              <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
                <div>
                  <span className="badge-emerald px-2.5 py-0.5 rounded-full text-xs font-mono font-bold flex items-center space-x-1 w-max">
                    <Camera className="w-3.5 h-3.5" />
                    <span>BITÁCORA EN TIEMPO REAL</span>
                  </span>
                  <h3 className="text-xl font-black text-slate-950 dark:text-white mt-1">
                    Enviar Reporte de Bienestar al Tutor
                  </h3>
                  <p className="text-xs text-slate-500">
                    Notifica al tutor en su aplicación PAWLO con fotos, estado de ánimo y bitácora de alimentación o trayecto.
                  </p>
                </div>

                {reportSuccessNotice && (
                  <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-800 dark:text-[#00F5A0] font-bold flex items-center space-x-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{reportSuccessNotice}</span>
                  </div>
                )}

                {/* Formulario WebMCP Declarativo */}
                <form
                  toolname="pawlo_service_send_report"
                  tooldescription="Envía reporte de bienestar o ubicación en ruta al tutor de la mascota"
                  toolautosubmit="true"
                  onSubmit={handleSendServiceReport}
                  className="space-y-4 pt-1"
                >
                  <div>
                    <label className="block text-xs font-bold mb-1">Servicio / Mascota Destino</label>
                    <select
                      value={reportForm.bookingId}
                      onChange={e => setReportForm({ ...reportForm, bookingId: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2.5 text-xs font-bold"
                    >
                      {serviceBookings.map(bk => (
                        <option key={bk.id} value={bk.id}>
                          {bk.petName} — {bk.serviceTitle} ({bk.serviceCategory})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold mb-1">Tipo de Actualización</label>
                      <select
                        value={reportForm.reportType}
                        onChange={e => setReportForm({ ...reportForm, reportType: e.target.value as any })}
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="Ubicación GPS en Ruta">Ubicación GPS en Ruta</option>
                        <option value="Alimentación & Hidratación">Alimentación & Hidratación</option>
                        <option value="Bienestar & Recreo">Bienestar & Recreo</option>
                        <option value="Incidencia Médica">Incidencia Médica</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold mb-1">Estado de Ánimo Observado</label>
                      <select
                        value={reportForm.mood}
                        onChange={e => setReportForm({ ...reportForm, mood: e.target.value as any })}
                        className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                      >
                        <option value="Relajado y Feliz">Relajado y Feliz</option>
                        <option value="Enérgico y Jugando">Enérgico y Jugando</option>
                        <option value="Tranquilo / Descansando">Tranquilo / Descansando</option>
                        <option value="Alerta y Curioso">Alerta y Curioso</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Mensaje para el Tutor</label>
                    <textarea
                      rows={3}
                      required
                      value={reportForm.message}
                      onChange={e => setReportForm({ ...reportForm, message: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                      placeholder="Ej. Bruno llegó excelente al hotel campestre, ya comió su ración de 190g y está disfrutando de los jardines..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold mb-1">Foto de Bienestar (URL o Foto en Vivo)</label>
                    <input
                      type="text"
                      value={reportForm.photoUrl}
                      onChange={e => setReportForm({ ...reportForm, photoUrl: e.target.value })}
                      className="w-full glass-input rounded-xl px-3 py-2 text-xs font-mono"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn-primary-2026 w-full py-3.5 text-xs font-black inline-flex items-center justify-center space-x-2 cursor-pointer shadow-md"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar Actualización al Carnet Digital del Tutor</span>
                  </button>
                </form>
              </div>

              {/* Muro de Bitácoras de Bienestar Emitidas Hoy */}
              <div className="lg:col-span-6 glass-panel rounded-3xl p-6 border border-slate-200 dark:border-white/10 shadow-lg space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-base text-slate-950 dark:text-white flex items-center space-x-2">
                    <Heart className="w-4 h-4 text-rose-500" />
                    <span>Feed de Bienestar Sincronizado Hoy ({welfareReports.length})</span>
                  </h4>
                  <span className="text-[10px] font-mono text-slate-500">Carnet PAWLO Live</span>
                </div>

                <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                  {welfareReports.map(rep => (
                    <div
                      key={rep.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {rep.petName}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">
                            {rep.reportType}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">{rep.timestamp}</span>
                      </div>

                      <div className="flex items-start space-x-3">
                        <img
                          src={rep.photoUrl}
                          alt={rep.petName}
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-white/10 shrink-0"
                        />
                        <div className="space-y-1">
                          <p className="text-slate-700 dark:text-slate-200 text-xs">
                            {rep.message}
                          </p>
                          <div className="flex items-center space-x-2 text-[10px] text-slate-500">
                            <span className="font-bold text-emerald-600 dark:text-[#00F5A0] flex items-center space-x-1">
                              <Sparkles className="w-3 h-3" />
                              <span>{rep.mood}</span>
                            </span>
                            <span>•</span>
                            <span>Por: {rep.verifiedBy}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
