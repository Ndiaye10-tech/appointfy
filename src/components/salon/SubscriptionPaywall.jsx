import React from 'react';
import { Lock, ShieldCheck, AlertTriangle, Zap, CheckCircle2, Calendar, Users, MessageCircle, Phone, ArrowRight } from 'lucide-react';
import { useBooking, formatFCFA } from '../../context/BookingContext';

export const SubscriptionPaywall = ({ onGoToSubscription }) => {
  const { salon } = useBooking();
  const price = 9900;

  return (
    <div className="max-w-3xl mx-auto py-6 sm:py-10 px-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden">
        
        {/* En-tête d'alerte */}
        <div className="bg-gradient-to-r from-rose-600 via-pink-600 to-amber-600 p-6 sm:p-8 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="w-16 h-16 rounded-3xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-4 border border-white/30 shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider mb-2">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-200" />
            <span>Période d'essai de 14 jours terminée</span>
          </span>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">
            Activez votre abonnement pour débloquer votre salon
          </h2>
          
          <p className="text-white/90 text-xs sm:text-sm max-w-lg mx-auto mt-2 leading-relaxed">
            Votre période d'essai gratuit est arrivée à échéance. Pour continuer à gérer votre planning et encaisser les acomptes Wave de vos clientes, activez votre abonnement mensuel.
          </p>
        </div>

        {/* Corps du Paywall : Rassurance & Offre */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Bloc de rassurance capital : 0 donnée perdue */}
          <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 flex items-start gap-3.5">
            <div className="p-2 rounded-xl bg-emerald-100 text-emerald-700 shrink-0 mt-0.5">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-xs sm:text-sm text-emerald-950">
                Vos données sont 100% conservées en sécurité
              </h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Votre fichier clientes, vos prestations, votre historique et la configuration de votre site sont préservés intacts. Dès la validation de votre règlement, tout est débloqué immédiatement.
              </p>
            </div>
          </div>

          {/* Ce que comprend l'abonnement */}
          <div className="space-y-3">
            <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wider">
              Ce que vous débloquez immédiatement :
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold text-slate-800">Acomptes Wave automatiques</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold text-slate-800">Protection Anti-Lapin (Présence à 94%)</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold text-slate-800">Planning & Prise de RDV 24h/7j</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold text-slate-800">Rappels de rendez-vous WhatsApp</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold text-slate-800">Fichier clientes & Historique des soins</span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-pink-600 shrink-0" />
                <span className="font-semibold text-slate-800">Assistance prioritaire 7j/7</span>
              </div>
            </div>
          </div>

          {/* Tarif & Bouton d'action principal */}
          <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Tarif professionnel
              </span>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-950">
                  {formatFCFA(price)}
                </span>
                <span className="text-xs font-semibold text-slate-500">/ mois sans engagement</span>
              </div>
            </div>

            <button
              onClick={onGoToSubscription}
              className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-pink-500/25 transition-all cursor-pointer hover:scale-102"
            >
              <Zap className="w-4 h-4 fill-white" />
              <span>Activer mon abonnement Wave</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
