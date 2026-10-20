import React, { useState } from 'react';
import {
  Heart,
  ShieldCheck,
  Scale,
  Utensils,
  Syringe,
  FileText,
  ShoppingBag,
  Sparkles,
  PhoneCall,
  Flame,
  AlertTriangle,
  ChevronRight,
  Copy,
  Check,
  Share2,
  X,
  Stethoscope,
  Scissors,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  HelpCircle,
  Calendar,
  AlertCircle,
  Plus,
  BadgeCheck,
  Clock,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { UserPet } from '../data/pawloData';

export interface SimpleUserHomeProps {
  pets: UserPet[];
  selectedPetId: string;
  onSelectPet: (id: string) => void;
  onNavigateTab: (tab: 'my_pets' | 'store' | 'services' | 'alerts' | 'assistant' | 'adoptions' | 'chip_lookup') => void;
  onOpenAssistantWithPrompt: (prompt?: string) => void;
  onOpenQuickSos: (initialType?: 'lost' | 'medical' | 'found') => void;
  onQuickRepeatFoodOrder: (pet: UserPet) => void;
  userName: string;
  cityName: string;
  theme: 'dark' | 'light';
}

export const SimpleUserHome: React.FC<SimpleUserHomeProps> = ({
  pets,
  selectedPetId,
  onSelectPet,
  onNavigateTab,
  onOpenAssistantWithPrompt,
  onOpenQuickSos,
  onQuickRepeatFoodOrder,
  userName,
  cityName,
  theme
}) => {
  const [showBigCarnet, setShowBigCarnet] = useState(false);
  const [copiedChip, setCopiedChip] = useState(false);
  const [repeatOrderNotice, setRepeatOrderNotice] = useState<string | null>(null);

  // Mascota activa con resguardo defensivo
  const activePet: UserPet = pets.find(p => p.id === selectedPetId) || pets[0] || {
    id: 'pet-default',
    name: 'Mi Mascota',
    species: 'canine',
    breed: 'Mestizo de Familia',
    gender: 'Macho',
    isSterilized: true,
    birthDate: '2023-01-01',
    ageLabel: '2 años',
    weightKg: 20.0,
    targetWeightKg: 20.0,
    coatColor: 'Dorado',
    microchipIso: '981098104592831',
    bloodType: 'DEA 1.1',
    allergies: [],
    dietBrand: 'Alimento Equilibrado Premium',
    dailyRationGrams: 350,
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=800&q=80',
    gallery: [],
    vaccines: [],
    clinicalHistory: [],
    notes: []
  };

  // Cálculo de ración y división diaria
  const dailyGrams = activePet.dailyRationGrams && activePet.dailyRationGrams > 0
    ? activePet.dailyRationGrams
    : Math.round(activePet.weightKg * 12);
  const morningGrams = Math.round(dailyGrams / 2);
  const eveningGrams = dailyGrams - morningGrams;

  // Estado amigable de vacunas
  const hasVaccines = activePet.vaccines && activePet.vaccines.length > 0;
  const expiredVaccines = activePet.vaccines?.filter(v => v.status === 'vencido') || [];
  const upcomingVaccine = activePet.vaccines?.find(v => v.status === 'proximo');
  
  let vaccineStatusText = '✅ Vacunas al día (Protegido)';
  let vaccineStatusBadge = 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
  if (expiredVaccines.length > 0) {
    vaccineStatusText = `⚠️ Requiere vacuna: ${expiredVaccines[0].name}`;
    vaccineStatusBadge = 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
  } else if (upcomingVaccine) {
    vaccineStatusText = `🗓️ Próxima vacuna: ${upcomingVaccine.name} (${upcomingVaccine.nextDueDate || 'Pronto'})`;
    vaccineStatusBadge = 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30';
  }

  // Copiar Microchip con confirmación
  const handleCopyChip = () => {
    const chipNum = activePet.microchipIso || 'No registrado';
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(chipNum).then(() => {
        setCopiedChip(true);
        setTimeout(() => setCopiedChip(false), 2500);
      }).catch(() => {
        setCopiedChip(true);
        setTimeout(() => setCopiedChip(false), 2500);
      });
    } else {
      setCopiedChip(true);
      setTimeout(() => setCopiedChip(false), 2500);
    }
  };

  // Enviar Carnet completo por WhatsApp
  const handleShareCarnetWhatsApp = () => {
    const speciesLabel = activePet.species === 'canine' ? 'Perro 🐕' : 'Gato 🐈';
    const allergiesList = activePet.allergies && activePet.allergies.length > 0
      ? activePet.allergies.join(', ')
      : 'Sin alergias conocidas';
    const lastVaccine = activePet.vaccines?.[0] 
      ? `${activePet.vaccines[0].name} (${activePet.vaccines[0].appliedDate})`
      : 'Al día';

    const text = `🪪 *CARNET DIGITAL OFICIAL PAWLO™*\n` +
      `🐾 *Mascota:* ${activePet.name} (${speciesLabel})\n` +
      `📋 *Raza:* ${activePet.breed}\n` +
      `🎂 *Edad:* ${activePet.ageLabel} | *Sexo:* ${activePet.gender}\n` +
      `⚖️ *Peso:* ${activePet.weightKg} kg\n` +
      `🛡️ *Esterilizado:* ${activePet.isSterilized ? 'Sí' : 'No'}\n` +
      `🔢 *Microchip ISO:* ${activePet.microchipIso || 'No registrado'}\n` +
      `🚨 *Alergias:* ${allergiesList}\n` +
      `💉 *Última vacuna:* ${lastVaccine}\n` +
      `🥣 *Alimentación:* ${activePet.dietBrand || 'Balanceado'} (${dailyGrams}g al día)\n\n` +
      `📍 _Ficha verificada en la Red Pawlo™ ${cityName}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Acción rápida de repetir comida con feedback visual
  const handleRepeatOrder = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickRepeatFoodOrder(activePet);
    setRepeatOrderNotice(`¡Pedido de ${activePet.dietBrand || 'comida habitual'} preparado para ${activePet.name}!`);
    setTimeout(() => setRepeatOrderNotice(null), 3500);
  };

  return (
    <div className={`w-full max-w-5xl mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-6 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}`}>
      
      {/* ============================================================ */}
      {/* 1. WARM, HUMAN HEADER & PET SWITCHER PILLS                   */}
      {/* ============================================================ */}
      <section className="space-y-4">
        {/* Saludo humano */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mb-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>{cityName}, Ecuador • Red Pawlo Activa</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              ¡Hola{userName ? `, ${userName}` : ''}! 👋
            </h1>
            <p className={`text-base sm:text-lg font-medium ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              ¿Cómo cuidamos hoy a <span className="font-bold text-emerald-500 dark:text-emerald-400 underline decoration-emerald-500/40 decoration-2 underline-offset-4">{activePet.name}</span>?
            </p>
          </div>

          {/* Botón rápido SOS en cabecera */}
          <button
            onClick={() => onOpenQuickSos('lost')}
            className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 transition shadow-sm active:scale-95"
            title="Presionar en caso de pérdida o urgencia"
          >
            <Flame className="w-4 h-4 text-rose-500 animate-pulse" />
            <span>Botón de Emergencia SOS</span>
          </button>
        </div>

        {/* Pet Switcher: Pills grandes y fáciles de tocar */}
        {pets && pets.length > 0 && (
          <div className="space-y-1.5">
            <span className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Selecciona a tu mascota:
            </span>
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none pt-1">
              {pets.map(pet => {
                const isSelected = pet.id === activePet.id;
                return (
                  <button
                    key={pet.id}
                    onClick={() => onSelectPet(pet.id)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border transition-all duration-200 shrink-0 select-none ${
                      isSelected
                        ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/25 scale-[1.02]'
                        : theme === 'dark'
                          ? 'bg-[#080E1C] border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/5'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    <div className="relative">
                      <img
                        src={pet.avatar || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=400&q=80'}
                        alt={pet.name}
                        className={`w-12 h-12 rounded-full object-cover border-2 ${
                          isSelected ? 'border-white' : 'border-slate-300 dark:border-slate-700'
                        }`}
                      />
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {pet.species === 'canine' ? '🐶' : '🐱'}
                      </span>
                    </div>
                    <div className="text-left pr-2">
                      <div className="font-bold text-sm sm:text-base leading-tight">
                        {pet.name}
                      </div>
                      <div className={`text-xs ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                        {pet.breed.split(' ')[0]}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle2 className="w-5 h-5 text-white ml-1" />
                    )}
                  </button>
                );
              })}

              {/* Botón para registrar otra mascota */}
              <button
                onClick={() => onNavigateTab('my_pets')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-dashed transition-all shrink-0 text-xs sm:text-sm font-semibold ${
                  theme === 'dark'
                    ? 'border-white/20 text-slate-400 hover:text-white hover:border-white/40 bg-white/5'
                    : 'border-slate-300 text-slate-600 hover:text-slate-900 hover:border-slate-400 bg-slate-50'
                }`}
              >
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Agregar otra mascota</span>
              </button>
            </div>
          </div>
        )}

        {/* Tarjeta Resumen Principal de la Mascota Activa */}
        <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
          theme === 'dark'
            ? 'bg-[#080E1C] border-white/10 shadow-xl'
            : 'bg-white border-slate-200/80 shadow-md shadow-slate-100'
        }`}>
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            
            {/* Foto e información clave */}
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                <img
                  src={activePet.avatar}
                  alt={activePet.name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-emerald-500/50 shadow-md"
                />
                <span className="absolute -top-1.5 -left-1.5 text-base sm:text-lg bg-white dark:bg-slate-900 rounded-full p-0.5 shadow">
                  {activePet.species === 'canine' ? '🐶' : '🐱'}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                    {activePet.name}
                  </h2>
                  <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300">
                    {activePet.ageLabel}
                  </span>
                  {activePet.isSterilized && (
                    <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      Esterilizado/a
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  {activePet.breed} • {activePet.coatColor || 'Color característico'}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                  <span>Microchip:</span>
                  <span className="font-mono font-medium text-slate-600 dark:text-slate-300">
                    {activePet.microchipIso ? `${activePet.microchipIso.slice(0, 7)}...` : 'Sin chip'}
                  </span>
                </div>
              </div>
            </div>

            {/* Botón Prominente: Ver Carnet Grande para el Veterinario */}
            <button
              onClick={() => setShowBigCarnet(true)}
              className="w-full md:w-auto flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl font-black text-sm sm:text-base text-white bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 active:scale-95 shadow-lg shadow-emerald-500/25 transition cursor-pointer"
            >
              <span className="text-xl">🪪</span>
              <span>Ver Carnet Grande (Para mostrar en la veterinaria)</span>
              <ChevronRight className="w-5 h-5 text-white/80" />
            </button>
          </div>

          {/* 3 Métricas claras en lenguaje sencillo */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-200/60 dark:border-white/10">
            
            {/* 1. Vacunas */}
            <div className={`p-3 rounded-2xl border ${vaccineStatusBadge} flex items-start gap-2.5`}>
              <Syringe className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider opacity-80">
                  Salud & Vacunas
                </div>
                <div className="text-sm font-extrabold leading-snug">
                  {vaccineStatusText}
                </div>
                <div className="text-xs opacity-80 mt-0.5">
                  {hasVaccines ? `${activePet.vaccines.length} registros oficiales` : 'Sin vacunas cargadas'}
                </div>
              </div>
            </div>

            {/* 2. Peso actual */}
            <div className={`p-3 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            } flex items-start gap-2.5`}>
              <Scale className="w-5 h-5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Peso Actual
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  ⚖️ {activePet.weightKg} kg
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  {activePet.targetWeightKg 
                    ? `Peso meta: ${activePet.targetWeightKg} kg • Saludable` 
                    : 'Control al día'}
                </div>
              </div>
            </div>

            {/* 3. Comida recomendada hoy */}
            <div className={`p-3 rounded-2xl border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
            } flex items-start gap-2.5`}>
              <Utensils className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Comida recomendada hoy
                </div>
                <div className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                  🥣 {dailyGrams} g al día
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {morningGrams}g mañana • {eveningGrams}g noche
                </div>
              </div>
            </div>

          </div>

          {/* Feedback temporal de pedido repetido */}
          {repeatOrderNotice && (
            <div className="mt-3 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{repeatOrderNotice}</span>
            </div>
          )}
        </div>
      </section>

      {/* ============================================================ */}
      {/* 2. 4 GIANT, EFFORTLESS ACTION CARDS (PLAIN SPANISH)          */}
      {/* ============================================================ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
            Acciones Rápidas
          </h2>
          <span className={`text-xs font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            Toca cualquiera en 1 toque
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1: 🪪 Ficha, Vacunas y Recetas */}
          <div
            onClick={() => onNavigateTab('my_pets')}
            className={`group p-5 rounded-3xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden active:scale-[0.99] ${
              theme === 'dark'
                ? 'bg-[#080E1C] border-white/10 hover:border-emerald-500/50 hover:bg-[#0c1428]'
                : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-lg shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                🪪
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black group-hover:text-emerald-500 transition-colors">
                    Ficha, Vacunas y Recetas
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Bóveda
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Guarda fotos, vacunas, peso y notas de tu mascota. Siempre a mano y sin papeles perdidos.
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-emerald-500 pt-1">
                  <span>Abrir bóveda médica</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: 🦴 Pedir Comida o Medicina */}
          <div
            onClick={() => onNavigateTab('store')}
            className={`group p-5 rounded-3xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden active:scale-[0.99] ${
              theme === 'dark'
                ? 'bg-[#080E1C] border-white/10 hover:border-amber-500/50 hover:bg-[#0c1428]'
                : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-lg shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                🦴
              </div>
              <div className="space-y-2 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black group-hover:text-amber-500 transition-colors">
                    Pedir Comida o Medicina
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    A Domicilio
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Te lo llevamos a casa. Paga con QR DeUna, Sipy, Peigo o Payphone sin complicaciones.
                </p>
                
                {/* 1-Tap Sub-botón de repetir comida favorita */}
                <div className="pt-1">
                  <button
                    onClick={handleRepeatOrder}
                    className="w-full flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-amber-500/15 hover:bg-amber-500/25 text-amber-600 dark:text-amber-400 border border-amber-500/30 transition shadow-sm active:scale-95"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>🔁 Repetir comida favorita de {activePet.name} en 1 toque</span>
                  </button>
                  <div className="text-[11px] text-center text-slate-400 mt-1">
                    {activePet.dietBrand || 'Fórmula diaria recomendada'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 3: 🛁 Veterinario, Baño, Paseo u Hotel */}
          <div
            onClick={() => onNavigateTab('services')}
            className={`group p-5 rounded-3xl border transition-all duration-200 cursor-pointer text-left relative overflow-hidden active:scale-[0.99] ${
              theme === 'dark'
                ? 'bg-[#080E1C] border-white/10 hover:border-sky-500/50 hover:bg-[#0c1428]'
                : 'bg-white border-slate-200 hover:border-sky-400 hover:shadow-lg shadow-sm'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform">
                🛁
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black group-hover:text-sky-500 transition-colors">
                    Veterinario, Baño, Paseo u Hotel
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400">
                    WhatsApp
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Agenda en 2 toques directo por WhatsApp con cuidadores, peluquerías y clínicas verificadas.
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-sky-500 pt-1">
                  <span>Ver profesionales de {cityName}</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: 🚨 ¡Se Perdió mi Mascota! / Emergencia */}
          <div
            onClick={() => onOpenQuickSos('lost')}
            className={`group p-5 rounded-3xl border-2 transition-all duration-200 cursor-pointer text-left relative overflow-hidden active:scale-[0.99] ${
              theme === 'dark'
                ? 'bg-gradient-to-br from-rose-950/40 to-[#080E1C] border-rose-500/40 hover:border-rose-400 hover:shadow-rose-950/50'
                : 'bg-gradient-to-br from-rose-50 to-white border-rose-300 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-100'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 text-rose-500 flex items-center justify-center text-3xl shrink-0 group-hover:scale-110 transition-transform shadow-inner">
                🚨
              </div>
              <div className="space-y-1.5 flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-black text-rose-600 dark:text-rose-400 group-hover:underline">
                    ¡Se Perdió mi Mascota! / Emergencia
                  </h3>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500 text-white animate-pulse">
                    SOS 24h
                  </span>
                </div>
                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Avisar a vecinos cercanos o pedir ayuda urgente 24h. Sin formularios difíciles.
                </p>
                <div className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 pt-1">
                  <span>Abrir botón de ayuda inmediata</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ============================================================ */}
      {/* 3. 1-TAP "PREGÚNTALE A PAWLO" HELPER BANNER                   */}
      {/* ============================================================ */}
      <section className={`p-5 sm:p-6 rounded-3xl border ${
        theme === 'dark'
          ? 'bg-gradient-to-r from-indigo-950/30 via-[#080E1C] to-emerald-950/20 border-indigo-500/30'
          : 'bg-gradient-to-r from-indigo-50 via-white to-emerald-50 border-indigo-200 shadow-md'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-2xl shrink-0">
              🤖
            </div>
            <div>
              <h3 className="text-lg font-extrabold flex items-center gap-2">
                <span>¿Tienes una duda sobre {activePet.name}?</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 uppercase">
                  Pawlo IA
                </span>
              </h3>
              <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Toca cualquier pregunta. Te responderé en palabras sencillas con su historial clínico:
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenAssistantWithPrompt()}
            className="self-start md:self-center text-xs font-bold px-3 py-1.5 rounded-xl border border-indigo-500/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 transition"
          >
            Abrir chat completo
          </button>
        </div>

        {/* Botones de preguntas predefinidas en lenguaje sencillo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            onClick={() => onOpenAssistantWithPrompt(`¿Cuánto debe comer hoy ${activePet.name}?`)}
            className={`p-3 rounded-2xl border text-left transition font-semibold text-xs sm:text-sm flex items-center gap-2 active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 hover:border-indigo-400 hover:bg-white/10 text-slate-200'
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 shadow-sm'
            }`}
          >
            <span className="text-lg">💬</span>
            <span className="line-clamp-2">¿Cuánto debe comer hoy?</span>
          </button>

          <button
            onClick={() => onOpenAssistantWithPrompt(`Mi mascota ${activePet.name} no quiere comer, ¿qué primeros pasos me recomiendas?`)}
            className={`p-3 rounded-2xl border text-left transition font-semibold text-xs sm:text-sm flex items-center gap-2 active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 hover:border-indigo-400 hover:bg-white/10 text-slate-200'
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 shadow-sm'
            }`}
          >
            <span className="text-lg">💬</span>
            <span className="line-clamp-2">No quiere comer, ¿qué hago?</span>
          </button>

          <button
            onClick={() => onOpenAssistantWithPrompt(`Quiero registrar una nueva vacuna para ${activePet.name}`)}
            className={`p-3 rounded-2xl border text-left transition font-semibold text-xs sm:text-sm flex items-center gap-2 active:scale-95 ${
              theme === 'dark'
                ? 'bg-white/5 border-white/10 hover:border-indigo-400 hover:bg-white/10 text-slate-200'
                : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 shadow-sm'
            }`}
          >
            <span className="text-lg">💬</span>
            <span className="line-clamp-2">Anotar una vacuna nueva</span>
          </button>
        </div>
      </section>

      {/* ============================================================ */}
      {/* 4. MODAL / FULLSCREEN CARD: MOSTRAR CARNET AL VETERINARIO     */}
      {/* ============================================================ */}
      {showBigCarnet && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
          <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden transition-all my-auto ${
            theme === 'dark'
              ? 'bg-[#03060C] border-white/20 text-white'
              : 'bg-white border-slate-300 text-slate-900'
          }`}>
            
            {/* Header del Carnet */}
            <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/15 flex items-center justify-between bg-emerald-500/10">
              <div className="flex items-center gap-2.5">
                <span className="text-2xl">🪪</span>
                <div>
                  <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight">
                    Carnet Digital Oficial
                  </h3>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
                    PAWLO™ Red Veterinaria • {cityName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBigCarnet(false)}
                className="w-10 h-10 rounded-full bg-slate-200/60 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 flex items-center justify-center transition"
                title="Cerrar Carnet"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenido ultra legible del Carnet */}
            <div className="p-5 sm:p-7 space-y-6 max-h-[78vh] overflow-y-auto">
              
              {/* Foto, Nombre, Raza, Edad y Peso */}
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
                <img
                  src={activePet.avatar}
                  alt={activePet.name}
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-emerald-500 shadow-xl"
                />
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <h2 className="text-3xl sm:text-4xl font-black">
                      {activePet.name}
                    </h2>
                    <span className="text-xl">
                      {activePet.species === 'canine' ? '🐶' : '🐱'}
                    </span>
                  </div>
                  <p className="text-base sm:text-lg font-bold text-slate-600 dark:text-slate-300">
                    {activePet.breed} • {activePet.gender}
                  </p>
                  
                  {/* Badges de Información básica */}
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                    <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-slate-100 dark:bg-white/10">
                      🎂 {activePet.ageLabel}
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-sky-500/15 text-sky-600 dark:text-sky-300">
                      ⚖️ {activePet.weightKg} kg
                    </span>
                    <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-300">
                      🛡️ {activePet.isSterilized ? 'Esterilizado' : 'Entero'}
                    </span>
                    {activePet.bloodType && (
                      <span className="px-3 py-1 rounded-xl text-xs sm:text-sm font-bold bg-purple-500/15 text-purple-600 dark:text-purple-300">
                        🩸 {activePet.bloodType}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 🚨 ALERGIAS IMPORTANTES */}
              <div className="rounded-2xl border-2 border-rose-500/50 bg-rose-500/10 p-4 space-y-2">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-black text-sm sm:text-base">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <span>ALERGIAS Y ADVERTENCIAS CLÍNICAS IMPORTANTES:</span>
                </div>
                {activePet.allergies && activePet.allergies.length > 0 ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      {activePet.allergies.map((allergy, idx) => (
                        <span
                          key={idx}
                          className="px-3.5 py-1.5 rounded-xl font-black text-sm bg-rose-600 text-white shadow-sm"
                        >
                          ⚠️ {allergy}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                      * Informar de inmediato al veterinario tratante antes de inyectar antibióticos, anestesia o recetar dieta.
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Sin alergias reportadas en el expediente clínico.</span>
                  </div>
                )}
              </div>

              {/* 💉 ÚLTIMAS VACUNAS APLICADAS */}
              <div className="space-y-3">
                <h4 className="text-sm sm:text-base font-black flex items-center gap-2 text-slate-800 dark:text-slate-200">
                  <Syringe className="w-4 h-4 text-emerald-500" />
                  <span>Últimas vacunas registradas</span>
                </h4>
                {hasVaccines ? (
                  <div className="space-y-2">
                    {activePet.vaccines.map(vac => (
                      <div
                        key={vac.id}
                        className={`p-3.5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                          vac.status === 'vencido'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <div>
                          <div className="font-extrabold text-sm sm:text-base leading-snug">
                            💉 {vac.name}
                          </div>
                          <div className="text-xs text-slate-400">
                            Aplicada: <span className="font-semibold text-slate-700 dark:text-slate-300">{vac.appliedDate}</span> • Lote: {vac.batch || 'N/A'}
                          </div>
                          <div className="text-xs text-slate-400">
                            {vac.clinic} • {vac.vetName}
                          </div>
                        </div>
                        <div className="text-left sm:text-right shrink-0">
                          <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold ${
                            vac.status === 'vigente'
                              ? 'bg-emerald-500/20 text-emerald-500'
                              : 'bg-amber-500/20 text-amber-500'
                          }`}>
                            {vac.status === 'vigente' ? '✅ Al día' : '⚠️ Refuerzo pendiente'}
                          </span>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Próxima: {vac.nextDueDate}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs sm:text-sm text-slate-400 italic">
                    Aún no hay vacunas registradas para {activePet.name}.
                  </p>
                )}
              </div>

              {/* 🔢 NÚMERO DE MICROCHIP ISO */}
              <div className={`p-4 rounded-2xl border space-y-3 ${
                theme === 'dark' ? 'bg-white/5 border-white/15' : 'bg-slate-50 border-slate-300'
              }`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                      Microchip Identificador ISO 11784/11785
                    </span>
                    <div className="text-xl sm:text-2xl font-mono font-black tracking-wider text-emerald-500">
                      {activePet.microchipIso || 'Sin Microchip Registrado'}
                    </div>
                  </div>

                  {/* Botón 1-tap Copiar Número */}
                  {activePet.microchipIso && (
                    <button
                      onClick={handleCopyChip}
                      className="self-start sm:self-center flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 transition active:scale-95 cursor-pointer"
                    >
                      {copiedChip ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" />
                          <span>¡Copiado!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copiar Número</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {/* Botón 1-tap Enviar Carnet por WhatsApp */}
                <button
                  onClick={handleShareCarnetWhatsApp}
                  className="w-full flex items-center justify-center gap-2.5 px-4 py-3 rounded-2xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar Carnet por WhatsApp al Veterinario</span>
                </button>
              </div>

            </div>

            {/* Footer con botón grande para cerrar */}
            <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-white/15 bg-slate-50 dark:bg-black/40 flex justify-end">
              <button
                onClick={() => setShowBigCarnet(false)}
                className="w-full sm:w-auto px-6 py-3 rounded-2xl font-black text-sm bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 text-slate-800 dark:text-white transition active:scale-95"
              >
                Volver a Pantalla Principal
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
