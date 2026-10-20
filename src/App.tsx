import React, { useState, useEffect } from 'react';
import { 
  Heart, AlertTriangle, MessageSquare, PhoneCall, ShieldCheck, 
  MapPin, CheckCircle2, Sparkles, Navigation, 
  ShieldAlert, ArrowRight, Send, Check, AlertCircle,
  Activity, Compass, Zap, Globe, ChevronDown, Sun, Moon
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
  center: [number, number];
  status: 'active' | 'beta' | 'coming_soon';
  currency: string;
  paymentRail: string;
}

const CITY_NODES: CityNode[] = [
  { id: 'cue', name: 'Cuenca', country: 'Ecuador', center: [-2.8974, -79.0045], status: 'active', currency: 'USD', paymentRail: 'Deuna & Pichincha' },
  { id: 'uio', name: 'Quito', country: 'Ecuador', center: [-0.1807, -78.4678], status: 'beta', currency: 'USD', paymentRail: 'Deuna & Produbanco' },
  { id: 'gye', name: 'Guayaquil', country: 'Ecuador', center: [-2.1894, -79.8891], status: 'beta', currency: 'USD', paymentRail: 'Deuna & Bolivariano' },
  { id: 'bog', name: 'Bogotá', country: 'Colombia', center: [4.7110, -74.0721], status: 'coming_soon', currency: 'COP', paymentRail: 'Nequi & Daviplata' },
  { id: 'lim', name: 'Lima', country: 'Perú', center: [-12.0464, -77.0428], status: 'coming_soon', currency: 'PEN', paymentRail: 'Yape & Plin' },
];

const GEO_ALERTS = [
  {
    id: "alt-01",
    cityId: "cue",
    pet_name: "Max",
    species: "canine",
    breed: "Golden Retriever Mestizo",
    alert_type: "lost" as const,
    sector: "El Vergel / Av. Solano",
    coords: [-2.9041, -79.0041] as [number, number],
    description: "Collar rojo con placa de contacto directa. Asustadizo con ruidos fuertes.",
    contact_phone: "+593 99 123 4567",
    distance_km: 0.8,
    time_ago: "Hace 25 min",
    reward: "$150",
    photo: "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "alt-02",
    cityId: "cue",
    pet_name: "Luna",
    species: "feline",
    breed: "Siamés",
    alert_type: "sighted" as const,
    sector: "Centro Histórico (San Blas)",
    coords: [-2.8974, -79.0045] as [number, number],
    description: "Vista en cornisa residencial cerca a cafetería. Parece desorientada.",
    contact_phone: "+593 98 765 4321",
    distance_km: 0.2,
    time_ago: "Hace 1 hora",
    photo: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "alt-03",
    cityId: "cue",
    pet_name: "Rocky",
    species: "canine",
    breed: "Schnauzer Mini",
    alert_type: "lost" as const,
    sector: "Totoracocha / Hurtado de Mendoza",
    coords: [-2.8895, -78.9850] as [number, number],
    description: "Corte reciente, responde de inmediato a su nombre.",
    contact_phone: "+593 99 888 2211",
    distance_km: 2.5,
    time_ago: "Hace 3 horas",
    reward: "$100",
    photo: "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "alt-04",
    cityId: "cue",
    pet_name: "Toby",
    species: "canine",
    breed: "Labrador Chocolate",
    alert_type: "sighted" as const,
    sector: "Yanuncay / Av. Don Bosco",
    coords: [-2.9150, -79.0180] as [number, number],
    description: "Visto jugando cerca de la ciclovía del río con otros caninos.",
    contact_phone: "+593 99 444 3322",
    distance_km: 2.1,
    time_ago: "Hace 40 min",
    photo: "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=400&q=80"
  }
];

const SERVICES_CATALOG = [
  {
    id: "srv-01",
    title: "Consulta Médica General & Desparasitación",
    category: "Clínica Veterinaria",
    provider: "Hospital Veterinario El Paraíso",
    price: 25.00,
    sector: "Parque El Paraíso / Av. 10 de Agosto",
    badge: "Atención 24/7",
    rating: 4.9,
    whatsapp: "593998408369"
  },
  {
    id: "srv-02",
    title: "Grooming & Spa Canino Móvil",
    category: "Estética & Bienestar",
    provider: "Tomebamba Pet Spa",
    price: 28.00,
    sector: "Servicio a Domicilio en Toda la Ciudad",
    badge: "A Domicilio",
    rating: 4.8,
    whatsapp: "593998408369"
  },
  {
    id: "srv-03",
    title: "Etología Clínica & Modificación Conductual",
    category: "Especialidad Canina",
    provider: "K9 Conducta Positiva",
    price: 32.00,
    sector: "Puertas del Sol / Ordóñez Lasso",
    badge: "Especialista Certificado",
    rating: 5.0,
    whatsapp: "593998408369"
  },
  {
    id: "srv-04",
    title: "Vacunación Preventiva & Chip ISO",
    category: "Medicina Preventiva",
    provider: "Centro Médico Veterinario San Blas",
    price: 22.00,
    sector: "San Blas / Bolívar",
    badge: "ISO 11784/11785",
    rating: 4.9,
    whatsapp: "593998408369"
  }
];

