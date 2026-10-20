/**
 * PAWLO™ IA Omnipresent Pet Assistant & Agentic Action Drawer
 * 
 * Copilot omnicanal con acceso global desde cualquier pantalla y rol.
 * Capaz de ejecutar acciones de LECTURA y ESCRITURA (Read & Write)
 * en todos los módulos de la aplicación con validación estricta de permisos RBAC.
 * 
 * Atajo de teclado: Cmd+K / Ctrl+K
 * Declarativo WebMCP: toolname="pawlo_omni_assistant_execute"
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, Bot, PawPrint, X, Send, CheckCircle2, AlertTriangle,
  ShieldAlert, ArrowRight, CornerDownLeft, Scale, Syringe, FileText,
  ShoppingCart, Radio, Check, ExternalLink, ShieldCheck, Stethoscope,
  Store, Scissors, Flame, Server, RefreshCw, Clock, Lock, ChevronDown,
  MessageSquare
} from 'lucide-react';
import {
  processAssistantCommand,
  AssistantExecutionContext,
  AssistantResponse,
  AssistantActionExecuted,
  CLINICAL_LEGAL_DISCLAIMER
} from '../services/offlineTriage';
import {
  UserPet,
  StoreProduct,
  PetServiceItem,
  VaccineRecord,
  PetNote,
  ClinicalEntry,
  STORE_CATALOG,
  EXPANDED_SERVICES_CATALOG,
  INITIAL_USER_PETS
} from '../data/pawloData';
import {
  PawloRoleId,
  PAWLO_ROLES,
  getRoleMeta
} from '../data/rolesAndPortalsData';
import { webMCPManager } from '../services/webmcp';

export interface PawloPetAssistantDrawerProps {
  currentRole?: PawloRoleId;
  activePet?: UserPet;
  allPets?: UserPet[];
  products?: StoreProduct[];
  services?: PetServiceItem[];
  theme?: 'dark' | 'light';
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  // Callbacks de Escritura
  onUpdatePetWeight?: (petId: string, weightKg: number) => void;
  onAddPetVaccine?: (petId: string, vaccine: Omit<VaccineRecord, 'id'>) => void;
  onAddPetNote?: (petId: string, note: Omit<PetNote, 'id' | 'date'>) => void;
  onAddClinicalRecord?: (petId: string, record: Omit<ClinicalEntry, 'id'>) => void;
  onAddToCart?: (product: StoreProduct, qty: number) => void;
  onClearCart?: () => void;
  onNavigateTab?: (tabId: string) => void;
  onSwitchRole?: (roleId: PawloRoleId) => void;
  onTriggerSosAlert?: (description: string, sector: string) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  badge?: string;
  timestamp: string;
  actionExecuted?: AssistantActionExecuted;
  isWriteAction?: boolean;
  pharmacologicalBlock?: boolean;
  requiresRoleSwitch?: PawloRoleId;
  latencyMs?: number;
  suggestedFollowUps?: string[];
}

export const PawloPetAssistantDrawer: React.FC<PawloPetAssistantDrawerProps> = ({
  currentRole: propRole,
  activePet: propActivePet,
  allPets: propAllPets,
  products = STORE_CATALOG,
  services = EXPANDED_SERVICES_CATALOG,
  theme: propTheme,
  isOpen: propIsOpen,
  onClose,
  onOpen,
  onUpdatePetWeight: propOnUpdateWeight,
  onAddPetVaccine: propOnAddVaccine,
  onAddPetNote: propOnAddNote,
  onAddToCart: propOnAddToCart,
  onNavigateTab: propOnNavigateTab,
  onSwitchRole: propOnSwitchRole,
  onTriggerSosAlert: propOnTriggerSosAlert
}) => {
  // Estado local sincronizado con WebMCP / Props
  const [internalIsOpen, setInternalIsOpen] = useState<boolean>(false);
  const isDrawerOpen = propIsOpen !== undefined ? propIsOpen : internalIsOpen;

  const [activeRole, setActiveRole] = useState<PawloRoleId>(propRole || 'usuario');
  const [pets, setPets] = useState<UserPet[]>(propAllPets || INITIAL_USER_PETS);
  const [activePetId, setActivePetId] = useState<string>(
    propActivePet?.id || (propAllPets && propAllPets[0]?.id) || INITIAL_USER_PETS[0].id
  );

  const [localTheme, setLocalTheme] = useState<'dark' | 'light'>('dark');
  const currentTheme = propTheme || localTheme;

  const [inputCommand, setInputCommand] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mascota activa resuelta
  const activePet = pets.find(p => p.id === activePetId) || pets[0] || INITIAL_USER_PETS[0];
  const roleMeta = getRoleMeta(activeRole);

  // Mensaje de bienvenida inicial
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      sender: 'assistant',
      text: `Hola, soy **Kiru IA Copilot**, tu asistente agéntico omnicanal.\n\nPuedo consultar información y **ejecutar acciones reales (Read & Write)** en todos los módulos autorizados para tu rol activo: **${roleMeta.label}**.\n\nPrueba pedirme por ejemplo: *"Actualiza el peso de Bruno a 30.5 kg"*, *"Registra vacuna Antirrábica hoy"* o *"Agrega alimento de salmón al carrito"*.`,
      badge: '⚡ AGENTIC RUNTIME (0ms Edge)',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      latencyMs: 1
    }
  ]);

  // Marcar como montado para evitar duplicados en mountGlobalPetAssistant
  useEffect(() => {
    isGlobalMounted = true;
    return () => {
      isGlobalMounted = false;
    };
  }, []);

  // Sincronizar props entrantes si cambian
  useEffect(() => {
    if (propRole) setActiveRole(propRole);
  }, [propRole]);

  useEffect(() => {
    if (propAllPets && propAllPets.length > 0) {
      setPets(propAllPets);
    }
  }, [propAllPets]);

  useEffect(() => {
    if (propActivePet) {
      setActivePetId(propActivePet.id);
    }
  }, [propActivePet]);

  // Detección de tema oscuro/claro del DOM
  useEffect(() => {
    const checkTheme = () => {
      const isLight = document.documentElement.classList.contains('light');
      setLocalTheme(isLight ? 'light' : 'dark');
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Escuchar eventos globales del bus de la aplicación
  useEffect(() => {
    const handleRoleChanged = (e: any) => {
      if (e.detail?.roleId) {
        setActiveRole(e.detail.roleId);
      }
    };
    const handlePetsUpdated = (e: any) => {
      if (e.detail?.pets) {
        setPets(e.detail.pets);
      }
    };
    const handleOpenAssistant = (e: any) => {
      if (onOpen) onOpen();
      else setInternalIsOpen(true);
      if (e.detail?.prompt) {
        executeCommand(e.detail.prompt);
      }
    };

    window.addEventListener('pawlo:role_changed', handleRoleChanged as any);
    window.addEventListener('pawlo:pets_updated', handlePetsUpdated as any);
    window.addEventListener('pawlo:open_assistant', handleOpenAssistant as any);

    return () => {
      window.removeEventListener('pawlo:role_changed', handleRoleChanged as any);
      window.removeEventListener('pawlo:pets_updated', handlePetsUpdated as any);
      window.removeEventListener('pawlo:open_assistant', handleOpenAssistant as any);
    };
  }, []);

  // Atajo de teclado global Cmd+K / Ctrl+K y Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        toggleOpen();
      } else if (e.key === 'Escape' && isDrawerOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen]);

  // Scroll automático hacia el mensaje más reciente
  useEffect(() => {
    if (isDrawerOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isDrawerOpen]);

  const toggleOpen = () => {
    if (isDrawerOpen) {
      handleClose();
    } else {
      if (onOpen) onOpen();
      else setInternalIsOpen(true);
    }
  };

  const handleClose = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

  // --------------------------------------------------------------------------
  // CHIPS DINÁMICOS POR ROL
  // --------------------------------------------------------------------------
  const getRoleActionChips = (role: PawloRoleId): Array<{ label: string; command: string }> => {
    const petName = activePet.name;
    switch (role) {
      case 'usuario':
        return [
          { label: `✍️ Actualizar peso de ${petName} a 30.2 kg`, command: `Actualiza el peso de ${petName} a 30.2 kg` },
          { label: `💉 Registrar vacuna Antirrábica hoy`, command: `Registra vacuna Antirrábica para ${petName}` },
          { label: `📝 Agregar nota en ficha`, command: `Agrega una nota: Comprar premios hipoalergénicos el viernes` },
          { label: `🛒 Agregar alimento Salmón al carrito`, command: `Agrega alimento de salmón al carrito` },
          { label: `🥣 Calcular ración diaria (RER)`, command: `Calcular ración diaria para ${petName}` },
          { label: `🧪 Probar Cortafuegos Farmacológico`, command: `¿Cuántos mg de ibuprofeno le puedo dar a mi perro?` }
        ];
      case 'veterinario':
        return [
          { label: `📋 Emitir receta digital para ${petName}`, command: `Emitir receta digital para ${petName}` },
          { label: `⚖️ Actualizar peso clínico a 29.8 kg`, command: `Actualizar peso de ${petName} a 29.8 kg` },
          { label: `🔍 Consultar historial y alergias`, command: `Ver vacunas y ficha clínica de ${petName}` }
        ];
      case 'comercio':
        return [
          { label: `📦 Reactivar stock de todo el catálogo`, command: `Reactivar stock de todo el catálogo` },
          { label: `🧾 Verificar recetas pendientes`, command: `Verificar recetas pendientes en farmacia` }
        ];
      case 'servicio':
        return [
          { label: `🚐 Actualizar ruta Pet Taxi a En Camino`, command: `Actualizar ruta Pet Taxi a En Camino` },
          { label: `📸 Enviar reporte de bienestar al tutor`, command: `Enviar reporte de bienestar al tutor de ${petName}` }
        ];
      case 'super_admin':
      case 'admin':
      case 'supervisor':
      case 'operator':
        return [
          { label: `✅ Aprobar aliados pendientes del nodo`, command: `Aprobar aliados pendientes del nodo Cuenca` },
          { label: `🚑 Despachar Pet Taxi a alerta SOS`, command: `Despachar unidad SOS Pet Taxi a El Vergel` },
          { label: `📡 Aprobar difusión push en Radar 5km`, command: `Reportar alerta SOS en El Vergel para ${petName}` }
        ];
      default:
        return [
          { label: `✍️ Actualizar peso a 30 kg`, command: `Actualizar peso de ${petName} a 30 kg` },
          { label: `🥣 Calcular ración diaria`, command: `Calcular ración diaria para ${petName}` }
        ];
    }
  };

  // --------------------------------------------------------------------------
  // EJECUCIÓN AGÉNTICA DE COMANDOS (READ & WRITE)
  // --------------------------------------------------------------------------
  const executeCommand = async (cmdToRun: string) => {
    const trimmed = cmdToRun.trim();
    if (!trimmed) return;

    // Agregar mensaje del usuario a la lista
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, userMsg]);
    setInputCommand('');
    setIsProcessing(true);

    // Preparar contexto con callbacks de escritura
    const context: AssistantExecutionContext = {
      currentRole: activeRole,
      activePet,
      allPets: pets,
      products,
      services,

      // Write Callback 1: Actualizar Peso
      onUpdatePetWeight: (petId: string, weightKg: number) => {
        // Ejecutar callback padre si está disponible
        if (propOnUpdateWeight) {
          propOnUpdateWeight(petId, weightKg);
        }
        // Actualizar estado local
        setPets(prev => prev.map(p => p.id === petId ? { ...p, weightKg } : p));
        // Sincronizar con el gestor WebMCP
        webMCPManager.updatePetWeight(petId, weightKg);
      },

      // Write Callback 2: Registrar Vacuna
      onAddPetVaccine: (petId: string, vaccine: Omit<VaccineRecord, 'id'>) => {
        const fullVaccine: VaccineRecord = {
          ...vaccine,
          id: `vac-${Date.now()}`
        };
        if (propOnAddVaccine) {
          propOnAddVaccine(petId, vaccine);
        }
        setPets(prev => prev.map(p => p.id === petId ? { ...p, vaccines: [fullVaccine, ...p.vaccines] } : p));
        webMCPManager.addPetVaccine(petId, vaccine);
      },

      // Write Callback 3: Guardar Nota
      onAddPetNote: (petId: string, note: Omit<PetNote, 'id' | 'date'>) => {
        const fullNote: PetNote = {
          ...note,
          id: `note-${Date.now()}`
        };
        if (propOnAddNote) {
          propOnAddNote(petId, note);
        }
        setPets(prev => prev.map(p => p.id === petId ? { ...p, notes: [fullNote, ...p.notes] } : p));
        webMCPManager.addPetNote(petId, note);
      },

      // Write Callback 4: Añadir al Carrito
      onAddToCart: (product: StoreProduct, qty: number) => {
        if (propOnAddToCart) {
          propOnAddToCart(product, qty);
        }
        webMCPManager.addToCart(product, qty);
      },

      // Write Callback 5: Alerta SOS
      onTriggerSosAlert: (description: string, sector: string) => {
        if (propOnTriggerSosAlert) {
          propOnTriggerSosAlert(description, sector);
        }
        webMCPManager.triggerSosAlert(description, sector);
      },

      // Callbacks de Navegación y Conmutación de Rol
      onNavigateTab: (tabId: string) => {
        handleNavigateModule(tabId);
      },

      onSwitchRole: (newRoleId: PawloRoleId) => {
        handleSwitchRole(newRoleId);
      },

      onPartnerAction: (actionType: string, payload: any) => {
        return webMCPManager.onPartnerAction(actionType, payload);
      },

      onStaffAction: (actionType: string, payload: any) => {
        return webMCPManager.onStaffAction(actionType, payload);
      }
    };

    try {
      const response: AssistantResponse = await processAssistantCommand(trimmed, context);
      setIsProcessing(false);

      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: response.text,
        badge: response.badge,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionExecuted: response.actionExecuted,
        isWriteAction: response.isWriteAction,
        pharmacologicalBlock: response.pharmacologicalBlock,
        requiresRoleSwitch: response.requiresRoleSwitch,
        latencyMs: response.latencyMs,
        suggestedFollowUps: response.suggestedFollowUps
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setIsProcessing(false);
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ Ocurrió una inconsistencia en el procesamiento local: ${err?.message || 'Error desconocido'}.\n\n${CLINICAL_LEGAL_DISCLAIMER}`,
          badge: 'ERROR EN EJECUCIÓN',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          latencyMs: 1
        }
      ]);
    }
  };

  // --------------------------------------------------------------------------
  // NAVEGACIÓN Y CAMBIO DE ROL
  // --------------------------------------------------------------------------
  const handleNavigateModule = (tabId: string) => {
    if (propOnNavigateTab) {
      propOnNavigateTab(tabId);
    }
    webMCPManager.navigateTab(tabId);
    // Disparar evento para que la aplicación reaccione y cambie de pantalla
    window.dispatchEvent(new CustomEvent('pawlo:navigate_tab', { detail: { tabId } }));

    // Buscar y activar botón de pestaña en DOM si existe
    const tabButtons = document.querySelectorAll('button');
    tabButtons.forEach(btn => {
      const text = btn.innerText.toLowerCase();
      if (
        (tabId === 'my_pets' && (text.includes('mis mascotas') || text.includes('bóveda'))) ||
        (tabId === 'store' && (text.includes('tienda') || text.includes('farmacia'))) ||
        (tabId === 'services' && text.includes('servicios')) ||
        (tabId === 'sos' && text.includes('radar')) ||
        (tabId === 'portals' && text.includes('portal'))
      ) {
        btn.click();
      }
    });

    // En pantallas pequeñas, cerrar el drawer para mostrar la pantalla navegada
    if (window.innerWidth < 640) {
      handleClose();
    }
  };

  const handleSwitchRole = (newRole: PawloRoleId) => {
    setActiveRole(newRole);
    if (propOnSwitchRole) {
      propOnSwitchRole(newRole);
    }
    webMCPManager.switchRole(newRole);
    window.dispatchEvent(new CustomEvent('pawlo:role_changed', { detail: { roleId: newRole } }));

    // Simular clic en el conmutador de la barra superior si existe
    const roleButtons = document.querySelectorAll('button');
    roleButtons.forEach(btn => {
      const meta = getRoleMeta(newRole);
      if (btn.innerText.includes(meta.shortLabel) || btn.innerText.includes(meta.label)) {
        btn.click();
      }
    });

    setShowRoleSelector(false);
  };

  const getRoleIcon = (roleId: PawloRoleId) => {
    switch (roleId) {
      case 'usuario': return PawPrint;
      case 'veterinario': return Stethoscope;
      case 'comercio': return Store;
      case 'servicio': return Scissors;
      case 'operator': return Radio;
      case 'supervisor': return Flame;
      case 'admin': return ShieldCheck;
      case 'super_admin': return Server;
      default: return Bot;
    }
  };

  const RoleIcon = getRoleIcon(activeRole);
  const chips = getRoleActionChips(activeRole);

  return (
    <>
      {/* ==================================================================== */}
      {/* BOTÓN FLOTANTE OMNIPRESENTE (GLOBAL FLOATING ACTION BUTTON) */}
      {/* ==================================================================== */}
      <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={toggleOpen}
          aria-label="Abrir Asistente Agéntico Kiru IA (Cmd+K)"
          title="Kiru IA Pet Assistant (Atajo: ⌘K / Ctrl+K)"
          className="group relative flex items-center gap-2.5 px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 cursor-pointer bg-gradient-to-r from-[#00F5A0] via-[#00D9F5] to-[#7B2CBF] text-[#03060C] font-extrabold text-xs sm:text-sm border border-white/30 backdrop-blur-md"
        >
          {/* Anillo de pulso sutil */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] opacity-40 blur-sm group-hover:opacity-75 animate-pulse transition duration-500"></span>

          <div className="relative z-10 w-6 h-6 rounded-full bg-[#03060C] flex items-center justify-center text-[#00F5A0]">
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
          </div>

          <div className="relative z-10 flex flex-col text-left leading-tight hidden xs:flex">
            <span className="text-[10px] uppercase font-mono tracking-wider opacity-85 text-[#03060C]">
              Kiru IA Copilot
            </span>
            <span className="text-xs font-black tracking-tight text-[#03060C]">
              {activePet.name} ({activePet.weightKg} kg)
            </span>
          </div>

          {/* Atajo de teclado badge */}
          <span className="relative z-10 hidden md:inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#03060C]/20 text-[#03060C] border border-[#03060C]/20 ml-1">
            ⌘K
          </span>
        </button>
      </div>

      {/* ==================================================================== */}
      {/* SLIDE-OVER DRAWER DE PAWLO IA PET ASSISTANT */}
      {/* ==================================================================== */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop con desenfoque */}
          <div
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-fade-in"
          />

          {/* Panel Lateral Deslizante */}
          <div
            className={`relative w-full sm:w-[480px] lg:w-[540px] h-full flex flex-col shadow-2xl z-10 border-l transition-transform duration-300 ease-out animate-slide-left ${
              currentTheme === 'dark'
                ? 'bg-[#050914] border-white/10 text-white'
                : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            {/* -------------------------------------------------------------- */}
            {/* HEADER DEL DRAWER */}
            {/* -------------------------------------------------------------- */}
            <div
              className={`p-4 sm:p-5 border-b flex flex-col gap-3 shrink-0 ${
                currentTheme === 'dark' ? 'bg-[#080E20] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] p-0.5 shadow-lg shadow-[#00F5A0]/20 flex items-center justify-center">
                    <div className="w-full h-full bg-[#03060C] rounded-[14px] flex items-center justify-center">
                      <Sparkles className="w-4 h-4 text-[#00F5A0]" />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-extrabold text-base sm:text-lg tracking-tight">KIRUPET™ IA Copilot</h2>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/30">
                        Read & Write
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Asistente agéntico omnipresente con acceso a todos los módulos.
                    </p>
                  </div>
                </div>

                <button
                  onClick={handleClose}
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    currentTheme === 'dark'
                      ? 'hover:bg-white/10 text-slate-400 hover:text-white'
                      : 'hover:bg-slate-200 text-slate-600 hover:text-slate-950'
                  }`}
                  aria-label="Cerrar Asistente"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* BARRA DE CONTEXTO: ROL ACTIVO + SELECTOR DE MASCOTA */}
              <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                {/* Selector de Rol */}
                <div className="relative">
                  <button
                    onClick={() => setShowRoleSelector(!showRoleSelector)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${roleMeta.badgeColor}`}
                    title="Cambiar rol activo para probar permisos"
                  >
                    <RoleIcon className="w-3.5 h-3.5" />
                    <span>{roleMeta.shortLabel}</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {showRoleSelector && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 w-60 rounded-2xl border shadow-xl z-30 p-1.5 space-y-1 ${
                        currentTheme === 'dark'
                          ? 'bg-[#091124] border-white/15 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-white/5">
                        Seleccionar Rol Activo (RBAC)
                      </div>
                      {PAWLO_ROLES.map(r => {
                        const IconComponent = getRoleIcon(r.id);
                        const isSelected = activeRole === r.id;
                        return (
                          <button
                            key={r.id}
                            onClick={() => handleSwitchRole(r.id)}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#00F5A0]/20 text-[#00F5A0] font-bold'
                                : currentTheme === 'dark'
                                ? 'hover:bg-white/5 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <IconComponent className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{r.shortLabel}</span>
                            </div>
                            {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selector de Mascota Activa */}
                <div className="relative">
                  <button
                    onClick={() => setShowPetSelector(!showPetSelector)}
                    className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      currentTheme === 'dark'
                        ? 'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10'
                        : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                    }`}
                  >
                    <img
                      src={activePet.avatar}
                      alt={activePet.name}
                      className="w-4 h-4 rounded-full object-cover"
                    />
                    <span>{activePet.name} ({activePet.weightKg} kg)</span>
                    <ChevronDown className="w-3 h-3 opacity-70" />
                  </button>

                  {showPetSelector && (
                    <div
                      className={`absolute top-full right-0 mt-1.5 w-56 rounded-2xl border shadow-xl z-30 p-1.5 space-y-1 ${
                        currentTheme === 'dark'
                          ? 'bg-[#091124] border-white/15 text-white'
                          : 'bg-white border-slate-200 text-slate-900'
                      }`}
                    >
                      <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase border-b border-white/5">
                        Mascotas del Tutor
                      </div>
                      {pets.map(p => {
                        const isSelected = activePetId === p.id;
                        return (
                          <button
                            key={p.id}
                            onClick={() => {
                              setActivePetId(p.id);
                              setShowPetSelector(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#00F5A0]/20 text-[#00F5A0] font-bold'
                                : currentTheme === 'dark'
                                ? 'hover:bg-white/5 text-slate-300'
                                : 'hover:bg-slate-100 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img src={p.avatar} alt={p.name} className="w-5 h-5 rounded-full object-cover" />
                              <span className="truncate">{p.name} ({p.weightKg} kg)</span>
                            </div>
                            {isSelected && <Check className="w-3 h-3 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* -------------------------------------------------------------- */}
            {/* CHIPS DE ACCIONES RÁPIDAS DINÁMICAS POR ROL */}
            {/* -------------------------------------------------------------- */}
            <div
              className={`p-3 border-b overflow-x-auto no-scrollbar flex items-center gap-2 shrink-0 ${
                currentTheme === 'dark' ? 'bg-[#070C1A] border-white/5' : 'bg-slate-100 border-slate-200'
              }`}
            >
              {chips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => executeCommand(chip.command)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 shrink-0 cursor-pointer active:scale-95 ${
                    currentTheme === 'dark'
                      ? 'bg-white/5 hover:bg-[#00F5A0]/20 hover:text-[#00F5A0] text-slate-300 border border-white/10 hover:border-[#00F5A0]/40'
                      : 'bg-white hover:bg-emerald-50 hover:text-emerald-900 text-slate-700 border border-slate-300 hover:border-emerald-300 shadow-sm'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* -------------------------------------------------------------- */}
            {/* CUERPO DEL CHAT: HISTORIAL DE MENSAJES Y ACCIONES */}
            {/* -------------------------------------------------------------- */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  {/* Badge de estado / acción */}
                  {msg.badge && (
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md mb-1 inline-flex items-center gap-1 ${
                        msg.pharmacologicalBlock
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : msg.isWriteAction
                          ? 'bg-[#00F5A0]/20 text-[#00F5A0] border border-[#00F5A0]/40'
                          : msg.requiresRoleSwitch
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : currentTheme === 'dark'
                          ? 'bg-white/10 text-slate-300 border border-white/10'
                          : 'bg-slate-200 text-slate-700 border border-slate-300'
                      }`}
                    >
                      {msg.badge}
                      {msg.latencyMs !== undefined && (
                        <span className="opacity-70 font-mono">({msg.latencyMs}ms)</span>
                      )}
                    </span>
                  )}

                  {/* Burbuja del mensaje */}
                  <div
                    className={`max-w-[90%] rounded-2xl p-3.5 sm:p-4 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] text-[#03060C] font-semibold rounded-tr-none shadow-md'
                        : currentTheme === 'dark'
                        ? 'bg-[#0B132B] border border-white/10 text-slate-100 rounded-tl-none shadow-md'
                        : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                    }`}
                  >
                    {/* Render formateado simple de Markdown */}
                    <div className="space-y-2">
                      {msg.text.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx}>
                          {paragraph.split('**').map((chunk, cIdx) =>
                            cIdx % 2 === 1 ? (
                              <strong key={cIdx} className="font-bold">{chunk}</strong>
                            ) : (
                              chunk
                            )
                          )}
                        </p>
                      ))}
                    </div>

                    {/* TARJETA DE ACCIÓN EJECUTADA EN VIVO (LOG & 1-CLICK ACTION) */}
                    {msg.actionExecuted && (
                      <div
                        className={`mt-3 pt-3 border-t flex flex-col gap-2 rounded-xl p-2.5 ${
                          currentTheme === 'dark'
                            ? 'bg-black/30 border-white/10'
                            : 'bg-white/80 border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-bold text-xs">
                            {msg.actionExecuted.type === 'WRITE' ? (
                              <CheckCircle2 className="w-4 h-4 text-[#00F5A0]" />
                            ) : msg.actionExecuted.type === 'BLOCKED_RBAC' ? (
                              <ShieldAlert className="w-4 h-4 text-amber-400" />
                            ) : msg.actionExecuted.type === 'PHARMA_BLOCKED' ? (
                              <AlertTriangle className="w-4 h-4 text-rose-400" />
                            ) : (
                              <ArrowRight className="w-4 h-4 text-sky-400" />
                            )}
                            <span className="truncate">{msg.actionExecuted.actionName}</span>
                          </div>

                          <span className="text-[10px] font-mono opacity-60">
                            {msg.actionExecuted.targetModule.toUpperCase()}
                          </span>
                        </div>

                        {/* Botón de acción / navegación directa */}
                        {msg.requiresRoleSwitch ? (
                          <button
                            onClick={() => handleSwitchRole(msg.requiresRoleSwitch!)}
                            className="w-full mt-1 py-1.5 px-3 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <RoleIcon className="w-3.5 h-3.5" />
                            <span>Cambiar a Rol {getRoleMeta(msg.requiresRoleSwitch).shortLabel} para Ejecutar</span>
                          </button>
                        ) : msg.actionExecuted.actionLabel && msg.actionExecuted.navTab ? (
                          <button
                            onClick={() => handleNavigateModule(msg.actionExecuted!.navTab!)}
                            className="w-full mt-1 py-1.5 px-3 rounded-lg bg-[#00F5A0]/20 hover:bg-[#00F5A0]/30 text-[#00F5A0] border border-[#00F5A0]/40 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <span>{msg.actionExecuted.actionLabel}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : null}
                      </div>
                    )}

                    {/* Chips de seguimiento sugeridos */}
                    {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-white/5 flex flex-wrap gap-1.5">
                        {msg.suggestedFollowUps.map((followUp, fIdx) => (
                          <button
                            key={fIdx}
                            onClick={() => executeCommand(followUp)}
                            className={`text-[11px] px-2 py-1 rounded-lg transition cursor-pointer ${
                              currentTheme === 'dark'
                                ? 'bg-white/5 hover:bg-white/10 text-slate-300'
                                : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                            }`}
                          >
                            {followUp}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <span className="text-[10px] text-slate-500 mt-1 px-1">
                    {msg.timestamp}
                  </span>
                </div>
              ))}

              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <div className="w-4 h-4 rounded-full border-2 border-[#00F5A0] border-t-transparent animate-spin" />
                  <span>Kiru IA ejecutando acción local en memoria...</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* -------------------------------------------------------------- */}
            {/* FORMULARIO DECLARATIVO WEBMCP & ENTRADA DE COMANDOS */}
            {/* -------------------------------------------------------------- */}
            <div
              className={`p-3 sm:p-4 border-t flex flex-col gap-2 shrink-0 ${
                currentTheme === 'dark' ? 'bg-[#080E20] border-white/10' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  executeCommand(inputCommand);
                }}
                toolname="pawlo_omni_assistant_execute"
                tooldescription="Asistente agéntico PAWLO IA con lectura y escritura en todos los módulos autorizados"
                toolautosubmit="true"
                className="flex items-center gap-2"
              >
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={inputCommand}
                    onChange={(e) => setInputCommand(e.target.value)}
                    placeholder={`Comando para ${activePet.name} (ej: actualiza peso a 30 kg)...`}
                    className={`w-full py-2.5 sm:py-3 pl-3.5 pr-10 rounded-2xl text-xs sm:text-sm border focus:outline-none focus:ring-2 focus:ring-[#00F5A0] transition ${
                      currentTheme === 'dark'
                        ? 'bg-[#03060C] border-white/15 text-white placeholder-slate-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                    }`}
                  />
                  {inputCommand && (
                    <button
                      type="button"
                      onClick={() => setInputCommand('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!inputCommand.trim() || isProcessing}
                  className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-tr from-[#00F5A0] to-[#00D9F5] text-[#03060C] font-extrabold hover:opacity-90 active:scale-95 transition disabled:opacity-40 disabled:pointer-events-none cursor-pointer shrink-0"
                  title="Enviar comando"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

              {/* Legal & Telemetry Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 pt-1">
                <span className="truncate max-w-[70%]">
                  Orientación de bienestar • No reemplaza consulta presencial
                </span>
                <span className="font-mono text-[#00F5A0] shrink-0">
                  ⚡ 0ms Edge • $0 API
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PawloPetAssistantDrawer;

/**
 * Monta el asistente automáticamente en el DOM si no existe un contenedor.
 * Garantiza presencia omnipresente en toda la aplicación web.
 */
let isGlobalMounted = false;
export async function mountGlobalPetAssistant(containerId = 'pawlo-global-pet-assistant-root') {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (isGlobalMounted || document.getElementById(containerId)) return;

  try {
    const container = document.createElement('div');
    container.id = containerId;
    document.body.appendChild(container);

    const { createRoot } = await import('react-dom/client');
    const root = createRoot(container);
    root.render(<PawloPetAssistantDrawer />);
    isGlobalMounted = true;
  } catch (err) {
    console.warn('[PAWLO IA] Inicialización de asistente global en segundo plano:', err);
  }
}
