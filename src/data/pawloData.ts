export interface VaccineRecord {
  id: string;
  name: string;
  batch: string;
  appliedDate: string;
  nextDueDate: string;
  clinic: string;
  vetName: string;
  status: 'vigente' | 'proximo' | 'vencido';
}

export interface ClinicalEntry {
  id: string;
  date: string;
  type: 'Consulta General' | 'Cirugía' | 'Laboratorio' | 'Control Peso' | 'Urgencia' | 'Odontología';
  title: string;
  diagnosis: string;
  treatment: string;
  weightKg: number;
  tempC: number;
  clinic: string;
  vetName: string;
}

export interface PetNote {
  id: string;
  category: 'Nutrición' | 'Medicación' | 'Conducta' | 'Cuidado Diario';
  title: string;
  content: string;
  updatedAt: string;
}

export interface UserPet {
  id: string;
  name: string;
  species: 'canine' | 'feline';
  breed: string;
  gender: 'Macho' | 'Hembra';
  isSterilized: boolean;
  birthDate: string;
  ageLabel: string;
  weightKg: number;
  targetWeightKg: number;
  coatColor: string;
  microchipIso: string;
  bloodType: string;
  allergies: string[];
  dietBrand: string;
  dailyRationGrams: number;
  avatar: string;
  gallery: Array<{ url: string; caption: string; date: string }>;
  vaccines: VaccineRecord[];
  clinicalHistory: ClinicalEntry[];
  notes: PetNote[];
}

export interface StoreProduct {
  id: string;
  sku: string;
  title: string;
  brand: string;
  category: 'Comida' | 'Medicamentos' | 'Juguetes' | 'Camas' | 'Casas';
  species: 'canine' | 'feline' | 'all';
  price: number;
  requiresPrescription: boolean;
  badge: string;
  idealFor: string;
  rating: string;
  reviews: number;
  stock: string;
  description: string;
  photo: string;
}

export interface PetServiceItem {
  id: string;
  title: string;
  category: 'Transporte' | 'Hospedaje' | 'Grooming' | 'Veterinaria' | 'Etología';
  provider: string;
  price: number;
  priceUnit: string;
  sector: string;
  badge: string;
  rating: string;
  reviews: number;
  whatsapp: string;
  description: string;
  includes: string[];
}