const COMMUNITY_ADOPTIONS = [
  {
    id: "adp-01",
    name: "Cobi",
    gender: "Macho (Esterilizado)",
    age: "1.5 años",
    breed: "Mestizo",
    badge: "Hogar Temporal Verificado",
    location: "Sector Baños",
    story: "Rescatado en orillas del río. Es dócil, juguetón y convive perfectamente con niños y gatos.",
    photo: "https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80"
  },
  {
    id: "adp-02",
    name: "Misha",
    gender: "Hembra (Vacunada)",
    age: "9 meses",
    breed: "Carey Mestiza",
    badge: "Rescate Independiente",
    location: "Sector El Valle",
    story: "Esterilizada y con control veterinario completo. Muy cariñosa, ronronea con facilidad y busca un hogar amoroso.",
    photo: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?auto=format&fit=crop&w=400&q=80"
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
  const [chipResult, setChipResult] = useState<{ isValid: boolean; standard: string; message: string } | null>(null);

  // Asistente Inteligente PAWLO AI
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot', text: string, triageLevel?: 'RED' | 'YELLOW' | 'GREEN', action?: string }>>([
    {
      sender: 'bot',
      text: '¡Hola! Soy PAWLO Assistant, tu copiloto clínico y de comportamiento. Describe qué signos o dudas tienes sobre tu mascota. (Recuerda que no indico dosis farmacológicas ni sustituyo la consulta veterinaria presencial).'
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

    if (/^[0-9]{15}$/.test(clean)) {
      setChipResult({
        isValid: true,
        standard: "Estándar Global ISO 11784 / 11785",
        message: "Microchip transponder de 15 dígitos verificado. Compatible con lectores veterinarios universales en cualquier ciudad."
      });
    } else if (/^[A-Za-z0-9]{8,16}$/.test(clean)) {
      setChipResult({
        isValid: true,
        standard: "Identificador Clínico Registrado",
        message: "Código de chip alfanumérico reconocido en la base de datos veterinaria privada."
      });
    } else {
      setChipResult({
        isValid: false,
        standard: "Código No Válido",
        message: "El formato debe coincidir con 15 dígitos numéricos (estándar ISO universal) o un transponder alfanumérico habilitado."
      });
    }
  };

  const handleSendMessage = () => {
    if (!inputMsg.trim()) return;
    if (!disclaimerAccepted) {
      alert("Por favor acepta los términos de orientación de PAWLO antes de consultar.");
      return;
    }

    const userText = inputMsg;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setIsAiLoading(true);

    setTimeout(() => {
      setIsAiLoading(false);
      const lower = userText.toLowerCase();

      if (lower.includes('ibuprofeno') || lower.includes('paracetamol') || lower.includes('amoxicilina') || lower.includes('dosis') || lower.includes('pastilla') || lower.includes('ivermectina')) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'RED',
          text: '🚨 PROTOCOLO DE SEGURIDAD FARMACOLÓGICA: La automedicación con fármacos humanos o dosis empíricas puede ser mortal para perros y gatos. PAWLO prohíbe la prescripción no autorizada.',
          action: 'Contactar una Clínica de Urgencias 24h para valoración profesional'
        }]);
      } else if (lower.includes('sangre') || lower.includes('convulsi') || lower.includes('desmayo') || lower.includes('atropell')) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'RED',
          text: '🚨 TRIAJE ROJO (EMERGENCIA INMEDIATA): Signos críticos detectados. Inmoviliza al paciente, mantenlo abrigado y trasládalo inmediatamente al centro de urgencias veterinarias más cercano.',
          action: 'Ruta prioritaria a hospital veterinario de guardia'
        }]);
      } else if (lower.includes('vomit') || lower.includes('diarrea') || lower.includes('no come')) {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'YELLOW',
          text: '⚠️ TRIAJE AMARILLO (URGENCIA PRIORITARIA < 12h): Hidrata con tomas pequeñas de agua fresca. Suspende alimentos sólidos y agenda cita clínica durante el día.',
          action: 'Monitorear hidratación y mucosas gingivales'
        }]);
      } else {
        setChatMessages(prev => [...prev, {
          sender: 'bot',
          triageLevel: 'GREEN',
          text: '🌿 TRIAJE VERDE / GUÍA CONDUCTUAL: Recomendamos paseos estructurados, enriquecimiento olfativo y reforzadores positivos en su rutina diaria.',
          action: 'Socialización recomendada en áreas verdes seguras'
        }]);
      }
    }, 600);
  };

  const handleBookingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const refId = `PWL-${selectedCity.id.toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    const targetWa = selectedService.whatsapp || "593998408369";
    const waText = `Hola ${selectedService.provider}, solicito agendar el servicio "${selectedService.title}" en PAWLO (${selectedCity.name}). Mascota: ${leadForm.petName}. Ref: ${refId}. Sector: ${leadForm.sector}. Pago: ${leadForm.paymentPreference}.`;
    const waUrl = `https://wa.me/${targetWa}?text=${encodeURIComponent(waText)}`;

    setLeadSuccess({ waUrl, refId });
  };

  const visibleAlerts = GEO_ALERTS.filter(a => a.distance_km <= radiusKm);

  return (
    <div className="min-h-screen flex flex-col font-sans transition-colors duration-300">
      
      {/* Glow ambiental superior adaptativo */}
      <div className={`fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] blur-3xl pointer-events-none -z-0 transition-opacity duration-500 ${
        theme === 'dark' 
          ? 'bg-gradient-to-b from-[#10E7A6]/15 via-[#00F5FF]/5 to-transparent' 
          : 'bg-gradient-to-b from-[#05B382]/10 via-[#00B4D8]/5 to-transparent'
      }`}></div>

      {/* HEADER GLOBAL PAWLO */}
      <header className={`border-b sticky top-0 z-50 px-4 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4 backdrop-blur-2xl transition-colors duration-300 ${
        theme === 'dark' 
          ? 'border-white/5 bg-[#080D1A]/85' 
          : 'border-slate-200/80 bg-white/85 shadow-xs'
      }`}>
        
        {/* LOGO PAWLO + SELECTOR DE NODO URBANO */}
        <div className="flex items-center gap-4">
          <PawloLogo size="md" cityBadge={selectedCity.name} />

          {/* Selector de Ciudad */}
          <div className="relative">
            <button 
              onClick={() => setCitySelectorOpen(!citySelectorOpen)}
              className={`flex items-center space-x-2 border px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                theme === 'dark' 
                  ? 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-300' 
                  : 'bg-slate-100 hover:bg-slate-200/70 border-slate-200 text-slate-700'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#10E7A6]" />
              <span>{selectedCity.name}, {selectedCity.country}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-60" />
            </button>

            {citySelectorOpen && (
              <div className={`absolute top-full left-0 mt-2 w-56 rounded-2xl p-2 z-50 shadow-2xl border space-y-1 ${
                theme === 'dark' 
                  ? 'glass-panel border-white/10' 
                  : 'bg-white border-slate-200 shadow-xl'
              }`}>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1">
                  Nodos Urbanos PAWLO
                </div>
                {CITY_NODES.map(city => (
                  <button
                    key={city.id}
                    onClick={() => { setSelectedCity(city); setCitySelectorOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                      selectedCity.id === city.id 
                        ? 'bg-[#10E7A6]/15 text-[#10E7A6] font-bold border border-[#10E7A6]/30' 
                        : (theme === 'dark' ? 'text-slate-300 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-100')
                    }`}
                  >
                    <div>
                      <div className="font-semibold">{city.name}</div>
                      <div className="text-[10px] text-slate-400">{city.country} • {city.currency}</div>
                    </div>
                    {city.status === 'active' && (
                      <span className="text-[9px] bg-[#10E7A6]/20 text-[#10E7A6] px-1.5 py-0.5 rounded font-mono">Activo</span>
                    )}
                    {city.status === 'beta' && (
                      <span className="text-[9px] bg-cyan-500/20 text-cyan-500 px-1.5 py-0.5 rounded font-mono">Beta</span>
                    )}
                    {city.status === 'coming_soon' && (
                      <span className="text-[9px] bg-slate-500/20 text-slate-400 px-1.5 py-0.5 rounded font-mono">Próx.</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* NAVEGACIÓN MODULAR Y TOGGLE DE TEMA */}
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className={`flex items-center space-x-1 sm:space-x-1.5 p-1.5 rounded-2xl border text-xs font-semibold ${
            theme === 'dark' 
              ? 'bg-[#050811]/90 border-white/10' 
              : 'bg-slate-100/90 border-slate-200'
          }`}>
            <button 
              onClick={() => setActiveTab('alerts')}
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'alerts' 
                  ? 'btn-primary-2026 !shadow-none' 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white')
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>Radar</span>
            </button>

            <button 
              onClick={() => setActiveTab('assistant')}
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'assistant' 
                  ? 'btn-primary-2026 !shadow-none' 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white')
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>PAWLO AI</span>
            </button>

            <button 
              onClick={() => setActiveTab('services')}
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'services' 
                  ? 'btn-primary-2026 !shadow-none' 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white')
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>Servicios</span>
            </button>

            <button 
              onClick={() => setActiveTab('chip_lookup')}
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'chip_lookup' 
                  ? 'btn-primary-2026 !shadow-none' 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white')
              }`}
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Chip ISO</span>
            </button>

            <button 
              onClick={() => setActiveTab('adoptions')}
              className={`px-3.5 py-2 rounded-xl transition-all duration-200 flex items-center space-x-2 ${
                activeTab === 'adoptions' 
                  ? 'btn-primary-2026 !shadow-none' 
                  : (theme === 'dark' ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-white')
              }`}
            >
              <Heart className="w-4 h-4" />
              <span>Adopciones</span>
            </button>
          </nav>

          {/* Toggle de Light / Dark Mode */}
          <button
            onClick={toggleTheme}
            className={`p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center ${
              theme === 'dark' 
                ? 'bg-white/5 hover:bg-white/10 border-white/10 text-amber-300 hover:text-amber-200' 
                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
            }`}
            title={`Cambiar a ${theme === 'dark' ? 'Modo Claro' : 'Modo Oscuro'}`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-7 relative z-10">

        {/* 1. MÓDULO: RADAR GEOESPACIAL PAWLO */}
        {activeTab === 'alerts' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-7 relative overflow-hidden">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div>
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#10E7A6]/10 border border-[#10E7A6]/30 text-[#05B382] dark:text-[#10E7A6] text-xs font-bold uppercase tracking-wider mb-2">
                    <Activity className="w-3.5 h-3.5" />
                    <span>PAWLO Radar • Nodo {selectedCity.name}</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    Red Activa de Búsqueda y Protección Animal
                  </h2>
                  <p className="text-sm opacity-80 mt-1.5 max-w-2xl leading-relaxed">
                    Cartografía inteligente georreferenciada con índices espaciales sub-10ms. Reporta pérdidas o avistamientos con geolocalización precisa.
                  </p>
                </div>

                {/* Controles de visualización y radio */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className={`flex items-center p-1.5 rounded-2xl border text-xs ${
                    theme === 'dark' ? 'bg-[#050811] border-white/10' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <button 
                      onClick={() => setViewMode('both')} 
                      className={`px-3 py-1.5 rounded-xl font-medium transition ${viewMode === 'both' ? 'bg-primary/20 text-[#05B382] dark:text-[#10E7A6] font-bold' : 'opacity-60'}`}
                    >
                      Completo
                    </button>
                    <button 
                      onClick={() => setViewMode('map')} 
                      className={`px-3 py-1.5 rounded-xl font-medium transition ${viewMode === 'map' ? 'bg-primary/20 text-[#05B382] dark:text-[#10E7A6] font-bold' : 'opacity-60'}`}
                    >
                      Solo Mapa
                    </button>
                    <button 
                      onClick={() => setViewMode('cards')} 
                      className={`px-3 py-1.5 rounded-xl font-medium transition ${viewMode === 'cards' ? 'bg-primary/20 text-[#05B382] dark:text-[#10E7A6] font-bold' : 'opacity-60'}`}
                    >
                      Tarjetas
                    </button>
                  </div>

                  <div className={`flex items-center p-1.5 rounded-2xl border text-xs ${
                    theme === 'dark' ? 'bg-[#050811] border-white/10' : 'bg-white border-slate-200 shadow-xs'
                  }`}>
                    <span className="px-2.5 opacity-60 font-medium">Radio:</span>
                    {[1, 3, 5, 8].map(r => (
                      <button 
                        key={r}
                        onClick={() => setRadiusKm(r)}
                        className={`px-3 py-1.5 rounded-xl font-bold transition ${
                          radiusKm === r ? 'bg-[#10E7A6] text-slate-950 shadow-sm' : 'opacity-60 hover:opacity-100'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Mapa Leaflet Neo-Glass */}
            {(viewMode === 'both' || viewMode === 'map') && (
              <div className={`h-[440px] w-full rounded-3xl overflow-hidden border shadow-2xl relative ${
                theme === 'dark' ? 'border-white/10' : 'border-slate-200'
              }`}>
                <MapContainer 
                  center={selectedCity.center} 
                  zoom={14} 
                  scrollWheelZoom={false}
                  className="h-full w-full"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Circle 
                    center={selectedCity.center} 
                    radius={radiusKm * 1000} 
                    pathOptions={{ color: '#05B382', fillColor: '#05B382', fillOpacity: 0.15, weight: 2.5 }} 
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
                          <p className="text-xs font-semibold text-emerald-800">Sector: {alert.sector}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Tarjetas de Alertas */}
            {(viewMode === 'both' || viewMode === 'cards') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {visibleAlerts.map(alert => (
                  <div key={alert.id} className="glass-panel rounded-3xl overflow-hidden hover:border-[#10E7A6]/40 transition duration-300 flex flex-col group">
                    <div className="relative h-48 bg-slate-900 overflow-hidden">
                      <img 
                        src={alert.photo} 
                        alt={alert.pet_name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                      />
                      <div className="absolute top-3 left-3 flex items-center space-x-1.5">
                        <span className={`text-[11px] font-extrabold uppercase px-3 py-1 rounded-full shadow-lg ${
                          alert.alert_type === 'lost' ? 'bg-[#FF3366] text-white' : 'bg-amber-400 text-slate-950'
                        }`}>
                          {alert.alert_type === 'lost' ? 'Perdido' : 'Avistado'}
                        </span>
                        <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${
                          theme === 'dark' 
                            ? 'bg-[#050811]/85 backdrop-blur text-[#10E7A6] border-[#10E7A6]/30' 
                            : 'bg-white/90 backdrop-blur text-emerald-700 border-emerald-300 shadow-xs'
                        }`}>
                          {alert.distance_km} km
                        </span>
                      </div>
                      {alert.reward && (
                        <span className="absolute top-3 right-3 text-xs font-extrabold bg-[#10E7A6] text-slate-950 px-2.5 py-0.5 rounded-full shadow-lg">
                          Recompensa: {alert.reward}
                        </span>
                      )}
                      <span className="absolute bottom-3 right-3 text-[10px] bg-black/75 backdrop-blur text-white px-2 py-0.5 rounded-lg font-mono">
                        {alert.time_ago}
                      </span>
                    </div>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-extrabold text-lg">{alert.pet_name}</h3>
                          <span className="text-xs opacity-60 font-medium">{alert.breed}</span>
                        </div>
                        <p className="text-xs font-semibold text-[#05B382] dark:text-[#10E7A6] mt-1 flex items-center">
                          <MapPin className="w-3.5 h-3.5 mr-1 inline" /> {alert.sector} ({selectedCity.name})
                        </p>
                        <p className={`text-xs mt-2.5 leading-relaxed p-3 rounded-2xl border ${
                          theme === 'dark' 
                            ? 'bg-[#050811]/60 border-white/5 opacity-80' 
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}>
                          {alert.description}
                        </p>
                      </div>

                      <a 
                        href={`tel:${alert.contact_phone}`}
                        className="btn-primary-2026 w-full py-2.5 px-4 text-xs flex items-center justify-center space-x-2"
                      >
                        <PhoneCall className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>Contactar Tutor Directamente</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* 2. MÓDULO: TRIAJE INTELIGENTE PAWLO AI */}
        {activeTab === 'assistant' && (
          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 glass-panel rounded-3xl p-6 space-y-5">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-[#10E7A6]/10 text-[#05B382] dark:text-[#10E7A6] border border-[#10E7A6]/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">PAWLO Clinical Shield</h3>
                  <p className="text-xs opacity-60">Protección del Paciente</p>
                </div>
              </div>

              <div className="space-y-3.5 text-xs opacity-80 leading-relaxed">
                <p>
                  Asistente inteligente para la evaluación preliminar de signos físicos y conducta canina en <strong>{selectedCity.name}</strong>.
                </p>

                <div className="bg-[#FF3366]/10 border border-[#FF3366]/30 p-3.5 rounded-2xl space-y-1.5 text-rose-600 dark:text-rose-200">
                  <p className="font-extrabold flex items-center">
                    <ShieldAlert className="w-4 h-4 mr-1.5 text-[#FF3366]" />
                    Bloqueo Estricto de Posología
                  </p>
                  <p className="text-[11px] opacity-90">
                    PAWLO bloquea cualquier dosificación o prescripción farmacológica para prevenir intoxicaciones accidentales. Todo tratamiento exige evaluación médica física.
                  </p>
                </div>

                <div className="pt-2">
                  <label htmlFor="pawlo-clinical-consent" className="flex items-start space-x-3 cursor-pointer select-none">
                    <input 
                      id="pawlo-clinical-consent"
                      name="clinicalConsent"
                      type="checkbox"
                      checked={disclaimerAccepted}
                      onChange={(e) => setDisclaimerAccepted(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300 text-[#05B382] focus:ring-[#05B382] h-4 w-4"
                    />
                    <span className="text-[11px] font-medium">
                      Acepto que esta es una herramienta de orientación preventiva y no reemplaza la consulta veterinaria profesional.
                    </span>
                  </label>
                </div>
              </div>

              <div className={`border-t pt-4 space-y-2 ${theme === 'dark' ? 'border-white/5' : 'border-slate-200'}`}>
                <span className="text-[10px] font-bold opacity-60 uppercase tracking-wider block">Escala de Triaje:</span>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-bold">
                  <div className="bg-rose-500/20 text-rose-500 dark:text-rose-300 border border-rose-500/30 p-2 rounded-xl">ROJO (0h) Emergencia</div>
                  <div className="bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 p-2 rounded-xl">AMARILLO Urgencia</div>
                  <div className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30 p-2 rounded-xl">VERDE Guía / Rutina</div>
                </div>
              </div>
            </div>

            {/* Chat Box */}
            <div className="lg:col-span-2 glass-panel rounded-3xl flex flex-col h-[520px] overflow-hidden">
              <div className={`px-6 py-4 border-b flex items-center justify-between ${
                theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 rounded-full bg-[#10E7A6] shadow-[0_0_10px_#10E7A6] animate-pulse"></div>
                  <span className="font-bold text-sm">PAWLO Copilot (DeepSeek V3 / R1)</span>
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-1 rounded-lg border ${
                  theme === 'dark' ? 'bg-[#050811] text-slate-400 border-white/10' : 'bg-white text-slate-600 border-slate-200'
                }`}>
                  Nodo: {selectedCity.name}
                </span>
              </div>

              {/* Mensajes */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed space-y-2 shadow-sm ${
                      msg.sender === 'user' 
                        ? 'btn-primary-2026 !shadow-none font-medium rounded-br-none' 
                        : (theme === 'dark' ? 'bg-[#050811] border border-white/10 text-slate-200 rounded-bl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-xs')
                    }`}>
                      <p>{msg.text}</p>
                      {msg.action && (
                        <div className={`mt-2.5 pt-2.5 border-t font-bold text-[#05B382] dark:text-[#10E7A6] flex items-center ${
                          theme === 'dark' ? 'border-white/10' : 'border-slate-100'
                        }`}>
                          <Navigation className="w-3.5 h-3.5 mr-1.5" />
                          <span>Acción Recomendada: {msg.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex justify-start">
                    <div className={`border rounded-2xl p-3.5 text-xs flex items-center space-x-2 ${
                      theme === 'dark' ? 'bg-[#050811] border-white/10 text-slate-400' : 'bg-white border-slate-200 text-slate-500'
                    }`}>
                      <div className="w-2 h-2 rounded-full bg-[#10E7A6] animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-[#10E7A6] animate-bounce delay-100"></div>
                      <div className="w-2 h-2 rounded-full bg-[#10E7A6] animate-bounce delay-200"></div>
                      <span>Evaluando signos clínicos...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form 
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className={`p-3.5 border-t flex items-center space-x-2.5 ${
                  theme === 'dark' ? 'bg-[#050811] border-white/5' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <label htmlFor="pawlo-chat-input" className="sr-only">Mensaje para el asistente</label>
                <input 
                  id="pawlo-chat-input"
                  name="chatMessage"
                  type="text"
                  value={inputMsg}
                  onChange={(e) => setInputMsg(e.target.value)}
                  placeholder={disclaimerAccepted ? "Describe síntomas o comportamiento de tu mascota..." : "Acepta el descargo a la izquierda para habilitar la consulta..."}
                  disabled={!disclaimerAccepted}
                  className="flex-1 glass-input rounded-2xl px-4 py-3 text-xs placeholder-slate-400 focus:outline-none"
                />
                <button 
                  type="submit"
                  aria-label="Enviar mensaje"
                  disabled={!disclaimerAccepted || !inputMsg.trim()}
                  className="btn-primary-2026 p-3 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  <Send className="w-4 h-4 stroke-[2.5]" />
                </button>
              </form>
            </div>
          </section>
        )}

        {/* 3. MÓDULO: SERVICIOS PRIVADOS & COMMERCE */}
        {activeTab === 'services' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-7">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#05B382] dark:text-[#10E7A6] bg-[#10E7A6]/10 px-3 py-1 rounded-full border border-[#10E7A6]/25">
                PAWLO Direct Care • {selectedCity.name}
              </span>
              <h2 className="text-2xl font-bold mt-2">Servicios Veterinarios & Grooming en {selectedCity.name}</h2>
              <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-2xl">
                Agenda citas con los mejores profesionales y centros privados. Confirmación directa en WhatsApp con pagos vía <strong>{selectedCity.paymentRail}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {SERVICES_CATALOG.map(srv => (
                <div key={srv.id} className="glass-panel rounded-3xl p-5 flex flex-col justify-between space-y-4 hover:border-[#10E7A6]/40 transition duration-300">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-[#05B382] dark:text-[#10E7A6] bg-[#10E7A6]/10 px-2.5 py-0.5 rounded-full border border-[#10E7A6]/20">
                        {srv.badge}
                      </span>
                      <span className="text-xl font-extrabold">${srv.price.toFixed(2)}</span>
                    </div>
                    <h3 className="font-extrabold text-base mt-3.5 leading-snug">{srv.title}</h3>
                    <p className="text-xs opacity-60 mt-1 font-medium">{srv.provider}</p>
                    <p className="text-xs font-medium mt-2 flex items-center text-[#05B382] dark:text-[#10E7A6]">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> {srv.sector}
                    </p>
                  </div>

                  <button 
                    onClick={() => { setSelectedService(srv); setLeadSuccess(null); }}
                    className="btn-primary-2026 w-full py-2.5 px-4 text-xs flex items-center justify-center space-x-1.5"
                  >
                    <span>Reservar Cita</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Modal de Agendamiento */}
            {selectedService && (
              <div className="glass-panel-glow rounded-3xl p-6 sm:p-7 max-w-xl mx-auto space-y-4">
                <div className={`flex items-center justify-between border-b pb-3 ${
                  theme === 'dark' ? 'border-white/10' : 'border-slate-200'
                }`}>
                  <div>
                    <h3 className="font-extrabold text-base">Reservar con {selectedService.provider}</h3>
                    <p className="text-xs text-[#05B382] dark:text-[#10E7A6]">{selectedService.title} — ${selectedService.price.toFixed(2)} ({selectedCity.currency})</p>
                  </div>
                  <button onClick={() => setSelectedService(null)} className="opacity-60 hover:opacity-100 font-bold text-sm">✕</button>
                </div>

                {!leadSuccess ? (
                  <form onSubmit={handleBookingSubmit} className="space-y-3.5 text-xs">
                    <div>
                      <label htmlFor="lead-fullname" className="font-semibold opacity-80">Tu Nombre Completo:</label>
                      <input 
                        id="lead-fullname"
                        name="fullName"
                        type="text" 
                        required
                        placeholder="Ej. Mateo Valdivieso"
                        value={leadForm.fullName}
                        onChange={e => setLeadForm({...leadForm, fullName: e.target.value})}
                        className="w-full mt-1.5 glass-input rounded-xl px-3.5 py-2.5 focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-phone" className="font-semibold opacity-80">WhatsApp:</label>
                        <input 
                          id="lead-phone"
                          name="phone"
                          type="text" 
                          required
                          placeholder="0998408369"
                          value={leadForm.phone}
                          onChange={e => setLeadForm({...leadForm, phone: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-3.5 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-sector" className="font-semibold opacity-80">Sector o Zona:</label>
                        <input 
                          id="lead-sector"
                          name="sector"
                          type="text" 
                          required
                          placeholder="Ej. El Vergel o Centro"
                          value={leadForm.sector}
                          onChange={e => setLeadForm({...leadForm, sector: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-3.5 py-2.5 focus:outline-none"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label htmlFor="lead-petname" className="font-semibold opacity-80">Nombre de Mascota:</label>
                        <input 
                          id="lead-petname"
                          name="petName"
                          type="text" 
                          required
                          placeholder="Ej. Bruno"
                          value={leadForm.petName}
                          onChange={e => setLeadForm({...leadForm, petName: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-3.5 py-2.5 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label htmlFor="lead-payment" className="font-semibold opacity-80">Pasarela / Medio de Pago:</label>
                        <select 
                          id="lead-payment"
                          name="paymentPreference"
                          value={leadForm.paymentPreference}
                          onChange={e => setLeadForm({...leadForm, paymentPreference: e.target.value})}
                          className="w-full mt-1.5 glass-input rounded-xl px-3.5 py-2.5 focus:outline-none"
                        >
                          <option value="Deuna_P2P">Deuna (P2P)</option>
                          <option value="Pichincha">Transferencia Bancaria Directa</option>
                          <option value="Produbanco">Produbanco / Be</option>
                          <option value="Contraentrega">En Efectivo presencial</option>
                        </select>
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="btn-primary-2026 w-full py-3.5 text-xs font-extrabold mt-2"
                    >
                      Continuar a WhatsApp con el Profesional
                    </button>
                  </form>
                ) : (
                  <div className="space-y-4 text-center py-4">
                    <div className="w-12 h-12 bg-[#10E7A6]/20 text-[#05B382] dark:text-[#10E7A6] rounded-2xl flex items-center justify-center mx-auto border border-[#10E7A6]/30">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base">¡Cita Preparada con Éxito!</h4>
                      <p className="text-xs opacity-60 mt-1 font-mono">Código PAWLO: {leadSuccess.refId}</p>
                    </div>
                    <a 
                      href={leadSuccess.waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-primary-2026 inline-flex items-center space-x-2 py-3 px-6 text-xs"
                    >
                      <MessageSquare className="w-4 h-4 stroke-[2.5]" />
                      <span>Abrir WhatsApp Ahora</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. MÓDULO: ESCÁNER Y VALIDADOR DE CHIP ISO UNIVERSAL */}
        {activeTab === 'chip_lookup' && (
          <section className="max-w-2xl mx-auto space-y-6">
            <div className="glass-panel rounded-3xl p-7 space-y-4">
              <div className="flex items-center space-x-3.5">
                <div className="p-3 bg-[#10E7A6]/10 border border-[#10E7A6]/30 rounded-2xl text-[#05B382] dark:text-[#10E7A6]">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#05B382] dark:text-[#10E7A6]">
                    Global Pet Identification Registry
                  </span>
                  <h2 className="text-xl font-extrabold">Escáner de Microchip ISO Universal</h2>
                </div>
              </div>

              <p className="text-xs opacity-80 leading-relaxed">
                Verifica de inmediato el número de transponder de tu mascota bajo la norma internacional <code className={`px-1.5 py-0.5 rounded font-mono ${
                  theme === 'dark' ? 'bg-[#050811] text-[#10E7A6]' : 'bg-slate-100 text-emerald-700'
                }`}>ISO 11784/11785</code> de 15 dígitos o registros clínicos privados. Funciona de manera idéntica en cualquier ciudad o país.
              </p>

              <form onSubmit={handleValidateMicrochip} className="space-y-4 pt-2">
                <div>
                  <label htmlFor="pawlo-chip-input" className="text-xs font-semibold opacity-80">Número de Microchip o Identificador:</label>
                  <div className="mt-2 flex gap-2">
                    <input 
                      id="pawlo-chip-input"
                      name="chipNumber"
                      type="text" 
                      value={chipInput}
                      onChange={e => setChipInput(e.target.value)}
                      placeholder="Ej. 981098123456789 o PWL-CHIP-7721"
                      className="flex-1 glass-input rounded-2xl px-4 py-3 text-xs focus:outline-none font-mono"
                    />
                    <button 
                      type="submit"
                      className="btn-primary-2026 px-6 py-3 text-xs"
                    >
                      Verificar
                    </button>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[11px] opacity-60">
                  <span>Probar muestra estándar:</span>
                  <button 
                    type="button" 
                    onClick={() => setChipInput('981098123456789')}
                    className="text-[#05B382] dark:text-[#10E7A6] hover:underline font-mono"
                  >
                    981098123456789 (ISO 15 dígitos)
                  </button>
                </div>
              </form>

              {chipResult && (
                <div className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                  chipResult.isValid 
                    ? 'bg-[#10E7A6]/10 border-[#10E7A6]/30 text-emerald-800 dark:text-emerald-200' 
                    : 'bg-[#FF3366]/10 border-[#FF3366]/30 text-rose-800 dark:text-rose-200'
                }`}>
                  <div className="flex items-center space-x-2 font-bold text-sm">
                    {chipResult.isValid ? (
                      <Check className="w-4 h-4 text-[#05B382] dark:text-[#10E7A6]" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-[#FF3366]" />
                    )}
                    <span>{chipResult.standard}</span>
                  </div>
                  <p className="opacity-80">{chipResult.message}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* 5. MÓDULO: ADOPCIONES COMUNITARIAS */}
        {activeTab === 'adoptions' && (
          <section className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 sm:p-7">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#FF3366] bg-[#FF3366]/10 px-3 py-1 rounded-full border border-[#FF3366]/30">
                PAWLO Community Adoption
              </span>
              <h2 className="text-2xl font-bold mt-2">Adopciones Directas en {selectedCity.name}</h2>
              <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-2xl">
                Conectamos tutores temporales y rescatistas independientes con familias adoptantes responsables, sin trámites lentos ni barreras burocráticas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {COMMUNITY_ADOPTIONS.map(pet => (
                <div key={pet.id} className="glass-panel rounded-3xl overflow-hidden flex flex-col sm:flex-row group hover:border-slate-300 dark:hover:border-white/20 transition">
                  <div className="w-full sm:w-52 h-52 sm:h-auto bg-slate-900 relative overflow-hidden">
                    <img src={pet.photo} alt={pet.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    <span className="absolute top-3 left-3 text-[10px] font-extrabold bg-[#050811]/85 backdrop-blur text-rose-300 px-2.5 py-1 rounded-full border border-rose-500/30">
                      {pet.badge}
                    </span>
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-3.5">
                    <div>
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-xl">{pet.name}</h3>
                        <span className="text-xs text-[#05B382] dark:text-[#10E7A6] font-bold">{pet.gender}</span>
                      </div>
                      <p className="text-xs opacity-60 mt-0.5">{pet.breed} • {pet.age} • {pet.location}</p>
                      <p className={`text-xs mt-3 leading-relaxed p-3 rounded-2xl border ${
                        theme === 'dark' ? 'bg-[#050811]/60 border-white/5 opacity-80' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        "{pet.story}"
                      </p>
                    </div>

                    <button 
                      onClick={() => alert(`Postulación registrada para ${pet.name}. El tutor temporal en ${selectedCity.name} te contactará por WhatsApp.`)}
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF3366] to-rose-600 hover:brightness-110 text-white rounded-2xl text-xs font-bold transition flex items-center justify-center space-x-2 shadow-lg shadow-rose-600/20"
                    >
                      <Heart className="w-3.5 h-3.5" />
                      <span>Postular para Adopción</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* FOOTER PAWLO GLOBAL */}
      <footer className={`border-t py-5 px-6 text-center text-xs flex flex-wrap items-center justify-between gap-4 relative z-10 transition-colors duration-300 ${
        theme === 'dark' ? 'border-white/5 bg-[#050811] text-slate-500' : 'border-slate-200 bg-white text-slate-500'
      }`}>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-[#10E7A6]"></div>
          <span className="font-medium">PAWLO™ Pet Operating System • Nodo Urbano Activo: {selectedCity.name}, {selectedCity.country}</span>
        </div>
        <div className="font-mono text-[11px] opacity-75">
          Global ISO 11784/11785 | PostGIS Geo-Clustering | Direct-to-Care
        </div>
      </footer>
    </div>
  );
}
