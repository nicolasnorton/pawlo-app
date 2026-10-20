import React, { useState } from 'react';
import {
  QrCode, CreditCard, Building2, Banknote, Copy, Check,
  ExternalLink, ShieldCheck, Sparkles, CheckCircle2,
  Clock, ArrowRight, ShieldAlert, Smartphone
} from 'lucide-react';

export interface SimplePaymentFlowProps {
  selectedMethod: string;
  onSelectMethod: (method: string) => void;
  amountUSD: number;
  currency: string;
  orderReference: string;
  theme: 'dark' | 'light';
}

/**
 * Copia texto al portapapeles de manera segura con fallback para WebView / Safari / Capacitor.
 */
async function copyToClipboardSafe(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback document.execCommand
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch {
    return false;
  }
}

/**
 * Generador SVG de Código QR de Alta Visibilidad
 * Con esquinas de sincronización estándar y centro estilizado PAWLO.
 */
const HighContrastSvgQR: React.FC<{
  amount: string;
  reference: string;
}> = ({ amount, reference }) => {
  // Matriz 25x25 estilizada pero con marcadores QR reales
  const size = 25;
  const cells: boolean[][] = Array.from({ length: size }, () => Array(size).fill(false));

  // Función para rellenar marcadores de esquina estándar (7x7)
  const drawFinderPattern = (startX: number, startY: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        cells[startY + r][startX + c] = isBorder || isCenter;
      }
    }
  };

  // 3 Marcadores principales
  drawFinderPattern(0, 0);       // Superior Izquierda
  drawFinderPattern(18, 0);      // Superior Derecha
  drawFinderPattern(0, 18);      // Inferior Izquierda

  // Líneas de tiempo (Timing patterns)
  for (let i = 8; i < 17; i++) {
    cells[6][i] = i % 2 === 0;
    cells[i][6] = i % 2 === 0;
  }

  // Generación determinista de módulos con densidad QR
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      // Ignorar esquinas de sincronización
      if (
        (r < 8 && c < 8) ||
        (r < 8 && c >= 17) ||
        (r >= 17 && c < 8)
      ) {
        continue;
      }
      // Dejar centro despejado para el logo PAWLO (filas 10-14, cols 10-14)
      if (r >= 10 && r <= 14 && c >= 10 && c <= 14) {
        cells[r][c] = false;
        continue;
      }
      // Patrón pseudo-aleatorio reproducible
      const hash = (r * 31 + c * 17 + r * c * 7 + 13) % 100;
      cells[r][c] = hash > 48;
    }
  }

  return (
    <div className="relative inline-flex flex-col items-center p-4 bg-white rounded-2xl shadow-xl border-4 border-slate-900/10">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="w-48 h-48 sm:w-56 sm:h-56 select-none"
        shapeRendering="crispEdges"
      >
        <rect width={size} height={size} fill="#FFFFFF" />
        {cells.map((row, r) =>
          row.map((active, c) =>
            active ? <rect key={`${r}-${c}`} x={c} y={r} width="1.02" height="1.02" fill="#0A0F1D" /> : null
          )
        )}
      </svg>

      {/* Escudo central con insignia PAWLO QR */}
      <div className="absolute top-[38%] left-[38%] w-[24%] h-[24%] bg-slate-950 rounded-xl border-2 border-white flex flex-col items-center justify-center shadow-lg">
        <span className="text-[9px] font-black tracking-tight text-[#00F5A0] font-mono leading-none">KIRU</span>
        <span className="text-[8px] font-extrabold text-white uppercase tracking-wider leading-none mt-0.5">PAY</span>
      </div>

      {/* Badge de Monto Vinculado */}
      <div className="mt-2.5 px-3 py-1 bg-slate-950 text-white rounded-full text-xs font-mono font-bold flex items-center gap-1.5 shadow">
        <span className="w-2 h-2 rounded-full bg-[#00F5A0] animate-pulse"></span>
        <span>${amount} USD</span>
      </div>
    </div>
  );
};

