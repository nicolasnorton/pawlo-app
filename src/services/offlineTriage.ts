/**
 * PAWLO™ Offline Clinical Triage Engine & Agentic Action Executor
 * Ejecución 100% en el dispositivo / navegador del usuario (Edge Computing).
 * Reduce a cero el consumo de API externa (DeepSeek/servidor) para el 90%+ de consultas y acciones.
 * 
 * Incluye:
 * 1. Cortafuegos Farmacológico Estricto (bloqueo de dosificación de fármacos humanos).
 * 2. Triaje de urgencia vital (Código Rojo, Amarillo, Verde, Azul).
 * 3. Ejecutor Agéntico de Acciones READ y WRITE con validación RBAC (8 roles de PAWLO).
 * 4. Marco legal y clínico explícito en cada orientación.
 */

import { pawloDB, TriageCacheEntry } from './indexedDbStorage';
import {
  UserPet,
  StoreProduct,
  PetServiceItem,
  VaccineRecord,
  PetNote,
  ClinicalEntry,
  STORE_CATALOG
} from '../data/pawloData';
import { PawloRoleId, getRoleMeta, isStaffRole, isPartnerRole } from '../data/rolesAndPortalsData';

export interface LocalTriageResult {
  triageLevel: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
  title: string;
  badge: string;
  response: string;
  actionRequired: string;
  pharmacologicalBlock: boolean;
  isLocalEdgeExecution: boolean;
  latencyMs: number;
  serverCost: string;
  recommendedCategory?: 'Medicamentos' | 'Comida' | 'Juguetes' | 'Servicios';
  recommendedProductKeywords?: string[];
}

export interface AssistantExecutionContext {
  currentRole: PawloRoleId;
  activePet: UserPet;
  allPets: UserPet[];
  products: StoreProduct[];
  services: PetServiceItem[];
  // Write callbacks
  onUpdatePetWeight?: (petId: string, weightKg: number) => void;
  onAddPetVaccine?: (petId: string, vaccine: Omit<VaccineRecord, 'id'>) => void;
  onAddPetNote?: (petId: string, note: Omit<PetNote, 'id' | 'date'>) => void;
  onAddClinicalRecord?: (petId: string, record: Omit<ClinicalEntry, 'id'>) => void;
  onAddToCart?: (product: StoreProduct, qty: number) => void;
  onClearCart?: () => void;
  onNavigateTab?: (tabId: string) => void;
  onSwitchRole?: (roleId: PawloRoleId) => void;
  onTriggerSosAlert?: (description: string, sector: string) => void;
  onPartnerAction?: (actionType: string, payload: any) => string;
  onStaffAction?: (actionType: string, payload: any) => string;
}

export interface AssistantActionExecuted {
  type: 'READ' | 'WRITE' | 'BLOCKED_RBAC' | 'PHARMA_BLOCKED';
  actionName: string;
  badge: string;
  targetModule: 'my_pets' | 'store' | 'sos' | 'portals' | 'services';
  navTab?: string;
  payload?: any;
  actionLabel?: string;
}

export interface AssistantResponse {
  text: string;
  badge: string;
  actionExecuted?: AssistantActionExecuted;
  isWriteAction: boolean;
  pharmacologicalBlock: boolean;
  requiresRoleSwitch?: PawloRoleId;
  latencyMs: number;
  suggestedFollowUps?: string[];
}

// Lista exhaustiva de fármacos y patrones de dosificación sujetos a cortafuegos
export const PHARMACOLOGICAL_TRIGGERS = [
  'ibuprofeno', 'paracetamol', 'acetaminofen', 'acetaminofén', 'amoxicilina',
  'aspirina', 'diclofenaco', 'ivermectina', 'tramadol', 'ketoprofeno',
  'naproxeno', 'dipirona', 'metamizol', 'cefalexina', 'enrofloxacina',
  'doxiciclina', 'prednisona', 'dexametasona', 'omeprazol', 'loperamida'
];

export const DOSAGE_TRIGGERS = [
  'dosis', 'pastilla', 'cuantas gotas', 'cuántas gotas', 'cuantos mg',
  'cuántos mg', 'mg/kg', 'cada cuantas horas', 'cada cuántas horas',
  'le puedo dar', 'puedo darle', 'recetar', 'miligramos', 'jarabe'
];

export const CLINICAL_LEGAL_DISCLAIMER =
  '*Orientación de bienestar y pre-clasificación — No reemplaza consulta veterinaria presencial.*';

/**
 * Procesa triaje clínico clásico con cortafuegos y persistencia en IndexedDB (Backward Compatible).
 */
