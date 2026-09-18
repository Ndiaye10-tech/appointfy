import React, { useState, useEffect, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { CountryFlag } from '../common/CountryFlag';
import {
  ShieldCheck,
  Building2,
  Users,
  TrendingUp,
  CreditCard,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ExternalLink,
  Plus,
  RefreshCw,
  Gift,
  Zap,
  Ban,
  Phone,
  MapPin,
  Sparkles,
  ArrowLeft,
  Megaphone,
  Filter,
  DollarSign,
  Calendar,
  Layers,
  Copy,
  Check,
  Database,
  Globe,
  Radio,
  Trash2,
  Activity,
  Terminal
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const {
    currentUser,
    setCurrentView,
    fetchAllSalons,
    adminManageSalon,
    fetchSuperAdminStats,
    fetchSubscriptionPayments,
    fetchPlatformAppointments,
    saveGlobalAnnouncement,
    globalAnnouncement,
    verifyTransactionWithAPI
  } = useBooking();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'salons' | 'payments' | 'appointments' | 'tools'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [copiedRef, setCopiedRef] = useState(null);

  // Données Supabase
  const [stats, setStats] = useState({
    total_salons: 0,
    active_subscribers: 0,
    trial_salons: 0,
    expired_salons: 0,
    salons_sn: 0,
    salons_ci: 0,
    mrr_fcfa: 0,
    total_saas_revenue: 0,
    total_appointments: 0,
    appointments_today: 0,
    total_deposits_secured: 0
  });
  const [salonsList, setSalonsList] = useState([]);
  const [paymentsList, setPaymentsList] = useState([]);
  const [appointmentsList, setAppointmentsList] = useState([]);

  // Filtres Salons
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'trial' | 'expired'
  const [filterCountry, setFilterCountry] = useState('all'); // 'all' | 'SN' | 'CI'

  // Filtres Paiements & Réservations
  const [paymentSearch, setPaymentSearch] = useState('');
  const [apptCountryFilter, setApptCountryFilter] = useState('all');

  // Débogueur de Transaction
  const [lookupRef, setLookupRef] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);

  // Annonce Plateforme Supabase
  const [announcementText, setAnnouncementText] = useState(globalAnnouncement || '');
  const [announcementActive, setAnnouncementActive] = useState(Boolean(globalAnnouncement));
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    setAnnouncementText(globalAnnouncement || '');
    setAnnouncementActive(Boolean(globalAnnouncement));
  }, [globalAnnouncement]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [statsData, salonsData, paymentsData, apptsData] = await Promise.all([
        fetchSuperAdminStats(),
        fetchAllSalons(),
        fetchSubscriptionPayments(),
        fetchPlatformAppointments(100)
      ]);

      if (statsData) setStats(statsData);
      if (salonsData) setSalonsList(salonsData);
      if (paymentsData) setPaymentsList(paymentsData);
      if (apptsData) setAppointmentsList(apptsData);
    } catch (err) {
      console.error('Erreur chargement données Super-Admin:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedRef(text);
    setTimeout(() => setCopiedRef(null), 2000);
  };

  // Salons filtrés
  const filteredSalons = useMemo(() => {
    return salonsList.filter(s => {
      const matchesSearch =
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.slug || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const isSubActive = s.subscription_status === 'active' && s.is_subscription_active !== false;
      const trialEnds = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
      const isTrialValid = (s.subscription_status === 'trial' || !s.subscription_status) && (trialEnds > Date.now() || !trialEnds);
      const isExpired = !isSubActive && !isTrialValid;

      if (filterStatus === 'active' && !isSubActive) return false;
      if (filterStatus === 'trial' && !isTrialValid) return false;
      if (filterStatus === 'expired' && !isExpired) return false;

      const salonCountry = (s.country || 'SN').toUpperCase();
      if (filterCountry === 'SN' && salonCountry !== 'SN') return false;
      if (filterCountry === 'CI' && salonCountry !== 'CI') return false;

      return true;
    });
  }, [salonsList, searchTerm, filterStatus, filterCountry]);

  // Paiements filtrés
  const filteredPayments = useMemo(() => {
    return paymentsList.filter(p => {
      const term = paymentSearch.toLowerCase();
      return (
        (p.salon_name || '').toLowerCase().includes(term) ||
        (p.transaction_ref || '').toLowerCase().includes(term) ||
        (p.payer_phone || '').toLowerCase().includes(term) ||
        (p.payment_provider || '').toLowerCase().includes(term)
      );
    });
  }, [paymentsList, paymentSearch]);

  // Réservations filtrées
  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter(a => {
      if (apptCountryFilter === 'SN' && a.country !== 'SN') return false;
      if (apptCountryFilter === 'CI' && a.country !== 'CI') return false;
      return true;
    });
  }, [appointmentsList, apptCountryFilter]);

  // Actions administratives sur un salon
  const handleSalonAction = async (salonId, action, days = 14) => {
    setActionLoading(`${salonId}-${action}`);
    setFeedbackMsg(null);

    const res = await adminManageSalon(salonId, action, days);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Action exécutée avec succès.' });
      await loadAllData();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || "Erreur lors de l'exécution de l'action." });
    }
    setActionLoading(null);
  };

  // Sauvegarde annonce plateforme
  const handleSaveAnnouncement = async () => {
    setSavingAnnouncement(true);
    setFeedbackMsg(null);

    const res = await saveGlobalAnnouncement(announcementText, announcementActive);
    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: announcementActive ? 'Annonce diffusée en direct chez tous les salons !' : 'Annonce désactivée avec succès.'
      });
    } else {
      setFeedbackMsg({ type: 'error', text: "Impossible d'enregistrer l'annonce." });
    }
    setSavingAnnouncement(false);
  };

  // Débogueur de transaction
  const handleLookupTransaction = async (e) => {
    if (e) e.preventDefault();
    if (!lookupRef.trim()) return;

    setLookupLoading(true);
    setLookupResult(null);

    const res = await verifyTransactionWithAPI(lookupRef.trim());
    setLookupResult(res);
    setLookupLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-20">
      
      {/* ================= HEADER SUPÉRIEUR SUPER-ADMIN ================= */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-pink-600 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Tour de Contrôle SaaS
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Super-Admin Connecté
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-800/40">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Supabase Live Sync
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilotage centralisé Appointfy • <span className="text-purple-300 font-medium">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing || loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700 flex items-center gap-2 text-xs font-bold"
              title="Synchroniser avec Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-purple-400' : ''}`} />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('salon')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-md shadow-purple-600/30 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mon Salon</span>
            </button>
          </div>

        </div>
      </header>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">

        {/* FEEDBACK TOAST ALERT */}
        {feedbackMsg && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/50 border-emerald-700/50 text-emerald-200'
              : 'bg-rose-950/50 border-rose-700/50 text-rose-200'
          }`}>
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" /> : <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs underline hover:opacity-80 cursor-pointer shrink-0"
            >
              Fermer
            </button>
          </div>
        )}

        {/* ================= BARRE D'ONGLETS ================= */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'Ensemble & KPIs', icon: TrendingUp },
            { id: 'salons', label: `Salons Partenaires (${salonsList.length})`, icon: Building2 },
            { id: 'payments', label: `Paiements SaaS (${paymentsList.length})`, icon: CreditCard },
            { id: 'appointments', label: `Flux Réservations (${appointmentsList.length})`, icon: Calendar },
            { id: 'tools', label: 'Débogueur API & Annonces', icon: Terminal }
          ].map((tab) => {
            const TabIcon = tab.icon;
            const isSelected = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                  isSelected
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30'
                    : 'bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                <TabIcon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ================= ONGLET 1 : VUE D'ENSEMBLE & KPIS ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* 1. Grille des KPIs Principaux */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* MRR Récurrent */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>MRR (Revenu Mensuel)</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {formatFCFA(stats.mrr_fcfa || (stats.active_subscribers * 9900))}
                </div>
                <p className="text-[11px] text-emerald-400 mt-2 font-medium flex items-center gap-1">
                  <span>9 900 FCFA × {stats.active_subscribers} salons actifs</span>
                </p>
              </div>

              {/* Total Revenu SaaS Encaissé */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>Chiffre d'Affaires SaaS</span>
                  <CreditCard className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-purple-300 tracking-tight">
                  {formatFCFA(stats.total_saas_revenue)}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Total abonnements validés en base
                </p>
              </div>

              {/* Acomptes Sécurisés pour les Salons */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>Acomptes Sécurisés</span>
                  <ShieldCheck className="w-4 h-4 text-pink-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-pink-300 tracking-tight">
                  {formatFCFA(stats.total_deposits_secured)}
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  Anti-lapin encaissé par les salons
                </p>
              </div>

              {/* Total Réservations Plateforme */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
                  <span>Total Réservations</span>
                  <Calendar className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {stats.total_appointments}
                </div>
                <p className="text-[11px] text-amber-300 mt-2 font-medium">
                  {stats.appointments_today} aujourd'hui
                </p>
              </div>

            </div>

            {/* 2. Répartition Géographique (Sénégal & Côte d'Ivoire) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Carte Sénégal */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CountryFlag code="SN" className="w-8 h-6 rounded object-cover border border-slate-700" />
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white">
                        Sénégal (SN)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Opérateur : Wave Sénégal (100% Sans Frais)
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {stats.salons_sn} salons
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Passerelle active</span>
                    <strong className="text-cyan-300 text-sm mt-0.5 block">Wave Direct</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Abonnement SaaS</span>
                    <strong className="text-white text-sm mt-0.5 block">9 900 FCFA</strong>
                  </div>
                </div>
              </div>

              {/* Carte Côte d'Ivoire */}
              <div className="p-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-900/60 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CountryFlag code="CI" className="w-8 h-6 rounded object-cover border border-slate-700" />
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-white">
                        Côte d'Ivoire (CI)
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Opérateur : Paystack CI (Wave, OM, MTN, Moov, Carte)
                      </p>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {stats.salons_ci} salons
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 text-xs">
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Passerelle active</span>
                    <strong className="text-emerald-300 text-sm mt-0.5 block">Paystack Multi</strong>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Abonnement SaaS</span>
                    <strong className="text-white text-sm mt-0.5 block">9 900 FCFA</strong>
                  </div>
                </div>
              </div>

            </div>

            {/* 3. Répartition Statuts des Salons */}
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="font-extrabold text-sm text-white">
                État des Accès Salons ({stats.total_salons} au total)
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-800/40">
                  <span className="text-emerald-400 text-2xl font-black block">{stats.active_subscribers}</span>
                  <span className="text-slate-400 text-[11px] font-bold mt-1 block">Abonnés Payants</span>
                </div>
                <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-800/40">
                  <span className="text-amber-400 text-2xl font-black block">{stats.trial_salons}</span>
                  <span className="text-slate-400 text-[11px] font-bold mt-1 block">En Essai (Trial)</span>
                </div>
                <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-800/40">
                  <span className="text-rose-400 text-2xl font-black block">{stats.expired_salons}</span>
                  <span className="text-slate-400 text-[11px] font-bold mt-1 block">Expirés / Relance</span>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ================= ONGLET 2 : ANNUAIRE & GESTION DES SALONS ================= */}
        {activeTab === 'salons' && (
          <div className="space-y-4">
            
            {/* Barre de Recherche & Filtres */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom de salon, gérante, téléphone WhatsApp, ville..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Filtres Pays & Statut */}
              <div className="flex items-center gap-2 shrink-0 overflow-x-auto text-xs font-bold">
                {/* Pays */}
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                  <button
                    onClick={() => setFilterCountry('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterCountry === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    Tous
                  </button>
                  <button
                    onClick={() => setFilterCountry('SN')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${filterCountry === 'SN' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    🇸🇳 SN
                  </button>
                  <button
                    onClick={() => setFilterCountry('CI')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${filterCountry === 'CI' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    🇨🇮 CI
                  </button>
                </div>

                {/* Statut */}
                <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800">
                  <button
                    onClick={() => setFilterStatus('all')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterStatus === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                  >
                    Tous ({salonsList.length})
                  </button>
                  <button
                    onClick={() => setFilterStatus('active')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400'}`}
                  >
                    Actifs
                  </button>
                  <button
                    onClick={() => setFilterStatus('trial')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterStatus === 'trial' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'}`}
                  >
                    Essai
                  </button>
                  <button
                    onClick={() => setFilterStatus('expired')}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${filterStatus === 'expired' ? 'bg-rose-500/20 text-rose-300' : 'text-slate-400'}`}
                  >
                    Expirés
                  </button>
                </div>
              </div>
            </div>

            {/* Tableau des Salons */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Salon & Identité</th>
                      <th className="px-4 py-3.5">Gérante & Contact</th>
                      <th className="px-4 py-3.5">Localisation</th>
                      <th className="px-4 py-3.5">Abonnement</th>
                      <th className="px-4 py-3.5">Échéance</th>
                      <th className="px-5 py-3.5 text-right">Actions Super-Admin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-2" />
                          <span>Chargement des salons en direct depuis Supabase...</span>
                        </td>
                      </tr>
                    ) : filteredSalons.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-500">
                          Aucun salon ne correspond à votre filtre.
                        </td>
                      </tr>
                    ) : (
                      filteredSalons.map((s) => {
                        const isSubActive = s.subscription_status === 'active' && s.is_subscription_active !== false;
                        const trialEnds = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
                        const isTrialValid = (s.subscription_status === 'trial' || !s.subscription_status) && (trialEnds > Date.now() || !trialEnds);
                        const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - Date.now()) / (1000 * 60 * 60 * 24))) : 0;
                        const salonCountry = (s.country || 'SN').toUpperCase();

                        return (
                          <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                            
                            {/* Salon */}
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center font-black text-purple-300 shrink-0">
                                  {s.name ? s.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-extrabold text-white text-sm truncate">
                                    {s.name || 'Sans nom'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono truncate">
                                    /{s.slug}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-3.5">
                              <div className="font-bold text-slate-200">
                                {s.owner_name || 'Non renseigné'}
                              </div>
                              {s.phone && (
                                <a
                                  href={`https://wa.me/${s.phone.replace(/\D/g, '')}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5"
                                >
                                  <Phone className="w-3 h-3 text-emerald-500" />
                                  <span>{s.phone}</span>
                                </a>
                              )}
                            </td>

                            {/* Localisation */}
                            <td className="px-4 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <CountryFlag code={salonCountry} className="w-5 h-3.5 rounded object-cover shrink-0" />
                                <span className="text-slate-300 truncate">
                                  {s.city || s.address || (salonCountry === 'CI' ? 'Côte d\'Ivoire' : 'Sénégal')}
                                </span>
                              </div>
                            </td>

                            {/* Statut */}
                            <td className="px-4 py-3.5">
                              {isSubActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Abonné Payant
                                </span>
                              ) : isTrialValid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                                  <Clock className="w-3 h-3" />
                                  Essai Gratuit ({daysLeft}j)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                                  <AlertTriangle className="w-3 h-3" />
                                  Expiré (Restreint)
                                </span>
                              )}
                            </td>

                            {/* Échéance */}
                            <td className="px-4 py-3.5 text-slate-400 text-[11px] font-mono">
                              {s.subscription_expires_at
                                ? new Date(s.subscription_expires_at).toLocaleDateString('fr-FR')
                                : (s.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString('fr-FR') : '—')}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1.5 flex-wrap">
                                
                                {/* Prolonger Essai (+14j) */}
                                <button
                                  type="button"
                                  onClick={() => handleSalonAction(s.id, 'extend_trial', 14)}
                                  disabled={actionLoading === `${s.id}-extend_trial`}
                                  className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                                  title="Offrir +14 jours d'essai gratuit"
                                >
                                  <Gift className="w-3 h-3" />
                                  <span>+14j Essai</span>
                                </button>

                                {/* Activer 30 jours */}
                                <button
                                  type="button"
                                  onClick={() => handleSalonAction(s.id, 'activate', 30)}
                                  disabled={actionLoading === `${s.id}-activate`}
                                  className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                                  title="Valider 30 jours d'abonnement actif (9 900 FCFA)"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>+30j Activer</span>
                                </button>

                                {/* Suspendre si actif */}
                                {isSubActive && (
                                  <button
                                    type="button"
                                    onClick={() => handleSalonAction(s.id, 'suspend')}
                                    disabled={actionLoading === `${s.id}-suspend`}
                                    className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition cursor-pointer"
                                    title="Suspendre le salon"
                                  >
                                    <Ban className="w-3.5 h-3.5" />
                                  </button>
                                )}

                                {/* Voir Vitrine */}
                                <button
                                  type="button"
                                  onClick={() => window.open(`/?salon=${s.slug}`, '_blank')}
                                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer border border-slate-700"
                                  title="Ouvrir la vitrine cliente"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>

                                {/* Supprimer salon test */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`Supprimer définitivement le salon "${s.name}" et toutes ses réservations ?`)) {
                                      handleSalonAction(s.id, 'delete');
                                    }
                                  }}
                                  className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                                  title="Supprimer ce salon"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>

                              </div>
                            </td>

                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= ONGLET 3 : PAIEMENTS SAAS REÇUS ================= */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  placeholder="Rechercher par référence, salon, numéro de téléphone..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="text-xs text-slate-400 font-bold px-3">
                Total : <span className="text-purple-300 font-black">{filteredPayments.length} paiements</span>
              </div>
            </div>

            {/* Tableau des Paiements */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Date & Heure</th>
                      <th className="px-4 py-3.5">Salon Associé</th>
                      <th className="px-4 py-3.5">Montant</th>
                      <th className="px-4 py-3.5">Opérateur</th>
                      <th className="px-4 py-3.5">Référence Transaction</th>
                      <th className="px-4 py-3.5">Payeur</th>
                      <th className="px-5 py-3.5 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-2" />
                          <span>Chargement des transactions...</span>
                        </td>
                      </tr>
                    ) : filteredPayments.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-12 text-slate-500">
                          Aucun paiement d'abonnement enregistré pour le moment.
                        </td>
                      </tr>
                    ) : (
                      filteredPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-mono text-slate-400">
                            {p.created_at ? new Date(p.created_at).toLocaleString('fr-FR') : '—'}
                          </td>
                          <td className="px-4 py-3.5 font-bold text-white">
                            {p.salon_name || 'Salon partenaire'}
                          </td>
                          <td className="px-4 py-3.5 font-extrabold text-emerald-400">
                            {formatFCFA(p.amount || 9900)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {p.payment_provider || 'Wave'}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-slate-300">
                            <button
                              type="button"
                              onClick={() => copyToClipboard(p.transaction_ref)}
                              className="hover:text-purple-300 inline-flex items-center gap-1 cursor-pointer"
                              title="Copier la référence"
                            >
                              <span>{p.transaction_ref || '—'}</span>
                              {copiedRef === p.transaction_ref ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-500" />}
                            </button>
                          </td>
                          <td className="px-4 py-3.5 text-slate-400">
                            {p.payer_phone || '—'}
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-black text-[10px] uppercase">
                              <CheckCircle2 className="w-3 h-3" />
                              {p.status || 'Validé'}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= ONGLET 4 : FLUX GLOBAL DES RÉSERVATIONS ================= */}
        {activeTab === 'appointments' && (
          <div className="space-y-4">
            
            <div className="flex items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div className="text-xs text-slate-400 font-bold">
                Dernières réservations créées sur tous les salons partenaires ({filteredAppointments.length})
              </div>

              {/* Filtre Pays */}
              <div className="flex bg-slate-950 rounded-xl p-1 border border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setApptCountryFilter('all')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${apptCountryFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  Tous pays
                </button>
                <button
                  onClick={() => setApptCountryFilter('SN')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${apptCountryFilter === 'SN' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  🇸🇳 Sénégal
                </button>
                <button
                  onClick={() => setApptCountryFilter('CI')}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${apptCountryFilter === 'CI' ? 'bg-slate-800 text-white' : 'text-slate-400'}`}
                >
                  🇨🇮 Côte d'Ivoire
                </button>
              </div>
            </div>

            {/* Tableau Réservations */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Date & Heure RDV</th>
                      <th className="px-4 py-3.5">Pays</th>
                      <th className="px-4 py-3.5">Cliente</th>
                      <th className="px-4 py-3.5">Prestation</th>
                      <th className="px-4 py-3.5">Acompte Versé</th>
                      <th className="px-4 py-3.5">Solde Dû</th>
                      <th className="px-4 py-3.5">Moyen / Provider</th>
                      <th className="px-5 py-3.5 text-right">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {loading ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-500 mb-2" />
                          <span>Chargement des réservations...</span>
                        </td>
                      </tr>
                    ) : filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="text-center py-12 text-slate-500">
                          Aucune réservation enregistrée.
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((a) => (
                        <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="px-5 py-3.5 font-bold text-white">
                            <div>{a.date || a.date_formatted}</div>
                            <div className="text-[11px] text-purple-300 font-mono">{a.time_slot}</div>
                          </td>
                          <td className="px-4 py-3.5">
                            <CountryFlag code={a.country || 'SN'} className="w-5 h-3.5 rounded object-cover shadow-2xs" />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-slate-200">{a.client_name || 'Cliente'}</div>
                            <div className="text-[11px] text-slate-400">{a.client_phone}</div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-300">
                            {a.service_name || 'Prestation'}
                          </td>
                          <td className="px-4 py-3.5 font-extrabold text-pink-400">
                            {formatFCFA(a.deposit_paid || 0)}
                          </td>
                          <td className="px-4 py-3.5 font-medium text-slate-300">
                            {formatFCFA(a.remaining_balance || 0)}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                              {a.payment_provider || a.payment_method || 'Wave'}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              a.status === 'confirmed'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : (a.status === 'pending'
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border border-slate-700')
                            }`}>
                              {a.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ================= ONGLET 5 : DÉBOGUEUR API & ANNONCES SUPABASE ================= */}
        {activeTab === 'tools' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Outil 1 : Débogueur de Transaction en Direct */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-7 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Terminal className="w-4 h-4" />
                  <span>Résolution & Vérification API</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Débogueur de Transaction en Direct
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Entrez n'importe quelle référence GeniusPay, Wave, Paystack ou Supabase pour vérifier en temps réel son statut certifié.
                </p>
              </div>

              <form onSubmit={handleLookupTransaction} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={lookupRef}
                    onChange={(e) => setLookupRef(e.target.value)}
                    placeholder="ex: WV-1234567, GP-..., ADM-..."
                    className="w-full pl-4 pr-24 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <button
                    type="submit"
                    disabled={lookupLoading}
                    className="absolute right-2 top-2 bottom-2 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {lookupLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                    <span>Vérifier</span>
                  </button>
                </div>
              </form>

              {/* Résultat du Débogueur */}
              {lookupResult && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-slate-400">Type détecté :</span>
                    <span className="text-purple-300 font-bold uppercase">{lookupResult.type}</span>
                  </div>

                  {lookupResult.databaseRecord ? (
                    <div className="space-y-1 text-slate-300">
                      <div className="text-emerald-400 font-bold">✓ Trouvé dans Supabase :</div>
                      <div>ID : {lookupResult.databaseRecord.id}</div>
                      <div>Montant : {lookupResult.databaseRecord.amount || lookupResult.databaseRecord.deposit_paid} FCFA</div>
                      <div>Statut : {lookupResult.databaseRecord.status}</div>
                      <div>Créé le : {lookupResult.databaseRecord.created_at}</div>
                    </div>
                  ) : (
                    <div className="text-amber-400">
                      ⚠ Non présent dans la table locale appointments/subscription_payments
                    </div>
                  )}

                  {lookupResult.apiResult && (
                    <div className="pt-2 border-t border-slate-800 text-slate-400">
                      <div className="text-cyan-400 font-bold mb-1">Réponse API GeniusPay :</div>
                      <pre className="text-[11px] overflow-x-auto bg-slate-900 p-2.5 rounded-xl text-slate-300">
                        {JSON.stringify(lookupResult.apiResult, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Outil 2 : Annonce Plateforme Globale (100% connectée à Supabase) */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-7 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider mb-1">
                  <Megaphone className="w-4 h-4" />
                  <span>Diffusion Réelle Supabase</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  Bandeau d'Annonce Globale
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Enregistré dans la table <code className="text-purple-300">platform_announcements</code>. S'affiche instantanément en haut du dashboard de tous les salons connectés.
                </p>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={4}
                  value={announcementText}
                  onChange={(e) => setAnnouncementText(e.target.value)}
                  placeholder="Exemple : 📢 NOUVEAUTÉ : La caisse tactile et la synchronisation Wave multi-opérateurs sont en ligne !"
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
                />

                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={announcementActive}
                      onChange={(e) => setAnnouncementActive(e.target.checked)}
                      className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>Activer le bandeau sur les écrans gérantes</span>
                  </label>

                  <button
                    type="button"
                    onClick={handleSaveAnnouncement}
                    disabled={savingAnnouncement}
                    className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-black text-xs shadow-md shadow-purple-600/30 transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{savingAnnouncement ? 'Enregistrement...' : 'Diffuser en Direct 🚀'}</span>
                  </button>
                </div>

                {/* Aperçu en direct */}
                {announcementActive && announcementText && (
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                      Aperçu tel que vu par les gérantes :
                    </span>
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-black uppercase shrink-0">
                        📢 Annonce Plateforme
                      </span>
                      <span className="truncate">{announcementText}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
};
