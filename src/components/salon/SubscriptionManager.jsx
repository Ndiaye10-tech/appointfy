import React, { useState, useEffect, useRef } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import {
  createGeniusPayment,
  checkGeniusPaymentStatus,
  isGeniusPayConfigured,
  PLATFORM_ADMIN_WAVE_PHONE,
  PLATFORM_ADMIN_WAVE_PHONE_INTL,
  COUNTRY_PHONE_CONFIG
} from '../../lib/geniuspay';
import { CountryFlag } from '../common/CountryFlag';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  CreditCard,
  Smartphone,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  Zap,
  Check,
  ArrowRight,
  RefreshCw,
  Gift,
  MessageCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

// Catalogue des opérateurs supportés par pays pour le règlement de l'abonnement
const OPERATORS_BY_COUNTRY = {
  SN: [
    { id: 'Wave', name: 'Wave Sénégal', desc: 'Débit direct instantané 100% sans frais', color: '#1DC3FF', textColor: '#000', badge: 'Recommandé' }
  ],
  CI: [
    { id: 'Paystack', name: 'Paystack Côte d\'Ivoire', desc: 'Wave, Orange Money, MTN, Moov & Carte CB', color: '#00C3F7', textColor: '#000', badge: 'Multi-Paiement' }
  ]
};

