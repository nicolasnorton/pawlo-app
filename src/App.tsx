import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, PhoneCall, ShieldCheck, 
  MapPin, CheckCircle2, Sparkles, Navigation, 
  ArrowRight, Send, Check, AlertCircle,
  Compass, Zap, Globe, ChevronDown, Sun, Moon,
  Radio, Cpu, Fingerprint, Star, PlusCircle, Lock,
  PawPrint, ShoppingBag, Smartphone, Car, Building2, Scissors, Stethoscope, Brain,
  Bot, Database
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { PawloLogo } from './components/PawloLogo';
import { MyPetsVault } from './components/MyPetsVault';
import { PetStoreMarketplace } from './components/PetStoreMarketplace';
import { AgenticWebMCPConsole } from './components/AgenticWebMCPConsole';
import { webMCPManager } from './services/webmcp';
import { processOfflineTriage } from './services/offlineTriage';
import { pawloDB, AgentTelemetryStats } from './services/indexedDbStorage';
import {
  INITIAL_USER_PETS,
  STORE_CATALOG,
  EXPANDED_SERVICES_CATALOG,
  UserPet,
  PetNote,
  VaccineRecord,
  ClinicalEntry,
  PetServiceItem
} from './data/pawloData';

// Corrección de íconos de Leaflet en React / Vite
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = defaultIcon;

interface CityNode {
  id: string;
  name: string;
  country: string;
  code: string;
  center: [number, number];
  status: 'active' | 'beta' | 'coming_soon';
  currency: string;
  paymentRail: string;
  activeDevices: number;
  latencyMs: string;
}

const CITY_NODES: CityNode[] = [
  { id: 'cue', name: 'Cuenca', country: 'Ecuador', code: 'EC-AZU', center: [-2.8974, -79.0045], status: 'active', currency: 'USD', paymentRail: 'Deuna P2P & Pichincha', activeDevices: 1420, latencyMs: '0.17ms' },
  { id: 'uio', name: 'Quito', country: 'Ecuador', code: 'EC-PIC', center: [-0.1807, -78.4678], status: 'beta', currency: 'USD', paymentRail: 'Deuna & Produbanco', activeDevices: 3890, latencyMs: '0.24ms' },
  { id: 'gye', name: 'Guayaquil', country: 'Ecuador', code: 'EC-GUA', center: [-2.1894, -79.8891], status: 'beta', currency: 'USD', paymentRail: 'Deuna & Bolivariano', activeDevices: 2910, latencyMs: '0.29ms' },
  { id: 'bog', name: 'Bogotá', country: 'Colombia', code: 'CO-DC', center: [4.7110, -74.0721], status: 'coming_soon', currency: 'COP', paymentRail: 'Nequi & Bre-B', activeDevices: 8400, latencyMs: '0.31ms' },
  { id: 'lim', name: 'Lima', country: 'Perú', code: 'PE-LIM', center: [-12.0464, -77.0428], status: 'coming_soon', currency: 'PEN', paymentRail: 'Yape & Plin', activeDevices: 5120, latencyMs: '0.28ms' },
];

const GEO_ALERTS = [
  {
    id: "alt-01",
    cityId: "cue",
    pet_name: "Max",
    species: "canine",
    breed: "Golden Retriever",
    alert_type: "lost" as const,
    sector: "El Vergel / Av. Solano",
    coords: [-2.9041, -79.0041] as [number, number],
    description: "Collar táctico rojo con placa de contacto directa. Muy dócil pero asustadizo ante ruidos vehiculares.",
    contact_phone: "+593 99 123 4567",
    distance_km: 0.8,
    time_ago: "Hace 22 min",
    reward: "$150",
    chip_status: "ISO Verificado",
    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "alt-02",
    cityId: "cue",
    pet_name: "Luna",
    species: "feline",
    breed: "Siamés Real",
    alert_type: "sighted" as const,
    sector: "Centro Histórico (San Blas)",
    coords: [-2.8974, -79.0045] as [number, number],
    description: "Avistada en tejado residencial cerca a cafetería San Blas. Lleva collar reflectivo celeste.",
    contact_phone: "+593 98 765 4321",
    distance_km: 0.2,
    time_ago: "Hace 48 min",
    chip_status: "Tag Activo",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "alt-03",
    cityId: "cue",
    pet_name: "Rocky",
    species: "canine",
    breed: "Schnauzer Miniatura",
    alert_type: "lost" as const,
    sector: "Totoracocha / Hurtado de Mendoza",
    coords: [-2.8895, -78.9850] as [number, number],
    description: "Corte recién hecho, responde entusiasmado a su nombre y silbido familiar.",
    contact_phone: "+593 99 888 2211",
    distance_km: 2.5,
    time_ago: "Hace 2 horas",
    reward: "$100",
    chip_status: "ISO Verificado",
    photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "alt-04",
    cityId: "cue",
    pet_name: "Toby",
    species: "canine",
    breed: "Labrador Chocolate",
    alert_type: "sighted" as const,
    sector: "Parque Lineal Yanuncay",
    coords: [-2.9150, -79.0180] as [number, number],
    description: "Visto jugando cerca de la ciclovía del río Yanuncay con arnés negro en excelente estado.",
    contact_phone: "+593 99 444 3322",
    distance_km: 2.1,
    time_ago: "Hace 35 min",
    chip_status: "Escaneo Pendiente",
    photo: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80"
  }
];

const COMMUNITY_ADOPTIONS = [
  {
    id: "adp-01",
    name: "Cobi",
    gender: "Macho • Esterilizado",
    age: "1.5 años",
    breed: "Mestizo Mediano",
    badge: "Hogar Temporal Verificado",
    location: "Sector Baños",
    health: "Vacunas al día + Chip ISO",
    story: "Rescatado en las riberas del río Tomebamba. Tiene un temperamento equilibrado, convive con niños y pasea sin tirar de la correa.",
    photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=600&q=80"
  },
  {
    id: "adp-02",
    name: "Misha",
    gender: "Hembra • Esterilizada",
    age: "9 meses",
    breed: "Carey Europea",
    badge: "Rescate Independiente",
    location: "Sector El Valle",
    health: "Test FeLV/FIV Negativo",
    story: "Rescatada y rehabilitada con protocolo médico completo. Es sumamente afectuosa, limpia y acostumbrada a interiores.",
    photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=600&q=80"
  }
];

