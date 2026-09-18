import React, { useState, useEffect } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { useNotifications } from '../../context/NotificationContext';
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
  RefreshCw,
  Bell,
  BellRing,
  Volume2,
  VolumeX,
  Play,
  Music,
  Gift,
  Crown
} from 'lucide-react';

export const SettingsManager = ({ defaultSection }) => {
  const { salon, currentUser, logout, updateSalon, isSubscriptionExpired } = useBooking();
  const {
    soundEnabled,
    setSoundEnabled,
    soundVolume,
    setSoundVolume,
    soundPreset,
    setSoundPreset,
    voiceEnabled,
    setVoiceEnabled,
    pushPermission,
    requestPush,
    triggerTestAlert
  } = useNotifications();

  const [testingSound, setTestingSound] = useState(false);

  const handleTestSound = () => {
    setTestingSound(true);
    triggerTestAlert();
    setTimeout(() => setTestingSound(false), 5500);
  };


  // Accordion state: 'general' | 'deposit' | 'notifications' | 'payments' | 'loyalty' | 'subscription' | 'account'
  const [openSection, setOpenSection] = useState(defaultSection || 'general');

  useEffect(() => {
    if (defaultSection) {
      setOpenSection(defaultSection);
    }
  }, [defaultSection]);

  // Form states initialized with salon data
  const [formData, setFormData] = useState({
    // General
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
    // Programme de Fidélité Client
    loyalty_enabled: salon?.loyalty_enabled !== false,
    loyalty_target_visits: salon?.loyalty_target_visits || 5,
    loyalty_reward_type: salon?.loyalty_reward_type || 'amount', // 'amount' | 'percent' | 'service'
    loyalty_reward_value: salon?.loyalty_reward_value !== undefined ? salon.loyalty_reward_value : 2000,
    loyalty_reward_description: salon?.loyalty_reward_description || '2 000 F de remise immédiate ou 1 soin offert',
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
        loyalty_enabled: salon.loyalty_enabled !== undefined ? salon.loyalty_enabled : prev.loyalty_enabled,
        loyalty_target_visits: salon.loyalty_target_visits || prev.loyalty_target_visits || 5,
        loyalty_reward_type: salon.loyalty_reward_type || prev.loyalty_reward_type || 'amount',
        loyalty_reward_value: salon.loyalty_reward_value !== undefined ? salon.loyalty_reward_value : prev.loyalty_reward_value,
        loyalty_reward_description: salon.loyalty_reward_description || prev.loyalty_reward_description,
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
                      placeholder="ex: Ville, Commune ou Quartier"
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
                    <option value={15}>15 minutes (Recommandé)</option>
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

        {/* 3. ALERTES SONORES, PUSH & WHATSAPP */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('notifications')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center shrink-0">
                <BellRing className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="font-bold text-sm text-slate-900 block truncate">
                  Alertes Sonores, Push & WhatsApp
                </span>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  Sonnerie {soundEnabled ? `active (${soundPreset})` : 'coupée'} • {pushPermission === 'granted' ? 'Push actif' : 'Push disponible'} • WhatsApp
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
            <div className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-6 animate-in fade-in duration-150">
              
              {/* ================= SOUS-SECTION 1 : ALERTES SONORES CAISSE & COMPTOIR ================= */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Sonnerie de Nouvelle Réservation
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Fait sonner la tablette ou l'ordinateur du salon à chaque nouvelle réservation Wave.
                      </span>
                    </div>
                  </div>

                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={soundEnabled}
                      onChange={(e) => setSoundEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                  </label>
                </div>

                {soundEnabled && (
                  <div className="space-y-4 pt-1 animate-in fade-in duration-150">
                    {/* Choix de la Sonnerie */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">
                        Tonalité de la sonnerie :
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {[
                          { id: 'cash', label: 'Caisse Enregistreuse', icon: '💰', desc: 'Ka-Ching argenté' },
                          { id: 'chime', label: 'Carillon Zen', icon: '🔔', desc: 'Harmonique chic' },
                          { id: 'bell', label: 'Cloche Accueil', icon: '🛎️', desc: 'Double tintement' },
                          { id: 'minimal', label: 'Bip Moderne', icon: '🎵', desc: 'Alerte rapide' }
                        ].map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => setSoundPreset(preset.id)}
                            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                              soundPreset === preset.id
                                ? 'border-pink-600 bg-pink-50/70 text-pink-950 ring-2 ring-pink-500/20 shadow-xs'
                                : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="text-base mb-1">{preset.icon}</div>
                            <strong className="block text-xs font-bold truncate">{preset.label}</strong>
                            <span className="text-[10px] text-slate-500 block truncate">{preset.desc}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Curseur de Volume Boosté (Jusqu'à 150%) */}
                    <div className="space-y-2 p-3.5 rounded-2xl bg-pink-50/50 border border-pink-100">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800 flex items-center gap-1.5">
                          <Volume2 className="w-4 h-4 text-pink-600" />
                          <span>Puissance Sonore :</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-600 text-white font-black">
                            {Math.round(soundVolume * 100)}% {soundVolume >= 1.3 ? '🔥 ULTRA FORT' : ''}
                          </span>
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="1.5"
                        step="0.1"
                        value={soundVolume}
                        onChange={(e) => setSoundVolume(Number(e.target.value))}
                        className="w-full h-2.5 bg-pink-200 rounded-lg appearance-none cursor-pointer accent-pink-600"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-semibold px-0.5">
                        <span>50%</span>
                        <span>100% (Normal)</span>
                        <span>130%</span>
                        <span className="text-pink-700 font-black">150% (Maxi-Salon)</span>
                      </div>
                    </div>

                    {/* Toggle Annonce Vocale Parlée */}
                    <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/70 flex items-center justify-between gap-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
                          <span>🗣️ Annonce Vocale Parlée (Text-to-Speech)</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          Le téléphone énonce à voix haute : <em>« Nouveau rendez-vous pour [Cliente], Prestation [Soin], Date et Heure »</em>.
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={voiceEnabled}
                          onChange={(e) => setVoiceEnabled(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {/* Bouton de Test Sonore & Vocal Immédiat */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleTestSound}
                        disabled={testingSound}
                        className="w-full sm:w-auto px-5 py-3 rounded-xl bg-gradient-to-r from-pink-600 via-rose-600 to-amber-600 hover:from-pink-500 hover:to-amber-500 text-white font-black text-xs inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-pink-500/25 active:scale-98"
                      >
                        <Play className={`w-4 h-4 fill-white ${testingSound ? 'animate-ping' : ''}`} />
                        <span>{testingSound ? '🔊 Diffusion en cours (Carillon + Voix 150%)...' : '🔊 Tester l\'alerte sonore & vocale (150%)'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* ================= SOUS-SECTION 2 : NOTIFICATIONS PUSH NAVIGATEUR ================= */}
              <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Notifications Push (Écran & Téléphone)
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Recevez des alertes pop-up même si le site est en arrière-plan ou l'écran verrouillé.
                      </span>
                    </div>
                  </div>

                  {pushPermission === 'granted' ? (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200 shrink-0">
                      ✓ Actives
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={requestPush}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shrink-0 transition-all shadow-xs cursor-pointer"
                    >
                      Activer le Push
                    </button>
                  )}
                </div>
              </div>

              {/* ================= SOUS-SECTION 3 : WHATSAPP & CONFIRMATIONS ================= */}
              <form onSubmit={handleSave} className="space-y-4">
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-white border border-slate-200 flex items-center justify-between gap-3">
                    <div>
                      <strong className="block text-xs font-bold text-slate-900">
                        Confirmation de RDV immédiate
                      </strong>
                      <span className="text-[11px] text-slate-500">
                        Générer le récapitulatif dès que l'acompte Wave est validé.
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
                    <p className="text-[10px] text-slate-400 mt-1">
                      Variables dynamiques : {'{nom_cliente}'}, {'{prestation}'}, {'{nom_salon}'}, {'{date}'}, {'{heure}'}
                    </p>
                  </div>

                  {/* Aperçu WhatsApp */}
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-emerald-800 block">
                      Aperçu sur le téléphone de la cliente :
                    </span>
                    <p className="text-[11px] text-slate-700 whitespace-pre-line leading-relaxed font-sans">
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
                    <span>Enregistrer les réglages</span>
                  </button>
                </div>
              </form>

            </div>
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

        {/* 5. PROGRAMME DE FIDÉLITÉ & CARTE À TAMPONS (CONTRÔLÉ PAR LA GÉRANTE) */}
        <div>
          <button
            type="button"
            onClick={() => toggleSection('loyalty')}
            className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/60 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Gift className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    Programme de Fidélité & Carte à Tampons
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                    formData.loyalty_enabled 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {formData.loyalty_enabled ? 'Actif' : 'Désactivé'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 block truncate mt-0.5">
                  {formData.loyalty_enabled 
                    ? `Objectif : ${formData.loyalty_target_visits} visites pour débloquer « ${formData.loyalty_reward_description} »`
                    : 'Encouragez vos clientes à revenir régulièrement'}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-slate-400 transition-transform duration-200 shrink-0 ml-2 ${
              openSection === 'loyalty' ? 'rotate-180 text-slate-900' : ''
            }`}>
              <ChevronDown className="w-5 h-5" />
            </div>
          </button>

          {openSection === 'loyalty' && (
            <form onSubmit={handleSave} className="p-4 sm:p-6 bg-slate-50/40 border-t border-slate-100 space-y-5 animate-in fade-in duration-150">
              
              {/* Interrupteur Activation */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-4">
                <div className="space-y-0.5">
                  <strong className="block text-xs sm:text-sm font-bold text-slate-900">
                    Activer la Carte de Fidélité Client
                  </strong>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Comptabilise automatiquement les passages par numéro de téléphone et motive vos clientes à revenir.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.loyalty_enabled}
                    onChange={(e) => handleChange('loyalty_enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                </label>
              </div>

              {formData.loyalty_enabled && (
                <div className="space-y-4">
                  {/* Choix du seuil de visites */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Nombre de visites requises pour débloquer le cadeau :
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[5, 8, 10].map(nb => (
                        <button
                          key={nb}
                          type="button"
                          onClick={() => handleChange('loyalty_target_visits', nb)}
                          className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            Number(formData.loyalty_target_visits) === nb
                              ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-black'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 font-bold text-xs'
                          }`}
                        >
                          <span className="block text-base">{nb} visites</span>
                          <span className="text-[10px] opacity-80 block">
                            {nb === 5 ? 'Populaire ⭐' : `${nb} passages`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Choix du type de récompense */}
                  <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-3">
                    <label className="block text-xs font-bold text-slate-800">
                      Type d'avantage accordé à la cliente fidèle :
                    </label>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <button
                        type="button"
                        onClick={() => handleChange('loyalty_reward_type', 'amount')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formData.loyalty_reward_type === 'amount'
                            ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-black text-amber-900">💵 Remise fixe (FCFA)</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Ex: 2 000 FCFA déduits à la caisse</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('loyalty_reward_type', 'percent')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formData.loyalty_reward_type === 'percent'
                            ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-black text-amber-900">🏷️ Pourcentage (%)</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Ex: -20% sur la visite</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleChange('loyalty_reward_type', 'service')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                          formData.loyalty_reward_type === 'service'
                            ? 'bg-amber-50 border-amber-400 text-amber-950 font-bold ring-1 ring-amber-400'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span className="block text-xs font-black text-amber-900">🎁 Prestation offerte</span>
                        <span className="text-[11px] text-slate-500 block mt-0.5">Ex: Soin vapeur ou Brushing offert</span>
                      </button>
                    </div>

                    {/* Valeur selon le type */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      {formData.loyalty_reward_type === 'amount' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Montant de la remise (FCFA)
                          </label>
                          <input
                            type="number"
                            step="500"
                            min="500"
                            value={formData.loyalty_reward_value}
                            onChange={(e) => handleChange('loyalty_reward_value', Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}

                      {formData.loyalty_reward_type === 'percent' && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Pourcentage de réduction (%)
                          </label>
                          <input
                            type="number"
                            min="5"
                            max="100"
                            value={formData.loyalty_reward_value}
                            onChange={(e) => handleChange('loyalty_reward_value', Number(e.target.value))}
                            className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      )}

                      <div className={formData.loyalty_reward_type === 'service' ? 'sm:col-span-2' : ''}>
                        <label className="block text-xs font-bold text-slate-700 mb-1">
                          Intitulé / Nom du cadeau pour les clientes *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.loyalty_reward_description}
                          onChange={(e) => handleChange('loyalty_reward_description', e.target.value)}
                          placeholder="ex: 2 000 F de remise ou 1 Soin vapeur offert"
                          className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aperçu Visuel Carte à Tampons */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/30 border border-amber-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-600" />
                        <span className="text-xs font-black text-amber-950 uppercase tracking-wider">
                          Aperçu de la Carte de Fidélité Cliente
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                        Exemple : 4 / {formData.loyalty_target_visits} visites
                      </span>
                    </div>

                    <p className="text-xs text-amber-900">
                      Voici comment vos clientes et votre équipe visualisent les tampons :
                    </p>

                    {/* Pastilles visuelles */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      {Array.from({ length: Number(formData.loyalty_target_visits) || 5 }).map((_, idx) => {
                        const isStamped = idx < 4; // Simule 4 tampons
                        const isLast = idx === (Number(formData.loyalty_target_visits) || 5) - 1;
                        return (
                          <div
                            key={idx}
                            className={`w-10 h-10 rounded-2xl flex flex-col items-center justify-center font-black text-xs border shadow-2xs transition-all ${
                              isStamped
                                ? 'bg-amber-500 text-white border-amber-600 shadow-amber-200 scale-105'
                                : isLast
                                ? 'bg-white border-dashed border-amber-400 text-amber-600 animate-pulse'
                                : 'bg-white border-slate-200 text-slate-400'
                            }`}
                          >
                            {isStamped ? (
                              <span>✓</span>
                            ) : isLast ? (
                              <Gift className="w-4 h-4" />
                            ) : (
                              <span>{idx + 1}</span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <p className="text-[11px] text-amber-800 italic pt-1">
                      🎁 Récompense au {formData.loyalty_target_visits}ème passage : <strong>{formData.loyalty_reward_description}</strong>
                    </p>
                  </div>

                  {/* Alerte Sécurité & Contrôle Gérante */}
                  <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-2.5 text-xs text-blue-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="block font-bold">Contrôle Gérante Garanti à 100% :</strong>
                      <span className="text-[11px] text-blue-800 leading-relaxed block mt-0.5">
                        Aucun cadeau n'est déduit automatiquement. À la caisse, la gérante ou la caissière doit obligatoirement cocher la case d'application pour valider la remise.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 shadow-md shadow-amber-600/20"
                >
                  {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Enregistrer la fidélité</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* 6. ABONNEMENT APPOINTFY (9 900 F) */}
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
                  <span className="text-[11px] text-emerald-800">Équipe dédiée aux salons partenaires • Réponse rapide</span>
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
