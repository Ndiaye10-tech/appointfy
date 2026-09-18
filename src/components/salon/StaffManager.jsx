import React, { useState, useMemo } from 'react';
import { useBooking } from '../../context/BookingContext';
import {
  Users,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Scissors,
  CheckCircle2,
  X,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  DollarSign,
  TrendingUp,
  Calendar,
  Send,
  Sparkles,
  HelpCircle,
  KeyRound,
  FileText,
  Percent,
  Check,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

export const StaffManager = () => {
  const {
    salon,
    updateSalon,
    services = [],
    appointments = [],
    verifyManagerPin
  } = useBooking();

  const team = useMemo(() => Array.isArray(salon?.team) ? salon.team : [], [salon?.team]);

  // Mode Onglet : 'members' (Gestion d'équipe) ou 'payroll' (Fiches de paie & commissions)
  const [activeTab, setActiveTab] = useState('payroll');

  // Mode Confidentialité / Comptoir (Masquer les montants aux clientes ou employées)
  const [isCounterMode, setIsCounterMode] = useState(false);

  // Mois sélectionné pour la paie (format 'YYYY-MM')
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  });

  // Modale Membre (Ajout / Edition)
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: 'Coiffeuse / Praticienne',
    phone: '',
    contractType: 'hybrid', // 'hybrid' (Fixe + Commission), 'commission' (100% Commission), 'fixed' (Fixe seul)
    baseSalary: 50000,
    commissionRate: 30,
    specialties: [],
    active: true
  });

  // Modale PIN Gérante (pour modifier le PIN ou déverrouiller)
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState('change'); // 'unlock' ou 'change'
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [pinSuccess, setPinSuccess] = useState('');

  // Détail rendez-vous pour un membre dans la vue paie
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null);

  // --- CALCULS DE PAIE & COMMISSIONS ---
  const payrollStats = useMemo(() => {
    // Filtrer les rendez-vous du mois sélectionné
    const monthAppointments = (appointments || []).filter(apt => {
      if (!apt.date) return false;
      const aptMonth = apt.date.substring(0, 7); // 'YYYY-MM'
      const status = (apt.status || '').toLowerCase();
      // On compte les rendez-vous confirmés ou terminés
      const isCountable = status === 'completed' || status === 'confirmed' || status === 'terminé';
      return aptMonth === selectedMonth && isCountable;
    });

    let totalSalonRevenueMonth = 0;
    let totalCommissionsToPay = 0;
    let totalBaseSalariesToPay = 0;
    let totalServicesRendered = monthAppointments.length;

    const staffCalculations = team.map(member => {
      // Filtrer les rendez-vous effectués par ce membre
      const memberApts = monthAppointments.filter(apt => {
        if (apt.practitionerId && apt.practitionerId === member.id) return true;
        if (apt.practitionerName && apt.practitionerName.toLowerCase().trim() === member.name.toLowerCase().trim()) return true;
        return false;
      });

      // Chiffre d'affaires généré par ce membre
      const revenueGenerated = memberApts.reduce((sum, apt) => {
        const price = Number(apt.price) || 0;
        return sum + price;
      }, 0);

      totalSalonRevenueMonth += revenueGenerated;

      // Calcul selon le type de contrat
      const contractType = member.contractType || 'hybrid';
      const baseSalary = contractType === 'commission' ? 0 : (Number(member.baseSalary) || 0);
      const commissionRate = contractType === 'fixed' ? 0 : (Number(member.commissionRate) || 0);
      const commissionAmount = Math.round((revenueGenerated * commissionRate) / 100);
      const totalNetPay = baseSalary + commissionAmount;

      totalBaseSalariesToPay += baseSalary;
      totalCommissionsToPay += commissionAmount;

      return {
        member,
        contractType,
        baseSalary,
        commissionRate,
        revenueGenerated,
        commissionAmount,
        totalNetPay,
        appointmentsCount: memberApts.length,
        appointments: memberApts
      };
    });

    const grandTotalPayroll = totalBaseSalariesToPay + totalCommissionsToPay;

    return {
      monthAppointments,
      totalSalonRevenueMonth,
      totalCommissionsToPay,
      totalBaseSalariesToPay,
      grandTotalPayroll,
      totalServicesRendered,
      staffCalculations
    };
  }, [team, appointments, selectedMonth]);

  // Formattage prix FCFA
  const formatMoney = (amount) => {
    if (isCounterMode) return '•••••• F';
    return `${Number(amount || 0).toLocaleString('fr-FR')} F CFA`;
  };

  // Gestion de l'ajout / modification de membre
  const handleOpenAdd = () => {
    setEditingMember(null);
    setFormData({
      id: 'staff_' + Date.now(),
      name: '',
      role: 'Coiffeuse / Praticienne',
      phone: '',
      contractType: 'hybrid',
      baseSalary: 50000,
      commissionRate: 30,
      specialties: [],
      active: true
    });
    setIsMemberModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingMember(member);
    setFormData({
      id: member.id,
      name: member.name || '',
      role: member.role || 'Coiffeuse / Praticienne',
      phone: member.phone || '',
      contractType: member.contractType || 'hybrid',
      baseSalary: member.baseSalary !== undefined ? member.baseSalary : 50000,
      commissionRate: member.commissionRate !== undefined ? member.commissionRate : 30,
      specialties: Array.isArray(member.specialties) ? member.specialties : [],
      active: member.active !== false
    });
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let updatedTeam = [];
    if (editingMember) {
      updatedTeam = team.map(m => m.id === editingMember.id ? { ...formData } : m);
    } else {
      updatedTeam = [...team, { ...formData }];
    }

    await updateSalon({ team: updatedTeam });
    setIsMemberModalOpen(false);
  };

  const handleDeleteMember = async (memberId) => {
    if (!window.confirm('Voulez-vous vraiment retirer cette personne de l\'équipe ?')) return;
    const updatedTeam = team.filter(m => m.id !== memberId);
    await updateSalon({ team: updatedTeam });
  };

  const toggleSpecialty = (serviceName) => {
    setFormData(prev => {
      const exists = prev.specialties.includes(serviceName);
      if (exists) {
        return { ...prev, specialties: prev.specialties.filter(s => s !== serviceName) };
      } else {
        return { ...prev, specialties: [...prev.specialties, serviceName] };
      }
    });
  };

  // Envoi de la fiche de paie par WhatsApp
  const handleSendWhatsAppSlip = (calc) => {
    const { member, contractType, baseSalary, commissionRate, revenueGenerated, commissionAmount, totalNetPay, appointmentsCount } = calc;
    
    // Format du mois pour affichage (ex: Mars 2026)
    const [year, monthNum] = selectedMonth.split('-');
    const dateObj = new Date(parseInt(year), parseInt(monthNum) - 1, 1);
    const monthName = dateObj.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });

    let message = `*FICHE DE PAIE & COMMISSIONS - ${monthName.toUpperCase()}*\n`;
    message += `🏢 Salon : *${salon?.name || 'Notre Salon'}*\n`;
    message += `👤 Collaboratrice : *${member.name}*\n`;
    message += `--------------------------------\n`;
    message += `✂️ Prestations réalisées : *${appointmentsCount}*\n`;
    message += `📈 Chiffre d'Affaires généré : *${Number(revenueGenerated).toLocaleString('fr-FR')} F CFA*\n`;
    message += `--------------------------------\n`;

    if (contractType === 'hybrid') {
      message += `💵 Salaire Fixe garanti : ${Number(baseSalary).toLocaleString('fr-FR')} F CFA\n`;
      message += `🎯 Commission (${commissionRate}%) : +${Number(commissionAmount).toLocaleString('fr-FR')} F CFA\n`;
    } else if (contractType === 'commission') {
      message += `🎯 Commission pure (${commissionRate}%) : ${Number(commissionAmount).toLocaleString('fr-FR')} F CFA\n`;
    } else {
      message += `💵 Salaire Fixe mensuel : ${Number(baseSalary).toLocaleString('fr-FR')} F CFA\n`;
    }

    message += `--------------------------------\n`;
    message += `💰 *TOTAL NET À VERSER : ${Number(totalNetPay).toLocaleString('fr-FR')} F CFA*\n`;
    message += `--------------------------------\n`;
    message += `Merci pour ton travail et ton professionnalisme ce mois-ci ! ✨`;

    const encoded = encodeURIComponent(message);
    let cleanPhone = (member.phone || '').replace(/[^0-9]/g, '');
    if (!cleanPhone.startsWith('221') && !cleanPhone.startsWith('225') && cleanPhone.length === 9) {
      cleanPhone = '221' + cleanPhone; // Par défaut Sénégal si non préfixé
    }

    const whatsappUrl = cleanPhone 
      ? `https://wa.me/${cleanPhone}?text=${encoded}`
      : `https://wa.me/?text=${encoded}`;

    window.open(whatsappUrl, '_blank');
  };

  // Changement du Code PIN Gérante
  const handleSavePin = async (e) => {
    e.preventDefault();
    setPinError('');
    setPinSuccess('');

    if (!verifyManagerPin(currentPinInput)) {
      setPinError('Le code PIN actuel est incorrect (par défaut : 1234).');
      return;
    }

    if (!newPinInput || newPinInput.length < 4) {
      setPinError('Le nouveau code PIN doit comporter au moins 4 chiffres.');
      return;
    }

    await updateSalon({ manager_pin: newPinInput.trim() });
    setPinSuccess('Code PIN gérante mis à jour avec succès !');
    setTimeout(() => {
      setIsPinModalOpen(false);
      setCurrentPinInput('');
      setNewPinInput('');
      setPinSuccess('');
    }, 1200);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header avec Titre & Actions rapides */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-pink-100 text-pink-600 rounded-xl">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Équipe & Rémunérations</h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Gérez vos collaboratrices, leurs contrats (Fixe + Commissions) et éditez leurs fiches de paie en 1 clic.
              </p>
            </div>
          </div>
        </div>

        {/* Boutons d'action droite */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Bouton Mode Comptoir (Masquage des montants) */}
          <button
            type="button"
            onClick={() => setIsCounterMode(!isCounterMode)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              isCounterMode
                ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
            title="Masque les montants en FCFA pour que personne ne voit les chiffres au comptoir"
          >
            {isCounterMode ? (
              <>
                <EyeOff className="w-4 h-4 text-amber-600" />
                <span>Mode Discret Actif</span>
              </>
            ) : (
              <>
                <Eye className="w-4 h-4 text-slate-500" />
                <span>Mode Comptoir (Masquer)</span>
              </>
            )}
          </button>

          {/* Bouton Changer PIN Gérante */}
          <button
            type="button"
            onClick={() => {
              setPinError('');
              setPinSuccess('');
              setCurrentPinInput('');
              setNewPinInput('');
              setIsPinModalOpen(true);
            }}
            className="px-3 py-2 rounded-xl text-xs font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 flex items-center gap-1.5"
          >
            <KeyRound className="w-4 h-4 text-slate-400" />
            <span>PIN Gérante</span>
          </button>
        </div>
      </div>

      {/* Navigation entre les 2 Onglets Clairs */}
      <div className="flex border-b border-slate-200">
        <button
          type="button"
          onClick={() => setActiveTab('payroll')}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'payroll'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Fiches de Paie & Commissions</span>
          <span className="ml-1.5 px-2 py-0.5 rounded-full text-xs bg-pink-100 text-pink-700 font-bold">
            {team.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`pb-3.5 px-4 text-sm font-semibold flex items-center gap-2 border-b-2 transition-colors ${
            activeTab === 'members'
              ? 'border-pink-600 text-pink-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Membres de l'Équipe</span>
        </button>
      </div>

      {/* ===================== TAB 1 : FICHES DE PAIE & COMMISSIONS ===================== */}
      {activeTab === 'payroll' && (
        <div className="space-y-6">
          {/* Sélecteur de mois & KPIs globaux */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Bilan des Rémunérations</h2>
                <p className="text-xs text-slate-500">
                  Calcul automatique basé sur les rendez-vous honorés et les taux de chaque coiffeuse.
                </p>
              </div>

              {/* Sélecteur de mois */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <Calendar className="w-4 h-4 text-slate-400" />
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>
            </div>

            {/* Cartes KPIs du Mois */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-2 border-t border-slate-100">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">C.A. Équipe du Mois</span>
                <p className="text-lg sm:text-xl font-black text-slate-900 mt-1">
                  {formatMoney(payrollStats.totalSalonRevenueMonth)}
                </p>
                <span className="text-[11px] text-slate-400 font-medium">
                  Sur {payrollStats.totalServicesRendered} prestations effectuées
                </span>
              </div>

              <div className="p-4 rounded-xl bg-pink-50/60 border border-pink-100">
                <span className="text-xs font-semibold text-pink-700 uppercase tracking-wider">Total Commissions</span>
                <p className="text-lg sm:text-xl font-black text-pink-700 mt-1">
                  {formatMoney(payrollStats.totalCommissionsToPay)}
                </p>
                <span className="text-[11px] text-pink-500 font-medium">
                  Part variable méritée
                </span>
              </div>

              <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
                <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Total Salaires à Verser</span>
                <p className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
                  {formatMoney(payrollStats.grandTotalPayroll)}
                </p>
                <span className="text-[11px] text-emerald-600 font-medium">
                  Fixe ({formatMoney(payrollStats.totalBaseSalariesToPay)}) + Commissions
                </span>
              </div>
            </div>
          </div>

          {/* Liste des Fiches individuelles */}
          {team.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-4">
              <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto">
                <Users className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-base font-bold text-slate-900">Aucun membre dans l'équipe</h3>
                <p className="text-xs sm:text-sm text-slate-500">
                  Ajoutez vos coiffeuses et tresseuses pour suivre leurs prestations et calculer leurs paies automatiquement.
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs inline-flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Ajouter une première coiffeuse</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3.5">
              {payrollStats.staffCalculations.map((calc) => {
                const { member, contractType, baseSalary, commissionRate, revenueGenerated, commissionAmount, totalNetPay, appointmentsCount } = calc;

                return (
                  <div
                    key={member.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-shadow space-y-4"
                  >
                    {/* Ligne 1 : Info membre & statut */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black text-base flex items-center justify-center shadow-2xs shrink-0">
                          {member.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 text-sm sm:text-base">{member.name}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                              contractType === 'hybrid'
                                ? 'bg-purple-100 text-purple-800'
                                : contractType === 'commission'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {contractType === 'hybrid' && 'Fixe + Com.'}
                              {contractType === 'commission' && '100% Commission'}
                              {contractType === 'fixed' && 'Fixe Seul'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                            <span>{member.role || 'Praticienne'}</span>
                            {member.phone && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-slate-400" />
                                  {member.phone}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Bouton WhatsApp direct */}
                      <button
                        type="button"
                        onClick={() => handleSendWhatsAppSlip(calc)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-colors self-end sm:self-auto"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Envoyer fiche par WhatsApp</span>
                      </button>
                    </div>

                    {/* Ligne 2 : Grille des chiffres de paie */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[11px]">C.A. Généré</span>
                        <span className="font-bold text-slate-800 text-sm">
                          {formatMoney(revenueGenerated)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {appointmentsCount} rendez-vous
                        </span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Part Fixe</span>
                        <span className="font-semibold text-slate-800 text-sm">
                          {contractType === 'commission' ? '0 F' : formatMoney(baseSalary)}
                        </span>
                        <span className="block text-[10px] text-slate-400">Garanti</span>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[11px]">Commissions ({commissionRate}%)</span>
                        <span className="font-semibold text-pink-600 text-sm">
                          +{formatMoney(commissionAmount)}
                        </span>
                        <span className="block text-[10px] text-pink-400">
                          Sur prestations
                        </span>
                      </div>

                      <div className="bg-emerald-100/50 p-2 rounded-lg border border-emerald-200/50">
                        <span className="text-emerald-800 font-bold block text-[11px] uppercase">Net à Payer</span>
                        <span className="font-black text-emerald-700 text-base block">
                          {formatMoney(totalNetPay)}
                        </span>
                      </div>
                    </div>

                    {/* Bouton voir détails des rendez-vous */}
                    {appointmentsCount > 0 && (
                      <div className="pt-1 flex items-center justify-between text-xs">
                        <button
                          type="button"
                          onClick={() => setSelectedStaffDetails(selectedStaffDetails?.member.id === member.id ? null : calc)}
                          className="text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1 cursor-pointer"
                        >
                          <span>{selectedStaffDetails?.member.id === member.id ? 'Masquer les prestations' : `Voir les ${appointmentsCount} prestations du mois`}</span>
                          <ChevronRight className={`w-3.5 h-3.5 transition-transform ${selectedStaffDetails?.member.id === member.id ? 'rotate-90' : ''}`} />
                        </button>
                      </div>
                    )}

                    {/* Volet déroulant des prestations si sélectionné */}
                    {selectedStaffDetails?.member.id === member.id && (
                      <div className="mt-3 p-3 bg-slate-50/80 rounded-xl border border-slate-200/60 space-y-2 text-xs">
                        <div className="font-bold text-slate-700 pb-1 border-b border-slate-200">
                          Prestations de {member.name} en {selectedMonth} :
                        </div>
                        <div className="max-h-48 overflow-y-auto space-y-1.5 divide-y divide-slate-100">
                          {calc.appointments.map((apt) => (
                            <div key={apt.id} className="pt-1.5 flex items-center justify-between">
                              <div>
                                <span className="font-semibold text-slate-800">{apt.serviceName || 'Prestation'}</span>
                                <span className="text-slate-400 ml-2">({apt.date} à {apt.time})</span>
                                {apt.clientName && <span className="text-slate-500 block text-[11px]">Cliente : {apt.clientName}</span>}
                              </div>
                              <div className="text-right font-bold text-slate-900">
                                {formatMoney(apt.price)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2 : GESTION DES MEMBRES ===================== */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Collaboratrices du Salon</h2>
              <p className="text-xs text-slate-500">
                Définissez les spécialités et le mode de rémunération de chaque membre.
              </p>
            </div>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="px-3.5 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un membre</span>
            </button>
          </div>

          {team.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-slate-200/80 p-8 space-y-3">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="text-sm text-slate-500">Aucun membre enregistré pour le moment.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {team.map((member) => (
                <div
                  key={member.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black text-lg flex items-center justify-center shadow-2xs shrink-0">
                        {member.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{member.name}</h3>
                        <p className="text-xs text-slate-500">{member.role || 'Coiffeuse'}</p>
                        {member.phone && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {member.phone}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions Modifier / Supprimer */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(member)}
                        className="p-1.5 text-slate-400 hover:text-pink-600 hover:bg-pink-50 rounded-lg transition-colors"
                        title="Modifier"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteMember(member.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Mode de Rémunération du membre */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Contrat de rémunération
                    </span>
                    <div className="flex items-center justify-between text-slate-800 pt-0.5">
                      <span className="font-bold">
                        {member.contractType === 'commission'
                          ? '100% Commission'
                          : member.contractType === 'fixed'
                          ? 'Salaire Fixe Seul'
                          : 'Fixe + Commission'}
                      </span>
                      <span className="text-pink-600 font-semibold">
                        {member.contractType === 'hybrid' && `${Number(member.baseSalary || 0).toLocaleString('fr-FR')} F + ${member.commissionRate || 0}% com.`}
                        {member.contractType === 'commission' && `${member.commissionRate || 0}% du C.A.`}
                        {member.contractType === 'fixed' && `${Number(member.baseSalary || 0).toLocaleString('fr-FR')} F / mois`}
                      </span>
                    </div>
                  </div>

                  {/* Spécialités */}
                  {Array.isArray(member.specialties) && member.specialties.length > 0 && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Spécialités ({member.specialties.length})
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {member.specialties.map((spec, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 bg-pink-50 text-pink-700 text-[11px] font-medium rounded-md border border-pink-100"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ===================== MODALE AJOUT / MODIFICATION MEMBRE ===================== */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  {editingMember ? 'Modifier la collaboratrice' : 'Ajouter une collaboratrice'}
                </h3>
                <p className="text-xs text-slate-500">
                  Définissez son salaire et ses commissions pour les calculs automatiques.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMemberModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Nom complet */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nom complet ou Prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Fatou Diop, Aminata..."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {/* Rôle & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Rôle / Titre
                  </label>
                  <input
                    type="text"
                    placeholder="Ex : Coiffeuse, Tresseeuse..."
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Téléphone WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="Ex : 77 123 45 67"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                  />
                </div>
              </div>

              {/* Type de contrat de rémunération */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  Modèle de Rémunération *
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, contractType: 'hybrid' })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.contractType === 'hybrid'
                        ? 'border-purple-500 bg-purple-50 text-purple-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs block font-bold">Fixe + Com.</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Le plus courant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, contractType: 'commission' })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.contractType === 'commission'
                        ? 'border-blue-500 bg-blue-50 text-blue-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs block font-bold">100% Com.</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Pourcentage pur</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, contractType: 'fixed' })}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      formData.contractType === 'fixed'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-900 font-bold shadow-xs'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs block font-bold">Fixe Seul</span>
                    <span className="text-[10px] text-slate-500 block mt-0.5">Salaire mensuel</span>
                  </button>
                </div>
              </div>

              {/* Détails du contrat (Fixe et/ou Commission) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                {formData.contractType !== 'commission' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Salaire Fixe (FCFA)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="Ex : 50000"
                        value={formData.baseSalary}
                        onChange={(e) => setFormData({ ...formData, baseSalary: Number(e.target.value) })}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 bg-white"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">F</span>
                    </div>
                  </div>
                )}

                {formData.contractType !== 'fixed' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Commission sur C.A. (%)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="Ex : 30"
                        value={formData.commissionRate}
                        onChange={(e) => setFormData({ ...formData, commissionRate: Number(e.target.value) })}
                        className="w-full pl-3 pr-8 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 bg-white"
                      />
                      <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-bold">%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Spécialités / Prestations pratiquées */}
              {services.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-bold text-slate-700 uppercase">
                    Prestations pratiquées ({formData.specialties.length} sélectionnées)
                  </label>
                  <div className="max-h-36 overflow-y-auto space-y-1 p-2 bg-slate-50 rounded-xl border border-slate-100">
                    {services.map((srv) => {
                      const isChecked = formData.specialties.includes(srv.name);
                      return (
                        <button
                          type="button"
                          key={srv.id}
                          onClick={() => toggleSpecialty(srv.name)}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                            isChecked ? 'bg-pink-100 text-pink-900 font-semibold' : 'text-slate-600 hover:bg-white'
                          }`}
                        >
                          <span>{srv.name}</span>
                          {isChecked && <Check className="w-3.5 h-3.5 text-pink-600" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Boutons validation */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-pink-600 hover:bg-pink-700 text-white rounded-xl shadow-xs"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== MODALE PIN GÉRANTE ===================== */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-pink-600" />
                <h3 className="font-bold text-slate-900 text-sm">Code PIN Gérante</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPinModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Ce code PIN protège vos réglages confidentiels et vos fiches de paie.
              Le code PIN par défaut est <strong className="text-slate-800">1234</strong>.
            </p>

            <form onSubmit={handleSavePin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Code PIN Actuel
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="Ex : 1234"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">
                  Nouveau Code PIN (4 chiffres)
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  placeholder="Ex : 5892"
                  value={newPinInput}
                  onChange={(e) => setNewPinInput(e.target.value)}
                  className="w-full px-3 py-2 text-center text-lg tracking-widest font-mono rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-pink-500/20"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-lg bg-rose-50 text-rose-700 text-xs flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{pinError}</span>
                </div>
              )}

              {pinSuccess && (
                <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{pinSuccess}</span>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-lg"
                >
                  Fermer
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold bg-pink-600 text-white rounded-lg hover:bg-pink-700"
                >
                  Mettre à jour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
