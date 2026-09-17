import React, { useState, useEffect, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
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
  DollarSign
} from 'lucide-react';

export const SuperAdminDashboard = () => {
  const { currentUser, setCurrentView, fetchAllSalons, adminManageSalon } = useBooking();
  
  const [salonsList, setSalonsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'active' | 'trial' | 'expired'
  const [actionLoading, setActionLoading] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [activeTab, setActiveTab] = useState('salons'); // 'salons' | 'stats' | 'broadcast'

  // Broadcast state
  const [broadcastText, setBroadcastText] = useState(() => {
    return localStorage.getItem('appointfy_global_broadcast') || '';
  });
  const [broadcastSaved, setBroadcastSaved] = useState(false);

  const loadSalons = async () => {
    setLoading(true);
    const data = await fetchAllSalons();
    setSalonsList(data);
    setLoading(false);
  };

  useEffect(() => {
    loadSalons();
  }, []);

  // Calcul des métriques globales SaaS
  const metrics = useMemo(() => {
    const total = salonsList.length;
    let active = 0;
    let trial = 0;
    let expired = 0;

    salonsList.forEach(s => {
      const isSubActive = s.subscription_status === 'active' || s.is_subscription_active === true;
      const trialEnds = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
      const isTrialValid = s.subscription_status === 'trial' && (trialEnds > Date.now() || !trialEnds);

      if (isSubActive) {
        active++;
      } else if (isTrialValid) {
        trial++;
      } else {
        expired++;
      }
    });

    const mrr = active * 9900;

    return { total, active, trial, expired, mrr };
  }, [salonsList]);

  // Salons filtrés
  const filteredSalons = useMemo(() => {
    return salonsList.filter(s => {
      const matchesSearch = 
        (s.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.owner_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.owner_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.phone || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.city || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      const isSubActive = s.subscription_status === 'active' || s.is_subscription_active === true;
      const trialEnds = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
      const isTrialValid = s.subscription_status === 'trial' && (trialEnds > Date.now() || !trialEnds);

      if (filterStatus === 'active') return isSubActive;
      if (filterStatus === 'trial') return isTrialValid && !isSubActive;
      if (filterStatus === 'expired') return !isSubActive && !isTrialValid;
      return true;
    });
  }, [salonsList, searchTerm, filterStatus]);

  // Actions Super-Admin
  const handleAction = async (salonId, action, days = 14) => {
    setActionLoading(salonId + '-' + action);
    setFeedbackMsg(null);

    const res = await adminManageSalon(salonId, action, days);
    if (res.success) {
      setFeedbackMsg({ type: 'success', text: res.message || 'Action exécutée avec succès.' });
      await loadSalons();
    } else {
      setFeedbackMsg({ type: 'error', text: res.error || "Erreur lors de l'exécution." });
    }
    setActionLoading(null);
  };

  const handleSaveBroadcast = () => {
    localStorage.setItem('appointfy_global_broadcast', broadcastText);
    setBroadcastSaved(true);
    setTimeout(() => setBroadcastSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      
      {/* ================= HEADER SUPÉRIEUR SUPER-ADMIN ================= */}
      <header className="border-b border-slate-800/80 bg-slate-900/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Tour de Contrôle SaaS
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  Super-Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilotage centralisé Appointfy • <span className="text-purple-300 font-medium">{currentUser?.email}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={loadSalons}
              disabled={loading}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer border border-slate-700"
              title="Actualiser la liste"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>

            <button
              type="button"
              onClick={() => setCurrentView('salon')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Mon Salon</span>
            </button>
          </div>

        </div>
      </header>

      {/* ================= CONTENU PRINCIPAL ================= */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">

        {/* FEEDBACK TOAST ALERT */}
        {feedbackMsg && (
          <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            feedbackMsg.type === 'success'
              ? 'bg-emerald-950/40 border-emerald-700/50 text-emerald-300'
              : 'bg-rose-950/40 border-rose-700/50 text-rose-300'
          }`}>
            <div className="flex items-center gap-2.5 text-sm font-semibold">
              {feedbackMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertTriangle className="w-5 h-5 text-rose-400" />}
              <span>{feedbackMsg.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMsg(null)}
              className="text-xs underline hover:opacity-80 cursor-pointer"
            >
              Fermer
            </button>
          </div>
        )}

        {/* ================= 1. LES CARTES KPIS SAAS ================= */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* MRR (Revenu Récurrent Mensuel) */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Revenu Mensuel (MRR)</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {formatFCFA(metrics.mrr)}
            </div>
            <p className="text-[11px] text-emerald-400/90 mt-2 font-medium flex items-center gap-1">
              <span>9 900 FCFA × {metrics.active} salons payants</span>
            </p>
          </div>

          {/* Salons Abonnés Actifs */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Salons Actifs (Payés)</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {metrics.active}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Abonnements Wave à jour
            </p>
          </div>

          {/* Salons en Période d'Essai */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Salons en Essai (Trial)</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight text-amber-300">
              {metrics.trial}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              Période découverte en cours
            </p>
          </div>

          {/* Total Inscrits */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 relative overflow-hidden shadow-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">
              <span>Total Salons Inscrits</span>
              <Building2 className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {metrics.total}
            </div>
            <p className="text-[11px] text-slate-400 mt-2">
              {metrics.expired} expirés / à relancer
            </p>
          </div>

        </section>

        {/* ================= 2. ONGLETS DE NAVIGATION ================= */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            type="button"
            onClick={() => setActiveTab('salons')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'salons'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Annuaire des Salons ({salonsList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'broadcast'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Megaphone className="w-4 h-4" />
            <span>Diffusion d'Annonces</span>
          </button>
        </div>

        {/* ================= VUE : ANNUAIRE DES SALONS ================= */}
        {activeTab === 'salons' && (
          <section className="space-y-4">
            
            {/* Barre de Recherche & Filtres rapides */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 p-4 rounded-3xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom de salon, gérant, téléphone Wave, ville..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0 overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setFilterStatus('all')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'all' ? 'bg-slate-800 text-white border border-slate-700' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Tous ({salonsList.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('active')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'active' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Actifs ({metrics.active})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('trial')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'trial' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  En Essai ({metrics.trial})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('expired')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                    filterStatus === 'expired' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Expirés ({metrics.expired})
                </button>
              </div>
            </div>

            {/* Tableau des Salons */}
            <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">Salon & Identité</th>
                      <th className="px-4 py-3.5">Gérant(e) & Contact</th>
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
                          <span>Chargement des salons en direct...</span>
                        </td>
                      </tr>
                    ) : filteredSalons.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-slate-500">
                          Aucun salon ne correspond à votre recherche.
                        </td>
                      </tr>
                    ) : (
                      filteredSalons.map((salonItem) => {
                        const isSubActive = salonItem.subscription_status === 'active' || salonItem.is_subscription_active === true;
                        const trialEnds = salonItem.trial_ends_at ? new Date(salonItem.trial_ends_at).getTime() : 0;
                        const isTrialValid = salonItem.subscription_status === 'trial' && (trialEnds > Date.now() || !trialEnds);
                        const daysLeft = trialEnds ? Math.max(0, Math.ceil((trialEnds - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

                        return (
                          <tr key={salonItem.id} className="hover:bg-slate-800/40 transition-colors">
                            
                            {/* Salon */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/60 flex items-center justify-center font-black text-purple-300 shrink-0">
                                  {salonItem.name ? salonItem.name.charAt(0).toUpperCase() : 'S'}
                                </div>
                                <div>
                                  <div className="font-extrabold text-white text-sm">
                                    {salonItem.name || 'Sans nom'}
                                  </div>
                                  <div className="text-[11px] text-slate-400 font-mono">
                                    /{salonItem.slug}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Contact */}
                            <td className="px-4 py-4">
                              <div className="font-bold text-slate-200">
                                {salonItem.owner_name || 'Non renseigné'}
                              </div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{salonItem.phone || salonItem.whatsapp || 'Pas de numéro'}</span>
                              </div>
                            </td>

                            {/* Ville */}
                            <td className="px-4 py-4 text-slate-300">
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                                <span>{salonItem.city || salonItem.address || 'Sénégal'}</span>
                              </div>
                            </td>

                            {/* Statut */}
                            <td className="px-4 py-4">
                              {isSubActive ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                                  <CheckCircle2 className="w-3 h-3" />
                                  Actif (Payé)
                                </span>
                              ) : isTrialValid ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                                  <Clock className="w-3 h-3" />
                                  Essai ({daysLeft}j)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-extrabold text-[10px] uppercase tracking-wider">
                                  <AlertTriangle className="w-3 h-3" />
                                  Expiré
                                </span>
                              )}
                            </td>

                            {/* Échéance */}
                            <td className="px-4 py-4 text-slate-400 text-[11px] font-mono">
                              {salonItem.trial_ends_at
                                ? new Date(salonItem.trial_ends_at).toLocaleDateString('fr-FR')
                                : '—'}
                            </td>

                            {/* Actions Super-Admin */}
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                
                                {/* 1. Prolonger Essai (+14 jours) */}
                                <button
                                  type="button"
                                  onClick={() => handleAction(salonItem.id, 'extend_trial', 14)}
                                  disabled={actionLoading === salonItem.id + '-extend_trial'}
                                  className="px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="Offrir +14 jours d'essai gratuit"
                                >
                                  <Gift className="w-3 h-3" />
                                  <span>+14j Essai</span>
                                </button>

                                {/* 2. Activer Abonnement 30 jours */}
                                <button
                                  type="button"
                                  onClick={() => handleAction(salonItem.id, 'activate', 30)}
                                  disabled={actionLoading === salonItem.id + '-activate'}
                                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 font-bold text-[11px] flex items-center gap-1 transition-all cursor-pointer"
                                  title="Valider 30 jours d'abonnement actif (ex: paiement Wave direct reçu)"
                                >
                                  <Zap className="w-3 h-3" />
                                  <span>Activer (30j)</span>
                                </button>

                                {/* 3. Voir le site public */}
                                <button
                                  type="button"
                                  onClick={() => window.open(`/?salon=${salonItem.slug}`, '_blank')}
                                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
                                  title="Ouvrir la page publique du salon"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
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

          </section>
        )}

        {/* ================= VUE : DIFFUSION D'ANNONCES (BROADCAST) ================= */}
        {activeTab === 'broadcast' && (
          <section className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 space-y-6 max-w-3xl">
            <div>
              <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider mb-1">
                <Megaphone className="w-4 h-4" />
                <span>Communication Plateforme</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Bandeau d'Annonce Globale
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Ce message apparaîtra en haut de l'écran sur le tableau de bord de toutes les gérantes d'Appointfy.
              </p>
            </div>

            <div className="space-y-3">
              <textarea
                rows={4}
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Exemple : 📢 NOUVEAUTÉ : La caisse tactile et la gestion des stocks sont en ligne ! Consultez l'onglet Stock pour commencer."
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 leading-relaxed resize-none"
              />

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">
                  Laissez vide pour désactiver le bandeau d'annonce.
                </span>

                <button
                  type="button"
                  onClick={handleSaveBroadcast}
                  className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-lg shadow-purple-600/30 transition-all cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{broadcastSaved ? 'Enregistré avec succès !' : 'Diffuser l\'annonce'}</span>
                </button>
              </div>
            </div>

            {/* Prévisualisation */}
            {broadcastText && (
              <div className="pt-4 border-t border-slate-800 space-y-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                  Aperçu en direct sur le dashboard des gérantes :
                </span>
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-900/40 via-pink-900/30 to-purple-900/40 border border-purple-500/30 text-purple-200 text-xs font-semibold flex items-center gap-2.5">
                  <Megaphone className="w-4 h-4 text-purple-400 shrink-0" />
                  <span>{broadcastText}</span>
                </div>
              </div>
            )}
          </section>
        )}

      </main>

    </div>
  );
};
