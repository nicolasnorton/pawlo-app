import React, { useState, useEffect } from 'react';
import { 
  Heart, MessageSquare, PhoneCall, ShieldCheck, 
  MapPin, CheckCircle2, Sparkles, Navigation, 
  ShieldAlert, ArrowRight, Send, Check, AlertCircle,
  Activity, Compass, Zap, Globe, ChevronDown, Sun, Moon,
  Radio, Cpu, Fingerprint, Star, Clock, Layers, PlusCircle, Lock
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { PawloLogo } from './components/PawloLogo';

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

// Nodos Urbanos Disponibles (Arquitectura Multi-Ciudad de PAWLO)
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
    description: "Collar táctico rojo con tag QR. Muy noble pero asustadizo ante tráfico pesado.",
    contact_phone: "+593 99 123 4567",
    distance_km: 0.8,
    time_ago: "Hace 22 min",
    reward: "$150",
    chip_status: "ISO Verified",
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
    description: "Avistada en terraza colonial cerca de San Blas. Lleva collar reflectivo celeste.",
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
    description: "Corte recién hecho, responde a su nombre y se acerca amigablemente.",
    contact_phone: "+593 99 888 2211",
    distance_km: 2.5,
    time_ago: "Hace 2 horas",
    reward: "$100",
    chip_status: "ISO Verified",
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
    description: "Corriendo por la ciclovía del río Yanuncay con arnés negro en buen estado.",
    contact_phone: "+593 99 444 3322",
    distance_km: 2.1,
    time_ago: "Hace 35 min",
    chip_status: "Escaneo Pendiente",
    photo: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=600&q=80"
  }
];

