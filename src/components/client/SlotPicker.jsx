import React, { useState, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { generateNextDays, generateSlots } from '../../lib/schedule';
import { getTheme } from '../../lib/theme';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ArrowRight, ShieldCheck, Sun, Sunset, Moon, AlertCircle, Users, User, Check } from 'lucide-react';

export const SlotPicker = () => {
  const { 
    salon, 
    appointments, 
    selectedService, 
    selectedDate, 
    selectedSlot, 
    selectSlot, 
    selectedPractitioner,
    setStep
  } = useBooking();
  const theme = getTheme(salon?.theme);

  // Generate dynamic 14-day calendar based on salon schedule
  const nextDays = useMemo(() => {
    return generateNextDays(salon?.schedule, 14);
  }, [salon?.schedule]);

  // Find initial day (default to first open day if today is closed)
  const initialDay = useMemo(() => {
    const found = nextDays.find(d => d.label === selectedDate || d.dateStr === selectedDate);
    if (found && found.isOpen) return found;
    const firstOpen = nextDays.find(d => d.isOpen);
    return firstOpen || nextDays[0];
  }, [nextDays, selectedDate]);

  const [selectedDayObj, setSelectedDayObj] = useState(initialDay);
  const [currSlot, setCurrSlot] = useState(selectedSlot || null);

  const activeDay = selectedDayObj || initialDay || nextDays[0] || {
    label: "Aujourd'hui",
    subLabel: "",
    isOpen: true,
    dayName: "Aujourd'hui",
    dateStr: new Date().toISOString().split('T')[0],
    config: { open: true, start: '09:00', end: '19:00', label: 'Aujourd\'hui' }
  };

  const team = Array.isArray(salon?.team) ? salon.team : [];
  const isTeamMode = (salon?.teamMode === 'team' || salon?.team_mode === 'team') && team.length > 1;

  // Generate dynamic slots for selected day with real duration and capacity checks
  const slotsForDay = useMemo(() => {
    if (!activeDay?.isOpen) return [];
    return generateSlots(
      activeDay.config,
      salon?.slotInterval || 45,
      appointments,
      activeDay.dateStr,
      {
        serviceDuration: selectedService?.duration || '45 min',
        selectedPractitioner: selectedPractitioner?.name || null,
        team: team,
        isSolo: !isTeamMode
      }
    );
  }, [activeDay, salon?.slotInterval, appointments, selectedService?.duration, team, isTeamMode, selectedPractitioner]);

  const morningSlots = slotsForDay.filter(s => s?.time && parseInt(s.time.split(':')[0]) < 12);
  const afternoonSlots = slotsForDay.filter(s => {
    if (!s?.time) return false;
    const h = parseInt(s.time.split(':')[0]);
    return h >= 12 && h < 17;
  });
  const eveningSlots = slotsForDay.filter(s => s?.time && parseInt(s.time.split(':')[0]) >= 17);

  const handleConfirmSlot = () => {
    if (currSlot && activeDay?.isOpen) {
      const fullDateLabel = `${activeDay.label} (${activeDay.subLabel})`;
      selectSlot(fullDateLabel, currSlot, activeDay.dateStr);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* Recap selected service + Retour in a single compact responsive header */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-stone-50/80 border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={() => setStep(isTeamMode ? 2 : 1)}
            className="p-2 rounded-xl bg-white border border-stone-200 text-stone-700 hover:bg-stone-100 transition-colors shrink-0 shadow-2xs cursor-pointer"
            title={isTeamMode ? "Changer de praticienne" : "Changer de prestation"}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${theme.primaryText} block`}>Prestation choisie</span>
            <h4 className="font-bold text-stone-900 text-xs sm:text-sm truncate">{selectedService?.name}</h4>
            <span className="text-[11px] text-stone-500">{selectedService?.duration} • Total : {formatFCFA(selectedService?.price)}</span>
          </div>
        </div>
        <div className="text-right shrink-0">
          <span className="text-[10px] font-bold uppercase text-stone-400 block">Acompte</span>
          <span className={`text-xs font-black ${theme.badgeFilled} px-2.5 py-1 rounded-xl border ${theme.borderMedium} inline-block shadow-2xs`}>
            {formatFCFA(selectedService?.deposit)}
          </span>
        </div>
      </div>

      {/* Practitioner Banner (if team mode) */}
      {isTeamMode && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-white border border-stone-200/80 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={`w-8 h-8 rounded-xl ${theme.bgLight} ${theme.primaryText} flex items-center justify-center shrink-0`}>
              {selectedPractitioner ? <User className="w-4 h-4" /> : <Users className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block">Praticienne</span>
              <h5 className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                {selectedPractitioner ? selectedPractitioner.name : "Toute l'équipe (Première disponible)"}
              </h5>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStep(2)}
            className={`text-xs font-bold ${theme.primaryText} hover:underline shrink-0 cursor-pointer px-2 py-1 rounded-lg hover:${theme.bgLight} transition-colors`}
          >
            Changer
          </button>
        </div>
      )}

      {/* Date Picker (Horizontal) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-wider text-stone-500 flex items-center gap-1.5 mb-2.5">
          <CalendarIcon className={`w-3.5 h-3.5 ${theme.iconColor}`} />
          <span>1. Sélectionnez votre jour</span>
        </h3>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {nextDays.map((item) => {
            const isSelected = activeDay?.dateStr === item.dateStr;
            return (
              <button
                key={item.dateStr}
                type="button"
                onClick={() => {
                  setSelectedDayObj(item);
                  setCurrSlot(null);
                }}
                className={`flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-2xl min-w-[76px] sm:min-w-[90px] border transition-all cursor-pointer shrink-0 relative ${
                  !item.isOpen
                    ? 'border-stone-100 bg-stone-50 text-stone-300 opacity-60'
                    : isSelected
                    ? `${theme.primaryBorder} ${theme.primary} text-white shadow-sm ring-2 ${theme.ring}`
                    : 'border-stone-200/80 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isSelected ? 'text-white/80' : 'text-stone-400'
                }`}>
                  {item.label}
                </span>
                <span className="text-xs sm:text-sm font-black mt-0.5">
                  {item.subLabel}
                </span>
                {!item.isOpen && (
                  <span className="text-[9px] font-bold text-rose-400 mt-0.5">
                    Fermé
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots Groups */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Clock className={`w-3.5 h-3.5 ${theme.iconColor}`} />
          <span>2. Choisissez votre heure ({activeDay?.label} - {activeDay?.subLabel})</span>
        </h3>

        {!activeDay?.isOpen ? (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">Le salon est fermé ce jour ({activeDay?.dayName})</h4>
            <p className="text-xs text-slate-500">Veuillez choisir une autre date d'ouverture dans le calendrier ci-dessus.</p>
          </div>
        ) : slotsForDay.length === 0 ? (
          <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-amber-500 mx-auto" />
            <h4 className="font-bold text-amber-900 text-sm">Aucun créneau disponible ce jour</h4>
            <p className="text-xs text-amber-700">Tous les créneaux pour cette date sont complets ou le salon ne prend pas de rendez-vous sur cette plage horaire.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Matin */}
            {morningSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-2">
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>Matinée</span>
                </div>
                <div className="grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {morningSlots.map((slot) => {
                    const isSelected = currSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setCurrSlot(slot.time)}
                        title={!slot.available ? (slot.reason || 'Créneau occupé') : 'Créneau disponible'}
                        className={`py-2.5 px-1 rounded-xl text-xs sm:text-sm transition-all flex flex-col items-center justify-center cursor-pointer ${
                          !slot.available
                            ? 'bg-stone-50 border border-stone-200/60 text-stone-300 cursor-not-allowed line-through opacity-60'
                            : isSelected
                            ? `${theme.primary} text-white font-black shadow-xs ring-2 ${theme.ring} scale-[1.02]`
                            : `bg-white border border-stone-200/80 text-stone-800 hover:border-stone-400 hover:shadow-2xs font-bold`
                        }`}
                      >
                        <span className="font-extrabold">{slot.time}</span>
                        {!slot.available && (
                          <span className="text-[9px] no-underline font-medium text-stone-400 truncate max-w-full px-1">
                            Occupé
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Après-midi */}
            {afternoonSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-2">
                  <Sunset className="w-3.5 h-3.5 text-rose-500" />
                  <span>Après-midi</span>
                </div>
                <div className="grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {afternoonSlots.map((slot) => {
                    const isSelected = currSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setCurrSlot(slot.time)}
                        title={!slot.available ? (slot.reason || 'Créneau occupé') : 'Créneau disponible'}
                        className={`py-2.5 px-1 rounded-xl text-xs sm:text-sm transition-all flex flex-col items-center justify-center cursor-pointer ${
                          !slot.available
                            ? 'bg-stone-50 border border-stone-200/60 text-stone-300 cursor-not-allowed line-through opacity-60'
                            : isSelected
                            ? `${theme.primary} text-white font-black shadow-xs ring-2 ${theme.ring} scale-[1.02]`
                            : `bg-white border border-stone-200/80 text-stone-800 hover:border-stone-400 hover:shadow-2xs font-bold`
                        }`}
                      >
                        <span className="font-extrabold">{slot.time}</span>
                        {!slot.available && (
                          <span className="text-[9px] no-underline font-medium text-stone-400 truncate max-w-full px-1">
                            Occupé
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Soir */}
            {eveningSlots.length > 0 && (
              <div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 mb-2">
                  <Moon className="w-3.5 h-3.5 text-purple-500" />
                  <span>Fin de journée</span>
                </div>
                <div className="grid grid-cols-3 min-[440px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {eveningSlots.map((slot) => {
                    const isSelected = currSlot === slot.time;
                    return (
                      <button
                        key={slot.time}
                        disabled={!slot.available}
                        onClick={() => setCurrSlot(slot.time)}
                        title={!slot.available ? (slot.reason || 'Créneau occupé') : 'Créneau disponible'}
                        className={`py-2.5 px-1 rounded-xl text-xs sm:text-sm transition-all flex flex-col items-center justify-center cursor-pointer ${
                          !slot.available
                            ? 'bg-stone-50 border border-stone-200/60 text-stone-300 cursor-not-allowed line-through opacity-60'
                            : isSelected
                            ? `${theme.primary} text-white font-black shadow-xs ring-2 ${theme.ring} scale-[1.02]`
                            : `bg-white border border-stone-200/80 text-stone-800 hover:border-stone-400 hover:shadow-2xs font-bold`
                        }`}
                      >
                        <span className="font-extrabold">{slot.time}</span>
                        {!slot.available && (
                          <span className="text-[9px] no-underline font-medium text-stone-400 truncate max-w-full px-1">
                            Occupé
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Unified Responsive Action CTA */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-white border border-stone-200/80 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className={`w-9 h-9 rounded-xl ${theme.badgeFilled} flex items-center justify-center shrink-0`}>
            <Clock className={`w-4 h-4 ${theme.iconColor}`} />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-stone-600 block">Créneau sélectionné</span>
            <p className="text-xs sm:text-sm font-black text-stone-900 truncate">
              {currSlot && activeDay?.isOpen ? `${activeDay.label} à ${currSlot}` : 'Veuillez choisir une heure ci-dessus'}
            </p>
          </div>
        </div>

        <button
          type="button"
          disabled={!currSlot || !activeDay?.isOpen}
          onClick={handleConfirmSlot}
          className={`w-full sm:w-auto px-6 py-3 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs ${
            currSlot && activeDay?.isOpen
              ? `${theme.buttonGradient} ${theme.shadowGlow} cursor-pointer hover:opacity-95 hover:scale-[1.01]`
              : 'bg-stone-100 border border-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          <span>Continuer vers mes coordonnées</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