export const INITIAL_USER_PETS: UserPet[] = [
  {
    id: 'pet-bruno',
    name: 'Bruno',
    species: 'canine',
    breed: 'Golden Retriever',
    gender: 'Macho',
    isSterilized: true,
    birthDate: '2023-04-12',
    ageLabel: '3 años, 6 meses',
    weightKg: 29.4,
    targetWeightKg: 29.0,
    coatColor: 'Dorado Ámbar',
    microchipIso: '981098104592831',
    bloodType: 'DEA 1.1 Positivo',
    allergies: ['Proteína de Pollo Procesada', 'Picadura de Pulga (DAPP)'],
    dietBrand: 'Fórmula Salmón & Arroz Adulto Raza Grande',
    dailyRationGrams: 380,
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=800&q=80',
        caption: 'Paseo matutino en Parque El Paraíso',
        date: '14 Oct 2026'
      },
      {
        url: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80',
        caption: 'Después de sesión de hidroterapia y baño',
        date: '02 Sep 2026'
      },
      {
        url: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
        caption: 'Cumpleaños #3 en el Cajas',
        date: '12 Abr 2026'
      }
    ],
    vaccines: [
      {
        id: 'vac-01',
        name: 'Séxtuple Canina (DHPPI+L)',
        batch: 'NOB-88412-A',
        appliedDate: '15 Mar 2026',
        nextDueDate: '15 Mar 2027',
        clinic: 'Hospital Veterinario El Paraíso',
        vetName: 'Dr. Esteban Cordero (Reg. 1049)',
        status: 'vigente'
      },
      {
        id: 'vac-02',
        name: 'Antirrábica Inactivada',
        batch: 'RAB-40291-X',
        appliedDate: '15 Mar 2026',
        nextDueDate: '15 Mar 2027',
        clinic: 'Hospital Veterinario El Paraíso',
        vetName: 'Dr. Esteban Cordero (Reg. 1049)',
        status: 'vigente'
      },
      {
        id: 'vac-03',
        name: 'Desparasitación Externa/Interna (NexGard Spectra)',
        batch: 'NXG-99201',
        appliedDate: '25 Sep 2026',
        nextDueDate: '25 Oct 2026',
        clinic: 'Control Domiciliario PAWLO',
        vetName: 'Dra. Valeria Palacios',
        status: 'proximo'
      },
      {
        id: 'vac-04',
        name: 'Bordetella Bronchiseptica (Tos de las Perreras)',
        batch: 'KC-11029',
        appliedDate: '10 Ago 2026',
        nextDueDate: '10 Ago 2027',
        clinic: 'Centro Clínico San Blas',
        vetName: 'Dra. Valeria Palacios',
        status: 'vigente'
      }
    ],
    clinicalHistory: [
      {
        id: 'clin-01',
        date: '18 Sep 2026',
        type: 'Consulta General',
        title: 'Chequeo Semestral Preventivo & Perfil Renal/Hepático',
        diagnosis: 'Paciente normopeso, mucosas rosadas, auscultación cardiopulmonar limpia. Valores hematológicos dentro de rango óptimo.',
        treatment: 'Mantener dieta hipoalergénica base salmón (380g/día divididos en 2 tomas) y suplementación de Omega 3 EPA/DHA.',
        weightKg: 29.4,
        tempC: 38.4,
        clinic: 'Hospital Veterinario El Paraíso',
        vetName: 'Dr. Esteban Cordero'
      },
      {
        id: 'clin-02',
        date: '04 May 2026',
        type: 'Odontología',
        title: 'Profilaxis Dental por Ultrasonido Bajo Sedación Inhalatoria',
        diagnosis: 'Sarro grado I en premolares superiores sin compromiso periodontal.',
        treatment: 'Limpieza ultrasónica completa, pulido dental y aplicación de gel antiséptico de clorhexidina.',
        weightKg: 29.8,
        tempC: 38.5,
        clinic: 'Centro Clínico San Blas',
        vetName: 'Dra. Valeria Palacios'
      },
      {
        id: 'clin-03',
        date: '14 Nov 2025',
        type: 'Laboratorio',
        title: 'Test de Alergias Alimentarias y Dermatología',
        diagnosis: 'Sensibilidad moderada a harinas de ave industriales.',
        treatment: 'Transición definitiva a proteína hidrolizada o salmón del Pacífico.',
        weightKg: 28.9,
        tempC: 38.3,
        clinic: 'Hospital Veterinario El Paraíso',
        vetName: 'Dr. Esteban Cordero'
      }
    ],
    notes: [
      {
        id: 'note-01',
        category: 'Nutrición',
        title: 'Horarios y ración exacta de comida',
        content: 'Come 190g a las 07:30 AM y 190g a las 06:30 PM. Agregar 1 cápsula de Omega 3 en la comida de la mañana. Prohibido darle huesos cocidos o premios con pollo.',
        updatedAt: 'Hace 3 días'
      },
      {
        id: 'note-02',
        category: 'Conducta',
        title: 'Sensibilidad a pirotecnia y tormentas',
        content: 'Durante lluvias fuertes o fuegos artificiales, prefiere refugiarse en su cama ortopédica junto al estudio con música clásica o ruido blanco.',
        updatedAt: 'Hace 2 semanas'
      },
      {
        id: 'note-03',
        category: 'Medicación',
        title: 'Recordatorio mensual antipulgas',
        content: 'Le toca tableta masticable para perros de 15-30 kg el día 25 de cada mes.',
        updatedAt: 'Hace 5 días'
      }
    ]
  },
  {
    id: 'pet-mia',
    name: 'Mía',
    species: 'feline',
    breed: 'Siamés Moderno Seal Point',
    gender: 'Hembra',
    isSterilized: true,
    birthDate: '2024-08-20',
    ageLabel: '2 años, 2 meses',
    weightKg: 4.1,
    targetWeightKg: 4.0,
    coatColor: 'Crema & Seal Point',
    microchipIso: '981098108843120',
    bloodType: 'Tipo A Felino',
    allergies: ['Ninguna alergia medicamentosa reportada'],
    dietBrand: 'Alimento Super Premium Urinary & Hairball Control',
    dailyRationGrams: 65,
    avatar: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
    gallery: [
      {
        url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
        caption: 'Descansando junto al ventanal soleado',
        date: '10 Oct 2026'
      },
      {
        url: 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=800&q=80',
        caption: 'Explorando su rascador multinivel',
        date: '19 Ago 2026'
      }
    ],
    vaccines: [
      {
        id: 'vac-f01',
        name: 'Triple Felina (Rinotraqueítis, Calicivirus, Panleucopenia)',
        batch: 'FEL-77210',
        appliedDate: '20 Ago 2026',
        nextDueDate: '20 Ago 2027',
        clinic: 'Cat Clinic Especialidades Felinas',
        vetName: 'Dra. Camila Vélez (Reg. 2104)',
        status: 'vigente'
      },
      {
        id: 'vac-f02',
        name: 'Leucemia Viral Felina (FeLV)',
        batch: 'LEU-30192',
        appliedDate: '20 Ago 2026',
        nextDueDate: '20 Ago 2027',
        clinic: 'Cat Clinic Especialidades Felinas',
        vetName: 'Dra. Camila Vélez (Reg. 2104)',
        status: 'vigente'
      },
      {
        id: 'vac-f03',
        name: 'Pipeta Antiparasitaria Felina Broadline',
        batch: 'BRD-1190',
        appliedDate: '01 Oct 2026',
        nextDueDate: '01 Nov 2026',
        clinic: 'Control Domiciliario PAWLO',
        vetName: 'Dra. Camila Vélez',
        status: 'proximo'
      }
    ],
    clinicalHistory: [
      {
        id: 'clin-f01',
        date: '20 Ago 2026',
        type: 'Consulta General',
        title: 'Control Anual Felino + Ecografía Vesical Preventiva',
        diagnosis: 'Vejiga sin sedimento urinario, condición corporal 5/9 ideal, pelaje brillante.',
        treatment: 'Fomentar hidratación con fuente de agua continua y 1 sobre de comida húmeda renal/urinaria 3 veces por semana.',
        weightKg: 4.1,
        tempC: 38.6,
        clinic: 'Cat Clinic Especialidades Felinas',
        vetName: 'Dra. Camila Vélez'
      }
    ],
    notes: [
      {
        id: 'note-f01',
        category: 'Cuidado Diario',
        title: 'Preferencia de hidratación y arenero',
        content: 'Solo toma agua corriente de su fuente cerámica con filtro de carbón. Usa arena aglomerante de tofu biodegradable sin fragancia.',
        updatedAt: 'Hace 1 semana'
      }
    ]
  }
];

