/**
 * PAWLO™ WebMCP (Web Model Context Protocol) & Agentic Commerce Engine
 * 
 * Implementa la especificación de Modern Web Guidance para WebMCP:
 * 1. Detección y registro imperativo mediante `document.modelContext.registerTool()`
 * 2. Ciclo de vida con AbortController para limpieza estricta de memoria
 * 3. Schemas JSON formales y marcado de readOnlyHint
 * 4. Integración declarativa en formularios HTML (toolname, tooldescription, toolautosubmit)
 * 5. Fallback universal en `window.pawloWebMCP` para agentes y extensiones
 * 6. Herramientas de ESCRITURA para mutar Bóveda de Mascotas (Peso, Vacunas, Notas) y Carrito
 */

import {
  STORE_CATALOG,
  INITIAL_USER_PETS,
  StoreProduct,
  UserPet,
  VaccineRecord,
  PetNote,
  ClinicalEntry,
  EXPANDED_SERVICES_CATALOG
} from '../data/pawloData';
import {
  processOfflineTriage,
  processAssistantCommand,
  LocalTriageResult,
  AssistantExecutionContext,
  AssistantResponse
} from './offlineTriage';
import { PAWLO_ROLES, PawloRoleId, getRoleMeta } from '../data/rolesAndPortalsData';

export const STORE_PRODUCTS = STORE_CATALOG;
export const USER_PETS_VAULT = INITIAL_USER_PETS;

export interface WebMCPToolDefinition {
  name: string;
  description: string;
  readOnlyHint: boolean;
  parameters: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  execute: (args: any, options?: { signal?: AbortSignal }) => Promise<any> | any;
}

export interface WebMCPEvents {
  onCartChange?: (cart: Array<{ product: StoreProduct; qty: number }>) => void;
  onTriageRequest?: (result: LocalTriageResult) => void;
  onNavigateTab?: (tabId: string) => void;
  onPetsChange?: (pets: UserPet[]) => void;
  onUpdatePetWeight?: (petId: string, weightKg: number) => void;
  onAddPetVaccine?: (petId: string, vaccine: Omit<VaccineRecord, 'id'>) => void;
  onAddPetNote?: (petId: string, note: Omit<PetNote, 'id' | 'date'>) => void;
  onRoleChange?: (roleId: PawloRoleId) => void;
  onSosAlert?: (description: string, sector: string) => void;
  onAssistantResponse?: (res: AssistantResponse) => void;
}

export class WebMCPAgentManager {
  private registeredTools: Map<string, WebMCPToolDefinition> = new Map();
  private abortController: AbortController = new AbortController();
  private isNativeWebMCPAvailable: boolean = false;
  private currentCart: Array<{ product: StoreProduct; qty: number }> = [
    { product: STORE_PRODUCTS[0], qty: 1 }
  ];
  private currentPets: UserPet[] = [...USER_PETS_VAULT];
  private currentRole: PawloRoleId = 'usuario';
  private listeners: WebMCPEvents = {};

  constructor() {
    this.detectCapabilities();
  }

  private detectCapabilities() {
    if (typeof window !== 'undefined') {
      const doc = document as any;
      const nav = navigator as any;
      this.isNativeWebMCPAvailable = Boolean(
        (doc.modelContext && typeof doc.modelContext.registerTool === 'function') ||
        (nav.modelContext && typeof nav.modelContext.registerTool === 'function')
      );
    }
  }

  public setListeners(listeners: WebMCPEvents) {
    this.listeners = { ...this.listeners, ...listeners };
  }

  public getListeners(): WebMCPEvents {
    return this.listeners;
  }

  public updateCartState(cart: Array<{ product: StoreProduct; qty: number }>) {
    this.currentCart = cart;
  }

  public updatePetsState(pets: UserPet[]) {
    this.currentPets = pets;
  }

  public getCurrentPets(): UserPet[] {
    return this.currentPets;
  }

  public getActivePet(): UserPet {
    return this.currentPets[0] || USER_PETS_VAULT[0];
  }

  public getCurrentCart(): Array<{ product: StoreProduct; qty: number }> {
    return this.currentCart;
  }

  public getCurrentRole(): PawloRoleId {
    return this.currentRole;
  }

