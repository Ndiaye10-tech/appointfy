import React from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { getTheme } from '../../lib/theme';
import { Users, ChevronLeft, ArrowRight, Check, Sparkles, Award } from 'lucide-react';

export const PractitionerSelector = () => {
  const {
    salon,
    selectedService,
    selectedPractitioner,
    selectPractitioner,
    setStep
  } = useBooking();

  const theme = getTheme(salon?.theme);
  const team = Array.isArray(salon?.team) ? salon.team : [];

  const handleSelect = (member) => {
    selectPractitioner(member);
    setStep(3);
  };

  const isAnySelected = !selectedPractitioner || selectedPractitioner === 'any';

  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      {/* Recap selected service + Retour Prestation */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setStep(1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors shrink-0 shadow-2xs cursor-pointer"
            title="Changer de prestation"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.primaryText} block`}>
              Prestation choisie
            </span>
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
              {selectedService?.name}
            </h4>
            <span className="text-[11px] text-stone-500">
              {selectedService?.duration} • Total : {formatFCFA(selectedService?.price)}
            </span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">Acompte</span>
          <span className={`text-xs font-black ${theme.badgeFilled} px-2.5 py-1 rounded-xl border ${theme.borderMedium} inline-block shadow-2xs`}>
            {formatFCFA(selectedService?.deposit)}
          </span>
        </div>
      </div>

      {/* Step Title */}
      <div>
        <h3 className="text-sm sm:text-base font-black text-stone-900">
          Avec qui souhaitez-vous votre rendez-vous ?
        </h3>
        <p className="text-xs text-stone-500 mt-0.5">
          Sélectionnez une collaboratrice ou toute l'équipe pour obtenir le créneau le plus rapide.
        </p>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Card 1: Toute l'équipe / Première disponible */}
        <div
          onClick={() => handleSelect(null)}
          className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group ${isAnySelected ? `${theme.primaryBorder} bg-white shadow-sm ring-2 ${theme.ring}` : 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-2xs'}`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Le plus rapide
            </span>
            {isAnySelected && (
              <span className={`w-5 h-5 rounded-full ${theme.primary} text-white flex items-center justify-center text-xs shadow-2xs`}>
                <Check className="w-3 h-3 stroke-[3]" />
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl ${theme.bgLight} ${theme.primaryText} flex items-center justify-center shrink-0`}>
              <Users className="w-6 h-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-stone-900 text-xs sm:text-base">
                Toute l'équipe
              </h4>
              <p className="text-xs text-stone-500 mt-0.5">
                Première praticienne libre
              </p>
            </div>
          </div>

          <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold">
            <span className={isAnySelected ? theme.primaryText : 'text-stone-500'}>
              {isAnySelected ? 'Sélectionné' : 'Choisir'}
            </span>
            <ArrowRight className={`w-3.5 h-3.5 ${isAnySelected ? theme.primaryText : 'text-stone-400'}`} />
          </div>
        </div>

        {/* Practitioner Cards */}
        {team.map((member) => {
          const isSelected = selectedPractitioner && selectedPractitioner.name === member.name;

          return (
            <div
              key={member.id || member.name}
              onClick={() => handleSelect(member)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer relative flex flex-col justify-between group ${isSelected ? `${theme.primaryBorder} bg-white shadow-sm ring-2 ${theme.ring}` : 'bg-white border-stone-200/80 hover:border-stone-300 hover:shadow-2xs'}`}
            >
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${theme.badgeFilled} border ${theme.borderLight}`}>
                  {member.role || 'Praticienne'}
                </span>
                {isSelected && (
                  <span className={`w-5 h-5 rounded-full ${theme.primary} text-white flex items-center justify-center text-xs shadow-2xs`}>
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  {(member.avatar || member.image) ? (
                    <img
                      src={member.avatar || member.image}
                      alt={member.name}
                      className="w-12 h-12 rounded-xl object-cover border border-stone-100 shadow-2xs"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div
                    style={{ display: (member.avatar || member.image) ? 'none' : 'flex' }}
                    className={`w-12 h-12 rounded-xl ${theme.bgLight} ${theme.primaryText} items-center justify-center font-bold text-base border border-stone-200`}
                  >
                    {member.name ? member.name.charAt(0).toUpperCase() : 'P'}
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-stone-900 text-xs sm:text-base truncate">
                    {member.name}
                  </h4>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
                    {Array.isArray(member.specialties) && member.specialties.length > 0
                      ? member.specialties.slice(0, 2).join(' • ')
                      : (member.role || `Spécialiste chez ${salon?.name || 'le salon'}`)}
                  </p>
                </div>
              </div>

              <div className="mt-3.5 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs font-bold">
                <span className={isSelected ? theme.primaryText : 'text-stone-500'}>
                  {isSelected ? 'Sélectionnée' : 'Choisir'}
                </span>
                <ArrowRight className={`w-3.5 h-3.5 ${isSelected ? theme.primaryText : 'text-stone-400'}`} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
