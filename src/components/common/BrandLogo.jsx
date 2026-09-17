import React from 'react';

export const BrandLogo = ({ size = 'default', showBadge = true, lightText = false }) => {
  const isSmall = size === 'small';
  const isLarge = size === 'large';

  const iconSizes = {
    small: 'w-8 h-8',
    default: 'w-10 h-10',
    large: 'w-12 h-12'
  };

  const textSizes = {
    small: 'text-lg',
    default: 'text-xl',
    large: 'text-2xl sm:text-3xl'
  };

  return (
    <div className="flex items-center gap-3 select-none">
      {/* Sleek Vector Emblem (Chic & Fintech Protection Mark) */}
      <div className={`${iconSizes[size]} shrink-0 rounded-2xl bg-gradient-to-tr from-pink-600 via-rose-500 to-pink-400 p-[1.5px] shadow-md shadow-pink-500/20`}>
        <div className="w-full h-full rounded-[14px] bg-white flex items-center justify-center overflow-hidden relative group">
          
          {/* Subtle inner ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-rose-50/60" />

          {/* Precision SVG Emblem: Interlocking Security & Time Ring */}
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 relative z-10"
          >
            <defs>
              <linearGradient id="alGrad" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                <stop stopColor="#DB2777" />
                <stop offset="0.5" stopColor="#E11D48" />
                <stop offset="1" stopColor="#F43F5E" />
              </linearGradient>
              <linearGradient id="goldGrad" x1="10" y1="6" x2="24" y2="26" gradientUnits="userSpaceOnUse">
                <stop stopColor="#F59E0B" />
                <stop offset="1" stopColor="#EC4899" />
              </linearGradient>
            </defs>

            {/* Stylized Modern Shield / Arch (Anti No-Show & Beauty mark) */}
            <path
              d="M16 3C10.5 3 6 7.5 6 13C6 20 16 29 16 29C16 29 26 20 26 13C26 7.5 21.5 3 16 3Z"
              stroke="url(#alGrad)"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
              opacity="0.9"
            />

            {/* Interlocking dynamic check / guarantee loop */}
            <path
              d="M11.5 14L14.5 17L20.5 11"
              stroke="url(#alGrad)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Subtle luxury dot accent */}
            <circle cx="16" cy="7" r="1.5" fill="url(#goldGrad)" />
          </svg>
        </div>
      </div>

      {/* Typography */}
      <div className="flex items-center">
        <span className={`${textSizes[size]} font-black tracking-tight ${lightText ? 'text-white' : 'text-slate-950'}`}>
          Appointfy<span className="text-pink-600">.</span>
        </span>
      </div>
    </div>
  );
};
