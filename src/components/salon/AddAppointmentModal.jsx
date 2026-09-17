import React, { useState } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import {
  X,
  Plus,
  Calendar,
  Clock,
  User,
  Phone,
  Scissors,
  CheckCircle2,
  Sparkles,
  DollarSign
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AddAppointmentModal = ({
  isOpen,
  onClose,
  defaultDate = null,
  defaultSlot = '11:00',
  defaultClientName = '',
  defaultClientPhone = ''
}) => {
  const { services, addManualAppointment, salon } = useBooking();

  const todayISO = new Date().toISOString().split('T')[0];
  const tmr = new Date();
  tmr.setDate(tmr.getDate() + 1);
  const tomorrowISO = tmr.toISOString().split('T')[0];

  const [formData, setFormData] = useState({
    clientName: defaultClientName || '',
    clientPhone: defaultClientPhone || '',
    serviceId: services[0]?.id || 'custom',
    serviceName: services[0]?.name || '',
    date: defaultDate ? defaultDate : "Aujourd'hui",
    dateStr: defaultDate || todayISO,
    timeSlot: defaultSlot || '11:00',
    practitionerName: salon.team?.[0]?.name || '',
    price: services[0]?.price || 15000,
    depositPaid: services[0]?.deposit || 3000,
    paymentMethod: 'Wave',
    notes: ''
  });

  const [customService, setCustomService] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        clientName: defaultClientName !== undefined && defaultClientName !== '' ? defaultClientName : prev.clientName,
        clientPhone: defaultClientPhone !== undefined && defaultClientPhone !== '' ? defaultClientPhone : prev.clientPhone,
        date: defaultDate || "Aujourd'hui",
        dateStr: defaultDate || todayISO,
        timeSlot: defaultSlot || '11:00'
      }));
    }
  }, [isOpen, defaultDate, defaultSlot, defaultClientName, defaultClientPhone, todayISO]);

  if (!isOpen) return null;

  const handleServiceChange = (e) => {
    const val = e.target.value;
    if (val === 'custom') {
      setCustomService(true);
      setFormData(prev => ({
        ...prev,
        serviceId: 'custom',
        serviceName: '',
        price: 15000,
        depositPaid: 3000
      }));
    } else {
      setCustomService(false);
      const selected = services.find(s => s.id === val);
      if (selected) {
        setFormData(prev => ({
          ...prev,
          serviceId: selected.id,
          serviceName: selected.name,
          price: selected.price,
          depositPaid: selected.deposit
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim() || !formData.clientPhone.trim()) return;

    await addManualAppointment(formData);

    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.6 }
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-pink-100 shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto p-5 sm:p-7 relative">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-pink-50 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center shadow-xs">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-950 text-base sm:text-lg">
                Nouveau Rendez-vous
              </h3>
              <p className="text-xs text-slate-500">
                Ajouter une cliente venue au salon ou par téléphone
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Client Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nom & Prénom de la cliente *
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Awa Ndiaye"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pink-200 text-xs sm:text-sm font-semibold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Téléphone WhatsApp *
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-pink-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  placeholder="77 842 19 80"
                  value={formData.clientPhone}
                  onChange={(e) => setFormData({ ...formData, clientPhone: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-pink-200 text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:border-pink-500"
                />
              </div>
            </div>
          </div>

          {/* Prestation */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Prestation choisie *
            </label>
            <select
              value={customService ? 'custom' : formData.serviceId}
              onChange={handleServiceChange}
              className="w-full px-3 py-2.5 rounded-xl border border-pink-200 text-xs sm:text-sm font-semibold text-slate-900 bg-white focus:outline-none focus:border-pink-500"
            >
              {services.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} — {formatFCFA(s.price)} (Acompte : {formatFCFA(s.deposit)})
                </option>
              ))}
              <option value="custom">+ Autre prestation personnalisée</option>
            </select>

            {customService && (
              <input
                type="text"
                required
                placeholder="Nom de la prestation personnalisée"
                value={formData.serviceName}
                onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs mt-2 focus:outline-none focus:border-pink-500"
              />
            )}
          </div>

          {/* Praticienne / Coiffeuse Assignée */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
              <span>Coiffeuse / Praticienne</span>
              <span className="text-[10px] text-pink-600 font-semibold">Attribution de la cliente</span>
            </label>
            <select
              value={formData.practitionerName}
              onChange={(e) => setFormData({ ...formData, practitionerName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-pink-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-pink-500 bg-white cursor-pointer"
            >
              <option value="">-- Toute l'équipe (Non assignée) --</option>
              {Array.isArray(salon.team) && salon.team.map((m) => (
                <option key={m.id || m.name} value={m.name}>
                  {m.name} {m.role ? `(${m.role})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jour du rendez-vous
              </label>
              <div className="flex gap-1.5 mb-2">
                {["Aujourd'hui", "Demain"].map((d) => {
                  const isSelected = formData.date === d;
                  return (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setFormData({ 
                        ...formData, 
                        date: d, 
                        dateStr: d === "Aujourd'hui" ? todayISO : tomorrowISO 
                      })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-pink-600 text-white shadow-xs'
                          : 'bg-pink-50 text-slate-700 hover:bg-pink-100'
                      }`}
                    >
                      {d}
                    </button>
                  );
                })}
              </div>
              <input
                type="date"
                min={todayISO}
                value={formData.dateStr || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  let display = val;
                  if (val === todayISO) display = "Aujourd'hui";
                  else if (val === tomorrowISO) display = "Demain";
                  setFormData({ ...formData, date: display, dateStr: val });
                }}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-bold text-slate-800 bg-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Heure du créneau
              </label>
              <div className="grid grid-cols-3 gap-1 mb-2">
                {['09:30', '11:00', '14:00', '15:30', '17:00', '18:30'].map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setFormData({ ...formData, timeSlot: time })}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      formData.timeSlot === time
                        ? 'bg-pink-600 text-white shadow-xs'
                        : 'bg-pink-50 text-slate-700 hover:bg-pink-100'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Autre heure (ex: 12:45)"
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="w-full px-3 py-1.5 rounded-xl border border-pink-200 text-xs focus:outline-none focus:border-pink-500 text-center font-bold"
              />
            </div>
          </div>

          {/* Pricing & Deposit */}
          <div className="p-3.5 rounded-2xl bg-pink-50/70 border border-pink-100 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Prix total (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={formData.price}
                  onChange={(e) => {
                    const p = Math.max(0, Number(e.target.value));
                    setFormData(prev => ({
                      ...prev,
                      price: p,
                      depositPaid: Math.min(prev.depositPaid, p)
                    }));
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-black text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Acompte déjà encaissé (FCFA)
                </label>
                <input
                  type="number"
                  min="0"
                  max={formData.price}
                  step="500"
                  required
                  value={formData.depositPaid}
                  onChange={(e) => setFormData(prev => ({ ...prev, depositPaid: Math.max(0, Number(e.target.value)) }))}
                  className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs font-black text-pink-600 bg-white"
                />
              </div>
            </div>

            {/* Payment Method of deposit */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Mode de règlement de l'acompte :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Wave', label: 'Wave Sénégal', color: 'bg-sky-50 text-sky-700 border-sky-200' },
                  { id: 'Espèces', label: 'Espèces', subLabel: 'au salon', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
                ].map((pm) => (
                  <button
                    key={pm.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, paymentMethod: pm.id })}
                    className={`py-2 px-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer text-center ${
                      formData.paymentMethod === pm.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : `${pm.color} hover:opacity-80`
                    }`}
                  >
                    <span>{pm.label}</span>
                    {pm.subLabel && <span className="hidden sm:inline"> {pm.subLabel}</span>}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-pink-100 font-bold">
              <span className="text-slate-600">Solde restant à régler sur place :</span>
              <span className="text-slate-950 font-black">
                {formatFCFA(Math.max(0, formData.price - formData.depositPaid))}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Notes pour la coiffeuse (facultatif)
            </label>
            <input
              type="text"
              placeholder="Ex: Mèches 1B fournies, vient avec sa fille..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs focus:outline-none focus:border-pink-500"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-2 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-xs sm:text-sm shadow-md shadow-pink-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Enregistrer le rendez-vous</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};