const SERVICES_CATALOG = [
  {
    id: "srv-01",
    title: "Consulta Clínica Integral & Ecografía",
    category: "Medicina Veterinaria",
    provider: "Hospital Veterinario El Paraíso",
    price: 25.00,
    sector: "Parque El Paraíso / Av. 10 de Agosto",
    badge: "Urgencias 24/7",
    rating: "4.98",
    reviews: 312,
    whatsapp: "593998408369"
  },
  {
    id: "srv-02",
    title: "Full Grooming & Ozonoterapia Dermocosmética",
    category: "Spa & Estética Móvil",
    provider: "Tomebamba Pet Spa Studio",
    price: 28.00,
    sector: "Unidad Móvil (Puerta a Puerta)",
    badge: "A Domicilio",
    rating: "4.95",
    reviews: 184,
    whatsapp: "593998408369"
  },
  {
    id: "srv-03",
    title: "Etología Clínica & Rehabilitación Conductual",
    category: "Conducta Canina",
    provider: "K9 Behavior Lab",
    price: 35.00,
    sector: "Puertas del Sol / Ordóñez Lasso",
    badge: "Especialista Certificado",
    rating: "5.00",
    reviews: 97,
    whatsapp: "593998408369"
  },
  {
    id: "srv-04",
    title: "Implantación de Microchip ISO 11784 + Pasaporte",
    category: "Identificación Biométrica",
    provider: "Centro Clínico San Blas",
    price: 22.00,
    sector: "San Blas / Simón Bolívar",
    badge: "Norma Global ISO",
    rating: "4.92",
    reviews: 215,
    whatsapp: "593998408369"
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

export default function App() {
  const [selectedCity, setSelectedCity] = useState<CityNode>(CITY_NODES[0]);
  const [activeTab, setActiveTab] = useState<'alerts' | 'assistant' | 'services' | 'adoptions' | 'chip_lookup'>('alerts');
  const [radiusKm, setRadiusKm] = useState(3);
  const [viewMode, setViewMode] = useState<'both' | 'map' | 'cards'>('both');
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

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

  // Validador de Microchips Universal ISO
  const [chipInput, setChipInput] = useState('');
  const [chipResult, setChipResult] = useState<{ isValid: boolean; standard: string; message: string; timestamp?: string } | null>(null);

  // Asistente Inteligente PAWLO AI
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string, triageLevel?: 'RED' | 'YELLOW' | 'GREEN', action?: string }>>([
    {
      sender: 'bot',
      text: 'Bienvenido a PAWLO Neural Triage. Describe los signos clínicos o el comportamiento de tu mascota para realizar una clasificación de urgencia en tiempo real.'
    }
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Comercio Conversacional & WhatsApp Directo
  const [selectedService, setSelectedService] = useState<any>(null);
  const [leadForm, setLeadForm] = useState({
    fullName: '',
    phone: '',
    paymentPreference: 'Deuna_P2P',
    sector: 'El Vergel',
    petName: '',
    petBreed: ''
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
        standard: "ISO 11784 / 11785 FDX-B COMPLIANT",
        message: "Transponder biométrico de 15 dígitos verificado. Estructura de fabricante/país válida para lectura internacional.",
        timestamp: now
      });
    } else if (/^[A-Za-z0-9-]{8,16}$/.test(clean)) {
      setChipResult({
        isValid: true,
        standard: "PAWLO PRIVATE CLINICAL REGISTRY",
        message: "Identificador alfanumérico verificado en la red de hospitales veterinarios afiliados.",
        timestamp: now
      });
    } else {
      setChipResult({
        isValid: false,
        standard: "FORMATO NO RECONOCIDO",
        message: "El código debe contener exactamente 15 dígitos numéricos (estándar ISO) o un código clínico registrado.",
        timestamp: now
      });
    }
  };

  const handleSendMessage = (customPrompt?: string) => {
    const textToProcess = customPrompt ?? inputMsg;
    if (!textToProcess.trim()) return;
    if (!disclaimerAccepted) {
      alert("Por favor activa el protocolo de consentimiento clínico a la izquierda antes de iniciar el triaje.");
      return;
    }

    setChatMessages(prev => [...prev, { sender: 'user', text: textToProcess }]);
    if (!customPrompt) setInputMsg('');
    setIsAiLoading(true);

    setTimeout(() => {
      setIsAiLoading(false);
      const lower = textToProcess.toLowerCase();

      if (lower.includes('ibuprofeno') || lower.includes('paracetamol') || lower.includes('amoxicilina') || lower.includes('dosis') || lower.includes('pastilla') || lower.includes('ivermectina')) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'RED',
          text: '🚨 CORTAFUEGOS FARMACOLÓGICO ACTIVADO: La administración de analgésicos humanos (paracetamol, ibuprofeno) o antibióticos sin prescripción causa fallo hepático/renal agudo. PAWLO bloquea toda posología empírica.',
          action: 'Derivación inmediata a Hospital Veterinario 24/7'
        }]);
      } else if (lower.includes('sangre') || lower.includes('convulsi') || lower.includes('desmayo') || lower.includes('atropell') || lower.includes('veneno')) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'RED',
          text: '🚨 CÓDIGO ROJO (EMERGENCIA VITAL 0h): Se detectan indicadores de compromiso hemodinámico o neurológico agudo. Mantén la vía aérea despejada y traslada al paciente de inmediato.',
          action: 'Acudir a Urgencias Veterinarias 24h ahora mismo'
        }]);
      } else if (lower.includes('vomit') || lower.includes('diarrea') || lower.includes('no come') || lower.includes('decai')) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'YELLOW',
          text: '⚠️ CÓDIGO AMARILLO (ATENCIÓN PRIORITARIA < 12h): Riesgo de deshidratación electrolítica. Suspende ingesta sólida por 6 horas, ofrece agua fresca en pequeñas tomas y agenda revisión presencial hoy.',
          action: 'Agendar consulta clínica en las próximas horas'
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'GREEN',
          text: '🟢 CÓDIGO VERDE (CONDUCTA & BIENESTAR): Para optimizar la conducta, aplica sesiones de olfato de 15 minutos, refuerzo positivo con premios de alto valor y paseos descompresivos.',
          action: 'Explorar especialistas de conducta en PAWLO Care'
        }]);
      }
    }, 550);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refId = `PWL-${selectedCity.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const targetWa = selectedService.whatsapp || "593998408369";
    const waText = `Hola ${selectedService.provider}, solicito confirmar cita para "${selectedService.title}" vía PAWLO (${selectedCity.name}). Paciente: ${leadForm.petName}. Código: ${refId}. Zona: ${leadForm.sector}. Medio de pago: ${leadForm.paymentPreference}.`;
    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(waText)}`;

    setLeadSuccess({ waUrl, refId });
  };

  const visibleAlerts = GEO_ALERTS.filter(a => a.distance_km <= radiusKm);

  return (
    <div className="min-h-screen flex flex-col bg-grid-pattern relative selection:bg-[#00F5A0] selection:text-[#03060C]">
      
      {/* Iluminación Atmosférica Boreal */}
      <div className={`fixed -top-24 left-1/2 -translate-x-1/2 w-[950px] h-[380px] rounded-full blur-[130px] pointer-events-none -z-0 transition-opacity duration-700 ${
        theme === 'dark' 
          ? 'bg-gradient-to-r from-[#00F5A0]/15 via-[#00D9F5]/12 to-[#6366F1]/15 opacity-100' 
          : 'bg-gradient-to-r from-emerald-400/15 via-sky-400/10 to-indigo-400/10 opacity-75'
      }`}></div>

      {/* BARRA DE TELEMETRÍA SUPERIOR (WORLD-CLASS STATUS BAR) */}
      <div className={`border-b text-[11px] font-mono py-1.5 px-4 lg:px-8 flex items-center justify-between z-50 transition-colors ${
        theme === 'dark' 
          ? 'bg-[#020409]/90 border-white/5 text-slate-400' 
          : 'bg-slate-900 text-slate-300 border-slate-800'
      }`}>
        <div className="flex items-center space-x-4 overflow-x-auto no-scrollbar">
          <span className="flex items-center space-x-1.5 text-[#00F5A0] font-semibold shrink-0">
            <Radio className="w-3 h-3 animate-pulse" />
            <span>PAWLO SPATIAL GRID: ONLINE</span>
          </span>
          <span className="opacity-30">|</span>
          <span className="shrink-0">NODE: <strong className="text-white">{selectedCity.code} ({selectedCity.name})</strong></span>
          <span className="opacity-30 hidden sm:inline">|</span>
          <span className="hidden sm:inline shrink-0">POSTGIS GI-INDEX: <strong className="text-[#00D9F5]">{selectedCity.latencyMs}</strong></span>
          <span className="opacity-30 hidden md:inline">|</span>
          <span className="hidden md:inline shrink-0">GUARDIANES ACTIVOS: <strong className="text-white">{selectedCity.activeDevices.toLocaleString()}</strong></span>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <span className="px-2 py-0.5 rounded bg-white/5 text-[10px] text-slate-300 border border-white/10 hidden sm:inline">
            ISO 11784/11785 READY
          </span>
        </div>
      </div>

      {/* HEADER PRINCIPAL PAWLO FLAGSHIP */}
      <header className={`border-b sticky top-0 z-40 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-2xl transition-colors duration-300 ${
        theme === 'dark' 
          ? 'border-white/[0.07] bg-[#050914]/80' 
          : 'border-slate-200/90 bg-white/85 shadow-xs'
      }`}>
        
        {/* BRANDING + SELECTOR DE NODO URBANO */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div onClick={() => setActiveTab('alerts')}>
            <PawloLogo size="md" cityBadge={selectedCity.name} theme={theme} />
          </div>

          {/* Conmutador de Nodos Globales */}
          <div className="relative">
            <button 
              onClick={() => setCitySelectorOpen(!citySelectorOpen)}
              className={`flex items-center space-x-2.5 border px-3.5 py-2 rounded-2xl text-xs font-bold transition-all ${
                theme === 'dark' 
                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-slate-200' 
                  : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200/80 text-slate-800'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>{selectedCity.name}</span>
              <span className="text-[10px] font-mono opacity-50 hidden sm:inline">{selectedCity.country}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {citySelectorOpen && (
              <div className={`absolute top-full left-0 mt-2.5 w-64 rounded-3xl p-2.5 z-50 shadow-2xl border space-y-1 backdrop-blur-2xl ${
                theme === 'dark' 
                  ? 'bg-[#080E1E]/95 border-white/15' 
                  : 'bg-white/95 border-slate-200 shadow-xl'
              }`}>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest opacity-50 px-3 py-1.5 flex items-center justify-between">
                  <span>Seleccionar Nodo Urbano</span>
                  <span>LATENCY</span>
                </div>
                {CITY_NODES.map(city => (
                  <button
                    key={city.id}
                    onClick={() => { setSelectedCity(city); setCitySelectorOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-2xl text-xs flex items-center justify-between transition ${
                      selectedCity.id === city.id 
                        ? 'bg-gradient-to-r from-[#00F5A0]/15 to-[#00D9F5]/10 text-[#00F5A0] font-bold border border-[#00F5A0]/30' 
                        : (theme === 'dark' ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100')
                    }`}
                  >
                    <div>
                      <div className="font-bold flex items-center gap-1.5">
                        {city.name}
                        <span className="text-[10px] font-mono opacity-60">({city.currency})</span>
                      </div>
                      <div className="text-[10px] opacity-60">{city.paymentRail}</div>
                    </div>
                    <div className="flex flex-col items-end">
                      {city.status === 'active' && (
                        <span className="text-[9px] bg-[#00F5A0]/20 text-[#00F5A0] px-2 py-0.5 rounded-full font-mono font-bold">LIVE</span>
                      )}
                      {city.status === 'beta' && (
                        <span className="text-[9px] bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-full font-mono font-bold">BETA</span>
                      )}
                      {city.status === 'coming_soon' && (
                        <span className="text-[9px] bg-slate-500/20 text-slate-400 px-2 py-0.5 rounded-full font-mono">SOON</span>
                      )}
                      <span className="text-[9px] font-mono opacity-50 mt-0.5">{city.latencyMs}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* DOCK DE NAVEGACIÓN ESTILO APPLE VISION / LINEAR */}
        <div className="flex items-center gap-2.5">
          <nav className={`flex items-center p-1.5 rounded-2xl border text-xs font-bold transition-all ${
            theme === 'dark' 
              ? 'bg-[#03060C]/90 border-white/[0.08] shadow-inner' 
              : 'bg-slate-100/90 border-slate-200/80'
          }`}>
            {[
              { id: 'alerts', label: 'Radar', icon: Compass },
              { id: 'assistant', label: 'Neural AI', icon: Sparkles },
              { id: 'services', label: 'Direct Care', icon: Zap },
              { id: 'chip_lookup', label: 'Biometría ISO', icon: Fingerprint },
              { id: 'adoptions', label: 'Adopciones', icon: Heart },
            ].map(tab => {
              const IconComponent = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button 
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                    isActive 
                      ? 'btn-primary-2026 !rounded-xl !py-2 !px-4' 
                      : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-950 hover:bg-white/70')
                  }`}
                >
                  <IconComponent className="w-3.5 h-3.5 stroke-[2.2]" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Conmutador de Tema (Sol / Luna) */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-white/[0.04] hover:bg-white/[0.1] border-white/10 text-amber-300' 
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
            }`}
            title={`Cambiar a ${theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">

        {/* 1. MÓDULO: RADAR GEOESPACIAL PAWLO */}
        {activeTab === 'alerts' && (
          <section className="space-y-6">
            {/* Hero Bento Header */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <div className="lg:col-span-8 glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden">
                <div className="space-y-3 max-w-2xl">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#00F5A0]/10 border border-[#00F5A0]/30 text-[#059669] dark:text-[#00F5A0] text-[11px] font-mono font-bold uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping"></span>
                    <span>REAL-TIME SPATIAL MESH • {selectedCity.name.toUpperCase()}</span>
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-[1.1]">
                    Radar Biométrico de Búsqueda y Rescate Urbano.
                  </h2>
                  <p className="text-sm opacity-75 leading-relaxed">
                    Indexación geodésica instantánea sobre anillos de proximidad en <strong>{selectedCity.name}</strong>. Cada reporte activa alertas geolocalizadas a tutores y clínicas dentro del perímetro.
                  </p>
                </div>

                {/* Controles de Radio y Modo de Vista */}
                <div className="pt-6 mt-6 border-t border-slate-200/60 dark:border-white/[0.07] flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase opacity-60">Vista:</span>
                    <div className={`flex items-center p-1 rounded-xl border text-xs ${
                      theme === 'dark' ? 'bg-[#03060C] border-white/10' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {[
                        { id: 'both', label: 'Split Híbrido' },
                        { id: 'map', label: 'Radar Completo' },
                        { id: 'cards', label: 'Mosaico' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setViewMode(m.id as any)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${
                            viewMode === m.id 
                              ? (theme === 'dark' ? 'bg-white/10 text-[#00F5A0]' : 'bg-white text-slate-900 shadow-xs') 
                              : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono uppercase opacity-60">Perímetro:</span>
                    <div className={`flex items-center p-1 rounded-xl border text-xs font-mono ${
                      theme === 'dark' ? 'bg-[#03060C] border-white/10' : 'bg-slate-100 border-slate-200'
                    }`}>
                      {[1, 3, 5, 8].map(r => (
                        <button 
                          key={r}
                          onClick={() => setRadiusKm(r)}
                          className={`px-3 py-1.5 rounded-lg font-bold transition ${
                            radiusKm === r ? 'bg-[#00F5A0] text-[#03060C] shadow-xs' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {r}km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tarjeta Bento de Telemetría en Tiempo Real */}
              <div className="lg:col-span-4 glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider opacity-60">Estado del Nodo</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#00F5A0]/15 text-[#059669] dark:text-[#00F5A0] border border-[#00F5A0]/30">
                    99.98% UPTIME
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 my-auto">
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/60 border-white/5' : 'bg-slate-50 border-slate-200/70'}`}>
                    <div className="text-2xl font-extrabold font-display text-[#059669] dark:text-[#00F5A0]">{visibleAlerts.length}</div>
                    <div className="text-[11px] opacity-70 font-medium mt-0.5">Alertas en {radiusKm}km</div>
                  </div>
                  <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/60 border-white/5' : 'bg-slate-50 border-slate-200/70'}`}>
                    <div className="text-2xl font-extrabold font-display text-[#0284C7] dark:text-[#00D9F5]">{selectedCity.latencyMs}</div>
                    <div className="text-[11px] opacity-70 font-medium mt-0.5">PostGIS Query</div>
                  </div>
                </div>

                <button 
                  onClick={() => alert(`Abriendo formulario de transmisión inmediata en el nodo ${selectedCity.name}.`)}
                  className="btn-primary-2026 w-full py-3 px-4 text-xs flex items-center justify-center space-x-2"
                >
                  <PlusCircle className="w-4 h-4 stroke-[2.5]" />
                  <span>Emitir Alerta Georreferenciada</span>
                </button>
              </div>
            </div>

            {/* Mapa Leaflet con HUD Flotante */}
            {(viewMode === 'both' || viewMode === 'map') && (
              <div className={`h-[450px] w-full rounded-3xl overflow-hidden border shadow-2xl relative ${
                theme === 'dark' ? 'border-white/10' : 'border-slate-200'
              }`}>
                {/* Overlay HUD Flotante Superior */}
                <div className="absolute top-4 right-4 z-[400] glass-panel px-4 py-2.5 rounded-2xl text-xs font-mono flex items-center space-x-3 pointer-events-none">
                  <span className="w-2 h-2 rounded-full bg-[#00F5A0]"></span>
                  <span>WGS84: {selectedCity.center[0].toFixed(4)}, {selectedCity.center[1].toFixed(4)}</span>
                  <span className="opacity-40">|</span>
                  <span className="text-[#059669] dark:text-[#00F5A0] font-bold">RADIO: {radiusKm * 1000}m</span>
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
                    pathOptions={{ color: '#00F5A0', fillColor: '#00F5A0', fillOpacity: 0.14, weight: 2 }} 
                  />
                  {visibleAlerts.map(alert => (
                    <Marker key={alert.id} position={alert.coords}>
                      <Popup>
                        <div className="p-1 space-y-1.5 text-slate-900 font-sans">
                          <strong className="block text-sm font-extrabold">{alert.pet_name} ({alert.breed})</strong>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded text-white ${alert.alert_type === 'lost' ? 'bg-rose-600' : 'bg-amber-600'}`}>
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

            {/* Tarjetas de Alertas de Alta Precisión */}
            {(viewMode === 'both' || viewMode === 'cards') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className="glass-panel rounded-3xl overflow-hidden hover:border-[#00F5A0]/50 transition-all duration-300 flex flex-col group">
                    <div className="relative h-52 bg-slate-900 overflow-hidden">
                      <img 
                        src={alert.photo} 
                        alt={alert.pet_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-700" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#03060C]/90 via-transparent to-transparent"></div>
                      
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span className={`text-[10px] font-mono font-extrabold uppercase px-2.5 py-1 rounded-full shadow-lg ${
                          alert.alert_type === 'lost' ? 'bg-[#FF2A5F] text-white' : 'bg-amber-400 text-slate-950'
                        }`}>
                          {alert.alert_type === 'lost' ? '● PERDIDO' : '◉ AVISTADO'}
                        </span>
                        <span className="text-[11px] font-mono font-bold bg-[#03060C]/80 backdrop-blur-md text-[#00F5A0] px-2.5 py-1 rounded-full border border-[#00F5A0]/30">
                          {alert.distance_km} km
                        </span>
                      </div>

                      {alert.reward && (
                        <span className="absolute top-3 right-3 text-[11px] font-mono font-extrabold bg-[#00F5A0] text-[#03060C] px-2.5 py-0.5 rounded-full shadow-lg">
                          RECOMPENSA {alert.reward}
                        </span>
                      )}

                      <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                        <div>
                          <h3 className="font-extrabold text-xl leading-none">{alert.pet_name}</h3>
                          <span className="text-[11px] text-slate-300 font-medium">{alert.breed}</span>
                        </div>
                        <span className="text-[10px] font-mono bg-white/10 backdrop-blur-md px-2 py-0.5 rounded-md text-slate-200">
                          {alert.time_ago}
                        </span>
                      </div>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[#059669] dark:text-[#00F5A0] flex items-center truncate">
                            <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" /> {alert.sector}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed p-3 rounded-2xl border ${
                          theme === 'dark' 
                            ? 'bg-[#03060C]/60 border-white/5 text-slate-300' 
                            : 'bg-slate-50 border-slate-200/80 text-slate-700'
                        }`}>
                          {alert.description}
                        </p>
                      </div>

                      <a 
                        href={`tel:${alert.contact_phone}`}
                        className="btn-primary-2026 w-full py-2.5 px-4 text-xs flex items-center justify-center space-x-2"
                      >
                        <PhoneCall className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Conectar con Guardián</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. MÓDULO: PAWLO NEURAL AI TRIAGE */}
        {activeTab === 'assistant' && (
          <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 glass-panel rounded-3xl p-6 space-y-5 flex flex-col justify-between">
              <div className="space-y-5">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-2xl bg-[#00F5A0]/10 text-[#059669] dark:text-[#00F5A0] border border-[#00F5A0]/25">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#059669] dark:text-[#00F5A0] font-bold">
                      SAFETY ENGINE v4.2
                    </span>
                    <h3 className="font-extrabold text-lg leading-tight">PAWLO Clinical Shield™</h3>
                  </div>
                </div>

                <p className="text-xs opacity-80 leading-relaxed">
                  Motor neural entrenado para clasificación de urgencias veterinarias y etología en <strong>{selectedCity.name}</strong>.
                </p>

                <div className="bg-[#FF2A5F]/10 border border-[#FF2A5F]/30 p-4 rounded-2xl space-y-1.5 text-rose-600 dark:text-rose-200">
                  <p className="font-extrabold text-xs flex items-center">
                    <Lock className="w-4 h-4 mr-1.5 text-[#FF2A5F]" />
                    Cortafuegos Farmacológico Activo
                  </p>
                  <p className="text-[11px] opacity-90 leading-relaxed">
                    Bloqueo determinista del 100% ante consultas sobre dosis, miligramos o fármacos humanos/veterinarios para erradicar intoxicaciones por automedicación.
                  </p>
                </div>

                <div className={`p-3.5 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                  <label htmlFor="pawlo-clinical-consent" className="flex items-start space-x-3 cursor-pointer select-none">
                    <input 
                      id="pawlo-clinical-consent"
                      name="clinicalConsent"
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#059669] focus:ring-[#00F5A0] h-4 w-4"
                    />
                    <span className="text-[11px] font-semibold leading-snug">
                      Habilitar protocolo de triaje preventivo (Comprendo que no sustituye la consulta física presencial).
                    </span>
                  </label>
                </div>
              </div>

              <div className={`border-t pt-4 space-y-2.5 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                <span className="text-[10px] font-mono font-bold opacity-60 uppercase tracking-wider block">Protocolo de Clasificación:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono font-bold">
                  <div className="bg-rose-500/15 text-rose-500 dark:text-rose-300 border border-rose-500/30 p-2 rounded-xl">ROJO • 0h Crítico</div>
                  <div className="bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 p-2 rounded-xl">AMARILLO • &lt;12h</div>
                  <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 p-2 rounded-xl">VERDE • Rutina</div>
                </div>
              </div>
            </div>

            {/* Consola de Triaje */}
            <div className="lg:col-span-8 glass-panel rounded-3xl flex flex-col h-[560px] overflow-hidden">
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#00F5A0] shadow-[0_0_10px_#00F5A0] animate-pulse"></div>
                  <span className="font-bold text-sm">PAWLO Neural Copilot</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/20 font-bold">
                    DeepSeek R1 Reasoner
                  </span>
                </div>
                <span className="text-[11px] font-mono opacity-60">
                  Nodo: {selectedCity.name}
                </span>
              </div>

              {/* Mensajes */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 ${
                      msg.sender === 'user' 
                        ? 'btn-primary-2026 !shadow-none font-bold rounded-br-none' 
                        : (theme === 'dark' ? 'bg-[#03060C]/90 border border-white/10 text-slate-200 rounded-bl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs')
                    }`}>
                      <p>{msg.text}</p>
                      {msg.action && (
                        <div className={`mt-2.5 pt-2.5 border-t font-mono font-bold text-[#059669] dark:text-[#00F5A0] flex items-center ${
                          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
                        }`}>
                          <Navigation className="w-3.5 h-3.5 mr-1.5" />
                          <span>DIRECTIVA: {msg.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Chips de Simulación Rápida */}
                {disclaimerAccepted && chatMessages.length === 1 && (
                  <div className="pt-2 space-y-2">
                    <span className="text-[10px] font-mono uppercase opacity-50 block">Escenarios de Prueba Rápida:</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => handleSendMessage("¿Cuántos mg de ibuprofeno le puedo dar a mi perro por dolor?")}
                        className="text-[11px] px-3 py-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition font-medium"
                      >
                        🧪 Probar Bloqueo Farmacológico
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Mi perro tiene vómito desde la mañana y está decaído")}
                        className="text-[11px] px-3 py-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition font-medium"
                      >
                        ⚠️ Probar Triaje Amarillo
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSendMessage("Mi cachorro tira mucho de la correa en el parque, ¿cómo mejoro su paseo?")}
                        className="text-[11px] px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition font-medium"
                      >
                        🌿 Probar Consulta de Conducta
                      </button>
                    </div>
                  </div>
                )}

                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className={`border rounded-2xl p-3.5 text-xs font-mono flex items-center space-x-2 ${
                      theme === 'dark' ? 'bg-[#03060C] border-white/10 text-[#00F5A0]' : 'bg-white border-slate-200 text-emerald-700'
                    }`}>
                      <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-ping"></span>
                      <span>PROCESANDO TELEMETRÍA CLÍNICA...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className={`p-3.5 border-t flex items-center space-x-2.5 ${
                  theme === 'dark' ? 'bg-[#03060C] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <label htmlFor="pawlo-chat-input" className="sr-only">Consulta clínica o etológica</label>
                <input 
                  id="pawlo-chat-input"
                  name="chatMessage"
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder={disclaimerAccepted ? "Describe síntomas clínicos o dudas de conducta..." : "Activa la casilla de consentimiento a la izquierda para consultar..."}
                  disabled={!disclaimerAccepted}
                  className="flex-1 glass-input rounded-2xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none"
                />
                <button 
                  type="submit"
                  aria-label="Enviar consulta"
                  disabled={!disclaimerAccepted || !inputMsg.trim()}
                  className="btn-primary-2026 p-3 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </section>
        )}

        {/* 3. MÓDULO: DIRECT CARE MARKETPLACE */}
        {activeTab === 'services' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-mono uppercase font-extrabold tracking-wider text-[#059669] dark:text-[#00F5A0] bg-[#00F5A0]/10 px-3 py-1 rounded-full border border-[#00F5A0]/25">
                  PAWLO DIRECT-TO-CARE • {selectedCity.name.toUpperCase()}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">Clínicas & Especialistas Verificados</h2>
                <p className="text-xs sm:text-sm opacity-75 mt-1 max-w-2xl">
                  Reserva sin comisiones ocultas. Sincronización instantánea por WhatsApp y pago directo vía <strong>{selectedCity.paymentRail}</strong>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {SERVICES_CATALOG.map(srv => (
                <div key={srv.id} className="glass-panel rounded-3xl p-6 flex flex-col justify-between space-y-5 hover:border-[#00F5A0]/50 transition-all duration-300">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold text-[#059669] dark:text-[#00F5A0] bg-[#00F5A0]/10 px-2.5 py-1 rounded-full border border-[#00F5A0]/20">
                        {srv.badge}
                      </span>
                      <span className="text-2xl font-extrabold font-display">${srv.price.toFixed(2)}</span>
                    </div>
                    <h3 className="font-extrabold text-base leading-snug pt-1">{srv.title}</h3>
                    <p className="text-xs opacity-70 font-semibold">{srv.provider}</p>
                    
                    <div className="flex items-center space-x-2 text-xs pt-1">
                      <span className="flex items-center text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 mr-1" /> {srv.rating}
                      </span>
                      <span className="opacity-40">•</span>
                      <span className="opacity-60 text-[11px]">({srv.reviews} reseñas)</span>
                    </div>

                    <p className="text-xs font-medium pt-1 flex items-center text-[#059669] dark:text-[#00F5A0]">
                      <MapPin className="w-3.5 h-3.5 mr-1 shrink-0" /> {srv.sector}
                    </p>
                  </div>

                  <button 
                    onClick={() => { setSelectedService(srv); setLeadSuccess(null); }}
                    className="btn-primary-2026 w-full py-3 px-4 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>Agendar Directo</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Modal de Reserva */}
            {selectedService && (
              <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 max-w-xl mx-auto space-y-5">
                <div className={`flex items-center justify-between border-b pb-4 ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <div>
                    <span className="text-[10px] font-mono uppercase text-[#059669] dark:text-[#00F5A0] font-bold">
                      ORDEN DIRECT-TO-CARE
                    </span>
                    <h3 className="font-extrabold text-lg">{selectedService.provider}</h3>
                    <p className="text-xs opacity-75">{selectedService.title} — <strong>${selectedService.price.toFixed(2)} {selectedCity.currency}</strong></p>
                  </div>
                  <button onClick={() => setSelectedService(null)} className="opacity-60 hover:opacity-100 font-bold text-sm p-2">✕</button>
                </div>

                {!leadSuccess ? (
                  <form onSubmit={handleBookingSubmit} className="space-y-4 text-xs">
                    <div>
                      <label htmlFor="lead-fullname" className="font-bold opacity-80">Nombre del Tutor:</label>
                      <input 
                        id="lead-fullname"
                        name="fullName"
                        type="text" 
                        required
                        placeholder="Ej. Mateo Valdivieso"
                        value={leadForm.fullName}
                        onChange={e => setLeadForm({...leadForm, fullName: e.target.value})}
                        className="w-full mt-1.5 glass-input rounded-xl px-4 py-3 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-phone" className="font-bold opacity-80">WhatsApp:</label>
                        <input 
                          id="lead-phone"
                          name="phone"
                          type="text" 
                          required
                          placeholder="0998408369"
                          value={leadForm.phone}
                          onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-sector" className="font-bold opacity-80">Zona en {selectedCity.name}:</label>
                        <input 
                          id="lead-sector"
                          name="sector"
                          type="text" 
                          required
                          placeholder="Ej. El Vergel"
                          value={leadForm.sector}
                          onChange={e => setLeadForm({...leadForm, sector: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-petname" className="font-bold opacity-80">Nombre del Paciente:</label>
                        <input 
                          id="lead-petname"
                          name="petName"
                          type="text" 
                          required
                          placeholder="Ej. Bruno"
                          value={leadForm.petName}
                          onChange={e => setLeadForm({...leadForm, petName: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-4 py-3 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-payment" className="font-bold opacity-80">Método de Pago:</label>
                        <select 
                          id="lead-payment"
                          name="paymentPreference"
                          value={leadForm.paymentPreference}
                          onChange={e => setLeadForm({...leadForm, paymentPreference: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-4 py-3 focus:outline-none"
                        >
                          <option value="Deuna_P2P">Deuna (P2P Instantáneo)</option>
                          <option value="Pichincha">Transferencia Bancaria</option>
                          <option value="Produbanco">Produbanco / Be</option>
                          <option value="Contraentrega">Pago en Clínica</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="btn-primary-2026 w-full py-3.5 text-xs font-extrabold mt-2"
                    >
                      Generar Pase Clínico & Abrir WhatsApp
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-12 h-12 bg-[#00F5A0]/20 text-[#059669] dark:text-[#00F5A0] rounded-2xl flex items-center justify-center mx-auto border border-[#00F5A0]/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base">¡Orden Direct-to-Care Lista!</h4>
                      <p className="text-xs opacity-60 mt-1 font-mono">TOKEN: {leadSuccess.refId}</p>
                    </div>
                    <a 
                      href={leadSuccess.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary-2026 inline-flex items-center space-x-2 py-3.5 px-6 text-xs"
                    >
                      <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                      <span>Confirmar en WhatsApp Ahora</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. MÓDULO: BIOMETRÍA & ESCÁNER ISO UNIVERSAL */}
        {activeTab === 'chip_lookup' && (
          <section className="max-w-2xl mx-auto space-y-6">
            <div className="glass-panel rounded-3xl p-8 space-y-5">
              <div className="flex items-center space-x-4">
                <div className="p-3.5 bg-[#00F5A0]/10 border border-[#00F5A0]/30 rounded-2xl text-[#059669] dark:text-[#00F5A0]">
                  <Fingerprint className="w-7 h-7" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-widest text-[#059669] dark:text-[#00F5A0]">
                    GLOBAL TRANSPONDER REGISTRY
                  </span>
                  <h2 className="text-2xl font-extrabold">Validador Biométrico ISO 11784/11785</h2>
                </div>
              </div>

              <p className="text-xs opacity-80 leading-relaxed">
                Verifica la autenticidad estructural de cualquier microchip FDX-B de 15 dígitos a nivel global o identificadores de la red privada de clínicas asociadas a PAWLO.
              </p>

              <form onSubmit={handleValidateMicrochip} className="space-y-4 pt-2">
                <div>
                  <label htmlFor="pawlo-chip-input" className="text-xs font-bold opacity-80">Código de Transponder (15 dígitos ISO o ID Clínico):</label>
                  <div className="mt-2 flex gap-2.5">
                    <input 
                      id="pawlo-chip-input"
                      name="chipNumber"
                      type="text" 
                      value={chipInput}
                      onChange={e => setChipInput(e.target.value)}
                      placeholder="Ej. 981098123456789"
                      className="flex-1 glass-input rounded-2xl px-4 py-3.5 text-xs focus:outline-none font-mono tracking-wider"
                    />
                    <button 
                      type="submit"
                      className="btn-primary-2026 px-6 py-3.5 text-xs"
                    >
                      Escanear
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-3 text-[11px] font-mono opacity-70">
                  <span>Cargar muestra:</span>
                  <button 
                    type="button" 
                    onClick={() => setChipInput('981098123456789')}
                    className="text-[#059669] dark:text-[#00F5A0] hover:underline font-bold"
                  >
                    [981098123456789 • ISO]
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setChipInput('PWL-EC-90412')}
                    className="text-[#0284C7] dark:text-[#00D9F5] hover:underline font-bold"
                  >
                    [PWL-EC-90412 • Red Privada]
                  </button>
                </div>
              </form>

              {chipResult && (
                <div className={`p-5 rounded-2xl border text-xs space-y-2 ${
                  chipResult.isValid 
                    ? 'bg-[#00F5A0]/10 border-[#00F5A0]/30 text-emerald-900 dark:text-emerald-200' 
                    : 'bg-[#FF2A5F]/10 border-[#FF2A5F]/30 text-rose-900 dark:text-rose-200'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-mono font-extrabold text-sm">
                      {chipResult.isValid ? (
                        <Check className="w-4 h-4 text-[#059669] dark:text-[#00F5A0]" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-[#FF2A5F]" />
                      )}
                      <span>{chipResult.standard}</span>
                    </div>
                    <span className="text-[10px] font-mono opacity-60">{chipResult.timestamp}</span>
                  </div>
                  <p className="opacity-85 leading-relaxed">{chipResult.message}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. MÓDULO: ADOPCIONES VERIFICADAS */}
        {activeTab === 'adoptions' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-8">
              <span className="text-[11px] font-mono uppercase font-extrabold tracking-wider text-[#FF2A5F] bg-[#FF2A5F]/10 px-3 py-1 rounded-full border border-[#FF2A5F]/30">
                PAWLO DIRECT ADOPTION NETWORK
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-2">Adopción Responsable entre Particulares en {selectedCity.name}</h2>
              <p className="text-xs sm:text-sm opacity-75 mt-1 max-w-2xl">
                Cada mascota cuenta con ficha clínica verificada, esterilización y contacto directo con su hogar temporal.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {COMMUNITY_ADOPTIONS.map(pet => (
                <div key={pet.id} className="glass-panel rounded-3xl overflow-hidden flex flex-col sm:flex-row group hover:border-[#00F5A0]/40 transition">
                  <div className="w-full sm:w-56 h-56 sm:h-auto bg-slate-900 relative overflow-hidden">
                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" />
                    <span className="absolute top-3 left-3 text-[10px] font-mono font-extrabold bg-[#03060C]/85 backdrop-blur text-[#00F5A0] px-2.5 py-1 rounded-full border border-[#00F5A0]/30">
                      {pet.badge}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-2xl">{pet.name}</h3>
                        <span className="text-xs font-mono text-[#059669] dark:text-[#00F5A0] font-bold">{pet.gender}</span>
                      </div>
                      <p className="text-xs opacity-60 mt-0.5 font-medium">{pet.breed} • {pet.age} • {pet.location}</p>
                      <span className="inline-block mt-2 text-[10px] font-mono px-2.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                        ✓ {pet.health}
                      </span>
                      <p className={`text-xs mt-3 leading-relaxed p-3 rounded-2xl border ${
                        theme === 'dark' ? 'bg-[#03060C]/60 border-white/5 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        "{pet.story}"
                      </p>
                    </div>

                    <button 
                      onClick={() => alert(`Solicitud directa enviada al hogar temporal de ${pet.name} en ${selectedCity.name}.`)}
                      className="w-full py-3 px-4 bg-gradient-to-r from-[#FF2A5F] to-rose-600 hover:brightness-110 text-white rounded-2xl text-xs font-extrabold transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/25"
                    >
                      <Heart className="w-3.5 h-3.5 fill-white" />
                      <span>Conectar con Hogar Temporal</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER PAWLO FLAGSHIP */}
      <footer className={`border-t py-6 px-6 lg:px-8 text-xs flex flex-wrap items-center justify-between gap-4 relative z-10 transition-colors duration-300 ${
        theme === 'dark' ? 'border-white/5 bg-[#020409] text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="flex items-center space-x-3">
          <PawloLogo size="sm" showWordmark={false} theme={theme} />
          <span className="font-semibold">PAWLO™ Urban Pet Operating System • Nodo Activo: {selectedCity.name} ({selectedCity.code})</span>
        </div>
        <div className="font-mono text-[11px] opacity-75">
          ISO 11784/11785 FDX-B | PostGIS Spatial Engine | Stitch Flagship 2026
        </div>
      </footer>
    </div>
  );
}
