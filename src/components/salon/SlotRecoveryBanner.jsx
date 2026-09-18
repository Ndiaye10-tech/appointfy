import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { Zap, Bell, Check, X, Users, ArrowRight } from 'lucide-react';

export const SlotRecoveryBanner = () => {
  const { slotAlert, closeSlotAlert } = useBooking();
  const [broadcasted, setBroadcasted] = useState(false);

  if (!slotAlert) return null;

  const handleBroadcast = () => {
    setBroadcasted(true);
    setTimeout(() => {
      setBroadcasted(false);
      closeSlotAlert();
    }, 3500);
  };

  return (
    <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 text-white shadow-lg animate-in slide-in-from-top-3 duration-300 relative overflow-hidden">
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-white animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full">
                Flash Anti-Perte de Chiffre d'Affaires
              </span>
            </div>
            <h4 className="font-extrabold text-base mt-0.5">
              Créneau de {slotAlert.time} libéré ! ({slotAlert.serviceName})
            </h4>
            <p className="text-xs text-white/90 mt-0.5">
              {slotAlert.potentialClients} clientes ont demandé une alerte dès qu'une place se libère.
            </p>
          </div>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {broadcasted ? (
            <div className="flex items-center gap-1.5 bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs font-bold shadow-md">
              <Check className="w-4 h-4 text-emerald-600" />
              <span>Alerte envoyée aux clientes ! Créneau en cours de réattribution</span>
            </div>
          ) : (
            <button
              onClick={handleBroadcast}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-black text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Bell className="w-4 h-4 text-amber-400" />
              <span>Diffuser le créneau aux clientes en attente</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={closeSlotAlert}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
