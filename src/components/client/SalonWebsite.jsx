import React, { useState, useEffect, useRef } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { BookingStepper } from './BookingStepper';
import { ServiceSelector } from './ServiceSelector';
import { PractitionerSelector } from './PractitionerSelector';
import { SlotPicker } from './SlotPicker';
import { ClientForm } from './ClientForm';
import { PaymentModal } from './PaymentModal';
import { BookingSuccess } from './BookingSuccess';
import { DAY_ORDER, JS_DAY_TO_KEY } from '../../lib/schedule';
import { getTheme } from '../../lib/theme';
import {
  MapPin,
  Star,
  ShieldCheck,
  Share2,
  Clock,
  Check,
  Sparkles,
  Phone,
  Camera,
  X,
  ExternalLink,
  Heart,
  MessageCircle,
  Calendar,
  ChevronRight,
  ChevronDown,
  Shield,
  Award,
  Coffee,
  Wifi,
  Wind,
  Car,
  Navigation,
  ThumbsUp,
  HelpCircle,
  Users,
  BookOpen,
  Quote,
  BadgeCheck,
  ArrowRight
} from 'lucide-react';
import {
  DEFAULT_STORY,
  DEFAULT_TEAM,
  DEFAULT_LOOKBOOK
} from '../../data/mockData';
import { SocialLinkPill, InstagramIcon, TikTokIcon, FacebookIcon, formatSocialUrl } from '../common/SocialIcons';

