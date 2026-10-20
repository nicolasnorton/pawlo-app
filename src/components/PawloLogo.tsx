import React from 'react';

interface PawloLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  cityBadge?: string;
  className?: string;
}

export const PawloLogo: React.FC<PawloLogoProps> = ({
  size = 'md',
  showWordmark = true,
  cityBadge,
  className = ''
}) => {
  const sizeMap = {
    sm: { icon: 30, text: 'text-lg', badge: 'text-[9px] px-1.5 py-0.5' },
    md: { icon: 40, text: 'text-xl', badge: 'text-[10px] px-2 py-0.5' },
    lg: { icon: 52, text: 'text-2xl', badge: 'text-xs px-2.5 py-0.5' },
    xl: { icon: 68, text: 'text-3xl', badge: 'text-xs px-3 py-1' }
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Símbolo Isotipo: Huella Biométrica + Nodo Inteligente */}
      <div 
        className="relative flex items-center justify-center rounded-2xl p-2 bg-gradient-to-br from-[#10E7A6]/20 via-[#00F5FF]/10 to-transparent border border-[#10E7A6]/30 shadow-[0_0_20px_rgba(16,231,166,0.2)] group-hover:shadow-[0_0_25px_rgba(16,231,166,0.35)] transition-all duration-300"
        style={{ width: currentSize.icon + 10, height: currentSize.icon + 10 }}
      >
        <svg
          width={currentSize.icon}
          height={currentSize.icon}
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="transform transition-transform duration-300 group-hover:scale-105"
        >
          <defs>
            <linearGradient id="pawlo-grad-primary" x1="10%" y1="0%" x2="90%" y2="100%">
              <stop offset="0%" stopColor="#10E7A6" />
              <stop offset="60%" stopColor="#00F5FF" />
              <stop offset="100%" stopColor="#0099FF" />
            </linearGradient>
            <linearGradient id="pawlo-grad-accent" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FF3366" />
              <stop offset="100%" stopColor="#FF758C" />
            </linearGradient>
            <filter id="pawlo-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10E7A6" floodOpacity="0.4" />
            </filter>
          </defs>

          {/* Dedo 1 (Izquierda) */}
          <path
            d="M26 35 C20 35, 16 43, 19 50 C22 57, 30 55, 33 48 C36 41, 32 35, 26 35 Z"
            fill="url(#pawlo-grad-primary)"
          />
          {/* Dedo 2 (Centro-Izquierda) */}
          <path
            d="M40 20 C34 20, 31 29, 34 37 C37 45, 45 44, 48 36 C51 28, 46 20, 40 20 Z"
            fill="url(#pawlo-grad-primary)"
          />
          {/* Dedo 3 (Centro-Derecha) */}
          <path
            d="M60 20 C54 20, 49 28, 52 36 C55 44, 63 45, 66 37 C69 29, 66 20, 60 20 Z"
            fill="url(#pawlo-grad-primary)"
          />
          {/* Dedo 4 (Derecha) */}
          <path
            d="M74 35 C68 35, 64 41, 67 48 C70 55, 78 57, 81 50 C84 43, 80 35, 74 35 Z"
            fill="url(#pawlo-grad-primary)"
          />

          {/* Almohadilla Central: Huella / Corazón Geoespacial */}
          <path
            d="M50 48 C34 48, 25 61, 29 74 C32 84, 42 89, 50 89 C58 89, 68 84, 71 74 C75 61, 66 48, 50 48 Z"
            fill="url(#pawlo-grad-primary)"
            filter="url(#pawlo-glow)"
          />

          {/* Núcleo Biométrico / Pulso Interior (Corazón de Cuidado) */}
          <circle cx="50" cy="69" r="6.5" fill="#050811" />
          <path
            d="M50 64 C48.5 62, 45.5 63, 45.5 65 C45.5 67.5, 50 71.5, 50 71.5 C50 71.5, 54.5 67.5, 54.5 65 C54.5 63, 51.5 62, 50 64 Z"
            fill="url(#pawlo-grad-accent)"
          />
        </svg>

        {/* Punto de estado activo (Pulsing Node) */}
        <span className="absolute -top-1 -right-1 flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10E7A6] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#10E7A6] border-2 border-[#050811]"></span>
        </span>
      </div>

      {/* Logotipo Tipográfico / Wordmark */}
      {showWordmark && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`font-black tracking-tight text-white font-sans ${currentSize.text} leading-none flex items-center`}>
              PAWLO<span className="text-[#10E7A6] font-bold">.</span>
            </span>
            {cityBadge && (
              <span className={`font-mono font-bold uppercase rounded-full bg-[#10E7A6]/10 text-[#10E7A6] border border-[#10E7A6]/30 flex items-center gap-1 ${currentSize.badge}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-[#10E7A6] inline-block animate-pulse"></span>
                {cityBadge}
              </span>
            )}
          </div>
          <span className="text-[10px] tracking-widest uppercase text-slate-400 font-semibold mt-0.5">
            Pet Care Operating System
          </span>
        </div>
      )}
    </div>
  );
};

export default PawloLogo;
