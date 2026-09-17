import React, { useState, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { AddAppointmentModal } from './AddAppointmentModal';
import {
  Calendar,
  DollarSign,
  Clock,
  ShieldAlert,
  Plus,
  CreditCard,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Check,
  User,
  Phone,
  Scissors,
  MessageCircle,
  X,
  Copy,
  CheckCheck,
  Sparkles,
  Users,
  ShieldCheck,
  Wallet
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DashboardHome = ({ onNavigate }) => {
  const {
    salon,
    appointments,
    updateAppointmentStatus,
    checkoutAppointment,
    deleteAppointment
  } = useBooking();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentMonthISO = useMemo(() => todayISO.slice(0, 7), [todayISO]);

  // Date formatted in French
  const formattedTodayDate = useMemo(() => {
    try {
      const d = new Date();
      return d.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return todayISO;
    }
  }, [todayISO]);

  // Public salon URL for sharing
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const salonUrl = `${origin}/?salon=${salon?.slug || 'mon-salon'}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(salonUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // ================= 1. CALCULS DES KPIS DU JOUR =================
  const kpis = useMemo(() => {
    const todayList = appointments.filter(a => {
      const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
      return aDate === todayISO && !a.isBlocked && a.serviceId !== 'blocked';
    });

    // 1. RDV actifs du jour
    const todayActive = todayList.filter(a => a.status !== 'cancelled' && a.status !== 'expired');
    const rdvCount = todayActive.length;

    // 2. Chiffre d'Affaires prévisionnel total du jour
    let caTotal = 0;
    let acomptesWave = 0;
    let soldeRestant = 0;

    todayActive.forEach(a => {
      const dep = Number(a.depositPaid) || 0;
      const rem = Number(a.remainingBalance) || 0;
      const price = Number(a.price) || (dep + rem);

      caTotal += price;
      acomptesWave += dep;
      if (a.status !== 'completed' && a.status !== 'no_show') {
        soldeRestant += rem;
      }
    });

    // 3. No-shows du mois
    const noShowsThisMonth = appointments.filter(a => {
      const aDate = a.dateStr || a.date || '';
      return a.status === 'no_show' && String(aDate).startsWith(currentMonthISO);
    }).length;

    // 4. Taux de présence
    const completedMonth = appointments.filter(a => {
      const aDate = a.dateStr || a.date || '';
      return a.status === 'completed' && String(aDate).startsWith(currentMonthISO);
    }).length;

    const presenceRate = (completedMonth + noShowsThisMonth) > 0
      ? Math.round((completedMonth / (completedMonth + noShowsThisMonth)) * 100)
      : 100;

    return {
      rdvCount,
      caTotal,
      acomptesWave,
      soldeRestant,
      noShowsThisMonth,
      presenceRate
    };
  }, [appointments, todayISO, currentMonthISO]);

  // ================= 2. PROCHAINS RDV DU JOUR =================
  const todayAppointments = useMemo(() => {
    return appointments
      .filter(a => {
        const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
        return aDate === todayISO && !a.isBlocked && a.serviceId !== 'blocked';
      })
      .sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }, [appointments, todayISO]);

  // WhatsApp reminder message
  const getWhatsAppLink = (app) => {
    const phone = (app.clientPhone || '').replace(/\D/g, '');
    const practitionerMention = app.practitionerName ? ` avec ${app.practitionerName}` : '';
    const text = encodeURIComponent(
      `Bonjour ${app.clientName} ✨ C'est ${salon?.name || 'le salon'}. Nous vous confirmons votre rendez-vous aujourd'hui à ${app.timeSlot} pour votre prestation (${app.serviceName}${practitionerMention}). Acompte Wave enregistré avec succès. À très vite !`
    );
    return `https://wa.me/${phone}?text=${text}`;
  };

  const handleQuickCheckout = async (e, app) => {
    e.stopPropagation();
    if (checkoutAppointment) {
      await checkoutAppointment(app.id, 'Espèces');
    } else {
      await updateAppointmentStatus(app.id, 'completed');
    }
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto w-full">

      {/* ================= 1. BANNIÈRE D'ACCUEIL PERSONNALISÉE ================= */}
      <div className="bg-linear-to-r from-slate-900 via-purple-950 to-slate-900 text-white rounded-3xl p-5 sm:p-7 shadow-xl relative overflow-hidden">
        {/* Halo décoratif */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-black uppercase tracking-wider text-pink-300 border border-white/10">
                ⭐ {salon?.name || 'Mon Salon'}
              </span>
              {(salon?.address || salon?.city) && (
                <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-medium text-slate-200 border border-white/10">
                  📍 {salon.address || salon.city}
                </span>
              )}
              <span className="text-xs text-slate-300 capitalize">
                • {formattedTodayDate}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
              Bonjour {salon?.owner_name || (salon?.name ? `l'équipe ${salon.name}` : 'à vous')} ! 👋
            </h1>

            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              {kpis.rdvCount > 0
                ? `Vous avez ${kpis.rdvCount} cliente(s) prévue(s) aujourd'hui pour un chiffre d'affaires prévisionnel de ${formatFCFA(kpis.caTotal)}.`
                : "Votre journée est libre pour le moment. Partagez votre lien de réservation pour recevoir de nouvelles clientes."}
            </p>
          </div>

          {/* Lien Vitrine & Copie */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all border border-white/15 cursor-pointer"
              title="Copier le lien public pour votre bio Instagram ou WhatsApp"
            >
              {copiedLink ? (
                <>
                  <CheckCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-300">Lien copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-pink-300" />
                  <span>Copier lien réservation</span>
                </>
              )}
            </button>

            <a
              href={salonUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-600/30 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Voir ma vitrine</span>
            </a>
          </div>
        </div>
      </div>

      {/* ================= 2. LES 4 INDICATEURS DU JOUR (KPIS) ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1 : RDV Aujourd'hui */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">
              RDV Aujourd'hui
            </span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">
            {kpis.rdvCount}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {kpis.rdvCount > 1 ? `${kpis.rdvCount} clientes attendues` : kpis.rdvCount === 1 ? '1 cliente attendue' : 'Aucun RDV aujourd\'hui'}
          </p>
        </div>

        {/* KPI 2 : Chiffre d'Affaires du Jour */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-emerald-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
              C.A. Prévisionnel
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-950 truncate">
            {formatFCFA(kpis.caTotal)}
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">
            Total des prestations du jour
          </p>
        </div>

        {/* KPI 3 : Acomptes Wave Sécurisés */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-sky-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
              Acomptes Wave
            </span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-950 truncate">
            {formatFCFA(kpis.acomptesWave)}
          </div>
          <p className="text-[11px] text-sky-700 font-medium">
            Déjà versés sur compte Wave
          </p>
        </div>

        {/* KPI 4 : Taux de Présence Anti-Lapin */}
        <div className="bg-white p-4 sm:p-5 rounded-3xl border border-purple-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
              Assiduité Anti-Lapin
            </span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-950">
            {kpis.presenceRate}%
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {kpis.noShowsThisMonth === 0 ? '🛡️ Zéro no-show ce mois' : `${kpis.noShowsThisMonth} no-show(s) indemnisé(s)`}
          </p>
        </div>

      </div>

      {/* ================= 3. RACCOURCIS D'ACTIONS RAPIDES ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Raccourci 1 : Nouveau RDV */}
        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="p-3.5 sm:p-4 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white flex items-center gap-3 transition-all shadow-sm shadow-pink-600/20 cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black block truncate">Nouveau RDV</span>
            <span className="text-[10px] text-pink-100 block truncate">Sur place ou appel</span>
          </div>
        </button>

        {/* Raccourci 2 : Planning */}
        <button
          type="button"
          onClick={() => onNavigate('planning')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-pink-50/50 text-slate-800 border border-slate-200 hover:border-pink-300 flex items-center gap-3 transition-all shadow-2xs cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black block truncate">Planning</span>
            <span className="text-[10px] text-slate-400 block truncate">Calendrier & créneaux</span>
          </div>
        </button>

        {/* Raccourci 3 : Caisse POS */}
        <button
          type="button"
          onClick={() => onNavigate('pos')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-emerald-50/50 text-slate-800 border border-slate-200 hover:border-emerald-300 flex items-center gap-3 transition-all shadow-2xs cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black block truncate">Caisse POS</span>
            <span className="text-[10px] text-slate-400 block truncate">Encaisser & Clôture</span>
          </div>
        </button>

        {/* Raccourci 4 : Fichier Clients */}
        <button
          type="button"
          onClick={() => onNavigate('crm')}
          className="p-3.5 sm:p-4 rounded-2xl bg-white hover:bg-purple-50/50 text-slate-800 border border-slate-200 hover:border-purple-300 flex items-center gap-3 transition-all shadow-2xs cursor-pointer text-left"
        >
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black block truncate">Clientes CRM</span>
            <span className="text-[10px] text-slate-400 block truncate">Fidélité & Historique</span>
          </div>
        </button>

      </div>

      {/* ================= 4. LISTE DES PROCHAINS RDV DU JOUR ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-6 shadow-xs space-y-4">
        
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
              <span>📅 Rendez-vous d'Aujourd'hui</span>
              <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-xs font-black">
                {todayAppointments.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Clientes attendues ce jour au salon, classées par heure.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('planning')}
            className="text-xs font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Voir le planning complet</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {todayAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-500 flex items-center justify-center mx-auto text-xl">
              ✨
            </div>
            <p className="text-sm font-bold text-slate-800">Aucun rendez-vous planifié aujourd'hui</p>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Votre journée est libre. Cliquez sur Nouveau RDV pour enregistrer une cliente ou partagez votre lien.
            </p>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Inscrire un RDV</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {todayAppointments.map((app) => {
              const isCompleted = app.status === 'completed' || Number(app.remainingBalance) <= 0;
              const isNoShow = app.status === 'no_show';
              const isConfirmed = app.status === 'confirmed';
              const price = Number(app.price) || (Number(app.depositPaid) || 0) + (Number(app.remainingBalance) || 0);
              const remaining = Number(app.remainingBalance) || 0;
              const deposit = Number(app.depositPaid) || 0;

              return (
                <div
                  key={app.id}
                  onClick={() => setSelectedAppointment(app)}
                  className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 cursor-pointer group ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : isNoShow
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-white border-slate-200/90 hover:border-pink-300 shadow-2xs'
                  }`}
                >
                  {/* Gauche : Heure, Nom, Prestation */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-14 py-2 rounded-xl bg-slate-900 text-white font-mono font-black text-xs text-center shrink-0 group-hover:bg-pink-600 transition-colors shadow-2xs">
                      {app.timeSlot || '—'}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm text-slate-950 truncate">
                          {app.clientName}
                        </h4>
                        {app.practitionerName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-pink-50 text-pink-700 border border-pink-100">
                            {app.practitionerName}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-semibold truncate">
                        ✂️ {app.serviceName}
                      </p>
                    </div>
                  </div>

                  {/* Droite : Montants & Actions directes (Zéro superposition) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    
                    {/* Bilan financier */}
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="text-xs font-black text-slate-900 font-mono">
                        {formatFCFA(price)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {isCompleted ? (
                          <span className="text-emerald-700 font-bold">✓ 100% Soldé</span>
                        ) : remaining > 0 ? (
                          <span className="text-amber-700 font-bold">Reste {formatFCFA(remaining)}</span>
                        ) : (
                          <span className="text-emerald-700 font-bold">Payé</span>
                        )}
                      </div>
                    </div>

                    {/* Actions 1-clic */}
                    <div className="flex items-center gap-2">
                      {/* WhatsApp */}
                      {app.clientPhone && (
                        <a
                          href={getWhatsAppLink(app)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-3 py-1.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                          title="Rappel WhatsApp"
                        >
                          <MessageCircle className="w-3.5 h-3.5 fill-white/20" />
                          <span className="hidden sm:inline">Rappel</span>
                        </a>
                      )}

                      {/* Venu & Payé */}
                      {isConfirmed && remaining > 0 && (
                        <button
                          type="button"
                          onClick={(e) => handleQuickCheckout(e, app)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                          title="Marquer comme venu et encaisser le solde"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Venu & Payé</span>
                        </button>
                      )}

                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= MODAL FICHE RDV DÉTAILLÉE ================= */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-lg w-full p-5 sm:p-6 space-y-4 shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  📋 Détail du Rendez-vous
                </h3>
                <span className="text-xs text-slate-400 font-mono">#{selectedAppointment.id}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Infos RDV */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Cliente :</span>
                <span className="font-black text-slate-900 text-sm">{selectedAppointment.clientName}</span>
              </div>

              {selectedAppointment.clientPhone && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Téléphone WhatsApp :</span>
                  <span className="font-mono font-bold text-slate-800">{selectedAppointment.clientPhone}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Prestation :</span>
                <span className="font-bold text-slate-900">✂️ {selectedAppointment.serviceName}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-500">Créneau horaire :</span>
                <span className="font-bold text-slate-900">
                  {selectedAppointment.dateStr || selectedAppointment.date} à {selectedAppointment.timeSlot}
                </span>
              </div>

              {selectedAppointment.practitionerName && (
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-500">Coiffeuse :</span>
                  <span className="font-bold text-pink-700 bg-pink-100 px-2 py-0.5 rounded-lg">
                    {selectedAppointment.practitionerName}
                  </span>
                </div>
              )}
            </div>

            {/* Bilan financier */}
            <div className="p-3.5 rounded-2xl bg-pink-50/60 border border-pink-100 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 font-medium">Prix Total Prestation :</span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  {formatFCFA(selectedAppointment.price)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-emerald-700 font-bold">Acompte perçu (Wave) :</span>
                <span className="font-black text-emerald-700 font-mono">
                  +{formatFCFA(selectedAppointment.depositPaid || 0)}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 border-t border-pink-200/60">
                <span className="text-slate-900 font-black">Solde à régler sur place :</span>
                <span className="font-black text-pink-700 font-mono text-sm">
                  {formatFCFA(selectedAppointment.remainingBalance || 0)}
                </span>
              </div>
            </div>

            {/* Boutons d'action sur la fiche */}
            <div className="space-y-2 pt-1">
              {selectedAppointment.clientPhone && (
                <a
                  href={getWhatsAppLink(selectedAppointment)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Envoyer un rappel de RDV sur WhatsApp</span>
                </a>
              )}

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    if (checkoutAppointment) {
                      await checkoutAppointment(selectedAppointment.id, 'Espèces');
                    } else {
                      await updateAppointmentStatus(selectedAppointment.id, 'completed');
                    }
                    setSelectedAppointment(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Venu & Encaisser</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await updateAppointmentStatus(selectedAppointment.id, 'no_show');
                    setSelectedAppointment(null);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Signaler Lapin</span>
                </button>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (window.confirm("Supprimer ce rendez-vous ?")) {
                    await deleteAppointment(selectedAppointment.id);
                    setSelectedAppointment(null);
                  }
                }}
                className="w-full py-2 text-rose-600 hover:text-rose-700 text-xs font-bold text-center cursor-pointer"
              >
                Supprimer ce rendez-vous
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL AJOUT RAPIDE RDV ================= */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultDate={todayISO}
      />

    </div>
  );
};
