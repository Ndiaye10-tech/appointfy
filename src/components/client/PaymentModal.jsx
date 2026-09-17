import React, { useState, useEffect, useRef } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { getTheme } from '../../lib/theme';
import {
  createGeniusPayment,
  checkGeniusPaymentStatus,
  isGeniusPayConfigured
} from '../../lib/geniuspay';
import {
  X,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Loader2,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  CreditCard,
  Lock,
  Calendar,
  Clock,
  Sparkles,
  Phone,
  User,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PaymentModal = () => {
  const {
    salon,
    isPaymentModalOpen,
    setIsPaymentModalOpen,
    selectedService,
    selectedPractitioner,
    clientInfo,
    updateClientInfo,
    selectedSlot,
    selectedDate,
    completePayment,
    createPendingBooking,
    cancelPendingBooking,
    confirmPendingBooking
  } = useBooking();

  const theme = getTheme(salon?.theme);
  const [paymentMethod, setPaymentMethod] = useState('Wave'); // 'Wave' | 'Orange Money'
  const [customerPhone, setCustomerPhone] = useState(clientInfo.phone || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  
  // States: 'select' | 'processing' | 'awaiting' | 'approved'
  const [stepState, setStepState] = useState('select');
  const [transactionData, setTransactionData] = useState(null);
  const [pendingId, setPendingId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes en secondes
  const pollingRef = useRef(null);
  const timerRef = useRef(null);

  // Sync phone when clientInfo updates or modal opens
  useEffect(() => {
    if (clientInfo.phone) {
      setCustomerPhone(clientInfo.phone);
    }
  }, [clientInfo.phone, isPaymentModalOpen]);

  // Gérer le compte à rebours de 15 minutes pendant l'attente du paiement
  useEffect(() => {
    if (stepState === 'awaiting') {
      setTimeLeft(15 * 60);
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleTimeExpired();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stepState]);

  // Stop polling and timer on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  if (!isPaymentModalOpen) return null;

  const depositAmount = (selectedService?.deposit !== undefined && selectedService?.deposit !== null)
    ? Number(selectedService.deposit)
    : 0;

  const totalPrice = Number(selectedService?.price) || 0;
  const remainingOnSite = Math.max(0, totalPrice - depositAmount);

  // Finalize successful booking
  const triggerSuccess = (customRef) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setStepState('approved');

    try {
      confetti({
        particleCount: 140,
        spread: 90,
        colors: ['#1DC3FF', '#FF7900', '#10B981', '#EC4899', '#8B5CF6'],
        origin: { y: 0.55 }
      });
    } catch (e) {}

    setTimeout(async () => {
      if (pendingId) {
        await confirmPendingBooking(pendingId, paymentMethod, customRef);
      } else {
        await completePayment(paymentMethod, customRef);
      }
      setStepState('select');
      setPendingId(null);
      setTransactionData(null);
      setErrorMsg(null);
    }, 2000);
  };

  const handleTimeExpired = async () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (pendingId) {
      await cancelPendingBooking(pendingId);
      setPendingId(null);
    }
    setErrorMsg("Le délai de 15 minutes est expiré. Le créneau a été libéré. Veuillez relancer votre réservation.");
    setStepState('select');
    setLoading(false);
  };

  // Start polling payment status on Genius Pay
  const startStatusPolling = (reference) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;

    pollingRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 60) {
        clearInterval(pollingRef.current);
        return;
      }
      try {
        const check = await checkGeniusPaymentStatus(reference);
        if (check?.success && check.status === 'completed') {
          triggerSuccess(reference);
        }
      } catch (err) {
        console.warn('Erreur vérification statut Genius Pay:', err);
      }
    }, 4000);
  };

  // Handle payment click (Calls Genius Pay API)
  const handleInitiatePayment = async () => {
    setLoading(true);
    setErrorMsg(null);
    setStepState('processing');

    // Make sure phone is saved in clientInfo
    if (customerPhone && customerPhone !== clientInfo.phone) {
      updateClientInfo('phone', customerPhone);
    }

    // 1. Verrouiller le créneau en base avec status 'pending' et expires_at
    let activePendingId = pendingId;
    if (!activePendingId) {
      try {
        const res = await createPendingBooking(paymentMethod);
        activePendingId = res.id;
        setPendingId(res.id);
      } catch (err) {
        console.error('Erreur réservation créneau:', err);
        setErrorMsg(err.message || "Ce créneau horaire n'est plus disponible. Veuillez choisir un autre créneau.");
        setStepState('select');
        setLoading(false);
        return;
      }
    }

    // Sécurité P1.1 : Interdiction formelle de valider une réservation sans paiement Wave
    if (!isGeniusPayConfigured()) {
      setErrorMsg("Le système de paiement Wave est momentanément indisponible ou en cours de maintenance. Veuillez contacter directement le salon pour bloquer votre créneau.");
      setStepState('select');
      setLoading(false);
      return;
    }

    try {
      const salonWavePhone = salon?.paymentRecipientPhone || salon?.phone || salon?.whatsapp || '';
      const res = await createGeniusPayment({
        amount: depositAmount,
        customerName: clientInfo.name || 'Cliente',
        customerPhone: customerPhone || clientInfo.phone,
        paymentMethod: 'wave',
        description: `Acompte ${selectedService?.name || 'Prestation'} (${formatFCFA(depositAmount)}) - ${salon?.name || 'Salon'} (Wave Salon: ${salonWavePhone})`,
        metadata: {
          recipient_type: 'salon',
          recipient_phone: salonWavePhone,
          salon_id: salon?.id,
          salon_name: salon?.name,
          salon_phone: salon?.phone,
          salon_wave: salonWavePhone,
          practitioner_name: selectedPractitioner?.name || 'Non spécifiée',
          service_name: selectedService?.name,
          slot: selectedSlot,
          date: selectedDate,
          customer_phone: customerPhone || clientInfo.phone,
          appointment_id: activePendingId
        }
      });

      if (res?.success && res.data) {
        setTransactionData(res.data);
        setStepState('awaiting');
        setLoading(false);

        // Open checkout URL in new tab / popup
        const urlToOpen = res.data.checkout_url || res.data.payment_url;
        if (urlToOpen) {
          window.open(urlToOpen, '_blank');
        }

        // Start status polling
        const ref = res.data.reference || res.data.id;
        if (ref) {
          startStatusPolling(ref);
        }
      } else {
        throw new Error(res?.message || "Impossible d'initialiser le paiement avec Genius Pay.");
      }
    } catch (err) {
      console.error(err);
      if (activePendingId) {
        await cancelPendingBooking(activePendingId);
        setPendingId(null);
      }
      setErrorMsg(err.message || 'Erreur lors de la connexion avec Genius Pay. Veuillez réessayer.');
      setStepState('select');
      setLoading(false);
    }
  };

  // Manual check button
  const handleManualCheck = async () => {
    const ref = transactionData?.reference || transactionData?.id;
    if (!ref) {
      setErrorMsg("Aucune référence de transaction active.");
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const check = await checkGeniusPaymentStatus(ref);
      if (check?.success && check.status === 'completed') {
        triggerSuccess(ref);
      } else {
        setErrorMsg(`⚠️ Paiement non encore validé par le réseau ${paymentMethod}. Veuillez valider la transaction sur votre téléphone puis réessayez.`);
      }
    } catch (err) {
      setErrorMsg("Erreur lors de la vérification. Veuillez patienter quelques secondes et recliquer.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (loading) return;
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    if (pendingId && (stepState === 'awaiting' || stepState === 'processing')) {
      await cancelPendingBooking(pendingId);
      setPendingId(null);
    }
    setIsPaymentModalOpen(false);
    setStepState('select');
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-pink-100 relative animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col">
        
        {/* ================= HEADER ================= */}
        <div className="px-5 py-4 bg-linear-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-emerald-400 border border-white/10">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white tracking-wide">
                  Paiement de l'Acompte
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Sécurisé 256-bit
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Garantit et bloque instantanément votre créneau
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            disabled={loading}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= BODY ================= */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 overscroll-contain">

          {/* Service & Slot Recap Box */}
          <div className="p-4 rounded-2xl bg-linear-to-b from-pink-50/70 to-rose-50/40 border border-pink-100/80 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">
                  {salon?.name || 'Salon de Beauté'}
                </span>
                <h4 className="text-base font-black text-slate-900 mt-0.5">
                  {selectedService?.name || 'Prestation'}
                </h4>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1 font-medium">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-pink-500" />
                    {selectedDate}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-bold text-slate-800">
                    <Clock className="w-3.5 h-3.5 text-pink-500" />
                    {selectedSlot}
                  </span>
                </div>
              </div>

              {/* Deposit Badge */}
              <div className="text-right shrink-0 bg-white px-3.5 py-2 rounded-xl border border-pink-200 shadow-xs">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 block">
                  Acompte requis
                </span>
                <span className="text-xl font-black text-pink-600 block leading-tight">
                  {formatFCFA(depositAmount)}
                </span>
              </div>
            </div>

            {/* Reassurance pricing breakdown */}
            <div className="pt-2 border-t border-pink-100 flex items-center justify-between text-xs text-slate-600">
              <span>Prix total de la prestation : <strong>{formatFCFA(totalPrice)}</strong></span>
              <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                Reste sur place : {formatFCFA(remainingOnSite)}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="block font-bold">Information</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed">{errorMsg}</p>
              </div>
            </div>
          )}

          {/* ================= STEP: SELECT METHOD ================= */}
          {stepState === 'select' && (
            <div className="space-y-4">
              
              <div>
                <label className="block text-xs font-black uppercase text-slate-700 tracking-wider mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-sky-600" />
                  <span>Règlement sécurisé par Wave Sénégal :</span>
                </label>

                {/* Wave Single Card */}
                <div className="w-full">
                  <div className="p-4 rounded-2xl border-2 border-[#1DC3FF] bg-[#1DC3FF]/5 ring-4 ring-[#1DC3FF]/15 shadow-md flex items-center justify-between">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#1DC3FF] text-white flex items-center justify-center font-black text-xl shadow-md shadow-[#1DC3FF]/30 shrink-0">
                        <svg className="w-7 h-7 fill-white" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 14.5h-2v-2h2v2zm0-4h-2V7h2v5.5z"/>
                        </svg>
                      </div>
                      <div className="text-left">
                        <span className="font-black text-sm text-slate-950 block">Wave Sénégal 🇸🇳</span>
                        <span className="text-xs text-sky-700 font-bold">Débit direct sans frais • Instantané</span>
                      </div>
                    </div>

                    <div className="w-6 h-6 rounded-full bg-[#1DC3FF] text-white flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Phone Verification Input */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Numéro Wave de paiement :</span>
                  <span className="text-[11px] text-sky-700 font-bold">Compte Wave</span>
                </label>
                <div className="relative">
                  <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-slate-700 pr-2.5 border-r border-slate-200">
                    <span>🇸🇳</span>
                    <span>+221</span>
                  </div>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="77 123 45 67"
                    className="w-full pl-24 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 bg-slate-50/40"
                    required
                  />
                </div>
              </div>

              {/* Main Submit Action Button */}
              <button
                type="button"
                onClick={handleInitiatePayment}
                className="w-full py-4 px-5 rounded-2xl font-black text-sm shadow-lg flex items-center justify-center gap-2.5 transition-all cursor-pointer transform active:scale-[0.99] bg-[#1DC3FF] hover:bg-[#0ebaf6] text-slate-950 shadow-[#1DC3FF]/30"
              >
                <Smartphone className="w-5 h-5 shrink-0" />
                <span>Payer l'acompte de {formatFCFA(depositAmount)} avec Wave</span>
                <ArrowRight className="w-5 h-5 shrink-0" />
              </button>

              <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-1">
                <span className="flex items-center gap-1">
                  <Lock className="w-3 h-3 text-slate-400" />
                  Paiement 100% sécurisé
                </span>
                <span>•</span>
                <span>Sans frais cachés</span>
                <span>•</span>
                <span>Validation instantanée</span>
              </div>
            </div>
          )}

          {/* ================= STEP: PROCESSING ================= */}
          {stepState === 'processing' && (
            <div className="py-10 flex flex-col items-center justify-center text-center space-y-4 animate-in fade-in">
              <div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl animate-pulse ${
                paymentMethod === 'Wave' ? 'bg-[#1DC3FF] shadow-[#1DC3FF]/40' : 'bg-[#FF7900] shadow-[#FF7900]/40'
              }`}>
                <Loader2 className="w-10 h-10 animate-spin" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-900 text-lg">
                  Connexion à {paymentMethod} Sénégal...
                </h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Génération de votre session de paiement sécurisée de <strong>{formatFCFA(depositAmount)}</strong> via Genius Pay.
                </p>
              </div>
            </div>
          )}

          {/* ================= STEP: AWAITING PAYMENT ================= */}
          {stepState === 'awaiting' && (
            <div className="py-2 space-y-4 animate-in fade-in">
              
              {/* Compte à rebours 15 min de réservation temporaire */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 flex items-center justify-between text-amber-950 shadow-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-200/80 flex items-center justify-center shrink-0 text-base">
                    ⏱️
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-amber-950">
                      Créneau temporairement réservé
                    </p>
                    <p className="text-[11px] text-amber-800/80 truncate">
                      Temps restant pour confirmer :
                    </p>
                  </div>
                </div>
                <div className="font-mono font-black text-sm bg-white px-3 py-1 rounded-xl border border-amber-300 text-amber-950 shadow-2xs shrink-0">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Instructions Banner */}
              <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-900 flex items-center justify-center text-xs font-black">
                    1
                  </div>
                  <h4 className="font-black text-xs sm:text-sm">
                    Validez le paiement sur votre application {paymentMethod}
                  </h4>
                </div>
                <p className="text-xs text-amber-800/90 pl-8 leading-relaxed">
                  Une invite de paiement de <strong>{formatFCFA(depositAmount)}</strong> a été envoyée vers votre numéro. Ouvrez l'application pour confirmer.
                </p>
              </div>

              {/* Direct Link button */}
              {(transactionData?.checkout_url || transactionData?.payment_url) && (
                <a
                  href={transactionData.checkout_url || transactionData.payment_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-full py-3.5 px-4 rounded-2xl font-black text-sm shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    paymentMethod === 'Wave'
                      ? 'bg-[#1DC3FF] hover:bg-[#0ebaf6] text-slate-950 shadow-[#1DC3FF]/25'
                      : 'bg-[#FF7900] hover:bg-[#ea6f00] text-white shadow-[#FF7900]/25'
                  }`}
                >
                  <span>Ouvrir la page de paiement {paymentMethod}</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}

              {/* Automatic detection indicator & Manual validation */}
              <div className="pt-2 text-center space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 text-pink-600 animate-spin" />
                  <span>En attente de confirmation du réseau...</span>
                </div>

                <button
                  type="button"
                  onClick={handleManualCheck}
                  disabled={loading}
                  className="w-full py-3 px-4 rounded-xl font-black text-xs border-2 border-emerald-500 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 flex items-center justify-center gap-2 cursor-pointer shadow-xs transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-700" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  )}
                  <span>J'ai validé le paiement sur mon téléphone</span>
                </button>
              </div>

            </div>
          )}

          {/* ================= STEP: APPROVED ================= */}
          {stepState === 'approved' && (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-20 h-20 rounded-3xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div className="space-y-1">
                <h4 className="font-black text-slate-950 text-xl">
                  Acompte Reçu avec Succès !
                </h4>
                <p className="text-xs text-emerald-700 font-bold">
                  Votre rendez-vous est officiellement réservé et garanti.
                </p>
                <p className="text-[11px] text-slate-400 pt-1">
                  Redirection vers votre confirmation...
                </p>
              </div>
            </div>
          )}

        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-slate-500 text-[11px]">
          <span className="font-semibold flex items-center gap-1 text-slate-600">
            🔒 Partenaire agréé <strong className="text-slate-900">GeniusPay.ci</strong>
          </span>
          <span className="font-black text-emerald-600">
            Acompte garanti à 100%
          </span>
        </div>

      </div>
    </div>
  );
};