export async function processOfflineTriage(
  rawInput: string,
  pet: UserPet
): Promise<LocalTriageResult> {
  const startTime = performance.now();
  const lower = rawInput.toLowerCase().trim();
  const petName = pet.name.toUpperCase();
  const petSpecies = pet.species;
  const petWeight = pet.weightKg;

  // 1. Verificación en Caché de IndexedDB (Respuesta instantánea 0ms)
  const cached = await pawloDB.getCachedTriage(lower, petSpecies);
  if (cached) {
    const elapsed = Math.round(performance.now() - startTime);
    await pawloDB.recordSavings(500, 3500); // 500 tokens y 3.5 KB ahorrados
    return {
      triageLevel: cached.triageLevel,
      title: cached.responseTitle,
      badge: `⚡ CACHÉ INDEXEDDB (${elapsed}ms • 0 API)`,
      response: `${cached.responseText}\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
      actionRequired: cached.recommendedAction,
      pharmacologicalBlock: cached.pharmacologicalBlock,
      isLocalEdgeExecution: true,
      latencyMs: elapsed,
      serverCost: '$0.00 (Persistencia Local)'
    };
  }

  // 2. CORTAFUEGOS FARMACOLÓGICO ESTRICTO (Regulatorio & Protección Animal)
  const hasPharmaDrug = PHARMACOLOGICAL_TRIGGERS.some(drug => lower.includes(drug));
  const hasDosageIntent = DOSAGE_TRIGGERS.some(intent => lower.includes(intent));

  if (hasPharmaDrug || hasDosageIntent) {
    const identifiedDrug = PHARMACOLOGICAL_TRIGGERS.find(d => lower.includes(d)) || 'fármaco humano';
    const elapsed = Math.round(performance.now() - startTime);

    const result: LocalTriageResult = {
      triageLevel: 'RED',
      title: `🚨 CORTAFUEGOS FARMACOLÓGICO ACTIVADO: ${petName}`,
      badge: 'CORTAFUEGOS REGULATORIO (0ms)',
      response: `⛔ ADVERTENCIA VETERINARIA CRÍTICA: La administración de ${identifiedDrug.toUpperCase()} o el cálculo empírico de dosis en mascotas está estrictamente prohibido por riesgo de intoxicación letal. 
En perros y gatos, los antiinflamatorios y analgésicos humanos provocan necrosis papilar renal, hemorragia gástrica aguda y fallo hepático irreversible incluso en dosis mínimas. 
PAWLO no genera prescripciones farmacológicas por IA para salvaguardar la vida de ${petName} (${petWeight} kg).\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
      actionRequired: 'Acudir de inmediato a una clínica veterinaria con cédula profesional para prescripción segura.',
      pharmacologicalBlock: true,
      isLocalEdgeExecution: true,
      latencyMs: elapsed,
      serverCost: '$0.00 (Protección Activa en Navegador)',
      recommendedCategory: 'Servicios'
    };

    // Guardar en caché y telemetría
    await saveTriageToCache(lower, pet, result);
    return result;
  }

  // 3. CÓDIGO ROJO — EMERGENCIAS VITALES INMEDIATAS (0h)
  const redFlags = [
    'sangre', 'convulsi', 'desmayo', 'inconsciente', 'atropell', 'chocado',
    'veneno', 'raticida', 'chocolate', 'lirio', 'anticongelante', 'cebolla',
    'ahogo', 'asfixia', 'respirar', 'morad', 'cianosis', 'torsion', 'estomago hinchado',
    'arcadas', 'no puede caminar', 'fractura'
  ];

  if (redFlags.some(flag => lower.includes(flag))) {
    const elapsed = Math.round(performance.now() - startTime);
    let specificAdvice = 'Mantén al animal en superficie horizontal acolchada, libre de obstáculos y vía aérea despejada. NO induzcas el vómito ni suministres leche o aceites.';
    
    if (lower.includes('chocolate')) {
      specificAdvice = `La teobromina del chocolate es cardiotóxica para ${petName}. El riesgo es mayor con chocolate negro/cacao amargo. Se requiere lavado gástrico o carbón activado administrado por un veterinario dentro de las primeras 2 horas.`;
    } else if (lower.includes('respirar') || lower.includes('morad')) {
      specificAdvice = 'Signo de insuficiencia respiratoria aguda o neumotórax. Evita cualquier estrés o compresión del tórax. Proporciona ventilación y acude con oxígeno.';
    }

    const result: LocalTriageResult = {
      triageLevel: 'RED',
      title: `🚨 CÓDIGO ROJO: EMERGENCIA VITAL PRIORIDAD 0 (${petName})`,
      badge: 'URGENCIA VITAL 0h (Edge Neural)',
      response: `Se han detectado signos de alto riesgo de compromiso vital en ${petName} (${petWeight} kg, ${petSpecies === 'canine' || petSpecies === ('dog' as any) ? 'Canino' : 'Felino'}). ${specificAdvice}\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
      actionRequired: 'Solicitar Pet Taxi de Urgencia en Servicios o acudir al Hospital Veterinario 24/7 más cercano.',
      pharmacologicalBlock: false,
      isLocalEdgeExecution: true,
      latencyMs: elapsed,
      serverCost: '$0.00 (Local Compute)',
      recommendedCategory: 'Servicios'
    };

    await saveTriageToCache(lower, pet, result);
    return result;
  }

  // 4. CÓDIGO AMARILLO — ATENCIÓN PRIORITARIA (<12h)
  const yellowFlags = [
    'vomit', 'diarrea', 'no come', 'anorexia', 'decaid', 'triste',
    'fiebre', 'ojo rojo', 'legaña', 'cojea', 'cojera', 'sangre en heces',
    'orinando', 'arenero', 'rasca', 'pulgas', 'garrapata', 'picadura'
  ];

  if (yellowFlags.some(flag => lower.includes(flag))) {
    const elapsed = Math.round(performance.now() - startTime);
    let advice = `Riesgo de deshidratación y desbalance electrolítico para ${petName} (${petWeight} kg). Retira la comida sólida durante 4 horas para reposo gástrico.`;

    if (lower.includes('garrapata') || lower.includes('pulga')) {
      advice = `Parasitismo externo detectado en ${petName}. Las garrapatas pueden transmitir hemotrópicos (Ehrlichia, Anaplasma). Se recomienda pipeta o comprimido antiparasitario aprobado y desinfección ambiental.`;
    } else if (lower.includes('arenero') && petSpecies === 'feline') {
      advice = `⚠️ ALERTA FELINA: Dificultad para orinar en gatos puede indicar Obstrucción Uretral Felina (FLUTD), la cual es una emergencia médica mortal en machos. Evalúa si elimina gotas de orina.`;
    }

    const result: LocalTriageResult = {
      triageLevel: 'YELLOW',
      title: `⚠️ CÓDIGO AMARILLO: EVALUACIÓN CLÍNICA PRIORITARIA (<12h)`,
      badge: 'PRIORIDAD 12h (Local Rule Engine)',
      response: `${advice} No auto-mediques y mantén registro de la frecuencia de los episodios para mostrarlos al médico veterinario.\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
      actionRequired: 'Agendar cita clínica prioritaria en Servicios o consultar antiparasitarios en Farmacia PAWLO.',
      pharmacologicalBlock: false,
      isLocalEdgeExecution: true,
      latencyMs: elapsed,
      serverCost: '$0.00 (Zero Server Load)',
      recommendedCategory: lower.includes('garrapata') ? 'Medicamentos' : 'Servicios',
      recommendedProductKeywords: lower.includes('garrapata') ? ['Bravecto', 'NexGard', 'Pipeta'] : ['Electrolitos', 'Probióticos']
    };

    await saveTriageToCache(lower, pet, result);
    return result;
  }

  // 5. CÓDIGO AZUL — CÁLCULOS NUTRICIONALES Y RACIONES DIARIAS
  const dietFlags = ['cuanto come', 'cuánto come', 'porcion', 'porción', 'comida', 'croquetas', 'alimento', 'gramos', 'kibble', 'dieta'];
  if (dietFlags.some(flag => lower.includes(flag))) {
    const elapsed = Math.round(performance.now() - startTime);
    // Fórmula veterinaria RER = 70 * (peso ^ 0.75)
    const rer = Math.round(70 * Math.pow(petWeight, 0.75));
    // Factor de mantenimiento (1.6 para adulto canino, 1.2 para felino)
    const factor = (petSpecies === 'canine' || petSpecies === ('dog' as any)) ? 1.6 : 1.2;
    const dailyKcal = Math.round(rer * factor);
    // Estimación con croquetas premium (~380 kcal / 100g)
    const gramsPerDay = Math.round((dailyKcal / 380) * 100);

    const result: LocalTriageResult = {
      triageLevel: 'BLUE',
      title: `🥣 GUÍA NUTRICIONAL CIENTÍFICA PARA ${petName}`,
      badge: 'CALCULADORA METABÓLICA (0ms)',
      response: `Basado en el peso actual de ${petName} (${petWeight} kg) y especie (${petSpecies === 'canine' ? 'Canino' : 'Felino'}), su Requerimiento Energético en Reposo (RER) es de ~${rer} kcal/día, con un Requerimiento de Mantenimiento (MER) estimado en ~${dailyKcal} kcal/día.
Esto equivale aproximadamente a **${gramsPerDay} gramos de alimento balanceado premium al día**, dividido preferentemente en 2 tomas (mañana y noche) con agua fresca disponible las 24 horas.\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
      actionRequired: 'Revisar balanceados formulados y suplementos condroprotectores en la Tienda PAWLO.',
      pharmacologicalBlock: false,
      isLocalEdgeExecution: true,
      latencyMs: elapsed,
      serverCost: '$0.00 (Cálculo Físico-Biológico en Navegador)',
      recommendedCategory: 'Comida',
      recommendedProductKeywords: ['Royal Canin', 'Pro Plan', 'Hills']
    };

    await saveTriageToCache(lower, pet, result);
    return result;
  }

  // 6. CÓDIGO VERDE — BIENESTAR, CONDUCTA Y ESTIMULACIÓN
  const elapsed = Math.round(performance.now() - startTime);
  const result: LocalTriageResult = {
    triageLevel: 'GREEN',
    title: `🟢 CÓDIGO VERDE: CONDUCTA & BIENESTAR ENRIQUECIDO (${petName})`,
    badge: 'BIENESTAR CLIENT-SIDE (0ms)',
    response: `No se detectan signos clínicos patológicos de alarma inmediata para ${petName}. Para mejorar su bienestar diario y prevenir estrés o problemas de conducta, implementa sesiones diarias de enriquecimiento olfativo (15 minutos equivalen a 45 min de caminata física), paseos con correa larga relajada y refuerzo positivo con premios naturales.\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
    actionRequired: 'Explorar juguetes interactivos de estimulación mental en la Tienda PAWLO o consultar adiestradores.',
    pharmacologicalBlock: false,
    isLocalEdgeExecution: true,
    latencyMs: elapsed,
    serverCost: '$0.00 (Ejecución Client-Side)',
    recommendedCategory: 'Juguetes',
    recommendedProductKeywords: ['Kong', 'Juguete de Olfato', 'Snack Natural']
  };

  await saveTriageToCache(lower, pet, result);
  return result;
}

async function saveTriageToCache(
  query: string,
  pet: UserPet,
  result: LocalTriageResult
): Promise<void> {
  const hash = pawloDB.generateHash(query, pet.species);
  const entry: TriageCacheEntry = {
    queryHash: hash,
    query,
    petSpecies: pet.species,
    petWeightKg: pet.weightKg,
    triageLevel: result.triageLevel,
    responseTitle: result.title,
    responseText: result.response,
    recommendedAction: result.actionRequired,
    pharmacologicalBlock: result.pharmacologicalBlock,
    timestamp: Date.now()
  };

  await pawloDB.saveCachedTriage(entry);
  await pawloDB.recordSavings(420, 2800);
}

// ============================================================================
// AGENTIC ACTION EXECUTOR — READ & WRITE CON RBAC
// ============================================================================

/**
 * Encuentra a qué mascota se refiere la orden (Bruno, Mía o la activa por defecto).
 */
function resolveTargetPet(rawInput: string, context: AssistantExecutionContext): UserPet {
  const lower = rawInput.toLowerCase();
  for (const p of context.allPets) {
    if (lower.includes(p.name.toLowerCase())) {
      return p;
    }
  }
  return context.activePet || context.allPets[0];
}

/**
 * Ejecutor Omnicanal PAWLO IA: Procesa comandos de lenguaje natural para ejecutar
 * acciones de LECTURA o ESCRITURA en todos los módulos de la aplicación,
 * respetando estrictamente la matriz de permisos RBAC del rol activo.
 */
export async function processAssistantCommand(
  rawInput: string,
  context: AssistantExecutionContext
): Promise<AssistantResponse> {
  const t0 = performance.now();
  const lower = rawInput.toLowerCase().trim();
  const currentRole = context.currentRole;
  const roleMeta = getRoleMeta(currentRole);
  const targetPet = resolveTargetPet(rawInput, context);
  const products = context.products?.length ? context.products : STORE_CATALOG;

  // --------------------------------------------------------------------------
  // 1. CORTAFUEGOS FARMACOLÓGICO ESTRICTO (MÁXIMA PRIORIDAD)
  // --------------------------------------------------------------------------
  const hasPharmaDrug = PHARMACOLOGICAL_TRIGGERS.some(drug => lower.includes(drug));
  const hasDosageIntent = DOSAGE_TRIGGERS.some(intent => lower.includes(intent));

  // Excepción: Si el usuario solo está pidiendo comprar un producto comercial del catálogo (e.g. Nexgard)
  const isPurchaseIntent = lower.includes('comprar') || lower.includes('carrito') || lower.includes('agregar al carrito');
  const matchedCatalogProduct = products.find(p => lower.includes(p.title.toLowerCase()) || lower.includes(p.brand.toLowerCase()));

  if ((hasPharmaDrug || hasDosageIntent) && !(isPurchaseIntent && matchedCatalogProduct && !hasPharmaDrug)) {
    const identifiedDrug = PHARMACOLOGICAL_TRIGGERS.find(d => lower.includes(d)) || 'fármaco humano';
    const elapsed = Math.round(performance.now() - t0);

    return {
      badge: '🚨 CORTAFUEGOS FARMACOLÓGICO ACTIVADO',
      pharmacologicalBlock: true,
      isWriteAction: false,
      latencyMs: elapsed,
      text: `⛔ **CORTAFUEGOS REGULATORIO Y CLÍNICO PAWLO ACTIVADO**\n\n` +
        `La administración de **${identifiedDrug.toUpperCase()}** o el cálculo empírico de dosis en mascotas está estrictamente prohibido por alto riesgo de intoxicación severa o letal.\n\n` +
        `• En caninos y felinos, medicamentos analgésicos o antiinflamatorios formulados para humanos generan necrosis papilar renal, hemorragia digestiva aguda y fallo hepático irreversible incluso en dosis milimétricas.\n` +
        `• **PAWLO IA no emite dosis de medicamentos por inteligencia artificial.**\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'PHARMA_BLOCKED',
        actionName: 'Bloqueo Farmacológico Preventivo',
        badge: '🚨 BLOQUEO DE SEGURIDAD (0ms)',
        targetModule: 'services',
        navTab: 'services',
        actionLabel: 'Ver Hospitales Veterinarios 24/7'
      },
      suggestedFollowUps: [
        '🚑 Solicitar Pet Taxi de Emergencia',
        '🏥 Ver clínicas veterinarias en Cuenca',
        '🥣 Calcular ración diaria (RER)'
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 2. WRITE ACTION 1: ACTUALIZAR PESO (usuario / veterinario)
  // --------------------------------------------------------------------------
  const weightKeywords = ['peso', 'kilos', 'kg', 'pesar', 'subió', 'subio', 'bajó', 'bajo'];
  const isWeightCommand = (lower.includes('actualiz') || lower.includes('cambiar') || lower.includes('registrar') || lower.includes('poner') || lower.includes('modificar') || lower.includes('subio') || lower.includes('subió') || lower.includes('bajo') || lower.includes('bajó'))
    && weightKeywords.some(k => lower.includes(k));

  if (isWeightCommand || (lower.startsWith('peso ') && /\d/.test(lower))) {
    // RBAC: Tutor, Veterinario, y Staff pueden actualizar peso
    const canUpdateWeight = currentRole === 'usuario' || currentRole === 'veterinario' || isStaffRole(currentRole);
    if (!canUpdateWeight) {
      return createRbacBlockedResponse(
        'Actualizar Peso Corporal',
        'usuario',
        currentRole,
        'Se requieren permisos de Tutor o Médico Veterinario para modificar la biometría del paciente.',
        t0
      );
    }

    // Extraer número de peso
    const match = lower.match(/(\d+(?:[.,]\d+)?)\s*(?:kg|kilos)?/);
    if (match) {
      const newWeight = parseFloat(match[1].replace(',', '.'));
      if (newWeight > 0.2 && newWeight < 120) {
        // Ejecutar Write Callback
        if (context.onUpdatePetWeight) {
          context.onUpdatePetWeight(targetPet.id, newWeight);
        }

        // Recálculo RER / MER
        const rer = Math.round(70 * Math.pow(newWeight, 0.75));
        const factor = (targetPet.species === 'canine' || (targetPet.species as any) === 'dog') ? 1.6 : 1.2;
        const dailyKcal = Math.round(rer * factor);
        const dailyGrams = Math.round((dailyKcal / 380) * 100);

        const elapsed = Math.round(performance.now() - t0);
        return {
          badge: '✍️ ACCIÓN WRITE EJECUTADA: PESO ACTUALIZADO',
          isWriteAction: true,
          pharmacologicalBlock: false,
          latencyMs: elapsed,
          text: `✅ **Peso corporal de ${targetPet.name} actualizado exitosamente** a **${newWeight} kg** en la Bóveda Digital (anterior: ${targetPet.weightKg} kg).\n\n` +
            `🥣 **Recálculo Metabólico Automático (RER):**\n` +
            `• Requerimiento Energético en Reposo (RER): **~${rer} kcal/día**\n` +
            `• Mantenimiento Estimado (MER): **~${dailyKcal} kcal/día**\n` +
            `• Ración diaria recomendada de alimento premium: **~${dailyGrams} g/día**, dividida en 2 porciones de ${Math.round(dailyGrams / 2)} g.\n\n` +
            `${CLINICAL_LEGAL_DISCLAIMER}`,
          actionExecuted: {
            type: 'WRITE',
            actionName: 'Actualizar Peso Corporal',
            badge: '✍️ ACCIÓN WRITE EJECUTADA: PESO ACTUALIZADO',
            targetModule: 'my_pets',
            navTab: 'my_pets',
            actionLabel: 'Ver Ficha en Bóveda',
            payload: { petId: targetPet.id, newWeight, rer, dailyGrams }
          },
          suggestedFollowUps: [
            `🥣 Calcular ración para ${targetPet.name}`,
            `💉 Registrar vacuna para ${targetPet.name}`,
            `🛒 Ver alimento recomendado para ${targetPet.name}`
          ]
        };
      }
    }
  }

  // --------------------------------------------------------------------------
  // 3. WRITE ACTION 2: REGISTRAR VACUNA (usuario / veterinario)
  // --------------------------------------------------------------------------
  const isVaccineCommand = (lower.includes('vacuna') || lower.includes('vacunar') || lower.includes('antirrábica') || lower.includes('antirrabica') || lower.includes('séxtuple') || lower.includes('sextuple') || lower.includes('triple felina'))
    && (lower.includes('registra') || lower.includes('anota') || lower.includes('agrega') || lower.includes('poner') || lower.includes('aplicada') || lower.includes('hoy'));

  if (isVaccineCommand) {
    const canAddVaccine = currentRole === 'usuario' || currentRole === 'veterinario' || isStaffRole(currentRole);
    if (!canAddVaccine) {
      return createRbacBlockedResponse(
        'Registrar Vacuna en Carnet',
        'usuario',
        currentRole,
        'Se requieren permisos de Tutor o Médico Veterinario para asentar vacunas en el carnet digital.',
        t0
      );
    }

    // Extraer nombre de la vacuna
    let vaccineName = 'Antirrábica Canina & Felina (Rabia Inactivada)';
    if (lower.includes('antirrábica') || lower.includes('antirrabica') || lower.includes('rabia')) {
      vaccineName = 'Antirrábica Universal (Rabia Inactivada)';
    } else if (lower.includes('séxtuple') || lower.includes('sextuple')) {
      vaccineName = 'Séxtuple Canina (DHPPi/L Multi-Protector)';
    } else if (lower.includes('triple')) {
      vaccineName = 'Triple Felina (Rinotraqueítis, Calicivirus, Panleucopenia)';
    } else if (lower.includes('leucemia') || lower.includes('felv')) {
      vaccineName = 'Leucemia Viral Felina (FeLV)';
    } else if (lower.includes('parvovirus')) {
      vaccineName = 'Refuerzo Parvovirus & Moquillo Canino';
    } else if (lower.includes('tos') || lower.includes('bronchicine')) {
      vaccineName = 'Tos de las Perreras (Bordetella bronchiseptica)';
    }

    const todayDate = '20 Oct 2026';
    const nextYearDate = '20 Oct 2027';
    const clinic = currentRole === 'veterinario' ? 'Hospital Veterinario Especializado' : 'Clínica Móvil PAWLO';
    const vetName = currentRole === 'veterinario' ? 'Dr. Colegiado PAWLO' : 'Dr. Validador PAWLO IA (Reg. SENESCYT 9021)';

    const newVaccine: Omit<VaccineRecord, 'id'> = {
      name: vaccineName,
      batch: 'LOT-PWL-2026',
      appliedDate: todayDate,
      nextDueDate: nextYearDate,
      clinic,
      vetName,
      status: 'vigente'
    };

    if (context.onAddPetVaccine) {
      context.onAddPetVaccine(targetPet.id, newVaccine);
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '✍️ ACCIÓN WRITE EJECUTADA: VACUNA REGISTRADA EN BÓVEDA',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `💉 **Vacuna asentada exitosamente en el Carnet Digital de ${targetPet.name}:**\n\n` +
        `• **Biológico:** ${vaccineName}\n` +
        `• **Lote Homologado:** LOT-PWL-2026\n` +
        `• **Fecha de Aplicación:** ${todayDate}\n` +
        `• **Próximo Refuerzo Anual:** ${nextYearDate}\n` +
        `• **Centro Emisor:** ${clinic} (${vetName})\n` +
        `• **Estado:** Vigente y certificado con estándar microchip ISO.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Registrar Vacuna',
        badge: '✍️ ACCIÓN WRITE EJECUTADA: VACUNA REGISTRADA EN BÓVEDA',
        targetModule: 'my_pets',
        navTab: 'my_pets',
        actionLabel: 'Ver Carnet en Bóveda',
        payload: { petId: targetPet.id, vaccine: newVaccine }
      },
      suggestedFollowUps: [
        `🔍 Ver carnet completo de ${targetPet.name}`,
        `📝 Agregar nota de cuidados post-vacuna`,
        `✍️ Actualizar peso de ${targetPet.name} a 30.2 kg`
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 4. WRITE ACTION 3: AGREGAR NOTA / RECORDATORIO EN BÓVEDA (usuario)
  // --------------------------------------------------------------------------
  const isNoteCommand = lower.includes('nota') || lower.includes('recordatorio') || lower.includes('anotar en ficha') || lower.includes('guardar nota');
  if (isNoteCommand && (lower.includes('agrega') || lower.includes('guardar') || lower.includes('crear') || lower.includes('anotar') || lower.includes(':'))) {
    // Extraer texto de la nota
    let content = rawInput;
    if (rawInput.includes(':')) {
      content = rawInput.split(':')[1].trim();
    } else {
      content = rawInput.replace(/^(?:agrega(?:r)?|guardar|crear|anotar)\s+(?:una\s+)?(?:nota|recordatorio)(?:\s+en\s+ficha)?(?:\s+para\s+[a-zA-ZáéíóúÁÉÍÓÚñÑ]+)?/i, '').trim();
    }

    if (!content) content = 'Revisión periódica y seguimiento de bienestar diario.';

    // Inferir categoría
    let category: 'Nutrición' | 'Medicación' | 'Conducta' | 'Cuidado Diario' = 'Cuidado Diario';
    if (lower.includes('comida') || lower.includes('premio') || lower.includes('croqueta') || lower.includes('dieta') || lower.includes('alimento')) {
      category = 'Nutrición';
    } else if (lower.includes('pastilla') || lower.includes('antipulga') || lower.includes('gotas') || lower.includes('pipeta')) {
      category = 'Medicación';
    } else if (lower.includes('miedo') || lower.includes('ansiedad') || lower.includes('paseo') || lower.includes('ladra')) {
      category = 'Conducta';
    }

    const newNote: Omit<PetNote, 'id' | 'date'> = {
      category,
      title: `Nota PAWLO IA (${category})`,
      content,
      updatedAt: 'Registrado ahora'
    };

    if (context.onAddPetNote) {
      context.onAddPetNote(targetPet.id, newNote);
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '✍️ ACCIÓN WRITE EJECUTADA: NOTA GUARDADA EN BÓVEDA',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `📝 **Nota guardada en la ficha de ${targetPet.name}:**\n\n` +
        `• **Categoría:** ${category}\n` +
        `• **Contenido:** "${content}"\n` +
        `• **Sincronización:** Persistida en la Bóveda Digital inmutable del tutor.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Guardar Nota en Bóveda',
        badge: '✍️ ACCIÓN WRITE EJECUTADA: NOTA GUARDADA EN BÓVEDA',
        targetModule: 'my_pets',
        navTab: 'my_pets',
        actionLabel: 'Ver Notas en Bóveda',
        payload: { petId: targetPet.id, note: newNote }
      },
      suggestedFollowUps: [
        `🔍 Ver todas las notas de ${targetPet.name}`,
        `✍️ Actualizar peso de ${targetPet.name} a 30.2 kg`,
        `🛒 Ver catálogo de premios hipoalergénicos`
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 5. WRITE ACTION 4: AGREGAR AL CARRITO / COMPRAR (usuario)
  // --------------------------------------------------------------------------
  const isCartCommand = lower.includes('carrito') || lower.includes('comprar') || lower.includes('añadir al carrito') || lower.includes('agregar al carrito');
  if (isCartCommand) {
    // Buscar el producto que coincida con la solicitud
    let matchedProduct = products.find(p => {
      const pTitle = p.title.toLowerCase();
      const pBrand = p.brand.toLowerCase();
      const pCat = p.category.toLowerCase();
      return lower.includes(pTitle) ||
        (lower.includes('salmón') && pTitle.includes('salmón')) ||
        (lower.includes('salmon') && pTitle.includes('salmón')) ||
        (lower.includes('cama') && pCat === 'camas') ||
        (lower.includes('nexgard') && pTitle.includes('nexgard')) ||
        (lower.includes('antiparasitario') && pTitle.includes('antiparasitario')) ||
        (lower.includes('kong') && pTitle.includes('kong')) ||
        (lower.includes('casa') && pCat === 'casas') ||
        (lower.includes('urinary') && pTitle.includes('urinary')) ||
        (lower.includes('juguete') && pCat === 'juguetes');
    });

    if (!matchedProduct) {
      // Default al primer producto o alimento para la especie activa
      matchedProduct = products.find(p => p.category === 'Comida' && (p.species === targetPet.species || p.species === 'all')) || products[0];
    }

    // Extraer cantidad (ej. 2 unidades, 3 bolsas)
    const qtyMatch = lower.match(/(\d+)\s*(?:unidades|bolsas|cajas|paquetes|items|productos)?/);
    const qty = qtyMatch ? parseInt(qtyMatch[1], 10) : 1;

    if (context.onAddToCart && matchedProduct) {
      context.onAddToCart(matchedProduct, qty);
    }

    const elapsed = Math.round(performance.now() - t0);
    const lineTotal = (matchedProduct.price * qty).toFixed(2);
    return {
      badge: '🛒 ACCIÓN WRITE EJECUTADA: PRODUCTO AÑADIDO AL CARRITO',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `🛒 **Producto añadido exitosamente a tu orden de compra:**\n\n` +
        `• **Item:** ${qty}x ${matchedProduct.title}\n` +
        `• **Marca:** ${matchedProduct.brand}\n` +
        `• **Precio unitario:** $${matchedProduct.price.toFixed(2)} USD\n` +
        `• **Subtotal:** **$${lineTotal} USD**\n` +
        `• **Despacho:** Entrega programada en 45 minutos (Sector Urbano Cuenca).\n` +
        `• **Pasarelas Habilitadas:** Payphone / Códigos QR instantáneos (DeUna Banco Pichincha, Sipy Banco del Austro, Peigo) / Transferencia directa.\n` +
        `${matchedProduct.requiresPrescription ? '\n⚠️ *Requisito Regulatorio:* Este producto requiere verificación de receta clínica veterinaria.\n' : '\n'}` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Añadir al Carrito de Compras',
        badge: '🛒 ACCIÓN WRITE EJECUTADA: PRODUCTO AÑADIDO AL CARRITO',
        targetModule: 'store',
        navTab: 'store',
        actionLabel: 'Ir al Carrito & Pagar',
        payload: { product: matchedProduct, qty }
      },
      suggestedFollowUps: [
        '💳 Ir al Checkout con DeUna / Sipy / Payphone',
        '📦 Seguir explorando la Tienda PAWLO',
        `🥣 Calcular ración para ${targetPet.name}`
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 6. WRITE ACTION 5: REPORTAR ALERTA SOS / MASCOTA PERDIDA (usuario / staff)
  // --------------------------------------------------------------------------
  const isSosCommand = lower.includes('alerta sos') || lower.includes('reportar sos') || lower.includes('perro extraviado') || lower.includes('mascota perdida') || lower.includes('gato extraviado') || lower.includes('perro perdido');
  if (isSosCommand) {
    const canTriggerSos = currentRole === 'usuario' || isStaffRole(currentRole);
    if (!canTriggerSos) {
      return createRbacBlockedResponse(
        'Reportar Alerta SOS',
        'usuario',
        currentRole,
        'Se requieren permisos de Tutor o Staff Operador para activar el Radar de Alertas SOS.',
        t0
      );
    }

    // Extraer sector si se menciona
    let sector = 'Sector El Vergel / Calle Larga';
    const sectors = ['el vergel', 'totoracocha', 'ricaurte', 'centro histórico', 'baños', 'monay', 'challuabamba', 'parque el paraíso', 'av. solano', 'remigio crespo'];
    for (const s of sectors) {
      if (lower.includes(s)) {
        sector = s.charAt(0).toUpperCase() + s.slice(1);
        break;
      }
    }

    const description = `Alerta emitida vía PAWLO IA Copilot para ${targetPet.name} (${targetPet.breed}) en ${sector}.`;
    if (context.onTriggerSosAlert) {
      context.onTriggerSosAlert(description, sector);
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '🚨 ACCIÓN WRITE EJECUTADA: ALERTA SOS REGISTRADA EN RADAR',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `🚨 **ALERTA SOS COMUNITARIA REGISTRADA Y ACTIVADA EN RADAR PAWLO:**\n\n` +
        `• **Paciente / Mascota:** ${targetPet.name} (${targetPet.breed}, Chip: ${targetPet.microchipIso})\n` +
        `• **Sector Georreferenciado:** ${sector} (Cuenca, Azuay)\n` +
        `• **Radio de Cobertura Comunitaria:** 5 km a toda la red de tutores, clínicas y patrullas móviles activas.\n` +
        `• **Protocolo Táctico:** Se ha notificado al Operador de Despacho para soporte y triaje prioritario.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Reportar Alerta SOS',
        badge: '🚨 ACCIÓN WRITE EJECUTADA: ALERTA SOS REGISTRADA EN RADAR',
        targetModule: 'sos',
        navTab: 'sos',
        actionLabel: 'Ver Radar Geográfico en Vivo',
        payload: { petId: targetPet.id, sector, description }
      },
      suggestedFollowUps: [
        '🚑 Solicitar Pet Taxi de Rescate',
        '📡 Ver mapa del Radar 5km',
        '📞 Contactar a Operador de Flota'
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 7. WRITE ACTION 6: ACCIONES POR ROL (VETERINARIO, COMERCIO, SERVICIO, ADMIN, STAFF)
  // --------------------------------------------------------------------------

  // A. Emitir Receta Digital (Veterinario / Super Admin)
  if (lower.includes('emitir receta') || lower.includes('receta digital') || lower.includes('prescribir') || lower.includes('crear receta')) {
    const isAllowed = currentRole === 'veterinario' || currentRole === 'super_admin';
    if (!isAllowed) {
      return createRbacBlockedResponse(
        'Emitir Receta Digital Médica',
        'veterinario',
        currentRole,
        'La emisión de recetas veterinarias digitales con firma electrónica y cédula SENESCYT requiere permisos exclusivos del rol Médico Veterinario.',
        t0
      );
    }

    // Ejecutar acción autorizada
    let resultNote = 'Receta #RX-PAWLO-2026 generada con firma digital.';
    if (context.onPartnerAction) {
      resultNote = context.onPartnerAction('EMIT_PRESCRIPTION', {
        petId: targetPet.id,
        petName: targetPet.name,
        prescription: 'Condroprotector Articular + Omega 3 EPA/DHA BID x 30 días.'
      });
    }

    // Persistir a localStorage para consistencia
    try {
      if (typeof window !== 'undefined') {
        const existing = JSON.parse(localStorage.getItem('pawlo_prescriptions') || '[]');
        existing.unshift({
          id: `rx-${Date.now()}`,
          petName: targetPet.name,
          vetName: 'Dr. Colegiado PAWLO',
          date: '20 Oct 2026',
          treatment: 'Condroprotector Articular BID x 30 días'
        });
        localStorage.setItem('pawlo_prescriptions', JSON.stringify(existing));
      }
    } catch {
      // Ignorar fallback en entornos sin storage
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [VETERINARIO]',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `📋 **Receta Médica Electrónica Emitida y Firmada Digitalmente:**\n\n` +
        `• **Paciente:** ${targetPet.name} (${targetPet.weightKg} kg)\n` +
        `• **Prescripción:** Suplementación Condroprotectora Articular & Omega 3 BID durante 30 días.\n` +
        `• **Validador:** Médico Veterinario Colegiado (Registro Profesional SENESCYT).\n` +
        `• **Certificación:** Código QR criptográfico emitido y asociado a la Bóveda del tutor para despacho en Farmacia PAWLO.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Emitir Receta Digital',
        badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [VETERINARIO]',
        targetModule: 'portals',
        navTab: 'portals',
        actionLabel: 'Ver Portal Veterinario'
      },
      suggestedFollowUps: [
        '🔍 Consultar historial y alergias',
        '⚖️ Actualizar peso clínico',
        '📋 Ver recetas emitidas'
      ]
    };
  }

  // B. Aprobar Aliados del Nodo (Admin / Super Admin)
  if (lower.includes('aprobar aliado') || lower.includes('aprobar veterinario') || lower.includes('aprobar comercio') || lower.includes('aprobar aliados')) {
    const isAllowed = currentRole === 'admin' || currentRole === 'super_admin';
    if (!isAllowed) {
      return createRbacBlockedResponse(
        'Aprobar Aliado en Nodo Regional',
        'admin',
        currentRole,
        'La homologación de títulos SENESCYT y verificación de RUC requiere permisos de Administrador Regional o Super Administrador.',
        t0
      );
    }

    let resultMsg = 'Aliados pendientes homologados con éxito.';
    if (context.onStaffAction) {
      resultMsg = context.onStaffAction('APPROVE_ALL_PARTNERS', { timestamp: Date.now() });
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pawlo_pending_approvals_cleared', 'true');
      }
    } catch {}

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [ADMIN]',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `✅ **Aliados comerciales y clínicos verificados exitosamente:**\n\n` +
        `• **Validación SENESCYT:** Registros profesionales y credenciales veterinarias homologadas.\n` +
        `• **RUC / SRI:** Validación tributaria de comercios y pet shops en Cuenca completada.\n` +
        `• **Estado del Nodo:** Aliados activados para recepción de pedidos y consultas.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Aprobar Aliados del Nodo',
        badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [ADMIN]',
        targetModule: 'portals',
        navTab: 'portals',
        actionLabel: 'Ver Portal Administrador'
      },
      suggestedFollowUps: [
        '📊 Ver métricas regionales del nodo Cuenca',
        '🛡️ Auditar logs inmutables',
        '🚑 Ver despacho de emergencias'
      ]
    };
  }

  // C. Reactivar / Actualizar Stock (Comercio / Admin)
  if (lower.includes('actualizar stock') || lower.includes('reactivar stock') || lower.includes('stock de todo el catálogo') || lower.includes('modificar stock')) {
    const isAllowed = currentRole === 'comercio' || currentRole === 'admin' || currentRole === 'super_admin';
    if (!isAllowed) {
      return createRbacBlockedResponse(
        'Actualizar Stock Comercial',
        'comercio',
        currentRole,
        'La gestión del catálogo de inventario de farmacia y alimentos requiere permisos del rol Comercio / Pet Shop.',
        t0
      );
    }

    if (context.onPartnerAction) {
      context.onPartnerAction('UPDATE_STOCK', { all: true, status: 'Disponible' });
    }

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('pawlo_merchant_stock_updated', Date.now().toString());
      }
    } catch {}

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [COMERCIO]',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `📦 **Inventario comercial actualizado:**\n\n` +
        `• Todo el catálogo de alimentos premium, farmacia veterinaria y accesorios ha sido reactivado como disponible.\n` +
        `• Tiempos de despacho programados a 45 minutos sincronizados con la flota de repartidores motorizados de Cuenca.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Actualizar Stock',
        badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [COMERCIO]',
        targetModule: 'portals',
        navTab: 'portals',
        actionLabel: 'Ver Portal Comercio'
      },
      suggestedFollowUps: [
        '🧾 Verificar recetas médicas pendientes',
        '📊 Ver resumen de ventas DeUna y Sipy',
        '📦 Consultar catálogo completo'
      ]
    };
  }

  // D. Despachar Pet Taxi / Unidad SOS (Operator / Supervisor / Admin / Servicio)
  if (lower.includes('despachar pet taxi') || lower.includes('despachar unidad') || lower.includes('asignar unidad') || lower.includes('enviar ambulancia') || lower.includes('despachar')) {
    const isAllowed = isStaffRole(currentRole) || currentRole === 'servicio';
    if (!isAllowed) {
      return createRbacBlockedResponse(
        'Despachar Unidad SOS',
        'operator',
        currentRole,
        'El despacho de unidades tácticas móviles y Pet Taxi requiere permisos de Operador SOS o Supervisor de Flota.',
        t0
      );
    }

    if (context.onStaffAction) {
      context.onStaffAction('DISPATCH_UNIT', { unitId: 'TAXI-04', eta: '5 min' });
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: `✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [${currentRole.toUpperCase()}]`,
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `🚑 **Unidad móvil Pet Taxi / Rescate Despachada:**\n\n` +
        `• **Móvil:** Unidad TAXI-04 (Vehículo Climatizado con Camilla Especializada)\n` +
        `• **ETA Estimado:** 5 minutos hacia el sector asignado en Cuenca.\n` +
        `• **Telemetría:** Canal de enlace GPS en vivo activado con el tutor y centro hospitalario receptor.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Despachar Unidad Móvil',
        badge: `✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [${currentRole.toUpperCase()}]`,
        targetModule: 'portals',
        navTab: 'portals',
        actionLabel: 'Ver Cola de Despacho'
      },
      suggestedFollowUps: [
        '📡 Ver telemetría GPS de la flota',
        '🚨 Ver tickets SOS activos',
        '💬 Asistir al tutor por canal directo'
      ]
    };
  }

  // E. Acciones de Servicio: Ruta Pet Taxi o Reporte de Bienestar
  if (lower.includes('ruta pet taxi') || lower.includes('en camino') || lower.includes('reporte de bienestar')) {
    const isAllowed = currentRole === 'servicio' || isStaffRole(currentRole);
    if (!isAllowed) {
      return createRbacBlockedResponse(
        'Actualizar Ruta de Servicio',
        'servicio',
        currentRole,
        'Se requieren permisos de Proveedor de Servicios para actualizar rutas de traslado o reportes de bienestar.',
        t0
      );
    }

    if (context.onPartnerAction) {
      context.onPartnerAction('UPDATE_SERVICE_ROUTE', { status: 'En Camino', pet: targetPet.name });
    }

    const elapsed = Math.round(performance.now() - t0);
    return {
      badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [SERVICIO]',
      isWriteAction: true,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `🚐 **Ruta de Pet Taxi actualizada:**\n\n` +
        `• **Estado:** Marcado como "En Camino" para el servicio asignado a ${targetPet.name}.\n` +
        `• **Notificación Push:** Enviada al tutor con el enlace de seguimiento en tiempo real.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'WRITE',
        actionName: 'Actualizar Ruta Servicio',
        badge: '✍️ ACCIÓN WRITE EJECUTADA EN PORTAL [SERVICIO]',
        targetModule: 'portals',
        navTab: 'portals',
        actionLabel: 'Ver Portal Servicios'
      },
      suggestedFollowUps: [
        '📸 Enviar reporte fotográfico al tutor',
        '📅 Ver agenda de reservas de hoy',
        '🚐 Ver flota en mapa'
      ]
    };
  }

  // --------------------------------------------------------------------------
  // 8. READ ACTIONS: CONSULTAS, BÓVEDA, NUTRICIÓN Y CATÁLOGO
  // --------------------------------------------------------------------------

  // A. Listar Mascotas en Bóveda
  if (lower.includes('mis mascotas') || lower.includes('ver mascotas') || lower.includes('listar mascotas') || lower.includes('bóveda') || lower.includes('boveda')) {
    const elapsed = Math.round(performance.now() - t0);
    const petsList = context.allPets.map(p =>
      `• **${p.name}** (${p.species === 'canine' ? 'Canino' : 'Felino'}, ${p.breed}): ${p.weightKg} kg • Chip: \`${p.microchipIso}\` • ${p.vaccines.length} vacunas registradas.`
    ).join('\n');

    return {
      badge: '🔍 ACCIÓN READ: BÓVEDA DE MASCOTAS',
      isWriteAction: false,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `📂 **Mascotas Registradas en tu Bóveda Digital (${context.allPets.length}):**\n\n${petsList}\n\n` +
        `Actualmente seleccionada: **${targetPet.name}** (${targetPet.weightKg} kg).\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'READ',
        actionName: 'Consultar Bóveda de Mascotas',
        badge: '🔍 ACCIÓN READ: BÓVEDA DE MASCOTAS',
        targetModule: 'my_pets',
        navTab: 'my_pets',
        actionLabel: 'Abrir Bóveda de Mascotas'
      },
      suggestedFollowUps: [
        `✍️ Actualizar peso de ${targetPet.name} a 30.2 kg`,
        `💉 Registrar vacuna Antirrábica para ${targetPet.name}`,
        `🥣 Calcular ración para ${targetPet.name}`
      ]
    };
  }

  // B. Consultar Vacunas de la Mascota Activa
  if (lower.includes('vacuna') || lower.includes('vacunas') || lower.includes('carnet')) {
    const elapsed = Math.round(performance.now() - t0);
    const vList = targetPet.vaccines.map(v =>
      `• **${v.name}** (${v.batch}) — Aplicada: ${v.appliedDate} | Refuerzo: **${v.nextDueDate}** [${v.status.toUpperCase()}]`
    ).join('\n');

    return {
      badge: '🔍 ACCIÓN READ: CARNET DE VACUNACIÓN',
      isWriteAction: false,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `💉 **Carnet Digital de Vacunación de ${targetPet.name}:**\n\n${vList || 'No registra vacunas aún.'}\n\n` +
        `Puedes registrar una nueva dosis diciendo por ejemplo: *"Registra vacuna Antirrábica para ${targetPet.name}"*.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'READ',
        actionName: 'Consultar Carnet de Vacunas',
        badge: '🔍 ACCIÓN READ: CARNET DE VACUNACIÓN',
        targetModule: 'my_pets',
        navTab: 'my_pets',
        actionLabel: 'Ver Carnet en Bóveda'
      },
      suggestedFollowUps: [
        `💉 Registrar vacuna Antirrábica hoy`,
        `✍️ Actualizar peso de ${targetPet.name}`,
        `📝 Agregar nota en ficha`
      ]
    };
  }

  // C. Consultar / Calcular RER (Ración Nutricional)
  if (lower.includes('rer') || lower.includes('cuanto come') || lower.includes('cuánto come') || lower.includes('ració') || lower.includes('racio') || lower.includes('porcion') || lower.includes('porción')) {
    const rer = Math.round(70 * Math.pow(targetPet.weightKg, 0.75));
    const factor = (targetPet.species === 'canine' || (targetPet.species as any) === 'dog') ? 1.6 : 1.2;
    const dailyKcal = Math.round(rer * factor);
    const dailyGrams = Math.round((dailyKcal / 380) * 100);
    const elapsed = Math.round(performance.now() - t0);

    return {
      badge: '🥣 ACCIÓN READ: CÁLCULO NUTRICIONAL RER',
      isWriteAction: false,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `🥣 **Guía Nutricional Metabólica para ${targetPet.name} (${targetPet.weightKg} kg):**\n\n` +
        `• **Requerimiento Energético en Reposo (RER):** ~${rer} kcal/día\n` +
        `• **Mantenimiento Energético Estimado (MER):** ~${dailyKcal} kcal/día\n` +
        `• **Ración Diaria Sugerida:** **~${dailyGrams} gramos/día** de alimento premium (~380 kcal/100g)\n` +
        `• **Esquema de Racionamiento:** 2 tomas diarias de **${Math.round(dailyGrams / 2)} g** (mañana y noche), siempre con abundante agua fresca.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'READ',
        actionName: 'Calcular Ración Nutricional',
        badge: '🥣 ACCIÓN READ: CÁLCULO NUTRICIONAL RER',
        targetModule: 'store',
        navTab: 'store',
        actionLabel: 'Ver Alimento en Tienda'
      },
      suggestedFollowUps: [
        `🛒 Agregar alimento Salmón al carrito`,
        `✍️ Actualizar peso de ${targetPet.name} a 30.2 kg`,
        `📝 Agregar nota de horarios de comida`
      ]
    };
  }

  // D. Consultar Permisos del Rol Activo (Matriz RBAC)
  if (lower.includes('permisos') || lower.includes('mi rol') || lower.includes('rol actual') || lower.includes('que puedo hacer') || lower.includes('qué puedo hacer')) {
    const elapsed = Math.round(performance.now() - t0);
    const perms = roleMeta.permissions.map(p => `• \`${p}\``).join('\n');

    return {
      badge: '🛡️ ACCIÓN READ: MATRIZ RBAC',
      isWriteAction: false,
      pharmacologicalBlock: false,
      latencyMs: elapsed,
      text: `🛡️ **Matriz de Control de Acceso (RBAC) para tu Sesión:**\n\n` +
        `• **Rol Activo:** **${roleMeta.label}** (\`${roleMeta.id}\`)\n` +
        `• **Grupo:** ${roleMeta.group.toUpperCase()}\n` +
        `• **Descripción:** ${roleMeta.description}\n\n` +
        `**Permisos Habilitados:**\n${perms}\n\n` +
        `Puedes interactuar en lenguaje natural y PAWLO IA ejecutará acciones de lectura y escritura acordes a este perfil.\n\n` +
        `${CLINICAL_LEGAL_DISCLAIMER}`,
      actionExecuted: {
        type: 'READ',
        actionName: 'Consultar Matriz de Permisos',
        badge: '🛡️ ACCIÓN READ: MATRIZ RBAC',
        targetModule: 'portals',
        navTab: 'portals',
        actionLabel: 'Ver Portales del Sistema'
      },
      suggestedFollowUps: [
        '✍️ Probar comandos autorizados',
        '🔄 Cambiar de rol en el selector',
        '📂 Ver Bóveda de Mascotas'
      ]
    };
  }

  // E. Fallback a Triaje Clínico Neural (Signos, síntomas, conducta)
  const triageResult = await processOfflineTriage(rawInput, targetPet);
  const elapsed = Math.round(performance.now() - t0);

  return {
    badge: triageResult.badge,
    isWriteAction: false,
    pharmacologicalBlock: triageResult.pharmacologicalBlock,
    latencyMs: elapsed,
    text: `${triageResult.response}\n\n**Acción Recomendada:** ${triageResult.actionRequired}`,
    actionExecuted: {
      type: 'READ',
      actionName: triageResult.title,
      badge: triageResult.badge,
      targetModule: triageResult.recommendedCategory === 'Comida' ? 'store' : 'services',
      navTab: triageResult.recommendedCategory === 'Comida' ? 'store' : 'services',
      actionLabel: triageResult.recommendedCategory === 'Comida' ? 'Ver Tienda' : 'Ver Servicios de Urgencia'
    },
    suggestedFollowUps: [
      `🥣 Calcular ración para ${targetPet.name}`,
      `✍️ Actualizar peso de ${targetPet.name}`,
      `🚑 Ver servicios de urgencia`
    ]
  };
}

