import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, DEFAULT_COUNTRY, formatPhoneNumber } from '../../data/countries';
import { BUSINESS_TYPES } from '../../data/businessTemplates';
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
  MessageCircle,
  BookOpen,
  AlertTriangle,
  Home,
  Rocket,
  CreditCard
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

  // stage: 0 = Accueil / Hook, 1 = Nom du salon, 2 = Spécialité, 3 = Situation, 4 = Pays, 5 = Compte & Alertes
  const [stage, setStage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    brandName: initialData.brandName || '',
    slug: '',
    businessType: initialData.businessType || 'hair_braids',
    situation: 'whatsapp', // 'whatsapp', 'carnet', 'lapins', 'domicile', 'start'
    country: initialData.country || DEFAULT_COUNTRY,
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
        setErrorMsg('Veuillez donner un nom à votre salon ou activité.');
        return;
      }
    } else if (stage === 4) {
      if (!formData.country) {
        setErrorMsg('Veuillez sélectionner votre pays.');
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

      // 2. Finalisation et enregistrement du salon avec template métier
      const cleanPhone = formData.phone.trim() ? `${currentCountry.dialCode} ${formData.phone.trim()}` : '';

      const finalizedData = {
        owner_id: currentUserId,
        owner_name: formData.ownerName.trim(),
        name: formData.brandName.trim(),
        slug: formData.slug || 'salon-' + Math.floor(100 + Math.random() * 900),
        country: formData.country,
        city: currentCountry.defaultCity || 'Dakar',
        address: currentCountry.defaultCity || 'Dakar',
        business_type: formData.businessType,
        work_mode: 'salon',
        phone: cleanPhone,
        whatsapp: cleanPhone,
        wave_number: cleanPhone,
        deposit_rate: 0.20,
        deposit_type: 'rate',
        deposit_required: true
      };

      if (onComplete) {
        await onComplete(finalizedData);
      } else {
        await completeOnboarding(finalizedData);
      }

    } catch (err) {
      console.error('Erreur inscription onboarding:', err);
      setErrorMsg(err.message || 'Une erreur est survenue lors de la création de votre salon.');
    } finally {
      setSubmitting(false);
    }
  };

  // Nom d'usage pour la personnalisation
  const ownerFirstName = formData.ownerName.trim() ? formData.ownerName.trim().split(' ')[0] : (formData.brandName ? formData.brandName.split(' ')[0] : 'chère gérante');

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
                    className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
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

          {/* ---------------- 0. ÉCRAN D'ACCUEIL / HOOK ---------------- */}
          {stage === 0 && (
            <div className="text-center space-y-6 py-2">
              <div className="flex justify-center">
                <span className="text-2xl font-black tracking-tight text-slate-950">
                  Appoint<span className="text-pink-600">fy</span>
                </span>
              </div>

              <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-pink-50 text-pink-700 text-xs font-black border border-pink-200 shadow-2xs">
                <span>⏱️ 60 secondes chrono</span>
              </div>

              <div className="space-y-2 max-w-md mx-auto">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight leading-tight">
                  Réponds à 5 questions.<br />
                  Ton salon sera <span className="text-pink-600">prêt</span>.
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Pas de blabla, pas de formulaire compliqué. Tu réponds, on prépare ton site de réservation pendant ce temps. Gratuit.
                </p>
              </div>

              {/* Preuve sociale */}
              <div className="flex items-center justify-center gap-2.5 pt-1">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="w-7 h-7 rounded-full bg-pink-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">AD</div>
                  <div className="w-7 h-7 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">FD</div>
                  <div className="w-7 h-7 rounded-full bg-amber-500 text-white font-bold text-[10px] flex items-center justify-center border-2 border-white">MD</div>
                </div>
                <span className="text-xs font-semibold text-slate-600">
                  <strong className="text-slate-900">+150 salons</strong> reçoivent déjà leurs réservations
                </span>
              </div>

              <div className="pt-4 space-y-3 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={() => setStage(1)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-pink-200 transition-all cursor-pointer"
                >
                  <span>C'est parti</span>
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

          {/* ---------------- 1. ÉTAPE 1/5 : NOM DU SALON ---------------- */}
          {stage === 1 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Comment s'appelle ton salon ?
                </h2>
                <p className="text-xs text-slate-500">
                  C'est le nom que tes clientes verront. Tu pourras le changer plus tard.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  autoFocus
                  value={formData.brandName}
                  onChange={(e) => handleBrandNameChange(e.target.value)}
                  placeholder="Ex : Awa Beauty Studio"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-slate-200 focus:border-pink-600 focus:outline-none text-base sm:text-lg font-bold text-slate-900 placeholder:text-slate-400 transition-all"
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  {['Awa Beauty Studio', 'Royal Braids Dakar', 'Barber Lounge', 'Glam & Nails'].map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleBrandNameChange(suggestion)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs text-slate-800 space-y-1">
                <span className="text-[11px] text-emerald-800 font-medium block">
                  Le nom de ton salon deviendra son adresse web dédiée :
                </span>
                <span className="font-mono font-black text-emerald-950 text-xs sm:text-sm break-all">
                  appointfy.com/{formData.slug || 'nom-de-ton-salon'}
                </span>
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

          {/* ---------------- 2. ÉTAPE 2/5 : SPÉCIALITÉ / MÉTIER ---------------- */}
          {stage === 2 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  C'est quoi ta spécialité, {ownerFirstName} ?
                </h2>
                <p className="text-xs text-slate-500">
                  On adapte ton catalogue de prestations et tes fiches à ce que tu proposes.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {[
                  { id: 'hair_braids', label: 'Coiffure & Tresses', icon: '✂️', desc: 'Braids, Nattes, Tissage' },
                  { id: 'nails', label: 'Onglerie & Manucure', icon: '💅', desc: 'Gel X, Résine, Pédicure' },
                  { id: 'lashes_makeup', label: 'Cils & Maquillage', icon: '👁️', desc: 'Lash, Microblading, Glam' },
                  { id: 'barber', label: 'Barbershop Homme', icon: '💈', desc: 'Coupes, Dégradés & Barbe' },
                  { id: 'spa_massage', label: 'Spa & Massages', icon: '💆‍♀️', desc: 'Massages & Soins détente' },
                  { id: 'mixte', label: 'Salon Mixte / Tout-en-un', icon: '🌟', desc: 'Coiffure, Ongles & Soins' }
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

          {/* ---------------- 3. ÉTAPE 3/5 : OÙ EN ES-TU AUJOURD'HUI ? ---------------- */}
          {stage === 3 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Où en es-tu aujourd'hui ?
                </h2>
                <p className="text-xs text-slate-500">
                  Sois honnête, il n'y a pas de mauvaise réponse. Ça change ce qu'on prépare pour toi.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  {
                    id: 'whatsapp',
                    label: 'Je gère déjà mes réservations sur WhatsApp ou DM Instagram',
                    icon: MessageCircle,
                    color: 'text-emerald-600'
                  },
                  {
                    id: 'carnet',
                    label: 'Je note sur un carnet papier ou un agenda manuel',
                    icon: BookOpen,
                    color: 'text-blue-600'
                  },
                  {
                    id: 'lapins',
                    label: 'J\'ai trop de lapins et de clientes qui ne se présentent pas',
                    icon: AlertTriangle,
                    color: 'text-rose-600'
                  },
                  {
                    id: 'domicile',
                    label: 'Je coiffe à domicile ou je reçois chez moi',
                    icon: Home,
                    color: 'text-purple-600'
                  },
                  {
                    id: 'start',
                    label: 'Je démarre tout juste, je n\'ai pas encore de salon officiel',
                    icon: Rocket,
                    color: 'text-pink-600'
                  }
                ].map((choice) => {
                  const IconComponent = choice.icon;
                  const isSelected = formData.situation === choice.id;

                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, situation: choice.id }))}
                      className={`w-full p-3.5 sm:p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-pink-600 bg-pink-50/50 ring-2 ring-pink-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 ${choice.color}`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 leading-snug">
                          {choice.label}
                        </span>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-pink-600 bg-pink-600 text-white' : 'border-slate-300'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Boîte de réassurance dynamique */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-medium">
                {formData.situation === 'whatsapp' && '💬 Top ! Tu vas pouvoir envoyer ton lien de réservation directement dans tes discussions WhatsApp et ne plus perdre de temps à négocier les créneaux.'}
                {formData.situation === 'carnet' && '📒 Fini les ratures et les doubles réservations ! Ton planning sera toujours à jour sur ton téléphone avec tes alertes en direct.'}
                {formData.situation === 'lapins' && '🛡️ C\'est le cauchemar des salons. Grâce à l\'acompte obligatoire, tes clientes sont obligées d\'honorer le créneau ou tu encaisses l\'acompte !'}
                {formData.situation === 'domicile' && '🏠 Parfait ! Tu pourras renseigner tes disponibilités et recevoir sur rendez-vous privé sans stress.'}
                {formData.situation === 'start' && '🚀 Tout le monde commence quelque part. On va y aller une action à la fois, sans rien te demander de compliqué.'}
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

          {/* ---------------- 4. ÉTAPE 4/5 : TU ES DANS QUEL PAYS ? ---------------- */}
          {stage === 4 && (
            <div className="space-y-6">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Tu es dans quel pays ?
                </h2>
                <p className="text-xs text-slate-500">
                  Pour brancher les moyens de paiement locaux de tes clientes.
                </p>
              </div>

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
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-2xl">{c.flag}</span>
                        <div>
                          <strong className="block text-xs sm:text-sm font-black text-slate-900">
                            {c.code}
                          </strong>
                          <span className="text-[11px] text-slate-500 block truncate">
                            {c.name}
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

              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Moyens de paiement branchés pour le {currentCountry.name} :
                </span>
                <div className="flex flex-wrap gap-2">
                  {(currentCountry.paymentMethods || []).map((method) => (
                    <span
                      key={method.id}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 shadow-2xs ${method.color}`}
                    >
                      {method.id === 'wave' && '🐧'}
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

          {/* ---------------- 5. ÉTAPE 5/5 : COMPTE & ALERTES DANS L'APPLICATION ---------------- */}
          {stage === 5 && (
            <form onSubmit={handleFinalize} className="space-y-5">
              <div className="space-y-1 text-center sm:text-left">
                <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                  Crée ton accès sécurisé
                </h2>
                <p className="text-xs text-slate-500">
                  Pour accéder à ton tableau de bord et recevoir tes alertes en direct.
                </p>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom & Nom de la Gérante *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.ownerName}
                      onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                      placeholder="Ex : Awa Diop"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Téléphone professionnel ({currentCountry.name}) *
                  </label>
                  <div className="flex gap-2">
                    <span className="px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 shrink-0 flex items-center">
                      {currentCountry.flag} {currentCountry.dialCode}
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
                      Dès qu'une cliente réserve, la sonnerie de caisse retentit et une notification apparaît en direct sur votre écran.
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
                  <span>{submitting ? 'Préparation de votre salon...' : 'Ouvrir mon salon en direct 🚀'}</span>
                </button>
              </div>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};
