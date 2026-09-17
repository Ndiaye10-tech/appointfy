import React, { useState } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { getTheme } from '../../lib/theme';
import { CheckCircle2, Calendar, MessageSquare, MapPin, RefreshCw, Heart } from 'lucide-react';

export const BookingSuccess = () => {
  const { lastBooking, salon, resetBookingFlow } = useBooking();
  const theme = getTheme(salon?.theme);
  const [downloaded, setDownloaded] = useState(false);

  if (!lastBooking) return null;

  const handleDownloadCalendar = () => {
    const title = `RDV Coiffure - ${salon.name} (${lastBooking.serviceName})`;
    const description = `Prestation: ${lastBooking.serviceName}\nAcompte payé: ${formatFCFA(lastBooking.depositPaid)} (${lastBooking.paymentMethod})\nReste à régler: ${formatFCFA(lastBooking.remainingBalance)}\nAdresse: ${salon.address}\nTél: ${salon.phone}`;
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BOOK SN//NONSGML v1.0//FR',
      'BEGIN:VEVENT',
      `SUMMARY:${title}`,
      `DESCRIPTION:${description.replace(/\n/g, '\\n')}`,
      `LOCATION:${salon.address}`,
      'DTSTART:20260915T140000Z',
      'DTEND:20260915T160000Z',
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `RDV_${salon.slug}_${lastBooking.id}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2500);
  };

  const isZeroDeposit = (Number(lastBooking.depositPaid) || 0) <= 0;

  const whatsappText = encodeURIComponent(
    `Bonjour ${salon.name} ! Je viens de réserver via Appointfy :\n\n` +
    `• Référence : ${lastBooking.id}\n` +
    `• Prestation : ${lastBooking.serviceName}\n` +
    (lastBooking.practitionerName ? `• Avec : ${lastBooking.practitionerName}\n` : '') +
    `• Date : ${lastBooking.date} à ${lastBooking.timeSlot}\n` +
    (isZeroDeposit
      ? `• Formule : Sans acompte (Règlement intégral de ${formatFCFA(lastBooking.remainingBalance || lastBooking.price)} sur place)\n`
      : `• Acompte versé : ${formatFCFA(lastBooking.depositPaid)} via ${lastBooking.paymentMethod}\n• Solde au salon : ${formatFCFA(lastBooking.remainingBalance)}\n`
    ) +
    `• Nom : ${lastBooking.clientName}\n\n` +
    `À très bientôt !`
  );

  const cleanWa = (salon.whatsapp || salon.phone || '').replace(/\D/g, '');
  const whatsappUrl = cleanWa ? `https://wa.me/${cleanWa}?text=${whatsappText}` : '#';

  return (
    <div className="max-w-lg mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
      
      {/* Top success card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center">
        <div className={`w-16 h-16 ${theme.bgLight} ${theme.primaryText} rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xs`}>
          <Heart className={`w-9 h-9 ${theme.iconColor} fill-current`} />
        </div>

        <span className="text-xs font-bold uppercase tracking-widest text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block mb-2">
          Rendez-vous 100% Confirmé
        </span>

        <h2 className="text-2xl font-black text-stone-950">
          Merci {lastBooking.clientName} !
        </h2>
        <p className="text-xs sm:text-sm text-stone-600 mt-1">
          Votre créneau chez <strong>{salon.name}</strong> est bien réservé.
        </p>

        {/* Receipt Box */}
        <div className="mt-6 text-left bg-stone-50/80 p-4 sm:p-5 rounded-2xl border border-stone-200/80 space-y-3 font-sans">
          <div className="flex justify-between items-center border-b border-stone-200/60 pb-2.5">
            <span className="text-xs text-stone-600">N° de Réservation</span>
            <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm bg-white px-2 py-0.5 rounded border border-stone-200">
              {lastBooking.id}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-600">Prestation</span>
            <span className="font-bold text-stone-900 text-right">{lastBooking.serviceName}</span>
          </div>

          {lastBooking.practitionerName && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-stone-600">Praticienne</span>
              <span className="font-bold text-stone-900 text-right">{lastBooking.practitionerName}</span>
            </div>
          )}

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-600">Date & Heure</span>
            <span className={`font-bold ${theme.primaryText} ${theme.badgeFilled} px-2 py-0.5 rounded`}>
              {lastBooking.date} à {lastBooking.timeSlot}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-stone-600">{isZeroDeposit ? 'Acompte demandé' : `Acompte versé (${lastBooking.paymentMethod})`}</span>
            {isZeroDeposit ? (
              <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                0 FCFA (Sans acompte)
              </span>
            ) : (
              <span className={`font-black ${theme.primaryText}`}>{formatFCFA(lastBooking.depositPaid)}</span>
            )}
          </div>

          <div className="flex justify-between items-center text-xs border-t border-dashed border-stone-200 pt-2">
            <span className="text-stone-600 font-bold">{isZeroDeposit ? 'Total à régler au salon' : 'Reste à régler sur place'}</span>
            <span className="font-black text-stone-900">{formatFCFA(lastBooking.remainingBalance || lastBooking.price)}</span>
          </div>

          <div className="pt-2 border-t border-stone-200/60 flex items-start gap-2 text-[11px] text-stone-600">
            <MapPin className={`w-3.5 h-3.5 ${theme.iconColor} shrink-0 mt-0.5`} />
            <span>{salon.address}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 space-y-3">
          <button
            onClick={handleDownloadCalendar}
            className="w-full py-3 px-4 rounded-xl border border-stone-200/80 hover:bg-stone-50 font-semibold text-xs sm:text-sm text-stone-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Calendar className={`w-4 h-4 ${theme.iconColor}`} />
            <span>{downloaded ? 'Téléchargé (.ics) !' : 'Ajouter à mon agenda Google / Apple'}</span>
          </button>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Envoyer le récapitulatif sur WhatsApp (Gratuit)</span>
          </a>
        </div>

        <button
          onClick={resetBookingFlow}
          className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Prendre un autre rendez-vous
        </button>
      </div>
    </div>
  );
};