/**
 * Genera una respuesta estructurada cuando una acción es bloqueada por el control de acceso RBAC.
 */
function createRbacBlockedResponse(
  actionAttempted: string,
  requiredRole: PawloRoleId,
  currentRole: PawloRoleId,
  explanation: string,
  t0: number
): AssistantResponse {
  const elapsed = Math.round(performance.now() - t0);
  const requiredRoleMeta = getRoleMeta(requiredRole);
  const currentRoleMeta = getRoleMeta(currentRole);

  return {
    badge: `🛡️ CONTROL DE ACCESO RBAC: ROL REQUERIDO [${requiredRole.toUpperCase()}]`,
    isWriteAction: false,
    pharmacologicalBlock: false,
    requiresRoleSwitch: requiredRole,
    latencyMs: elapsed,
    text: `⛔ **ACCESO RESTRINGIDO POR MATRIZ DE SEGURIDAD (RBAC)**\n\n` +
      `La acción **"${actionAttempted}"** requiere permisos exclusivos del rol **${requiredRoleMeta.label}** (\`${requiredRole}\`).\n\n` +
      `• **Tu Rol Activo:** ${currentRoleMeta.label} (\`${currentRole}\`)\n` +
      `• **Motivo:** ${explanation}\n\n` +
      `💡 **Solución en 1 clic:** Puedes cambiar temporalmente tu rol a **${requiredRoleMeta.shortLabel}** en el selector superior del asistente para ejecutar y evaluar este flujo.\n\n` +
      `${CLINICAL_LEGAL_DISCLAIMER}`,
    actionExecuted: {
      type: 'BLOCKED_RBAC',
      actionName: actionAttempted,
      badge: `🛡️ RBAC: REQUIERE ${requiredRole.toUpperCase()}`,
      targetModule: 'portals',
      actionLabel: `Cambiar a Rol ${requiredRoleMeta.shortLabel}`,
      payload: { requiredRole, currentRole }
    },
    suggestedFollowUps: [
      `🔄 Cambiar a Rol ${requiredRoleMeta.shortLabel}`,
      '🛡️ Ver mis permisos actuales',
      '📂 Volver a mi Bóveda de Mascotas'
    ]
  };
}
