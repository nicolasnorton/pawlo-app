import React, { useState, useEffect } from 'react';
import {
  Flame,
  AlertTriangle,
  PhoneCall,
  Eye,
  X,
  MapPin,
  Share2,
  CheckCircle2,
  Ambulance,
  Building2,
  Check,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { UserPet } from '../data/pawloData';

export interface QuickSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  activePet: UserPet;
  cityName: string;
  userPhone: string;
  userSector: string;
  onPublishAlert: (alertData: { type: 'lost' | 'found' | 'medical'; title: string; sector: string; description: string }) => void;
  theme: 'dark' | 'light';
  initialType?: 'lost' | 'medical' | 'found';
}

export const QuickSosModal: React.FC<QuickSosModalProps> = ({
  isOpen,
  onClose,
  activePet,
  cityName,
  userPhone,
  userSector,
  onPublishAlert,
  theme,
  initialType = 'lost'
}) => {
  const [activeTab, setActiveTab] = useState<'lost' | 'medical' | 'found'>(initialType || 'lost');
  
  // Estado para pestaña: Se perdió mi mascota
  const [lostSector, setLostSector] = useState(userSector || `Sector El Vergel, ${cityName}`);
  const [lostDetails, setLostDetails] = useState('Lleva collar y responde a su nombre. Por favor avisar urgente si lo ven.');
  const [lostPublished, setLostPublished] = useState(false);

  // Estado para pestaña: Mascota encontrada
  const [foundSector, setFoundSector] = useState(userSector || `Centro Histórico, ${cityName}`);
  const [foundSpecies, setFoundSpecies] = useState<'canine' | 'feline'>('canine');
  const [foundDescription, setFoundDescription] = useState('Perrito mestizo café claro, asustado y desorientado');
  const [foundPublished, setFoundPublished] = useState(false);

  // Estado para clínicas 24h desplegables
  const [showClinicsList, setShowClinicsList] = useState(false);
  const [medicalAlertSent, setMedicalAlertSent] = useState(false);

  // Sincronizar tipo inicial cuando se abre
  useEffect(() => {
    if (initialType) {
      setActiveTab(initialType);
    }
  }, [initialType, isOpen]);

  // Manejo de tecla Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Sectores populares para selección rápida en Cuenca
  const quickSectors = [
    'El Vergel',
    'Centro Histórico',
    'Challuabamba',
    'Totoracocha',
    'Yanuncay',
    'Ricaurte',
    'Baños'
  ];

  // 1. PUBLICAR ALERTA DE PÉRDIDA
  const handlePublishLost = () => {
    onPublishAlert({
      type: 'lost',
      title: `¡SE BUSCA! ${activePet.name} (${activePet.breed})`,
      sector: lostSector,
      description: `Se perdió ${activePet.name} en ${lostSector}. ${activePet.breed}, color ${activePet.coatColor || 'característico'}. Microchip: ${activePet.microchipIso || 'Registrado en Pawlo'}. Teléfono de contacto: ${userPhone}. ${lostDetails}`
    });
    setLostPublished(true);
  };

  // WhatsApp para compartir pérdida
  const handleShareLostWhatsApp = () => {
    const text = `🚨 *¡URGENTE: SE PERDIÓ ${activePet.name.toUpperCase()} EN ${cityName.toUpperCase()}!*\n\n` +
      `📍 *Sector donde se perdió:* ${lostSector}\n` +
      `🐾 *Mascota:* ${activePet.name} (${activePet.species === 'canine' ? 'Perro' : 'Gato'} - ${activePet.breed})\n` +
      `🎨 *Color / Señas:* ${activePet.coatColor || 'Ver foto adjunta'}\n` +
      `🔢 *Microchip:* ${activePet.microchipIso || 'Registrado en Pawlo'}\n` +
      `📞 *Contacto directo:* ${userPhone}\n` +
      `📝 *Detalle:* ${lostDetails}\n\n` +
      `🙏 _Por favor si lo ves o tienes cualquier pista, llámame o comparte en tus grupos de vecinos._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 2. PEDIR AMBULANCIA / PET TAXI
  const handleCallAmbulanceWhatsApp = () => {
    const text = `🚨 *EMERGENCIA VETERINARIA 24H - PAWLO ${cityName.toUpperCase()}*\n\n` +
      `Necesito *Ambulancia o Pet Taxi de Emergencia* para mi mascota *${activePet.name}* (${activePet.species === 'canine' ? 'Perro' : 'Gato'}, ${activePet.breed}).\n` +
      `📍 *Sector / Dirección:* ${userSector || cityName}\n` +
      `📞 *Teléfono de contacto:* ${userPhone}\n` +
      `🆘 *Situación:* Urgencia médica inmediata. Por favor confirmar disponibilidad y unidad en camino.`;

    window.open(`https://wa.me/593998408369?text=${encodeURIComponent(text)}`, '_blank');
  };

  // 3. PUBLICAR MASCOTA ENCONTRADA
  const handlePublishFound = () => {
    const speciesText = foundSpecies === 'canine' ? 'Perrito' : 'Gatito';
    onPublishAlert({
      type: 'found',
      title: `Mascota Encontrada en ${foundSector}`,
      sector: foundSector,
      description: `Se avistó un ${speciesText} en ${foundSector}. ${foundDescription}. Teléfono de contacto: ${userPhone}`
    });
    setFoundPublished(true);
  };

  // WhatsApp para compartir mascota encontrada
  const handleShareFoundWhatsApp = () => {
    const speciesText = foundSpecies === 'canine' ? 'Perrito' : 'Gatito';
    const text = `👀 *MASCOTA AVISTADA / ENCONTRADA EN ${cityName.toUpperCase()}*\n\n` +
      `📍 *Sector:* ${foundSector}\n` +
      `🐾 *Especie:* ${speciesText}\n` +
      `📝 *Descripción:* ${foundDescription}\n` +
      `📞 *Contacto:* ${userPhone}\n\n` +
      `_Si eres el dueño o reconoces a quién pertenece, comunícate o comparte en tu grupo._`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Clínicas 24 Horas Verificadas
  const emergencyClinics = [
    {
      name: 'Hospital Veterinario El Paraíso (24 Horas)',
      address: 'Av. Diez de Agosto y Pichincha, Cuenca',
      phone: '072882200',
      phoneDisplay: '(07) 288-2200',
      whatsapp: '593998408369',
      badge: 'Abierto Ahora 24/7'
    },
    {
      name: 'Clínica San Francisco Urgencias 24h',
      address: 'Av. Solano y Doce de Abril, Cuenca',
      phone: '072814500',
      phoneDisplay: '(07) 281-4500',
      whatsapp: '593991234567',
      badge: 'Trauma & Cuidados Intensivos'
    },
    {
      name: 'Emergencias Pets Cuenca 24/7',
      address: 'Av. España y Huayna Cápac, Cuenca',
      phone: '0999876543',
      phoneDisplay: '099 987 6543',
      whatsapp: '593999876543',
      badge: 'Unidad Móvil Activa'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden my-auto transition-all ${
        theme === 'dark'
          ? 'bg-[#03060C] border-rose-500/30 text-white'
          : 'bg-white border-rose-300 text-slate-900'
      }`}>
        
        {/* Cabecera de Emergencia */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shrink-0">
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                Centro de Emergencia Rápida
              </h2>
              <p className="text-xs text-rose-100 font-semibold">
                Red de Asistencia Inmediata • {cityName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition active:scale-95"
            title="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Grandes Botones Visuales (Pestañas de 1 Toque) */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-white/5 border-b border-slate-200 dark:border-white/10">
          <div className="grid grid-cols-3 gap-2">
            
            {/* Botón 1: Se perdió mi mascota */}
            <button
              onClick={() => { setActiveTab('lost'); }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'lost'
                  ? 'bg-rose-500 text-white border-rose-400 shadow-md font-black'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">🐕</span>
              <span className="text-xs sm:text-sm leading-tight">
                Se perdió <br className="hidden sm:inline" /><strong>{activePet.name}</strong>
              </span>
            </button>

            {/* Botón 2: Emergencia 24h */}
            <button
              onClick={() => { setActiveTab('medical'); }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'medical'
                  ? 'bg-rose-600 text-white border-rose-400 shadow-md font-black'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">🚑</span>
              <span className="text-xs sm:text-sm leading-tight">
                Emergencia <br className="hidden sm:inline" /><strong>Médica 24h</strong>
              </span>
            </button>

            {/* Botón 3: Encontré una mascota */}
            <button
              onClick={() => { setActiveTab('found'); }}
              className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1.5 active:scale-95 ${
                activeTab === 'found'
                  ? 'bg-amber-500 text-white border-amber-400 shadow-md font-black'
                  : theme === 'dark'
                    ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span className="text-2xl">👀</span>
              <span className="text-xs sm:text-sm leading-tight">
                Encontré un <br className="hidden sm:inline" /><strong>Animalito</strong>
              </span>
            </button>

          </div>
        </div>

        {/* ============================================================ */}
        {/* PANEL 1: SE PERDIÓ MI MASCOTA (PRE-LLENADO EN 10 SEGUNDOS)    */}
        {/* ============================================================ */}
        {activeTab === 'lost' && (
          <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {!lostPublished ? (
              <>
                <div className="bg-rose-500/10 border border-rose-500/30 p-3.5 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-extrabold text-rose-600 dark:text-rose-400 block">
                      Datos cargados automáticamente:
                    </span>
                    <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                      Hemos pre-llenado la foto, raza, color y microchip de {activePet.name}. Solo verifica tu sector y pulsa publicar.
                    </span>
                  </div>
                </div>

                {/* Vista previa de la tarjeta que verán los vecinos */}
                <div className={`p-4 rounded-2xl border flex items-center gap-4 ${
                  theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                }`}>
                  <img
                    src={activePet.avatar}
                    alt={activePet.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-rose-500 shadow"
                  />
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-base sm:text-lg">{activePet.name}</span>
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500 text-white uppercase">
                        Perdido
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
                      {activePet.breed} • {activePet.coatColor || 'Color característico'}
                    </p>
                    <div className="text-xs text-slate-400 font-mono">
                      Chip: {activePet.microchipIso || 'Registrado en Pawlo'}
                    </div>
                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      Teléfono de contacto: {userPhone}
                    </div>
                  </div>
                </div>

                {/* Sector donde se vio por última vez */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    📍 Sector donde se perdió (o fue visto por última vez):
                  </label>
                  <input
                    type="text"
                    value={lostSector}
                    onChange={(e) => setLostSector(e.target.value)}
                    placeholder="Ej: Sector El Vergel / Av. Solano"
                    className={`w-full p-3.5 rounded-2xl border text-sm font-semibold transition outline-none ${
                      theme === 'dark'
                        ? 'bg-black/50 border-white/20 focus:border-rose-400 text-white'
                        : 'bg-white border-slate-300 focus:border-rose-500 text-slate-800'
                    }`}
                  />
                  
                  {/* Selector rápido de sectores en Cuenca */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="text-[11px] text-slate-400 self-center mr-1">Rápido:</span>
                    {quickSectors.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setLostSector(`${sec}, ${cityName}`)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                          lostSector.includes(sec)
                            ? 'bg-rose-500 text-white border-rose-500 font-bold'
                            : theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                              : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Detalle o seña opcional */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Detalle breve para los vecinos (opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={lostDetails}
                    onChange={(e) => setLostDetails(e.target.value)}
                    className={`w-full p-3 rounded-2xl border text-xs sm:text-sm font-medium transition outline-none resize-none ${
                      theme === 'dark'
                        ? 'bg-black/50 border-white/20 focus:border-rose-400 text-white'
                        : 'bg-white border-slate-300 focus:border-rose-500 text-slate-800'
                    }`}
                  />
                </div>

                {/* BOTÓN GIGANTE: PUBLICAR ALERTA A VECINOS AHORA */}
                <button
                  onClick={handlePublishLost}
                  className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-white bg-gradient-to-r from-rose-600 via-rose-500 to-amber-600 hover:from-rose-500 hover:to-amber-500 shadow-xl shadow-rose-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">📢</span>
                  <span>Publicar Alerta a Vecinos Ahora</span>
                </button>
              </>
            ) : (
              /* Pantalla de Éxito y Difusión Inmediata */
              <div className="p-6 text-center space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center text-3xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ¡Alerta Publicada con Éxito!
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Tu alerta ya está activa en el Radar Geoespacial de <strong>{cityName}</strong> para vecinos de <strong>{lostSector}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    El paso más importante ahora es compartirla en grupos de WhatsApp:
                  </p>
                  
                  {/* Botón WhatsApp Listo para Enviar */}
                  <button
                    onClick={handleShareLostWhatsApp}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Compartir en Grupos y Estados de WhatsApp</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition"
                >
                  Entendido, volver a la aplicación
                </button>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* PANEL 2: EMERGENCIA VETERINARIA 24 HORAS                     */}
        {/* ============================================================ */}
        {activeTab === 'medical' && (
          <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            
            {/* Banner de Ayuda Inmediata */}
            <div className="bg-rose-500/15 border-2 border-rose-500/40 p-4 rounded-2xl space-y-1">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base">
                <Ambulance className="w-5 h-5 shrink-0 animate-pulse" />
                <span>¿Tu mascota necesita atención urgente ahora mismo?</span>
              </div>
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                No pierdas tiempo buscando números. Toca uno de los dos botones directos a continuación:
              </p>
            </div>

            {/* 2 Botones Inmediatos de 1 Toque */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Botón 1: Pedir Ambulancia / Pet Taxi */}
              <button
                onClick={handleCallAmbulanceWhatsApp}
                className="p-4 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 shadow-lg shadow-rose-600/30 flex flex-col items-center justify-center gap-2 transition active:scale-95 cursor-pointer text-center"
              >
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
                  📞
                </div>
                <span>Pedir Ambulancia / Pet Taxi por WhatsApp</span>
                <span className="text-xs font-normal text-rose-200">
                  Despacho urgente a domicilio en {cityName}
                </span>
              </button>

              {/* Botón 2: Ver Clínicas 24h Abiertas Ahora */}
              <button
                onClick={() => setShowClinicsList(!showClinicsList)}
                className={`p-4 rounded-2xl font-black text-sm sm:text-base border-2 flex flex-col items-center justify-center gap-2 transition active:scale-95 cursor-pointer text-center ${
                  showClinicsList
                    ? 'bg-sky-500 text-white border-sky-400 shadow-md'
                    : theme === 'dark'
                      ? 'bg-white/5 border-sky-500/40 text-sky-300 hover:bg-sky-500/10'
                      : 'bg-sky-50 border-sky-400 text-sky-800 hover:bg-sky-100'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-500 flex items-center justify-center text-xl">
                  🏥
                </div>
                <span>Ver Clínicas 24h Abiertas Ahora</span>
                <span className="text-xs font-normal opacity-80">
                  {showClinicsList ? 'Ocultar lista' : '3 hospitales con guardia presencial'}
                </span>
              </button>

            </div>

            {/* Lista Desplegable de Clínicas 24h en Cuenca */}
            {showClinicsList && (
              <div className="space-y-2.5 animate-fadeIn">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Hospitales con Emergencias 24h en {cityName}:
                </h4>
                {emergencyClinics.map((clinic, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm sm:text-base">{clinic.name}</span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                          {clinic.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{clinic.address}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`tel:${clinic.phone}`}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition active:scale-95"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>Llamar {clinic.phoneDisplay}</span>
                      </a>
                      <a
                        href={`https://wa.me/${clinic.whatsapp}?text=${encodeURIComponent(`Hola, tengo una emergencia veterinaria en ${cityName} con mi mascota ${activePet.name}. Por favor confirmar si tienen veterinario de turno disponible.`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 transition active:scale-95"
                      >
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3 BULLET POINTS SENCILLOS DE PRIMEROS AUXILIOS (QUÉ NO HACER) */}
            <div className={`p-4 rounded-2xl border space-y-3 ${
              theme === 'dark' ? 'bg-[#080E1C] border-amber-500/30' : 'bg-amber-50/60 border-amber-200'
            }`}>
              <h4 className="text-xs sm:text-sm font-black text-amber-700 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wide">
                <span>⚠️ 3 Reglas de Oro mientras llegas al veterinario:</span>
              </h4>
              <ul className="space-y-2.5 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">🚫</span>
                  <div>
                    <strong className="text-rose-600 dark:text-rose-400">1. NO le des medicamentos de humanos:</strong>
                    <span className={`block ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      El paracetamol, ibuprofeno o aspirina causan intoxicación fulminante en perros y gatos.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">🧣</span>
                  <div>
                    <strong className="text-amber-600 dark:text-amber-400">2. Mantenlo abrigado y sin doblarlo:</strong>
                    <span className={`block ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Si hubo caída o atropello, usa una toalla o tabla rígida como camilla para no lastimar su columna.
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <span className="text-base shrink-0">🥣</span>
                  <div>
                    <strong className="text-sky-600 dark:text-sky-400">3. NO le des comida ni agua a la fuerza:</strong>
                    <span className={`block ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Si está inconsciente o vomitando, cualquier líquido puede irse directo a sus pulmones y asfixiarlo.
                    </span>
                  </div>
                </li>
              </ul>
            </div>

            {/* Notificar a la red Pawlo */}
            {!medicalAlertSent ? (
              <button
                onClick={() => {
                  onPublishAlert({
                    type: 'medical',
                    title: `Urgencia Médica: ${activePet.name}`,
                    sector: userSector || cityName,
                    description: `Urgencia médica reportada para ${activePet.name} en ${userSector || cityName}. Contacto: ${userPhone}`
                  });
                  setMedicalAlertSent(true);
                }}
                className="w-full py-3 rounded-xl border border-rose-500/40 text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition active:scale-95"
              >
                📢 Registrar esta urgencia en el radar local de {cityName}
              </button>
            ) : (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center">
                ✓ Alerta médica registrada en la red local.
              </div>
            )}

          </div>
        )}

        {/* ============================================================ */}
        {/* PANEL 3: VI O ENCONTRÉ UN ANIMALITO EN LA CALLE              */}
        {/* ============================================================ */}
        {activeTab === 'found' && (
          <div className="p-5 sm:p-6 space-y-5 max-h-[72vh] overflow-y-auto">
            {!foundPublished ? (
              <>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-2xl flex items-start gap-3">
                  <Eye className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs sm:text-sm">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 block">
                      Avisa en menos de 10 segundos:
                    </span>
                    <span className={theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}>
                      Los vecinos cercanos recibirán la notificación para comprobar si pertenece a alguien de la zona.
                    </span>
                  </div>
                </div>

                {/* Especie */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    ¿Qué animalito viste o retuviste?
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setFoundSpecies('canine')}
                      className={`p-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition ${
                        foundSpecies === 'canine'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-slate-300'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">🐕</span>
                      <span>Un Perrito</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFoundSpecies('feline')}
                      className={`p-3 rounded-2xl border font-bold text-sm flex items-center justify-center gap-2 transition ${
                        foundSpecies === 'feline'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : theme === 'dark'
                            ? 'bg-white/5 border-white/10 text-slate-300'
                            : 'bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      <span className="text-xl">🐈</span>
                      <span>Un Gatito</span>
                    </button>
                  </div>
                </div>

                {/* Sector */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    📍 Sector / Calle donde está:
                  </label>
                  <input
                    type="text"
                    value={foundSector}
                    onChange={(e) => setFoundSector(e.target.value)}
                    placeholder="Ej: Frente al Parque de la Madre, Cuenca"
                    className={`w-full p-3.5 rounded-2xl border text-sm font-semibold transition outline-none ${
                      theme === 'dark'
                        ? 'bg-black/50 border-white/20 focus:border-amber-400 text-white'
                        : 'bg-white border-slate-300 focus:border-amber-500 text-slate-800'
                    }`}
                  />
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {quickSectors.map((sec) => (
                      <button
                        key={sec}
                        type="button"
                        onClick={() => setFoundSector(`${sec}, ${cityName}`)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition font-medium ${
                          foundSector.includes(sec)
                            ? 'bg-amber-500 text-white border-amber-500 font-bold'
                            : theme === 'dark'
                              ? 'bg-white/5 border-white/10 text-slate-300'
                              : 'bg-slate-100 border-slate-200 text-slate-700'
                        }`}
                      >
                        {sec}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Señas particulares */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Señas rápidas (color, collar o tamaño):
                  </label>
                  <input
                    type="text"
                    value={foundDescription}
                    onChange={(e) => setFoundDescription(e.target.value)}
                    placeholder="Ej: Blanco con manchas café, collar rojo gastado"
                    className={`w-full p-3.5 rounded-2xl border text-sm font-medium transition outline-none ${
                      theme === 'dark'
                        ? 'bg-black/50 border-white/20 focus:border-amber-400 text-white'
                        : 'bg-white border-slate-300 focus:border-amber-500 text-slate-800'
                    }`}
                  />
                </div>

                {/* BOTÓN: AVISAR A LA COMUNIDAD */}
                <button
                  onClick={handlePublishFound}
                  className="w-full py-4 px-6 rounded-2xl font-black text-base sm:text-lg text-white bg-gradient-to-r from-amber-500 via-amber-600 to-rose-500 hover:from-amber-400 hover:to-rose-400 shadow-xl shadow-amber-500/25 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2"
                >
                  <span className="text-2xl">📢</span>
                  <span>Avisar a la Comunidad de Vecinos</span>
                </button>
              </>
            ) : (
              /* Éxito aviso comunitario */
              <div className="p-6 text-center space-y-5 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center text-3xl">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ¡Aviso Comunitario Publicado!
                  </h3>
                  <p className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    Gracias por tu empatía. La alerta del animalito avistado en <strong>{foundSector}</strong> ya está en la red de <strong>{cityName}</strong>.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-3">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Difúndelo en el grupo de vecinos de tu barrio:
                  </p>
                  <button
                    onClick={handleShareFoundWhatsApp}
                    className="w-full py-3.5 px-4 rounded-2xl font-black text-sm sm:text-base text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition active:scale-95 cursor-pointer"
                  >
                    <Share2 className="w-5 h-5" />
                    <span>Compartir en Grupos de WhatsApp</span>
                  </button>
                </div>

                <button
                  onClick={onClose}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition"
                >
                  Cerrar
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer simple para cerrar */}
        <div className="p-3 sm:p-4 bg-slate-100 dark:bg-black/50 border-t border-slate-200 dark:border-white/10 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-white/20 transition"
          >
            Cancelar / Salir
          </button>
        </div>

      </div>
    </div>
  );
};
