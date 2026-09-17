import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { MapPin, Star, ShieldCheck, Share2, Clock, Check, Sparkles, Phone, Heart, Camera, X } from 'lucide-react';
import { SocialLinkPill } from '../common/SocialIcons';

export const SalonHeader = () => {
  const { salon } = useBooking();
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const link = `${origin}/?salon=${salon.slug || 'mon-salon'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-xs border border-pink-100 mb-5">
      {/* Top Announcement Banner (Promo / Flash Alert) */}
      {salon.announcementBanner && (
        <div className="bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600 text-white px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{salon.announcementBanner}</span>
        </div>
      )}

      {/* Cover Banner */}
      <div className="relative h-48 sm:h-64 md:h-72 w-full bg-slate-900 overflow-hidden">
        {salon.coverImage ? (
          <div className="relative w-full h-full overflow-hidden">
            {(salon.coverFit === 'contain' || salon.story?.coverFit === 'contain') && (
              <img
                src={salon.coverImage}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-50 pointer-events-none"
              />
            )}
            <img
              src={salon.coverImage}
              alt={salon.name}
              style={{
                objectPosition: typeof (salon.coverPosition ?? salon.story?.coverPosition) === 'number' || (!isNaN(Number(salon.coverPosition ?? salon.story?.coverPosition)) && (salon.coverPosition ?? salon.story?.coverPosition) !== '')
                  ? `center ${Number(salon.coverPosition ?? salon.story?.coverPosition)}%`
                  : 'center 20%',
                transform: Number(salon.coverZoom ?? salon.story?.coverZoom ?? 100) > 100
                  ? `scale(${Number(salon.coverZoom ?? salon.story?.coverZoom ?? 100) / 100})`
                  : undefined,
                transformOrigin: 'center 20%'
              }}
              className={`relative w-full h-full transition-all duration-200 ${
                (salon.coverFit === 'contain' || salon.story?.coverFit === 'contain') ? 'object-contain' : 'object-cover'
              }`}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent pointer-events-none" />
          </div>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-pink-950 opacity-95 flex items-center justify-center">
            <div className="text-center opacity-30">
              <Sparkles className="w-12 h-12 text-pink-300 mx-auto" />
            </div>
          </div>
        )}
        
        {/* Share button */}
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/30 backdrop-blur-md text-white text-xs font-bold hover:bg-white/50 transition-all border border-white/30 cursor-pointer shadow-xs"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-pink-200" /> : <Share2 className="w-3.5 h-3.5" />}
            <span>{copied ? 'Lien copié !' : 'Partager'}</span>
          </button>
        </div>

        {/* Status badges */}
        <div className="absolute bottom-2.5 left-3.5 right-3.5 flex items-center justify-between text-white">
          <div className="flex items-center gap-1.5 bg-pink-600/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-pink-400/30 text-xs font-bold">
            <ShieldCheck className="w-3.5 h-3.5 text-white" />
            <span>Salon Agréé Appointfy</span>
          </div>

          <span className="text-[11px] text-emerald-200 font-bold flex items-center gap-1.5 bg-emerald-950/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-emerald-400/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Ouvert aujourd'hui
          </span>
        </div>
      </div>

      {/* Salon info */}
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          {salon.avatarImage ? (
            <img
              src={salon.avatarImage}
              alt={salon.name}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl object-cover ring-4 ring-white shadow-md -mt-8 sm:-mt-10 bg-white shrink-0"
            />
          ) : (
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-pink-600 to-rose-500 text-white font-black text-xl flex items-center justify-center ring-4 ring-white shadow-md -mt-8 sm:-mt-10 shrink-0">
              {salon.name?.charAt(0) || 'S'}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black text-slate-900 truncate">{salon.name}</h1>
              <ShieldCheck className="w-4 h-4 text-pink-600 fill-pink-100 shrink-0" title="Certifié Appointfy" />
            </div>
            <p className="text-xs text-slate-500 font-medium line-clamp-1">{salon.tagline}</p>
          </div>
        </div>

        {/* Address & Hours */}
        <div className="mt-3.5 pt-3 border-t border-pink-50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 text-slate-700 truncate">
            <MapPin className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span className="truncate">{salon.address}</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-700 shrink-0">
            <Clock className="w-3.5 h-3.5 text-pink-600 shrink-0" />
            <span>{salon.hours}</span>
          </div>
        </div>

        {/* Badges */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            🐧 Acompte Wave
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
            <Sparkles className="w-3 h-3 text-pink-600" />
            Créneau 100% garanti
          </span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
            Zéro téléchargement
          </span>
          {salon.instagram && (
            <SocialLinkPill network="instagram" value={salon.instagram} showHandle={true} />
          )}
          {salon.tiktok && (
            <SocialLinkPill network="tiktok" value={salon.tiktok} showHandle={true} />
          )}
          {salon.facebook && (
            <SocialLinkPill network="facebook" value={salon.facebook} showHandle={true} />
          )}
        </div>
      </div>

    </div>
  );
};

