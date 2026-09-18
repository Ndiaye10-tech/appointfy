import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, DEFAULT_COUNTRY, formatPhoneNumber } from '../../data/countries';
import { BUSINESS_TYPES } from '../../data/businessTemplates';
import { CountryFlag } from '../common/CountryFlag';
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  Scissors,
  Eye,
  Heart,
  Store,
  ShieldCheck,
  BellRing,
  Phone,
  Mail,
  Lock,
  User,
  AlertCircle,
  X,
  Home,
  Building2,
  Repeat,
  ShieldAlert,
  CalendarCheck,
  Clock,
  Globe,
  MapPin
} from 'lucide-react';

export const OnboardingWizard = ({
  isOpen,
  onClose,
  initialData = {},
  onComplete,
  onSwitchToLogin
}) => {
  if (!isOpen) return null;

  const { currentUser, setCurrentUser, completeOnboarding } = useBooking();

  // stage: 0 = Accueil, 1 = Nom & Mode d'exercice, 2 = Spécialité, 3 = Protection créneaux (Acompte), 4 = Localisation, 5 = Compte & Alertes
  const [stage, setStage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // État du formulaire
  const [formData, setFormData] = useState({
    brandName: initialData.brandName || '',
    slug: '',
    workMode: initialData.workMode || 'salon', // 'salon' | 'home' | 'both'
    businessType: initialData.businessType || 'hair_braids',
    bookingPolicy: 'deposit', // 'deposit' (Acompte Mobile Money) | 'instant' (Sans acompte) | 'manual' (Validation manuelle)
    country: initialData.country || DEFAULT_COUNTRY,
    city: initialData.city || '',
    address: initialData.address || '',
    ownerName: initialData.ownerName || '',
    phone: initialData.phone || '',
    email: initialData.email || '',
    password: initialData.password || '',
    ...initialData
  });

  const currentCountry = COUNTRIES[formData.country] || COUNTRIES.SN;
  const currentBusiness = BUSINESS_TYPES[formData.businessType] || BUSINESS_TYPES.hair_braids;

  const handleBrandNameChange = (val) => {
    const slugified = val
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    setFormData(prev => ({
      ...prev,
      brandName: val,
      slug: slugified || 'mon-salon'
    }));
  };

  const handleNext = () => {
    setErrorMsg('');

    if (stage === 1) {
      if (!formData.brandName.trim()) {
        setErrorMsg('Veuillez renseigner le nom de votre salon ou espace beauté.');
        return;
      }
    } else if (stage === 4) {
      if (!formData.country) {
        setErrorMsg('Veuillez sélectionner le pays où vous êtes basée.');
        return;
      }
      if (!formData.city.trim()) {
        setErrorMsg('Veuillez indiquer la ville ou localité de votre activité.');
        return;
      }
    }

    setStage(prev => prev + 1);
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (stage > 0) {
      setStage(prev => prev - 1);
    }
  };

  const handleFinalize = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (!formData.ownerName.trim()) {
      setErrorMsg('Veuillez renseigner votre prénom et nom.');
      return;
    }
    if (!currentUser?.id) {
      if (!formData.email.trim() || !formData.email.includes('@')) {
        setErrorMsg('Veuillez renseigner une adresse email valide.');
        return;
      }
      if (!formData.password || formData.password.length < 6) {
        setErrorMsg('Le mot de passe doit comporter au moins 6 caractères.');
        return;
      }
    }

    setSubmitting(true);
    try {
      let currentUserId = currentUser?.id || null;

      // 1. Création compte Supabase Auth si non connecté
      if (!currentUserId && formData.email && formData.password) {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email.trim(),
          password: formData.password,
          options: {
            data: {
              salon_name: formData.brandName.trim(),
              owner_name: formData.ownerName.trim(),
              phone: formData.phone
            }
          }
        });

        if (authError) {
          if (authError.message?.toLowerCase().includes('already registered')) {
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
              email: formData.email.trim(),
              password: formData.password
            });
            if (signInError) {
              throw new Error('Un compte existe déjà avec cet email. Mot de passe incorrect.');
            }
            currentUserId = signInData.user?.id;
            setCurrentUser(signInData.user);
          } else {
            throw authError;
          }
        } else {
          currentUserId = authData.user?.id;
          setCurrentUser(authData.user || { email: formData.email, id: currentUserId });
        }
      }

      // 2. Finalisation du salon
      const cleanPhone = formData.phone.trim() ? `${currentCountry.dialCode} ${formData.phone.trim()}` : '';
      const isDepositRequired = formData.bookingPolicy === 'deposit';
      const cleanCity = formData.city.trim();
      const cleanAddress = formData.address.trim();

      const finalizedData = {
        owner_id: currentUserId,
        owner_name: formData.ownerName.trim(),
        name: formData.brandName.trim(),
        slug: formData.slug || 'salon-' + Math.floor(100 + Math.random() * 900),
        country: formData.country,
        city: cleanCity ? `${cleanCity}, ${currentCountry.name}` : currentCountry.name,
        address: cleanAddress || cleanCity || currentCountry.name,
        business_type: formData.businessType,
        work_mode: formData.workMode || 'salon',
        phone: cleanPhone,
        whatsapp: cleanPhone,
        wave_number: cleanPhone,
        deposit_rate: isDepositRequired ? 0.20 : 0,
        deposit_type: 'rate',
        deposit_required: isDepositRequired
      };

      if (onComplete) {
        await onComplete(finalizedData);
      } else {
        await completeOnboarding(finalizedData);
      }

    } catch (err) {
      console.error('Erreur inscription onboarding:', err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de la configuration de votre salon.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* ================= BARRE DU HAUT : NAVIGATION & PROGRESSION ================= */}
        {stage > 0 && (
          <div className="border-b border-slate-100 bg-white px-5 py-3.5">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 -ml-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors flex items-center gap-1 text-xs font-bold cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm font-black tracking-tight text-slate-950">
                  Appoint<span className="text-pink-600">fy</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">
                  Étape {stage}/5
                </span>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Barre de progression fluide */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="bg-gradient-to-r from-pink-500 to-pink-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${(stage / 5) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Message d'erreur s'il y a lieu */}
        {errorMsg && (
          <div className="mx-6 mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ================= CONTENU PAR ÉTAPE ================= */}
        <div className="p-6 sm:p-8">

          {/* ---------------- 0. ÉCRAN D'ACCUEIL : ACCROCHE PRO APPOINTFY ---------------- */}
          {stage === 0 && (
            <div className="text-center space-y-6 py-2">
              <div className="flex justify-center">
                <span className="text-2xl font-black tracking-tight text-slate-950">
                  Appoint<span className="text-pink-600">fy</span>
                </span>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                  Donnez une adresse officielle à votre salon.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Votre vitrine en ligne, vos créneaux protégés contre les désistements et vos alertes de réservation en direct.
                </p>
              </div>

              {/* 3 piliers métier concrets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-1">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-pink-100 text-pink-700 flex items-center justify-center mb-2">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                  <strong className="block text-xs font-bold text-slate-900">Lien unique</strong>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    À mettre dans votre bio Instagram & WhatsApp.
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                  <strong className="block text-xs font-bold text-slate-900">Anti-Lapin</strong>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Acompte Mobile Money pour sécuriser chaque créneau.
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-2">
                    <BellRing className="w-3.5 h-3.5" />
                  </div>
                  <strong className="block text-xs font-bold text-slate-900">Alerte directe</strong>
                  <span className="text-[11px] text-slate-500 leading-tight block mt-0.5">
                    Sonnette de caisse et notification sur votre écran.
                  </span>
                </div>
              </div>

              <div className="pt-2 space-y-3 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-all cursor-pointer"
                >
                  <span>Configurer mon salon en 2 min</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {onSwitchToLogin && (
                  <button
                    type="button"
                    onClick={onSwitchToLogin}
                    className="block w-full text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors py-1 cursor-pointer"
                  >
                    J'ai déjà un compte Appointfy
                  </button>
                )}
              </div>
            </div>
          )}

          {/* ---------------- 1. ÉTAPE 1/5 : NOM DU SALON & MODE DE TRAVAIL ---------------- */}
          {stage === 1 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Quel nom vos clientes verront-elles ?
                </h2>
                <p className="text-xs text-slate-500">
                  Ce nom apparaîtra sur votre page de réservation et sur vos reçus officiels.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  autoFocus
                  value={formData.brandName}
                  onChange={(e) => handleBrandNameChange(e.target.value)}
                  placeholder="Ex : Awa Beauty Studio, Royal Braids..."
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-pink-600 focus:outline-none text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-400 transition-all"
                />

                <div className="p-3.5 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 mt-3 flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-700 shrink-0" />
                  <div className="min-w-0">
                    <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider block">
                      Votre lien public personnalisé :
                    </span>
                    <span className="font-mono font-black text-emerald-950 text-xs sm:text-sm truncate block">
                      appointfy.com/{formData.slug || 'nom-de-votre-salon'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mode d'exercice : en institut ou domicile */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700">
                  Comment recevez-vous vos clientes ?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'salon', label: 'En salon privé', icon: Building2, desc: 'Adresse fixe' },
                    { id: 'home', label: 'À domicile', icon: Home, desc: 'Déplacement' },
                    { id: 'both', label: 'Les deux', icon: Repeat, desc: 'Mixte' }
                  ].map((mode) => {
                    const ModeIcon = mode.icon;
                    const isSelected = formData.workMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, workMode: mode.id }))}
                        className={`p-3 rounded-2xl border-2 text-center transition-all cursor-pointer flex flex-col items-center justify-center ${
                          isSelected
                            ? 'border-pink-600 bg-pink-50/70 ring-2 ring-pink-500/20 text-pink-950 font-bold'
                            : 'border-slate-200 hover:border-slate-300 bg-white text-slate-600'
                        }`}
                      >
                        <ModeIcon className={`w-4 h-4 mb-1 ${isSelected ? 'text-pink-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-black block leading-tight">{mode.label}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">{mode.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!formData.brandName.trim()}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-pink-200 transition-all cursor-pointer disabled:opacity-40"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- 2. ÉTAPE 2/5 : SPÉCIALITÉ MÉTIER & MENU DE SOINS ---------------- */}
          {stage === 2 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Quelle est votre expertise principale ?
                </h2>
                <p className="text-xs text-slate-500">
                  Pour adapter l'ambiance et la thématique de votre vitrine à votre activité.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { id: 'hair_braids', label: 'Coiffure & Tresses', icon: '✂️', desc: 'Knotless, Nattes, Tissage' },
                  { id: 'nails', label: 'Onglerie & Manucure', icon: '💅', desc: 'Gel X, Résine, Pédicure' },
                  { id: 'lashes_makeup', label: 'Cils & Makeup', icon: '👁️', desc: 'Volume Russe, Henna, Soirée' },
                  { id: 'barber', label: 'Barbershop Homme', icon: '💈', desc: 'Coupes, Dégradés & Barbe' },
                  { id: 'spa_massage', label: 'Spa & Massages', icon: '💆‍♀️', desc: 'Massages relaxants, Soins' },
                  { id: 'mixte', label: 'Institut Tout-en-un', icon: '🌟', desc: 'Coiffure, Ongles & Esthétique' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, businessType: item.id }))}
                    className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                      formData.businessType === item.id
                        ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-2xl mb-1.5">{item.icon}</div>
                      <strong className="block text-xs sm:text-sm font-black text-slate-900 leading-snug">
                        {item.label}
                      </strong>
                    </div>
                    <span className="text-[10px] sm:text-[11px] text-slate-500 mt-1 block">
                      {item.desc}
                    </span>
                  </button>
                ))}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-pink-200 transition-all cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- 3. ÉTAPE 3/5 : RÈGLE DE RÉSERVATION & ACOMPTE ANTI-LAPIN ---------------- */}
          {stage === 3 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Comment souhaitez-vous sécuriser vos rendez-vous ?
                </h2>
                <p className="text-xs text-slate-500">
                  Choisissez la règle de réservation qui protège le mieux votre temps de travail.
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    id: 'deposit',
                    title: 'Acompte Mobile Money (Recommandé anti-lapin)',
                    desc: 'La cliente verse un acompte de 20% par Wave ou Orange Money pour bloquer son créneau. Fini les rendez-vous non honorés.',
                    badge: 'Fortement recommandé',
                    icon: ShieldCheck,
                    badgeColor: 'bg-emerald-100 text-emerald-800'
                  },
                  {
                    id: 'instant',
                    title: 'Réservation directe sans acompte',
                    desc: 'Vos clientes choisissent leur heure et bloquent leur rendez-vous en 2 clics sans paiement préalable.',
                    icon: CalendarCheck
                  },
                  {
                    id: 'manual',
                    title: 'Validation préalable sur demande',
                    desc: 'La cliente sollicite un horaire et vous confirmez manuellement chaque demande avant qu\'elle soit validée.',
                    icon: Clock
                  }
                ].map((rule) => {
                  const RuleIcon = rule.icon;
                  const isSelected = formData.bookingPolicy === rule.id;

                  return (
                    <button
                      key={rule.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, bookingPolicy: rule.id }))}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'border-pink-600 bg-pink-50/50 ring-2 ring-pink-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected ? 'bg-pink-100 text-pink-700' : 'bg-slate-100 text-slate-500'
                          }`}>
                            <RuleIcon className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-xs sm:text-sm font-black text-slate-950">
                                {rule.title}
                              </strong>
                              {rule.badge && (
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${rule.badgeColor}`}>
                                  {rule.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 leading-relaxed mt-1">
                              {rule.desc}
                            </p>
                          </div>
                        </div>

                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-1 ${
                          isSelected ? 'border-pink-600 bg-pink-600 text-white' : 'border-slate-300'
                        }`}>
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-pink-200 transition-all cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- 4. ÉTAPE 4/5 : OÙ ÊTES-VOUS BASÉE ? ---------------- */}
          {stage === 4 && (
            <div className="space-y-4">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Où êtes-vous basée ?
                </h2>
                <p className="text-xs text-slate-500">
                  Choisissez votre pays et indiquez précisément votre ville et quartier pour vos clientes.
                </p>
              </div>

              {/* Sélection du Pays */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  Pays d'activité *
                </label>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {Object.values(COUNTRIES).map((c) => {
                    const isSelected = formData.country === c.code;

                    return (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, country: c.code }))}
                        className={`p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'border-pink-600 bg-pink-50/60 ring-2 ring-pink-500/20 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <CountryFlag code={c.code} className="w-9 h-6 sm:w-10 sm:h-7 rounded-md object-cover shadow-xs border border-slate-200/90 shrink-0" />
                          <div className="min-w-0">
                            <strong className="block text-xs sm:text-sm font-black text-slate-900 leading-snug truncate">
                              {c.name}
                            </strong>
                            <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold block truncate">
                              Devise {c.currency}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-pink-600 text-white flex items-center justify-center shrink-0">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Saisie Libre de la Ville / Localité */}
              <div className="space-y-3 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-slate-700">
                      Votre Ville ou Localité *
                    </label>
                    <span className="text-[10px] font-medium text-slate-400">
                      (ex : {currentCountry.popularCities?.slice(0, 3).join(', ')}...)
                    </span>
                  </div>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      placeholder={formData.country === 'CI' ? "Ex : Abidjan, Bouaké, Yamoussoukro, San-Pédro..." : "Ex : Dakar, Thiès, Touba, Saint-Louis, Mbour..."}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>

                  {/* Suggestions rapides cliquables */}
                  {Array.isArray(currentCountry.popularCities) && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <span className="text-[10px] text-slate-400 font-bold self-center mr-1">Suggestions :</span>
                      {currentCountry.popularCities.slice(0, 6).map((popCity) => (
                        <button
                          key={popCity}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, city: popCity }))}
                          className={`text-[11px] px-2.5 py-1 rounded-lg border font-semibold transition cursor-pointer ${
                            formData.city.toLowerCase() === popCity.toLowerCase()
                              ? 'bg-pink-100 text-pink-700 border-pink-300 font-bold'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          {popCity}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Saisie Libre du Quartier / Adresse */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quartier ou Adresse physique {formData.workMode === 'salon' ? '*' : '(Optionnel)'}
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                      placeholder={formData.country === 'CI' ? "Ex : Cocody Angré, Marcory Zone 4, Yopougon..." : "Ex : Almadies, Sacré-Cœur, Médina, Liberté 6..."}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Moyens de paiement activés pour le {currentCountry.name} :
                </span>
                <div className="flex flex-wrap gap-2">
                  {(currentCountry.paymentMethods || []).map((method) => (
                    <span
                      key={method.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${method.color}`}
                    >
                      {method.id === 'wave' && (
                        <img src="/wave-logo.png" alt="Wave" className="w-4 h-4 rounded-xs object-cover inline-block shrink-0" />
                      )}
                      {method.id === 'paystack' && '💳'}
                      {method.id === 'orange' && '🟧'}
                      {method.id === 'mtn' && '🟨'}
                      {method.id === 'moov' && '🔶'}
                      {method.id === 'tmoney' && '🟢'}
                      {method.id === 'card' && '💳'}
                      <span>{method.name}</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleNext}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-md shadow-pink-200 transition-all cursor-pointer"
                >
                  <span>Continuer</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ---------------- 5. ÉTAPE 5/5 : COORDONNÉES GÉRANTE & ALERTES EN DIRECT ---------------- */}
          {stage === 5 && (
            <form onSubmit={handleFinalize} className="space-y-4">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Où devons-nous vous alerter ?
                </h2>
                <p className="text-xs text-slate-500">
                  Vos identifiants gérante et vos coordonnées professionnelles.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Votre prénom et nom *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      autoFocus
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Ex : Fatou Diallo"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Numéro WhatsApp / Téléphone professionnel *
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shrink-0 flex items-center gap-2">
                      <CountryFlag code={formData.country} className="w-5 h-3.5 rounded object-cover shadow-2xs border border-slate-200 shrink-0" />
                      <span>{currentCountry.dialCode}</span>
                    </span>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value, formData.country) }))}
                      placeholder={currentCountry.phoneMask || '77 000 00 00'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                {!currentUser?.id && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Adresse e-mail de connexion *
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="votre-salon@gmail.com"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Mot de passe sécurisé (6 caractères min) *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                        <input
                          type="password"
                          required
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Encadré d'alerte dans l'application (spécification utilisateur) */}
                <div className="p-3.5 rounded-2xl bg-purple-50/80 border border-purple-200 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                    <BellRing className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="block text-xs font-bold text-purple-950">
                      Alertes de réservation intégrées dans l'application
                    </strong>
                    <span className="text-[11px] text-purple-800/90 leading-relaxed block mt-0.5">
                      Dès qu'une cliente réserve son créneau, la sonnerie de caisse retentit et la notification s'affiche en direct sur votre écran.
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <span>{submitting ? 'Préparation de votre salon...' : 'Lancer mon salon en direct 🚀'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
