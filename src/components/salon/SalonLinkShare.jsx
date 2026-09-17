import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Copy, Check, Share2 } from 'lucide-react';

export const SalonLinkShare = () => {
  const { salon } = useBooking();
  const [copied, setCopied] = useState(false);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const realUrl = `${origin}/?salon=${salon.slug || 'mon-salon'}`;
  const displayUrl = typeof window !== 'undefined' ? `${window.location.host}/?salon=${salon.slug || 'mon-salon'}` : realUrl;

  const handleCopy = () => {
    navigator.clipboard.writeText(realUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-gradient-to-br from-pink-600 via-rose-500 to-pink-700 rounded-3xl p-5 sm:p-6 text-white mb-6 shadow-xl shadow-pink-500/10">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center gap-2 text-pink-100 text-xs font-bold uppercase tracking-wider mb-1">
            <Share2 className="w-3.5 h-3.5" />
            <span>Votre vrai lien client à coller en bio Instagram, TikTok & WhatsApp</span>
          </div>
          <h3 className="text-lg sm:text-xl font-black">
            Partagez ce lien : vos clientes réservent et paient l'acompte directement
          </h3>
          <p className="text-xs text-pink-100 mt-1 max-w-xl">
            Cliquez sur <strong>Copier</strong> pour le coller partout, ou sur <strong>Ouvrir</strong> pour voir exactement la page vue par vos clientes.
          </p>
        </div>

        {/* Copy Box */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto bg-white p-2 rounded-2xl shadow-sm">
          <div className="px-3 py-1.5 text-xs sm:text-sm font-mono font-black text-pink-700 select-all truncate max-w-[220px] sm:max-w-xs">
            {displayUrl}
          </div>
          <button
            onClick={handleCopy}
            className="px-3.5 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copié !' : 'Copier'}</span>
          </button>
          <a
            href={realUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1 transition-all shrink-0 cursor-pointer"
            title="Ouvrir dans un nouvel onglet"
          >
            <span>Ouvrir ↗</span>
          </a>
        </div>

      </div>
    </div>
  );
};
