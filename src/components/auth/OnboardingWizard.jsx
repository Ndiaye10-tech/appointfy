import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';
import { COUNTRIES, DEFAULT_COUNTRY, formatPhoneNumber } from '../../data/countries';
import { BUSINESS_TYPES, WORK_MODES, DEPOSIT_OPTIONS } from '../../data/businessTemplates';
import {
  MapPin,
  Sparkles,
  Phone,
  Store,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  MessageCircle,
  Mail,
  Lock,
  User,
  X
} from 'lucide-react';

export const OnboardingWizard = ({
  isOpen,
  onClose,
  initialData = {},
  onComplete,
  onSwitchToLogin
}) => {
  if (!isOpen) return null;

  const { currentUser, setCurrentUser, setCurrentView } = useBooking();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    country: initialData.country || DEFAULT_COUNTRY,
    city: initialData.city || '',
    address: initialData.address || '',
    businessType: initialData.businessType || 'beauty_studio',
    workMode: initialData.workMode || 'salon',
    brandName: initialData.brandName || '',
    ownerName: initialData.ownerName || '',
    email: initialData.email || '',
    password: initialData.password || '',
    slug: '',
    phone: initialData.phone || '',
    waveNumber: initialData.waveNumber || '',
    depositOption: 'rate_20',
    ...initialData
  });

  const currentCountry = COUNTRIES[formData.country] || COUNTRIES.SN;
  const currentBusiness = BUSINESS_TYPES[formData.businessType] || BUSINESS_TYPES.beauty_studio;

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
      slug: slugified || 'mon-etablissement'
    }));
  };

  const totalSteps = currentUser?.id ? 4 : 5;

  const handleNextStep = () => {
    if (step === 1) {
      if (!formData.ownerName.trim()) {
        alert('Veuillez saisir votre prénom et nom.');
        return;
      }
      if (!formData.brandName.trim()) {
        alert('Veuillez saisir le nom de votre marque.');
        return;
      }
    } else if (step === 2) {
      if (!formData.address.trim() && !formData.city.trim()) {
        alert('Veuillez préciser votre adresse ou quartier.');
        return;
      }
    } else if (step === 3) {
      if (!formData.phone.trim()) {
        alert('Veuillez renseigner votre numéro WhatsApp professionnel.');
        return;
      }
      if (!formData.waveNumber.trim()) {
        formData.waveNumber = formData.phone;
      }
    } else if (step === 4) {
      if (currentUser?.id) {
        handleFinalize();
        return;
      }
    } else if (step === 5) {
      if (!currentUser?.id) {
        if (!formData.email.trim()) {
          alert('Veuillez renseigner votre email.');
          return;
        }
        if (!formData.password || formData.password.length < 6) {
          alert('Le mot de passe doit contenir au moins 6 caractères.');
          return;
        }
      }
      handleFinalize();
      return;
    }

    setStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(prev => prev - 1);
    }
  };

  const handleFinalize = async () => {
    setSubmitting(true);
    try {
      let currentUserId = currentUser?.id || null;

      // Création du compte gérant dans Supabase Auth si non connecté
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

      const selectedDeposit = DEPOSIT_OPTIONS.find(d => d.id === formData.depositOption) || DEPOSIT_OPTIONS[0];

      const resolvedAddress = (formData.address || formData.city || '').trim();
      const resolvedCity = (formData.city || formData.address || '').trim();

      // Données propres : AUCUNE fausse donnée, page vierge
      const finalizedData = {
        owner_id: currentUserId,
        owner_name: formData.ownerName.trim(),
        name: formData.brandName.trim(),
        slug: formData.slug || 'salon-' + Math.floor(100 + Math.random() * 900),
        country: 'SN',
        city: resolvedCity ? `${resolvedCity}, Sénégal` : 'Dakar, Sénégal',
        address: resolvedAddress,
        business_type: formData.businessType,
        work_mode: formData.workMode,
        phone: `${currentCountry.dialCode} ${formData.phone.trim()}`,
        whatsapp: `${currentCountry.dialCode.replace('+', '')}${formData.phone.replace(/\D/g, '')}`,
        wave_number: `${currentCountry.dialCode} ${(formData.waveNumber || formData.phone).trim()}`,
        deposit_required: selectedDeposit.value > 0,
        deposit_type: selectedDeposit.type,
        deposit_rate: selectedDeposit.type === 'percent' ? selectedDeposit.value / 100 : 0.20,
        deposit_fixed: selectedDeposit.type === 'fixed' ? selectedDeposit.value : 0,
        template_services: [],
        tagline: '',
        hero_subtitle: ''
      };

      if (onComplete) {
        await onComplete(finalizedData);
      }

      // Redirection immédiate vers le Dashboard gérant (zéro phase intermédiaire)
      setCurrentView('salon');
    } catch (err) {
      console.error('Erreur finalisation onboarding:', err);
      alert(err.message || "Une erreur est survenue lors de l'enregistrement. Veuillez réessayer.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] border border-pink-100 overflow-hidden flex flex-col">
        
        {/* ================= TOP HEADER (COMPACT & SLEEK) ================= */}
        <div className="px-5 sm:px-6 pt-4 sm:pt-5 pb-3 border-b border-pink-50 flex items-center justify-between shrink-0">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full border border-pink-100">
              Étape {step} sur {totalSteps}
            </span>
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 mt-1">
              Configuration de votre vitrine pro 🇸🇳
            </h2>
          </div>

            <div className="flex items-center gap-2">
              {onSwitchToLogin && !currentUser?.id && (
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-xs font-bold text-gray-500 hover:text-pink-600 transition cursor-pointer"
                >
                  Se connecter
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition cursor-pointer"
              >
                <X size={15} />
              </button>
          </div>
        </div>

        {/* Progress Line */}
        <div className="w-full bg-gray-100 h-1 shrink-0">
          <div
            className="bg-pink-600 h-1 transition-all duration-300 ease-out"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>

        {/* ================= CONTENT: EXACTLY 2 QUESTIONS PER SCREEN ================= */}
        <div className="p-5 sm:p-6 space-y-5 sm:space-y-6 overflow-y-auto flex-1">

          {/* ================= ÉCRAN 1 (2 QUESTIONS : GÉRANT & MARQUE) ================= */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question 1 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <User size={14} /> 1. Comment vous appelez-vous ?
                </label>
                <input
                  type="text"
                  autoFocus
                  value={formData.ownerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="Ex: Fatou Diop, Mamadou Ndiaye..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-bold text-gray-900 text-sm"
                />
                <p className="text-[11px] text-gray-500">
                  Prénom & nom du gérant(e) affiché sur votre tableau de bord.
                </p>
              </div>

              {/* Question 2 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <Store size={14} /> 2. Quel est le nom de votre marque ou enseigne ?
                </label>
                <input
                  type="text"
                  value={formData.brandName}
                  onChange={(e) => handleBrandNameChange(e.target.value)}
                  placeholder="Ex: BEAUTY AFRICA, Prestige Barber, Diarra Nails..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-bold text-gray-900 text-base"
                />
                {/* Live Link Badge */}
                <div className="px-3 py-1.5 bg-pink-50/80 border border-pink-200 rounded-xl flex items-center justify-between text-xs font-mono">
                  <span className="text-pink-700 font-bold flex items-center gap-1">
                    <Sparkles size={13} /> appointfy.me/{formData.slug || 'votre-nom'}
                  </span>
                  <span className="text-[10px] text-pink-500 font-sans">Lien direct</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉCRAN 2 (2 QUESTIONS : LOCALISATION & MÉTIER) ================= */}
          {step === 2 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question 3 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <MapPin size={14} /> 3. Où se situe votre salon au Sénégal ? (Adresse ou quartier)
                </label>
                <input
                  type="text"
                  value={formData.address || formData.city}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({ ...prev, address: val, city: val }));
                  }}
                  placeholder="Ex: Grand Mbao, Route des Almadies, Mermoz..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-medium text-gray-900 text-sm"
                />
                <p className="text-[11px] text-gray-500">
                  Cette adresse sera affichée sur votre site client et reste modifiable à tout moment.
                </p>
                {/* Fast Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {['Grand Mbao', 'Almadies', 'Mermoz', 'Plateau', 'Thiès'].map((pop) => (
                    <button
                      key={pop}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, address: pop, city: pop }))}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer ${
                        (formData.address === pop || formData.city === pop)
                          ? 'bg-pink-600 border-pink-600 text-white font-bold'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pop}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question 4 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <Sparkles size={14} /> 4. Quel est votre univers ?
                </label>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {['beauty_studio', 'barber'].map((key) => {
                      const bt = BUSINESS_TYPES[key];
                      const isSelected = formData.businessType === bt.id;
                      return (
                        <button
                          key={bt.id}
                          type="button"
                          onClick={() => setFormData(prev => ({ ...prev, businessType: bt.id }))}
                          className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition cursor-pointer ${
                            isSelected
                              ? 'border-pink-600 bg-pink-50 text-pink-900 font-bold shadow-xs ring-1 ring-pink-500'
                              : 'border-gray-200 hover:border-pink-300 text-gray-700 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <span className="text-xl">{bt.emoji}</span>
                            <span className="text-xs font-black truncate">{bt.name}</span>
                          </div>
                          <span className="text-[11px] text-gray-500 line-clamp-1 font-normal">
                            {bt.subtitle}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Option Mixte discrète */}
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, businessType: 'mixte' }))}
                    className={`w-full py-1.5 px-3 rounded-xl border text-center text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                      formData.businessType === 'mixte'
                        ? 'border-pink-600 bg-pink-50 text-pink-900 ring-1 ring-pink-500'
                        : 'border-gray-200 text-gray-600 bg-gray-50/50 hover:bg-gray-100'
                    }`}
                  >
                    <span>✂️ Salon Mixte (Hommes & Femmes)</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉCRAN 3 (2 QUESTIONS : MODE D'EXERCICE & WHATSAPP) ================= */}
          {step === 3 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question 5 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 block">
                  5. Comment recevez-vous vos clients ?
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {WORK_MODES.map((wm) => {
                    const isSelected = formData.workMode === wm.id;
                    return (
                      <button
                        key={wm.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, workMode: wm.id }))}
                        className={`py-2 px-1.5 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'border-pink-600 bg-pink-50 text-pink-900 shadow-xs ring-1 ring-pink-500'
                            : 'border-gray-200 hover:border-pink-300 text-gray-600 bg-white'
                        }`}
                      >
                        {wm.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question 6 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <MessageCircle size={14} className="text-emerald-500" /> 6. Votre numéro WhatsApp professionnel
                </label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-100">
                  <div className="bg-gray-50 px-3 flex items-center border-r border-gray-200 text-gray-700 font-bold text-xs select-none">
                    🇸🇳 +221
                  </div>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: formatPhoneNumber(e.target.value, 'SN') }))}
                    placeholder="77 123 45 67"
                    className="w-full px-3.5 py-2.5 font-bold text-gray-900 text-sm focus:outline-none font-mono"
                  />
                </div>
                <p className="text-[11px] text-gray-500">
                  Sert aux confirmations et rappels automatiques envoyés à vos clientes.
                </p>
              </div>
            </div>
          )}

          {/* ================= ÉCRAN 4 (2 QUESTIONS : NUMÉRO WAVE & ACOMPTE) ================= */}
          {step === 4 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question 7 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded-full bg-[#1DC4F9] text-white font-bold flex items-center justify-center text-[10px]">~</span>
                    7. Votre numéro Wave pour recevoir vos acomptes
                  </span>
                  <span className="text-[10px] text-[#1DC4F9] font-bold">Wave Sénégal</span>
                </label>
                <div className="flex rounded-xl border border-gray-200 overflow-hidden focus-within:border-[#1DC4F9] focus-within:ring-2 focus-within:ring-[#1DC4F9]/20">
                  <div className="bg-gray-50 px-3 flex items-center border-r border-gray-200 text-gray-700 font-bold text-xs select-none">
                    🇸🇳 +221
                  </div>
                  <input
                    type="tel"
                    value={formData.waveNumber || formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, waveNumber: formatPhoneNumber(e.target.value, 'SN') }))}
                    placeholder={formData.phone || '77 123 45 67'}
                    className="w-full px-3.5 py-2.5 font-bold text-gray-900 text-sm focus:outline-none font-mono"
                  />
                </div>
              </div>

              {/* Question 8 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> 8. Règle d'acompte anti-lapin
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {DEPOSIT_OPTIONS.map((opt) => {
                    const isSelected = formData.depositOption === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, depositOption: opt.id }))}
                        className={`p-2 rounded-xl border text-center text-xs font-bold transition cursor-pointer ${
                          isSelected
                            ? 'border-pink-600 bg-pink-50 text-pink-900 ring-1 ring-pink-500'
                            : 'border-gray-200 text-gray-600 bg-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ================= ÉCRAN 5 (2 QUESTIONS : ACCÈS COMPTE SÉCURISÉ) ================= */}
          {step === 5 && !currentUser?.id && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Question 9 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <Mail size={14} /> 9. Votre adresse email professionnelle
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="contact@mon-salon.com"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-medium text-gray-900 text-sm"
                />
              </div>

              {/* Question 10 */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-pink-600 flex items-center gap-1.5">
                  <Lock size={14} /> 10. Votre mot de passe secret
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Au moins 6 caractères"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-medium text-gray-900 text-sm"
                />
                <p className="text-[11px] text-gray-500">
                  Permet d'accéder à votre planning et gérer vos réservations.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ================= BOTTOM ACTION BAR ================= */}
        <div className="px-6 py-3.5 bg-gray-50/80 border-t border-gray-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrevStep}
              className="text-xs font-bold text-gray-600 hover:text-gray-900 flex items-center gap-1 cursor-pointer"
            >
              <ArrowLeft size={14} /> Précédent
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            disabled={submitting}
            onClick={handleNextStep}
            className="px-5 py-2.5 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs shadow-md shadow-pink-500/20 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <span>Ouverture de votre Dashboard...</span>
            ) : (step === totalSteps) ? (
              <>Accéder à mon Dashboard <ArrowRight size={14} /></>
            ) : (
              <>Continuer <ArrowRight size={14} /></>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
