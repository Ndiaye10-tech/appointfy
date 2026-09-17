import React, { useState, useMemo, useRef } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Lock,
  Check,
  X,
  MessageSquare,
  Zap,
  UserCheck,
  UserX,
  Users,
  Sparkles,
  DollarSign,
  ShieldCheck,
  User,
  Trash2,
  CalendarCheck,
  Coffee,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  LayoutList,
  CalendarDays,
  Phone,
  AlertCircle
} from 'lucide-react';
import { AddAppointmentModal } from './AddAppointmentModal';
import { BlockSlotModal } from './BlockSlotModal';

export const AppointmentsList = () => {
  const {
    appointments,
    updateAppointmentStatus,
    cancelAndBroadcastSlot,
    assignPractitioner,
    deleteAppointment,
    salon,
    currentAccessLevel,
    activeStaffMember
  } = useBooking();

  const isPractitionerRestricted = currentAccessLevel === 'level_2' && Boolean(activeStaffMember?.name);

  // Date selection (default today ISO)
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState(todayISO);

  // View modes: 'list' (Agenda) | 'timeline' (Grille horaire)
  const [viewMode, setViewMode] = useState('list');

  // Status filter: 'all' | 'confirmed' | 'completed' | 'no_show' | 'blocked'
  const [statusFilter, setStatusFilter] = useState('all');

  // Practitioner filter: 'all' | staffName
  const [practitionerFilter, setPractitionerFilter] = useState('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [modalPreselectedSlot, setModalPreselectedSlot] = useState('11:00');

  // Hidden date input ref for native date picker
  const dateInputRef = useRef(null);

  const team = Array.isArray(salon?.team) ? salon.team : [];

  // ================= 1. GESTION DU CALENDRIER & DATE STRIP =================
  // Helper to format a French date label
  const formattedSelectedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const isSelectedToday = selectedDateStr === todayISO;

  // Jump to specific date
  const handleDateChange = (newDateISO) => {
    if (newDateISO) {
      setSelectedDateStr(newDateISO);
    }
  };

  // Previous & Next day
  const handleShiftDay = (deltaDays) => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      dateObj.setDate(dateObj.getDate() + deltaDays);
      setSelectedDateStr(dateObj.toISOString().split('T')[0]);
    } catch (e) {
      console.warn('Shift day error:', e);
    }
  };

  // Generate a dynamic window of 14 days around current selected date
  const dayStrip = useMemo(() => {
    const days = [];
    const base = new Date();
    // Start 2 days before today, up to 11 days in future
    for (let i = -2; i <= 11; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      const iso = d.toISOString().split('T')[0];

      let dayName = d.toLocaleDateString('fr-FR', { weekday: 'short' });
      if (iso === todayISO) dayName = "Aujourd'hui";
      else if (i === 1 && iso !== todayISO) dayName = 'Demain';

      const dayNum = d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });

      // Count appointments on that day
      const count = appointments.filter(a => {
        const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
        return aDate === iso && a.status !== 'cancelled' && a.status !== 'expired' && a.status !== 'pending';
      }).length;

      days.push({ iso, dayName, dayNum, count, isToday: iso === todayISO });
    }
    return days;
  }, [appointments, todayISO]);

  // ================= 2. FILTRAGE DES RENDEZ-VOUS DU JOUR =================
  const dayAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        // Date match
        const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
        if (aDate !== selectedDateStr) return false;

        // Ignore unconfirmed / pending / cancelled
        if (a.status === 'cancelled' || a.status === 'expired' || a.status === 'pending') return false;

        // Status filter
        if (statusFilter === 'blocked') {
          if (!a.isBlocked && a.status !== 'blocked') return false;
        } else if (statusFilter !== 'all') {
          if (a.status !== statusFilter) return false;
        }

        // Practitioner filter (si niveau 2 praticienne, verrouillé sur son propre profil)
        const effectivePractitioner = isPractitionerRestricted ? activeStaffMember.name : practitionerFilter;
        if (effectivePractitioner !== 'all') {
          if (a.practitionerName !== effectivePractitioner) return false;
        }

        // Search filter (client name, phone, service)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = (a.clientName || '').toLowerCase().includes(q);
          const matchPhone = (a.clientPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
          const matchService = (a.serviceName || '').toLowerCase().includes(q);
          if (!matchName && !matchPhone && !matchService) return false;
        }

        return true;
      })
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }, [appointments, selectedDateStr, todayISO, statusFilter, practitionerFilter, searchQuery, isPractitionerRestricted, activeStaffMember]);

  // Daily Financial Summary
  const dailySummary = useMemo(() => {
    let deposits = 0;
    let balanceDue = 0;
    let completedTotal = 0;
    let validCount = 0;
    let blockedCount = 0;

    dayAppointments.forEach(a => {
      if (a.isBlocked || a.status === 'blocked' || a.serviceId === 'blocked') {
        blockedCount++;
        return;
      }
      validCount++;
      const dep = Number(a.depositPaid) || 0;
      const rem = Number(a.remainingBalance) || 0;
      const total = Number(a.price) || (dep + rem);

      deposits += dep;
      if (a.status === 'completed') {
        completedTotal += total;
      } else if (a.status !== 'no_show') {
        balanceDue += rem;
      }
    });

    return { deposits, balanceDue, completedTotal, validCount, blockedCount };
  }, [dayAppointments]);

  // Hourly grid generator for Timeline view (09:00 to 20:00, 30 min intervals)
  const timelineSlots = useMemo(() => {
    const slots = [];
    const hours = ['09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19'];
    const minutes = ['00', '30'];

    hours.forEach(h => {
      minutes.forEach(m => {
        const time = `${h}:${m}`;
        const matchingAppts = dayAppointments.filter(a => a.timeSlot === time);
        slots.push({ time, appointments: matchingAppts });
      });
    });
    slots.push({ time: '20:00', appointments: dayAppointments.filter(a => a.timeSlot === '20:00') });
    return slots;
  }, [dayAppointments]);

  const openAddModalWithSlot = (slot = '11:00') => {
    setModalPreselectedSlot(slot);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">

      {/* ================= 1. EN-TÊTE PRINCIPAL & ACTIONS RAPIDES ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-pink-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Titre & Chiffres clés */}
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              📅 Planning du Salon
            </h2>
            <span className="px-3 py-1 rounded-full bg-pink-50 text-pink-700 text-xs font-black border border-pink-100 shadow-2xs">
              {dailySummary.validCount} RDV client(s)
            </span>
            {dailySummary.blockedCount > 0 && (
              <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                {dailySummary.blockedCount} créneau(x) bloqué(s)
              </span>
            )}
          </div>

          {/* Cartouches financiers du jour (Masqués si Niveau 2 Praticienne) */}
          {currentAccessLevel !== 'level_2' ? (
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Acomptes Wave reçus : <strong>{formatFCFA(dailySummary.deposits)}</strong></span>
              </div>

              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span>Reste à percevoir sur place : <strong className="text-slate-900 font-bold">{formatFCFA(dailySummary.balanceDue)}</strong></span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs font-bold text-pink-700 bg-pink-50 border border-pink-200 px-3 py-1 rounded-xl">
              <span>✂️ Planning assigné à {activeStaffMember?.name || 'vous'}</span>
            </div>
          )}
        </div>

        {/* Boutons d'actions principaux */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsBlockModalOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Bloquer une pause déjeuner ou fermer un créneau"
          >
            <Lock className="w-4 h-4 text-amber-700" />
            <span>Pause / Bloquer</span>
          </button>

          <button
            onClick={() => openAddModalWithSlot('11:00')}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Nouveau RDV</span>
          </button>
        </div>

      </div>

      {/* ================= 2. NAVIGATION DE DATE COMPLÈTE & BANDEAU ================= */}
      <div className="bg-white p-3 sm:p-5 rounded-3xl border border-pink-100 shadow-xs space-y-3.5">
        
        {/* Barre de contrôle de date avec Sélecteur Calendrier */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          
          {/* Navigation Jour par Jour */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleShiftDay(-1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Jour précédent"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-left min-w-0">
              <span className="text-xs uppercase font-bold text-slate-400 block tracking-wider">
                {isSelectedToday ? "Aujourd'hui" : "Date sélectionnée"}
              </span>
              <h3 className="text-sm sm:text-base font-black text-slate-900 capitalize truncate">
                {formattedSelectedDate}
              </h3>
            </div>

            <button
              onClick={() => handleShiftDay(1)}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
              title="Jour suivant"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {!isSelectedToday && (
              <button
                onClick={() => setSelectedDateStr(todayISO)}
                className="ml-2 px-2.5 py-1 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-extrabold transition-colors cursor-pointer"
              >
                Aujourd'hui
              </button>
            )}
          </div>

          {/* Outil Calendrier / Choisir n'importe quelle date */}
          <div className="flex items-center gap-2 self-end sm:self-center">
            {/* Input natif de date caché déclenché au clic */}
            <input
              type="date"
              ref={dateInputRef}
              value={selectedDateStr}
              onChange={(e) => handleDateChange(e.target.value)}
              className="sr-only"
            />
            
            <button
              onClick={() => dateInputRef.current && dateInputRef.current.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
              className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-pink-50 text-slate-700 hover:text-pink-700 border border-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
            >
              <CalendarIcon className="w-4 h-4 text-pink-600" />
              <span>Choisir une date...</span>
            </button>

            {/* Bascule de Vue (Liste / Grille) */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Affichage Agenda / Liste"
              >
                <LayoutList className="w-4 h-4" />
                <span className="hidden md:inline">Liste</span>
              </button>

              <button
                onClick={() => setViewMode('timeline')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  viewMode === 'timeline'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Affichage Grille horaire"
              >
                <CalendarDays className="w-4 h-4" />
                <span className="hidden md:inline">Grille</span>
              </button>
            </div>
          </div>

        </div>

        {/* Bandeau de jours défilant horizontalement (Mobile Swipeable) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-pink-200">
          {dayStrip.map((d) => {
            const isSelected = selectedDateStr === d.iso;
            return (
              <button
                key={d.iso}
                onClick={() => setSelectedDateStr(d.iso)}
                className={`shrink-0 py-2.5 px-3 min-w-[76px] rounded-2xl border transition-all text-center flex flex-col items-center justify-center cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 shadow-sm scale-102'
                    : 'bg-white hover:bg-pink-50/50 border-slate-200 text-slate-700'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? 'text-pink-300' : 'text-slate-400'}`}>
                  {d.dayName}
                </span>
                <span className="text-xs sm:text-sm font-black mt-0.5">
                  {d.dayNum}
                </span>
                {d.count > 0 ? (
                  <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full mt-1 ${
                    isSelected ? 'bg-pink-500 text-white' : 'bg-pink-100 text-pink-700'
                  }`}>
                    {d.count} RDV
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-400 mt-1 opacity-60">libre</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Barre de Filtres & Recherche */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 pt-1">
          
          {/* Onglets Statuts */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tous' },
              { id: 'confirmed', label: 'À venir' },
              { id: 'completed', label: 'Honorés' },
              { id: 'no_show', label: 'Lapins' },
              { id: 'blocked', label: 'Pauses & Bloqués' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Filtre par Collaboratrice & Recherche */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            {team.length > 0 && (
              <select
                value={practitionerFilter}
                onChange={(e) => setPractitionerFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:outline-pink-600 cursor-pointer"
              >
                <option value="all">Toute l'équipe</option>
                {team.map((m) => (
                  <option key={m.id || m.name} value={m.name}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher cliente..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 text-xs focus:outline-pink-600 font-medium"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ================= 3. AFFICHAGE DES CRÉNEAUX ================= */}

      {/* ----------------- MODE 1 : VUE AGENDA / LISTE (MOBILE-FIRST) ----------------- */}
      {viewMode === 'list' && (
        <div className="space-y-3">
          {dayAppointments.length === 0 ? (
            <div className="bg-white p-8 sm:p-12 rounded-3xl border border-pink-100 text-center space-y-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto">
                <CalendarCheck className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900">
                  Aucun rendez-vous pour cette date
                </h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                  Le planning est libre pour le {formattedSelectedDate}. Vous pouvez inscrire une cliente ou bloquer un créneau.
                </p>
              </div>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  onClick={() => openAddModalWithSlot('11:00')}
                  className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-sm"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Ajouter un RDV</span>
                </button>
                <button
                  onClick={() => setIsBlockModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-2 cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Pause déjeuner</span>
                </button>
              </div>
            </div>
          ) : (
            dayAppointments.map((app) => {
              const isBlocked = app.isBlocked || app.status === 'blocked';
              const isCompleted = app.status === 'completed';
              const isNoShow = app.status === 'no_show';
              const isConfirmed = app.status === 'confirmed';

              const waCleanPhone = (app.clientPhone || '').replace(/\D/g, '');
              const practitionerMention = app.practitionerName ? ` avec ${app.practitionerName}` : '';
              const waChatUrl = `https://wa.me/${waCleanPhone}?text=${encodeURIComponent(
                `Bonjour ${app.clientName}, c'est ${salon?.name || 'le salon'}. Nous vous confirmons votre rendez-vous pour ${app.serviceName}${practitionerMention} prévu le ${app.dateStr || app.date} à ${app.timeSlot}. Acompte Wave enregistré avec succès. À très vite !`
              )}`;

              // ========== CARTE CRÉNEAU BLOQUÉ / PAUSE ==========
              if (isBlocked) {
                const isLunch = (app.serviceName || '').toLowerCase().includes('déjeuner') || 
                                (app.serviceName || '').toLowerCase().includes('repas') || 
                                (app.serviceName || '').toLowerCase().includes('pause');
                return (
                  <div
                    key={app.id}
                    className="p-4 sm:p-5 rounded-3xl bg-amber-50/70 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      <div className="w-16 py-2 rounded-2xl bg-slate-900 text-white font-mono font-black text-xs sm:text-sm text-center shrink-0 shadow-2xs">
                        {app.timeSlot}
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="p-1 rounded-lg bg-amber-200 text-amber-900 shrink-0">
                            {isLunch ? <Coffee className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </span>
                          <h4 className="font-extrabold text-sm sm:text-base text-slate-950">
                            {app.serviceName || 'Créneau Bloqué / Pause'}
                          </h4>
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                            {app.duration || '1h'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600">
                          Créneau indisponible pour les réservations en ligne.
                          {app.practitionerName && (
                            <span className="ml-1.5 font-bold text-pink-700">
                              • Concerne : {app.practitionerName}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="self-end sm:self-center shrink-0">
                      <button
                        onClick={() => deleteAppointment(app.id)}
                        className="px-3.5 py-2 rounded-xl bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                        title="Débloquer et ré-ouvrir ce créneau"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Débloquer le créneau</span>
                      </button>
                    </div>
                  </div>
                );
              }

              // ========== CARTE RENDEZ-VOUS CLIENT (ZÉRO SUPERPOSITION) ==========
              return (
                <div
                  key={app.id}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all space-y-3.5 ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isNoShow
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200/90 hover:border-pink-300 shadow-xs'
                  }`}
                >
                  {/* Ligne 1 : Heure, Nom cliente, Statut */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-16 py-2 rounded-2xl bg-slate-900 text-white font-mono font-black text-xs sm:text-sm text-center shrink-0 shadow-2xs">
                        {app.timeSlot}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-extrabold text-sm sm:text-base text-slate-950 truncate">
                          {app.clientName}
                        </h4>
                        {app.clientPhone && (
                          <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{app.clientPhone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Badge de Statut */}
                    <div className="self-start sm:self-center shrink-0">
                      {isCompleted && (
                        <span className="text-xs font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-200">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Venu & Payé (100%)</span>
                        </span>
                      )}

                      {isNoShow && (
                        <span className="text-xs font-bold px-3 py-1 rounded-full bg-rose-100 text-rose-800 flex items-center gap-1 border border-rose-200">
                          <UserX className="w-3.5 h-3.5" />
                          <span>Lapin (Acompte conservé)</span>
                        </span>
                      )}

                      {isConfirmed && (
                        <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-200 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Confirmé (En attente)</span>
                        </span>
                      )}
                    </div>

                  </div>

                  {/* Ligne 2 : Détails Prestation & Coiffeuse assignée */}
                  <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <span className="font-bold text-slate-900 bg-white px-2.5 py-1 rounded-xl border border-slate-200">
                        ✂️ {app.serviceName}
                      </span>

                      {app.duration && (
                        <span className="text-slate-500 font-medium">
                          Durée : {app.duration}
                        </span>
                      )}

                      {app.notes && (
                        <span className="text-slate-600 italic">
                          "{app.notes}"
                        </span>
                      )}
                    </div>

                    {/* Coiffeuse / Collaboratrice */}
                    <div className="shrink-0 flex items-center gap-2">
                      <span className="text-slate-500 font-medium">Coiffeuse :</span>
                      {team.length > 0 && !isCompleted && !isNoShow ? (
                        <select
                          value={app.practitionerName || ''}
                          onChange={(e) => assignPractitioner(app.id, e.target.value)}
                          className="px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-xs font-bold text-pink-700 cursor-pointer focus:outline-pink-600"
                        >
                          <option value="">À assigner...</option>
                          {team.map((m) => (
                            <option key={m.id || m.name} value={m.name}>
                              {m.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100">
                          {app.practitionerName || 'Non spécifiée'}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ligne 3 : Bilan Financier Épuré (Acompte Wave vs Reste sur place) */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-pink-50/70 border border-pink-100">
                      <span className="text-[10px] uppercase font-bold text-pink-700 block">
                        Acompte Reçu (Wave)
                      </span>
                      <span className="text-sm font-black text-pink-900">
                        +{formatFCFA(app.depositPaid)}
                      </span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        {isCompleted ? 'Solde réglé' : 'Reste à régler'}
                      </span>
                      <span className={`text-sm font-black ${isCompleted ? 'text-emerald-700' : 'text-slate-800'}`}>
                        {isCompleted ? '0 FCFA (Soldé)' : formatFCFA(app.remainingBalance)}
                      </span>
                    </div>

                    <div className="col-span-2 sm:col-span-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="text-[10px] uppercase font-bold text-slate-500 block">
                        Total Prestation
                      </span>
                      <span className="text-sm font-black text-slate-950">
                        {formatFCFA(app.price)}
                      </span>
                    </div>
                  </div>

                  {/* Ligne 4 : Barre d'Actions Intelligente (Boutons tactiles aérés) */}
                  <div className="pt-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-t border-slate-100">
                    
                    {/* Bouton WhatsApp Rappel */}
                    {waCleanPhone ? (
                      <a
                        href={waChatUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-sm shadow-[#25D366]/20 cursor-pointer"
                        title="Envoyer un rappel de rendez-vous sur WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4 fill-white/20" />
                        <span>Rappel WhatsApp</span>
                      </a>
                    ) : (
                      <div />
                    )}

                    {/* Actions de validation / statut */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {isConfirmed && (
                        <>
                          <button
                            onClick={() => updateAppointmentStatus(app.id, 'completed')}
                            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            title="Confirmer la venue de la cliente et encaisser le solde"
                          >
                            <Check className="w-4 h-4 stroke-[3]" />
                            <span>Venu & Payé</span>
                          </button>

                          <button
                            onClick={() => updateAppointmentStatus(app.id, 'no_show')}
                            className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                            title="Marquer comme no-show (la cliente n'est pas venue)"
                          >
                            <UserX className="w-4 h-4" />
                            <span>Lapin</span>
                          </button>

                          <button
                            onClick={() => cancelAndBroadcastSlot(app)}
                            className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                            title="Annuler ce rendez-vous"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {isCompleted && (
                        <button
                          onClick={() => updateAppointmentStatus(app.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Revenir à Confirmé
                        </button>
                      )}

                      {isNoShow && (
                        <button
                          onClick={() => updateAppointmentStatus(app.id, 'confirmed')}
                          className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                        >
                          Rétablir le RDV
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* ----------------- MODE 2 : VUE GRILLE HORAIRE / TIMELINE ----------------- */}
      {viewMode === 'timeline' && (
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-pink-100 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-slate-900">
                Grille horaire de la journée ({formattedSelectedDate})
              </h4>
              <p className="text-xs text-slate-500">
                Visualisez les créneaux libres, occupés et vos temps de pause
              </p>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {timelineSlots.map((slot) => {
              const hasAppts = slot.appointments.length > 0;
              return (
                <div key={slot.time} className="py-2.5 flex items-start gap-4 hover:bg-pink-50/20 px-2 rounded-xl transition-colors">
                  {/* Heure */}
                  <div className="w-14 font-mono font-black text-xs sm:text-sm text-slate-700 pt-1 shrink-0">
                    {slot.time}
                  </div>

                  {/* Contenu du créneau */}
                  <div className="flex-1 min-w-0">
                    {hasAppts ? (
                      <div className="space-y-2">
                        {slot.appointments.map(a => {
                          const isBlocked = a.isBlocked || a.status === 'blocked';
                          if (isBlocked) {
                            return (
                              <div key={a.id} className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                                  <span>{a.serviceName || 'Créneau Bloqué'}</span>
                                  <span className="text-[10px] font-normal text-amber-800">({a.duration || '1h'})</span>
                                </div>
                                <button
                                  onClick={() => deleteAppointment(a.id)}
                                  className="text-rose-600 hover:text-rose-800 text-[11px] font-bold underline cursor-pointer"
                                >
                                  Débloquer
                                </button>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={a.id}
                              className={`p-3 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                                a.status === 'completed'
                                  ? 'bg-emerald-50/50 border-emerald-200'
                                  : a.status === 'no_show'
                                  ? 'bg-rose-50/50 border-rose-200'
                                  : 'bg-white border-pink-200 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="font-extrabold text-slate-900 truncate">{a.clientName}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600 font-medium">{a.serviceName}</span>
                                {a.practitionerName && (
                                  <span className="px-2 py-0.5 rounded-md bg-pink-50 text-pink-700 font-bold text-[10px]">
                                    {a.practitionerName}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2 shrink-0">
                                <span className="font-black text-slate-900">{formatFCFA(a.price)}</span>
                                {a.status === 'confirmed' && (
                                  <button
                                    onClick={() => updateAppointmentStatus(a.id, 'completed')}
                                    className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold cursor-pointer"
                                  >
                                    Venu
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs text-slate-400 py-1">
                        <span className="italic">Créneau libre</span>
                        <button
                          onClick={() => openAddModalWithSlot(slot.time)}
                          className="px-2.5 py-1 rounded-lg bg-pink-50 hover:bg-pink-100 text-pink-700 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Réserver</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= 4. MODALS INTERACTIFS ================= */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={selectedDateStr}
        defaultSlot={modalPreselectedSlot}
      />

      <BlockSlotModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        defaultDate={selectedDateStr}
        defaultSlot="13:00"
      />

    </div>
  );
};
