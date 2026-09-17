import React, { useState, useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import {
  X,
  Lock,
  Clock,
  Calendar,
  AlertCircle,
  Coffee,
  Sparkles,
  UserX,
  Shield,
  Trash2,
  CheckCircle2,
  CalendarX,
  Sun,
  Sunset,
  ArrowRight
} from 'lucide-react';

export const BlockSlotModal = ({ isOpen, onClose, defaultDate = null, defaultSlot = '13:00' }) => {
  const { salon, appointments, blockSlot, deleteAppointment } = useBooking();

  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const tomorrowISO = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, []);

  const [dateStr, setDateStr] = useState(defaultDate || todayISO);
  const [timeSlot, setTimeSlot] = useState(defaultSlot);
  const [duration, setDuration] = useState('1h00');
  const [reason, setReason] = useState('Pause Déjeuner');
  const [customReason, setCustomReason] = useState('');
  const [practitionerName, setPractitionerName] = useState('all');
  const [successNotice, setSuccessNotice] = useState(null);

  if (!isOpen) return null;

  const team = Array.isArray(salon?.team) ? salon.team : [];

  const timeOptions = [
    '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00',
    '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00'
  ];

  const durationOptions = [
    '30 min', '45 min', '1h00', '1h30', '2h00', '3h00', 'Demi-journée (4h)', 'Journée entière'
  ];

  const quickPresets = [
    {
      id: 'lunch',
      label: 'Pause Déjeuner (13h-14h)',
      icon: Coffee,
      slot: '13:00',
      duration: '1h00',
      reason: 'Pause Déjeuner'
    },
    {
      id: 'break',
      label: 'Pause Express (30 min)',
      icon: Clock,
      slot: '15:30',
      duration: '30 min',
      reason: 'Pause / Repos'
    },
    {
      id: 'cleaning',
      label: 'Nettoyage & Désinfection',
      icon: Sparkles,
      slot: '18:30',
      duration: '45 min',
      reason: 'Nettoyage & Rangement'
    },
    {
      id: 'afternoon_off',
      label: 'Après-midi Fermé (4h)',
      icon: Sunset,
      slot: '14:00',
      duration: 'Demi-journée (4h)',
      reason: 'Fermeture exceptionelle après-midi'
    },
    {
      id: 'full_day',
      label: 'Fermeture Journée Entière',
      icon: CalendarX,
      slot: '09:00',
      duration: 'Journée entière',
      reason: 'Fermeture exceptionnelle du salon'
    }
  ];

  const defaultReasons = [
    'Pause Déjeuner',
    'Indisponibilité / Absence',
    'Formation interne / Réunion',
    'Nettoyage & Désinfection',
    'Maintenance salon / Fauteuil',
    'Autre motif personnalisé'
  ];

  // Currently blocked slots on the selected date
  const currentlyBlocked = appointments.filter(a => {
    if (!a.isBlocked && a.status !== 'blocked') return false;
    const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
    return aDate === dateStr;
  });

  const handleApplyPreset = (preset) => {
    setTimeSlot(preset.slot);
    setDuration(preset.duration);
    setReason(preset.reason);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalReason = reason === 'Autre motif personnalisé' ? (customReason.trim() || 'Indisponible') : reason;
    const finalPractitioner = practitionerName === 'all' ? '' : practitionerName;

    await blockSlot({
      dateStr: dateStr,
      timeSlot: timeSlot,
      duration: duration,
      reason: finalReason,
      practitionerName: finalPractitioner
    });

    setSuccessNotice(`Le créneau de ${timeSlot} (${duration}) a bien été bloqué !`);
    setTimeout(() => {
      setSuccessNotice(null);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-rose-100 shadow-2xl max-w-xl w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative animate-in zoom-in-95 duration-200">
        
        {/* ================= HEADER ================= */}
        <div className="flex items-center justify-between border-b border-rose-50 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shadow-xs">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base sm:text-lg">
                Pause & Blocage de Créneau
              </h3>
              <p className="text-xs text-slate-500">
                Verrouillez des horaires pour vos pauses, indisponibilités ou fermetures
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-950 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {successNotice && (
          <div className="p-3.5 mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Notice Info */}
        <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-200/60 mb-5 flex items-start gap-2.5 text-xs text-rose-950">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <span>
            <strong>Effet immédiat :</strong> Les créneaux bloqués n'apparaîtront plus sur votre page de réservation en ligne pour vos clientes.
          </span>
        </div>

        {/* ================= PRESETS RAPIDES ================= */}
        <div className="mb-5">
          <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-rose-500" />
            <span>Raccourcis rapides en 1 clic :</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {quickPresets.map((p) => {
              const IconComp = p.icon;
              const isCurrent = timeSlot === p.slot && duration === p.duration && reason === p.reason;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                    isCurrent
                      ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200 font-bold'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-rose-200 hover:bg-slate-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                    isCurrent ? 'bg-rose-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    <IconComp className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold block truncate">{p.label}</span>
                    <span className="text-[10px] text-slate-400 block">{p.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ================= FORMULAIRE PRINCIPAL ================= */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Date Selector avec raccourcis */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-black uppercase text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-rose-500" />
                <span>Date concernée</span>
              </label>
              <div className="flex gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setDateStr(todayISO)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    dateStr === todayISO ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Aujourd'hui
                </button>
                <button
                  type="button"
                  onClick={() => setDateStr(tomorrowISO)}
                  className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                    dateStr === tomorrowISO ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Demain
                </button>
              </div>
            </div>
            <input
              type="date"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-rose-500 bg-slate-50/40"
              required
            />
          </div>

          {/* Heure de début & Durée */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Heure de début</span>
              </label>
              <select
                value={timeSlot}
                onChange={(e) => setTimeSlot(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-rose-500 bg-slate-50/40 cursor-pointer"
              >
                {timeOptions.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black uppercase text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-rose-500" />
                <span>Durée du blocage</span>
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-rose-500 bg-slate-50/40 cursor-pointer"
              >
                {durationOptions.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Qui est concerné ? */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1 flex items-center gap-1">
              <UserX className="w-3.5 h-3.5 text-rose-500" />
              <span>Qui est concerné ?</span>
            </label>
            <select
              value={practitionerName}
              onChange={(e) => setPractitionerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-rose-500 bg-slate-50/40 cursor-pointer"
            >
              <option value="all">Tout le salon (fermeture / pause collective)</option>
              {team.map((member) => (
                <option key={member.id} value={member.name}>
                  {member.name} ({member.role || 'Styliste'})
                </option>
              ))}
            </select>
          </div>

          {/* Motif du blocage */}
          <div>
            <label className="block text-xs font-black uppercase text-slate-700 mb-1.5 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span>Motif du blocage</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
              {defaultReasons.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`p-2 rounded-xl text-[11px] font-bold border text-left transition-all cursor-pointer truncate ${
                    reason === r
                      ? 'bg-rose-50 border-rose-400 text-rose-900 shadow-xs ring-2 ring-rose-200'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-rose-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>

            {reason === 'Autre motif personnalisé' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Ex: Rendez-vous médical, inventaire de produits..."
                className="w-full px-3.5 py-2 rounded-xl border border-rose-300 text-xs font-medium text-slate-900 focus:outline-rose-500 mt-1"
                required
              />
            )}
          </div>

          {/* Résumé de l'action */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-between">
            <span>Créneau à bloquer :</span>
            <strong className="font-mono text-rose-700 font-black">
              {timeSlot} ({duration}) • {reason}
            </strong>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              Fermer
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white font-extrabold text-xs shadow-md shadow-rose-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>Bloquer ce créneau maintenant</span>
            </button>
          </div>

        </form>

        {/* ================= CRÉNEAUX DÉJÀ BLOQUÉS CE JOUR-LÀ ================= */}
        {currentlyBlocked.length > 0 && (
          <div className="mt-6 pt-5 border-t border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" />
                <span>Créneaux actuellement bloqués sur cette date ({currentlyBlocked.length})</span>
              </h4>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {currentlyBlocked.map((blk) => (
                <div
                  key={blk.id}
                  className="p-3 rounded-2xl bg-rose-50/50 border border-rose-200 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-black text-rose-900 bg-white px-2 py-1 rounded-lg border border-rose-200 shadow-xs">
                      {blk.timeSlot}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {blk.serviceName || 'Pause / Bloqué'} ({blk.duration || '1h'})
                      </span>
                      {blk.practitionerName && (
                        <span className="text-[10px] text-slate-500">
                          Collaboratrice : {blk.practitionerName}
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteAppointment(blk.id)}
                    className="px-2.5 py-1.5 rounded-xl bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                    title="Débloquer immédiatement ce créneau"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Débloquer</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