export const SubscriptionManager = () => {
  const { salon, updateSalon } = useBooking();
  const [payments, setPayments] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const salonCountry = (salon?.country || 'SN').toUpperCase();
  const availableMethods = OPERATORS_BY_COUNTRY[salonCountry] || OPERATORS_BY_COUNTRY.SN;
  const phoneConfig = COUNTRY_PHONE_CONFIG[salonCountry] || COUNTRY_PHONE_CONFIG.SN;

  // Payment Flow State
  const [isPaying, setIsPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('Wave');
  const [phone, setPhone] = useState(salon?.phone || '');
  const [payStep, setPayStep] = useState('idle'); // 'idle' | 'processing' | 'awaiting' | 'success' | 'error'
  const [errorMessage, setErrorMessage] = useState(null);
  const [transactionData, setTransactionData] = useState(null);
  const pollingRef = useRef(null);

  // Synchroniser méthode selon le pays
  useEffect(() => {
    if (availableMethods.length > 0 && !availableMethods.some(m => m.id === paymentMethod)) {
      setPaymentMethod(availableMethods[0].id);
    }
  }, [salonCountry]);


  // Subscription calculation - Tarif officiel immuable : 9 900 FCFA / mois
  const subscriptionPrice = 9900;
  const status = salon?.subscriptionStatus || 'trial'; // 'trial' | 'active' | 'expired'
  
  // Expiration date (Garantie stricte : 14 jours d'essai)
  const expiresAtDate = (() => {
    if (status === 'trial' && salon?.trialEndsAt) {
      return new Date(salon.trialEndsAt);
    }
    if (salon?.subscriptionExpiresAt) {
      return new Date(salon.subscriptionExpiresAt);
    }
    return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  })();

  const now = new Date();
  const diffTime = expiresAtDate.getTime() - now.getTime();
  const daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  const isExpired = diffTime <= 0;

  // Détection du compte Super Admin / Fondateur (Mahmoud Ndiaye)
  const isPlatformAdmin = Boolean(
    salon?.phone?.includes('784722951') ||
    salon?.phone?.includes('78 472 29 51') ||
    salon?.wave_number?.includes('784722951') ||
    salon?.wave_number?.includes('78 472 29 51') ||
    salon?.owner_email === 'mahmoudndiaye100@gmail.com' ||
    salon?.slug?.includes('mamadou-ndiaye') ||
    daysLeft > 3650
  );

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Fetch subscription payments history from Supabase
  useEffect(() => {
    const fetchHistory = async () => {
      if (!isSupabaseConfigured) return;
      setLoadingHistory(true);
      try {
        let query = supabase
          .from('subscription_payments')
          .select('*')
          .order('created_at', { ascending: false });

        // Si ce n'est pas l'admin, filtrer uniquement les paiements de son propre salon
        if (!isPlatformAdmin && salon?.id) {
          query = query.eq('salon_id', salon.id);
        }

        const { data, error } = await query;
        if (!error && data) {
          setPayments(data);
        }
      } catch (err) {
        console.warn('Erreur chargement historique abonnements:', err);
      } finally {
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [salon?.id, isPlatformAdmin]);


  // Handle successful subscription payment
  const handlePaymentSuccess = async (reference, methodUsed) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPayStep('success');

    try {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 }
      });
    } catch (e) {}

    // Calculate new expiration (current + 30 days or now + 30 days if already expired)
    const baseDate = isExpired ? new Date() : expiresAtDate;
    const newExpiresAt = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const paymentRecord = {
      id: 'SUB-' + Math.floor(100000 + Math.random() * 900000),
      salon_id: salon.id,
      salon_name: salon.name,
      amount: subscriptionPrice,
      currency: 'XOF',
      payment_method: methodUsed || paymentMethod,
      transaction_ref: reference || ('GP-SUB-' + Date.now()),
      period_start: baseDate.toISOString(),
      period_end: newExpiresAt,
      status: 'completed',
      created_at: new Date().toISOString()
    };

    // Save in Supabase
    if (isSupabaseConfigured) {
      try {
        await supabase.from('subscription_payments').insert([paymentRecord]);
        await supabase.from('salons').update({
          subscription_status: 'active',
          subscription_expires_at: newExpiresAt,
          is_subscription_active: true,
          last_subscription_payment_at: new Date().toISOString(),
          last_subscription_ref: reference
        }).eq('id', salon.id);
      } catch (err) {
        console.warn('Erreur sauvegarde paiement Supabase:', err);
      }
    }

    // Update local salon state
    updateSalon({
      subscriptionStatus: 'active',
      subscriptionExpiresAt: newExpiresAt,
      isSubscriptionActive: true
    });

    setPayments(prev => [paymentRecord, ...prev]);

    setTimeout(() => {
      setIsPaying(false);
      setPayStep('idle');
      setTransactionData(null);
    }, 2500);
  };

  // Status Polling
  const startPolling = (reference, methodUsed) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) { // 5 minutes max
        clearInterval(pollingRef.current);
        return;
      }
      try {
        const res = await checkGeniusPaymentStatus(reference);
        if (res?.success && res.status === 'completed') {
          handlePaymentSuccess(reference, methodUsed);
        }
      } catch (e) {
        console.warn('Erreur polling:', e);
      }
    }, 5000);
  };

  // Trigger Genius Pay Payment
  const initiateSubscriptionPayment = async () => {
    setPayStep('processing');
    setErrorMessage(null);

    // Fallback if not configured
    if (!isGeniusPayConfigured()) {
      setTimeout(() => {
        handlePaymentSuccess('DEMO-' + Date.now(), paymentMethod);
      }, 2000);
      return;
    }

    try {
      const res = await createGeniusPayment({
        amount: subscriptionPrice,
        customerName: salon.name || 'Gérante Salon',
        customerPhone: phone || salon.phone || '770000000',
        paymentMethod: paymentMethod,
        country: salonCountry,
        description: `Abonnement 30 jours Appointfy - ${salon.name} (Bénéficiaire Admin: ${PLATFORM_ADMIN_WAVE_PHONE})`,
        metadata: {
          salon_id: salon.id,
          salon_name: salon.name,
          type: 'saas_subscription_monthly',
          recipient_type: 'platform_admin',
          recipient_phone: PLATFORM_ADMIN_WAVE_PHONE,
          recipient_wave: PLATFORM_ADMIN_WAVE_PHONE,
          beneficiary_phone: PLATFORM_ADMIN_WAVE_PHONE_INTL,
          beneficiary_name: 'Mahmoud Ndiaye (Admin Appointfy)',
          admin_phone: PLATFORM_ADMIN_WAVE_PHONE,
          payment_method: paymentMethod,
          period_days: 30
        }
      });


      if (res?.success && res.data) {
        setTransactionData(res.data);
        setPayStep('awaiting');

        const checkoutUrl = res.data.checkout_url || res.data.payment_url;
        if (checkoutUrl) {
          window.open(checkoutUrl, '_blank');
        }

        const ref = res.data.reference || res.data.id;
        if (ref) {
          startPolling(ref, paymentMethod);
        }
      } else {
        throw new Error(res?.message || 'Erreur lors de la création du paiement.');
      }
    } catch (err) {
      console.error('Erreur paiement abonnement:', err);
      setErrorMessage(err.message || 'Impossible de lancer le paiement Genius Pay.');
      setPayStep('error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-linear-to-r from-pink-600 via-rose-600 to-amber-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider">
              {isPlatformAdmin ? (
                <>
                  <span>👑</span>
                  <span>Compte Fondateur & Administrateur Plateforme</span>
                </>
              ) : (
                <>
                  <Gift className="w-3.5 h-3.5" />
                  <span>{status === 'trial' ? 'Offre Essai 14 Jours Gratuit' : 'Abonnement Professionnel'}</span>
                </>
              )}
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              {isPlatformAdmin ? 'Espace Administrateur Appointfy' : 'Abonnement Salon Appointfy'}
            </h2>
            <p className="text-white/90 text-sm leading-relaxed">
              {isPlatformAdmin
                ? 'Compte officiel du fondateur (Mahmoud Ndiaye). Vous bénéficiez d\'un accès illimité à vie sans aucun abonnement à payer. Tous les abonnements des salons partenaires (9 900 F/mois) sont versés directement sur votre compte Wave (78 472 29 51).'
                : 'Profitez d\'un outil complet pour encaisser vos acomptes clients, automatiser votre planning et éliminer les rendez-vous non honorés.'}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-5 rounded-2xl border border-white/20 text-center shrink-0 min-w-[220px]">
            <span className="text-xs font-bold text-white/80 uppercase tracking-wider block">
              {isPlatformAdmin ? 'Statut du Compte' : 'Tarif mensuel'}
            </span>
            <div className="text-2xl sm:text-3xl font-black mt-1">
              {isPlatformAdmin ? 'Accès à Vie' : formatFCFA(subscriptionPrice)}
            </div>
            <span className="text-xs text-white/80">
              {isPlatformAdmin ? 'Fondateur Appointfy (0 FCFA)' : '/ mois sans engagement'}
            </span>
            
            {!isPlatformAdmin && (
              <button
                onClick={() => setIsPaying(true)}
                className="mt-4 w-full py-3 px-4 bg-white text-pink-600 hover:bg-pink-50 font-black text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Zap className="w-4 h-4 fill-pink-600" />
                <span>{isExpired ? 'Réactiver mon abonnement' : 'Prolonger mon abonnement'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Status Card & Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status Box */}
        <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Statut de votre compte</span>
            {isPlatformAdmin ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                👑 Super Admin
              </span>
            ) : status === 'trial' ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Essai Gratuit
              </span>
            ) : isExpired ? (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Expiré
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Actif
              </span>
            )}
          </div>

          <div className="pt-2">
            {isPlatformAdmin ? (
              <div className="space-y-1">
                <div className="text-3xl font-black text-slate-900">
                  Accès Permanent
                </div>
                <p className="text-xs text-emerald-700 font-bold">
                  Compte Fondateur Illimité • Zéro facturation
                </p>
                <p className="text-[11px] text-slate-500 pt-1">
                  Bénéficiaire des encaissements SaaS : Wave <strong>78 472 29 51</strong>
                </p>
              </div>
            ) : (
              <div>
                <div className="text-4xl font-black text-slate-900 flex items-baseline gap-1">
                  {daysLeft}
                  <span className="text-base font-bold text-slate-500">jours restants</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isExpired ? (
                    <span className="text-rose-600 font-bold">Votre période est expirée. Renouvelez pour continuer à recevoir des réservations.</span>
                  ) : (
                    <>Valable jusqu'au <strong className="text-slate-700">{expiresAtDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></>
                  )}
                </p>
              </div>
            )}
          </div>

          {!isPlatformAdmin && (
            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => setIsPaying(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-extrabold transition-all shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Payer mon abonnement (9 900 F)</span>
              </button>
            </div>
          )}
        </div>


        {/* What's included */}
        <div className="md:col-span-2 bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-pink-600" />
            Ce qui est inclus dans votre abonnement à 9 900 FCFA / mois :
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <strong>Acomptes 100% sur-mesure</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vous fixez librement l'acompte de chaque prestation (0 F, 100 F, 3 000 F, ou 100% du prix).
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <strong>Paiement Mobile Wave Sénégal</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Règlement instantané et sécurisé directement depuis votre application Wave.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <strong>Système Anti-Lapin & No-Show</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  L'acompte est acquis pour vous si la cliente ne se présente pas à son rendez-vous.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-2.5 text-xs text-slate-700">
              <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                <Check className="w-3 h-3 stroke-[3]" />
              </div>
              <div>
                <strong>Site vitrine dédié avec galerie</strong>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lien de réservation personnalisable à mettre dans votre bio Instagram et WhatsApp.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      {isPaying && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-pink-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Règlement de l'abonnement
                </h3>
                <p className="text-xs text-slate-500">
                  Renouvellement pour 30 jours d'accès complet
                </p>
              </div>
              <button
                onClick={() => {
                  if (payStep !== 'processing') setIsPaying(false);
                }}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Price recap */}
            <div className="p-4 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-pink-700 uppercase">Montant de l'abonnement</span>
                <div className="text-2xl font-black text-pink-900">
                  {formatFCFA(subscriptionPrice)}
                </div>
              </div>
              <div className="px-3 py-1 rounded-full bg-pink-200 text-pink-800 text-xs font-bold">
                30 jours
              </div>
            </div>

            {payStep === 'idle' && (
              <div className="space-y-4">
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                    <span>Moyen de paiement sécurisé :</span>
                    <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1">
                      <CountryFlag countryCode={phoneConfig.flag} className="w-3.5 h-2.5 rounded-xs object-cover" />
                      <span>{phoneConfig.name}</span>
                    </span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {availableMethods.map((method) => {
                      const isSelected = paymentMethod === method.id;
                      return (
                        <button
                          key={method.id}
                          type="button"
                          onClick={() => setPaymentMethod(method.id)}
                          className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                            isSelected
                              ? 'border-pink-600 bg-pink-50/70 ring-2 ring-pink-500/20 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 shadow-xs"
                              style={{
                                backgroundColor: method.color,
                                color: method.textColor || '#FFF'
                              }}
                            >
                              {method.id === 'Wave' ? (
                                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
                                </svg>
                              ) : (
                                <CreditCard className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-black text-slate-900 block truncate">
                                {method.name}
                              </span>
                              <span className="text-[10px] text-slate-500 block truncate">
                                {method.desc}
                              </span>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            isSelected ? 'bg-pink-600 text-white' : 'border border-slate-300'
                          }`}>
                            {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Phone input */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    {paymentMethod === 'Wave' ? 'Numéro Wave pour le prélèvement :' : 'Numéro mobile du salon :'}
                  </label>
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs font-bold text-slate-600 pr-2 border-r border-slate-200">
                      <CountryFlag code={phoneConfig.flag} className="w-4 h-3 rounded-xs object-cover" />
                      <span>{phoneConfig.code}</span>
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={phoneConfig.placeholder || '77 123 45 67'}
                      className="w-full pl-24 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-pink-600"
                      required
                    />
                  </div>
                  {paymentMethod !== 'Wave' && (
                    <p className="text-[11px] text-slate-500 mt-1">
                      Le guichet Paystack CI vous permettra de régler par Wave, Orange Money, MTN, Moov ou Carte bancaire.
                    </p>
                  )}
                </div>

                {/* Admin Platform Beneficiary Transparency Box */}
                <div className="p-3 rounded-2xl bg-amber-50/90 border border-amber-200/80 text-xs text-amber-950 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0">👑</span>
                    <div className="min-w-0">
                      <span className="font-extrabold block text-amber-950 truncate">
                        Bénéficiaire officiel de l'abonnement SaaS :
                      </span>
                      <span className="text-[11px] text-amber-800 font-medium truncate block">
                        Mahmoud Ndiaye (Fondateur Appointfy)
                      </span>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-900 bg-white px-2.5 py-1 rounded-lg border border-amber-300 text-xs shrink-0 ml-2">
                    78 472 29 51
                  </span>
                </div>

                <button
                  onClick={initiateSubscriptionPayment}
                  className="w-full py-3.5 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-extrabold text-xs shadow-md shadow-pink-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Confirmer et Payer 9 900 FCFA avec {paymentMethod === 'Wave' ? 'Wave' : 'Paystack CI'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}


            {payStep === 'processing' && (
              <div className="py-8 text-center space-y-3">
                <Loader2 className="w-10 h-10 text-pink-600 animate-spin mx-auto" />
                <h4 className="text-sm font-bold text-slate-800">Génération de votre session sécurisée...</h4>
                <p className="text-xs text-slate-500">Connexion à Genius Pay en cours.</p>
              </div>
            )}

            {payStep === 'awaiting' && (
              <div className="py-6 text-center space-y-4">
                <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto">
                  <Smartphone className="w-7 h-7 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">
                    {paymentMethod === 'Wave' ? 'Validation requise sur votre mobile' : 'Validation sur le guichet Paystack'}
                  </h4>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    {paymentMethod === 'Wave'
                      ? <>Une page Wave s'est ouverte. Validez le paiement de <strong>9 900 FCFA</strong> sur votre application Wave.</>
                      : <>Le guichet Paystack s'est ouvert. Réglez les <strong>9 900 FCFA</strong> (Wave CI, Orange Money, MTN MoMo, Moov Money ou Carte bancaire).</>
                    }
                  </p>
                </div>

                {transactionData?.checkout_url && (
                  <a
                    href={transactionData.checkout_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-pink-50 text-pink-700 border border-pink-200 text-xs font-bold hover:bg-pink-100"
                  >
                    <span>Ouvrir la page de paiement</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}

                <div className="pt-2 flex items-center justify-center gap-2 text-xs text-slate-400 font-medium">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>En attente de confirmation du réseau...</span>
                </div>
              </div>
            )}

            {payStep === 'success' && (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-black text-slate-900">Paiement validé avec succès !</h4>
                <p className="text-xs text-slate-600">
                  Votre abonnement a été prolongé de 30 jours. Merci pour votre fidélité !
                </p>
              </div>
            )}

            {payStep === 'error' && (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-black text-slate-900">Erreur de paiement</h4>
                <p className="text-xs text-rose-600">{errorMessage || 'La transaction n\'a pas pu aboutir.'}</p>
                <button
                  onClick={() => setPayStep('idle')}
                  className="mt-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* History of subscription payments */}
      <div className="bg-white p-6 rounded-3xl border border-pink-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-pink-600" />
            {isPlatformAdmin
              ? '👑 Abonnements perçus sur la plateforme (Tous les salons)'
              : 'Historique de vos paiements d\'abonnement'}
          </h3>
          {isPlatformAdmin && payments.length > 0 && (
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
              Total encaissé : {formatFCFA(payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0))}
            </span>
          )}
        </div>

        {loadingHistory ? (
          <div className="py-6 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Chargement de l'historique...</span>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Clock className="w-6 h-6 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold">
              {isPlatformAdmin
                ? 'Aucun abonnement encaissé pour l\'instant.'
                : 'Aucun paiement d\'abonnement pour le moment.'}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isPlatformAdmin
                ? 'Dès qu\'un salon règle son abonnement mensuel de 9 900 FCFA, il apparaîtra ici.'
                : 'Votre période d\'essai de 14 jours est actuellement en cours.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-extrabold text-slate-800 flex items-center gap-2">
                    <span>{isPlatformAdmin ? (p.salon_name || 'Salon partenaire') : 'Abonnement 30 jours'}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                      {p.status === 'completed' ? 'Payé' : p.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-2">
                    <span>{new Date(p.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>•</span>
                    <span>Via {p.payment_method}</span>
                    <span>•</span>
                    <span className="font-mono">{p.transaction_ref || p.id}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-black text-emerald-700 block">+{formatFCFA(p.amount)}</span>
                  <span className="text-[10px] text-slate-400">Reçu conforme</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>


      {/* Support Salons Inscrits - Abonnement */}
      <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-emerald-950">
              Assistance dédiée aux salons inscrits
            </h4>
            <p className="text-[11px] text-emerald-800">
              Une question sur votre facturation ou votre paiement Wave ? Écrivez au <strong className="font-mono">+221 78 472 29 51</strong>
            </p>
          </div>
        </div>
        <a
          href="https://wa.me/221784722951?text=Bonjour%20Appointfy,%20je%20suis%20un%20salon%20inscrit%20et%20j'ai%20une%20question%20sur%20mon%20abonnement"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shrink-0 cursor-pointer shadow-2xs"
        >
          <MessageCircle className="w-3.5 h-3.5" />
          <span>Contacter sur WhatsApp</span>
        </a>
      </div>

    </div>
  );
};