export const STORE_CATALOG: StoreProduct[] = [
  // COMIDA / NUTRICIÓN
  {
    id: 'prd-01',
    sku: 'NUT-SAL-15KG',
    title: 'Alimento Super Premium Salmón & Arroz Hipoalergénico (15 kg)',
    brand: 'PAWLO BioNutrition / N&D',
    category: 'Comida',
    species: 'canine',
    price: 78.50,
    requiresPrescription: false,
    badge: 'Ideal para Bruno',
    idealFor: 'Perros Adultos Sensibles (15–35 kg)',
    rating: '4.99',
    reviews: 428,
    stock: 'Disponible • Entrega en 45 min',
    description: 'Fórmula libre de pollo con salmón del Pacífico, glucosamina, condroitina y Omega 3 EPA/DHA para pelaje y articulaciones.',
    photo: 'https://images.unsplash.com/photo-1589924691995-400dc9ecc119?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prd-02',
    sku: 'NUT-FEL-4KG',
    title: 'Fórmula Felina Urinary Care & Hairball Control (4 kg)',
    brand: 'Royal Feline Care',
    category: 'Comida',
    species: 'feline',
    price: 42.00,
    requiresPrescription: false,
    badge: 'Ideal para Mía',
    idealFor: 'Gatos Esterilizados de Interior',
    rating: '4.96',
    reviews: 289,
    stock: 'Disponible • Entrega en 45 min',
    description: 'Balance mineral controlado de pH urinario y fibras naturales para eliminar bolas de pelo en gatos esterilizados.',
    photo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=600&q=80'
  },
  // MEDICAMENTOS & FARMACIA VETERINARIA
  {
    id: 'prd-03',
    sku: 'MED-NXG-1530',
    title: 'Antiparasitario Total Masticable (15 a 30 kg) — Caja x 3 Meses',
    brand: 'NexGard Spectra / Boehringer',
    category: 'Medicamentos',
    species: 'canine',
    price: 54.00,
    requiresPrescription: false,
    badge: 'Toca refuerzo a Bruno',
    idealFor: 'Control Pulgas, Garrapatas y Parásitos Internos',
    rating: '5.00',
    reviews: 615,
    stock: 'En Stock en Farmacia Verificada',
    description: 'Protección mensual de amplio espectro contra ectoparásitos y nematodos gastrointestinales. Saborizado de alta palatabilidad.',
    photo: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80'
  },
  {
    id: 'prd-04',
    sku: 'MED-APO-16MG',
    title: 'Tratamiento Dermatológico Antialérgico (Comprimidos Recetados)',
    brand: 'Zoetis Veterinary Pharma',
    category: 'Medicamentos',
    species: 'canine',
    price: 48.00,
    requiresPrescription: true,
    badge: 'Requiere Receta Clínica',
    idealFor: 'Control de Prurito y Dermatitis Alérgica',
    rating: '4.98',
    reviews: 194,
    stock: 'Validación con Carnet PAWLO',
    description: 'Dispensación exclusiva verificando receta o historial clínico activo de tu mascota dentro de la bóveda PAWLO.',
    photo: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80'
  },
  // JUGUETES & ENRIQUECIMIENTO
  {
    id: 'prd-05',
    sku: 'TOY-KNG-XL',
    title: 'Dispensador Interactivo de Caucho Natural Ultra-Resistente + Alfombra Olfativa',
    brand: 'KONG & PAWLO Enrichment',
    category: 'Juguetes',
    species: 'all',
    price: 26.50,
    requiresPrescription: false,
    badge: 'Enriquecimiento Mental',
    idealFor: 'Reducción de Ansiedad y Estimulación Olfativa',
    rating: '4.94',
    reviews: 342,
    stock: 'Disponible • Envío Hoy',
    description: 'Caucho natural no tóxico para rellenar con snacks saludables junto con tapete de olfato lavable de alta densidad.',
    photo: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?auto=format&fit=crop&w=600&q=80'
  },
  // CAMAS & DESCANSO
  {
    id: 'prd-06',
    sku: 'BED-ORT-XL',
    title: 'Cama Ortopédica Memory Foam Viscoelástica Impermeable (Talla L/XL)',
    brand: 'PAWLO Sleep Lab',
    category: 'Camas',
    species: 'all',
    price: 89.00,
    requiresPrescription: false,
    badge: 'Grado Ortopédico',
    idealFor: 'Soporte Articular y Descanso Profundo',
    rating: '4.99',
    reviews: 210,
    stock: 'Disponible • Envío Hoy',
    description: 'Espuma viscoelástica de alta densidad que alivia puntos de presión en cadera y codos. Funda anti-fluidos desmontable y lavable.',
    photo: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=600&q=80'
  },
  // CASAS & TRANSPORTE
  {
    id: 'prd-07',
    sku: 'HSE-THR-PRO',
    title: 'Casa Térmica Insulada de Exterior Todo-Clima + Kennel IATA de Viaje',
    brand: 'PAWLO Habitat Architecture',
    category: 'Casas',
    species: 'all',
    price: 145.00,
    requiresPrescription: false,
    badge: 'Aislamiento Térmico Andino',
    idealFor: 'Jardines, Terrazas y Viajes Aéreos/Terrestres',
    rating: '4.97',
    reviews: 156,
    stock: 'Disponible • Entrega Programada',
    description: 'Estructura termo-aislante diseñada para el clima de montaña con piso elevado antihumedad y ventilación cruzada regulable.',
    photo: 'https://images.unsplash.com/photo-1601758228041-f3b2795255f1?auto=format&fit=crop&w=600&q=80'
  }
];

