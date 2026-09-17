import React, { useState, useMemo, useRef } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import {
  CreditCard,
  DollarSign,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Receipt,
  User,
  Scissors,
  Check,
  Search,
  Filter,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Share2,
  Printer,
  Smartphone,
  AlertCircle,
  Coins,
  Wallet,
  Package,
  Gift,
  Crown
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const PosCashRegister = () => {
  const {
    salon,
    services,
    appointments,
    checkoutAppointment,
    addManualAppointment,
    products,
    adjustProductStock,
    getClientLoyalty,
    awardLoyaltyPoints,
    redeemLoyaltyPoints
  } = useBooking();

  // Selected date (default today ISO)
  const todayISO = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedDateStr, setSelectedDateStr] = useState(todayISO);

  // Hidden date input ref for native picker
  const dateInputRef = useRef(null);

  // Status tab filter: 'all' | 'pending' | 'completed'
  const [statusTab, setStatusTab] = useState('all');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [selectedAppForPayment, setSelectedAppForPayment] = useState(null);
  const [checkoutMethod, setCheckoutMethod] = useState('Espèces'); // 'Espèces' | 'Wave'
  const [cashGiven, setCashGiven] = useState('');
  const [applyLoyaltyDiscount, setApplyLoyaltyDiscount] = useState(false);

  // Vente de produit en caisse
  const [showProductSale, setShowProductSale] = useState(false);
  const [productSaleData, setProductSaleData] = useState({
    productId: '',
    quantity: 1,
    clientName: '',
    clientPhone: '',
    method: 'Espèces'
  });

  const [showQuickWalkin, setShowQuickWalkin] = useState(false);
  const [walkinData, setWalkinData] = useState({
    clientName: '',
    serviceId: '',
    serviceName: '',
    practitionerName: '',
    amount: '',
    method: 'Espèces'
  });

  const [showZReport, setShowZReport] = useState(false);

  const team = Array.isArray(salon?.team) ? salon.team : [];

  // Formatted date string in French
  const formattedDate = useMemo(() => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('fr-FR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    } catch {
      return selectedDateStr;
    }
  }, [selectedDateStr]);

  const isSelectedToday = selectedDateStr === todayISO;

  // Day shift
  const handleShiftDay = (delta) => {
    try {
      const [y, m, d] = selectedDateStr.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      dateObj.setDate(dateObj.getDate() + delta);
      setSelectedDateStr(dateObj.toISOString().split('T')[0]);
    } catch (e) {
      console.warn(e);
    }
  };

  // Filter appointments for the selected date
  const dayAppointments = useMemo(() => {
    return appointments.filter(a => {
      if (a.isBlocked || a.status === 'blocked' || a.serviceId === 'blocked') return false;
      if (a.status === 'cancelled' || a.status === 'expired' || a.status === 'pending') return false;

      const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
      if (aDate !== selectedDateStr) return false;

      if (statusTab === 'pending') {
        if (a.status === 'completed' || Number(a.remainingBalance) <= 0) return false;
      } else if (statusTab === 'completed') {
        if (a.status !== 'completed' && Number(a.remainingBalance) > 0) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (a.clientName || '').toLowerCase().includes(q);
        const matchService = (a.serviceName || '').toLowerCase().includes(q);
        const matchPhone = (a.clientPhone || '').replace(/\D/g, '').includes(q.replace(/\D/g, ''));
        if (!matchName && !matchService && !matchPhone) return false;
      }

      return true;
    }).sort((a, b) => (a.timeSlot || '').localeCompare(b.timeSlot || ''));
  }, [appointments, selectedDateStr, todayISO, statusTab, searchQuery]);

  // Financial summary of the day
  const cashSummary = useMemo(() => {
    let grandTotal = 0;
    let totalEspeces = 0;
    let totalWave = 0;
    let totalRestantADevoir = 0;
    let nbReglés = 0;
    let totalTransactions = 0;

    const allForDate = appointments.filter(a => {
      if (a.isBlocked || a.status === 'blocked' || a.serviceId === 'blocked') return false;
      if (a.status === 'cancelled' || a.status === 'expired' || a.status === 'pending') return false;
      const aDate = a.dateStr || (a.date === "Aujourd'hui" ? todayISO : a.date);
      return aDate === selectedDateStr;
    });

    allForDate.forEach(a => {
      totalTransactions++;
      const dep = Number(a.depositPaid) || 0;
      const rem = Number(a.remainingBalance) || 0;
      const price = Number(a.price) || (dep + rem);

      // Si acompte payé par Wave
      if (dep > 0) {
        if (a.paymentMethod?.includes('Wave') || !a.paymentMethod) {
          totalWave += dep;
        } else {
          totalEspeces += dep;
        }
      }

      if (a.status === 'completed' || rem === 0) {
        nbReglés++;
        grandTotal += price;

        // Le solde restant réglé sur place
        if (rem === 0 && price > dep) {
          const balanceSettled = price - dep;
          // Vérifier méthode de règlement sur place
          const onSite = a.onSitePaymentMethod || a.paymentMethod || '';
          if (onSite.toLowerCase().includes('wave')) {
            totalWave += balanceSettled;
          } else {
            totalEspeces += balanceSettled;
          }
        }
      } else if (a.status !== 'no_show') {
        grandTotal += dep;
        totalRestantADevoir += rem;
      }
    });

    return {
      grandTotal,
      totalEspeces,
      totalWave,
      totalRestantADevoir,
      nbReglés,
      totalTransactions
    };
  }, [appointments, selectedDateStr, todayISO]);

  // Open checkout modal for an appointment
  const handleOpenCheckout = (app) => {
    setSelectedAppForPayment(app);
    setCheckoutMethod('Espèces');
    setCashGiven(String(app.remainingBalance || 0));
    setApplyLoyaltyDiscount(false);
  };

  // Fidélité cliente sur le rendez-vous sélectionné
  const selectedAppLoyalty = useMemo(() => {
    if (!selectedAppForPayment?.clientPhone) return null;
    return getClientLoyalty(selectedAppForPayment.clientPhone);
  }, [selectedAppForPayment, getClientLoyalty]);

  const maxRedeemablePoints = useMemo(() => {
    if (!selectedAppLoyalty?.pointsBalance) return 0;
    const pts = selectedAppLoyalty.pointsBalance;
    const baseRem = Number(selectedAppForPayment?.remainingBalance) || 0;
    const maxPtsForRem = Math.floor(baseRem / 10);
    return Math.min(pts, maxPtsForRem);
  }, [selectedAppLoyalty, selectedAppForPayment]);

  const loyaltyDiscountAmount = useMemo(() => {
    if (!applyLoyaltyDiscount || maxRedeemablePoints <= 0) return 0;
    return maxRedeemablePoints * (salon?.loyalty_point_value_fcfa || 10);
  }, [applyLoyaltyDiscount, maxRedeemablePoints, salon]);

  const effectiveRemainingBalance = useMemo(() => {
    if (!selectedAppForPayment) return 0;
    const rem = Number(selectedAppForPayment.remainingBalance) || 0;
    return Math.max(0, rem - loyaltyDiscountAmount);
  }, [selectedAppForPayment, loyaltyDiscountAmount]);

  // Confirm checkout
  const handleConfirmCheckout = async (e) => {
    e.preventDefault();
    if (!selectedAppForPayment) return;

    // 1. Déduire les points de fidélité si appliqués
    if (applyLoyaltyDiscount && maxRedeemablePoints > 0 && selectedAppForPayment.clientPhone) {
      await redeemLoyaltyPoints({
        phone: selectedAppForPayment.clientPhone,
        pointsToRedeem: maxRedeemablePoints,
        discountFCFA: loyaltyDiscountAmount
      });
    }

    // 2. Récompenser avec de nouveaux points pour le montant encaissé
    if (selectedAppForPayment.clientPhone && effectiveRemainingBalance > 0) {
      const earned = Math.floor(effectiveRemainingBalance / 100);
      if (earned > 0) {
        await awardLoyaltyPoints({
          phone: selectedAppForPayment.clientPhone,
          name: selectedAppForPayment.clientName,
          points: earned,
          reason: `Règlement solde ${selectedAppForPayment.serviceName}`
        });
      }
    }

    await checkoutAppointment(selectedAppForPayment.id, checkoutMethod);

    try {
      confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
    } catch (_) {}

    setSelectedAppForPayment(null);
    setCashGiven('');
    setApplyLoyaltyDiscount(false);
  };

  // Quick Walk-in sale submit
  const handleWalkinSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(walkinData.amount);
    if (!amount || amount <= 0) return;

    let finalServiceName = walkinData.serviceName.trim();
    if (!finalServiceName && walkinData.serviceId) {
      const found = services.find(s => s.id === walkinData.serviceId);
      finalServiceName = found ? found.name : 'Prestation au comptoir';
    }
    if (!finalServiceName) finalServiceName = 'Prestation directe au comptoir';

    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    await addManualAppointment({
      clientName: walkinData.clientName.trim() || 'Cliente de passage (Comptoir)',
      clientPhone: '',
      serviceId: walkinData.serviceId || 'walkin',
      serviceName: finalServiceName,
      practitionerName: walkinData.practitionerName || '',
      date: selectedDateStr === todayISO ? "Aujourd'hui" : selectedDateStr,
      dateStr: selectedDateStr,
      timeSlot: nowTime,
      duration: '45 min',
      price: amount,
      depositPaid: amount,
      remainingBalance: 0,
      paymentMethod: walkinData.method,
      status: 'completed'
    });

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    setShowQuickWalkin(false);
    setWalkinData({
      clientName: '',
      serviceId: '',
      serviceName: '',
      practitionerName: '',
      amount: '',
      method: 'Espèces'
    });
  };

  // Vente directe de Produit du stock
  const handleProductSaleSubmit = async (e) => {
    e.preventDefault();
    if (!productSaleData.productId) return;
    const prod = products.find(p => p.id === productSaleData.productId);
    if (!prod) return;

    const qty = Math.max(1, Number(productSaleData.quantity) || 1);
    const totalAmount = prod.price * qty;
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    // 1. Décrémenter le stock
    await adjustProductStock(prod.id, -qty);

    // 2. Enregistrer l'encaissement
    await addManualAppointment({
      clientName: productSaleData.clientName.trim() || 'Vente Produit Comptoir',
      clientPhone: productSaleData.clientPhone.trim() || '',
      serviceId: 'product_sale',
      serviceName: `🛍️ ${prod.name} (x${qty})`,
      practitionerName: 'Comptoir',
      date: selectedDateStr === todayISO ? "Aujourd'hui" : selectedDateStr,
      dateStr: selectedDateStr,
      timeSlot: nowTime,
      duration: '15 min',
      price: totalAmount,
      depositPaid: totalAmount,
      remainingBalance: 0,
      paymentMethod: productSaleData.method,
      status: 'completed'
    });

    // 3. Attribuer des points de fidélité si cliente renseignée
    if (productSaleData.clientPhone) {
      const earned = Math.floor(totalAmount / 100);
      if (earned > 0) {
        await awardLoyaltyPoints({
          phone: productSaleData.clientPhone,
          name: productSaleData.clientName,
          points: earned,
          reason: `Achat produit ${prod.name} (x${qty})`
        });
      }
    }

    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (_) {}

    setShowProductSale(false);
    setProductSaleData({
      productId: '',
      quantity: 1,
      clientName: '',
      clientPhone: '',
      method: 'Espèces'
    });
  };

  // Change calculation for cash payment
  const changeToReturn = useMemo(() => {
    if (!selectedAppForPayment || checkoutMethod !== 'Espèces') return 0;
    const rem = effectiveRemainingBalance;
    const given = Number(cashGiven) || 0;
    return Math.max(0, given - rem);
  }, [selectedAppForPayment, checkoutMethod, cashGiven, effectiveRemainingBalance]);

  // WhatsApp Z-Report message generator
  const getZReportWhatsAppUrl = () => {
    const text = `*📊 RAPPORT DE CLÔTURE DE CAISSE (Z)*\n*Salon :* ${salon?.name || 'Appointfy'}\n*Date :* ${formattedDate}\n\n💰 *Total Encaissé :* ${formatFCFA(cashSummary.grandTotal)}\n💵 *Espèces en Tiroir :* ${formatFCFA(cashSummary.totalEspeces)}\n🌊 *Wave Sénégal :* ${formatFCFA(cashSummary.totalWave)}\n⏳ *Soldes restants en attente :* ${formatFCFA(cashSummary.totalRestantADevoir)}\n👥 *Prestations soldées :* ${cashSummary.nbReglés} / ${cashSummary.totalTransactions}\n\n_Généré automatiquement par le Point de Vente Appointfy._`;
    return `https://wa.me/?text=${encodeURIComponent(text)}`;
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto w-full">

      {/* ================= 1. EN-TÊTE CAISSE & ACTIONS ================= */}
      <div className="bg-white p-4 sm:p-6 rounded-3xl border border-emerald-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="p-2 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-sm shadow-2xs">
              💰 Point de Vente (POS)
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
              Caisse & Règlements
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1.5">
            Encaissez le solde sur place (Espèces ou Wave), gérez les ventes comptoir et clôturez la journée.
          </p>
        </div>

        {/* Boutons d'actions rapides */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <button
            type="button"
            onClick={() => setShowZReport(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Afficher le rapport Z de clôture de caisse du jour"
          >
            <Receipt className="w-4 h-4 text-slate-600" />
            <span>Clôture (Z)</span>
          </button>

          <button
            type="button"
            onClick={() => setShowProductSale(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 border border-pink-200 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs"
            title="Vendre un produit ou soin du stock au comptoir"
          >
            <Package className="w-4 h-4 text-pink-600" />
            <span>+ Vente Produit</span>
          </button>

          <button
            type="button"
            onClick={() => setShowQuickWalkin(true)}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <Coins className="w-4 h-4 stroke-[2.5]" />
            <span>+ Sans RDV</span>
          </button>
        </div>
      </div>

      {/* ================= 2. CONTRÔLE DE DATE (AUJOURD'HUI / ARCHIVES) ================= */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShiftDay(-1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Jour précédent"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
              {isSelectedToday ? "Caisse d'Aujourd'hui" : "Archive de caisse"}
            </span>
            <h3 className="text-xs sm:text-sm font-black text-slate-900 capitalize truncate">
              {formattedDate}
            </h3>
          </div>

          <button
            onClick={() => handleShiftDay(1)}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            title="Jour suivant"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          {!isSelectedToday && (
            <button
              onClick={() => setSelectedDateStr(todayISO)}
              className="ml-2 px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold transition-colors cursor-pointer"
            >
              Aujourd'hui
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <input
            type="date"
            ref={dateInputRef}
            value={selectedDateStr}
            onChange={(e) => e.target.value && setSelectedDateStr(e.target.value)}
            className="sr-only"
          />
          <button
            onClick={() => dateInputRef.current && dateInputRef.current.showPicker ? dateInputRef.current.showPicker() : dateInputRef.current?.click()}
            className="px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-2xs"
          >
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span>Changer de date...</span>
          </button>
        </div>
      </div>

      {/* ================= 3. LES 4 INDICATEURS FINANCIERS DE CAISSE ================= */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Total Grand C.A. */}
        <div className="p-4 sm:p-5 rounded-3xl bg-linear-to-br from-emerald-600 to-teal-700 text-white shadow-md shadow-emerald-600/10 space-y-1">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100 block">
            Total Encaissé du Jour
          </span>
          <div className="text-xl sm:text-2xl lg:text-3xl font-black truncate">
            {formatFCFA(cashSummary.grandTotal)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-emerald-100/90 font-medium">
            {cashSummary.nbReglés} prestation(s) soldée(s)
          </p>
        </div>

        {/* Espèces en Tiroir */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-emerald-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
              💵 Espèces en Tiroir
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 truncate">
            {formatFCFA(cashSummary.totalEspeces)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            Règlements physiques en liquide
          </p>
        </div>

        {/* Compte Wave Sénégal */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-sky-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700 block">
              🌊 Wave Sénégal
            </span>
            <span className="w-2 h-2 rounded-full bg-[#1DC3FF]"></span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-sky-900 truncate">
            {formatFCFA(cashSummary.totalWave)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            Acomptes en ligne + Wave salon
          </p>
        </div>

        {/* Solde restant à percevoir */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-amber-200/80 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-700 block">
              ⏳ Reste à Percevoir
            </span>
            <Clock className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-700 truncate">
            {formatFCFA(cashSummary.totalRestantADevoir)}
          </div>
          <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium">
            À encaisser auprès des clientes
          </p>
        </div>

      </div>

      {/* ================= 4. TABLEAU DES RÈGLEMENTS DE LA JOURNÉE ================= */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-4 sm:p-6 shadow-xs space-y-4">
        
        {/* Barre de filtrage & Recherche */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          {/* Onglets */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tous les règlements' },
              { id: 'pending', label: 'À encaisser' },
              { id: 'completed', label: 'Soldés (100%)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusTab(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  statusTab === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Recherche */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Chercher cliente, prestation..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:outline-emerald-600"
            />
          </div>
        </div>

        {/* Liste chronologique sans superposition */}
        {dayAppointments.length === 0 ? (
          <div className="py-12 text-center text-slate-500 space-y-2">
            <Receipt className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-800">Aucun règlement pour cette sélection</p>
            <p className="text-xs text-slate-400">
              Les encaissements de rendez-vous et ventes directes s'afficheront ici.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayAppointments.map((app) => {
              const isCompleted = app.status === 'completed' || Number(app.remainingBalance) <= 0;
              const deposit = Number(app.depositPaid) || 0;
              const remaining = Number(app.remainingBalance) || 0;
              const price = Number(app.price) || (deposit + remaining);

              return (
                <div
                  key={app.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isCompleted
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : 'bg-white border-slate-200/90 hover:border-emerald-300 shadow-2xs'
                  }`}
                >
                  {/* Gauche : Heure, Cliente, Prestation, Coiffeuse */}
                  <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                    <div className="w-14 py-2 rounded-xl bg-slate-900 text-white font-mono font-black text-xs text-center shrink-0 shadow-2xs">
                      {app.timeSlot || '—'}
                    </div>

                    <div className="min-w-0 space-y-0.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-black text-sm sm:text-base text-slate-950 truncate">
                          {app.clientName}
                        </h4>
                        {app.practitionerName && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-pink-50 text-pink-700 border border-pink-100">
                            {app.practitionerName}
                          </span>
                        )}
                        {app.clientPhone && (
                          <span className="text-xs text-slate-400 font-mono">
                            {app.clientPhone}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-semibold truncate">
                        ✂️ {app.serviceName}
                      </p>
                    </div>
                  </div>

                  {/* Droite : Décomposition Financière & Bouton d'encaissement (Zéro superposition) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                    
                    {/* Bilan des montants */}
                    <div className="text-left sm:text-right space-y-0.5">
                      <div className="text-xs text-slate-500 font-medium">
                        Total : <strong className="text-slate-900 font-black">{formatFCFA(price)}</strong>
                      </div>
                      <div className="text-[11px] text-emerald-700 font-bold">
                        Acompte : +{formatFCFA(deposit)} ({app.paymentMethod?.includes('Wave') ? 'Wave' : 'Espèces'})
                      </div>
                      {remaining > 0 ? (
                        <div className="text-xs text-amber-700 font-black">
                          Reste à régler : {formatFCFA(remaining)}
                        </div>
                      ) : (
                        <div className="text-xs text-emerald-700 font-black">
                          ✓ Réglé à 100%
                        </div>
                      )}
                    </div>

                    {/* Action d'encaissement */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <span className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-900 text-xs font-black flex items-center gap-1.5 border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                          <span>Soldé ({app.onSitePaymentMethod || app.paymentMethod || 'Complet'})</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleOpenCheckout(app)}
                          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center justify-center gap-2 shadow-sm shadow-emerald-600/20 cursor-pointer transition-all"
                        >
                          <CreditCard className="w-4 h-4" />
                          <span>Encaisser {formatFCFA(remaining)}</span>
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ================= MODAL 1 : ENCAISSEMENT DU SOLDE AVEC CALCULATEUR MONNAIE ================= */}
      {selectedAppForPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleConfirmCheckout}
            className="bg-white rounded-3xl border border-emerald-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  💰 Encaisser le solde restant
                </h3>
                <p className="text-xs text-slate-500">
                  {selectedAppForPayment.clientName} • {selectedAppForPayment.serviceName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppForPayment(null)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Cartouche Montant à Payer */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
              <span className="text-[11px] font-black uppercase text-emerald-800 tracking-wider block">
                Solde à régler par la cliente
              </span>
              <div className="text-3xl font-black text-emerald-700 flex items-center justify-center gap-2">
                {applyLoyaltyDiscount && loyaltyDiscountAmount > 0 && (
                  <span className="text-base line-through text-slate-400 font-semibold">
                    {formatFCFA(selectedAppForPayment.remainingBalance || 0)}
                  </span>
                )}
                <span>{formatFCFA(effectiveRemainingBalance)}</span>
              </div>
              <span className="text-[11px] text-slate-500 block">
                Acompte de {formatFCFA(selectedAppForPayment.depositPaid || 0)} déjà déduit
              </span>
            </div>

            {/* Programme de Fidélité Cliente */}
            {selectedAppForPayment.clientPhone && (
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Gift className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-black text-amber-900">
                      Points Fidélité : {selectedAppLoyalty?.pointsBalance || 0} pts
                    </span>
                  </div>
                  {maxRedeemablePoints > 0 && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full">
                      -{formatFCFA(maxRedeemablePoints * (salon?.loyalty_point_value_fcfa || 10))} possible
                    </span>
                  )}
                </div>

                {maxRedeemablePoints > 0 ? (
                  <label className="flex items-center gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyLoyaltyDiscount}
                      onChange={(e) => setApplyLoyaltyDiscount(e.target.checked)}
                      className="w-4 h-4 text-amber-600 rounded-sm focus:ring-amber-500 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">
                      Utiliser {maxRedeemablePoints} points pour -{formatFCFA(maxRedeemablePoints * (salon?.loyalty_point_value_fcfa || 10))}
                    </span>
                  </label>
                ) : (
                  <p className="text-[11px] text-amber-700">
                    Cette cliente cumulera +{Math.floor(effectiveRemainingBalance / 100)} points sur cet encaissement.
                  </p>
                )}
              </div>
            )}

            {/* Moyen de Paiement */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">
                Moyen de paiement utilisé sur place :
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'Espèces', label: '💵 Espèces', sub: 'En liquide au comptoir' },
                  { id: 'Wave', label: '🌊 Wave Sénégal', sub: 'Sur compte Wave salon' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setCheckoutMethod(m.id)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all text-left cursor-pointer ${
                      checkoutMethod === m.id
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block">{m.label}</span>
                    <span className={`text-[10px] block ${checkoutMethod === m.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {m.sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Calculateur de Monnaie (Si Espèces) */}
            {checkoutMethod === 'Espèces' && (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">
                    Montant remis par la cliente :
                  </label>
                  <span className="text-[10px] font-bold text-slate-400">Rendu monnaie auto</span>
                </div>

                {/* Boutons billets rapides */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    Number(selectedAppForPayment.remainingBalance || 0),
                    5000,
                    10000,
                    20000
                  ]
                    .filter((val, idx, arr) => val >= Number(selectedAppForPayment.remainingBalance || 0) && arr.indexOf(val) === idx)
                    .map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setCashGiven(String(val))}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                          Number(cashGiven) === val
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {formatFCFA(val)}
                      </button>
                    ))}
                </div>

                <input
                  type="number"
                  min={selectedAppForPayment.remainingBalance || 0}
                  step="500"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="Montant remis en mains propres"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-mono font-black text-slate-900 bg-white"
                />

                {changeToReturn > 0 && (
                  <div className="p-2 rounded-xl bg-emerald-100 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs font-bold">
                    <span>Monnaie à rendre :</span>
                    <span className="text-sm font-black font-mono">+{formatFCFA(changeToReturn)}</span>
                  </div>
                )}
              </div>
            )}

            {/* Bouton de confirmation */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedAppForPayment(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-sm transition-all"
              >
                Valider l'encaissement ({checkoutMethod})
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 2 : VENTE DIRECTE AU COMPTOIR (WALK-IN) ================= */}
      {showQuickWalkin && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleWalkinSubmit}
            className="bg-white rounded-3xl border border-emerald-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  🧾 Vente Directe au Comptoir (Sans RDV)
                </h3>
                <p className="text-xs text-slate-500">
                  Pour une cliente venue directement au salon.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickWalkin(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Choix prestation du catalogue */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prestation du catalogue (ou sur-mesure)
                </label>
                <select
                  value={walkinData.serviceId}
                  onChange={(e) => {
                    const sid = e.target.value;
                    const found = services.find(s => s.id === sid);
                    setWalkinData(prev => ({
                      ...prev,
                      serviceId: sid,
                      serviceName: found ? found.name : prev.serviceName,
                      amount: found ? String(found.price) : prev.amount
                    }));
                  }}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 bg-white"
                >
                  <option value="">-- Choisir une prestation existante --</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} — {formatFCFA(s.price)}
                    </option>
                  ))}
                  <option value="custom">+ Autre prestation / Vente produit</option>
                </select>

                {walkinData.serviceId === 'custom' && (
                  <input
                    type="text"
                    required
                    value={walkinData.serviceName}
                    onChange={(e) => setWalkinData(prev => ({ ...prev, serviceName: e.target.value }))}
                    placeholder="Nom de la prestation ou du produit vendu"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium mt-2"
                  />
                )}
              </div>

              {/* Montant */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Montant total encaissé (FCFA) *
                </label>
                <input
                  type="number"
                  required
                  min="500"
                  step="500"
                  value={walkinData.amount}
                  onChange={(e) => setWalkinData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="ex: 15000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono font-black text-slate-900 bg-white"
                />
              </div>

              {/* Prénom cliente (optionnel) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Prénom cliente (facultatif)
                </label>
                <input
                  type="text"
                  value={walkinData.clientName}
                  onChange={(e) => setWalkinData(prev => ({ ...prev, clientName: e.target.value }))}
                  placeholder="ex: Awa (laisser vide si anonyme)"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-900"
                />
              </div>

              {/* Coiffeuse / Collaboratrice */}
              {team.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Coiffeuse ayant réalisé la prestation
                  </label>
                  <select
                    value={walkinData.practitionerName}
                    onChange={(e) => setWalkinData(prev => ({ ...prev, practitionerName: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white"
                  >
                    <option value="">Non assignée</option>
                    {team.map(m => (
                      <option key={m.id || m.name} value={m.name}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Moyen de règlement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Moyen de règlement :
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'Espèces', label: '💵 Espèces' },
                    { id: 'Wave', label: '🌊 Wave Sénégal' }
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setWalkinData(prev => ({ ...prev, method: m.id }))}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                        walkinData.method === m.id
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowQuickWalkin(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer shadow-sm transition-all"
              >
                Enregistrer la recette
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL VENTE DE PRODUIT DU STOCK ================= */}
      {showProductSale && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <form
            onSubmit={handleProductSaleSubmit}
            className="bg-white rounded-3xl border border-pink-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-pink-600" />
                  <span>Vendre un Produit du Stock</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Décompte immédiat du stock et encaissement en caisse.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowProductSale(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {/* Choix Produit */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Sélectionner un produit en stock *
                </label>
                <select
                  required
                  value={productSaleData.productId}
                  onChange={(e) => setProductSaleData({ ...productSaleData, productId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 bg-white focus:ring-2 focus:ring-pink-500 focus:outline-none"
                >
                  <option value="">-- Choisir un produit en rayon --</option>
                  {products.filter(p => p.is_retail !== false && (Number(p.stock_quantity) || 0) > 0).map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatFCFA(p.price)} (Stock : {p.stock_quantity})
                    </option>
                  ))}
                </select>
                {products.filter(p => p.is_retail !== false && (Number(p.stock_quantity) || 0) > 0).length === 0 && (
                  <p className="text-[11px] text-amber-600 font-bold mt-1">
                    Aucun produit de revente avec stock disponible. Ajoutez-en dans l'onglet Stocks.
                  </p>
                )}
              </div>

              {/* Quantité & Total */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantité *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={products.find(p => p.id === productSaleData.productId)?.stock_quantity || 99}
                    required
                    value={productSaleData.quantity}
                    onChange={(e) => setProductSaleData({ ...productSaleData, quantity: Math.max(1, Number(e.target.value)) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Total à régler
                  </label>
                  <div className="px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-black text-pink-700">
                    {formatFCFA(
                      ((products.find(p => p.id === productSaleData.productId)?.price) || 0) * (Number(productSaleData.quantity) || 1)
                    )}
                  </div>
                </div>
              </div>

              {/* Cliente & Téléphone (Fidélité) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nom cliente (optionnel)
                  </label>
                  <input
                    type="text"
                    value={productSaleData.clientName}
                    onChange={(e) => setProductSaleData({ ...productSaleData, clientName: e.target.value })}
                    placeholder="ex: Mariama"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Téléphone (Points fidélité)
                  </label>
                  <input
                    type="tel"
                    value={productSaleData.clientPhone}
                    onChange={(e) => setProductSaleData({ ...productSaleData, clientPhone: e.target.value })}
                    placeholder="77 123 45 67"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Mode de règlement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Règlement immédiat
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Espèces', 'Wave'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setProductSaleData({ ...productSaleData, method: m })}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                        productSaleData.method === m
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {m === 'Espèces' ? '💵 Espèces' : '🌊 Wave'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowProductSale(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={!productSaleData.productId}
                className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white text-xs font-black cursor-pointer shadow-sm transition-all"
              >
                Encaisser & Déstocker
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================= MODAL 3 : CLÔTURE DE CAISSE (RAPPORT Z) ================= */}
      {showZReport && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-black text-slate-950 text-base">
                  📊 Clôture de Caisse Journalière (Z)
                </h3>
                <p className="text-xs text-slate-500">
                  {salon?.name || 'Mon Salon'} • {formattedDate}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowZReport(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Grand Total */}
            <div className="p-4 rounded-2xl bg-linear-to-r from-emerald-600 to-teal-700 text-white text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-100">
                Chiffre d'Affaires Total de la Journée
              </span>
              <div className="text-3xl font-black">
                {formatFCFA(cashSummary.grandTotal)}
              </div>
              <p className="text-[11px] text-emerald-100 font-medium">
                {cashSummary.nbReglés} prestation(s) terminée(s)
              </p>
            </div>

            {/* Répartition détaillée */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-200/60 font-semibold">
                <span className="text-slate-600">💵 Total Espèces (Tiroir Physique) :</span>
                <span className="font-black text-slate-900 font-mono text-sm">
                  {formatFCFA(cashSummary.totalEspeces)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-200/60 font-semibold">
                <span className="text-sky-700">🌊 Total Wave Sénégal (Compte Digital) :</span>
                <span className="font-black text-sky-900 font-mono text-sm">
                  {formatFCFA(cashSummary.totalWave)}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 font-semibold">
                <span className="text-amber-700">⏳ Reste à percevoir / En attente :</span>
                <span className="font-black text-amber-900 font-mono text-sm">
                  {formatFCFA(cashSummary.totalRestantADevoir)}
                </span>
              </div>
            </div>

            {/* Boutons d'export */}
            <div className="space-y-2 pt-2">
              <a
                href={getZReportWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>Partager le rapport Z sur WhatsApp</span>
              </a>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimer la clôture de caisse</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