export const SalonWebsite = () => {
  const { salon, step, setStep, services, selectService, currentUser, setCurrentView, selectedService, isSalonOwner, selectPractitioner, isSubscriptionExpired } = useBooking();
  const [copied, setCopied] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);
  const theme = getTheme(salon?.theme);

  const lookbook = Array.isArray(salon?.lookbook) ? salon.lookbook : [];
  const hasLookbook = lookbook.length > 0;
  const isTeamMode = (salon?.teamMode === 'team' || salon?.team_mode === 'team') && Array.isArray(salon?.team) && salon.team.length > 1;

  const todayJs = new Date().getDay();
  const todayKey = JS_DAY_TO_KEY[todayJs];
  const todaySchedule = salon?.schedule ? salon.schedule[todayKey] : null;
  const isTodayOpen = !!todaySchedule?.open;

  const handleShare = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
    const link = `${origin}/?salon=${salon.slug || 'mon-salon'}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Auto-scroll smooth vers le tunnel de réservation quand l'étape change (ex: de prestation à date)
  const prevStepRef = useRef(step);
  useEffect(() => {
    if (prevStepRef.current !== step && step > 1 && step < 5) {
      scrollToSection('prestations');
    }
    prevStepRef.current = step;
  }, [step]);


  const coverPosition = salon.coverPosition !== undefined ? salon.coverPosition : (salon.story?.coverPosition ?? 20);
  const coverZoom = Number(salon.coverZoom !== undefined ? salon.coverZoom : (salon.story?.coverZoom ?? 100));
  const coverFit = salon.coverFit || salon.story?.coverFit || 'cover';

  const cleanPhone = salon.phone ? salon.phone.replace(/\s+/g, '') : '';
  const waUrl = salon.whatsapp ? `https://wa.me/${salon.whatsapp.replace(/\D/g, '')}` : null;

  const handleBackToEditor = () => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('salon');
      window.history.pushState({}, '', url.pathname);
    }
    setCurrentView('salon');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  return (
    <div className="w-full max-w-full overflow-x-hidden bg-[#FAFAF8] min-h-screen text-stone-900 flex flex-col font-sans transition-colors duration-300 selection:bg-stone-200">
      
      {/* 0. Bouton Administrateur : Visible UNIQUEMENT par la gérante de ce salon HORS de la prévisualisation */}
      {isSalonOwner && !isInIframe && (
        <aside 
          aria-label="Mode Gérante"
          className="fixed bottom-6 right-6 z-[99999] flex items-center gap-2 bg-stone-950/95 text-white p-2 pl-3.5 pr-2 rounded-full shadow-2xl border border-stone-700 backdrop-blur-md transition-all hover:scale-105 pointer-events-auto"
        >
          <span className="flex items-center gap-1.5 text-[11px] font-bold text-stone-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0"></span>
            <span className="hidden sm:inline">Votre Salon</span>
          </span>
          <button
            onClick={handleBackToEditor}
            className="px-3 py-1.5 rounded-full bg-stone-800 hover:bg-stone-700 text-white text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-xs"
            title="Retourner à la gestion du salon"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </aside>
      )}

      {/* 1. ANNOUNCEMENT BANNER */}
      {salon.announcementBanner && (
        <div className={`w-full ${theme.primary} text-white py-2 px-4 text-center text-xs font-semibold tracking-wide flex items-center justify-center gap-2 shadow-xs transition-colors`}>
          <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0 animate-pulse" />
          <span className="truncate max-w-2xl">{salon.announcementBanner}</span>
        </div>
      )}

      {/* 2. TOP NAVBAR ULTRA ÉPURÉE */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left: Brand / Logo Compact */}
          <div className="flex items-center gap-3 min-w-0">
            {salon.avatarImage ? (
              <img
                src={salon.avatarImage}
                alt={salon.name}
                className="w-10 h-10 rounded-2xl object-cover ring-1 ring-stone-200 shadow-2xs shrink-0"
              />
            ) : (
              <div className={`w-10 h-10 rounded-2xl ${theme.accentGradient} text-white font-black text-sm flex items-center justify-center shadow-2xs shrink-0`}>
                {salon.name?.charAt(0) || 'S'}
              </div>
            )}
            <div className="min-w-0">
              <span className="font-extrabold text-stone-900 text-sm sm:text-base tracking-tight truncate block">
                {salon.name}
              </span>
              <span className="text-[11px] text-stone-500 font-medium truncate block -mt-0.5">
                {salon.city || 'Dakar'}
              </span>
            </div>
          </div>

          {/* Center: Quick Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
            <button
              onClick={() => scrollToSection('prestations')}
              className="hover:text-stone-950 transition-colors cursor-pointer"
            >
              Prestations
            </button>
            {salon.lookbook && salon.lookbook.length > 0 && (
              <button
                onClick={() => scrollToSection('lookbook')}
                className="hover:text-stone-950 transition-colors cursor-pointer"
              >
                Galerie
              </button>
            )}
            {salon.team && salon.team.length > 0 && (
              <button
                onClick={() => scrollToSection('equipe')}
                className="hover:text-stone-950 transition-colors cursor-pointer"
              >
                Équipe
              </button>
            )}
            <button
              onClick={() => scrollToSection('infos')}
              className="hover:text-stone-950 transition-colors cursor-pointer"
            >
              Horaires & Contact
            </button>
          </nav>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {salon.instagram && (
              <a
                href={formatSocialUrl('instagram', salon.instagram)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Instagram: ${salon.instagram}`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white hover:opacity-90 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
              >
                <InstagramIcon className="w-4 h-4 fill-white" />
              </a>
            )}

            {salon.tiktok && (
              <a
                href={formatSocialUrl('tiktok', salon.tiktok)}
                target="_blank"
                rel="noopener noreferrer"
                title={`TikTok: ${salon.tiktok}`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-stone-900 text-white hover:bg-black transition-all flex items-center justify-center shadow-2xs hover:scale-105"
              >
                <TikTokIcon className="w-4 h-4 fill-white" />
              </a>
            )}

            {salon.facebook && (
              <a
                href={formatSocialUrl('facebook', salon.facebook)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Facebook: ${salon.facebook}`}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#1877F2] text-white hover:bg-blue-600 transition-all flex items-center justify-center shadow-2xs hover:scale-105"
              >
                <FacebookIcon className="w-4 h-4 fill-white" />
              </a>
            )}

            {waUrl && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Discuter sur WhatsApp"
                className="p-2 sm:p-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/80 transition-colors flex items-center justify-center"
              >
                <MessageCircle className="w-4 h-4 text-emerald-600" />
              </a>
            )}

            <button
              onClick={handleShare}
              title="Copier le lien du salon"
              className="p-2 sm:p-2.5 rounded-xl border border-stone-200/80 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>

            {isSalonOwner && !isInIframe && (
              <button
                onClick={handleBackToEditor}
                title="Retourner à votre tableau de bord"
                className="hidden sm:flex px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold items-center gap-1.5 transition-all shadow-xs cursor-pointer border border-stone-700"
              >
                <span>⚡ Dashboard</span>
              </button>
            )}

            <button
              onClick={() => scrollToSection('prestations')}
              className={`hidden sm:flex px-4 py-2 rounded-xl ${theme.primary} ${theme.primaryHover} text-white text-xs font-bold items-center gap-1.5 transition-all shadow-xs cursor-pointer`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{isSubscriptionExpired ? 'Contacter' : 'Réserver'}</span>
            </button>
          </div>

        </div>
      </header>

      {/* 3. HERO GRAND FORMAT & LUMINEUX */}
      <section className="relative bg-stone-950">
        {/* Cover Background Banner */}
        <div className="relative h-64 sm:h-80 md:h-96 lg:h-[420px] w-full overflow-hidden bg-stone-950">
          {salon.coverImage ? (
            <div className="relative w-full h-full overflow-hidden">
              {/* Arrière-plan flouté d'ambiance si mode contain */}
              {coverFit === 'contain' && (
                <img
                  src={salon.coverImage}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-50 pointer-events-none"
                />
              )}
              {/* Photo avec cadrage précis (Haut/Centre/Bas ou curseur %) et zoom */}
              <img
                src={salon.coverImage}
                alt={salon.name}
                style={{
                  objectPosition: typeof coverPosition === 'number' || (!isNaN(Number(coverPosition)) && coverPosition !== '')
                    ? `center ${Number(coverPosition)}%`
                    : coverPosition === 'bottom'
                    ? 'center 100%'
                    : coverPosition === 'center'
                    ? 'center 50%'
                    : 'center 0%',
                  transform: coverZoom > 100 ? `scale(${coverZoom / 100})` : undefined,
                  transformOrigin: typeof coverPosition === 'number' || (!isNaN(Number(coverPosition)) && coverPosition !== '')
                    ? `center ${Number(coverPosition)}%`
                    : 'center 0%'
                }}
                className={`relative w-full h-full transition-all duration-200 ${
                  coverFit === 'contain' ? 'object-contain' : 'object-cover'
                }`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-stone-950/20 via-transparent to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-stone-900 via-stone-800 to-stone-950 opacity-95 flex items-center justify-center">
              <div className="text-center opacity-30">
                <Sparkles className="w-12 h-12 text-stone-300 mx-auto" />
              </div>
            </div>
          )}
        </div>

        {/* Salon Identity Card */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 relative -mt-8 sm:-mt-12 pb-3 sm:pb-6">
          <div className="bg-white rounded-3xl p-4 sm:p-6 border border-stone-200/80 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-3">
            
            <div className="flex items-start sm:items-center gap-3.5 sm:gap-5 min-w-0">
              {salon.avatarImage ? (
                <img
                  src={salon.avatarImage}
                  alt={salon.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl object-cover ring-4 ring-white shadow-lg bg-white shrink-0 -mt-10 sm:-mt-12 border border-stone-100"
                />
              ) : (
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl ${theme.accentGradient} text-white font-black text-2xl sm:text-3xl flex items-center justify-center ring-4 ring-white shadow-lg shrink-0 -mt-10 sm:-mt-12`}>
                  {salon.name?.charAt(0) || 'S'}
                </div>
              )}

              <div className="min-w-0 flex-1 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-base sm:text-2xl font-black text-stone-950 tracking-tight">
                    {salon.name}
                  </h1>
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 text-stone-700 border border-stone-200/80">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>
                      {salon?.business_type === 'barber'
                        ? '💈 Barbershop Pro'
                        : salon?.business_type === 'mixte'
                        ? '✂️ Salon Mixte'
                        : '✨ Studio Beauté Pro'}
                    </span>
                  </span>

                  {(salon?.work_mode === 'home' || salon?.work_mode === 'both') && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-700 border border-pink-200">
                      <span>{salon.work_mode === 'home' ? '🛵 À Domicile Uniquement' : '✨ En Salon & À Domicile'}</span>
                    </span>
                  )}
                </div>

                {salon.tagline && (
                  <p className="text-xs text-stone-600 font-medium line-clamp-1">
                    {salon.tagline}
                  </p>
                )}

                {/* Badges métadonnées essentiels */}
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-stone-600 pt-0.5">
                  {(salon.address || salon.city) && (
                    <span className="flex items-center gap-1 font-medium text-stone-700">
                      <MapPin className={`w-3 h-3 ${theme.iconColor} shrink-0`} />
                      <span className="truncate max-w-[220px]">{salon.address || salon.city}</span>
                    </span>
                  )}

                  <span className="flex items-center gap-1 font-semibold">
                    <span className={`w-1.5 h-1.5 rounded-full ${isTodayOpen ? 'bg-emerald-500 animate-pulse' : 'bg-stone-400'}`} />
                    <span className={isTodayOpen ? 'text-emerald-700' : 'text-stone-600'}>
                      {isTodayOpen ? 'Ouvert aujourd\'hui' : 'Fermé'}
                    </span>
                  </span>

                  <span className="flex items-center gap-1 font-semibold text-emerald-700">
                    <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Réservation garantie</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Contact & Social Pills */}
            {(cleanPhone || waUrl || salon.instagram || salon.tiktok || salon.facebook) && (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-2 border-t border-stone-100">
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-700 font-semibold text-xs transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-stone-500" />
                    <span>Appeler</span>
                  </a>
                )}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 font-semibold text-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </a>
                )}
                {salon.instagram && (
                  <SocialLinkPill network="instagram" value={salon.instagram} showHandle={false} />
                )}
                {salon.tiktok && (
                  <SocialLinkPill network="tiktok" value={salon.tiktok} showHandle={false} />
                )}
                {salon.facebook && (
                  <SocialLinkPill network="facebook" value={salon.facebook} showHandle={false} />
                )}
              </div>
            )}

          </div>
        </div>
      </section>

      {/* 4. MAIN CONTENT: PRESTATIONS EN PRIORITÉ ABSOLUE */}
      <main className="max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-6 sm:space-y-12 flex-1 w-full min-w-0 overflow-x-hidden">
        
        {/* ================= SECTION 1 : PRESTATIONS & TARIFS ================= */}
        <section id="prestations" className="scroll-mt-20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b border-stone-200/80 pb-3.5">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-stone-600 block">
                Tarifs clairs & Réservation instantanée
              </span>
              <h2 className="text-lg sm:text-2xl font-black text-stone-950 tracking-tight flex items-center gap-2">
                <span>✂️ Prestations & Tarifs</span>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200/80">
                  {services.length} prestations
                </span>
              </h2>
            </div>
            <p className="text-xs text-stone-600 max-w-md hidden sm:block">
              Sélectionnez votre prestation pour bloquer votre créneau en temps réel.
            </p>
          </div>

          {isSubscriptionExpired ? (
            <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-200/90 rounded-2xl sm:rounded-3xl p-6 sm:p-10 text-center space-y-4 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-7 h-7 text-amber-700" />
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-base sm:text-xl font-black text-slate-900">
                  Réservations en ligne momentanément suspendues
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  La prise de rendez-vous en ligne pour <strong>{salon.name}</strong> est temporairement en pause. Pour réserver votre prestation ou vous renseigner sur les créneaux disponibles, veuillez contacter le salon directement :
                </p>
              </div>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
                {cleanPhone && (
                  <a
                    href={`tel:${cleanPhone}`}
                    className="px-5 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Appeler ({cleanPhone})</span>
                  </a>
                )}
                {waUrl && (
                  <a
                    href={waUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-sm transition-all"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Écrire sur WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          ) : step < 5 ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-8 border border-stone-200/80 shadow-[0_4px_25px_rgb(0,0,0,0.03)] min-w-0 w-full overflow-hidden">
              <BookingStepper />

              <div className="mt-4 sm:mt-5">
                {step === 1 && <ServiceSelector onImageClick={(img) => setLightboxImage(img)} />}
                {isTeamMode ? (
                  <>
                    {step === 2 && <PractitionerSelector />}
                    {step === 3 && <SlotPicker />}
                    {step === 4 && <ClientForm />}
                  </>
                ) : (
                  <>
                    {step === 2 && <SlotPicker />}
                    {step === 3 && <ClientForm />}
                  </>
                )}
              </div>

              <PaymentModal />
            </div>
          ) : (
            <div className="max-w-xl mx-auto py-4">
              <BookingSuccess />
            </div>
          )}
        </section>

        {/* ================= SECTION C: GALERIE PHOTOS / LOOKBOOK ================= */}
        {hasLookbook && (
          <section id="lookbook" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200/80 pb-4">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${theme.primaryText} block`}>
                  Portfolio & Réalisations
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight flex items-center gap-2">
                  <span>📸 Galerie Photos</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200/80">
                    {lookbook.length} photo{lookbook.length > 1 ? 's' : ''}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-stone-600 max-w-md">
                {salon?.business_type === 'barber'
                  ? 'Découvrez nos dégradés, tailles de barbe et soins masculins.'
                  : salon?.business_type === 'mixte'
                  ? 'Découvrez nos coupes hommes, soins femmes et créations mixtes.'
                  : 'Découvrez nos coiffures, tresses & lace, poses d\'ongles, makeup et cils.'}
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {lookbook.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setLightboxImage(item.image)}
                  className="group relative rounded-2xl overflow-hidden bg-stone-100 border border-stone-200/80 aspect-square shadow-2xs hover:shadow-md transition-all cursor-pointer"
                >
                  <img
                    src={item.image}
                    alt={item.title || 'Réalisation'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3.5">
                    <span className="text-xs font-bold text-white truncate">{item.title || 'Réalisation du salon'}</span>
                    <span className="text-[10px] text-pink-200 font-medium">{item.category || 'Nos Réalisations'}</span>
                  </div>
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-950/70 text-white backdrop-blur-md text-[9px] font-bold uppercase tracking-wider group-hover:opacity-0 transition-opacity">
                    {item.category || 'Nos Réalisations'}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ================= SECTION D: NOTRE ÉQUIPE DANS LA VITRINE ================= */}
        {salon.team && salon.team.length > 0 && (
          <section id="equipe" className="scroll-mt-24 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 border-b border-stone-200/80 pb-4">
              <div>
                <span className={`text-xs font-bold uppercase tracking-wider ${theme.primaryText} block`}>
                  Nos Professionnelles & Praticiennes
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight flex items-center gap-2">
                  <span>✂️ L'Équipe du Salon</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 text-stone-700 border border-stone-200/80">
                    {salon.team.length} talent{salon.team.length > 1 ? 's' : ''}
                  </span>
                </h2>
              </div>
              <p className="text-xs text-stone-600 max-w-md">
                Prenez rendez-vous directement avec votre collaboratrice de confiance ou la première disponible.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {salon.team.map((member, idx) => {
                const memberAvatar = member.avatar || member.image;
                const firstName = member.name ? member.name.split(' ')[0] : 'elle';

                return (
                  <div
                    key={member.id || idx}
                    className="bg-white rounded-3xl p-5 sm:p-6 border border-stone-200/80 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center gap-4">
                        <div className="relative shrink-0">
                          {memberAvatar ? (
                            <img
                              src={memberAvatar}
                              alt={member.name}
                              className="w-16 h-16 rounded-2xl object-cover border border-stone-100 shadow-xs group-hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div
                            style={{ display: memberAvatar ? 'none' : 'flex' }}
                            className={`w-16 h-16 rounded-2xl ${theme.bgLight} ${theme.primaryText} items-center justify-center font-black text-xl border border-stone-200 shadow-2xs`}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : 'P'}
                          </div>
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-black text-stone-900 text-base sm:text-lg truncate">
                            {member.name}
                          </h3>
                          <span className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full ${theme.badgeFilled} border ${theme.borderLight} mt-1`}>
                            {member.role || 'Praticienne'}
                          </span>
                        </div>
                      </div>

                      {Array.isArray(member.specialties) && member.specialties.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-stone-100">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block mb-1.5">
                            Spécialités :
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {member.specialties.map((spec, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-2.5 py-1 rounded-lg bg-stone-50 border border-stone-200/70 text-stone-700 text-[11px] font-medium"
                              >
                                {spec}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-3">
                      <button
                        type="button"
                        onClick={() => {
                          selectPractitioner(member);
                          if (selectedService) {
                            setStep(isTeamMode ? 3 : 2);
                          } else {
                            setStep(1);
                          }
                          scrollToSection('prestations');
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl ${theme.buttonBg} text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-98 transition-all cursor-pointer shadow-xs`}
                      >
                        <span>Prendre RDV avec {firstName}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ================= SECTION E: HORAIRES DÉTAILLÉS & CONTACT ================= */}
        <section id="infos" className="scroll-mt-24 bg-white rounded-3xl p-6 sm:p-10 border border-stone-200/80 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-100 pb-4">
            <div className="max-w-xl">
              <span className="text-xs font-bold uppercase tracking-wider text-stone-600 block">
                Informations Pratiques
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-stone-950 tracking-tight mt-1">
                📍 Horaires d'Ouverture & Contact
              </h2>
              <p className="text-xs text-stone-600 mt-1">
                Retrouvez toutes les coordonnées et les horaires réels d'ouverture de notre établissement.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Day-by-Day Schedule Table */}
            <div className="lg:col-span-7 bg-stone-50/70 rounded-3xl p-5 sm:p-6 border border-stone-200/80 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
                <Clock className={`w-4 h-4 ${theme.iconColor}`} />
                <span>Horaires d'ouverture de la semaine</span>
              </h4>

              <div className="divide-y divide-stone-200/60 text-xs">
                {DAY_ORDER.map((dayKey) => {
                  const day = salon?.schedule?.[dayKey] || { label: dayKey, open: false };
                  const isToday = dayKey === todayKey;

                  return (
                    <div
                      key={dayKey}
                      className={`py-2.5 flex items-center justify-between px-3 rounded-xl transition-colors ${
                        isToday ? 'bg-white shadow-2xs font-bold' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`capitalize ${isToday ? `${theme.primaryText} font-black` : 'text-stone-700'}`}>
                          {day.label}
                        </span>
                        {isToday && (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${theme.badgeFilled}`}>
                            Aujourd'hui
                          </span>
                        )}
                      </div>

                      <div>
                        {day.open ? (
                          <span className="text-stone-800 font-semibold">
                            {day.start} — {day.end}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded-md">
                            Fermé
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Address & Direct Contact Box */}
            <div className="lg:col-span-5 space-y-4">
              <div className="p-5 rounded-3xl bg-white border border-stone-200/80 shadow-2xs space-y-3 text-xs">
                <div className="flex items-start gap-3">
                  <MapPin className={`w-5 h-5 ${theme.iconColor} shrink-0 mt-0.5`} />
                  <div>
                    <strong className="block text-stone-900 font-bold mb-0.5">Adresse / Localisation :</strong>
                    <span className="text-stone-600">{salon.address || salon.city || 'Sénégal'}</span>
                  </div>
                </div>

                {cleanPhone && (
                  <div className="flex items-start gap-3 pt-2.5 border-t border-stone-100">
                    <Phone className={`w-5 h-5 ${theme.iconColor} shrink-0 mt-0.5`} />
                    <div>
                      <strong className="block text-stone-900 font-bold mb-0.5">Téléphone direct :</strong>
                      <a href={`tel:${cleanPhone}`} className={`${theme.primaryText} font-bold hover:underline`}>
                        {salon.phone}
                      </a>
                    </div>
                  </div>
                )}

                {(salon.instagram || salon.tiktok || salon.facebook) && (
                  <div className="pt-3 border-t border-stone-100 space-y-2">
                    <strong className="block text-stone-900 font-bold text-xs">
                      Réseaux Sociaux du Salon :
                    </strong>
                    <div className="flex flex-wrap items-center gap-2">
                      {salon.instagram && (
                        <SocialLinkPill network="instagram" value={salon.instagram} showHandle={true} />
                      )}
                      {salon.tiktok && (
                        <SocialLinkPill network="tiktok" value={salon.tiktok} showHandle={true} />
                      )}
                      {salon.facebook && (
                        <SocialLinkPill network="facebook" value={salon.facebook} showHandle={true} />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Call to action card */}
              <div className="p-6 rounded-3xl bg-stone-900 text-white space-y-4 shadow-md">
                <div>
                  <h4 className="font-black text-sm text-white">
                    Besoin de réserver ou d'une info ?
                  </h4>
                  <p className="text-xs text-stone-300 mt-1">
                    Réservez en ligne pour bloquer votre créneau, ou écrivez-nous directement sur WhatsApp.
                  </p>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => scrollToSection('prestations')}
                    className={`w-full py-3 rounded-xl ${theme.primary} ${theme.primaryHover} text-white font-bold text-xs transition-all shadow-xs cursor-pointer flex items-center justify-center gap-2`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Choisir une prestation</span>
                  </button>

                  {waUrl && (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Écrire sur WhatsApp</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 5. LIGHTBOX MODAL FOR GALLERY PHOTOS */}
      {lightboxImage && (
        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 bg-stone-950/90 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="relative max-w-3xl max-h-[85vh] w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Réalisation agrandie"
              className="w-full h-full object-contain rounded-2xl shadow-2xl max-h-[80vh] mx-auto"
            />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute -top-12 right-0 p-2 rounded-full bg-white/20 text-white hover:bg-white/40 transition-colors cursor-pointer"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      )}

      {/* 6. SALON WEBSITE FOOTER */}
      <footer className="border-t border-stone-200/80 bg-white py-8 mt-12 text-stone-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div>
            <span className="font-bold text-stone-900 text-sm">{salon.name}</span>
            <p className="text-[11px] text-stone-600 mt-0.5">
              {(salon.address || salon.city) ? `${salon.address || salon.city} • ` : ''}{salon.phone}
            </p>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-stone-600">
            <span className="px-2.5 py-1 rounded-full bg-stone-100 border border-stone-200/80">
              ⚡ Site Propulsé par Appointfy Sénégal
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
};

