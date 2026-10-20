import React from 'react';

export interface KiruPetLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  cityBadge?: string;
  theme?: 'dark' | 'light';
  className?: string;
}

export type PawloLogoProps = KiruPetLogoProps;

export const KiruPetLogo: React.FC<KiruPetLogoProps> = ({
  size = 'md',
  showWordmark = true,
  cityBadge,
  theme = 'dark',
  className = ''
}) => {
  const sizeMap = {
    sm: { box: 36, svg: 32, title: 'text-xl', sub: 'text-[7.5px]', badge: 'text-[9px] px-2 py-0.5' },
    md: { box: 44, svg: 40, title: 'text-2xl', sub: 'text-[8.5px]', badge: 'text-[10px] px-2.5 py-0.5' },
    lg: { box: 56, svg: 50, title: 'text-3xl', sub: 'text-[9.5px]', badge: 'text-xs px-3 py-1' },
    xl: { box: 72, svg: 64, title: 'text-4xl', sub: 'text-[11px]', badge: 'text-xs px-3.5 py-1' }
  };

  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3.5 select-none group cursor-pointer ${className}`}>
      {/* Isotipo Guardián: KiruPet Guardian Paw & Heart Shield */}
      <div 
        className="relative flex items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-105"
        style={{ width: s.box, height: s.box }}
      >
        {/* Halo de luz posterior reactivo esmeralda-cyan */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#00F5A0]/35 via-[#00D9F5]/25 to-[#6366F1]/20 blur-md opacity-75 group-hover:opacity-100 transition duration-500"></div>

        <svg
          width={s.box}
          height={s.box}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-sm"
        >
          <defs>
            <radialGradient id="kirupet-bg-core" cx="50%" cy="0%" r="95%">
              <stop offset="0%" stopColor={theme === 'dark' ? '#111E38' : '#0B1325'} />
              <stop offset="100%" stopColor="#040710" />
            </radialGradient>

            <linearGradient id="kirupet-spectrum" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00F5A0" />
              <stop offset="60%" stopColor="#00D9F5" />
              <stop offset="100%" stopColor="#38BDF8" />
            </linearGradient>

            <linearGradient id="kirupet-heart-core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF2A5F" />
              <stop offset="100%" stopColor="#FF758C" />
            </linearGradient>

            <linearGradient id="kirupet-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
              <stop offset="50%" stopColor="#00F5A0" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#00D9F5" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Escudo Guardián Squircle con Borde Iridiscente */}
          <rect
            x="3"
            y="3"
            width="114"
            height="114"
            rx="32"
            fill="url(#kirupet-bg-core)"
            stroke="url(#kirupet-rim)"
            strokeWidth="2.5"
          />

          {/* Anillo Protector de Telemetría */}
          <circle
            cx="60"
            cy="64"
            r="41"
            stroke="url(#kirupet-spectrum)"
            strokeOpacity="0.25"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="origin-center group-hover:rotate-45 transition-transform duration-1000"
          />

          {/* 4 Almohadillas Digitales Superiores (Huella Protectora KiruPet) */}
          <g transform="rotate(-27 29 52)">
            <rect x="20" y="39" width="17.5" height="25" rx="8.75" fill="url(#kirupet-spectrum)" />
          </g>
          <g transform="rotate(-9 47 36)">
            <rect x="38" y="22" width="18" height="27" rx="9" fill="url(#kirupet-spectrum)" />
          </g>
          <g transform="rotate(9 73 36)">
            <rect x="64" y="22" width="18" height="27" rx="9" fill="url(#kirupet-spectrum)" />
          </g>
          <g transform="rotate(27 91 52)">
            <rect x="82.5" y="39" width="17.5" height="25" rx="8.75" fill="url(#kirupet-spectrum)" />
          </g>

          {/* Almohadilla Central Guardiana */}
          <path
            d="M60 52 C41 52, 30 66, 35 82 C38.5 92, 49 97, 60 97 C71 97, 81.5 92, 85 82 C90 66, 79 52, 60 52 Z"
            fill="url(#kirupet-spectrum)"
          />

          {/* Cámara Central Biométrica */}
          <circle cx="60" cy="76" r="11.5" fill="#040710" />

          {/* Corazón Interior: Amor & Cuidado KiruPet */}
          <path
            d="M60 71.5 C58 68.5, 53.5 69.5, 53.5 73 C53.5 76.5, 60 81.5, 60 81.5 C60 81.5, 66.5 76.5, 66.5 73 C66.5 69.5, 62 68.5, 60 71.5 Z"
            fill="url(#kirupet-heart-core)"
          />
        </svg>

        {/* Indicador de Nodo Activo */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F5A0] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F5A0] border-2 border-[#03060C]"></span>
        </span>
      </div>

      {/* Logotipo Tipográfico: KIRUPET™ */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span 
              className={`font-display font-black tracking-[-0.035em] leading-none flex items-center ${s.title} ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
              style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
            >
              KIRU
              <span className="bg-gradient-to-r from-[#00F5A0] to-[#00D9F5] bg-clip-text text-transparent ml-0.5">
                PET
              </span>
              <span className="text-[10px] uppercase font-bold text-[#00F5A0] ml-1 self-start tracking-normal">™</span>
            </span>

            {cityBadge && (
              <span 
                className={`font-mono font-bold uppercase tracking-wider rounded-full border flex items-center gap-1.5 transition-colors ${s.badge} ${
                  theme === 'dark'
                    ? 'bg-[#00F5A0]/10 text-[#00F5A0] border-[#00F5A0]/30 shadow-[0_0_12px_rgba(0,245,160,0.12)]'
                    : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[#00F5A0] animate-pulse"></span>
                {cityBadge}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`font-mono uppercase tracking-[0.16em] font-bold ${s.sub} ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              CUIDADO FÁCIL &amp; BÓVEDA MASCOTA
            </span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/15 text-emerald-400 font-bold">
              v2.6
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// Compatibilidad retroactiva total: exportamos ambos nombres para evitar cualquier rotura de imports
export const PawloLogo = KiruPetLogo;
export default KiruPetLogo;