export const EXPANDED_SERVICES_CATALOG: PetServiceItem[] = [
  {
    id: 'srv-trans-01',
    title: 'PAWLO Pet Taxi — Transporte Climatizado Puerta a Puerta con GPS en Vivo',
    category: 'Transporte',
    provider: 'PAWLO Mobility Fleet',
    price: 8.50,
    priceUnit: 'por trayecto urbano',
    sector: 'Cobertura Total Urbana & Valles',
    badge: 'GPS en Tiempo Real',
    rating: '4.99',
    reviews: 512,
    whatsapp: '593998408369',
    description: 'Vehículos higienizados con anclajes ISOFIX para arnés, rampa ortopédica y seguimiento en tiempo real para llevar a tu mascota al vet, hotel o aeropuerto.',
    includes: ['Anclaje de Seguridad Certificado', 'Acompañamiento con o sin Tutor', 'Desinfección UV entre viajes']
  },
  {
    id: 'srv-hosp-01',
    title: 'Hospedaje Boutique Libre de Jaulas & Guardería Campestre con Cámaras 24/7',
    category: 'Hospedaje',
    provider: 'Valle Verde Pet Resort & Suites',
    price: 22.00,
    priceUnit: 'por noche / día',
    sector: 'Challuabamba / Yunguilla',
    badge: 'Cámaras HD 24/7',
    rating: '4.98',
    reviews: 389,
    whatsapp: '593998408369',
    description: 'Suites individuales climatizadas, 4.000 m² de jardines seguros, supervisión veterinaria permanente y reporte fotográfico/video cada 4 horas.',
    includes: ['Acceso a Cámara desde la App', 'Administración de Dieta y Recetas', 'Juegos de Socialización Guiados']
  },
  {
    id: 'srv-groom-01',
    title: 'Full Grooming Dermocosmético, Baño de Ozono & Spa Relajante a Domicilio',
    category: 'Grooming',
    provider: 'Tomebamba Pet Spa Studio',
    price: 28.00,
    priceUnit: 'sesión completa',
    sector: 'Unidad Móvil (En tu domicilio)',
    badge: 'Sin Estrés en Casa',
    rating: '4.96',
    reviews: 274,
    whatsapp: '593998408369',
    description: 'Estética hipoalergénica en furgoneta clínica totalmente equipada frente a tu casa. Cero jaulas de secado y productos dermatológicos pH neutro.',
    includes: ['Ozonoterapia Hidratante', 'Corte de Raza o Higiénico', 'Limpieza de Glándulas, Oídos y Uñas']
  },
  {
    id: 'srv-vet-01',
    title: 'Consulta Clínica Integral, Vacunación Anual & Ecografía Preventiva',
    category: 'Veterinaria',
    provider: 'Hospital Veterinario El Paraíso',
    price: 25.00,
    priceUnit: 'consulta + sello digital',
    sector: 'Parque El Paraíso / Av. 10 de Agosto',
    badge: 'Urgencias 24/7',
    rating: '4.99',
    reviews: 640,
    whatsapp: '593998408369',
    description: 'Atención médica con sincronización automática al Carnet Digital y a la Historia Clínica de tu mascota en PAWLO.',
    includes: ['Actualización de Carnet Digital PAWLO', 'Chequeo de 12 Puntos Vitales', 'Receta Electrónica Verificada']
  },
  {
    id: 'srv-eto-01',
    title: 'Etología Clínica, Paseo Educativo & Rehabilitación Conductual',
    category: 'Etología',
    provider: 'K9 Behavior & Mind Lab',
    price: 35.00,
    priceUnit: 'sesión personalizada',
    sector: 'Puertas del Sol / A Domicilio',
    badge: 'Especialista Certificado',
    rating: '5.00',
    reviews: 148,
    whatsapp: '593998408369',
    description: 'Diagnóstico y modificación de ansiedad por separación, reactividad con correa y adaptación de cachorros o gatos en el hogar.',
    includes: ['Plan de Enriquecimiento Ambiental', 'Evaluación en el Entorno Familiar', 'Seguimiento por 30 días']
  }
];

