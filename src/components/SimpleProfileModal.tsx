import React, { useState, useEffect } from 'react';
import {
  User, Phone, MapPin, CreditCard, Sparkles, CheckCircle2,
  X, Shield, Smartphone, Zap, Sliders, AlertCircle
} from 'lucide-react';
import { loadLocalState, saveLocalState, useLocalState } from '../services/localStore';

export interface PawloUserProfile {
  fullName: string;
  phone: string;
  sector: string;
  addressReference: string;
  preferredPayment: 'QR_Deuna_Sipy_Peigo' | 'Payphone' | 'Transferencia_Bancaria' | 'Efectivo_Contraentrega';
  uiExperienceMode: 'simple' | 'pro'; // 'simple' = Modo Fácil sin jerga técnica; 'pro' = Modo Profesional con 8 roles y consola WebMCP
}

export const USER_PROFILE_STORAGE_KEY = 'pawlo_user_profile_v1';

export const DEFAULT_USER_PROFILE: PawloUserProfile = {
  fullName: 'Nicolás Norton',
  phone: '0998408369',
  sector: 'El Vergel',
  addressReference: 'Calle Larga y Borrero',
  preferredPayment: 'QR_Deuna_Sipy_Peigo',
  uiExperienceMode: 'simple'
};

export const POPULAR_SECTORS_CUENCA = [
  'El Vergel',
  'Yanuncay',
  'El Ejido',
  'Totoracocha',
  'Challuabamba',
  'Baños'
];

/**
 * Carga el perfil del usuario desde localStorage con respaldo seguro.
 */
export function loadUserProfile(): PawloUserProfile {
  return loadLocalState<PawloUserProfile>(USER_PROFILE_STORAGE_KEY, DEFAULT_USER_PROFILE);
}

/**
 * Guarda el perfil del usuario en localStorage y difunde el evento a la app.
 */
export function saveUserProfile(profile: PawloUserProfile): void {
  saveLocalState<PawloUserProfile>(USER_PROFILE_STORAGE_KEY, profile);
}

/**
 * Hook reactivo de React para el perfil de usuario de PAWLO.
 */
export function useUserProfile(): [
  PawloUserProfile,
  (valOrUpdater: PawloUserProfile | ((prev: PawloUserProfile) => PawloUserProfile)) => void
] {
  return useLocalState<PawloUserProfile>(USER_PROFILE_STORAGE_KEY, DEFAULT_USER_PROFILE);
}

export interface SimpleProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme?: 'dark' | 'light';
  onSave?: (profile: PawloUserProfile) => void;
}

