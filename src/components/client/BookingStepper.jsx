import React from 'react';
import { useBooking } from '../../context/BookingContext';
import { getTheme } from '../../lib/theme';
import { Check, ChevronRight } from 'lucide-react';

export const BookingStepper = () => {
  const { step, setStep, selectedService, selectedSlot, salon } = useBooking();
  const theme = getTheme(salon?.theme);

  const isTeamMode = (salon?.teamMode === 'team' || salon?.team_mode === 'team') && Array.isArray(salon?.team) && salon.team.length > 1;

  if (step >= 5) return null;

  const steps = isTeamMode ? [
    { num: 1, label: 'Prestation', completed: step > 1, active: step === 1 },
    { num: 2, label: 'Praticienne', completed: step > 2, active: step === 2, disabled: !selectedService },
    { num: 3, label: 'Date & Heure', completed: step > 3, active: step === 3, disabled: !selectedService },
    { num: 4, label: 'Coordonnées & Acompte', completed: step > 4, active: step === 4, disabled: !selectedSlot },
  ] : [
    { num: 1, label: 'Prestation', completed: step > 1, active: step === 1 },
    { num: 2, label: 'Date & Heure', completed: step > 2, active: step === 2, disabled: !selectedService },
    { num: 3, label: 'Coordonnées & Acompte', completed: step > 3, active: step === 3, disabled: !selectedSlot },
  ];

  const totalSteps = steps.length;
  const currentStep = steps.find(s => s.num === step) || steps[0];

  return (
    <div className="mb-6 space-y-2.5">
      {/* Sleek Segmented Progress Bar */}
      <div className={`grid ${isTeamMode ? 'grid-cols-4' : 'grid-cols-3'} gap-1.5 sm:gap-2`}>
        {steps.map((s) => {
          const isDone = s.completed;
          const isCurr = s.active;

          return (
            <div
              key={s.num}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                isDone || isCurr
                  ? `${theme.primary} shadow-2xs`
                  : 'bg-stone-200/80'
              }`}
            />
          );
        })}
      </div>

      {/* Step Header & Interactive Breadcrumbs */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 shrink-0">
            Étape {step}/{totalSteps}
          </span>
          <span className="text-stone-300 text-xs hidden sm:inline">•</span>
          <h3 className="text-xs sm:text-sm font-black text-stone-900 truncate">
            {currentStep.label}
          </h3>
        </div>

        {/* Clickable Quick-Jump Pills for completed steps */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {steps.map((s, idx) => {
            if (!s.completed && !s.active) return null;
            const isClickable = s.completed;

            return (
              <React.Fragment key={s.num}>
                <button
                  type="button"
                  disabled={!isClickable}
                  onClick={() => isClickable && setStep(s.num)}
                  className={`text-[11px] font-bold px-2 py-0.5 rounded-md transition-all flex items-center gap-1 ${
                    s.active
                      ? `${theme.badgeFilled} font-extrabold`
                      : isClickable
                      ? 'text-stone-700 hover:text-stone-900 hover:bg-stone-100 cursor-pointer'
                      : 'text-stone-600 opacity-60'
                  }`}
                  title={isClickable ? `Revenir à l'étape ${s.num}` : undefined}
                >
                  {s.completed && <Check className="w-3 h-3 text-emerald-600 stroke-[3]" />}
                  <span className="hidden md:inline">{s.label}</span>
                  <span className="md:hidden">Étp {s.num}</span>
                </button>
                {idx < steps.length - 1 && steps[idx + 1] && (steps[idx + 1].completed || steps[idx + 1].active) && (
                  <ChevronRight className="w-3 h-3 text-stone-300 hidden sm:inline" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
