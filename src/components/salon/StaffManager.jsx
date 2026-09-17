import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import {
  Users,
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Plus,
  Edit2,
  Trash2,
  Phone,
  Scissors,
  CheckCircle2,
  X,
  Lock,
  UserCheck,
  LogOut,
  Calendar,
  CreditCard,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';

export const StaffManager = () => {
  const {
    salon,
    updateSalon,
    services,
    activeStaffMember,
    currentAccessLevel,
    staffLoginWithPin,
    staffLogout
  } = useBooking();

  const team = Array.isArray(salon?.team) ? salon.team : [];

  // PIN switch state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [revealedPins, setRevealedPins] = useState({});

  const toggleRevealPin = (id) => {
    setRevealedPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Staff Edit Modal
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    role: 'Praticienne',
    phone: '',
    accessLevel: 'level_2',
    pin: '',
    avatar: '',
    specialties: []
  });

  const accessLevelDescriptions = {
    level_1: {
      label: 'Niveau 1 : Gérance / Direction',
      badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
      icon: ShieldCheck,
      description: 'Accès intégral : Chiffre d\'affaires, caisse, abonnements Wave, gestion de l\'équipe et paramètres du salon.'
    },
    level_2: {
      label: 'Niveau 2 : Praticienne / Coiffeuse',
      badgeClass: 'bg-pink-100 text-pink-800 border-pink-200',
      icon: Scissors,
      description: 'Accès restreint au planning et à ses propres clientes. Aucun accès aux finances globales ni aux réglages.'
    },
    level_3: {
      label: 'Niveau 3 : Réceptionniste / Caissière',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
      icon: CreditCard,
      description: 'Accès au planning général, fichier clients et encaissement en caisse POS. Pas d\'accès aux réglages du compte.'
    }
  };

  const handleOpenAdd = () => {
    setEditingStaff(null);
    setFormData({
      id: 'staff_' + Date.now(),
      name: '',
      role: 'Coiffeuse / Praticienne',
      phone: '',
      accessLevel: 'level_2',
      pin: String(Math.floor(1000 + Math.random() * 9000)), // PIN 4 chiffres aléatoire
      avatar: '',
      specialties: []
    });
    setIsStaffModalOpen(true);
  };

  const handleOpenEdit = (member) => {
    setEditingStaff(member);
    setFormData({
      id: member.id || member.name,
      name: member.name || '',
      role: member.role || 'Praticienne',
      phone: member.phone || '',
      accessLevel: member.accessLevel || 'level_2',
      pin: member.pin || member.pinCode || '1234',
      avatar: member.avatar || '',
      specialties: Array.isArray(member.specialties) ? member.specialties : []
    });
    setIsStaffModalOpen(true);
  };

  const handleSubmitStaff = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    let updatedTeam = [];
    if (editingStaff) {
      updatedTeam = team.map(m => {
        if ((m.id && m.id === editingStaff.id) || m.name === editingStaff.name) {
          return { ...formData, name: formData.name.trim() };
        }
        return m;
      });
    } else {
      updatedTeam = [...team, { ...formData, name: formData.name.trim() }];
    }

    await updateSalon({ team: updatedTeam, teamMode: updatedTeam.length > 0 ? 'team' : 'solo' });
    setIsStaffModalOpen(false);
  };

  const handleDeleteStaff = async (memberId, memberName) => {
    if (window.confirm(`Supprimer ${memberName} de l'équipe du salon ?`)) {
      const updatedTeam = team.filter(m => (m.id || m.name) !== memberId && m.name !== memberName);
      await updateSalon({ team: updatedTeam, teamMode: updatedTeam.length > 0 ? 'team' : 'solo' });
    }
  };

  const handlePinLogin = (e) => {
    e.preventDefault();
    setPinError('');
    const success = staffLoginWithPin(pinInput);
    if (success) {
      setIsPinModalOpen(false);
      setPinInput('');
    } else {
      setPinError('Code PIN invalide. (Astuce: 0000 ou code configuré)');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* En-tête & Action principale */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Gestion du Personnel & Sécurité</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Équipe & Niveaux d'Accès
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Attribuez des profils individuels, des codes PIN et protégez les données sensibles de votre salon.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-pink-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Ajouter un Profil</span>
        </button>
      </div>

      {/* BANNIÈRE DE CONNEXION ACTIVE (PIN SWITCHER) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
            <KeyRound className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-300 font-medium">Session active sur cette tablette :</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                currentAccessLevel === 'level_1'
                  ? 'bg-purple-500/30 text-purple-200 border border-purple-400/40'
                  : currentAccessLevel === 'level_2'
                  ? 'bg-pink-500/30 text-pink-200 border border-pink-400/40'
                  : 'bg-blue-500/30 text-blue-200 border border-blue-400/40'
              }`}>
                {currentAccessLevel === 'level_1' ? 'Niveau 1 (Gérance)' : currentAccessLevel === 'level_2' ? 'Niveau 2 (Praticienne)' : 'Niveau 3 (Réception)'}
              </span>
            </div>
            <h3 className="text-base font-extrabold text-white mt-0.5">
              {activeStaffMember ? activeStaffMember.name : (salon?.owner_name || 'Gérante Propriétaire')}
              {activeStaffMember?.role && <span className="text-xs font-normal text-slate-400 ml-2">({activeStaffMember.role})</span>}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeStaffMember && (
            <button
              type="button"
              onClick={staffLogout}
              className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Revenir au compte Propriétaire"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Quitter</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setPinInput('');
              setPinError('');
              setIsPinModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Changer d'utilisateur (PIN)</span>
          </button>
        </div>
      </div>

      {/* Guide visuel des 3 niveaux d'accès */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {Object.entries(accessLevelDescriptions).map(([key, item]) => {
          const Icon = item.icon;
          return (
            <div key={key} className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-2">
              <div className="flex items-center gap-2">
                <span className={`p-1.5 rounded-xl ${item.badgeClass}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <span className="font-extrabold text-xs text-slate-900">{item.label}</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {item.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Liste des Membres de l'Équipe */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h2 className="font-black text-base text-slate-900 flex items-center gap-2">
            <span>Membres de l'Équipe</span>
            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
              {team.length + 1}
            </span>
          </h2>
          <span className="text-xs text-slate-400">
            Touchez Modifier pour configurer les spécialités et le PIN
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Carte Spéciale : Gérant(e) / Propriétaire */}
          <div className="p-5 rounded-3xl border-2 border-purple-200 bg-purple-50/20 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white font-black text-base flex items-center justify-center shadow-xs">
                  👑
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 font-black text-[10px] uppercase tracking-wide">
                  <ShieldCheck className="w-3 h-3 text-purple-600" />
                  Niveau 1 (Gérance)
                </span>
              </div>

              <h3 className="font-black text-base text-slate-900">
                {salon?.owner_name || 'Propriétaire'}
              </h3>
              <p className="text-xs text-purple-700 font-bold mt-0.5">
                Directrice & Fondatrice
              </p>
              <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                <span>Accès complet. Code de secours :</span>
                <code className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-purple-200">
                  {currentAccessLevel === 'level_1' && revealedPins['owner'] ? '0000' : '••••'}
                </code>
                {currentAccessLevel === 'level_1' && (
                  <button
                    type="button"
                    onClick={() => toggleRevealPin('owner')}
                    className="text-purple-600 hover:text-purple-800 transition-colors cursor-pointer p-0.5 ml-1"
                    title={revealedPins['owner'] ? "Masquer le PIN" : "Afficher le PIN"}
                  >
                    {revealedPins['owner'] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-purple-100 flex items-center justify-between text-xs text-purple-900 font-bold">
              <span>Tous droits accordés</span>
              <CheckCircle2 className="w-4 h-4 text-purple-600" />
            </div>
          </div>

          {/* Cartes des membres configurés */}
          {team.map((member, index) => {
            const levelInfo = accessLevelDescriptions[member.accessLevel || 'level_2'];
            const LevelIcon = levelInfo?.icon || Scissors;

            return (
              <div
                key={member.id || index}
                className="p-5 rounded-3xl border border-slate-200/80 bg-white hover:border-slate-300 shadow-xs flex flex-col justify-between space-y-4 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-pink-50 text-pink-600 font-black text-base flex items-center justify-center overflow-hidden border border-pink-100">
                      {member.avatar ? (
                        <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <span>{member.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] uppercase border ${levelInfo?.badgeClass}`}>
                      <LevelIcon className="w-3 h-3" />
                      {member.accessLevel === 'level_1' ? 'Niveau 1' : member.accessLevel === 'level_3' ? 'Niveau 3' : 'Niveau 2'}
                    </span>
                  </div>

                  <h3 className="font-black text-base text-slate-900">
                    {member.name}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    {member.role || 'Praticienne'}
                  </p>

                  {member.phone && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-2">
                      <Phone className="w-3 h-3 text-slate-400" />
                      <span>{member.phone}</span>
                    </div>
                  )}

                  {/* Code PIN Sécurisé */}
                  <div className="flex items-center justify-between mt-3 p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center gap-2">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-slate-500 text-[11px]">Code PIN :</span>
                      <strong className="font-mono text-slate-900 tracking-wider">
                        {currentAccessLevel === 'level_1' && revealedPins[member.id || index]
                          ? (member.pin || member.pinCode || '1234')
                          : '••••'}
                      </strong>
                    </div>
                    {currentAccessLevel === 'level_1' && (
                      <button
                        type="button"
                        onClick={() => toggleRevealPin(member.id || index)}
                        className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer p-1"
                        title={revealedPins[member.id || index] ? "Masquer le PIN" : "Afficher le PIN"}
                      >
                        {revealedPins[member.id || index] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions Modifier / Supprimer */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(member)}
                    className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                    title="Modifier"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(member.id, member.name)}
                    className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Supprimer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CHANGEMENT D'UTILISATEUR VIA PIN */}
      {isPinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 border border-slate-200 shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-2">
                <KeyRound className="w-6 h-6" />
              </div>
              <h3 className="font-black text-lg text-slate-950">Changer d'Utilisateur</h3>
              <p className="text-slate-500 text-xs">
                Saisissez votre code PIN à 4 chiffres pour accéder à votre espace de travail.
              </p>
            </div>

            <form onSubmit={handlePinLogin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength="6"
                  autoFocus
                  required
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  placeholder="••••"
                  className="w-full text-center tracking-[0.6em] font-mono text-2xl py-3 rounded-2xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500 text-slate-900 font-black"
                />
                {pinError && (
                  <p className="text-rose-600 text-xs font-bold text-center mt-2">
                    {pinError}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPinModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all cursor-pointer"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL AJOUT / MODIFICATION DE MEMBRE */}
      {isStaffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-950">
                  {editingStaff ? 'Modifier le Collaborateur' : 'Nouveau Collaborateur'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsStaffModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitStaff} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prénom & Nom *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="ex: Fatou Sow"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Titre / Spécialité *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    placeholder="ex: Nail Artist Pro"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Téléphone (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="ex: 77 123 45 67"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Code PIN Tablette (4 chiffres) *
                  </label>
                  <input
                    type="text"
                    maxLength="6"
                    required
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="ex: 4521"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-mono font-bold text-slate-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Permet de se connecter rapidement au salon</p>
                </div>
              </div>

              {/* Sélecteur de Niveau d'accès */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Niveau d'Accès & Droits dans l'Application *
                </label>
                <div className="space-y-2">
                  {Object.entries(accessLevelDescriptions).map(([lvlKey, lvl]) => {
                    const isSelected = formData.accessLevel === lvlKey;
                    const Icon = lvl.icon;

                    return (
                      <label
                        key={lvlKey}
                        className={`flex items-start gap-3 p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-pink-50/50 border-pink-400 shadow-2xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <input
                          type="radio"
                          name="accessLevel"
                          value={lvlKey}
                          checked={isSelected}
                          onChange={() => setFormData({ ...formData, accessLevel: lvlKey })}
                          className="mt-1 text-pink-600 focus:ring-pink-500 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <Icon className="w-4 h-4 text-slate-700" />
                            <span className="font-extrabold text-xs text-slate-900">{lvl.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-0.5">{lvl.description}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsStaffModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  {editingStaff ? 'Mettre à jour' : 'Enregistrer le Profil'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
