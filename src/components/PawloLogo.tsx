import React from 'react';

interface PawloLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  cityBadge?: string;
  theme?: 'dark' | 'light';
  className?: string;
}

export const PawloLogo: React.FC<PawloLogoProps> = ({
  size = 'md',
  showWordmark = true,
  cityBadge,
  theme = 'dark',
  className = ''
}) => {
  const sizeMap = {
    sm: { box: 36, svg: 32, title: 'text-xl', sub: 'text-[8px]', badge: 'text-[9px] px-2 py-0.5' },
    md: { box: 44, svg: 40, title: 'text-2xl', sub: 'text-[9px]', badge: 'text-[10px] px-2.5 py-0.5' },
    lg: { box: 56, svg: 50, title: 'text-3xl', sub: 'text-[10px]', badge: 'text-xs px-3 py-1' },
    xl: { box: 72, svg: 64, title: 'text-4xl', sub: 'text-xs', badge: 'text-xs px-3.5 py-1' }
  };

  const s = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3.5 select-none group cursor-pointer ${className}`}>
      {/* Isotipo de Precisión: The Orbital Paw */}
      <div 
        className="relative flex items-center justify-center rounded-2xl transition-all duration-500 group-hover:scale-105"
        style={{ width: s.box, height: s.box }}
      >
        {/* Halo de luz posterior reactivo */}
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-[#00F5A0]/30 via-[#00D9F5]/20 to-[#6366F1]/30 blur-md opacity-70 group-hover:opacity-100 transition duration-500"></div>

        <svg
          width={s.box}
          height={s.box}
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="relative z-10 drop-shadow-sm"
        >
          <defs>
            <radialGradient id="pawlo-bg-core" cx="50%" cy="0%" r="95%">
              <stop offset="0%" stopColor={theme === 'dark' ? '#131F3A' : '#0B1325'} />
              <stop offset="100%" stopColor="#040710" />
            </radialGradient>

            <linearGradient id="pawlo-spectrum" x1="10%" y1="5%" x2="90%" y2="95%">
              <stop offset="0%" stopColor="#00F5A0" />
              <stop offset="52%" stopColor="#00D9F5" />
              <stop offset="100%" stopColor="#6366F1" />
            </linearGradient>

            <linearGradient id="pawlo-heart-core" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FF2A5F" />
              <stop offset="100%" stopColor="#FF758C" />
            </linearGradient>

            <linearGradient id="pawlo-rim" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45" />
              <stop offset="50%" stopColor="#00F5A0" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366F1" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Escudo Squircle de Titanio/Obsidiana */}
          <rect
            x="3"
            y="3"
            width="114"
            height="114"
            rx="32"
            fill="url(#pawlo-bg-core)"
            stroke="url(#pawlo-rim)"
            strokeWidth="2.5"
          />

          {/* Anillo de Telemetría Espacial */}
          <circle
            cx="60"
            cy="64"
            r="41"
            stroke="url(#pawlo-spectrum)"
            strokeOpacity="0.22"
            strokeWidth="1.5"
            strokeDasharray="4 4"
            className="origin-center group-hover:rotate-45 transition-transform duration-1000"
          />

          {/* 4 Nodos Satelitales en Proporción Áurea */}
          <g transform="rotate(-27 29 52)">
            <rect x="20" y="39" width="17.5" height="25" rx="8.75" fill="url(#pawlo-spectrum)" />
          </g>
          <g transform="rotate(-9 47 36)">
            <rect x="38" y="22" width="18" height="27" rx="9" fill="url(#pawlo-spectrum)" />
          </g>
          <g transform="rotate(9 73 36)">
            <rect x="64" y="22" width="18" height="27" rx="9" fill="url(#pawlo-spectrum)" />
          </g>
          <g transform="rotate(27 91 52)">
            <rect x="82.5" y="39" width="17.5" height="25" rx="8.75" fill="url(#pawlo-spectrum)" />
          </g>

          {/* Almohadilla Central (Arco Orgánico + Pin Geodésico) */}
          <path
            d="M60 52 C41 52, 30 66, 35 82 C38.5 92, 49 97, 60 97 C71 97, 81.5 92, 85 82 C90 66, 79 52, 60 52 Z"
            fill="url(#pawlo-spectrum)"
          />

          {/* Cámara Oscura del Pulso */}
          <circle cx="60" cy="76" r="11.5" fill="#040710" />

          {/* Corazón Biométrico Interior */}
          <path
            d="M60 71.5 C58 68.5, 53.5 69.5, 53.5 73 C53.5 76.5, 60 81.5, 60 81.5 C60 81.5, 66.5 76.5, 66.5 73 C66.5 69.5, 62 68.5, 60 71.5 Z"
            fill="url(#pawlo-heart-core)"
          />
        </svg>

        {/* Indicador de Nodo en Vivo */}
        <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3 z-20">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00F5A0] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-[#00F5A0] border-2 border-[#03060C]"></span>
        </span>
      </div>

      {/* Logotipo Tipográfico Personalizado (Custom Wordmark) */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2.5">
            <span 
              className={`font-display font-black tracking-[-0.04em] leading-none flex items-center ${s.title} ${
                theme === 'dark' ? 'text-white' : 'text-slate-950'
              }`}
              style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
            >
              PAWL
              <span className="bg-gradient-to-tr from-[#00F5A0] via-[#00D9F5] to-[#6366F1] bg-clip-text text-transparent">
                O
              </span>
              <span className="text-[#00F5A0] ml-0.5 font-black">.</span>
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
            <span className={`font-mono uppercase tracking-[0.22em] font-semibold ${s.sub} ${
              theme === 'dark' ? 'text-slate-400' : 'text-slate-500'
            }`}>
              URBAN PET OS
            </span>
            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-indigo-500/15 text-indigo-400 font-bold">
              v2.6
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default PawloLogo;
