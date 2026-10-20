import React, { useState, useEffect } from 'react';
import {
  ShoppingBag, Star, ShieldCheck, CheckCircle2, MessageSquare,
  Plus, Minus, Trash2, Sparkles, Package, Pill, Bone, Bed, Home,
  Search, Bot, Cpu, User, Edit3
} from 'lucide-react';
import { StoreProduct, UserPet } from '../data/pawloData';
import { loadLocalState, saveLocalState, subscribeLocalState } from '../services/localStore';
import { webMCPManager } from '../services/webmcp';
import { loadUserProfile, SimpleProfileModal, PawloUserProfile } from './SimpleProfileModal';
import { SimplePaymentFlow } from './SimplePaymentFlow';

interface PetStoreMarketplaceProps {
  products: StoreProduct[];
  pets: UserPet[];
  selectedPetId: string;
  onSelectPet: (id: string) => void;
  initialCategory?: string;
  cityName: string;
  currency: string;
  paymentRail: string;
  theme: 'dark' | 'light';
  onOpenAgentConsole?: () => void;
}

export const PetStoreMarketplace: React.FC<PetStoreMarketplaceProps> = ({
  products,
  pets,
  selectedPetId,
  onSelectPet,
  initialCategory = 'Todos',
  cityName,
  currency,
  paymentRail,
  theme,
  onOpenAgentConsole
}) => {
  const activePet = pets.find(p => p.id === selectedPetId) || pets[0];
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategory || 'Todos');
  const [filterByPetSpecies, setFilterByPetSpecies] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  // Catálogo local con sincronización y persistencia
  const [catalogProducts, setCatalogProducts] = useState<StoreProduct[]>(() =>
    loadLocalState<StoreProduct[]>('pawlo_store_products', products)
  );

  useEffect(() => {
    return subscribeLocalState<StoreProduct[]>('pawlo_store_products', (updated) => {
      if (Array.isArray(updated) && updated.length > 0) {
        setCatalogProducts(updated);
      }
    });
  }, []);

  // Carrito de compras con persistencia local
  const [cart, setCart] = useState<Array<{ product: StoreProduct; qty: number }>>(() => {
    const defaultCart = products[0] ? [{ product: products[0], qty: 1 }] : [];
    return loadLocalState<Array<{ product: StoreProduct; qty: number }>>('pawlo_cart', defaultCart);
  });

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState<{ waUrl: string; orderId: string } | null>(null);
  const [profileModalOpen, setProfileModalOpen] = useState(false);

  // Formulario de despacho prellenado automáticamente desde el perfil local
  const [orderForm, setOrderForm] = useState(() => {
    const profile = loadUserProfile();
    const saved = loadLocalState<{
      fullName?: string;
      phone?: string;
      address?: string;
      paymentMethod?: string;
      prescriptionVerified?: boolean;
    }>('pawlo_order_form', {} as any);

    const defaultAddress = profile.addressReference
      ? `${profile.sector ? profile.sector + ', ' : ''}${profile.addressReference}`
      : 'Sector El Vergel, Calle Larga y Borrero';

    return {
      fullName: (saved && saved.fullName) ? saved.fullName : (profile.fullName || 'Nicolás Norton'),
      phone: (saved && saved.phone) ? saved.phone : (profile.phone || '0998408369'),
      address: (saved && saved.address) ? saved.address : defaultAddress,
      paymentMethod: (saved && saved.paymentMethod) ? saved.paymentMethod : (profile.preferredPayment || 'QR_Deuna_Sipy_Peigo'),
      prescriptionVerified: saved?.prescriptionVerified ?? true
    };
  });

  // Persistir formulario y carrito
  useEffect(() => {
    saveLocalState('pawlo_order_form', orderForm);
  }, [orderForm]);

  useEffect(() => {
    saveLocalState('pawlo_cart', cart);
    webMCPManager.updateCartState(cart);
  }, [cart]);

  useEffect(() => {
    return subscribeLocalState<Array<{ product: StoreProduct; qty: number }>>('pawlo_cart', (updated) => {
      if (Array.isArray(updated)) {
        setCart(updated);
      }
    });
  }, []);

  // Sincronización bidireccional con el Gestor de Comercio Agéntico WebMCP
  useEffect(() => {
    webMCPManager.setListeners({
      onCartChange: (newCart) => {
        setCart(newCart);
      }
    });
  }, []);

  const categories = [
    { id: 'Todos', label: 'Todo el Catálogo', icon: Package },
    { id: 'Comida', label: 'Comida & Nutrición', icon: Bone },
    { id: 'Medicamentos', label: 'Medicamentos & Farmacia', icon: Pill },
    { id: 'Juguetes', label: 'Juguetes', icon: Sparkles },
    { id: 'Camas', label: 'Camas Ortopédicas', icon: Bed },
    { id: 'Casas', label: 'Casas & Kennels', icon: Home }
  ];

  const filteredProducts = catalogProducts.filter(p => {
    const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    const matchesSpecies = !filterByPetSpecies || p.species === 'all' || p.species === activePet.species;
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = !q || p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    return matchesCat && matchesSpecies && matchesQuery;
  });

  const addToCart = (product: StoreProduct) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.product.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const updateQty = (productId: string, delta: number) => {
    setCart(prev =>
      prev
        .map(item =>
          item.product.id === productId ? { ...item, qty: item.qty + delta } : item
        )
        .filter(item => item.qty > 0)
    );
  };

  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const totalAmount = cart.reduce((acc, item) => acc + item.product.price * item.qty, 0);
  const hasPrescriptionItems = cart.some(item => item.product.requiresPrescription);

  const handleCompleteOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `PWL-STR-${Date.now().toString(36).toUpperCase()}`;
    const itemsSummary = cart
      .map(i => `${i.qty}x ${i.product.title} ($${(i.product.price * i.qty).toFixed(2)})`)
      .join(', ');

    const paymentLabel = orderForm.paymentMethod === 'Payphone'
      ? 'Payphone (Tarjeta Crédito / Débito)'
      : orderForm.paymentMethod === 'QR_Deuna_Sipy_Peigo'
      ? 'Pago QR Instantáneo (DeUna / Sipy / Peigo)'
      : orderForm.paymentMethod === 'Transferencia_Bancaria'
      ? 'Transferencia Bancaria Directa'
      : orderForm.paymentMethod === 'Efectivo_Contraentrega'
      ? 'Pago al Recibir (Efectivo)'
      : orderForm.paymentMethod;

    const waText = `Hola PAWLO Store (${cityName}), confirmo pedido ${orderId} para mi mascota ${activePet.name} (Chip ISO: ${activePet.microchipIso}). Productos: ${itemsSummary}. Total: $${totalAmount.toFixed(2)} ${currency}. Dirección: ${orderForm.address}. Pago vía: ${paymentLabel}.`;
    const waUrl = `https://wa.me/593998408369?text=${encodeURIComponent(waText)}`;

    // Persistir nuevo pedido en el estado compartido del comercio
    const existingOrders = loadLocalState<any[]>('pawlo_store_orders', []);
    const newStoreOrder = {
      id: orderId,
      customerName: orderForm.fullName || 'Tutor PAWLO',
      customerPhone: orderForm.phone || '+593 99 840 8369',
      deliveryAddress: orderForm.address,
      petName: activePet.name,
      petSpecies: activePet.species,
      microchipIso: activePet.microchipIso,
      items: cart.map(i => ({
        title: i.product.title,
        qty: i.qty,
        price: i.product.price,
        requiresPrescription: i.product.requiresPrescription
      })),
      totalAmount,
      paymentMethod: paymentLabel,
      prescriptionStatus: hasPrescriptionItems ? 'pendiente_validacion' : 'no_requiere',
      orderStatus: hasPrescriptionItems ? 'validando_receta' : 'en_motorizado',
      createdAt: 'Hace un momento'
    };
    saveLocalState('pawlo_store_orders', [newStoreOrder, ...existingOrders]);

    setCheckoutSuccess({ waUrl, orderId });
  };

  return (
    <section className="space-y-6">
      {/* CABECERA TIENDA & FARMACIA PERSONALIZADA */}
      <div className="glass-panel rounded-3xl p-6 sm:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full badge-emerald text-xs font-mono font-bold uppercase tracking-wider">
            <ShoppingBag className="w-4 h-4" />
            <span>PAWLO STORE & FARMACIA VETERINARIA • {cityName.toUpperCase()}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Todo lo que {activePet.name} necesita, directo a tu puerta
          </h2>
          <p className={`text-sm sm:text-base ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
            Comida super premium, medicamentos con validación de carnet digital, juguetes interactivos, camas ortopédicas y casas térmicas. Pago directo vía <strong>{paymentRail}</strong>.
          </p>
        </div>

        {/* Selector Rápido de Mascota para Personalizar la Tienda + Carrito */}
        <div className="flex flex-wrap items-center gap-3">
          <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
            theme === 'dark' ? 'bg-[#03060C]/90 border-white/15' : 'bg-slate-50 border-slate-300'
          }`}>
            <img src={activePet.avatar} alt={activePet.name} className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <label htmlFor="store-pet-selector" className="text-xs font-mono uppercase opacity-70 block">Comprando para:</label>
              <select
                id="store-pet-selector"
                name="storePetSelector"
                value={activePet.id}
                onChange={e => onSelectPet(e.target.value)}
                className="font-extrabold text-sm bg-transparent focus:outline-none cursor-pointer"
              >
                {pets.map(pet => (
                  <option key={pet.id} value={pet.id} className="text-slate-900">
                    {pet.name} ({pet.breed} • {pet.weightKg}kg)
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onClick={() => { setCheckoutOpen(!checkoutOpen); setCheckoutSuccess(null); }}
            className="btn-primary-2026 px-5 py-3.5 text-xs sm:text-sm font-bold flex items-center gap-2.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
            <span>Carrito ({totalItems})</span>
            <span className="px-2 py-0.5 rounded-lg bg-black/20 font-mono text-xs">
              ${totalAmount.toFixed(2)}
            </span>
          </button>
        </div>
      </div>

      {/* BARRA DE COMERCIO AGÉNTICO WEBMCP + BÚSQUEDA DECLARATIVA */}
      <div className={`p-4 rounded-3xl border flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 ${
        theme === 'dark' ? 'bg-[#03060C]/90 border-white/10' : 'bg-slate-50 border-slate-200'
      }`}>
        <form
          toolname="pawlo_search_catalog"
          tooldescription="Búsqueda de productos de alimentación, farmacia y juguetes con filtros de especie y categoría"
          toolautosubmit="true"
          onSubmit={e => e.preventDefault()}
          className="flex-1 flex items-center gap-2 relative"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            name="query"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar por alimento, marca, antipulgas, cama ortopédica..."
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl glass-input text-xs sm:text-sm focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 shrink-0 justify-between md:justify-end">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-[#00F5A0] text-xs font-mono">
            <Cpu className="w-3.5 h-3.5 animate-pulse" />
            <span className="font-bold">WebMCP Commerce Ready</span>
          </div>
          {onOpenAgentConsole && (
            <button
              onClick={onOpenAgentConsole}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#00F5A0]" />
              <span>Consola Agéntica</span>
            </button>
          )}
        </div>
      </div>

      {/* FILTROS POR CATEGORÍA + COMPATIBILIDAD CON LA MASCOTA (Scroll horizontal suave en móviles) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-1 sm:pb-0">
          {categories.map(cat => {
            const Icon = cat.icon;
            const isSel = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
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

        <label htmlFor="filter-pet-species" className="flex items-center space-x-2.5 text-xs sm:text-sm font-bold cursor-pointer select-none pt-1 sm:pt-0">
          <input
            id="filter-pet-species"
            name="filterByPetSpecies"
            type="checkbox"
            checked={filterByPetSpecies}
            onChange={e => setFilterByPetSpecies(e.target.checked)}
            className="rounded border-slate-400 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
          />
          <span className="text-xs sm:text-sm leading-snug">Filtrar para {activePet.name} ({activePet.species === 'canine' ? 'Perro' : 'Gato'})</span>
        </label>
      </div>

      {/* PANEL DEL CARRITO Y CHECKOUT DIRECTO */}
      {checkoutOpen && (
        <div className="glass-panel-glow rounded-3xl p-6 sm:p-8 border-2 border-emerald-500/40 space-y-6">
          <div className="flex items-center justify-between border-b pb-4 border-slate-300 dark:border-white/10">
            <div>
              <span className="text-xs font-mono uppercase font-bold text-emerald-700 dark:text-[#00F5A0]">
                CARRITO PERSONALIZADO PARA {activePet.name.toUpperCase()}
              </span>
              <h3 className="text-xl sm:text-2xl font-extrabold">Resumen de Pedido & Despacho Express</h3>
            </div>
            <button
              onClick={() => setCheckoutOpen(false)}
              className="text-sm font-bold px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-white/10 cursor-pointer"
            >
              Seguir Comprando ✕
            </button>
          </div>

          {cart.length === 0 ? (
            <p className="text-sm py-6 text-center opacity-75">
              Tu carrito está vacío. Selecciona comida, medicamentos, juguetes, camas o casas abajo.
            </p>
          ) : !checkoutSuccess ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Columna Izquierda: Productos en Carrito & Verificación de Recetas */}
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between pb-1 font-bold text-xs uppercase font-mono opacity-80">
                  <span>Productos ({totalItems})</span>
                  <span>Subtotal</span>
                </div>

                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className={`p-4 rounded-2xl border flex items-center justify-between gap-4 ${
                      theme === 'dark' ? 'bg-[#03060C]/80 border-white/10' : 'bg-slate-50 border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <img
                        src={item.product.photo}
                        alt={item.product.title}
                        className="w-14 h-14 rounded-xl object-cover shrink-0"
                      />
                      <div>
                        <span className="text-xs font-mono text-emerald-700 dark:text-[#00F5A0] font-bold">
                          {item.product.category} • {item.product.brand}
                        </span>
                        <h4 className="font-extrabold text-sm sm:text-base leading-snug">{item.product.title}</h4>
                        <span className="text-xs font-mono font-bold">${item.product.price.toFixed(2)} c/u</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, -1)}
                        className="p-2 rounded-lg border border-slate-300 dark:border-white/15 cursor-pointer"
                        aria-label="Disminuir cantidad"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-mono font-extrabold text-sm w-6 text-center">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.product.id, 1)}
                        className="p-2 rounded-lg border border-slate-300 dark:border-white/15 cursor-pointer"
                        aria-label="Aumentar cantidad"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {hasPrescriptionItems && (
                  <div className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-start gap-3 ${
                    theme === 'dark' ? 'bg-amber-500/15 border-amber-500/40 text-amber-200' : 'bg-amber-50 border-amber-300 text-amber-950'
                  }`}>
                    <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div>
                      <strong>Verificación Farmacológica Vinculada:</strong> Tu pedido incluye medicamentos con receta. Se adjuntará automáticamente el código de Historia Clínica de <strong>{activePet.name}</strong> (Chip ISO {activePet.microchipIso}) para validación veterinaria.
                    </div>
                  </div>
                )}
              </div>

              {/* Columna Derecha: Formulario 1-Toque & Pasarela Visual Simple de Pago */}
              <form
                onSubmit={handleCompleteOrder}
                toolname="pawlo_checkout_cart"
                tooldescription="Formulario para despachar el pedido con dirección de entrega y forma de pago"
                toolautosubmit="true"
                className="lg:col-span-7 space-y-4 text-xs sm:text-sm"
              >
                {/* Banner de Datos del Tutor con botón rápido para editar perfil */}
                <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                  theme === 'dark' ? 'bg-[#060B18] border-white/10' : 'bg-white border-slate-200 shadow-sm'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-[#00F5A0] flex items-center justify-center font-bold shrink-0">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-extrabold text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Datos de Entrega en 1 Toque</span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-[#00F5A0] font-bold">
                          ● Activo
                        </span>
                      </div>
                      <div className={`text-[11px] ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {orderForm.fullName} • {orderForm.phone}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setProfileModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 text-emerald-600 dark:text-[#00F5A0] hover:bg-emerald-500/10 transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Mis Datos</span>
                  </button>
                </div>

                {/* Campos de Nombre y Celular */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Nombre del Tutor *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Nicolás Norton"
                      value={orderForm.fullName}
                      onChange={e => setOrderForm({ ...orderForm, fullName: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs sm:text-sm"
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">WhatsApp para Notificación *</label>
                    <input
                      type="tel"
                      required
                      placeholder="0998408369"
                      value={orderForm.phone}
                      onChange={e => setOrderForm({ ...orderForm, phone: e.target.value })}
                      className="w-full glass-input rounded-xl px-4 py-3 text-xs sm:text-sm"
                    />
                  </div>
                </div>

                {/* Dirección y Referencia */}
                <div>
                  <label className="font-bold block mb-1">Dirección y Referencia de Entrega en {cityName} *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sector El Vergel, Calle Larga y Borrero"
                    value={orderForm.address}
                    onChange={e => setOrderForm({ ...orderForm, address: e.target.value })}
                    className="w-full glass-input rounded-xl px-4 py-3 text-xs sm:text-sm"
                  />
                </div>

                {/* PASARELA VISUAL DE PAGO ULTRA-SIMPLE (QR / Payphone / Transferencia / Efectivo) */}
                <div className="pt-2">
                  <SimplePaymentFlow
                    selectedMethod={orderForm.paymentMethod}
                    onSelectMethod={(method) => setOrderForm({ ...orderForm, paymentMethod: method })}
                    amountUSD={totalAmount}
                    currency={currency}
                    orderReference={`PWL-${Date.now().toString(36).toUpperCase()}`}
                    theme={theme}
                  />
                </div>

                {/* Total y Confirmación */}
                <div className="pt-3 border-t border-slate-300 dark:border-white/10 flex items-center justify-between font-extrabold text-base">
                  <span>Total a Pagar ({totalItems} prod.):</span>
                  <span className="text-2xl text-emerald-700 dark:text-[#00F5A0]">${totalAmount.toFixed(2)} {currency}</span>
                </div>

                <button type="submit" className="btn-primary-2026 w-full py-4 font-bold text-sm sm:text-base cursor-pointer shadow-lg flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Confirmar Pedido Directo por WhatsApp</span>
                </button>
              </form>
            </div>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="w-14 h-14 bg-emerald-500/20 text-emerald-700 dark:text-[#00F5A0] rounded-2xl flex items-center justify-center mx-auto border border-emerald-500/30">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="text-2xl font-extrabold">¡Orden {checkoutSuccess.orderId} Lista para Despacho!</h4>
              <p className="text-sm max-w-md mx-auto opacity-80">
                Vinculada al expediente de <strong>{activePet.name}</strong>. Abre WhatsApp para recibir el seguimiento del motorizado en tiempo real.
              </p>
              <a
                href={checkoutSuccess.waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary-2026 inline-flex items-center space-x-2.5 py-4 px-8 text-sm font-bold"
              >
                <MessageSquare className="w-5 h-5" />
                <span>Enviar Orden por WhatsApp Ahora</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* GRILLA DE PRODUCTOS DE LA TIENDA */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <div
            key={product.id}
            className="glass-panel rounded-3xl overflow-hidden flex flex-col justify-between group hover:border-emerald-500/60 dark:hover:border-[#00F5A0]/60 transition-all duration-300"
          >
            <div>
              <div className="relative h-52 bg-slate-900 overflow-hidden">
                <img
                  src={product.photo}
                  alt={product.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent"></div>

                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-black/80 text-[#00F5A0] border border-white/15">
                    {product.category.toUpperCase()}
                  </span>
                  {product.requiresPrescription && (
                    <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500 text-slate-950">
                      RECETA VERIFICADA
                    </span>
                  )}
                </div>

                <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between text-white">
                  <span className="text-xs font-mono font-bold bg-emerald-500 text-slate-950 px-2.5 py-1 rounded-lg">
                    ★ {product.badge}
                  </span>
                  <span className="text-2xl font-extrabold font-display bg-black/70 px-3 py-1 rounded-xl border border-white/15">
                    ${product.price.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono opacity-75">
                  <span>{product.brand}</span>
                  <span>SKU: {product.sku}</span>
                </div>

                <h3 className="font-extrabold text-base sm:text-lg leading-snug">{product.title}</h3>

                <p className={`text-xs sm:text-sm leading-relaxed ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>
                  {product.description}
                </p>

                <div className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between ${
                  theme === 'dark' ? 'bg-[#03060C]/70 border-white/10 text-slate-200' : 'bg-slate-50 border-slate-300 text-slate-800'
                }`}>
                  <span>🎯 {product.idealFor}</span>
                  <span className="flex items-center text-amber-500 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-500 mr-1" />
                    {product.rating}
                  </span>
                </div>
              </div>
            </div>

            <div className="px-6 pb-6 pt-2 flex items-center gap-3">
              <button
                onClick={() => {
                  addToCart(product);
                  setCheckoutOpen(true);
                }}
                className="btn-primary-2026 w-full py-3.5 px-4 text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.5]" />
                <span>Añadir para {activePet.name} (${product.price.toFixed(2)})</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      {/* MODAL DE PERFIL LOCAL EN 1 TOQUE */}
      <SimpleProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        theme={theme}
        onSave={(updatedProfile) => {
          const fullAddress = updatedProfile.addressReference
            ? `${updatedProfile.sector ? updatedProfile.sector + ', ' : ''}${updatedProfile.addressReference}`
            : updatedProfile.addressReference || '';

          setOrderForm(prev => ({
            ...prev,
            fullName: updatedProfile.fullName,
            phone: updatedProfile.phone,
            address: fullAddress || prev.address,
            paymentMethod: updatedProfile.preferredPayment
          }));
        }}
      />
    </section>
  );
};
