import React, { useState, useEffect } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { SubscriptionManager } from './SubscriptionManager';
import { supabase } from '../../lib/supabase';
import {
  Building,
  Phone,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  Sparkles,
  User,
  ChevronDown,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  Lock,
  LogOut,
  RefreshCw
} from 'lucide-react';

export const SettingsManager = ({ defaultSection }) => {
  const { salon, currentUser, logout, updateSalon, isSubscriptionExpired } = useBooking();

  // Expanded section state: 'subscription' if expired or requested, else 'general'
  const [openSection, setOpenSection] = useState(defaultSection || (isSubscriptionExpired ? 'subscription' : 'general'));

  useEffect(() => {
    if (defaultSection) {
      setOpenSection(defaultSection);
    }
  }, [defaultSection]);

  // Form State
  const [formData, setFormData] = useState({
    owner_name: salon?.owner_name || '',
    name: salon?.name || '',
    tagline: salon?.tagline || '',
    description: salon?.description || '',
    phone: salon?.phone || '',
    whatsapp: salon?.whatsapp || '',
    address: salon?.address || '',
    city: salon?.city || 'Dakar',
    // Booking Rules & Deposit
    depositRequired: salon?.depositRequired !== false,
    depositType: salon?.depositType || 'rate', // 'rate' | 'fixed'
    depositRate: salon?.depositRate !== undefined ? salon.depositRate : 0.20,
    depositFixedAmount: salon?.depositFixedAmount || 2000,
    minLeadHours: salon?.minLeadHours || 2,
    latenessTolerance: salon?.latenessTolerance || 15,
    policyCancellation: salon?.policyCancellation || "Annulation sans frais possible jusqu'à 24h avant le rendez-vous.",
    // Payments in Salon
    acceptCash: salon?.acceptCash !== false,
    acceptWave: salon?.acceptWave !== false,
    paymentRecipientPhone: salon?.paymentRecipientPhone || salon?.phone || '',
    sendDigitalReceipt: salon?.sendDigitalReceipt !== false,
    // WhatsApp Notifications
    whatsappConfirmEnabled: salon?.whatsappConfirmEnabled !== false,
    whatsappReminderEnabled: salon?.whatsappReminderEnabled !== false,
    whatsappReminderHours: salon?.whatsappReminderHours || 24,
    whatsappTemplate: salon?.whatsappTemplate || "Bonjour {nom_cliente} ! Votre rendez-vous pour {prestation} chez {nom_salon} est confirmé pour le {date} à {heure}. Acompte Wave validé. Merci et à très vite !"
  });

  // Keep form in sync when salon updates from database
  useEffect(() => {
    if (salon) {
      setFormData(prev => ({
        ...prev,
        owner_name: salon.owner_name || prev.owner_name || '',
        name: salon.name || prev.name,
        tagline: salon.tagline || prev.tagline,
        description: salon.description || prev.description,
        phone: salon.phone || prev.phone,
        whatsapp: salon.whatsapp || prev.whatsapp,
        address: salon.address || prev.address,
        city: salon.city || prev.city,
        depositRequired: salon.depositRequired !== undefined ? salon.depositRequired : prev.depositRequired,
        depositType: salon.depositType || prev.depositType,
        depositRate: salon.depositRate !== undefined ? salon.depositRate : prev.depositRate,
        depositFixedAmount: salon.depositFixedAmount !== undefined ? salon.depositFixedAmount : prev.depositFixedAmount,
        minLeadHours: salon.minLeadHours !== undefined ? salon.minLeadHours : prev.minLeadHours,
        latenessTolerance: salon.latenessTolerance !== undefined ? salon.latenessTolerance : prev.latenessTolerance,
        policyCancellation: salon.policyCancellation || prev.policyCancellation,
        acceptCash: salon.acceptCash !== undefined ? salon.acceptCash : prev.acceptCash,
        acceptWave: salon.acceptWave !== undefined ? salon.acceptWave : prev.acceptWave,
        paymentRecipientPhone: salon.paymentRecipientPhone || salon.phone || prev.paymentRecipientPhone,
        sendDigitalReceipt: salon.sendDigitalReceipt !== undefined ? salon.sendDigitalReceipt : prev.sendDigitalReceipt,
        whatsappConfirmEnabled: salon.whatsappConfirmEnabled !== undefined ? salon.whatsappConfirmEnabled : prev.whatsappConfirmEnabled,
        whatsappReminderEnabled: salon.whatsappReminderEnabled !== undefined ? salon.whatsappReminderEnabled : prev.whatsappReminderEnabled,
        whatsappReminderHours: salon.whatsappReminderHours !== undefined ? salon.whatsappReminderHours : prev.whatsappReminderHours,
        whatsappTemplate: salon.whatsappTemplate || prev.whatsappTemplate
      }));
    }
  }, [salon]);

  // Save feedback
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });

  const toggleSection = (sectionId) => {
    setOpenSection(prev => prev === sectionId ? null : sectionId);
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError('');
  };

  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    setSaveError('');

    try {
      await updateSalon(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err) {
      console.error('Erreur sauvegarde paramètres:', err);
      setSaveError("Une erreur est survenue lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Le mot de passe doit comporter au moins 6 caractères.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Les mots de passe ne correspondent pas.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setPasswordMsg({ type: 'success', text: 'Mot de passe mis à jour !' });
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Impossible de mettre à jour le mot de passe.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  const getSimulatedWhatsAppMessage = () => {
    return formData.whatsappTemplate
      .replace('{nom_cliente}', 'Aïcha Diallo')
      .replace('{prestation}', 'Knotless Braids Mi-dos')
      .replace('{nom_salon}', formData.name || 'Notre Salon')
      .replace('{date}', 'Vendredi 18 Octobre')
      .replace('{heure}', '14:30');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-4 pb-12">
      
      {/* En-tête sobre et épuré (aucun bloc lourd) */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
            Paramètres du Salon
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Touchez une rubrique pour l'ouvrir et la modifier.
          </p>
        </div>

        {saveSuccess && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Enregistré !</span>
          </span>
        )}
      </div>

      {saveError && (
        <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* ================= LISTE FLUIDE STYLE IPHONE (ACCORDÉONS SANS SUPERPOSITION) ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs divide-y divide-slate-100 overflow-hidden">
        
        {/* 1. ÉTABLISSEMENT & COORDONNÉES */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('general')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Building className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  Établissement & Coordonnées
                </span>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  {formData.name || 'Nom du salon'} • {formData.phone || 'Téléphone'}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'general' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'general' && (
            <form onSubmit={handleSave} className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Prénom & Nom du Gérant(e) *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.owner_name}
                      onChange={(e) => handleChange('owner_name', e.target.value)}
                      placeholder="ex: Awa Diop"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">S'affiche sur votre tableau de bord personnel.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nom de la marque ou enseigne *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => handleChange('name', e.target.value)}
                      placeholder="ex: BEAUTY AFRICA"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">Nom de marque public affiché sur votre site client.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Slogan ou spécialité
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    placeholder="ex: Salon de coiffure & soins d'exception"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Téléphone d'appel *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+221 77 842 19 80"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      WhatsApp Salon (avec 221) *
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        required
                        value={formData.whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, ''))}
                        placeholder="221784722951"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adresse physique du salon *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="ex: Grand Mbao, Route des Almadies..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">S'affiche directement sur votre site client.</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ville / Quartier *
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleChange('city', e.target.value)}
                      placeholder="ex: Grand Mbao, Dakar"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Présentation courte du salon
                  </label>
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Présentez brièvement vos soins et votre savoir-faire..."
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer les coordonnées</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 2. ACOMPTE WAVE & ANTI-LAPIN */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('booking_rules')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    Acompte Wave & Anti-Lapin
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-pink-50 text-pink-700 text-[10px] font-black shrink-0">
                    Sécurité
                  </span>
                </div>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  {formData.depositRequired
                    ? (formData.depositType === 'rate'
                        ? `Acompte actif : ${Math.round(formData.depositRate * 100)}%`
                        : `Acompte actif : ${formatFCFA(formData.depositFixedAmount)}`)
                    : 'Acompte désactivé'}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'booking_rules' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'booking_rules' && (
            <form onSubmit={handleSave} className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
              {/* Toggle direct Acompte */}
              <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                <div>
                  <strong className="block text-xs font-bold text-slate-900">
                    Acompte Wave obligatoire
                  </strong>
                  <span className="text-[11px] text-slate-500">
                    La cliente doit verser un acompte Wave pour valider sa place.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.depositRequired}
                    onChange={(e) => handleChange('depositRequired', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                </label>
              </div>

              {formData.depositRequired && (
                <div className="space-y-3 pt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleChange('depositType', 'rate')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.depositType === 'rate'
                          ? 'border-pink-600 bg-pink-50 text-pink-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      En pourcentage
                    </button>
                    <button
                      type="button"
                      onClick={() => handleChange('depositType', 'fixed')}
                      className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        formData.depositType === 'fixed'
                          ? 'border-pink-600 bg-pink-50 text-pink-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      }`}
                    >
                      Montant fixe
                    </button>
                  </div>

                  {formData.depositType === 'rate' ? (
                    <div className="grid grid-cols-4 gap-2">
                      {[0.15, 0.20, 0.30, 0.50].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() => handleChange('depositRate', rate)}
                          className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            formData.depositRate === rate
                              ? 'bg-pink-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {Math.round(rate * 100)}%
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[1500, 2000, 3000, 5000].map((amount) => (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => handleChange('depositFixedAmount', amount)}
                          className={`py-2 rounded-xl text-xs font-bold cursor-pointer ${
                            formData.depositFixedAmount === amount
                              ? 'bg-pink-600 text-white shadow-2xs'
                              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {formatFCFA(amount)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Délais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Délai minimum avant le RDV
                  </label>
                  <select
                    value={formData.minLeadHours}
                    onChange={(e) => handleChange('minLeadHours', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value={0}>Immédiat</option>
                    <option value={1}>1 heure à l'avance</option>
                    <option value={2}>2 heures à l'avance (Recommandé)</option>
                    <option value={4}>4 heures à l'avance</option>
                    <option value={24}>24 heures à l'avance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tolérance de retard cliente
                  </label>
                  <select
                    value={formData.latenessTolerance}
                    onChange={(e) => handleChange('latenessTolerance', Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value={10}>10 minutes</option>
                    <option value={15}>15 minutes (Standard Dakar)</option>
                    <option value={20}>20 minutes</option>
                    <option value={30}>30 minutes max</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Politique d'annulation (affichée aux clientes)
                </label>
                <textarea
                  rows={2}
                  value={formData.policyCancellation}
                  onChange={(e) => handleChange('policyCancellation', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer l'acompte</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 3. WHATSAPP & NOTIFICATIONS */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('notifications')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                <MessageCircle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  WhatsApp & Rappels Automatiques
                </span>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  {formData.whatsappReminderEnabled ? 'Confirmation & rappel 24h actifs' : 'Confirmation active'}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'notifications' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'notifications' && (
            <form onSubmit={handleSave} className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <strong className="block text-xs font-bold text-slate-900">
                      Confirmation de RDV immédiate
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Générer le récapitulatif dès que l'acompte Wave est payé.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.whatsappConfirmEnabled}
                      onChange={(e) => handleChange('whatsappConfirmEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <strong className="block text-xs font-bold text-slate-900">
                      Rappel Anti-Lapin 24h avant
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Rappeler le rendez-vous à la cliente la veille par WhatsApp.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.whatsappReminderEnabled}
                      onChange={(e) => handleChange('whatsappReminderEnabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Modèle du message WhatsApp
                  </label>
                  <textarea
                    rows={3}
                    value={formData.whatsappTemplate}
                    onChange={(e) => handleChange('whatsappTemplate', e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                {/* Aperçu WhatsApp minimaliste */}
                <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-emerald-800 block">
                    Aperçu sur le téléphone de la cliente :
                  </span>
                  <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed">
                    {getSimulatedWhatsAppMessage()}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer les messages</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 4. PAIEMENTS SUR PLACE & CAISSE */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('payments')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  Paiements sur Place & Caisse
                </span>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  Espèces{formData.acceptWave ? ', Wave' : ''}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'payments' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'payments' && (
            <form onSubmit={handleSave} className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
              <div className="space-y-3">
                <label className="block text-xs font-bold text-slate-700">
                  Règlements acceptés en caisse :
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <label className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-slate-800">💵 Espèces (Cash)</span>
                    <input
                      type="checkbox"
                      checked={formData.acceptCash}
                      onChange={(e) => handleChange('acceptCash', e.target.checked)}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                  </label>

                  <label className="p-3.5 rounded-xl border border-sky-200 bg-sky-50/40 flex items-center justify-between cursor-pointer">
                    <span className="text-xs font-bold text-sky-900">🌊 Wave Sénégal</span>
                    <input
                      type="checkbox"
                      checked={formData.acceptWave}
                      onChange={(e) => handleChange('acceptWave', e.target.checked)}
                      className="w-4 h-4 text-sky-600 rounded"
                    />
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro de réception Wave au comptoir
                  </label>
                  <input
                    type="text"
                    value={formData.paymentRecipientPhone}
                    onChange={(e) => handleChange('paymentRecipientPhone', e.target.value)}
                    placeholder="ex: 77 842 19 80"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <strong className="block text-xs font-bold text-slate-900">
                      Reçu numérique WhatsApp
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Transmettre un reçu horodaté après encaissement.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={formData.sendDigitalReceipt}
                      onChange={(e) => handleChange('sendDigitalReceipt', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer les paiements</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 5. ABONNEMENT APPOINTFY (9 900 F) */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('subscription')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    Abonnement Appointfy (9 900 F)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-black shrink-0">
                    Pro
                  </span>
                </div>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  Forfait tout inclus • Renouvellement Wave
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'subscription' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'subscription' && (
            <div className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 animate-in fade-in duration-150">
              <SubscriptionManager />
            </div>
          )}
        </div>

        {/* 6. COMPTE GÉRANTE & SÉCURITÉ */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('account')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  Compte Gérante & Sécurité
                </span>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  {currentUser?.email || 'Propriétaire'} • RLS Actif
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'account' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'account' && (
            <div className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-4 animate-in fade-in duration-150">
              {/* Infos compte */}
              <div className="p-3.5 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                <span className="text-slate-500 block">E-mail connecté :</span>
                <span className="font-bold text-slate-900 block truncate">{currentUser?.email}</span>
                <span className="text-[11px] text-emerald-700 font-bold block pt-1">
                  ✓ Données isolées (RLS Supabase Actif)
                </span>
              </div>

              {/* Formulaire Mot de passe */}
              <form onSubmit={handlePasswordChange} className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-3">
                <strong className="block text-xs font-bold text-slate-900">
                  Modifier le mot de passe
                </strong>

                {passwordMsg.text && (
                  <div className={`p-2.5 rounded-lg text-xs font-bold flex items-center gap-2 ${
                    passwordMsg.type === 'success' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                  }`}>
                    {passwordMsg.type === 'success' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />}
                    <span>{passwordMsg.text}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nouveau mot de passe"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirmer"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading || !newPassword}
                  className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-black text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
                >
                  {passwordLoading ? 'Mise à jour...' : 'Mettre à jour'}
                </button>
              </form>

              {/* Assistance WhatsApp VIP Salons */}
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <strong className="block font-bold text-emerald-900">Support VIP WhatsApp Salons</strong>
                  <span className="text-[11px] text-emerald-800">Numéro direct : +221 78 472 29 51</span>
                </div>
                <a
                  href={`https://wa.me/221784722951?text=${encodeURIComponent(`Bonjour Appointfy, je suis le salon ${salon?.name || ''} et j'ai besoin d'aide.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shrink-0"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Écrire</span>
                </a>
              </div>

              {/* Déconnexion */}
              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-slate-400">Session active sur cet appareil</span>
                <button
                  type="button"
                  onClick={logout}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border border-rose-200"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