export const SimpleProfileModal: React.FC<SimpleProfileModalProps> = ({
  isOpen,
  onClose,
  theme = 'dark',
  onSave
}) => {
  const [profile, setProfile] = useUserProfile();
  const [formData, setFormData] = useState<PawloUserProfile>(profile);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Mantener formulario sincronizado si el perfil cambia externamente
  useEffect(() => {
    if (isOpen) {
      setFormData(profile);
      setSavedSuccess(false);
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(formData);
    saveUserProfile(formData);
    if (onSave) {
      onSave(formData);
    }
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const handleSelectSector = (sec: string) => {
    setFormData(prev => ({ ...prev, sector: sec }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-xl rounded-3xl border shadow-2xl overflow-hidden my-auto ${
          theme === 'dark'
            ? 'bg-[#080E1C] border-white/15 text-slate-100'
            : 'bg-white border-slate-300 text-slate-900 shadow-slate-900/20'
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="profile-modal-title"
      >
        {/* Cabecera Amigable */}
        <div className={`p-6 border-b flex items-start justify-between gap-4 ${
          theme === 'dark' ? 'bg-[#0C152E]/90 border-white/10' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="space-y-1.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full badge-emerald text-xs font-mono font-bold tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Perfil Local Seguro en tu Celular</span>
            </div>
            <h2 id="profile-modal-title" className="text-xl sm:text-2xl font-extrabold flex items-center gap-2">
              <span>👤 Mis Datos para Pedidos en 1 Toque</span>
            </h2>
            <p className={`text-xs sm:text-sm leading-relaxed ${
              theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Guardamos tus datos en tu teléfono para que no tengas que escribirlos cada vez que pidas comida o veterinario.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className={`p-2 rounded-2xl border transition-colors cursor-pointer shrink-0 ${
              theme === 'dark'
                ? 'border-white/10 hover:bg-white/10 text-slate-300'
                : 'border-slate-300 hover:bg-slate-100 text-slate-700'
            }`}
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido del Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {savedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-[#00F5A0] flex items-center gap-3 animate-in fade-in">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <p className="font-bold text-sm">¡Datos guardados con éxito!</p>
                <p className="text-xs opacity-90">Tus próximos pedidos se completarán con 1 solo toque.</p>
              </div>
            </div>
          )}

          {/* Nombre y Apellido */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
              <User className="w-4 h-4 text-emerald-700 dark:text-[#00F5A0]" />
              <span>Nombre y Apellido *</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={e => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Ej. Nicolás Norton"
              className="w-full glass-input rounded-2xl px-4 py-3.5 text-sm sm:text-base font-medium focus:outline-none"
            />
          </div>

          {/* Celular WhatsApp */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Phone className="w-4 h-4 text-emerald-700 dark:text-[#00F5A0]" />
              <span>Celular WhatsApp para Notificaciones *</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ej. 0998408369"
              className="w-full glass-input rounded-2xl px-4 py-3.5 text-sm sm:text-base font-medium focus:outline-none"
            />
            <span className={`text-[11px] block ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Te llegará el tracking del motorizado y recetas validadas por WhatsApp.
            </span>
          </div>

          {/* Barrio / Sector en Cuenca */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 dark:text-[#00F5A0]" />
              <span>Barrio o Sector en Cuenca *</span>
            </label>
            <input
              type="text"
              required
              value={formData.sector}
              onChange={e => setFormData({ ...formData, sector: e.target.value })}
              placeholder="Ej. El Vergel, Yanuncay, Totoracocha..."
              className="w-full glass-input rounded-2xl px-4 py-3.5 text-sm sm:text-base font-medium focus:outline-none"
            />
            
            {/* Chips rápidos de sectores de Cuenca */}
            <div className="pt-1">
              <span className={`text-xs block mb-1.5 font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Sectores rápidos (toca para elegir):
              </span>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SECTORS_CUENCA.map(sec => {
                  const isSelected = formData.sector.toLowerCase() === sec.toLowerCase();
                  return (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => handleSelectSector(sec)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-400'
                          : theme === 'dark'
                          ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
                      }`}
                    >
                      📍 {sec}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Dirección y Referencia */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-700 dark:text-[#00F5A0]" />
              <span>Dirección y Referencia de Entrega *</span>
            </label>
            <input
              type="text"
              required
              value={formData.addressReference}
              onChange={e => setFormData({ ...formData, addressReference: e.target.value })}
              placeholder="Ej. Calle Larga y Borrero, edificio esquinero timbre 3B"
              className="w-full glass-input rounded-2xl px-4 py-3.5 text-sm sm:text-base font-medium focus:outline-none"
            />
          </div>

          {/* Forma de Pago Favorita */}
          <div className="space-y-2">
            <label className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-emerald-700 dark:text-[#00F5A0]" />
              <span>Forma de Pago Favorita</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'QR_Deuna_Sipy_Peigo', title: '📱 QR Instantáneo', subtitle: 'DeUna, Sipy o PeiGo' },
                { id: 'Payphone', title: '💳 Payphone', subtitle: 'Tarjeta Crédito / Débito' },
                { id: 'Transferencia_Bancaria', title: '🏦 Transferencia', subtitle: 'Pichincha, Austro, Guayaquil' },
                { id: 'Efectivo_Contraentrega', title: '💵 Pago en Efectivo', subtitle: 'Pagas al recibir en tu puerta' }
              ].map(opt => {
                const isSelected = formData.preferredPayment === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, preferredPayment: opt.id as any })}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'border-emerald-500 bg-emerald-500/15 shadow-sm ring-1 ring-emerald-500'
                        : theme === 'dark'
                        ? 'bg-[#03060C]/60 border-white/10 hover:border-white/20'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs sm:text-sm">{opt.title}</div>
                      <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {opt.subtitle}
                      </div>
                    </div>
                    {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00F5A0] shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Switch de Nivel de Pantalla */}
          <div className={`p-4 rounded-3xl border space-y-3 ${
            theme === 'dark' ? 'bg-[#03060C]/80 border-white/15' : 'bg-slate-50 border-slate-300'
          }`}>
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono uppercase tracking-wider font-bold flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <span>Nivel de Pantalla (Experiencia de Usuario)</span>
              </label>
              <span className={`text-[11px] font-mono px-2 py-0.5 rounded-lg border ${
                formData.uiExperienceMode === 'simple'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-[#00F5A0] border-emerald-500/30'
                  : 'bg-indigo-500/10 text-indigo-500 border-indigo-500/30'
              }`}>
                {formData.uiExperienceMode === 'simple' ? 'Modo Fácil Activo' : 'Modo Staff Activo'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Opción 1: Modo Fácil */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, uiExperienceMode: 'simple' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.uiExperienceMode === 'simple'
                    ? 'border-emerald-500 bg-emerald-500/15 ring-2 ring-emerald-500/40'
                    : theme === 'dark'
                    ? 'bg-[#060B18] border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>🟢</span> Modo Fácil (Recomendado)
                  </span>
                  {formData.uiExperienceMode === 'simple' && (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00F5A0]" />
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Pantalla limpia, letras claras y botones grandes sin términos técnicos. Ideal para el día a día.
                </p>
              </button>

              {/* Opción 2: Modo Profesional / Staff */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, uiExperienceMode: 'pro' })}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                  formData.uiExperienceMode === 'pro'
                    ? 'border-indigo-500 bg-indigo-500/15 ring-2 ring-indigo-500/40'
                    : theme === 'dark'
                    ? 'bg-[#060B18] border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-sm flex items-center gap-1.5">
                    <span>🛠️</span> Modo Profesional / Staff
                  </span>
                  {formData.uiExperienceMode === 'pro' && (
                    <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                  )}
                </div>
                <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Muestra paneles de Veterinario, Comercio, Admin (8 roles) y consola agéntica WebMCP.
                </p>
              </button>
            </div>
          </div>

          {/* Botones de Acción */}
          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <button
              type="submit"
              className="btn-primary-2026 w-full py-4 px-6 text-sm font-extrabold flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Guardar Mis Datos en Mi Teléfono</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className={`w-full sm:w-auto px-6 py-4 rounded-2xl border text-xs sm:text-sm font-bold transition-colors cursor-pointer ${
                theme === 'dark'
                  ? 'border-white/15 hover:bg-white/10 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-100 text-slate-700'
              }`}
            >
              Cerrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
