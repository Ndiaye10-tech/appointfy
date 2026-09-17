import React, { useState } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import {
  Sparkles,
  Store,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Eye,
  Smartphone,
  Clock,
  MessageSquare,
  Check,
  Lock,
  DollarSign,
  Camera,
  Layers,
  HelpCircle,
  ExternalLink,
  Shield,
  Heart,
  Palette,
  Scissors,
  ShieldCheck,
  Package,
  Crown
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

const PROFESSIONS = [
  {
    id: 'onglerie',
    title: 'Onglerie & Nails',
    emoji: '💅',
    tag: 'Spécialiste Ongles',
    headline: "Votre catalogue de poses et décos enfin valorisé à sa juste valeur.",
    description: "Présentez vos poses complètes (gel, résine, capsules américaines) et vos suppléments nail art avec photos et tarifs précis. Vos clientes sélectionnent leur prestation exacte et versent leur acompte sans négocier en DM.",
    points: [
      'Lookbook photo de vos plus belles poses',
      'Durée exacte calculée pour ne jamais accumuler de retard',
      'Acomptes Wave obligatoires pour sécuriser vos heures de travail'
    ]
  },
  {
    id: 'makeup',
    title: 'Make-Up Artists',
    emoji: '💄',
    tag: 'Maquilleuses & Mariées',
    headline: "Sécurisez vos samedis et dates de mariages sans relances épuisantes.",
    description: "Ne bloquez plus jamais une demi-journée pour une mariée ou un shooting sur une simple promesse WhatsApp. Avec votre lien de réservation, chaque créneau VIP est confirmé immédiatement par son acompte.",
    points: [
      'Réservation des forfaits mariée, invités & shootings',
      'Paiement d\'acompte immédiat par Wave sans échange de RIB',
      'Fiche cliente détaillée avec le lieu et l\'heure de l\'événement'
    ]
  },
  {
    id: 'coiffure',
    title: 'Coiffure & Tresses',
    emoji: '✂️',
    tag: 'Braiders & Perruquières',
    headline: "Organisez vos prestations longues sans stress ni chevauchements.",
    description: "Knotless braids, poses de perruques, tissages ou soins profonds : vos clientes visualisent la durée exacte et réservent le créneau qui respecte votre énergie.",
    points: [
      'Gestion optimale des créneaux longs (2h à 6h)',
      'Précision claire si les mèches sont incluses ou à apporter',
      'Mode équipe si vous travaillez avec des assistantes'
    ]
  },
  {
    id: 'regard',
    title: 'Cils & Regard',
    emoji: '👁️',
    tag: 'Lash Artists',
    headline: "Rythmez vos poses complètes et remplissages toutes les 3 semaines.",
    description: "Volume russe, cil à cil ou rehaussement : vos clientes fidèles réservent leur remplissage en toute autonomie, sans vous interrompre pendant que vos mains travaillent en cabine.",
    points: [
      'Distinction claire entre pose complète et remplissage',
      'Rappels automatiques par WhatsApp pour garantir 99% de présence',
      'Zéro appel téléphonique pendant que vous posez les cils'
    ]
  },
  {
    id: 'esthetique',
    title: 'Soins & Esthétique',
    emoji: '🧴',
    tag: 'Esthéticiennes & Spas',
    headline: "Offrez l'image d'un institut prestigieux dès la prise de rendez-vous.",
    description: "Hydrafacial, soins du visage, épilations et gommages : offrez un parcours de réservation haut de gamme avec consignes claires et paiement sécurisé.",
    points: [
      'Espace de réservation épuré et rassurant',
      'Consignes préalables et contre-indications détaillées',
      'Caisse instantanée pour enregistrer le solde sur place'
    ]
  },
  {
    id: 'independante',
    title: 'Indépendantes',
    emoji: '🏡',
    tag: 'Solo & À Domicile',
    headline: "Gérez tout votre business depuis votre smartphone, sans ordinateur.",
    description: "Que vous receviez dans votre studio privé ou que vous exerciez à domicile, gagnez en crédibilité et débarrassez-vous de la gestion des messages tard le soir.",
    points: [
      '100% fonctionnel sur smartphone (iPhone & Android)',
      'Conditions d\'accueil et adresse partagées en toute clarté',
      '14 jours offerts sans carte bancaire pour tester à votre rythme'
    ]
  }
];

export const LandingPage = () => {
  const { setCurrentView, setAuthMode, currentUser, salon, resetBookingFlow } = useBooking();

  const hasAccount = Boolean(
    currentUser || 
    (typeof window !== 'undefined' && localStorage.getItem('appointfy_user'))
  );

  const [activeProfId, setActiveProfId] = useState('onglerie');
  const [activeShowcase, setActiveShowcase] = useState('client');

  // Simulateur
  const [monthlyClients, setMonthlyClients] = useState(70);
  const [avgPrice, setAvgPrice] = useState(15000);
  const estimatedLostMonthly = Math.round(monthlyClients * 0.15 * avgPrice);
  const protectedYearly = Math.round(estimatedLostMonthly * 12 * 0.95);

  const handleOpenRegister = () => {
    setAuthMode('register');
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenLogin = () => {
    setAuthMode('login');
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const selectedProf = PROFESSIONS.find(p => p.id === activeProfId) || PROFESSIONS[0];

  return (
    <div className="w-full bg-[#FAF8F7] text-stone-900 min-h-screen selection:bg-pink-100 selection:text-pink-900 font-sans antialiased">
      
      {/* ================= 1. UNIQUE NAVBAR ÉPURÉE ================= */}
      <nav className="sticky top-0 z-50 bg-[#FAF8F7]/95 backdrop-blur-md border-b border-stone-200/70 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Brand Logo */}
          <div className="cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <BrandLogo />
          </div>

          {/* Liens de navigation (Desktop) */}
          <div className="hidden md:flex items-center gap-7 text-xs font-bold text-stone-600">
            <a href="#metiers" className="hover:text-pink-600 transition-colors">Votre métier</a>
            <a href="#fonctionnement" className="hover:text-pink-600 transition-colors">Comment ça marche</a>
            <a href="#demo" className="hover:text-pink-600 transition-colors">Démonstration</a>
            <a href="#simulateur" className="hover:text-pink-600 transition-colors">Gains garantis</a>
            <a href="#tarifs" className="hover:text-pink-600 transition-colors">Tarif</a>
            <a href="#faq" className="hover:text-pink-600 transition-colors">FAQ</a>
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center gap-2 sm:gap-3">
            {hasAccount ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('salon');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="px-4 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-white font-black text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Store className="w-3.5 h-3.5 text-pink-400" />
                <span>Mon Espace Pro</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleOpenLogin}
                  className="px-3.5 py-2 rounded-xl text-stone-700 hover:text-stone-950 font-bold text-xs transition-colors cursor-pointer"
                >
                  Connexion
                </button>
                <button
                  type="button"
                  onClick={handleOpenRegister}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-extrabold text-xs shadow-md shadow-pink-500/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Essai gratuit</span>
                </button>
              </>
            )}
          </div>

        </div>
      </nav>

      {/* ================= 2. HERO IMMERSIF AVEC APERÇU INTÉGRÉ ================= */}
      <section className="relative overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        
        {/* Soft Ambient Rose Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-pink-200/30 via-rose-100/30 to-amber-100/20 blur-[100px] rounded-full pointer-events-none -z-10" />

        <div className="max-w-4xl mx-auto space-y-6 text-center">
          

          {/* Titre Principal */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-stone-950 leading-[1.12]">
            Votre talent mérite une organisation à la hauteur de{' '}
            <span className="bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 bg-clip-text text-transparent">
              votre réputation.
            </span>
          </h1>

          {/* Sous-titre percutant */}
          <p className="text-sm sm:text-base text-stone-600 leading-relaxed max-w-2xl mx-auto">
            Offrez à vos clientes un <strong>site de réservation chic</strong> pour votre bio Instagram, éliminez 95% des lapins grâce aux <strong>acomptes Wave obligatoires</strong>, et pilotez votre planning 100% sur smartphone.
          </p>

          {/* Bouton CTA Unique & Centré */}
          <div className="pt-2 flex items-center justify-center">
            {hasAccount ? (
              <button
                type="button"
                onClick={() => {
                  setCurrentView('salon');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-sm sm:text-base shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Store className="w-4 h-4" />
                <span>Accéder à mon espace pro</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleOpenRegister}
                className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-sm sm:text-base shadow-lg shadow-pink-500/25 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Démarrer mes 14 jours offerts</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Réassurance */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-stone-500 font-semibold">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>14 jours gratuits</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Zéro carte bancaire requise</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% sur mobile</span>
            </div>
          </div>

        </div>

      </section>

      {/* ================= 3. SECTION MÉTIERS HARMONISÉE ================= */}
      <section id="metiers" className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-stone-200/70">
        
        <div className="text-center max-w-2xl mx-auto mb-8">
          <span className="text-xs font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
            Une Solution Dédiée
          </span>
          <h2 className="text-2xl sm:text-4xl font-black text-stone-950 mt-3 tracking-tight">
            Conçu pour chaque univers de la beauté
          </h2>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
            Choisissez votre spécialité pour voir comment Appointfy transforme vos journées :
          </p>
        </div>

        {/* Onglets Métiers Épurés */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none justify-start sm:justify-center max-w-5xl mx-auto px-1">
          {PROFESSIONS.map((prof) => {
            const isSelected = prof.id === activeProfId;
            return (
              <button
                key={prof.id}
                type="button"
                onClick={() => setActiveProfId(prof.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-md'
                    : 'bg-white text-stone-700 border border-stone-200 hover:border-pink-200'
                }`}
              >
                <span>{prof.emoji}</span>
                <span>{prof.title}</span>
              </button>
            );
          })}
        </div>

        {/* Fiche Métier Déployée */}
        <div className="mt-6 max-w-4xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm text-left">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-100 pb-5">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-pink-50 text-pink-700 text-xs font-bold mb-1">
                <span>{selectedProf.emoji}</span>
                <span>{selectedProf.tag}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-stone-950">
                {selectedProf.headline}
              </h3>
            </div>
            <button
              type="button"
              onClick={handleOpenRegister}
              className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shrink-0 inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span>Démarrer en {selectedProf.title}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed mt-4">
            {selectedProf.description}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-5">
            {selectedProf.points.map((pt, i) => (
              <div key={i} className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200/70 flex items-start gap-2.5">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[3]" />
                <span className="text-xs font-bold text-stone-800 leading-snug">{pt}</span>
              </div>
            ))}
          </div>
        </div>

      </section>

      {/* ================= 4. COMMENT ÇA MARCHE (3 ÉTAPES CLAIRES) ================= */}
      <section id="fonctionnement" className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-200/70 text-center">
        <span className="text-xs font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
          Simplicité Absolue
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-stone-950 mt-3 tracking-tight">
          Comment ça fonctionne ?
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-lg mx-auto">
          Prise en main en 2 minutes sur votre smartphone, sans compétences techniques.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
          {/* Étape 1 */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="font-black text-base text-stone-900">Créez votre vitrine</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ajoutez vos prestations, tarifs, photos et horaires d'ouverture. Votre site web professionnel est prêt instantanément.
            </p>
          </div>

          {/* Étape 2 */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-pink-100 text-pink-700 font-black text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="font-black text-base text-stone-900">Partagez votre lien en bio</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Placez votre lien de réservation sur Instagram, TikTok ou WhatsApp. Vos clientes choisissent leur heure en toute autonomie 24h/24.
            </p>
          </div>

          {/* Étape 3 */}
          <div className="bg-white p-6 rounded-3xl border border-stone-200/80 shadow-2xs space-y-3 relative">
            <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 font-black text-xs flex items-center justify-center">
              3
            </span>
            <h3 className="font-black text-base text-stone-900">Encaissez l'acompte Wave</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Chaque réservation est sécurisée par un acompte direct. Plus aucun rendez-vous fantôme, votre journée est garantie et rentabilisée.
            </p>
          </div>
        </div>
      </section>

      {/* ================= 5. DÉMO INTERACTIVE (DOUBLE FACE) ================= */}
      <section id="demo" className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-stone-200/70 text-center">
        
        <span className="text-xs font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
          Démonstration
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-stone-950 mt-3 tracking-tight">
          Deux interfaces pensées pour la perfection
        </h2>

        {/* Switcher */}
        <div className="flex items-center justify-center gap-2 mt-6 mb-6">
          <button
            type="button"
            onClick={() => setActiveShowcase('client')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeShowcase === 'client'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>1. Côté Clientes (Votre Vitrine)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveShowcase('pro')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
              activeShowcase === 'pro'
                ? 'bg-stone-900 text-white shadow-xs'
                : 'bg-white text-stone-600 border border-stone-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>2. Côté Professionnelle (Votre Cockpit)</span>
          </button>
        </div>

        {/* Box Démo */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-stone-200/90 shadow-sm text-left">
          {activeShowcase === 'client' ? (
            <div className="space-y-4">
              <h3 className="font-black text-lg text-stone-950">
                L'expérience de vos clientes sur smartphone
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                  <span className="font-extrabold text-xs text-stone-900 block">📸 Lookbook & Tarifs Clairs</span>
                  <p className="text-xs text-stone-600">
                    Photos haute résolution de vos réalisations. La cliente choisit en connaissance de cause sans poser 20 questions en DM.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                  <span className="font-extrabold text-xs text-stone-900 block">📅 Choix d'Horaire Autonome</span>
                  <p className="text-xs text-stone-600">
                    Seuls vos créneaux réellement libres sont proposés. Zéro risque de double réservation.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                  <span className="font-extrabold text-xs text-stone-900 block">⚡ Acompte Immédiat Wave</span>
                  <p className="text-xs text-stone-600">
                    Versement de l'acompte en un geste. La cliente s'engage, le rendez-vous est scellé.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-black text-lg text-stone-950">
                Votre outil de pilotage au quotidien
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                  <span className="font-extrabold text-xs text-stone-900 block">📅 Planning Intuitif</span>
                  <p className="text-xs text-stone-600">
                    Visualisez votre journée en un coup d'œil. Bloquez des pauses ou indisponibilités en un tap.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                  <span className="font-extrabold text-xs text-stone-900 block">💰 Bouton « Venu & Payé »</span>
                  <p className="text-xs text-stone-600">
                    Enregistrez le solde en un clic à l'arrivée de la cliente. Suivez votre chiffre d'affaires exact sans calculatrice.
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1.5">
                  <span className="font-extrabold text-xs text-stone-900 block">💬 Rappels WhatsApp 1-Clic</span>
                  <p className="text-xs text-stone-600">
                    Envoyez un mot poli de confirmation pré-rempli pour vous assurer que la cliente arrive à l'heure.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

      </section>

      {/* ================= SECTION : GESTION D'ÉTABLISSEMENT COMPLÈTE ================= */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto border-t border-stone-200/70 text-center">
        <span className="text-xs font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
          Système Tout-en-Un
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-stone-950 mt-3 tracking-tight">
          Bien plus qu'un agenda : le logiciel de gestion de votre salon
        </h2>
        <p className="text-xs sm:text-sm text-stone-500 mt-1.5 max-w-2xl mx-auto">
          Développé pour répondre aux exigences des studios et salons structurés au Sénégal et en Afrique de l'Ouest.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10 text-left">
          {/* Pilier 1 : Équipe & Niveaux d'accès */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4 hover:border-purple-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
                Sécurité & Équipe
              </span>
              <h3 className="font-black text-lg text-stone-950 mt-1">
                Gestion du Personnel & Droits
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Créez des profils individuels pour chaque coiffeuse ou nail artist. Protégez vos chiffres : définissez qui accède aux finances (Gérante), au planning uniquement (Praticienne) ou à la caisse (Réceptionniste) avec code PIN rapide.
            </p>
            <div className="pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-bold text-purple-900">
              <span>✓ Rôles Niveaux 1, 2, 3 & PIN tablette</span>
            </div>
          </div>

          {/* Pilier 2 : Gestion des Stocks */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4 hover:border-pink-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-700 flex items-center justify-center border border-pink-100">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-pink-700 block">
                Anti-Gaspillage & Vente
              </span>
              <h3 className="font-black text-lg text-stone-950 mt-1">
                Suivi des Stocks & Inventaire
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Ne soyez plus jamais prise de court un samedi matin. Suivez vos consommables pro (mèches, perruques, vernis, gels) avec alertes de seuil critique, et vendez vos produits de beauté directement au comptoir en caisse POS.
            </p>
            <div className="pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-bold text-pink-900">
              <span>✓ Alertes de rupture & déstockage caisse</span>
            </div>
          </div>

          {/* Pilier 3 : Programme de Fidélité */}
          <div className="bg-white p-6 sm:p-7 rounded-3xl border border-stone-200/90 shadow-2xs space-y-4 hover:border-amber-300 transition-all">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-100">
              <Crown className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
                Rétention & Chiffre d'Affaires
              </span>
              <h3 className="font-black text-lg text-stone-950 mt-1">
                Programme de Fidélité Automatique
              </h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Multipliez vos réservations récurrentes : vos clientes cumulent automatiquement des points à chaque prestation payée. Elles peuvent échanger leurs points contre des réductions en espèces lors de leur passage au salon.
            </p>
            <div className="pt-3 border-t border-stone-100 flex items-center gap-2 text-[11px] font-bold text-amber-900">
              <span>✓ Statuts VIP & Remises immédiates</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. SIMULATEUR DE RENTABILITÉ ================= */}
      <section id="simulateur" className="py-14 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto border-t border-stone-200/70 text-center">
        
        <span className="text-xs font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
          Calculateur
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-stone-950 mt-3 tracking-tight">
          Ce que les lapins vous coûtent chaque mois
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-8 bg-white p-6 sm:p-8 rounded-3xl border border-stone-200/90 shadow-sm text-left">
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center text-xs font-bold text-stone-700 mb-2">
                <span>Clientes reçues par mois :</span>
                <span className="font-black text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-200">
                  {monthlyClients} clientes
                </span>
              </div>
              <input
                type="range"
                min="20"
                max="200"
                step="5"
                value={monthlyClients}
                onChange={(e) => setMonthlyClients(Number(e.target.value))}
                className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs font-bold text-stone-700 mb-2">
                <span>Prix moyen par prestation :</span>
                <span className="font-black text-pink-700 bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-200">
                  {formatFCFA(avgPrice)}
                </span>
              </div>
              <input
                type="range"
                min="5000"
                max="40000"
                step="1000"
                value={avgPrice}
                onChange={(e) => setAvgPrice(Number(e.target.value))}
                className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-600"
              />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-br from-stone-50 to-pink-50/40 border border-stone-200 space-y-4">
            <div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                Perte mensuelle sans acompte (15% de lapins) :
              </span>
              <span className="text-2xl sm:text-3xl font-black text-rose-600 block mt-0.5">
                - {formatFCFA(estimatedLostMonthly)} / mois
              </span>
            </div>

            <div className="pt-3 border-t border-stone-200">
              <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
                Revenus sécurisés grâce à Appointfy :
              </span>
              <span className="text-2xl sm:text-3xl font-black text-emerald-600 block mt-0.5">
                + {formatFCFA(protectedYearly)} / an
              </span>
              <p className="text-xs text-stone-500 font-semibold mt-1">
                ✓ L'abonnement de 9 900 F est rentabilisé dès le premier rendez-vous honoré.
              </p>
            </div>
          </div>

        </div>

      </section>

      {/* ================= 7. TARIFICATION CLAIRE ================= */}
      <section id="tarifs" className="py-14 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto border-t border-stone-200/70 text-center">
        
        <span className="text-xs font-black uppercase tracking-wider text-pink-700 bg-pink-50 px-3 py-1 rounded-full border border-pink-200">
          Offre Pro Tout Compris
        </span>
        <h2 className="text-2xl sm:text-4xl font-black text-stone-950 mt-3 tracking-tight">
          Un tarif simple, sans frais cachés
        </h2>

        <div className="mt-8 bg-white rounded-3xl p-8 border-2 border-pink-300 shadow-lg text-center space-y-5">
          <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-black border border-emerald-200">
            14 JOURS D'ESSAI GRATUIT • SANS CARTE BANCAIRE
          </div>

          <div className="flex items-baseline justify-center gap-1.5">
            <span className="text-4xl sm:text-5xl font-black text-stone-950">9 900</span>
            <span className="text-stone-500 text-sm font-bold">FCFA / mois</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left text-xs text-stone-700 max-w-md mx-auto pt-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
              <span>Site web de réservation en bio</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
              <span>Acomptes Wave automatiques</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
              <span>Planning mobile avec alertes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 stroke-[3] shrink-0" />
              <span>Fiches clientes & historique</span>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="button"
              onClick={handleOpenRegister}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-black text-sm shadow-md shadow-pink-500/25 transition-all cursor-pointer inline-flex items-center justify-center gap-2"
            >
              <span>Créer mon espace pro gratuit</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </section>

      {/* ================= 8. FAQ & QUESTIONS COURANTES ================= */}
      <section id="faq" className="py-14 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto border-t border-stone-200/70 text-center">
        
        <h2 className="text-2xl sm:text-3xl font-black text-stone-950 mb-8">
          Questions Fréquentes
        </h2>

        <div className="space-y-3.5 text-left">
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-extrabold text-sm text-stone-900">
              Je travaille seule ou à domicile, est-ce fait pour moi ?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Oui, à 100% ! Plus de la moitié de nos utilisatrices sont des praticiennes indépendantes. Appointfy vous évite de devoir répondre aux messages pendant vos prestations.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-extrabold text-sm text-stone-900">
              Comment mes clientes versent-elles l'acompte ?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Elles utilisent simplement leur compte Wave habituel sur leur téléphone. L'argent arrive directement sur votre compte.
            </p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-1.5">
            <h4 className="font-extrabold text-sm text-stone-900">
              Ai-je besoin d'un ordinateur ?
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              Non ! Tout est conçu pour fonctionner avec fluidité sur votre smartphone (iPhone ou Android).
            </p>
          </div>
        </div>

      </section>

      {/* ================= 9. FOOTER ================= */}
      <footer className="border-t border-stone-200/80 py-8 px-4 text-center text-xs text-stone-500 bg-white">
        <p>© 2026 Appointfy — Le logiciel tout-en-un des professionnelles de la beauté • Dakar, Abidjan & partout en Afrique</p>
      </footer>

    </div>
  );
};
