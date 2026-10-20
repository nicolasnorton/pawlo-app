import React, { useState } from 'react';
import {
  ShieldCheck, PlusCircle, FileText, Syringe, Camera, StickyNote,
  Scale, Calendar, Fingerprint, Heart, AlertCircle, ShoppingBag,
  Sparkles, CheckCircle2, Clock, Award, Plus, Trash2
} from 'lucide-react';
import { UserPet, VaccineRecord, ClinicalEntry, PetNote } from '../data/pawloData';

interface MyPetsVaultProps {
  pets: UserPet[];
  selectedPetId: string;
  onSelectPet: (id: string) => void;
  onAddPet: (newPet: UserPet) => void;
  onAddNote: (petId: string, note: PetNote) => void;
  onAddVaccine: (petId: string, vaccine: VaccineRecord) => void;
  onAddClinicalRecord: (petId: string, record: ClinicalEntry) => void;
  onAddPhoto: (petId: string, photo: { url: string; caption: string; date: string }) => void;
  onUpdateWeight: (petId: string, newWeight: number) => void;
  onNavigateToStore: (category?: string) => void;
  onNavigateToServices: (category?: string) => void;
  cityName: string;
  theme: 'dark' | 'light';
}

export const MyPetsVault: React.FC<MyPetsVaultProps> = ({
  pets,
  selectedPetId,
  onSelectPet,
  onAddPet,
  onAddNote,
  onAddVaccine,
  onAddClinicalRecord,
  onAddPhoto,
  onUpdateWeight,
  onNavigateToStore,
  onNavigateToServices,
  cityName,
  theme
}) => {
  const activePet = pets.find(p => p.id === selectedPetId) || pets[0];
  const [dossierTab, setDossierTab] = useState<'carnet' | 'historia' | 'fotos' | 'notas'>('carnet');

  // Modales / Formularios rápidos
  const [showNewPetModal, setShowNewPetModal] = useState(false);
  const [showNewNoteForm, setShowNewNoteForm] = useState(false);
  const [showNewVaccineForm, setShowNewVaccineForm] = useState(false);
  const [showNewClinicalForm, setShowNewClinicalForm] = useState(false);
  const [showNewPhotoForm, setShowNewPhotoForm] = useState(false);
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightInput, setWeightInput] = useState(activePet.weightKg.toString());

  // Estado para nueva mascota
  const [newPetForm, setNewPetForm] = useState({
    name: '',
    species: 'canine' as 'canine' | 'feline',
    breed: '',
    gender: 'Macho' as 'Macho' | 'Hembra',
    ageLabel: '',
    weightKg: '',
    microchipIso: '',
    allergies: '',
    dietBrand: '',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'
  });

  // Estado para nueva nota
  const [noteForm, setNoteForm] = useState({
    category: 'Cuidado Diario' as PetNote['category'],
    title: '',
    content: ''
  });

  // Estado para nueva vacuna
  const [vaccineForm, setVaccineForm] = useState({
    name: '',
    batch: '',
    appliedDate: '20 Oct 2026',
    nextDueDate: '20 Oct 2027',
    clinic: 'Hospital Veterinario El Paraíso',
    vetName: 'Dr. Esteban Cordero'
  });

  // Estado para nuevo registro clínico
  const [clinicalForm, setClinicalForm] = useState({
    type: 'Consulta General' as ClinicalEntry['type'],
    title: '',
    diagnosis: '',
    treatment: '',
    weightKg: activePet.weightKg.toString(),
    tempC: '38.5',
    clinic: 'Hospital Veterinario El Paraíso',
    vetName: 'Dr. Esteban Cordero'
  });

  // Estado para nueva foto
  const [photoForm, setPhotoForm] = useState({
    url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
    caption: ''
  });

  const handleCreatePet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPetForm.name.trim()) return;
    const weightNum = parseFloat(newPetForm.weightKg) || 10;
    const created: UserPet = {
      id: `pet-${Date.now()}`,
      name: newPetForm.name.trim(),
      species: newPetForm.species,
      breed: newPetForm.breed.trim() || (newPetForm.species === 'canine' ? 'Mestizo Noble' : 'Felino Doméstico'),
      gender: newPetForm.gender,
      isSterilized: true,
      birthDate: '2024-01-15',
      ageLabel: newPetForm.ageLabel.trim() || '2 años',
      weightKg: weightNum,
      targetWeightKg: weightNum,
      coatColor: 'Tricolor / Natural',
      microchipIso: newPetForm.microchipIso.trim() || '981098199201445',
      bloodType: newPetForm.species === 'canine' ? 'DEA 1.1' : 'Tipo A',
      allergies: newPetForm.allergies ? newPetForm.allergies.split(',').map(s => s.trim()) : ['Sin alergias registradas'],
      dietBrand: newPetForm.dietBrand.trim() || 'Nutrición Balanceada Super Premium',
      dailyRationGrams: Math.round(weightNum * 14),
      avatar: newPetForm.avatar,
      gallery: [
        {
          url: newPetForm.avatar,
          caption: `Primera foto oficial de ${newPetForm.name} en PAWLO`,
          date: 'Hoy'
        }
      ],
      vaccines: [
        {
          id: `vac-${Date.now()}`,
          name: newPetForm.species === 'canine' ? 'Polivalente Séxtuple Canina' : 'Triple Felina',
          batch: 'PWL-2026-V1',
          appliedDate: '10 Oct 2026',
          nextDueDate: '10 Oct 2027',
          clinic: `Clínica Verificada ${cityName}`,
          vetName: 'Médico Veterinario Colegiado',
          status: 'vigente'
        }
      ],
      clinicalHistory: [
        {
          id: `clin-${Date.now()}`,
          date: '20 Oct 2026',
          type: 'Consulta General',
          title: 'Apertura de Expediente Digital en Bóveda PAWLO',
          diagnosis: 'Mascota registrada con signos vitales estables y condición corporal saludable.',
          treatment: 'Continuar plan nutricional y calendario de medicina preventiva.',
          weightKg: weightNum,
          tempC: 38.4,
          clinic: `Red Clínica PAWLO ${cityName}`,
          vetName: 'Sistema de Admisión Digital'
        }
      ],
      notes: [
        {
          id: `note-${Date.now()}`,
          category: 'Cuidado Diario',
          title: 'Ficha inicial creada',
          content: `Perfil configurado para ${newPetForm.name}. Aquí puedes centralizar recetas, notas de dieta y recordatorios.`,
          updatedAt: 'Ahora mismo'
        }
      ]
    };

    onAddPet(created);
    onSelectPet(created.id);
    setShowNewPetModal(false);
    setNewPetForm({
      name: '',
      species: 'canine',
      breed: '',
      gender: 'Macho',
      ageLabel: '',
      weightKg: '',
      microchipIso: '',
      allergies: '',
      dietBrand: '',
      avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=800&q=80'
    });
  };

  const handleSaveNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteForm.title.trim() || !noteForm.content.trim()) return;
    onAddNote(activePet.id, {
      id: `note-${Date.now()}`,
      category: noteForm.category,
      title: noteForm.title.trim(),
      content: noteForm.content.trim(),
      updatedAt: 'Hace un momento'
    });
    setNoteForm({ category: 'Cuidado Diario', title: '', content: '' });
    setShowNewNoteForm(false);
  };

  const handleSaveVaccine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!vaccineForm.name.trim()) return;
    onAddVaccine(activePet.id, {
      id: `vac-${Date.now()}`,
      name: vaccineForm.name.trim(),
      batch: vaccineForm.batch.trim() || 'LOT-2026-OK',
      appliedDate: vaccineForm.appliedDate,
      nextDueDate: vaccineForm.nextDueDate,
      clinic: vaccineForm.clinic,
      vetName: vaccineForm.vetName,
      status: 'vigente'
    });
    setVaccineForm({
      name: '',
      batch: '',
      appliedDate: '20 Oct 2026',
      nextDueDate: '20 Oct 2027',
      clinic: 'Hospital Veterinario El Paraíso',
      vetName: 'Dr. Esteban Cordero'
    });
    setShowNewVaccineForm(false);
  };

  const handleSaveClinical = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clinicalForm.title.trim() || !clinicalForm.diagnosis.trim()) return;
    onAddClinicalRecord(activePet.id, {
      id: `clin-${Date.now()}`,
      date: '20 Oct 2026',
      type: clinicalForm.type,
      title: clinicalForm.title.trim(),
      diagnosis: clinicalForm.diagnosis.trim(),
      treatment: clinicalForm.treatment.trim() || 'Observación y control periódico.',
      weightKg: parseFloat(clinicalForm.weightKg) || activePet.weightKg,
      tempC: parseFloat(clinicalForm.tempC) || 38.5,
      clinic: clinicalForm.clinic,
      vetName: clinicalForm.vetName
    });
    setClinicalForm({
      type: 'Consulta General',
      title: '',
      diagnosis: '',
      treatment: '',
      weightKg: activePet.weightKg.toString(),
      tempC: '38.5',
      clinic: 'Hospital Veterinario El Paraíso',
      vetName: 'Dr. Esteban Cordero'
    });
    setShowNewClinicalForm(false);
  };

  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!photoForm.url.trim()) return;
    onAddPhoto(activePet.id, {
      url: photoForm.url.trim(),
      caption: photoForm.caption.trim() || `Recuerdo de ${activePet.name}`,
      date: '20 Oct 2026'
    });
    setPhotoForm({
      url: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?auto=format&fit=crop&w=800&q=80',
      caption: ''
    });
    setShowNewPhotoForm(false);
  };

  return (
    <section className="space-y-6">
      {/* BARRA SUPERIOR DE SELECCIÓN DE MASCOTAS DEL USUARIO */}
      <div className="glass-panel rounded-3xl p-5 sm:p-7 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="space-y-1.5">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full badge-emerald text-xs font-mono font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            <span>BÓVEDA BIOMÉTRICA PERSONAL • MIS MASCOTAS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Espacio Integral de tus Mascotas
          </h2>
          <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            Centraliza carnets de vacunación, historia clínica, control de peso, edad, fotos, notas y compras personalizadas para cada miembro de tu familia.
          </p>
        </div>

        {/* Selector de Mascotas + Botón Añadir */}
        <div className="flex flex-wrap items-center gap-3">
          {pets.map(pet => {
            const isSelected = pet.id === activePet.id;
            return (
              <button
                key={pet.id}
                onClick={() => {
                  onSelectPet(pet.id);
                  setWeightInput(pet.weightKg.toString());
                }}
                className={`flex items-center space-x-3 px-4 py-2.5 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? (theme === 'dark'
                        ? 'bg-[#00F5A0]/20 border-[#00F5A0] text-white shadow-lg shadow-[#00F5A0]/10'
                        : 'bg-emerald-600 border-emerald-700 text-white shadow-md')
                    : (theme === 'dark'
                        ? 'bg-white/5 border-white/15 text-slate-200 hover:bg-white/10'
                        : 'bg-white border-slate-300 text-slate-900 hover:bg-slate-100')
                }`}
              >
                <img
                  src={pet.avatar}
                  alt={pet.name}
                  className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0"
                />
                <div className="text-left">
                  <div className="font-extrabold text-sm sm:text-base leading-tight flex items-center gap-1.5">
                    <span>{pet.name}</span>
                    <span className="text-xs opacity-80">({pet.species === 'canine' ? '🐕' : '🐈'})</span>
                  </div>
                  <div className={`text-xs font-mono ${isSelected ? 'text-white/90 dark:text-[#00F5A0]' : 'opacity-75'}`}>
                    {pet.weightKg} kg • {pet.ageLabel.split(',')[0]}
                  </div>
                </div>
              </button>
            );
          })}

          <button
            onClick={() => setShowNewPetModal(true)}
            className={`flex items-center space-x-2 px-4 py-3.5 rounded-2xl border border-dashed font-bold text-xs sm:text-sm transition cursor-pointer ${
              theme === 'dark'
                ? 'border-[#00F5A0]/50 text-[#00F5A0] hover:bg-[#00F5A0]/10'
                : 'border-emerald-600 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            <PlusCircle className="w-4 h-4 stroke-[2.5]" />
            <span>Añadir Mascota</span>
          </button>
        </div>
      </div>

      {/* MODAL PARA REGISTRAR NUEVA MASCOTA */}
      {showNewPetModal && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 space-y-5">
          <div className="flex items-center justify-between border-b pb-4 border-slate-300 dark:border-white/10">
            <div>
              <span className="text-xs font-mono uppercase font-bold text-emerald-700 dark:text-[#00F5A0]">
                NUEVO EXPEDIENTE DIGITAL PAWLO
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">Registrar Nueva Mascota en tu Bóveda</h3>
            </div>
            <button
              onClick={() => setShowNewPetModal(false)}
              className="text-sm font-bold px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 cursor-pointer"
            >
              Cerrar ✕
            </button>
          </div>

          <form onSubmit={handleCreatePet} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs sm:text-sm">
            <div>
              <label className="font-bold block mb-1">Nombre de tu Mascota *</label>
              <input
                type="text"
                required
                placeholder="Ej. Thor, Kira, Simba..."
                value={newPetForm.name}
                onChange={e => setNewPetForm({ ...newPetForm, name: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Especie *</label>
              <select
                value={newPetForm.species}
                onChange={e => setNewPetForm({ ...newPetForm, species: e.target.value as 'canine' | 'feline' })}
                className="w-full glass-input rounded-xl px-4 py-3"
              >
                <option value="canine">Canino (Perro)</option>
                <option value="feline">Felino (Gato)</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Raza o Mestizaje *</label>
              <input
                type="text"
                required
                placeholder="Ej. Husky Siberiano / Mestizo"
                value={newPetForm.breed}
                onChange={e => setNewPetForm({ ...newPetForm, breed: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Edad Actual *</label>
              <input
                type="text"
                required
                placeholder="Ej. 1 año, 8 meses"
                value={newPetForm.ageLabel}
                onChange={e => setNewPetForm({ ...newPetForm, ageLabel: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Peso Actual (kg) *</label>
              <input
                type="number"
                step="0.1"
                required
                placeholder="Ej. 14.5"
                value={newPetForm.weightKg}
                onChange={e => setNewPetForm({ ...newPetForm, weightKg: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Sexo</label>
              <select
                value={newPetForm.gender}
                onChange={e => setNewPetForm({ ...newPetForm, gender: e.target.value as 'Macho' | 'Hembra' })}
                className="w-full glass-input rounded-xl px-4 py-3"
              >
                <option value="Macho">Macho</option>
                <option value="Hembra">Hembra</option>
              </select>
            </div>
            <div>
              <label className="font-bold block mb-1">Microchip ISO (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. 981098123456789"
                value={newPetForm.microchipIso}
                onChange={e => setNewPetForm({ ...newPetForm, microchipIso: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3 font-mono"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Alimento Actual / Dieta</label>
              <input
                type="text"
                placeholder="Ej. Croquetas Cordero & Arroz"
                value={newPetForm.dietBrand}
                onChange={e => setNewPetForm({ ...newPetForm, dietBrand: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3"
              />
            </div>
            <div>
              <label className="font-bold block mb-1">Alergias o Condiciones</label>
              <input
                type="text"
                placeholder="Ej. Ninguna o Sensibilidad al pollo"
                value={newPetForm.allergies}
                onChange={e => setNewPetForm({ ...newPetForm, allergies: e.target.value })}
                className="w-full glass-input rounded-xl px-4 py-3"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowNewPetModal(false)}
                className="px-5 py-3 rounded-xl border border-slate-300 dark:border-white/15 font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-primary-2026 px-7 py-3 text-xs sm:text-sm font-bold cursor-pointer"
              >
                Guardar Ficha Completa
              </button>
            </div>
          </form>
        </div>
      )}

      {/* FICHA MAESTRA DE LA MASCOTA SELECCIONADA */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA: PASAPORTE BIOMÉTRICO, EDAD, PESO, NUTRICIÓN Y ACCIONES */}
        <div className="lg:col-span-4 space-y-5">
          <div className="glass-panel rounded-3xl overflow-hidden">
            <div className="relative h-64 bg-slate-900">
              <img
                src={activePet.avatar}
                alt={activePet.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/80 text-[#00F5A0] border border-[#00F5A0]/40">
                  CHIP ISO: {activePet.microchipIso}
                </span>
              </div>

              <div className="absolute bottom-4 left-5 right-5 text-white">
                <div className="flex items-center justify-between">
                  <h3 className="text-3xl font-extrabold !text-white">{activePet.name}</h3>
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500 text-slate-950">
                    {activePet.gender} • {activePet.isSterilized ? 'Esterilizado' : 'Intacto'}
                  </span>
                </div>
                <p className="text-sm text-slate-200 font-semibold mt-0.5">
                  {activePet.breed} • Pelaje {activePet.coatColor}
                </p>
              </div>
            </div>

            {/* Métricas Vitales: EDAD, PESO, RACIÓN, SANGRE */}
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-3.5">
                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-center justify-between text-xs font-mono uppercase opacity-75">
                    <span>EDAD ACTUAL</span>
                    <Calendar className="w-4 h-4 text-emerald-600 dark:text-[#00F5A0]" />
                  </div>
                  <div className="text-lg sm:text-xl font-extrabold mt-1">{activePet.ageLabel}</div>
                  <div className="text-xs opacity-75 mt-0.5">Nac: {activePet.birthDate}</div>
                </div>

                <div className={`p-4 rounded-2xl border ${theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                  <div className="flex items-center justify-between text-xs font-mono uppercase opacity-75">
                    <span>PESO CONTROL</span>
                    <Scale className="w-4 h-4 text-sky-600 dark:text-[#00D9F5]" />
                  </div>
                  {!editingWeight ? (
                    <div className="flex items-baseline justify-between mt-1">
                      <span className="text-xl sm:text-2xl font-extrabold text-emerald-700 dark:text-[#00F5A0]">
                        {activePet.weightKg} kg
                      </span>
                      <button
                        onClick={() => {
                          setWeightInput(activePet.weightKg.toString());
                          setEditingWeight(true);
                        }}
                        className="text-xs font-mono underline opacity-80 hover:opacity-100 cursor-pointer"
                      >
                        Actualizar
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 mt-1">
                      <input
                        type="number"
                        step="0.1"
                        value={weightInput}
                        onChange={e => setWeightInput(e.target.value)}
                        className="w-20 glass-input rounded-lg px-2 py-1 text-sm font-bold"
                      />
                      <button
                        onClick={() => {
                          const parsed = parseFloat(weightInput);
                          if (parsed > 0) onUpdateWeight(activePet.id, parsed);
                          setEditingWeight(false);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-500 text-slate-950 text-xs font-bold cursor-pointer"
                      >
                        OK
                      </button>
                    </div>
                  )}
                  <div className="text-xs opacity-75 mt-0.5">Meta ideal: {activePet.targetWeightKg} kg</div>
                </div>
              </div>

              {/* Alergias & Nutrición */}
              <div className={`p-4 rounded-2xl border space-y-2.5 ${theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase text-emerald-700 dark:text-[#00F5A0]">
                    PLAN NUTRICIONAL & ALERGIAS
                  </span>
                  <span className="text-xs font-mono font-bold">{activePet.dailyRationGrams}g / día</span>
                </div>
                <p className="text-xs sm:text-sm font-bold">{activePet.dietBrand}</p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {activePet.allergies.map((al, i) => (
                    <span
                      key={i}
                      className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${
                        theme === 'dark'
                          ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                          : 'bg-rose-50 text-rose-900 border border-rose-300'
                      }`}
                    >
                      ⚠️ {al}
                    </span>
                  ))}
                </div>
              </div>

              {/* Accesos Rápidos de Compra y Servicios para esta Mascota */}
              <div className="space-y-2.5 pt-1">
                <span className="text-xs font-mono uppercase font-bold opacity-75 block">
                  Acciones Inteligentes para {activePet.name}:
                </span>
                <button
                  onClick={() => onNavigateToStore('Comida')}
                  className="btn-primary-2026 w-full py-3 px-4 text-xs sm:text-sm font-bold flex items-center justify-between cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
                    <span>Comprar Comida / Farmacia para {activePet.name}</span>
                  </span>
                  <span>→</span>
                </button>
                <button
                  onClick={() => onNavigateToServices('Veterinaria')}
                  className={`w-full py-3 px-4 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-between transition cursor-pointer ${
                    theme === 'dark'
                      ? 'bg-white/5 hover:bg-white/10 border-white/15 text-white'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-[#00F5A0]" />
                    <span>Contratar Transporte, Hotel, Grooming o Vet</span>
                  </span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA DERECHA: CARNETS, HISTORIA CLÍNICA, FOTOS Y NOTAS */}
        <div className="lg:col-span-8 space-y-5">
          {/* Sub-navegación del Expediente de la Mascota */}
          <div className="glass-panel rounded-3xl p-2 flex flex-wrap items-center gap-2">
            {[
              { id: 'carnet', label: 'Carnet de Vacunas & Desparasitación', icon: Syringe, count: activePet.vaccines.length },
              { id: 'historia', label: 'Historia Clínica', icon: FileText, count: activePet.clinicalHistory.length },
              { id: 'fotos', label: 'Álbum de Fotos', icon: Camera, count: activePet.gallery.length },
              { id: 'notas', label: 'Notas & Diario', icon: StickyNote, count: activePet.notes.length }
            ].map(tab => {
              const Icon = tab.icon;
              const isAct = dossierTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setDossierTab(tab.id as any)}
                  className={`flex-1 min-w-[160px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
                    isAct
                      ? 'btn-primary-2026 !rounded-2xl'
                      : (theme === 'dark' ? 'text-slate-300 hover:bg-white/10' : 'text-slate-700 hover:bg-slate-100')
                  }`}
                >
                  <Icon className="w-4 h-4 stroke-[2.2]" />
                  <span>{tab.label}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${
                    isAct ? 'bg-black/20 text-slate-950 font-extrabold' : 'bg-slate-500/20'
                  }`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* VISTA 1: CARNET DIGITAL DE VACUNACIÓN Y DESPARASITACIÓN */}
          {dossierTab === 'carnet' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-300 dark:border-white/10">
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-emerald-700 dark:text-[#00F5A0]">
                    CERTIFICADO INMUNOLÓGICO DIGITAL
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold">
                    Carnet Oficial de Vacunas y Desparasitación — {activePet.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewVaccineForm(!showNewVaccineForm)}
                  className="btn-primary-2026 px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Añadir Vacuna / Desparasitación</span>
                </button>
              </div>

              {showNewVaccineForm && (
                <form onSubmit={handleSaveVaccine} className={`p-5 rounded-2xl border space-y-4 text-xs sm:text-sm ${
                  theme === 'dark' ? 'bg-[#03060C] border-white/15' : 'bg-slate-50 border-slate-300'
                }`}>
                  <h4 className="font-extrabold text-base">Registrar Nueva Dosis en el Carnet de {activePet.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Vacuna o Antiparasitario *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Refuerzo Séxtuple / Bravecto"
                        value={vaccineForm.name}
                        onChange={e => setVaccineForm({ ...vaccineForm, name: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">N° de Lote / Serie</label>
                      <input
                        type="text"
                        placeholder="Ej. LOT-99412"
                        value={vaccineForm.batch}
                        onChange={e => setVaccineForm({ ...vaccineForm, batch: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5 font-mono"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Próximo Refuerzo</label>
                      <input
                        type="text"
                        placeholder="Ej. 20 Oct 2027"
                        value={vaccineForm.nextDueDate}
                        onChange={e => setVaccineForm({ ...vaccineForm, nextDueDate: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewVaccineForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary-2026 px-5 py-2 font-bold cursor-pointer">
                      Guardar en Carnet
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {activePet.vaccines.map(vac => (
                  <div
                    key={vac.id}
                    className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition ${
                      theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold uppercase ${
                          vac.status === 'vigente'
                            ? 'badge-emerald'
                            : 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40'
                        }`}>
                          {vac.status === 'vigente' ? '✓ VIGENTE' : '⏰ PRÓXIMO REFUERZO'}
                        </span>
                        <span className="text-xs font-mono opacity-75">LOTE: {vac.batch}</span>
                      </div>
                      <h4 className="font-extrabold text-base sm:text-lg">{vac.name}</h4>
                      <p className={`text-xs sm:text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        Clínica: <strong>{vac.clinic}</strong> • Profesional: {vac.vetName}
                      </p>
                    </div>

                    <div className="sm:text-right shrink-0 space-y-1 border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-300 dark:border-white/10">
                      <div className="text-xs opacity-75">Aplicada: <strong>{vac.appliedDate}</strong></div>
                      <div className="text-xs sm:text-sm font-mono font-bold text-emerald-700 dark:text-[#00F5A0]">
                        Próxima: {vac.nextDueDate}
                      </div>
                      {vac.status === 'proximo' && (
                        <button
                          onClick={() => onNavigateToStore('Medicamentos')}
                          className="mt-1 inline-block text-xs font-bold underline text-amber-600 dark:text-amber-300 cursor-pointer"
                        >
                          Comprar dosis en Farmacia →
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA 2: HISTORIA CLÍNICA COMPLETA */}
          {dossierTab === 'historia' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-300 dark:border-white/10">
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-emerald-700 dark:text-[#00F5A0]">
                    EXPEDIENTE MÉDICO CENTRALIZADO
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold">
                    Historia Clínica & Evolución — {activePet.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewClinicalForm(!showNewClinicalForm)}
                  className="btn-primary-2026 px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Añadir Consulta / Examen</span>
                </button>
              </div>

              {showNewClinicalForm && (
                <form onSubmit={handleSaveClinical} className={`p-5 rounded-2xl border space-y-4 text-xs sm:text-sm ${
                  theme === 'dark' ? 'bg-[#03060C] border-white/15' : 'bg-slate-50 border-slate-300'
                }`}>
                  <h4 className="font-extrabold text-base">Nuevo Registro en la Historia Clínica de {activePet.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Tipo de Atención</label>
                      <select
                        value={clinicalForm.type}
                        onChange={e => setClinicalForm({ ...clinicalForm, type: e.target.value as ClinicalEntry['type'] })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      >
                        <option value="Consulta General">Consulta General</option>
                        <option value="Laboratorio">Laboratorio / Exámenes</option>
                        <option value="Cirugía">Cirugía / Procedimiento</option>
                        <option value="Odontología">Odontología</option>
                        <option value="Control Peso">Control de Peso y Nutrición</option>
                        <option value="Urgencia">Atención de Urgencia</option>
                      </select>
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Motivo / Título *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Control dermatológico o Ecografía"
                        value={clinicalForm.title}
                        onChange={e => setClinicalForm({ ...clinicalForm, title: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold block mb-1">Diagnóstico y Hallazgos Clínicos *</label>
                      <textarea
                        rows={2}
                        required
                        placeholder="Describe el diagnóstico o resultados del examen..."
                        value={clinicalForm.diagnosis}
                        onChange={e => setClinicalForm({ ...clinicalForm, diagnosis: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold block mb-1">Tratamiento / Indicaciones</label>
                      <input
                        type="text"
                        placeholder="Ej. Dieta blanda 3 días y control en 1 semana"
                        value={clinicalForm.treatment}
                        onChange={e => setClinicalForm({ ...clinicalForm, treatment: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewClinicalForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary-2026 px-5 py-2 font-bold cursor-pointer">
                      Guardar en Historia Clínica
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-4">
                {activePet.clinicalHistory.map(entry => (
                  <div
                    key={entry.id}
                    className={`p-5 rounded-2xl border space-y-3 ${
                      theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="px-3 py-1 rounded-md badge-indigo text-xs font-mono font-bold">
                          {entry.type}
                        </span>
                        <span className="text-xs font-mono font-bold opacity-75">{entry.date}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs font-mono">
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-[#00F5A0] font-bold">
                          Peso: {entry.weightKg} kg
                        </span>
                        <span className="opacity-75">Temp: {entry.tempC}°C</span>
                      </div>
                    </div>

                    <h4 className="font-extrabold text-base sm:text-lg">{entry.title}</h4>

                    <div className="space-y-1.5 text-xs sm:text-sm">
                      <p>
                        <strong className="text-emerald-700 dark:text-[#00F5A0]">Diagnóstico: </strong>
                        {entry.diagnosis}
                      </p>
                      <p>
                        <strong className="text-sky-700 dark:text-[#00D9F5]">Plan Terapéutico: </strong>
                        {entry.treatment}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-300 dark:border-white/10 flex flex-wrap items-center justify-between text-xs opacity-75">
                      <span>Centro Clínico: <strong>{entry.clinic}</strong></span>
                      <span>Médico Tratante: <strong>{entry.vetName}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA 3: GALERÍA DE FOTOS Y RECUERDOS */}
          {dossierTab === 'fotos' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-300 dark:border-white/10">
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-emerald-700 dark:text-[#00F5A0]">
                    GALERÍA VISUAL & IDENTIFICACIÓN
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold">
                    Álbum Fotográfico de {activePet.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewPhotoForm(!showNewPhotoForm)}
                  className="btn-primary-2026 px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>Añadir Foto</span>
                </button>
              </div>

              {showNewPhotoForm && (
                <form onSubmit={handleSavePhoto} className={`p-5 rounded-2xl border space-y-4 text-xs sm:text-sm ${
                  theme === 'dark' ? 'bg-[#03060C] border-white/15' : 'bg-slate-50 border-slate-300'
                }`}>
                  <h4 className="font-extrabold text-base">Subir Nueva Fotografía de {activePet.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold block mb-1">URL de la Imagen *</label>
                      <input
                        type="url"
                        required
                        value={photoForm.url}
                        onChange={e => setPhotoForm({ ...photoForm, url: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                    <div>
                      <label className="font-bold block mb-1">Descripción / Momento *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Jugando en el parque o foto de perfil actualizado"
                        value={photoForm.caption}
                        onChange={e => setPhotoForm({ ...photoForm, caption: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewPhotoForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary-2026 px-5 py-2 font-bold cursor-pointer">
                      Guardar Foto
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                {activePet.gallery.map((img, i) => (
                  <div
                    key={i}
                    className={`rounded-2xl overflow-hidden border group ${
                      theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="h-48 overflow-hidden bg-slate-900">
                      <img
                        src={img.url}
                        alt={img.caption}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-1">
                      <span className="text-xs font-mono text-emerald-700 dark:text-[#00F5A0] font-bold">
                        {img.date}
                      </span>
                      <p className="text-xs sm:text-sm font-bold leading-snug">{img.caption}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VISTA 4: NOTAS, RUTINAS Y RECORDATORIOS DEL TUTOR */}
          {dossierTab === 'notas' && (
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-4 border-slate-300 dark:border-white/10">
                <div>
                  <span className="text-xs font-mono uppercase font-bold text-emerald-700 dark:text-[#00F5A0]">
                    BITÁCORA PERSONAL DEL TUTOR
                  </span>
                  <h3 className="text-xl sm:text-2xl font-extrabold">
                    Notas, Dieta, Cuidados y Recordatorios — {activePet.name}
                  </h3>
                </div>
                <button
                  onClick={() => setShowNewNoteForm(!showNewNoteForm)}
                  className="btn-primary-2026 px-4 py-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Nueva Nota</span>
                </button>
              </div>

              {showNewNoteForm && (
                <form onSubmit={handleSaveNote} className={`p-5 rounded-2xl border space-y-4 text-xs sm:text-sm ${
                  theme === 'dark' ? 'bg-[#03060C] border-white/15' : 'bg-slate-50 border-slate-300'
                }`}>
                  <h4 className="font-extrabold text-base">Añadir Nota Personal para {activePet.name}</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold block mb-1">Categoría</label>
                      <select
                        value={noteForm.category}
                        onChange={e => setNoteForm({ ...noteForm, category: e.target.value as PetNote['category'] })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      >
                        <option value="Nutrición">Nutrición & Dieta</option>
                        <option value="Medicación">Medicación & Suplementos</option>
                        <option value="Conducta">Conducta & Paseos</option>
                        <option value="Cuidado Diario">Cuidado Diario / Cuidador</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="font-bold block mb-1">Título de la Nota *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. Instrucciones para cuando se queda en el hospedaje"
                        value={noteForm.title}
                        onChange={e => setNoteForm({ ...noteForm, title: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="font-bold block mb-1">Contenido Detallado *</label>
                      <textarea
                        rows={3}
                        required
                        placeholder="Escribe horarios, gustos, medicación o cualquier detalle importante..."
                        value={noteForm.content}
                        onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                        className="w-full glass-input rounded-xl px-3.5 py-2.5"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowNewNoteForm(false)}
                      className="px-4 py-2 rounded-xl border border-slate-300 dark:border-white/15 font-bold cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn-primary-2026 px-5 py-2 font-bold cursor-pointer">
                      Guardar Nota
                    </button>
                  </div>
                </form>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activePet.notes.map(note => (
                  <div
                    key={note.id}
                    className={`p-5 rounded-2xl border flex flex-col justify-between space-y-3 ${
                      theme === 'dark' ? 'bg-[#03060C]/70 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-0.5 rounded-full badge-emerald text-xs font-mono font-bold">
                          {note.category}
                        </span>
                        <span className="text-xs font-mono opacity-60">{note.updatedAt}</span>
                      </div>
                      <h4 className="font-extrabold text-base">{note.title}</h4>
                      <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                        {note.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