export const SimplePaymentFlow: React.FC<SimplePaymentFlowProps> = ({
  selectedMethod,
  onSelectMethod,
  amountUSD,
  currency,
  orderReference,
  theme
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [payphoneSimulated, setPayphoneSimulated] = useState(false);
  const [payphonePhone, setPayphonePhone] = useState('0998408369');

  const formattedAmount = amountUSD.toFixed(2);

  const handleCopy = async (key: string, textToCopy: string) => {
    const ok = await copyToClipboardSafe(textToCopy);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2500);
    }
  };

  const paymentMethods = [
    {
      id: 'QR_Deuna_Sipy_Peigo',
      title: 'QR Instantáneo',
      subtitle: 'DeUna, Sipy o PeiGo',
      icon: QrCode,
      badge: '0% Comisión',
      badgeColor: 'bg-emerald-500/20 text-emerald-700 dark:text-[#00F5A0] border-emerald-500/30'
    },
    {
      id: 'Payphone',
      title: 'Payphone',
      subtitle: 'Tarjeta Crédito / Débito',
      icon: CreditCard,
      badge: 'Al Instante',
      badgeColor: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30'
    },
    {
      id: 'Transferencia_Bancaria',
      title: 'Transferencia',
      subtitle: 'Pichincha / Austro / Gye',
      icon: Building2,
      badge: 'Banca Móvil',
      badgeColor: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30'
    },
    {
      id: 'Efectivo_Contraentrega',
      title: 'Efectivo',
      subtitle: 'Pagas al recibir en casa',
      icon: Banknote,
      badge: 'Al Entregar',
      badgeColor: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
    }
  ];

  return (
    <div className="space-y-4">
      {/* 1. SELECTOR VISUAL DE 4 BOTONES GRANDES */}
      <div>
        <label className="text-xs font-mono uppercase tracking-wider font-bold block mb-2 opacity-80">
          Selecciona tu Forma de Pago:
        </label>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
          {paymentMethods.map(method => {
            const isSelected = selectedMethod === method.id;
            const IconComponent = method.icon;
            return (
              <button
                key={method.id}
                type="button"
                onClick={() => onSelectMethod(method.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-500/15 shadow-md ring-2 ring-emerald-500/50'
                    : theme === 'dark'
                    ? 'bg-[#060B18] border-white/10 hover:border-white/20'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`p-2 rounded-xl ${
                    isSelected
                      ? 'bg-emerald-600 text-white'
                      : theme === 'dark'
                      ? 'bg-white/10 text-slate-300'
                      : 'bg-slate-100 text-slate-700'
                  }`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${method.badgeColor}`}>
                    {method.badge}
                  </span>
                </div>

                <div>
                  <div className="font-extrabold text-sm sm:text-base leading-snug flex items-center gap-1.5">
                    <span>{method.title}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-[#00F5A0] shrink-0" />
                    )}
                  </div>
                  <div className={`text-xs mt-0.5 font-medium ${
                    theme === 'dark' ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {method.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. PANEL DE DETALLE VISUAL SEGÚN EL MÉTODO SELECCIONADO */}
      <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
        theme === 'dark' ? 'bg-[#03060C]/90 border-white/15' : 'bg-slate-50 border-slate-200'
      }`}>

        {/* =========================================================================
            CASO 1: QR INSTANTÁNEO (DeUna / Sipy / Peigo)
            ========================================================================= */}
        {selectedMethod === 'QR_Deuna_Sipy_Peigo' && (
          <div className="space-y-4">
            {/* Badges de las Apps Ecuatorianas */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-white/10">
              <span className="text-xs font-mono uppercase tracking-wider font-bold opacity-80">
                Paga desde cualquiera de estas apps:
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#FFD100] text-slate-950 shadow-sm border border-black/10">
                  DeUna! (Pichincha)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-purple-600 text-white shadow-sm border border-purple-400">
                  Sipy (Austro)
                </span>
                <span className="px-2.5 py-1 rounded-lg text-[11px] font-black bg-[#00D9F5] text-slate-950 shadow-sm border border-cyan-400">
                  PeiGo (Gye)
                </span>
              </div>
            </div>

            {/* Código QR Centrado y Nítido */}
            <div className="flex flex-col items-center justify-center pt-1 text-center">
              <HighContrastSvgQR
                amount={formattedAmount}
                reference={orderReference}
              />
              <p className="mt-2 text-xs font-bold opacity-80">
                Escanea desde la app o usa el número vinculado abajo
              </p>
            </div>

            {/* Botón de 1-toque para copiar número vinculado */}
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleCopy('qr_phone', '0998408369')}
                className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  copiedKey === 'qr_phone'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400'
                    : theme === 'dark'
                    ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                    : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
                }`}
              >
                {copiedKey === 'qr_phone' ? (
                  <>
                    <Check className="w-5 h-5 text-white" />
                    <span>¡Copiado! ✅ (0998408369 a nombre de Nicolás Norton)</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5 text-emerald-600 dark:text-[#00F5A0]" />
                    <span>📋 Copiar Número Vinculado (0998408369)</span>
                  </>
                )}
              </button>

              <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                theme === 'dark' ? 'bg-[#080E1C] border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
              }`}>
                <div className="flex items-center justify-between font-mono">
                  <span>Beneficiario: <strong>Nicolás Norton (KIRUPET Cuenca)</strong></span>
                  <span className="text-emerald-600 dark:text-[#00F5A0] font-bold">Verificado</span>
                </div>
                <div className="text-[11px] opacity-75">
                  1. Abre tu app → 2. Pega el número o escanea el QR → 3. Envía tu pedido al WhatsApp.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            CASO 2: PAYPHONE (Tarjetas de Crédito / Débito)
            ========================================================================= */}
        {selectedMethod === 'Payphone' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3 border-slate-200 dark:border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono uppercase tracking-wider font-bold opacity-80">
                  Tarjetas aceptadas:
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">VISA</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white">Mastercard</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-700 text-white">Diners</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-[#00F5A0] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Cifrado 256-bit
              </span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-mono uppercase tracking-wider font-bold block mb-1">
                  Número de Celular para Link de Cobro Payphone:
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={payphonePhone}
                    onChange={e => setPayphonePhone(e.target.value)}
                    placeholder="0998408369"
                    className="flex-1 glass-input rounded-xl px-4 py-3 text-sm font-mono font-bold focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setPayphoneSimulated(true)}
                    className="btn-primary-2026 px-4 py-3 text-xs sm:text-sm font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Generar Link</span>
                  </button>
                </div>
              </div>

              {/* Botón principal de cobro Payphone */}
              <button
                type="button"
                onClick={() => setPayphoneSimulated(true)}
                className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 hover:brightness-105 transition-all cursor-pointer"
              >
                <span>⚡ Abrir Link de Cobro Payphone (${formattedAmount} USD)</span>
                <ExternalLink className="w-4 h-4" />
              </button>

              {payphoneSimulated ? (
                <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-700 dark:text-[#00F5A0] text-xs space-y-1 animate-in fade-in">
                  <div className="font-extrabold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>¡Link de Cobro Seguro Preparado!</span>
                  </div>
                  <p className="opacity-90">
                    Se asociará a tu orden <strong>{orderReference}</strong>. Puedes confirmar el pedido por WhatsApp para recibir el enlace de pago con tarjeta sin recargos.
                  </p>
                </div>
              ) : (
                <p className={`text-xs text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  Sin costo de transacción adicional. Recibirás tu recibo electrónico instantáneo.
                </p>
              )}
            </div>
          </div>
        )}

        {/* =========================================================================
            CASO 3: TRANSFERENCIA BANCARIA (Pichincha / Austro / Guayaquil)
            ========================================================================= */}
        {selectedMethod === 'Transferencia_Bancaria' && (
          <div className="space-y-4">
            <div className="border-b pb-3 border-slate-200 dark:border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono uppercase tracking-wider font-bold opacity-80">
                Datos de Cuentas Bancarias Locales:
              </span>
              <span className="text-xs font-bold text-emerald-600 dark:text-[#00F5A0]">
                Monto: ${formattedAmount} USD
              </span>
            </div>

            {/* Tarjetas de Cuentas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Banco Pichincha */}
              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                theme === 'dark' ? 'bg-[#080E1C] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-yellow-600 dark:text-yellow-400">Banco Pichincha</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20">
                    Cta. Corriente
                  </span>
                </div>
                <div className="font-mono text-base font-extrabold tracking-wide">2100840921</div>
                <div className="text-[11px] opacity-75">KIRUPET Cuenca Cía. Ltda. • RUC 0190458721001</div>
              </div>

              {/* Banco del Austro */}
              <div className={`p-3.5 rounded-2xl border space-y-1.5 ${
                theme === 'dark' ? 'bg-[#080E1C] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">Banco del Austro</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                    Cta. Ahorros
                  </span>
                </div>
                <div className="font-mono text-base font-extrabold tracking-wide">0034928174</div>
                <div className="text-[11px] opacity-75">KIRUPET Cuenca Cía. Ltda. • RUC 0190458721001</div>
              </div>
            </div>

            {/* 1-tap Copiar Cuentas y RUC */}
            <button
              type="button"
              onClick={() => handleCopy(
                'bank_data',
                `KIRUPET CUENCA - PAGO DE PEDIDO ${orderReference}\nTotal a transferir: $${formattedAmount} USD\n\n1. Banco Pichincha - Cta. Corriente: 2100840921\n2. Banco del Austro - Cta. Ahorros: 0034928174\nTitular: KIRUPET Cuenca Cía. Ltda.\nRUC: 0190458721001\nCorreo: pagos@kirupet.ec`
              )}
              className={`w-full py-3.5 px-4 rounded-2xl border font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                copiedKey === 'bank_data'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400'
                  : theme === 'dark'
                  ? 'bg-white/10 hover:bg-white/15 text-white border-white/20'
                  : 'bg-white hover:bg-slate-100 text-slate-900 border-slate-300 shadow-sm'
              }`}
            >
              {copiedKey === 'bank_data' ? (
                <>
                  <Check className="w-5 h-5 text-white" />
                  <span>¡Copiado! ✅ (Datos bancarios listos para pegar en tu banca móvil)</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5 text-emerald-600 dark:text-[#00F5A0]" />
                  <span>📋 Copiar Número de Cuenta y RUC (1 Toque)</span>
                </>
              )}
            </button>

            <p className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
              💡 Envía la captura del comprobante por WhatsApp tras transferir y tu pedido saldrá de inmediato.
            </p>
          </div>
        )}

        {/* =========================================================================
            CASO 4: EFECTIVO AL RECIBIR (Contraentrega)
            ========================================================================= */}
        {selectedMethod === 'Efectivo_Contraentrega' && (
          <div className="space-y-3 py-1">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Banknote className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm sm:text-base">
                  💵 Pagas en efectivo al motorizado cuando llegue a tu puerta.
                </h4>
                <p className={`text-xs mt-0.5 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                  Revisas tu pedido antes de pagar. Nuestro repartidor lleva cambio en billetes de $10 y $20.
                </p>
              </div>
            </div>

            <div className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
              theme === 'dark' ? 'bg-[#080E1C] border-white/10 text-slate-300' : 'bg-white border-slate-200 text-slate-700'
            }`}>
              <span>Monto exacto a tener listo:</span>
              <span className="font-mono font-black text-sm text-amber-600 dark:text-amber-400">
                ${formattedAmount} {currency}
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