export type PawloPaymentMethod =
  | 'Payphone'
  | 'QR_Deuna_Sipy_Peigo'
  | 'Transferencia_Bancaria'
  | 'Efectivo_Contraentrega';

export interface PaymentOption {
  id: PawloPaymentMethod;
  label: string;
  description: string;
}

export const PAWLO_PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'Payphone',
    label: 'Payphone (Tarjeta Crédito / Débito)',
    description: 'Cobro seguro nacional e internacional con tarjetas Visa y Mastercard sin recargo.'
  },
  {
    id: 'QR_Deuna_Sipy_Peigo',
    label: 'Pago QR Instantáneo (DeUna / Sipy / Peigo)',
    description: 'Transferencia móvil instantánea escaneando código QR (DeUna, Sipy, Peigo).'
  },
  {
    id: 'Transferencia_Bancaria',
    label: 'Transferencia Bancaria Directa',
    description: 'Acreditación directa Banco Pichincha, Produbanco o Banco del Austro.'
  },
  {
    id: 'Efectivo_Contraentrega',
    label: 'Pago al Recibir',
    description: 'Pago en efectivo al motorizado al momento de la entrega.'
  }
];

export const CITY_DEFAULT_PAYMENT_RAILS: Record<string, string> = {
  cue: 'Payphone, Transferencia & QR (DeUna, Sipy, Peigo)',
  uio: 'Payphone, Transferencia & QR (DeUna, Sipy, Peigo)',
  gye: 'Payphone, Transferencia & QR (DeUna, Sipy, Peigo)',
  bog: 'Nequi, Daviplata & PSE',
  lim: 'Yape & Plin'
};