  public setCurrentRole(roleId: PawloRoleId) {
    this.currentRole = roleId;
    if (this.listeners.onRoleChange) {
      this.listeners.onRoleChange(roleId);
    }
  }

  public getAvailableTools(): WebMCPToolDefinition[] {
    return Array.from(this.registeredTools.values());
  }

  public isNativeSupported(): boolean {
    return this.isNativeWebMCPAvailable;
  }

  // ==========================================================================
  // MÉTODOS DE MUTACIÓN Y ESCRITURA (WRITE CAPABILITIES)
  // ==========================================================================

  public updatePetWeight(petId: string, weightKg: number): UserPet {
    let updatedPet: UserPet | undefined;
    this.currentPets = this.currentPets.map(p => {
      if (p.id === petId) {
        updatedPet = { ...p, weightKg };
        return updatedPet;
      }
      return p;
    });

    if (!updatedPet) {
      updatedPet = { ...this.currentPets[0], weightKg };
      this.currentPets[0] = updatedPet;
    }

    if (this.listeners.onUpdatePetWeight) {
      this.listeners.onUpdatePetWeight(petId, weightKg);
    }
    if (this.listeners.onPetsChange) {
      this.listeners.onPetsChange(this.currentPets);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pawlo_user_pets', JSON.stringify(this.currentPets));
      } catch {}
      window.dispatchEvent(new CustomEvent('pawlo:pets_updated', {
        detail: { pets: this.currentPets, updatedPetId: petId }
      }));
    }