type MainTab = 'my_pets' | 'store' | 'services' | 'alerts' | 'assistant' | 'adoptions' | 'chip_lookup';

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityNode>(CITY_NODES[0]);
  const [activeTab, setActiveTab] = useState<MainTab>('my_pets');
  const [radiusKm, setRadiusKm] = useState(3);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'cards'>('both');
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  // Estado de las Mascotas del Usuario Individual
  const [userPets, setUserPets] = useState<UserPet[]>(INITIAL_USER_PETS);
  const [selectedPetId, setSelectedPetId] = useState<string>(INITIAL_USER_PETS[0].id);
  const [storeCategoryFilter, setStoreCategoryFilter] = useState<string>('Todos');
  const [serviceCategoryFilter, setServiceCategoryFilter] = useState<string>('Todos');

  const activeUserPet = userPets.find(p => p.id === selectedPetId) || userPets[0];

  // Soporte Light / Dark Mode
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Handlers de la Bóveda de Mascotas
  const handleAddPet = (newPet: UserPet) => {
    setUserPets(prev => [...prev, newPet]);
  };

  const handleAddNote = (petId: string, note: PetNote) => {
    setUserPets(prev =>
      prev.map(p => (p.id === petId ? { ...p, notes: [note, ...p.notes] } : p))
    );
  };

  const handleAddVaccine = (petId: string, vaccine: VaccineRecord) => {
    setUserPets(prev =>
      prev.map(p => (p.id === petId ? { ...p, vaccines: [vaccine, ...p.vaccines] } : p))
    );
  };

  const handleAddClinicalRecord = (petId: string, record: ClinicalEntry) => {
    setUserPets(prev =>
      prev.map(p => (p.id === petId ? { ...p, clinicalHistory: [record, ...p.clinicalHistory] } : p))
    );
  };

  const handleAddPhoto = (petId: string, photo: { url: string; caption: string; date: string }) => {
    setUserPets(prev =>
      prev.map(p => (p.id === petId ? { ...p, gallery: [photo, ...p.gallery] } : p))
    );
  };

  const handleUpdateWeight = (petId: string, newWeight: number) => {
    setUserPets(prev =>
      prev.map(p => (p.id === petId ? { ...p, weightKg: newWeight } : p))
    );
  };

  // Validador de Microchips Universal ISO
  const [chipInput, setChipInput] = useState('');
  const [chipResult, setChipResult] = useState<{ isValid: boolean; standard: string; message: string; timestamp?: string } | null>(null);

  // Consola WebMCP & Comercio Agéntico
  const [isAgentConsoleOpen, setIsAgentConsoleOpen] = useState(false);
  const [telemetryStats, setTelemetryStats] = useState<AgentTelemetryStats | null>(null);

  // Inicialización de WebMCP y Registro de Herramientas Agénticas
  useEffect(() => {
    const cleanup = webMCPManager.initializeAgenticTools();
    webMCPManager.updatePetsState(userPets);
    pawloDB.getTelemetry().then(setTelemetryStats);
    return () => cleanup();
  }, [userPets]);

  // Asistente Inteligente PAWLO AI (Edge Neural Triage con $0 Costo Servidor)
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    sender: 'user' | 'bot';
    text: string;
    triageLevel?: 'RED' | 'YELLOW' | 'GREEN' | 'BLUE';
    badge?: string;
    action?: string;
    latencyMs?: number;
    cost?: string;
  }>>([
    {
      sender: 'bot',
      text: 'Bienvenido a PAWLO Neural Triage Edge. El motor clínico opera 100% en tu dispositivo y navegador con cortafuegos farmacológico activo y $0 costo de API.',
      badge: '⚡ EDGE COMPUTE IN-BROWSER (0ms)'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Comercio Conversacional & Servicios Integrales (Transporte, Hospedaje, Grooming, Vet, Etología)
  const [selectedService, setSelectedService] = useState<PetServiceItem | null>(null);
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    phone: '',
    paymentPreference: 'Deuna_P2P',
    sector: 'El Vergel',
    petName: activeUserPet.name,
    petBreed: activeUserPet.breed,
    dateOrSchedule: 'Hoy / Mañana por la mañana'
  });
  const [leadSuccess, setLeadSuccess] = useState<{ waUrl: string; refId: string } | null>(null);

  const handleValidateMicrochip = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = chipInput.trim();
    if (!clean) return;

    const now = new Date().toLocaleTimeString();
    if (/^[0-9]{15}$/.test(clean)) {
      setChipResult({
        isValid: true,
        standard: "ISO 11784 / 11785 FDX-B VÁLIDO",
        message: "Transponder biométrico de 15 dígitos verificado. Estructura de código de país y fabricante conforme para lectura clínica internacional.",
        timestamp: now
      });
    } else if (/^[A-Za-z0-9-]{8,16}$/.test(clean)) {
      setChipResult({
        isValid: true,
        standard: "REGISTRO CLÍNICO PRIVADO PAWLO",
        message: "Identificador verificado en la red de clínicas privadas asociadas.",
        timestamp: now
      });
    } else {
      setChipResult({
        isValid: false,
        standard: "FORMATO INVÁLIDO O NO RECONOCIDO",
        message: "El código debe contener exactamente 15 dígitos numéricos (estándar ISO universal) o un transponder clínico habilitado.",
        timestamp: now
      });
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const textToProcess = customPrompt ?? inputMsg;
    if (!textToProcess.trim()) return;
    if (!disclaimerAccepted) {
      alert("Por favor activa la casilla de consentimiento clínico a la izquierda antes de iniciar el triaje.");
      return;
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: textToProcess }]);
    if (!customPrompt) setInputMsg('');
    setIsAiLoading(true);

    try {
      // Motor de Triaje Clínico Edge (IndexedDB + Cortafuegos Farmacológico 0ms)
      const triage = await processOfflineTriage(textToProcess, activeUserPet);
      setIsAiLoading(false);

      setChatMessages(prev => [...prev, {
        sender: 'bot',
        triageLevel: triage.triageLevel,
        badge: triage.badge,
        text: triage.response,
        action: triage.actionRequired,
        latencyMs: triage.latencyMs,
        cost: triage.serverCost
      }]);

      // Actualizar telemetría local de ahorro
      const updatedStats = await pawloDB.getTelemetry();
      setTelemetryStats(updatedStats);
    } catch {
      setIsAiLoading(false);
      setChatMessages(prev => [...prev, {
        sender: 'bot',
        triageLevel: 'YELLOW',
        text: 'Error en procesamiento local. Por favor consulta directamente con un veterinario.',
        action: 'Acudir a Clínica de Emergencia'
      }]);
    }
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService) return;
    const refId = `PWL-${selectedCity.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const targetWa = selectedService.whatsapp || "593998408369";
    const waText = `Hola ${selectedService.provider}, solicito confirmar reserva de "${selectedService.title}" vía PAWLO (${selectedCity.name}). Mascota: ${leadForm.petName} (${leadForm.petBreed}, Chip ISO: ${activeUserPet.microchipIso}). Horario: ${leadForm.dateOrSchedule}. Código: ${refId}. Sector: ${leadForm.sector}. Pago acordado: ${leadForm.paymentPreference}.`;
    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(waText)}`;

    setLeadSuccess({ waUrl, refId });
  };

  const visibleAlerts = GEO_ALERTS.filter(a => a.distance_km <= radiusKm);
  const filteredServices = EXPANDED_SERVICES_CATALOG.filter(
    s => serviceCategoryFilter === 'Todos' || s.category === serviceCategoryFilter
  );

  const navTabs = [
    { id: 'my_pets', label: 'Mis Mascotas', icon: PawPrint },
    { id: 'store', label: 'Tienda & Farmacia', icon: ShoppingBag },
    { id: 'services', label: 'Servicios', icon: Zap },
    { id: 'alerts', label: 'Radar', icon: Compass },
    { id: 'assistant', label: 'Neural AI', icon: Sparkles },
    { id: 'adoptions', label: 'Adopciones', icon: Heart },
    { id: 'chip_lookup', label: 'Biometría ISO', icon: Fingerprint },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern relative selection:bg-[#00F5A0] selection:text-[#03060C] pb-20 lg:pb-0">
      
      {/* Iluminación Atmosférica Boreal */}
      <div className={`fixed -top-24 left-1/2 -translate-x-1/2 w-[950px] h-[380px] rounded-full blur-[130px] pointer-events-none -z-0 transition-opacity duration-700 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-[#00F5A0]/15 via-[#00D9F5]/12 to-[#6366F1]/15 opacity-100' 
          : 'bg-gradient-to-r from-emerald-500/10 via-sky-500/10 to-indigo-500/10 opacity-60'
      }`}></div>

      {/* BARRA DE TELEMETRÍA SUPERIOR + ESTADO DE PREPARACIÓN APP STORES */}
      <div className={`safe-area-top border-b text-xs font-mono py-2 px-4 lg:px-8 flex items-center justify-between z-50 transition-colors ${
        theme === 'dark' 
          ? 'bg-[#020409]/95 border-white/10 text-slate-300' 
          : 'bg-slate-900 text-slate-200 border-slate-800'
      }`}>
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar">
          <span className="flex items-center space-x-2 text-[#00F5A0] font-bold shrink-0">
            <Radio className="w-3.5 h-3.5 animate-pulse text-[#00F5A0]" />
            <span>PAWLO SUPER-APP OS v2.0</span>
          </span>
          <span className="opacity-40">|</span>
          <span className="shrink-0">NODO: <strong className="text-white font-bold">{selectedCity.code} ({selectedCity.name})</strong></span>
          <span className="opacity-40 hidden sm:inline">|</span>
          <span className="hidden sm:inline shrink-0">MASCOTA ACTIVA: <strong className="text-[#00F5A0] font-bold">{activeUserPet.name} ({activeUserPet.weightKg} kg)</strong></span>
          <span className="opacity-40 hidden md:inline">|</span>
          <span className="hidden md:inline shrink-0">GUARDIANES COMUNIDAD: <strong className="text-white font-bold">{selectedCity.activeDevices.toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={() => setIsAgentConsoleOpen(true)}
            className="px-2.5 py-0.5 rounded-md bg-[#00F5A0]/20 hover:bg-[#00F5A0]/30 text-[#00F5A0] border border-[#00F5A0]/40 font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer text-xs"
            title="Abrir consola de herramientas WebMCP y Comercio Agéntico"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>WebMCP Agéntico</span>
          </button>
          <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-[#00F5A0] border border-[#00F5A0]/30 font-bold hidden sm:inline-flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>iOS & Google Play Ready</span>
          </span>
          <span className="px-2.5 py-0.5 rounded-md bg-white/10 text-xs text-white border border-white/15 font-bold hidden lg:inline">
            ISO 11784/11785
          </span>
        </div>
      </div>

      {/* HEADER PRINCIPAL PAWLO FLAGSHIP */}
      <header className={`border-b sticky top-0 z-40 px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4 backdrop-blur-2xl transition-colors duration-300 ${
        theme === 'dark' 
          ? 'border-white/10 bg-[#050914]/90' 
          : 'border-slate-300/80 bg-white/95 shadow-sm'
      }`}>
        
        {/* BRANDING + SELECTOR DE NODO URBANO */}
        <div className="flex items-center gap-2 sm:gap-5">
          <div onClick={() => setActiveTab('my_pets')} className="cursor-pointer">
            <PawloLogo size="md" cityBadge={selectedCity.name} theme={theme} />
          </div>

          {/* Conmutador de Nodos Globales */}
          <div className="relative">
            <button 
              onClick={() => setCitySelectorOpen(!citySelectorOpen)}
              className={`flex items-center space-x-1.5 sm:space-x-2 border px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold transition-all shadow-xs cursor-pointer min-h-[40px] ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 border-white/15 text-slate-100' 
                  : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
              }`}
            >
              <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#00F5A0]" />
              <span className="hidden xs:inline">{selectedCity.name}</span>
              <span className="xs:hidden font-mono">{selectedCity.code.split('-')[1]}</span>
              <ChevronDown className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-75" />
            </button>

            {citySelectorOpen && (
              <div className={`absolute top-full left-0 mt-2.5 w-72 rounded-3xl p-3 z-50 shadow-2xl border space-y-1.5 backdrop-blur-2xl ${
                theme === 'dark' 
                  ? 'bg-[#080E1E] border-white/20' 
                  : 'bg-white border-slate-300 shadow-2xl'
              }`}>
                <div className={`text-xs font-mono font-bold uppercase tracking-wider px-3 py-1 flex items-center justify-between ${
                  theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
                }`}>
                  <span>Seleccionar Ciudad</span>
                  <span>LATENCIA</span>
                </div>
                {CITY_NODES.map(city => (
                  <button
                    key={city.id}
                    onClick={() => { setSelectedCity(city); setCitySelectorOpen(false); }}
                    className={`w-full text-left px-3.5 py-3 rounded-2xl text-xs sm:text-sm flex items-center justify-between transition cursor-pointer ${
                      selectedCity.id === city.id 
                        ? (theme === 'dark' ? 'bg-[#00F5A0]/20 text-[#00F5A0] font-bold border border-[#00F5A0]/40' : 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-300') 
                        : (theme === 'dark' ? 'text-slate-200 hover:bg-white/10' : 'text-slate-800 hover:bg-slate-100')
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {city.name}
                        <span className="text-xs font-mono opacity-70">({city.currency})</span>
                      </div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>{city.paymentRail}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {city.status === 'active' && (
                        <span className="text-xs bg-[#00F5A0]/20 text-emerald-800 dark:text-[#00F5A0] px-2 py-0.5 rounded-full font-mono font-bold">ACTIVO</span>
                      )}
                      {city.status === 'beta' && (
                        <span className="text-xs bg-sky-500/20 text-sky-800 dark:text-sky-300 px-2 py-0.5 rounded-full font-mono font-bold">BETA</span>
                      )}
                      {city.status === 'coming_soon' && (
                        <span className="text-xs bg-slate-500/20 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded-full font-mono">PRÓX.</span>
                      )}
                      <span className="text-xs font-mono opacity-60 mt-0.5">{city.latencyMs}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DOCK DE NAVEGACIÓN DESKTOP & ACCIONES HEADER */}
        <div className="flex items-center gap-2">
          {/* Navegación desktop (oculta en móvil para dar espacio y evitar doble nav) */}
          <nav className={`hidden lg:flex items-center p-1.5 rounded-2xl border text-xs sm:text-sm font-bold transition-all shadow-xs ${
            theme === 'dark' 
              ? 'bg-[#03060C] border-white/15' 
              : 'bg-slate-100 border-slate-300'
          }`}>
            {navTabs.map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as MainTab)}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 shrink-0 cursor-pointer ${
                    isActive 
                      ? 'btn-primary-2026 !rounded-xl !py-2 !px-3.5' 
                      : (theme === 'dark' ? 'text-slate-300 hover:text-white hover:bg-white/10' : 'text-slate-700 hover:text-slate-950 hover:bg-white')
                  }`}
                >
                  <IconComponent className="w-4 h-4 stroke-[2.2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Selector de Mascota Activa Rápido en Móvil */}
          <div className="lg:hidden flex items-center">
            <button
              onClick={() => setActiveTab('my_pets')}
              className={`flex items-center gap-2 px-2.5 py-1 rounded-xl border text-xs font-bold ${
                theme === 'dark' ? 'bg-white/5 border-white/15 text-slate-200' : 'bg-slate-100 border-slate-300 text-slate-800'
              }`}
            >
              <img src={activeUserPet.avatar} alt={activeUserPet.name} className="w-6 h-6 rounded-lg object-cover" />
              <span>{activeUserPet.name}</span>
            </button>
          </div>

          {/* Conmutador de Tema (Sol / Luna) */}
          <button
            onClick={toggleTheme}
            className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all duration-200 flex items-center justify-center cursor-pointer shrink-0 min-h-[40px] min-w-[40px] ${
              theme === 'dark' 
                ? 'bg-white/10 hover:bg-white/15 border-white/15 text-amber-300' 
                : 'bg-white hover:bg-slate-100 border-slate-300 text-slate-800 shadow-sm'
            }`}
            title={`Cambiar a ${theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 space-y-5 sm:space-y-8 relative z-10">

        {/* 1. MÓDULO ESTRELLA: MIS MASCOTAS (BÓVEDA DIGITAL PERSONAL) */}
        {activeTab === 'my_pets' && (
          <MyPetsVault
            pets={userPets}
            selectedPetId={selectedPetId}
            onSelectPet={setSelectedPetId}
            onAddPet={handleAddPet}
            onAddNote={handleAddNote}
            onAddVaccine={handleAddVaccine}
            onAddClinicalRecord={handleAddClinicalRecord}
            onAddPhoto={handleAddPhoto}
            onUpdateWeight={handleUpdateWeight}
            onNavigateToStore={(cat) => {
              if (cat) setStoreCategoryFilter(cat);
              setActiveTab('store');
            }}
            onNavigateToServices={(cat) => {
              if (cat) setServiceCategoryFilter(cat);
              setActiveTab('services');
            }}
            cityName={selectedCity.name}
            theme={theme}
          />
        )}

        {/* 2. MÓDULO: TIENDA & FARMACIA PERSONALIZADA (COMIDA, MEDICAMENTOS, JUGUETES, CAMAS, CASAS) */}
        {activeTab === 'store' && (
          <PetStoreMarketplace
            products={STORE_CATALOG}
            pets={userPets}
            selectedPetId={selectedPetId}
            onSelectPet={setSelectedPetId}
            initialCategory={storeCategoryFilter}
            cityName={selectedCity.name}
            currency={selectedCity.currency}
            paymentRail={selectedCity.paymentRail}
            theme={theme}
            onOpenAgentConsole={() => setIsAgentConsoleOpen(true)}
          />
        )}

        {/* 3. MÓDULO: SERVICIOS INTEGRALES (TRANSPORTE, HOSPEDAJE, GROOMING, VETERINARIA, ETOLOGÍA) */}
        {activeTab === 'services' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <span className="text-xs font-mono uppercase font-bold tracking-wider badge-emerald px-3 py-1 rounded-full">
                  PAWLO SERVICIOS INTEGRALES • {selectedCity.name.toUpperCase()}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">
                  Transporte, Hospedaje, Grooming, Veterinaria & Etología
                </h2>
                <p className={`text-sm sm:text-base mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Contrata profesionales verificados para <strong>{activeUserPet.name}</strong> con su ficha clínica y carnet sincronizados. Pago directo vía <strong>{selectedCity.paymentRail}</strong>.
                </p>
              </div>

              {/* Selector de Mascota Activa para el Servicio */}
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 ${
                theme === 'dark' ? 'bg-[#03060C]/90 border-white/15' : 'bg-slate-50 border-slate-300'
              }`}>
                <img src={activeUserPet.avatar} alt={activeUserPet.name} className="w-11 h-11 rounded-xl object-cover" />
                <div>
                  <label htmlFor="service-pet-selector" className="text-xs font-mono uppercase opacity-75 block">Servicio para:</label>
                  <select
                    id="service-pet-selector"
                    name="servicePetSelector"
                    value={activeUserPet.id}
                    onChange={e => {
                      setSelectedPetId(e.target.value);
                      const found = userPets.find(p => p.id === e.target.value);
                      if (found) {
                        setLeadForm(prev => ({ ...prev, petName: found.name, petBreed: found.breed }));
                      }
                    }}
                    className="font-extrabold text-sm bg-transparent focus:outline-none cursor-pointer"
                  >
                    {userPets.map(pet => (
                      <option key={pet.id} value={pet.id} className="text-slate-900">
                        {pet.name} ({pet.breed} • {pet.weightKg}kg)
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Filtros de Categorías de Servicios (Scroll horizontal suave en móviles) */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 sm:pb-0">
              {[
                { id: 'Todos', label: 'Todos', icon: Zap },
                { id: 'Transporte', label: 'Pet Taxi', icon: Car },
                { id: 'Hospedaje', label: 'Hotel & Suites', icon: Building2 },
                { id: 'Grooming', label: 'Grooming & Spa', icon: Scissors },
                { id: 'Veterinaria', label: 'Veterinaria 24/7', icon: Stethoscope },
                { id: 'Etología', label: 'Etología & Paseo', icon: Brain },
              ].map(cat => {
                const Icon = cat.icon;
                const isSel = serviceCategoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setServiceCategoryFilter(cat.id)}
                    className={`px-3.5 py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 border transition cursor-pointer shrink-0 min-h-[44px] active:scale-[0.98] ${
                      isSel
                        ? 'btn-primary-2026 !rounded-xl sm:!rounded-2xl border-transparent'
                        : (theme === 'dark'
                            ? 'bg-white/5 border-white/15 text-slate-300 hover:bg-white/10'
                            : 'bg-white border-slate-300 text-slate-800 hover:bg-slate-100')
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="whitespace-nowrap">{cat.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map(srv => (
                <div key={srv.id} className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-emerald-500/60 dark:hover:border-[#00F5A0]/60 transition-all duration-300">
                  <div className="space-y-3.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold badge-emerald px-3 py-1 rounded-full">
                        {srv.category.toUpperCase()} • {srv.badge}
                      </span>
                      <div className="text-right">
                        <span className="text-2xl font-extrabold font-display">${srv.price.toFixed(2)}</span>
                        <span className="block text-[11px] font-mono opacity-70">{srv.priceUnit}</span>
                      </div>
                    </div>

                    <h3 className="font-extrabold text-base sm:text-lg leading-snug">{srv.title}</h3>
                    <p className={`text-xs sm:text-sm font-bold ${theme === 'dark' ? 'text-emerald-400' : 'text-emerald-800'}`}>
                      {srv.provider}
                    </p>

                    <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {srv.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      {srv.includes.map((inc, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-[#00F5A0] shrink-0" />
                          <span>{inc}</span>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs sm:text-sm pt-2 border-t border-slate-300 dark:border-white/10">
                      <span className="flex items-center text-emerald-700 dark:text-[#00F5A0] font-semibold">
                        <MapPin className="w-4 h-4 mr-1 shrink-0" /> {srv.sector}
                      </span>
                      <span className="flex items-center text-amber-500 font-bold">
                        <Star className="w-4 h-4 fill-amber-500 mr-1" /> {srv.rating} ({srv.reviews})
                      </span>
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedService(srv);
                      setLeadForm(prev => ({
                        ...prev,
                        petName: activeUserPet.name,
                        petBreed: activeUserPet.breed
                      }));
                      setLeadSuccess(null);
                    }}
                    className="btn-primary-2026 w-full py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    <span>Reservar para {activeUserPet.name}</span>
                    <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Modal de Reserva de Servicio */}
            {selectedService && (
              <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 max-w-xl mx-auto space-y-5">
                <div className={`flex items-center justify-between border-b pb-4 ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-300'
                }`}>
                  <div>
                    <span className="text-xs font-mono uppercase text-emerald-700 dark:text-[#00F5A0] font-bold">
                      RESERVA DIRECTA CON EXPEDIENTE PAWLO
                    </span>
                    <h3 className="font-extrabold text-xl">{selectedService.provider}</h3>
                    <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                      {selectedService.title} — <strong>${selectedService.price.toFixed(2)} {selectedCity.currency}</strong>
                    </p>
                  </div>
                  <button onClick={() => setSelectedService(null)} className="opacity-70 hover:opacity-100 font-bold text-base p-2 cursor-pointer">✕</button>
                </div>

                {!leadSuccess ? (
                  <form
                    onSubmit={handleBookingSubmit}
                    toolname="pawlo_book_service"
                    tooldescription="Reserva servicios veterinarios, hospedaje o transporte pet taxi con expediente PAWLO"
                    toolautosubmit="true"
                    className="space-y-4 text-xs sm:text-sm"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-fullname" className="font-bold block mb-1">Nombre del Tutor:</label>
                        <input 
                          id="lead-fullname"
                          name="fullName"
                          type="text" 
                          required
                          placeholder="Ej. Nicolás Norton"
                          value={leadForm.fullName}
                          onChange={e => setLeadForm({...leadForm, fullName: e.target.value})}
                          className="w-full glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-phone" className="font-bold block mb-1">WhatsApp:</label>
                        <input 
                          id="lead-phone"
                          name="phone"
                          type="text" 
                          required
                          placeholder="0998408369"
                          value={leadForm.phone}
                          onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                          className="w-full glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-petname" className="font-bold block mb-1">Mascota Seleccionada:</label>
                        <input 
                          id="lead-petname"
                          name="petName"
                          type="text" 
                          required
                          value={leadForm.petName}
                          onChange={e => setLeadForm({...leadForm, petName: e.target.value})}
                          className="w-full glass-input rounded-xl px-4 py-3 focus:outline-none font-bold"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-schedule" className="font-bold block mb-1">Fecha / Horario requerido:</label>
                        <input 
                          id="lead-schedule"
                          name="dateOrSchedule"
                          type="text" 
                          required
                          value={leadForm.dateOrSchedule}
                          onChange={e => setLeadForm({...leadForm, dateOrSchedule: e.target.value})}
                          className="w-full glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-sector" className="font-bold block mb-1">Dirección / Sector en {selectedCity.name}:</label>
                        <input 
                          id="lead-sector"
                          name="sector"
                          type="text" 
                          required
                          placeholder="Ej. El Vergel"
                          value={leadForm.sector}
                          onChange={e => setLeadForm({...leadForm, sector: e.target.value})}
                          className="w-full glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-payment" className="font-bold block mb-1">Medio de Pago:</label>
                        <select 
                          id="lead-payment"
                          name="paymentPreference"
                          value={leadForm.paymentPreference}
                          onChange={e => setLeadForm({...leadForm, paymentPreference: e.target.value})}
                          className="w-full glass-input rounded-xl px-4 py-3 focus:outline-none"
                        >
                          <option value="Deuna_P2P">Deuna (P2P Instantáneo)</option>
                          <option value="Pichincha">Transferencia Bancaria Pichincha</option>
                          <option value="Produbanco">Produbanco / Be</option>
                          <option value="Contraentrega">Pago Presencial</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="btn-primary-2026 w-full py-4 text-xs sm:text-sm font-bold mt-3 cursor-pointer"
                    >
                      Confirmar Reserva y Enviar Carnet Digital por WhatsApp
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-14 h-14 bg-emerald-500/20 text-emerald-700 dark:text-[#00F5A0] rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xl">¡Servicio Reservado para {leadForm.petName}!</h4>
                      <p className={`text-xs sm:text-sm font-mono mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        CÓDIGO: {leadSuccess.refId}
                      </p>
                    </div>
                    <a 
                      href={leadSuccess.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary-2026 inline-flex items-center space-x-2.5 py-4 px-8 text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      <MessageSquare className="w-5 h-5 stroke-[2.5]" />
                      <span>Abrir WhatsApp con el Proveedor</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. MÓDULO: RADAR GEOESPACIAL COMUNITARIO (PROTECCIÓN AL RESTO DE ANIMALES) */}
        {activeTab === 'alerts' && (
          <section className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full badge-emerald text-xs font-mono font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>MALLA COMUNITARIA EN VIVO • {selectedCity.name.toUpperCase()}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.15]">
                    Radar de Protección y Rescate para Todos los Animales.
                  </h2>
                  <p className={`text-base leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                    Porque cuidar a nuestras mascotas también significa proteger a los animales de la comunidad en <strong>{selectedCity.name}</strong>. Localización instantánea en anillos de proximidad.
                  </p>
                </div>

                {/* Controles de Radio y Vista */}
                <div className="pt-6 mt-6 border-t border-slate-300 dark:border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-mono font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Vista:</span>
                    <div className={`flex items-center p-1 rounded-xl border text-xs sm:text-sm font-semibold ${
                      theme === 'dark' ? 'bg-[#03060C] border-white/15' : 'bg-slate-100 border-slate-300'
                    }`}>
                      {[
                        { id: 'both', label: 'Split Híbrido' },
                        { id: 'map', label: 'Solo Mapa' },
                        { id: 'cards', label: 'Tarjetas' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setViewMode(m.id as any)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            viewMode === m.id 
                              ? (theme === 'dark' ? 'bg-white/15 text-[#00F5A0]' : 'bg-white text-slate-950 shadow-sm border border-slate-200') 
                              : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-950')
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <span className={`text-xs font-mono font-bold uppercase ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>Radio:</span>
                    <div className={`flex items-center p-1 rounded-xl border text-xs sm:text-sm font-mono ${
                      theme === 'dark' ? 'bg-[#03060C] border-white/15' : 'bg-slate-100 border-slate-300'
                    }`}>
                      {[1, 3, 5, 8].map(r => (
                        <button 
                          key={r}
                          onClick={() => setRadiusKm(r)}
                          className={`px-3.5 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                            radiusKm === r 
                              ? (theme === 'dark' ? 'bg-[#00F5A0] text-slate-950 shadow-sm' : 'bg-emerald-600 text-white shadow-sm') 
                              : (theme === 'dark' ? 'text-slate-400 hover:text-white' : 'text-slate-700 hover:text-slate-950')
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bento Telemetría */}
              <div className="lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-mono uppercase font-bold tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Nodo {selectedCity.name}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold badge-emerald">
                    RED SOLIDARIA ACTIVA
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3.5 my-auto">
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                    <div className="text-3xl font-extrabold font-display text-emerald-600 dark:text-[#00F5A0]">{visibleAlerts.length}</div>
                    <div className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Alertas en {radiusKm} km</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                    <div className="text-3xl font-extrabold font-display text-sky-600 dark:text-[#00D9F5]">{selectedCity.latencyMs}</div>
                    <div className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>Latencia GiST</div>
                  </div>
                </div>

                <button 
                  onClick={() => alert(`Abriendo emisión de alerta comunitaria en ${selectedCity.name}. Puedes reportar un animal visto en calle o activar alerta SOS de ${activeUserPet.name}.`)}
                  className="btn-primary-2026 w-full py-3.5 px-4 text-sm flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Reportar Animal Extraviado / En Calle</span>
                </button>
              </div>
            </div>

            {/* Mapa Leaflet */}
            {(viewMode === 'both' || viewMode === 'map') && (
              <div className={`h-[450px] w-full rounded-3xl overflow-hidden border shadow-xl relative ${
                theme === 'dark' ? 'border-white/15' : 'border-slate-300'
              }`}>
                <div className="absolute top-4 right-4 z-[400] glass-panel px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-mono flex items-center space-x-3 pointer-events-none font-bold">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0]"></span>
                  <span>WGS84: {selectedCity.center[0].toFixed(4)}, {selectedCity.center[1].toFixed(4)}</span>
                  <span className="opacity-40">|</span>
                  <span className="text-emerald-700 dark:text-[#00F5A0]">RADIO: {radiusKm * 1000} m</span>
                </div>

                <MapContainer 
                  center={selectedCity.center} 
                  zoom={14} 
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Circle 
                    center={selectedCity.center} 
                    radius={radiusKm * 1000} 
                    pathOptions={{ color: theme === 'dark' ? '#00F5A0' : '#059669', fillColor: theme === 'dark' ? '#00F5A0' : '#059669', fillOpacity: 0.16, weight: 2.5 }} 
                  />
                  {visibleAlerts.map(alert => (
                    <Marker key={alert.id} position={alert.coords}>
                      <Popup>
                        <div className="p-1 space-y-1.5 text-slate-900 font-sans">
                          <strong className="block text-sm font-extrabold">{alert.pet_name} ({alert.breed})</strong>
                          <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded text-white ${alert.alert_type === 'lost' ? 'bg-rose-600' : 'bg-amber-600'}`}>
                            {alert.alert_type === 'lost' ? 'Extraviado' : 'Avistado'}
                          </span>
                          <p className="text-xs text-slate-700 leading-snug">{alert.description}</p>
                          <p className="text-xs font-semibold text-emerald-800">Zona: {alert.sector}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Tarjetas de Alertas */}
            {(viewMode === 'both' || viewMode === 'cards') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className="glass-panel rounded-3xl overflow-hidden hover:border-emerald-500/60 dark:hover:border-[#00F5A0]/60 transition-all duration-300 flex flex-col group">
                    <div className="relative h-56 bg-slate-900 overflow-hidden">
                      <img 
                        src={alert.photo} 
                        alt={alert.pet_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent"></div>
                      
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span className={`text-xs font-mono font-extrabold uppercase px-3 py-1 rounded-full shadow-md text-white ${
                          alert.alert_type === 'lost' ? 'bg-rose-600' : 'bg-amber-600'
                        }`}>
                          {alert.alert_type === 'lost' ? '● PERDIDO' : '◉ AVISTADO'}
                        </span>
                        <span className="text-xs font-mono font-bold bg-black/80 backdrop-blur-md text-[#00F5A0] px-3 py-1 rounded-full border border-white/20">
                          {alert.distance_km} km
                        </span>
                      </div>

                      {alert.reward && (
                        <span className="absolute top-3 right-3 text-xs font-mono font-extrabold bg-[#00F5A0] text-slate-950 px-3 py-1 rounded-full shadow-lg">
                          RECOMPENSA {alert.reward}
                        </span>
                      )}

                      <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                        <div>
                          <h3 className="font-extrabold text-2xl leading-none text-white">{alert.pet_name}</h3>
                          <span className="text-xs text-slate-200 font-semibold">{alert.breed}</span>
                        </div>
                        <span className="text-xs font-mono bg-black/60 px-2.5 py-1 rounded-md text-slate-200 font-medium">
                          {alert.time_ago}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center text-xs sm:text-sm font-bold text-emerald-700 dark:text-[#00F5A0] truncate">
                          <MapPin className="w-4 h-4 mr-1.5 shrink-0" />
                          <span>{alert.sector}</span>
                        </div>
                        <p className={`text-xs sm:text-sm leading-relaxed p-3.5 rounded-2xl border ${
                          theme === 'dark' 
                            ? 'bg-[#03060C]/70 border-white/10 text-slate-200' 
                            : 'bg-slate-50 border-slate-300 text-slate-800'
                        }`}>
                          {alert.description}
                        </p>
                      </div>

                      <a 
                        href={`tel:${alert.contact_phone}`}
                        className="btn-primary-2026 w-full py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2"
                      >
                        <PhoneCall className="w-4 h-4 stroke-[2.5]" />
                        <span>Contactar / Ayudar</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 5. MÓDULO: PAWLO NEURAL AI TRIAGE */}
        {activeTab === 'assistant' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 glass-panel rounded-3xl p-6 sm:p-7 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center space-x-3.5">
                  <div className="p-3.5 rounded-2xl bg-[#00F5A0]/15 text-emerald-800 dark:text-[#00F5A0] border border-[#00F5A0]/30">
                    <Cpu className="w-7 h-7" />
                  </div>
                  <div>
                    <span className="text-xs font-mono uppercase tracking-widest text-emerald-700 dark:text-[#00F5A0] font-bold">
                      MOTOR DE SEGURIDAD v4.2
                    </span>
                    <h3 className="font-extrabold text-xl leading-tight">PAWLO Clinical Shield™</h3>
                  </div>
                </div>

                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  Asistente conectado al perfil de <strong>{activeUserPet.name}</strong> ({activeUserPet.breed}, {activeUserPet.weightKg} kg) en <strong>{selectedCity.name}</strong>.
                </p>

                <div className={`p-4 rounded-2xl border space-y-2 ${
                  theme === 'dark' 
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200' 
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <p className="font-extrabold text-sm flex items-center text-rose-600 dark:text-rose-400">
                    <Lock className="w-4 h-4 mr-2 text-rose-600 dark:text-rose-400" />
                    Cortafuegos Farmacológico Activo
                  </p>
                  <p className="text-xs leading-relaxed">
                    Bloqueo estricto del 100% ante consultas de dosis empíricas. Para comprar antiparasitarios o recetas validadas usa la pestaña <strong>Tienda & Farmacia</strong>.
                  </p>
                </div>

                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/80 border-white/15' : 'bg-slate-50 border-slate-300'}`}>
                  <label htmlFor="pawlo-clinical-consent" className="flex items-start space-x-3 cursor-pointer select-none">
                    <input 
                      id="pawlo-clinical-consent"
                      name="clinicalConsent"
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-1 rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 h-5 w-5 shrink-0"
                    />
                    <span className={`text-xs sm:text-sm font-semibold leading-snug ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                      Habilitar protocolo de triaje preventivo (Comprendo que no sustituye la consulta médica física).
                    </span>
                  </label>
                </div>
              </div>

              <div className={`border-t pt-4 space-y-2.5 ${theme === 'dark' ? 'border-white/10' : 'border-slate-300'}`}>
                <span className={`text-xs font-mono font-bold uppercase tracking-wider block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Escala de Urgencias:
                </span>
                <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono font-bold">
                  <div className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' : 'bg-rose-100 text-rose-900 border-rose-300'}`}>
                    ROJO • 0h Crítico
                  </div>
                  <div className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-100 text-amber-900 border-amber-300'}`}>
                    AMARILLO • &lt;12h
                  </div>
                  <div className={`p-2 rounded-xl border ${theme === 'dark' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-emerald-100 text-emerald-900 border-emerald-300'}`}>
                    VERDE • Rutina
                  </div>
                </div>
              </div>
            </div>

            {/* Consola de Triaje */}
            <div className="lg:col-span-8 glass-panel rounded-3xl flex flex-col h-[580px] overflow-hidden">
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                theme === 'dark' ? 'bg-white/[0.03] border-white/10' : 'bg-slate-100 border-slate-300'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-[#00F5A0] shadow-[0_0_10px_#00F5A0] animate-pulse"></div>
                  <span className="font-bold text-sm sm:text-base">PAWLO Neural Edge Copilot ({activeUserPet.name})</span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-emerald-500/20 text-[#00F5A0] border border-[#00F5A0]/30 font-bold hidden sm:inline-block">
                    100% In-Browser • $0.00
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsAgentConsoleOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Bot className="w-3.5 h-3.5 text-[#00F5A0]" />
                    <span>WebMCP Console</span>
                  </button>
                  <span className={`text-xs font-mono font-bold hidden md:inline ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                    Nodo: {selectedCity.name}
                  </span>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed space-y-2 shadow-xs ${
                      msg.sender === 'user' 
                        ? 'btn-primary-2026 !shadow-none font-bold rounded-br-none' 
                        : (theme === 'dark' ? 'bg-[#03060C] border border-white/15 text-slate-100 rounded-bl-none' : 'bg-slate-50 border border-slate-300 text-slate-900 rounded-bl-none')
                    }`}>
                      {msg.badge && (
                        <div className="flex items-center justify-between gap-2 pb-1.5 mb-1 border-b border-white/10 text-[10px] font-mono">
                          <span className="text-[#00F5A0] font-bold">{msg.badge}</span>
                          {msg.cost && <span className="opacity-60">{msg.cost}</span>}
                        </div>
                      )}
                      <p>{msg.text}</p>
                      {msg.action && (
                        <div className={`mt-2.5 pt-2.5 border-t font-mono font-bold text-emerald-700 dark:text-[#00F5A0] flex items-center ${
                          theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                        }`}>
                          <Navigation className="w-4 h-4 mr-1.5 shrink-0" />
                          <span>DIRECTIVA: {msg.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Chips de Simulación Rápida */}
                {disclaimerAccepted && chatMessages.length === 1 && (
                  <div className="pt-2 space-y-2.5">
                    <span className={`text-xs font-mono uppercase font-bold block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                      Escenarios de Prueba en 1 Clic (Edge Compute & Reglas):
                    </span>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleSendMessage("¿Cuántos mg de ibuprofeno le puedo dar a mi perro por dolor?")}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition font-bold cursor-pointer ${
                          theme === 'dark' 
                            ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' 
                            : 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
                        }`}
                      >
                        🧪 Probar Bloqueo Farmacológico
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage("¿Cuánto debe comer al día y cuántos gramos de croquetas?")}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition font-bold cursor-pointer ${
                          theme === 'dark' 
                            ? 'border-sky-500/40 bg-sky-500/15 text-sky-300 hover:bg-sky-500/25' 
                            : 'border-sky-300 bg-sky-50 text-sky-900 hover:bg-sky-100'
                        }`}
                      >
                        🥣 Probar Ración Nutricional (RER)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Mi mascota tiene vómito desde la mañana y está decaída")}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition font-bold cursor-pointer ${
                          theme === 'dark' 
                            ? 'border-amber-500/40 bg-amber-500/15 text-amber-300 hover:bg-amber-500/25' 
                            : 'border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100'
                        }`}
                      >
                        ⚠️ Probar Triaje Amarillo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Comió chocolate negro y está temblando")}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition font-bold cursor-pointer ${
                          theme === 'dark' 
                            ? 'border-rose-500/40 bg-rose-500/15 text-rose-300 hover:bg-rose-500/25' 
                            : 'border-rose-300 bg-rose-50 text-rose-900 hover:bg-rose-100'
                        }`}
                      >
                        🚨 Probar Emergencia Vital
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Tira mucho de la correa en el parque, ¿cómo mejoro su paseo?")}
                        className={`text-xs px-3.5 py-2 rounded-xl border transition font-bold cursor-pointer ${
                          theme === 'dark' 
                            ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25' 
                            : 'border-emerald-300 bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                        }`}
                      >
                        🌿 Probar Consulta de Conducta
                      </button>
                    </div>
                  </div>
                )}

                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className={`border rounded-2xl p-4 text-xs sm:text-sm font-mono flex items-center space-x-2.5 ${
                      theme === 'dark' ? 'bg-[#03060C] border-white/15 text-[#00F5A0]' : 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                    }`}>
                      <span className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] animate-ping"></span>
                      <span>ANALIZANDO EXPEDIENTE DE {activeUserPet.name.toUpperCase()}...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                toolname="pawlo_triage_symptom"
                tooldescription="Triaje clínico de signos, síntomas y cálculo nutricional en navegador con cortafuegos farmacológico"
                toolautosubmit="true"
                className={`p-4 border-t flex items-center space-x-3 ${
                  theme === 'dark' ? 'bg-[#03060C] border-white/10' : 'bg-slate-100 border-slate-300'
                }`}
              >
                <label htmlFor="pawlo-chat-input" className="sr-only">Consulta clínica o de conducta</label>
                <input 
                  id="pawlo-chat-input"
                  name="chatMessage"
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder={disclaimerAccepted ? `Describe síntomas o conducta de ${activeUserPet.name}...` : "Activa la casilla a la izquierda para consultar..."}
                  disabled={!disclaimerAccepted}
                  className="flex-1 glass-input rounded-2xl px-4 py-3.5 text-xs sm:text-sm placeholder-slate-400 focus:outline-none"
                />
                <button 
                  type="submit"
                  aria-label="Enviar consulta"
                  disabled={!disclaimerAccepted || !inputMsg.trim()}
                  className="btn-primary-2026 p-3.5 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </section>
        )}

        {/* 6. MÓDULO: BIOMETRÍA & ESCÁNER ISO UNIVERSAL */}
        {activeTab === 'chip_lookup' && (
          <section className="max-w-2xl mx-auto space-y-6">
            <div className="glass-panel rounded-3xl p-7 sm:p-9 space-y-6">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-[#00F5A0]/15 border border-[#00F5A0]/30 rounded-2xl text-emerald-800 dark:text-[#00F5A0]">
                  <Fingerprint className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-700 dark:text-[#00F5A0]">
                    REGISTRO UNIVERSAL DE TRANSPONDERS
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-extrabold">Validador Biométrico ISO 11784/11785</h2>
                </div>
              </div>

              <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Verifica la validez y fabricante de cualquier microchip FDX-B de 15 dígitos internacional o códigos registrados en la red privada de clínicas de {selectedCity.name}.
              </p>

              <form
                onSubmit={handleValidateMicrochip}
                toolname="pawlo_verify_microchip"
                tooldescription="Valida microchip biométrico ISO 11784/11785 FDX-B de 15 dígitos de forma local"
                toolautosubmit="true"
                className="space-y-4 pt-2"
              >
                <div>
                  <label htmlFor="pawlo-chip-input" className="text-xs sm:text-sm font-bold block mb-1">
                    Número de Microchip (15 dígitos ISO o Código Clínico):
                  </label>
                  <div className="mt-2 flex gap-3">
                    <input 
                      id="pawlo-chip-input"
                      name="chipNumber"
                      type="text" 
                      value={chipInput}
                      onChange={e => setChipInput(e.target.value)}
                      placeholder="Ej. 981098104592831"
                      className="flex-1 glass-input rounded-2xl px-4 py-3.5 text-xs sm:text-sm focus:outline-none font-mono tracking-wider"
                    />
                    <button 
                      type="submit"
                      className="btn-primary-2026 px-7 py-3.5 text-xs sm:text-sm font-bold cursor-pointer"
                    >
                      Escanear
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm font-mono font-semibold">
                  <span className="opacity-60">Probar chips de tus mascotas:</span>
                  {userPets.map(pet => (
                    <button
                      key={pet.id}
                      type="button"
                      onClick={() => setChipInput(pet.microchipIso)}
                      className="text-emerald-700 dark:text-[#00F5A0] hover:underline cursor-pointer"
                    >
                      [{pet.name}: {pet.microchipIso}]
                    </button>
                  ))}
                </div>
              </form>

              {chipResult && (
                <div className={`p-5 rounded-2xl border text-xs sm:text-sm space-y-2 ${
                  chipResult.isValid 
                    ? (theme === 'dark' ? 'bg-[#00F5A0]/15 border-[#00F5A0]/40 text-emerald-200' : 'bg-emerald-50 border-emerald-300 text-emerald-950') 
                    : (theme === 'dark' ? 'bg-rose-500/15 border-rose-500/40 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-950')
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <div className="flex items-center space-x-2 font-mono text-sm sm:text-base">
                      {chipResult.isValid ? (
                        <Check className="w-5 h-5 text-emerald-700 dark:text-[#00F5A0]" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-rose-600" />
                      )}
                      <span>{chipResult.standard}</span>
                    </div>
                    <span className="text-xs font-mono opacity-70">{chipResult.timestamp}</span>
                  </div>
                  <p className="leading-relaxed font-medium">{chipResult.message}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 7. MÓDULO: ADOPCIONES COMUNITARIAS VERIFICADAS */}
        {activeTab === 'adoptions' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8">
              <span className="text-xs font-mono uppercase font-bold tracking-wider badge-emerald px-3 py-1 rounded-full">
                RED CIUDADANA DE ADOPCIONES • {selectedCity.name.toUpperCase()}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">Adopción Responsable Directa en {selectedCity.name}</h2>
              <p className={`text-xs sm:text-sm mt-1 max-w-2xl ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                Conectamos hogares temporales y rescatistas independientes con familias responsables. Al adoptar, la mascota recibe automáticamente su bóveda digital PAWLO con carnet e historial clínico.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {COMMUNITY_ADOPTIONS.map(pet => (
                <div key={pet.id} className="glass-panel rounded-3xl overflow-hidden flex flex-col sm:flex-row group hover:border-emerald-500/60 dark:hover:border-[#00F5A0]/60 transition-all duration-300">
                  <div className="w-full sm:w-60 h-60 sm:h-auto bg-slate-900 relative overflow-hidden shrink-0">
                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <span className="absolute top-3 left-3 text-xs font-mono font-bold bg-black/80 backdrop-blur-md text-[#00F5A0] px-3 py-1 rounded-full border border-white/20">
                      {pet.badge}
                    </span>
                  </div>
                  <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-2xl sm:text-3xl">{pet.name}</h3>
                        <span className="text-xs sm:text-sm font-mono text-emerald-700 dark:text-[#00F5A0] font-bold">{pet.gender}</span>
                      </div>
                      <p className={`text-xs sm:text-sm font-semibold mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                        {pet.breed} • {pet.age} • {pet.location}
                      </p>
                      <div className="mt-2.5">
                        <span className="text-xs font-mono px-3 py-1 rounded-md badge-indigo font-bold inline-block">
                          ✓ {pet.health}
                        </span>
                      </div>
                      <p className={`text-xs sm:text-sm mt-3.5 leading-relaxed p-3.5 rounded-2xl border ${
                        theme === 'dark' ? 'bg-[#03060C]/70 border-white/10 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                      }`}>
                        "{pet.story}"
                      </p>
                    </div>

                    <button 
                      onClick={() => alert(`Solicitud enviada directamente al hogar temporal de ${pet.name} en ${selectedCity.name}.`)}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-rose-600 to-rose-700 hover:brightness-110 text-white rounded-2xl text-xs sm:text-sm font-bold transition flex items-center justify-center space-x-2 shadow-md shadow-rose-600/30 cursor-pointer"
                    >
                      <Heart className="w-4 h-4 fill-white" />
                      <span>Postular para Adopción</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR NATIVA PARA MÓVILES (iOS App Store / Google Play Ergonomics) */}
      <nav
        aria-label="Navegación móvil nativa"
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-2xl safe-area-bottom px-1 pt-1.5 flex items-center justify-around shadow-2xl ${
          theme === 'dark'
            ? 'bg-[#040812]/95 border-white/15 text-slate-300'
            : 'bg-white/95 border-slate-300 text-slate-700 shadow-2xl'
        }`}
      >
        {[
          { id: 'my_pets', label: 'Mascotas', icon: PawPrint },
          { id: 'store', label: 'Tienda', icon: ShoppingBag },
          { id: 'services', label: 'Servicios', icon: Zap },
          { id: 'alerts', label: 'Radar', icon: Compass },
          { id: 'assistant', label: 'Triaje IA', icon: Sparkles },
        ].map(tab => {
          const Icon = tab.icon;
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as MainTab)}
              className={`flex-1 flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[11px] font-bold transition cursor-pointer min-h-[50px] active:scale-95 ${
                isAct
                  ? (theme === 'dark' ? 'text-[#00F5A0] bg-white/5' : 'text-emerald-700 font-extrabold bg-emerald-50')
                  : 'opacity-75 hover:opacity-100'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5 stroke-[2.2]" />
              <span className="leading-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* FOOTER */}
      <footer className={`border-t py-6 px-6 lg:px-8 text-xs sm:text-sm flex flex-wrap items-center justify-between gap-4 relative z-10 transition-colors duration-300 ${
        theme === 'dark' ? 'border-white/10 bg-[#020409] text-slate-400' : 'border-slate-300 bg-white text-slate-600'
      }`}>
        <div className="flex items-center space-x-3">
          <PawloLogo size="sm" showWordmark={false} theme={theme} />
          <span className="font-bold">PAWLO™ Urban Pet Super-App • Nodo Activo: {selectedCity.name} ({selectedCity.code})</span>
        </div>
        <div className="font-mono text-xs opacity-75">
          Capacitor iOS/Android Ready | ISO 11784/11785 | PostGIS Spatial Engine
        </div>
      </footer>

      {/* MODAL / CONSOLA INTERACTIVA DE WEBMCP & COMERCIO AGÉNTICO */}
      <AgenticWebMCPConsole
        theme={theme}
        isOpen={isAgentConsoleOpen}
        onClose={() => setIsAgentConsoleOpen(false)}
      />
    </div>
  );
}
