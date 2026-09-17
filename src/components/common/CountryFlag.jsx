import React, { useState } from 'react';

/**
 * Composant de drapeaux nationaux ultra-réalistes et nets pour l'Afrique de l'Ouest.
 * Résout le problème de Windows qui affiche des lettres de code ISO (ex: "SN") au lieu de vrais drapeaux.
 */
export const CountryFlag = ({ code = 'SN', className = 'w-7 h-5 rounded object-cover shadow-2xs border border-slate-200' }) => {
  const [imgError, setImgError] = useState(false);
  const normalized = (code || 'SN').toUpperCase();

  // Si l'image CDN est disponible, affichage haute résolution avec coins arrondis
  if (!imgError) {
    return (
      <img
        src={`https://flagcdn.com/w80/${normalized.toLowerCase()}.png`}
        srcSet={`https://flagcdn.com/w160/${normalized.toLowerCase()}.png 2x`}
        alt={`Drapeau ${normalized}`}
        className={className}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    );
  }

  // Repli SVG vectoriel natif 100% hors ligne et instantané
  switch (normalized) {
    case 'SN': // Sénégal : Vert, Jaune, Rouge avec étoile verte
      return (
        <svg viewBox="0 0 900 600" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="600" fill="#00853f"/>
          <rect x="300" width="300" height="600" fill="#fdef42"/>
          <rect x="600" width="300" height="600" fill="#e31b23"/>
          <polygon points="450,210 478,285 558,285 493,332 518,407 450,360 382,407 407,332 342,285 422,285" fill="#00853f"/>
        </svg>
      );

    case 'CI': // Côte d'Ivoire : Orange, Blanc, Vert
      return (
        <svg viewBox="0 0 900 600" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="600" fill="#f77f00"/>
          <rect x="300" width="300" height="600" fill="#ffffff"/>
          <rect x="600" width="300" height="600" fill="#009e60"/>
        </svg>
      );

    case 'ML': // Mali : Vert, Jaune, Rouge
      return (
        <svg viewBox="0 0 900 600" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="300" height="600" fill="#14b53a"/>
          <rect x="300" width="300" height="600" fill="#fcd116"/>
          <rect x="600" width="300" height="600" fill="#ce1126"/>
        </svg>
      );

    case 'BJ': // Bénin : Vert à gauche, Jaune et Rouge à droite
      return (
        <svg viewBox="0 0 900 600" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="360" height="600" fill="#008751"/>
          <rect x="360" width="540" height="300" fill="#fcd116"/>
          <rect x="360" y="300" width="540" height="300" fill="#e8112d"/>
        </svg>
      );

    case 'TG': // Togo : 5 bandes vert/jaune, canton rouge avec étoile blanche
      return (
        <svg viewBox="0 0 1000 600" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="1000" height="120" fill="#006a4e"/>
          <rect y="120" width="1000" height="120" fill="#ffce00"/>
          <rect y="240" width="1000" height="120" fill="#006a4e"/>
          <rect y="360" width="1000" height="120" fill="#ffce00"/>
          <rect y="480" width="1000" height="120" fill="#006a4e"/>
          <rect width="360" height="360" fill="#d21034"/>
          <polygon points="180,90 203,150 267,150 215,188 235,248 180,210 125,248 145,188 93,150 157,150" fill="#ffffff"/>
        </svg>
      );

    case 'BF': // Burkina Faso : Rouge, Vert avec étoile jaune
      return (
        <svg viewBox="0 0 900 600" className={className} xmlns="http://www.w3.org/2000/svg">
          <rect width="900" height="300" fill="#ef2b2d"/>
          <rect y="300" width="900" height="300" fill="#009e49"/>
          <polygon points="450,210 478,285 558,285 493,332 518,407 450,360 382,407 407,332 342,285 422,285" fill="#fcd116"/>
        </svg>
      );

    default:
      return <span className="font-bold text-xs text-slate-700">{normalized}</span>;
  }
};