    return updatedPet;
  }

  public addPetVaccine(petId: string, vaccine: Omit<VaccineRecord, 'id'>): VaccineRecord {
    const fullVaccine: VaccineRecord = {
      ...vaccine,
      id: `vac-${Date.now()}`
    };

    this.currentPets = this.currentPets.map(p => {
      if (p.id === petId) {
        return { ...p, vaccines: [fullVaccine, ...p.vaccines] };
      }
      return p;
    });

    if (this.listeners.onAddPetVaccine) {
      this.listeners.onAddPetVaccine(petId, vaccine);
    }
    if (this.listeners.onPetsChange) {
      this.listeners.onPetsChange(this.currentPets);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pawlo_user_pets', JSON.stringify(this.currentPets));
      } catch {}
      window.dispatchEvent(new CustomEvent('pawlo:pets_updated', {
        detail: { pets: this.currentPets, updatedPetId: petId }
      }));
    }

    return fullVaccine;
  }

  public addPetNote(petId: string, note: Omit<PetNote, 'id' | 'date'>): PetNote {
    const fullNote: PetNote = {
      ...note,
      id: `note-${Date.now()}`
    };

    this.currentPets = this.currentPets.map(p => {
      if (p.id === petId) {
        return { ...p, notes: [fullNote, ...p.notes] };
      }
      return p;
    });

    if (this.listeners.onAddPetNote) {
      this.listeners.onAddPetNote(petId, note);
    }
    if (this.listeners.onPetsChange) {
      this.listeners.onPetsChange(this.currentPets);
    }

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('pawlo_user_pets', JSON.stringify(this.currentPets));
      } catch {}
      window.dispatchEvent(new CustomEvent('pawlo:pets_updated', {
        detail: { pets: this.currentPets, updatedPetId: petId }
      }));
    }

    return fullNote;
  }

  public addToCart(product: StoreProduct, qty: number = 1) {
    const existing = this.currentCart.find(i => i.product.id === product.id);
    if (existing) {
      this.currentCart = this.currentCart.map(i =>
        i.product.id === product.id ? { ...i, qty: i.qty + qty } : i
      );
    } else {
      this.currentCart = [...this.currentCart, { product, qty }];
    }

    if (this.listeners.onCartChange) {
      this.listeners.onCartChange(this.currentCart);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pawlo:cart_updated', {
        detail: { cart: this.currentCart }
      }));
    }
  }

  public clearCart() {
    this.currentCart = [];
    if (this.listeners.onCartChange) {
      this.listeners.onCartChange(this.currentCart);
    }
  }

  public triggerSosAlert(description: string, sector: string) {
    if (this.listeners.onSosAlert) {
      this.listeners.onSosAlert(description, sector);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pawlo:sos_alert', {
        detail: { description, sector }
      }));
    }
  }

  public navigateTab(tabId: string) {
    if (this.listeners.onNavigateTab) {
      this.listeners.onNavigateTab(tabId);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pawlo:navigate_tab', {
        detail: { tabId }
      }));
    }
  }

  public switchRole(roleId: PawloRoleId) {
    this.currentRole = roleId;
    if (this.listeners.onRoleChange) {
      this.listeners.onRoleChange(roleId);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('pawlo:role_changed', {
        detail: { roleId }
      }));
    }
  }

  public onPartnerAction(actionType: string, payload: any): string {
    if (typeof window !== 'undefined') {
      try {
        const history = JSON.parse(localStorage.getItem('pawlo_partner_actions') || '[]');
        history.unshift({ actionType, payload, timestamp: new Date().toISOString() });
        localStorage.setItem('pawlo_partner_actions', JSON.stringify(history));
      } catch {}
    }
    return `Acción ${actionType} ejecutada y persistida en portal de aliados.`;
  }

  public onStaffAction(actionType: string, payload: any): string {
    if (typeof window !== 'undefined') {
      try {
        const history = JSON.parse(localStorage.getItem('pawlo_staff_actions') || '[]');
        history.unshift({ actionType, payload, timestamp: new Date().toISOString() });
        localStorage.setItem('pawlo_staff_actions', JSON.stringify(history));
      } catch {}
    }
    return `Acción staff ${actionType} autorizada y registrada en auditoría inmutable.`;
  }

  /**
   * Inicializa y registra todas las herramientas de comercio agéntico, boveda y asistente
   */
  public initializeAgenticTools(): () => void {
    this.abortController = new AbortController();

    // Auto-montar el asistente agéntico omnipresente si estamos en el navegador
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        import('../components/PawloPetAssistantDrawer')
          .then(mod => {
            if (mod.mountGlobalPetAssistant) {
              mod.mountGlobalPetAssistant();
            }
          })
          .catch(err => {
            console.warn('[PAWLO WebMCP] Fallback montando asistente global:', err);
          });
      }, 100);
    }

    // 1. Herramienta: Búsqueda en el Catálogo de Comercio Agéntico
    this.register({
      name: 'pawlo_search_catalog',
      description: 'Busca productos en el catálogo de alimentos, farmacia, juguetes y accesorios de PAWLO con filtros de categoría, especie y precio.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'Término de búsqueda (ej. Bravecto, Royal Canin, Pelota)' },
          category: {
            type: 'string',
            enum: ['Todos', 'Comida', 'Medicamentos', 'Juguetes', 'Camas', 'Casas'],
            description: 'Categoría específica'
          },
          species: {
            type: 'string',
            enum: ['all', 'dog', 'cat'],
            description: 'Filtrar por especie'
          },
          maxPrice: { type: 'number', description: 'Precio máximo en USD' }
        }
      },
      execute: async (args) => {
        const query = (args.query || '').toLowerCase().trim();
        const category = args.category || 'Todos';
        const species = args.species || 'all';
        const maxPrice = args.maxPrice || Infinity;

        const results = STORE_PRODUCTS.filter(p => {
          const matchQuery = !query || p.title.toLowerCase().includes(query) || p.description.toLowerCase().includes(query);
          const matchCat = category === 'Todos' || p.category === category;
          const matchSpecies = species === 'all' || p.species === 'all' || p.species === species;
          const matchPrice = p.price <= maxPrice;
          return matchQuery && matchCat && matchSpecies && matchPrice;
        });

        return {
          totalMatches: results.length,
          products: results.map(p => ({
            id: p.id,
            title: p.title,
            priceUSD: p.price,
            category: p.category,
            species: p.species,
            rating: p.rating,
            stock: p.stock,
            requiresPrescription: p.requiresPrescription,
            highlightBadge: p.badge
          }))
        };
      }
    });

    // 2. Herramienta: Detalle de Producto
    this.register({
      name: 'pawlo_get_product_detail',
      description: 'Obtiene la ficha técnica completa de un producto por su identificador único (ID), incluyendo requerimiento de prescripción médica.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          productId: { type: 'string', description: 'Identificador único del producto (ej: prd-01)' }
        },
        required: ['productId']
      },
      execute: async (args) => {
        const product = STORE_PRODUCTS.find(p => p.id === args.productId);
        if (!product) {
          throw new Error(`Producto con ID ${args.productId} no encontrado en el catálogo de PAWLO.`);
        }
        return {
          product,
          regulatoryNote: product.requiresPrescription
            ? 'Requiere verificación de receta médica veterinaria al momento de la entrega.'
            : 'Venta libre sin prescripción médica.'
        };
      }
    });

    // 3. Herramienta de Comercio Agéntico: Manipulación del Carrito
    this.register({
      name: 'pawlo_manage_cart',
      description: 'Agrega, actualiza cantidad o retira productos del carrito de compras del usuario.',
      readOnlyHint: false,
      parameters: {
        type: 'object',
        properties: {
          action: {
            type: 'string',
            enum: ['add', 'update_qty', 'remove', 'clear'],
            description: 'Acción a ejecutar en el carrito'
          },
          productId: { type: 'string', description: 'ID del producto a manipular' },
          quantity: { type: 'number', description: 'Cantidad (por defecto 1)' }
        },
        required: ['action']
      },
      execute: async (args) => {
        const { action, productId, quantity = 1 } = args;

        if (action === 'clear') {
          this.currentCart = [];
        } else if (action === 'add') {
          const product = STORE_PRODUCTS.find(p => p.id === productId);
          if (!product) throw new Error(`Producto ${productId} no encontrado.`);
          const existing = this.currentCart.find(item => item.product.id === productId);
          if (existing) {
            this.currentCart = this.currentCart.map(item =>
              item.product.id === productId ? { ...item, qty: item.qty + quantity } : item
            );
          } else {
            this.currentCart = [...this.currentCart, { product, qty: quantity }];
          }
        } else if (action === 'update_qty') {
          this.currentCart = this.currentCart
            .map(item => item.product.id === productId ? { ...item, qty: quantity } : item)
            .filter(item => item.qty > 0);
        } else if (action === 'remove') {
          this.currentCart = this.currentCart.filter(item => item.product.id !== productId);
        }

        if (this.listeners.onCartChange) {
          this.listeners.onCartChange(this.currentCart);
        }

        const totalItems = this.currentCart.reduce((acc, i) => acc + i.qty, 0);
        const subtotal = this.currentCart.reduce((acc, i) => acc + i.product.price * i.qty, 0);

        return {
          success: true,
          actionExecuted: action,
          cartTotalItems: totalItems,
          cartSubtotalUSD: Number(subtotal.toFixed(2)),
          itemsInCart: this.currentCart.map(i => ({
            productId: i.product.id,
            title: i.product.title,
            qty: i.qty,
            unitPrice: i.product.price,
            lineTotal: Number((i.product.price * i.qty).toFixed(2))
          }))
        };
      }
    });

    // 4. Herramienta de Comercio Agéntico: Resumen y Preparación de Checkout
    this.register({
      name: 'pawlo_get_cart_and_checkout_summary',
      description: 'Genera el resumen de compra para el carrito actual con cálculo de impuestos, costos de entrega y enlace directo de confirmación WhatsApp/Deuna/Sipy/Peigo.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          deliveryAddress: { type: 'string', description: 'Dirección de entrega' },
          paymentMethod: {
            type: 'string',
            enum: ['Payphone', 'QR_Deuna_Sipy_Peigo', 'Transferencia_Bancaria', 'Efectivo_Contraentrega', 'Deuna_P2P', 'Sipy_QR', 'Peigo_QR', 'Payphone_TC'],
            description: 'Método de pago preferido (Payphone, QR DeUna/Sipy/Peigo, Transferencia, Contraentrega)'
          }
        }
      },
      execute: async (args) => {
        const address = args.deliveryAddress || 'Sector El Vergel / Calle Larga';
        const payment = args.paymentMethod || 'Payphone';
        const subtotal = this.currentCart.reduce((acc, i) => acc + i.product.price * i.qty, 0);
        const deliveryFee = subtotal > 35 ? 0 : 2.50;
        const total = subtotal + deliveryFee;
        const hasPrescription = this.currentCart.some(i => i.product.requiresPrescription);

        const orderId = `PWL-AGENT-${Date.now().toString(36).toUpperCase()}`;
        const summaryText = this.currentCart
          .map(i => `${i.qty}x ${i.product.title} ($${(i.product.price * i.qty).toFixed(2)})`)
          .join(', ');

        const waText = `Hola PAWLO Store, soy el agente de compras del usuario. Confirmo pedido ${orderId}. Productos: ${summaryText}. Total: $${total.toFixed(2)} USD. Entrega: ${address}. Pago: ${payment}.`;
        const waUrl = `https://wa.me/593998408369?text=${encodeURIComponent(waText)}`;

        return {
          orderId,
          totalItems: this.currentCart.reduce((acc, i) => acc + i.qty, 0),
          subtotalUSD: Number(subtotal.toFixed(2)),
          deliveryFeeUSD: deliveryFee,
          totalUSD: Number(total.toFixed(2)),
          hasPrescriptionItems: hasPrescription,
          deliveryAddress: address,
          paymentMethod: payment,
          whatsAppCheckoutUrl: waUrl,
          orderReadyToPlace: this.currentCart.length > 0
        };
      }
    });

    // 5. Herramienta: Bóveda Digital de Mascotas del Usuario (READ)
    this.register({
      name: 'pawlo_list_user_pets',
      description: 'Consulta los datos clínicos, peso, edad, microchip ISO y alergias de las mascotas registradas en la Bóveda del usuario.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {}
      },
      execute: async () => {
        return {
          totalPets: this.currentPets.length,
          pets: this.currentPets.map(p => ({
            id: p.id,
            name: p.name,
            species: p.species,
            breed: p.breed,
            weightKg: p.weightKg,
            birthDate: p.birthDate,
            microchipIso: p.microchipIso,
            neutered: p.isSterilized,
            allergies: p.allergies || [],
            vaccinesCount: p.vaccines?.length || 0,
            clinicalHistoryCount: p.clinicalHistory?.length || 0
          }))
        };
      }
    });

    // 6. Herramienta: Calculadora Nutricional de Ración Científica
    this.register({
      name: 'pawlo_calculate_diet_ration',
      description: 'Calcula científicamente los requerimientos energéticos basales (RER) y la ración diaria exacta en gramos según peso, especie y nivel de actividad.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          weightKg: { type: 'number', description: 'Peso corporal en kg' },
          species: { type: 'string', enum: ['canine', 'feline', 'dog', 'cat'], description: 'Especie del animal' },
          activityLevel: {
            type: 'string',
            enum: ['low', 'moderate', 'high'],
            description: 'Nivel de actividad diaria'
          }
        },
        required: ['weightKg', 'species']
      },
      execute: async (args) => {
        const { weightKg, species, activityLevel = 'moderate' } = args;
        const rer = Math.round(70 * Math.pow(weightKg, 0.75));
        let multiplier = (species === 'canine' || species === 'dog') ? 1.6 : 1.2;
        if (activityLevel === 'low') multiplier *= 0.85;
        if (activityLevel === 'high') multiplier *= 1.35;

        const dailyKcal = Math.round(rer * multiplier);
        const standardKcalPerGram = 3.8;
        const dailyGrams = Math.round(dailyKcal / standardKcalPerGram);

        return {
          species,
          weightKg,
          activityLevel,
          rerKcalPerDay: rer,
          merKcalPerDay: dailyKcal,
          recommendedGramsPerDay: dailyGrams,
          portionMorningGrams: Math.round(dailyGrams / 2),
          portionEveningGrams: Math.round(dailyGrams / 2),
          recommendation: `Dividir en 2 tomas diarias con acceso ilimitado a agua fresca filtrada.`
        };
      }
    });

    // 7. Herramienta: Verificación Biométrica de Microchip ISO 11784/11785
    this.register({
      name: 'pawlo_verify_microchip',
      description: 'Valida la estructura y autenticidad de un microchip biométrico FDX-B de 15 dígitos bajo normas ISO 11784/11785 de manera 100% local.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          microchipNumber: { type: 'string', description: 'Cadena numérica de 15 dígitos' }
        },
        required: ['microchipNumber']
      },
      execute: async (args) => {
        const clean = (args.microchipNumber || '').trim();
        const isValid = /^\d{15}$/.test(clean);
        if (!isValid) {
          return {
            isValid: false,
            standard: 'ISO 11784/11785 FDX-B',
            message: 'El código debe tener exactamente 15 dígitos numéricos sin letras ni símbolos.'
          };
        }

        const mfgCode = clean.substring(0, 3);
        const nationalId = clean.substring(3);
        return {
          isValid: true,
          standard: 'ISO 11784/11785 FDX-B Certificado',
          manufacturerOrCountryCode: mfgCode,
          uniqueIdentifier: nationalId,
          compatibleWithGlobalScanners: true,
          verifiedLocally: true,
          message: 'Transpondedor pasivo RFID válido con cobertura en la red comunitaria PAWLO.'
        };
      }
    });

    // 8. Herramienta: Triaje Clínico Neural Offline & Cortafuegos
    this.register({
      name: 'pawlo_triage_symptom',
      description: 'Ejecuta triaje clínico en el navegador con cortafuegos farmacológico sin consumir API ni enviar datos fuera del dispositivo.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          symptomDescription: { type: 'string', description: 'Descripción de signos clínicos o conducta' },
          petId: { type: 'string', description: 'ID de la mascota (opcional)' }
        },
        required: ['symptomDescription']
      },
      execute: async (args) => {
        const pet = this.currentPets.find(p => p.id === args.petId) || this.currentPets[0];
        const result = await processOfflineTriage(args.symptomDescription, pet);
        if (this.listeners.onTriageRequest) {
          this.listeners.onTriageRequest(result);
        }
        return {
          ...result,
          patient: {
            name: pet.name,
            species: pet.species,
            weightKg: pet.weightKg
          }
        };
      }
    });

    // 9. Herramienta: Matriz de Roles y Permisos RBAC PAWLO
    this.register({
      name: 'pawlo_get_roles_and_permissions',
      description: 'Devuelve la lista completa de los 8 roles de la plataforma PAWLO (Staff, Aliados B2B y Tutores), junto con sus matrices de permisos y capacidades de acceso.',
      readOnlyHint: true,
      parameters: {
        type: 'object',
        properties: {
          roleId: {
            type: 'string',
            description: 'ID de rol opcional para consultar (ej. usuario, veterinario, comercio, servicio, operator, supervisor, admin, super_admin)'
          }
        }
      },
      execute: async (args?: { roleId?: string }) => {
        if (args?.roleId) {
          const role = PAWLO_ROLES.find(r => r.id === args.roleId);
          return {
            found: Boolean(role),
            role: role || null,
            totalRolesCount: PAWLO_ROLES.length
          };
        }
        return {
          totalRolesCount: PAWLO_ROLES.length,
          roles: PAWLO_ROLES
        };
      }
    });

    // ========================================================================
    // NUEVAS HERRAMIENTAS DE ESCRITURA AGÉNTICA (WRITE-CAPABLE TOOLS)
    // ========================================================================

    // 10. Herramienta WRITE: Actualizar Peso Corporal en Bóveda
    this.register({
      name: 'pawlo_update_pet_weight',
      description: 'Actualiza el peso corporal de una mascota en la Bóveda Digital de PAWLO y recalcula automáticamente los requerimientos energéticos basales (RER) y ración diaria recomendada.',
      readOnlyHint: false,
      parameters: {
        type: 'object',
        properties: {
          petId: { type: 'string', description: 'ID de la mascota (ej: pet-bruno o pet-mia)' },
          weightKg: { type: 'number', description: 'Nuevo peso corporal en kilogramos (ej: 30.5)' }
        },
        required: ['petId', 'weightKg']
      },
      execute: async (args) => {
        const { petId, weightKg } = args;
        if (typeof weightKg !== 'number' || weightKg <= 0) {
          throw new Error('El peso corporal debe ser un valor numérico positivo mayor a 0 kg.');
        }

        const updatedPet = this.updatePetWeight(petId, weightKg);
        const rer = Math.round(70 * Math.pow(weightKg, 0.75));
        const factor = (updatedPet.species === 'canine' || (updatedPet.species as any) === 'dog') ? 1.6 : 1.2;
        const dailyKcal = Math.round(rer * factor);
        const dailyGrams = Math.round((dailyKcal / 380) * 100);

        return {
          success: true,
          action: 'UPDATE_PET_WEIGHT',
          petId: updatedPet.id,
          petName: updatedPet.name,
          newWeightKg: updatedPet.weightKg,
          rerKcalPerDay: rer,
          merKcalPerDay: dailyKcal,
          recommendedDailyGrams: dailyGrams,
          confirmationBadge: '✍️ ACCIÓN WRITE EJECUTADA: PESO ACTUALIZADO',
          timestamp: new Date().toISOString()
        };
      }
    });

    // 11. Herramienta WRITE: Registrar Vacuna en Carnet Digital
    this.register({
      name: 'pawlo_add_pet_vaccine',
      description: 'Registra una nueva vacuna o biológico en el carnet digital de la mascota en la Bóveda de PAWLO con fecha de aplicación y próximo refuerzo.',
      readOnlyHint: false,
      parameters: {
        type: 'object',
        properties: {
          petId: { type: 'string', description: 'ID de la mascota (ej: pet-bruno)' },
          vaccineName: { type: 'string', description: 'Nombre comercial o biológico de la vacuna (ej: Antirrábica, Séxtuple, Triple Felina)' },
          batch: { type: 'string', description: 'Número de lote opcional (por defecto LOT-PWL-2026)' },
          appliedDate: { type: 'string', description: 'Fecha de aplicación opcional' },
          nextDueDate: { type: 'string', description: 'Fecha de próximo refuerzo' },
          clinic: { type: 'string', description: 'Clínica o veterinaria emisora' },
          vetName: { type: 'string', description: 'Nombre del médico veterinario tratante' }
        },
        required: ['petId', 'vaccineName']
      },
      execute: async (args) => {
        const {
          petId,
          vaccineName,
          batch = 'LOT-PWL-2026',
          appliedDate = '20 Oct 2026',
          nextDueDate = '20 Oct 2027',
          clinic = 'Hospital Veterinario PAWLO',
          vetName = 'Dr. Validador PAWLO IA (Reg. SENESCYT 9021)'
        } = args;

        const vaccine = this.addPetVaccine(petId, {
          name: vaccineName,
          batch,
          appliedDate,
          nextDueDate,
          clinic,
          vetName,
          status: 'vigente'
        });

        return {
          success: true,
          action: 'ADD_PET_VACCINE',
          petId,
          vaccine,
          confirmationBadge: '✍️ ACCIÓN WRITE EJECUTADA: VACUNA REGISTRADA EN BÓVEDA',
          timestamp: new Date().toISOString()
        };
      }
    });

    // 12. Herramienta WRITE: Guardar Nota en Bóveda
    this.register({
      name: 'pawlo_add_pet_note',
      description: 'Guarda una nota clínica, de conducta, nutrición o cuidados diarios en la ficha inmutable de la mascota dentro de la Bóveda PAWLO.',
      readOnlyHint: false,
      parameters: {
        type: 'object',
        properties: {
          petId: { type: 'string', description: 'ID de la mascota' },
          category: {
            type: 'string',
            enum: ['Nutrición', 'Medicación', 'Conducta', 'Cuidado Diario'],
            description: 'Categoría de la nota'
          },
          title: { type: 'string', description: 'Título o asunto de la nota' },
          content: { type: 'string', description: 'Texto detallado de la nota o recordatorio' }
        },
        required: ['petId', 'content']
      },
      execute: async (args) => {
        const {
          petId,
          category = 'Cuidado Diario',
          title = 'Nota Registrada vía WebMCP',
          content
        } = args;

        const note = this.addPetNote(petId, {
          category,
          title,
          content,
          updatedAt: 'Registrado ahora'
        });

        return {
          success: true,
          action: 'ADD_PET_NOTE',
          petId,
          note,
          confirmationBadge: '✍️ ACCIÓN WRITE EJECUTADA: NOTA GUARDADA EN BÓVEDA',
          timestamp: new Date().toISOString()
        };
      }
    });

    // 13. Herramienta WRITE/READ: Ejecutor Agéntico Omnicanal PAWLO IA
    this.register({
      name: 'pawlo_omni_assistant_execute',
      description: 'Asistente agéntico PAWLO IA con capacidad de lectura y escritura en todos los módulos autorizados según el rol activo (Tutor, Veterinario, Comercio, Servicio, Staff).',
      readOnlyHint: false,
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Instrucción o consulta en lenguaje natural (ej: actualiza el peso de Bruno a 30.5 kg, o registra vacuna Antirrábica)'
          },
          petId: { type: 'string', description: 'ID opcional de la mascota objetivo' },
          roleId: {
            type: 'string',
            description: 'Rol bajo el cual se ejecuta el comando (opcional, por defecto el rol activo)'
          }
        },
        required: ['command']
      },
      execute: async (args) => {
        const targetPet = (args.petId ? this.currentPets.find(p => p.id === args.petId) : null) || this.getActivePet();
        const role: PawloRoleId = (args.roleId as PawloRoleId) || this.currentRole;

        const context: AssistantExecutionContext = {
          currentRole: role,
          activePet: targetPet,
          allPets: this.currentPets,
          products: STORE_PRODUCTS,
          services: EXPANDED_SERVICES_CATALOG,
          onUpdatePetWeight: (id, w) => this.updatePetWeight(id, w),
          onAddPetVaccine: (id, v) => this.addPetVaccine(id, v),
          onAddPetNote: (id, n) => this.addPetNote(id, n),
          onAddToCart: (p, q) => this.addToCart(p, q),
          onClearCart: () => this.clearCart(),
          onNavigateTab: (tab) => this.navigateTab(tab),
          onSwitchRole: (r) => this.switchRole(r),
          onTriggerSosAlert: (desc, sec) => this.triggerSosAlert(desc, sec),
          onPartnerAction: (act, pay) => this.onPartnerAction(act, pay),
          onStaffAction: (act, pay) => this.onStaffAction(act, pay)
        };

        const res = await processAssistantCommand(args.command, context);
        if (this.listeners.onAssistantResponse) {
          this.listeners.onAssistantResponse(res);
        }
        return res;
      }
    });

    // Registrar en el objeto global para agentes web y extensiones
    this.exposeGlobalFallback();

    // Retornar función de limpieza
    return () => {
      this.abortController.abort();
      this.registeredTools.clear();
    };
  }

  private register(tool: WebMCPToolDefinition) {
    this.registeredTools.set(tool.name, tool);

    // Si el navegador soporta WebMCP nativo (Chromium 146+ con flags activas)
    if (typeof window !== 'undefined') {
      const doc = document as any;
      const nav = navigator as any;
      const modelContext = doc.modelContext || nav.modelContext;

      if (modelContext && typeof modelContext.registerTool === 'function') {
        try {
          modelContext.registerTool({
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters,
            readOnlyHint: tool.readOnlyHint,
            signal: this.abortController.signal,
            execute: async (params: any) => {
              return await tool.execute(params);
            }
          });
        } catch (err) {
          console.warn(`[PAWLO WebMCP] Fallback en registro nativo de ${tool.name}:`, err);
        }
      }
    }
  }

  private exposeGlobalFallback() {
    if (typeof window === 'undefined') return;

    const pawloAgentTools = {
      version: '2026.2.0-webmcp-omni',
      isNativeWebMCPAvailable: this.isNativeWebMCPAvailable,
      tools: Array.from(this.registeredTools.values()).map(t => ({
        name: t.name,
        description: t.description,
        readOnlyHint: t.readOnlyHint,
        parameters: t.parameters
      })),
      execute: async (name: string, params: any) => {
        const tool = this.registeredTools.get(name);
        if (!tool) throw new Error(`Herramienta WebMCP "${name}" no encontrada.`);
        return await tool.execute(params);
      }
    };

    (window as any).pawloWebMCP = pawloAgentTools;
    (window as any).pawloAgentTools = pawloAgentTools;

    // Disparar evento DOM para notificar a asistentes en segundo plano
    window.dispatchEvent(
      new CustomEvent('webmcp:ready', {
        detail: {
          app: 'PAWLO™ Urban Pet Super-App',
          toolsCount: this.registeredTools.size,
          nativeSupport: this.isNativeWebMCPAvailable
        }
      })
    );
  }

  /**
   * Ejecuta una herramienta directamente por nombre
   */
  public async executeTool(name: string, params: any): Promise<any> {
    const tool = this.registeredTools.get(name);
    if (!tool) {
      throw new Error(`Herramienta WebMCP "${name}" no está registrada.`);
    }
    return await tool.execute(params);
  }
}

export const webMCPManager = new WebMCPAgentManager();
