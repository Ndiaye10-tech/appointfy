import React, { useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { useBooking } from '../../context/BookingContext';
import { Bell, Volume2, X, Sparkles, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';

export const NotificationToast = () => {
  const { activeToast, dismissToast } = useNotifications();
  const { setCurrentView } = useBooking();

  // Auto-fermeture après 8 secondes si pas touché
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 8000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  const isTest = activeToast.type === 'test';

  const handleGoToPlanning = () => {
    dismissToast();
    setCurrentView('salon');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm sm:max-w-md w-full px-3 pointer-events-auto animate-in fade-in slide-in-from-top-6 duration-300">
      <div className={`relative overflow-hidden rounded-3xl border-2 shadow-2xl backdrop-blur-xl p-4 sm:p-5 transition-all ${
        isTest
          ? 'bg-amber-50/95 border-amber-300 text-amber-950 shadow-amber-500/20'
          : 'bg-white/95 border-pink-400 text-slate-900 shadow-pink-500/25 ring-4 ring-pink-500/10'
      }`}>
        
        {/* Glow & Soundwave animation bar */}
        <div className={`absolute top-0 left-0 right-0 h-1.5 ${
          isTest ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 animate-pulse' : 'bg-gradient-to-r from-pink-500 via-rose-400 to-fuchsia-500 animate-pulse'
        }`} />

        <div className="flex items-start gap-3 sm:gap-4 mt-1">
          {/* Animated sound icon */}
          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
            isTest
              ? 'bg-amber-500 text-white animate-bounce'
              : 'bg-gradient-to-tr from-pink-600 to-rose-500 text-white animate-bounce'
          }`}>
            <Volume2 className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="flex-1 min-w-0 pr-6">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                isTest ? 'bg-amber-200 text-amber-900' : 'bg-pink-100 text-pink-700'
              }`}>
                {isTest ? 'TEST SONORE ACTIF' : 'NOUVELLE RÉSERVATION !'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">À l'instant</span>
            </div>

            <h4 className="font-extrabold text-sm sm:text-base text-slate-950 mt-1 leading-snug truncate">
              {activeToast.title}
            </h4>

            <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
              {activeToast.message}
            </p>

            {/* Quick Actions */}
            {!isTest && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={handleGoToPlanning}
                  className="px-3.5 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Ouvrir le Planning</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={dismissToast}
            aria-label="Fermer"
            className="absolute top-3 right-3 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
