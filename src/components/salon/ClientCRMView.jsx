import React, { useState, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import {
  Users,
  Search,
  MessageSquare,
  Sparkles,
  Phone,
  Calendar,
  DollarSign,
  Heart,
  TrendingUp,
  UserCheck,
  UserX,
  ExternalLink,
  ChevronRight,
  Send,
  Star,
  Clock,
  Scissors,
  Plus,
  ArrowUpDown,
  History,
  CheckCircle2,
  FileText,
  BadgeAlert,
  UserPlus,
  Crown,
  Gift
} from 'lucide-react';
import { AddAppointmentModal } from './AddAppointmentModal';

export const ClientCRMView = () => {
  const { appointments, salon, getClientLoyalty } = useBooking();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // 'all' | 'loyal' | 'new' | 'at_risk'
  const [sortBy, setSortBy] = useState('spent'); // 'spent' | 'appointments' | 'recent'

  // Modals state
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null);
  const [selectedClientForWhatsApp, setSelectedClientForWhatsApp] = useState(null);
  const [selectedWhatsAppTemplate, setSelectedWhatsAppTemplate] = useState('loyalty');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [prefilledClient, setPrefilledClient] = useState({ name: '', phone: '' });

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const salonBookingUrl = `${origin}/?salon=${salon.slug || 'mon-salon'}`;

  // ================= 1. AGGRÉGATION DE TOUS LES CLIENTS =================
  const clientList = useMemo(() => {
    const map = new Map();

    appointments.forEach(app => {
      if (app.isBlocked || app.serviceId === 'blocked') return;
      if (app.status === 'pending' || app.status === 'expired' || app.status === 'cancelled') return;

      const phoneKey = (app.clientPhone || '').replace(/\D/g, '');
      if (!phoneKey && !app.clientName) return;

      const key = phoneKey || app.clientName.toLowerCase().trim();

      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: app.clientName || 'Cliente sans nom',
          phone: app.clientPhone || '',
          cleanPhone: phoneKey,
          appointmentsCount: 0,
          completedCount: 0,
          noShowCount: 0,
          confirmedCount: 0,
          totalSpent: 0,
          totalDeposits: 0,
          lastVisitDate: app.dateFormatted || app.dateStr || app.date || '',
          lastServiceName: app.serviceName || '',
          lastPractitioner: app.practitionerName || '',
          history: [],
          notesList: []
        });
      }

      const client = map.get(key);
      client.appointmentsCount += 1;

      const deposit = Number(app.depositPaid) || 0;
      const price = Number(app.price) || 0;
      const balance = Number(app.remainingBalance) || Math.max(0, price - deposit);

      client.totalDeposits += deposit;

      if (app.status === 'completed') {
        client.completedCount += 1;
        client.totalSpent += price;
      } else if (app.status === 'no_show') {
        client.noShowCount += 1;
        client.totalSpent += deposit; // acompte conservé
      } else if (app.status === 'confirmed') {
        client.confirmedCount += 1;
        client.totalSpent += deposit;
      }

      if (app.notes) {
        client.notesList.push(app.notes);
      }

      // Ajouter à l'historique chronologique
      client.history.push({
        id: app.id,
        date: app.dateStr || app.date,
        dateFormatted: app.dateFormatted || app.date,
        timeSlot: app.timeSlot,
        serviceName: app.serviceName,
        practitionerName: app.practitionerName,
        price: price,
        depositPaid: deposit,
        remainingBalance: balance,
        status: app.status,
        paymentMethod: app.paymentMethod,
        notes: app.notes
      });
    });

    // Tri de l'historique interne de chaque client par date la plus récente
    map.forEach(c => {
      c.history.sort((a, b) => {
        const dateA = String(a.date || '');
        const dateB = String(b.date || '');
        return dateB.localeCompare(dateA);
      });
      if (c.history[0]) {
        c.lastVisitDate = c.history[0].dateFormatted || c.history[0].date;
        c.lastServiceName = c.history[0].serviceName;
        c.lastPractitioner = c.history[0].practitionerName;
      }
      const loyalty = getClientLoyalty ? getClientLoyalty(c.phone) : { pointsBalance: 0 };
      c.loyaltyPoints = loyalty.pointsBalance || 0;
      c.vipTier = c.loyaltyPoints >= 300 ? 'Or' : c.loyaltyPoints >= 100 ? 'Argent' : 'Bronze';
    });

    return Array.from(map.values());
  }, [appointments, getClientLoyalty]);

  // ================= 2. FILTRES ET TRI =================
  const filteredClients = useMemo(() => {
    let result = clientList.filter(client => {
      const matchSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);

      if (!matchSearch) return false;

      if (filterType === 'vip') return (client.loyaltyPoints || 0) > 0;
      if (filterType === 'loyal') return client.appointmentsCount >= 2;
      if (filterType === 'new') return client.appointmentsCount === 1;
      if (filterType === 'at_risk') return client.noShowCount > 0;

      return true;
    });

    // Tri
    result.sort((a, b) => {
      if (sortBy === 'spent') return b.totalSpent - a.totalSpent;
      if (sortBy === 'appointments') return b.appointmentsCount - a.appointmentsCount;
      if (sortBy === 'recent') {
        const dateA = String(a.lastVisitDate || '');
        const dateB = String(b.lastVisitDate || '');
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    return result;
  }, [clientList, searchTerm, filterType, sortBy]);

  // Statistiques globales
  const totalUniqueClients = clientList.length;
  const loyalClients = clientList.filter(c => c.appointmentsCount >= 2).length;
  const newClients = clientList.filter(c => c.appointmentsCount === 1).length;
  const noShowClients = clientList.filter(c => c.noShowCount > 0).length;
  const totalClientRevenue = clientList.reduce((acc, c) => acc + c.totalSpent, 0);
  const retentionRate = totalUniqueClients > 0
    ? Math.round((loyalClients / totalUniqueClients) * 100)
    : 0;

  // Ouvrir formulaire RDV pré-rempli
  const handleOpenAddBooking = (client) => {
    setPrefilledClient({
      name: client.name,
      phone: client.phone
    });
    setIsAddModalOpen(true);
  };

  // WhatsApp Messages
  const getWhatsAppMessageText = (client, type) => {
    if (!client) return '';
    if (type === 'reminder') {
      return `Bonjour ${client.name} ✨ C'est ${salon?.name || 'votre salon'}. Nous vous rappelons avec plaisir votre prochain rendez-vous pour votre prestation (${client.lastServiceName || 'soin'}). Nous avons hâte de vous chouchouter ! À très vite.`;
    }
    if (type === 'thank_you') {
      return `Bonjour ${client.name} 💖 Toute l'équipe de ${salon?.name || 'notre salon'} vous remercie pour votre passage ! Nous espérons que vous adorez votre résultat. N'hésitez pas à nous laisser un petit avis ou à nous envoyer une photo !`;
    }
    if (type === 'loyalty') {
      const pts = client.loyaltyPoints || 0;
      const discount = pts * (salon?.loyalty_point_value_fcfa || 10);
      if (pts > 0) {
        return `Coucou ${client.name} ✨ Vous avez cumulé *${pts} points fidélité* (soit *${formatFCFA(discount)}* de remise immédiate) chez ${salon?.name || 'notre salon'} ! Venez en profiter ce mois-ci pour vous faire chouchouter. Réservez votre créneau garanti ici : ${salonBookingUrl}`;
      }
      return `Coucou ${client.name} 🌟 Vous nous manquez chez ${salon?.name || 'notre salon'} ! Votre coiffure a-t-elle besoin d'un rafraîchissement ? Réservez votre créneau en 1 clic directement ici : ${salonBookingUrl} . À très bientôt !`;
    }
    return '';
  };

  const handleSendWhatsApp = (client, type) => {
    const text = getWhatsAppMessageText(client, type);
    const clean = client?.cleanPhone;
    if (!clean) return;
    window.open(`https://wa.me/${clean}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">

      {/* ================= 1. EN-TÊTE CRM & ACTIONS ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-pink-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-2xl bg-pink-100 text-pink-700 font-bold text-sm shadow-2xs">
              👥 Fichier Clients (CRM)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Répertoire & Fidélité
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Historique de chaque cliente, analyse de fidélité, relances WhatsApp et prise de rendez-vous en 1 clic.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setPrefilledClient({ name: '', phone: '' });
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-pink-600/20 cursor-pointer self-start lg:self-auto"
        >
          <UserPlus className="w-4 h-4 stroke-[2.5]" />
          <span>+ Inscrire une Cliente</span>
        </button>
      </div>

      {/* ================= 2. LES 4 INDICATEURS CLÉS DE CLIENTÈLE ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Clientes */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-pink-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-pink-600 block">
              Total Clientes
            </span>
            <Users className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950">
            {totalUniqueClients}
          </div>
          <p className="text-[11px] text-slate-500">
            Dans votre répertoire
          </p>
        </div>

        {/* Clientes Fidèles */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-emerald-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
              ⭐ Clientes Fidèles
            </span>
            <Star className="w-4 h-4 text-emerald-600 fill-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-700">
            {loyalClients}
          </div>
          <p className="text-[11px] text-slate-500">
            Venues 2 fois ou plus
          </p>
        </div>

        {/* Taux de Rétention */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-purple-100 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-purple-700 block">
              Taux de Fidélité
            </span>
            <Heart className="w-4 h-4 text-purple-500 fill-purple-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-900">
            {retentionRate}%
          </div>
          <p className="text-[11px] text-slate-500">
            Clientes récurrentes
          </p>
        </div>

        {/* Chiffre d'Affaires Encaissé */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
              C.A. Répertoire
            </span>
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
            {formatFCFA(totalClientRevenue)}
          </div>
          <p className="text-[11px] text-slate-500">
            Total généré par ce fichier
          </p>
        </div>

      </div>

      {/* ================= 3. BARRE DE FILTRAGE, RECHERCHE & TRI ================= */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-pink-100 shadow-xs space-y-3.5">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Recherche rapide */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Rechercher par nom ou numéro WhatsApp..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 text-xs font-semibold focus:outline-pink-600 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sélecteur de Tri */}
          <div className="flex items-center gap-2 self-end md:self-center shrink-0">
            <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Trier par :</span>
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800 cursor-pointer focus:outline-pink-600"
            >
              <option value="spent">Plus gros achats (C.A.)</option>
              <option value="appointments">Nombre de visites</option>
              <option value="recent">Visite la plus récente</option>
            </select>
          </div>

        </div>

        {/* Onglets de filtrage rapide */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-slate-100 pt-3">
          {[
            { id: 'all', label: `Toutes (${totalUniqueClients})` },
            { id: 'vip', label: `👑 VIP & Points (${clientList.filter(c => (c.loyaltyPoints || 0) > 0).length})` },
            { id: 'loyal', label: `⭐ Fidèles (${loyalClients})` },
            { id: 'new', label: `✨ Nouvelles (${newClients})` },
            { id: 'at_risk', label: `⚠️ Historique Lapin (${noShowClients})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

      </div>

      {/* ================= 4. LISTE DES FICHES CLIENTES (SANS SUPERPOSITION) ================= */}
      {filteredClients.length === 0 ? (
        <div className="bg-white py-12 px-4 rounded-3xl border border-pink-100 text-center space-y-2 shadow-xs">
          <Users className="w-12 h-12 text-slate-300 mx-auto" />
          <h4 className="text-base font-black text-slate-900">Aucune cliente trouvée</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Les clientes qui réservent sur votre site ou que vous inscrivez au salon apparaissent automatiquement ici.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredClients.map((client) => {
            const isLoyal = client.appointmentsCount >= 2;
            const hasNoShow = client.noShowCount > 0;
            const isNew = client.appointmentsCount === 1;

            return (
              <div
                key={client.id}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 hover:border-pink-300 transition-all shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                {/* Infos principales de la cliente */}
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  
                  {/* Avatar avec initiales */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black text-sm flex items-center justify-center shadow-xs shrink-0 uppercase tracking-wider">
                    {client.name.substring(0, 2)}
                  </div>

                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-sm sm:text-base text-slate-950 truncate">
                        {client.name}
                      </h4>

                      {isLoyal && (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black flex items-center gap-1 border border-emerald-200">
                          <Star className="w-3 h-3 fill-emerald-600 text-emerald-600" />
                          <span>Fidèle ({client.appointmentsCount} RDV)</span>
                        </span>
                      )}

                      {isNew && (
                        <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 text-[10px] font-black border border-sky-200">
                          1ère visite
                        </span>
                      )}

                      {hasNoShow && (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200 flex items-center gap-1">
                          <BadgeAlert className="w-3 h-3 text-rose-600" />
                          <span>{client.noShowCount} lapin(s)</span>
                        </span>
                      )}

                      {(client.loyaltyPoints || 0) > 0 && (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-900 text-[10px] font-black border border-amber-300 flex items-center gap-1 shadow-2xs">
                          <Crown className="w-3 h-3 text-amber-600" />
                          <span>VIP {client.vipTier} ({client.loyaltyPoints} pts)</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      {client.phone && (
                        <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{client.phone}</span>
                        </span>
                      )}
                      <span>•</span>
                      <span>Dernier soin : <strong className="text-slate-800">{client.lastServiceName || 'Prestation'}</strong></span>
                      {client.lastPractitioner && (
                        <>
                          <span>•</span>
                          <span className="text-pink-600 font-bold bg-pink-50 px-2 py-0.5 rounded-lg border border-pink-100">
                            Par {client.lastPractitioner}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bilan financier & Barre d'actions tactiles (Zéro superposition) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  
                  {/* Total dépensé */}
                  <div className="text-left sm:text-right space-y-0.5 pr-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                      Total Réceptionné
                    </span>
                    <span className="text-sm sm:text-base font-black text-slate-950 font-mono">
                      {formatFCFA(client.totalSpent)}
                    </span>
                  </div>

                  {/* Boutons d'actions */}
                  <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    
                    {/* Bouton WhatsApp */}
                    {client.cleanPhone && (
                      <button
                        type="button"
                        onClick={() => setSelectedClientForWhatsApp(client)}
                        className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        title="Envoyer un message WhatsApp pré-rempli"
                      >
                        <MessageSquare className="w-3.5 h-3.5 fill-white/20" />
                        <span>WhatsApp</span>
                      </button>
                    )}

                    {/* Bouton Fiche Historique */}
                    <button
                      type="button"
                      onClick={() => setSelectedClientForDetails(client)}
                      className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Voir le dossier et l'historique complet"
                    >
                      <History className="w-3.5 h-3.5 text-slate-600" />
                      <span>Historique</span>
                    </button>

                    {/* Bouton Reprogrammer RDV */}
                    <button
                      type="button"
                      onClick={() => handleOpenAddBooking(client)}
                      className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 text-xs font-black flex items-center gap-1 transition-all cursor-pointer"
                      title="Prendre un nouveau rendez-vous pour cette cliente"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span>RDV</span>
                    </button>

                  </div>

                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* ================= MODAL 1 : FICHE CLIENTE COMPLÈTE & HISTORIQUE ================= */}
      {selectedClientForDetails && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto p-5 sm:p-7 space-y-5 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header Fiche */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white font-black text-lg flex items-center justify-center uppercase shadow-sm">
                  {selectedClientForDetails.name.substring(0, 2)}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-slate-950 text-lg">
                      {selectedClientForDetails.name}
                    </h3>
                    {selectedClientForDetails.appointmentsCount >= 2 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black">
                        ⭐ Cliente Fidèle
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    📱 {selectedClientForDetails.phone || 'Numéro non renseigné'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedClientForDetails(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Statistiques clés de la cliente */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-pink-50 border border-pink-100 text-center">
                <span className="text-[10px] font-black uppercase text-pink-700 block">Total Visites</span>
                <span className="text-xl font-black text-pink-900">{selectedClientForDetails.appointmentsCount}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-center">
                <span className="text-[10px] font-black uppercase text-emerald-700 block">Total Dépensé</span>
                <span className="text-lg sm:text-xl font-black text-emerald-900">{formatFCFA(selectedClientForDetails.totalSpent)}</span>
              </div>
              <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-100 text-center">
                <span className="text-[10px] font-black uppercase text-purple-700 block">Acomptes Wave</span>
                <span className="text-lg sm:text-xl font-black text-purple-900">{formatFCFA(selectedClientForDetails.totalDeposits)}</span>
              </div>
            </div>

            {/* Historique chronologique complet */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                <History className="w-4 h-4 text-pink-600" />
                <span>Historique des prestations & rendez-vous ({selectedClientForDetails.history.length})</span>
              </h4>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {selectedClientForDetails.history.map((h, i) => {
                  const isDone = h.status === 'completed';
                  const isLapin = h.status === 'no_show';
                  return (
                    <div
                      key={h.id || i}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                        isDone
                          ? 'bg-emerald-50/40 border-emerald-200'
                          : isLapin
                          ? 'bg-rose-50/40 border-rose-200'
                          : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-slate-900">{h.date} à {h.timeSlot}</span>
                          {isDone && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                              ✓ Honoré & Payé
                            </span>
                          )}
                          {isLapin && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800">
                              Lapin (Acompte gardé)
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-slate-800">
                          ✂️ {h.serviceName} {h.practitionerName ? `(avec ${h.practitionerName})` : ''}
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="font-black text-slate-900 block font-mono">{formatFCFA(h.price)}</span>
                        <span className="text-[10px] text-slate-500">
                          Acompte : +{formatFCFA(h.depositPaid)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Boutons d'actions rapides du dossier */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 flex-wrap">
              {selectedClientForDetails.cleanPhone && (
                <button
                  type="button"
                  onClick={() => {
                    const c = selectedClientForDetails;
                    setSelectedClientForDetails(null);
                    setSelectedClientForWhatsApp(c);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  <MessageSquare className="w-4 h-4 fill-white/20" />
                  <span>Envoyer un message WhatsApp</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  const c = selectedClientForDetails;
                  setSelectedClientForDetails(null);
                  handleOpenAddBooking(c);
                }}
                className="px-4 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-black flex items-center gap-2 cursor-pointer shadow-xs"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Prendre un nouveau RDV</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 2 : MESSAGERIE WHATSAPP 1-CLIC ================= */}
      {selectedClientForWhatsApp && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  💬 Relance WhatsApp 1-Clic
                </h3>
                <p className="text-xs text-slate-500">
                  Destinataire : <strong>{selectedClientForWhatsApp.name}</strong> ({selectedClientForWhatsApp.phone})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedClientForWhatsApp(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Choix du modèle */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Sélectionnez le message personnalisé :
              </label>

              {[
                { id: 'loyalty', label: '🌟 Relance Fidélité (Vous nous manquez)', desc: 'Invite la cliente à reprendre RDV avec le lien du salon.' },
                { id: 'thank_you', label: '💖 Remerciement après visite', desc: 'Message de remerciement pour entretenir la relation.' },
                { id: 'reminder', label: '📅 Rappel de prochain rendez-vous', desc: 'Rappelle la prestation et l\'heure de son RDV.' }
              ].map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setSelectedWhatsAppTemplate(tpl.id)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedWhatsAppTemplate === tpl.id
                      ? 'border-[#25D366] bg-[#25D366]/5 shadow-xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold text-slate-900 block">{tpl.label}</span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">{tpl.desc}</span>
                </button>
              ))}
            </div>

            {/* Aperçu du message */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed italic">
              "{getWhatsAppMessageText(selectedClientForWhatsApp, selectedWhatsAppTemplate)}"
            </div>

            {/* Bouton d'envoi */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedClientForWhatsApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSendWhatsApp(selectedClientForWhatsApp, selectedWhatsAppTemplate);
                  setSelectedClientForWhatsApp(null);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Ouvrir dans WhatsApp</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL 3 : PLANIFICATION DIRECTE D'UN RDV ================= */}
      <AddAppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        defaultClientName={prefilledClient.name}
        defaultClientPhone={prefilledClient.phone}
      />

    </div>
  );
};
