import React, { useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { getTheme } from '../../lib/theme';
import { User, Phone, MessageSquare, ChevronLeft, ShieldCheck, Lock, ArrowRight, Gift, Crown, Sparkles } from 'lucide-react';

export const ClientForm = () => {
  const {
    salon,
    selectedService,
    selectedDate,
    selectedSlot,
    selectedPractitioner,
    clientInfo,
    updateClientInfo,
    setStep,
    proceedToPayment,
    getClientLoyalty
  } = useBooking();

  const theme = getTheme(salon?.theme);
  const isTeamMode = (salon?.teamMode === 'team' || salon?.team_mode === 'team') && Array.isArray(salon?.team) && salon.team.length > 1;

  // Reconnaissance fidélité par numéro
  const clientLoyalty = useMemo(() => {
    if (!clientInfo.phone || clientInfo.phone.replace(/\D/g, '').length < 8) return null;
    return getClientLoyalty ? getClientLoyalty(clientInfo.phone) : null;
  }, [clientInfo.phone, getClientLoyalty]);

  const isLoyaltyEnabled = salon?.loyalty_enabled !== false;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!clientInfo.name.trim() || !clientInfo.phone.trim()) {
      alert('Veuillez renseigner votre prénom et votre numéro de téléphone.');
      return;
    }
    proceedToPayment();
  };

  const isZeroDeposit = (Number(selectedService?.deposit) || 0) <= 0;
  const remainingBalance = isZeroDeposit ? (selectedService?.price || 0) : Math.max(0, (selectedService?.price || 0) - (selectedService?.deposit || 0));

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(isTeamMode ? 3 : 2)}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-500 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          Modifier date & heure
        </button>
      </div>

      {/* Recap Banner - Luxury Receipt Card */}
      <div className="bg-stone-50/80 border border-stone-200/80 rounded-2xl p-4 sm:p-5">
        <div className="flex justify-between items-start border-b border-stone-200/60 pb-3.5">
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600 block">Récapitulatif</span>
            <h3 className="font-bold text-base sm:text-lg text-stone-900">{selectedService?.name}</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs text-stone-600 mt-1">
              <span className="inline-flex items-center gap-1 bg-white border border-stone-200/60 px-2 py-0.5 rounded-md font-medium text-stone-700">
                📅 {selectedDate} à <strong className="text-stone-900">{selectedSlot}</strong>
              </span>
              <span className="text-stone-600">({selectedService?.duration})</span>
            </div>
            {isTeamMode && (
              <p className="text-xs text-stone-600 flex items-center gap-1.5 pt-0.5">
                <span className="text-stone-600">Avec :</span>
                <span className="font-semibold text-stone-800">
                  {selectedPractitioner ? selectedPractitioner.name : "Toute l'équipe (Première disponible)"}
                </span>
              </p>
            )}
          </div>
          <div className="text-right">
            <span className="text-xs text-stone-600 block">Total prestation</span>
            <span className="text-base font-black text-stone-900">{formatFCFA(selectedService?.price)}</span>
          </div>
        </div>

        <div className="pt-3.5 flex items-center justify-between text-xs">
          {isZeroDeposit ? (
            <div>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Réservation sans acompte</span>
              </span>
              <span className="text-stone-600 text-[11px]">Règlement intégral de {formatFCFA(selectedService?.price)} sur place au salon</span>
            </div>
          ) : (
            <div>
              <span className="text-stone-900 font-extrabold block">Acompte Wave à régler maintenant</span>
              <span className="text-stone-600 text-[11px]">Reste à régler au salon : {formatFCFA(remainingBalance)}</span>
            </div>
          )}
          <div className="text-right">
            <span className={`text-xl font-black ${isZeroDeposit ? 'text-emerald-700' : 'text-stone-900'}`}>
              {isZeroDeposit ? '0 FCFA' : formatFCFA(selectedService?.deposit)}
            </span>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-stone-600">Vos coordonnées de réservation</h3>
          <p className="text-xs text-stone-600 mt-0.5">Ces informations permettent au salon de confirmer votre créneau.</p>
        </div>

        {/* Name */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Prénom & Nom *
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="Ex: Fatou Binetou"
              value={clientInfo.name}
              onChange={(e) => updateClientInfo('name', e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200/80 bg-stone-50/40 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 ${theme.ring} focus:${theme.primaryBorder} transition-all`}
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            Numéro de téléphone mobile * (Wave)
          </label>
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-bold text-stone-700 pr-2 border-r border-stone-200">
              <span>🇸🇳</span>
              <span>+221</span>
            </div>
            <input
              type="tel"
              required
              placeholder="77 123 45 67"
              value={clientInfo.phone}
              onChange={(e) => updateClientInfo('phone', e.target.value)}
              className={`w-full pl-24 pr-4 py-2.5 rounded-xl border border-stone-200/80 bg-stone-50/40 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 ${theme.ring} focus:${theme.primaryBorder} font-mono font-bold transition-all`}
            />
          </div>
          <p className="text-[11px] text-stone-600 mt-1">
            Utilisé pour l'acompte et pour vous prévenir en cas de rappel ou modification.
          </p>

          {/* Badge Fidélité Immédiat pour la Cliente */}
          {isLoyaltyEnabled && clientLoyalty && (
            <div className="mt-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/15 border border-amber-300 text-xs text-amber-950 space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-black">
                  {clientLoyalty.isRewardAvailable ? (
                    <Crown className="w-3.5 h-3.5 text-amber-600 animate-bounce" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  )}
                  <span>
                    {clientLoyalty.isRewardAvailable 
                      ? '👑 Récompense VIP Prête !' 
                      : `Carte Fidélité : ${clientLoyalty.visitsCount}/${clientLoyalty.targetVisits} passages`}
                  </span>
                </div>
                <span className="text-[10px] font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-full">
                  {clientLoyalty.isRewardAvailable ? 'À réclamer au salon' : 'Salon VIP'}
                </span>
              </div>
              <p className="text-[11px] text-amber-800 leading-tight">
                {clientLoyalty.isRewardAvailable ? (
                  <>Félicitations ! Votre avantage (<strong>{salon?.loyalty_reward_description || 'Cadeau VIP'}</strong>) est prêt et sera validé au salon lors de votre passage.</>
                ) : clientLoyalty.visitsCount > 0 ? (
                  <>Plus que <strong>{clientLoyalty.targetVisits - clientLoyalty.visitsCount} visite(s)</strong> pour débloquer : <em>{salon?.loyalty_reward_description || 'Avantage VIP'}</em>.</>
                ) : (
                  <>Ce rendez-vous validera votre premier passage sur la carte de fidélité du salon.</>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-stone-700 mb-1.5">
            {salon?.business_type === 'barber'
              ? 'Précisions pour votre barbier (Optionnel)'
              : 'Précisions pour votre rendez-vous / prestation (Optionnel)'}
          </label>
          <div className="relative">
            <MessageSquare className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
            <textarea
              rows="2"
              placeholder="Ex: style ou modèle souhaité, détails particuliers..."
              value={clientInfo.notes}
              onChange={(e) => updateClientInfo('notes', e.target.value)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border border-stone-200/80 bg-stone-50/40 text-stone-900 text-sm focus:bg-white focus:outline-none focus:ring-2 ${theme.ring} focus:${theme.primaryBorder} resize-none transition-all`}
            />
          </div>
        </div>

        {/* Reassurance */}
        <div className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
          isZeroDeposit 
            ? 'bg-emerald-50/80 border-emerald-200/80 text-emerald-900' 
            : 'bg-stone-50 border-stone-200/60 text-stone-700'
        }`}>
          <ShieldCheck className={`w-4 h-4 ${isZeroDeposit ? 'text-emerald-600' : 'text-stone-500'} shrink-0`} />
          <span className="leading-relaxed">
            {isZeroDeposit 
              ? <>Aucun paiement requis en ligne. Votre créneau est réservé et vous réglez directement sur place au salon.</>
              : <>Votre acompte est <strong>déduit à 100%</strong> du montant de la prestation lors de votre passage au salon.</>
            }
          </span>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className={`w-full py-3.5 px-5 rounded-xl font-bold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            isZeroDeposit 
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
              : `${theme.buttonGradient} ${theme.shadowGlow} text-white hover:opacity-95`
          }`}
        >
          {isZeroDeposit ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          <span>
            {isZeroDeposit 
              ? 'Confirmer mon rendez-vous (Sans acompte)' 
              : `Payer l'acompte (${formatFCFA(selectedService?.deposit)})`}
          </span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
