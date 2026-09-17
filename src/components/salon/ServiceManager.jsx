import React, { useState, useRef } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import {
  Plus,
  Trash2,
  Edit3,
  Shield,
  Clock,
  Sparkles,
  Camera,
  UploadCloud,
  Loader2,
  ImageIcon,
  Check,
  X,
  DollarSign
} from 'lucide-react';

export const ServiceManager = () => {
  const { services, addService, updateService, deleteService } = useBooking();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);

  // Add form state & ref
  const servicePhotoInputRef = useRef(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const [newService, setNewService] = useState({
    name: '',
    category: 'Tresses',
    duration: '2h00',
    price: 15000,
    deposit: 3000,
    description: '',
    imageUrl: ''
  });

  // Edit form state & ref
  const editPhotoInputRef = useRef(null);
  const [uploadingEditPhoto, setUploadingEditPhoto] = useState(false);
  const [editUploadError, setEditUploadError] = useState(null);

  const [editForm, setEditForm] = useState({
    name: '',
    category: '',
    duration: '',
    price: 0,
    deposit: 0,
    description: '',
    imageUrl: ''
  });

  const categoriesSuggestions = [
    'Tresses & Nattes',
    'Tissage & Extensions',
    'Perruques & Lace',
    'Soins Capillaires',
    'Onglerie & Manucure',
    'Pédicure & Soins Pieds',
    'Maquillage & Make-up',
    'Coiffure Homme & Barbe',
    'Locks & Dreads',
    'Esthétique & Épilation',
    'Massage & Spa'
  ];

  const quickCategories = ['Tresses', 'Tissage', 'Perruques', 'Soins', 'Onglerie', 'Make-up', 'Barber', 'Locks'];

  // Add photo upload
  const handleServicePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 8 Mo).");
      return;
    }
    setUploadingPhoto(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file);
      setNewService(prev => ({ ...prev, imageUrl: res.url }));
    } catch (err) {
      setUploadError("Erreur upload photo : " + (err.message || ''));
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Edit photo upload
  const handleEditPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      alert("L'image est trop volumineuse (max 8 Mo).");
      return;
    }
    setUploadingEditPhoto(true);
    setEditUploadError(null);
    try {
      const res = await uploadToCloudinary(file);
      setEditForm(prev => ({ ...prev, imageUrl: res.url }));
    } catch (err) {
      setEditUploadError("Erreur upload photo : " + (err.message || ''));
    } finally {
      setUploadingEditPhoto(false);
    }
  };

  const handleAdd = (e) => {
    e.preventDefault();
    if (!newService.name.trim()) return;
    const price = Math.max(500, Number(newService.price) || 0);
    const deposit = Math.min(price, Math.max(0, Number(newService.deposit) || 0));

    addService({
      ...newService,
      price,
      deposit,
      imageUrl: newService.imageUrl || ''
    });
    setNewService({
      name: '',
      category: 'Tresses',
      duration: '2h00',
      price: 15000,
      deposit: 3000,
      description: '',
      imageUrl: ''
    });
    setUploadError(null);
    setShowAddForm(false);
  };

  const startEditing = (service) => {
    setEditingServiceId(service.id);
    setEditForm({
      name: service.name || '',
      category: service.category || 'Tresses',
      duration: service.duration || '1h30',
      price: Number(service.price) || 0,
      deposit: Number(service.deposit) || 0,
      description: service.description || '',
      imageUrl: service.imageUrl || service.image_url || ''
    });
    setEditUploadError(null);
  };

  const cancelEditing = () => {
    setEditingServiceId(null);
    setEditUploadError(null);
  };

  const handleSaveEdit = (e) => {
    e.preventDefault();
    if (!editForm.name.trim()) return;
    const price = Math.max(500, Number(editForm.price) || 0);
    const deposit = Math.min(price, Math.max(0, Number(editForm.deposit) || 0));

    updateService(editingServiceId, {
      ...editForm,
      price,
      deposit,
      imageUrl: editForm.imageUrl || ''
    });

    setEditingServiceId(null);
    setEditUploadError(null);
  };

  return (
    <div className="bg-white rounded-3xl border border-pink-100 shadow-xs p-4 sm:p-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h3 className="font-black text-slate-950 text-lg">Vos Prestations & Acomptes</h3>
          <p className="text-xs text-slate-500">
            Personnalisez vos tarifs, durées, photos et acomptes en direct pour vos clientes
          </p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm);
            setEditingServiceId(null);
          }}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm shadow-pink-500/20 cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Ajouter une prestation</span>
        </button>
      </div>

      {/* ================= FORMULAIRE D'AJOUT ================= */}
      {showAddForm && (
        <form onSubmit={handleAdd} className="mb-6 p-4 rounded-2xl bg-pink-50/60 border border-pink-100 space-y-3">
          <h4 className="font-bold text-xs uppercase tracking-wider text-pink-900">Nouvelle prestation</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Nom du service *</label>
              <input
                type="text"
                required
                placeholder="Ex: Tissage Ouvert"
                value={newService.name}
                onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white focus:outline-none focus:border-pink-500 font-semibold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Catégorie *</label>
              <input
                type="text"
                list="add-categories"
                required
                placeholder="Ex: Tresses, Soins, Onglerie..."
                value={newService.category}
                onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white focus:outline-none focus:border-pink-500 font-semibold"
              />
              <datalist id="add-categories">
                {categoriesSuggestions.map(c => <option key={c} value={c} />)}
              </datalist>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {quickCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setNewService(prev => ({ ...prev, category: cat }))}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      newService.category === cat
                        ? 'bg-pink-600 text-white'
                        : 'bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-100'
                    }`}
                  >
                    + {cat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Durée approximative</label>
              <input
                type="text"
                placeholder="Ex: 2h30"
                value={newService.duration}
                onChange={(e) => setNewService({ ...newService, duration: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white focus:outline-none focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Prix total (FCFA) *</label>
              <input
                type="number"
                min="0"
                step="any"
                required
                value={newService.price}
                onChange={(e) => {
                  const p = Math.max(0, Number(e.target.value));
                  setNewService(prev => ({
                    ...prev,
                    price: p,
                    deposit: Math.min(prev.deposit, p)
                  }));
                }}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white focus:outline-none focus:border-pink-500 font-bold"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Acompte demandé (FCFA) * (0 F = sans acompte)</label>
              <input
                type="number"
                min="0"
                max={newService.price}
                step="any"
                required
                value={newService.deposit}
                onChange={(e) => setNewService({ ...newService, deposit: Math.max(0, Number(e.target.value)) })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white focus:outline-none focus:border-pink-500 font-bold text-pink-600"
              />
              <div className="flex flex-wrap gap-1 mt-1.5">
                <button
                  type="button"
                  onClick={() => setNewService(prev => ({ ...prev, deposit: 0 }))}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                    newService.deposit === 0
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  Sans acompte (0 F)
                </button>
                {[0.2, 0.3, 0.5].map((pct) => {
                  const val = Math.round((newService.price * pct) / 500) * 500;
                  return (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setNewService(prev => ({ ...prev, deposit: val }))}
                      className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                    >
                      {pct * 100}% ({val.toLocaleString()} F)
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Description courte (optionnel)</label>
              <input
                type="text"
                placeholder="Ex: Mèches fournies, shampoing inclus..."
                value={newService.description}
                onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-pink-200 text-xs bg-white focus:outline-none focus:border-pink-500"
              />
            </div>

            {/* Photo Prestation */}
            <div className="sm:col-span-2 pt-2 border-t border-pink-100">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Photo de la réalisation (Lookbook)
              </label>
              <div className="flex items-center gap-3">
                {newService.imageUrl ? (
                  <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-300 shrink-0 bg-slate-100 group shadow-xs">
                    <img src={newService.imageUrl} alt="Aperçu prestation" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setNewService(prev => ({ ...prev, imageUrl: '' }))}
                      title="Supprimer la photo"
                      className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 text-rose-300" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => servicePhotoInputRef.current?.click()}
                    className="w-16 h-16 rounded-2xl border-2 border-dashed border-pink-200 bg-white hover:border-pink-400 hover:bg-pink-50/50 flex flex-col items-center justify-center text-pink-500 cursor-pointer transition-all shrink-0"
                  >
                    {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  </div>
                )}

                <div className="flex-1">
                  <button
                    type="button"
                    onClick={() => servicePhotoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 text-pink-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    {uploadingPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                    <span>{uploadingPhoto ? 'Envoi en cours...' : (newService.imageUrl ? 'Changer la photo' : 'Ajouter une photo')}</span>
                  </button>
                  {uploadError && <p className="text-[11px] text-rose-600 font-semibold mt-1">{uploadError}</p>}
                </div>

                <input
                  ref={servicePhotoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleServicePhotoUpload}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-sm shadow-pink-500/20 cursor-pointer"
            >
              Enregistrer le service
            </button>
          </div>
        </form>
      )}

      {/* ================= LISTE DES PRESTATIONS ================= */}
      {services.length === 0 ? (
        <div className="py-10 text-center text-slate-400">
          <p className="text-xs font-semibold">Aucune prestation enregistrée pour l'instant.</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-3 px-3 py-1.5 rounded-xl bg-pink-50 text-pink-600 text-xs font-bold border border-pink-200 hover:bg-pink-100 cursor-pointer"
          >
            + Ajouter votre première prestation
          </button>
        </div>
      ) : (
        <div className="divide-y divide-pink-50">
          {services.map(s => {
            const isEditingThis = editingServiceId === s.id;

            if (isEditingThis) {
              /* FORMULAIRE DE MODIFICATION EN DIRECT */
              return (
                <form
                  key={s.id}
                  onSubmit={handleSaveEdit}
                  className="py-4 my-2 p-4 rounded-2xl bg-amber-50/50 border-2 border-amber-300 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Edit3 className="w-3.5 h-3.5 text-amber-700" />
                      <span>Modifier la prestation : {s.name}</span>
                    </span>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom de la prestation *</label>
                      <input
                        type="text"
                        required
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-bold text-slate-900 focus:outline-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Catégorie *</label>
                      <input
                        type="text"
                        list="edit-categories"
                        required
                        value={editForm.category}
                        onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-bold text-slate-900 focus:outline-amber-500"
                      />
                      <datalist id="edit-categories">
                        {categoriesSuggestions.map(c => <option key={c} value={c} />)}
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Durée (ex: 2h00)</label>
                      <input
                        type="text"
                        value={editForm.duration}
                        onChange={(e) => setEditForm({ ...editForm, duration: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white text-slate-900 focus:outline-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Prix total (FCFA) *</label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        required
                        value={editForm.price}
                        onChange={(e) => {
                          const p = Math.max(0, Number(e.target.value));
                          setEditForm(prev => ({
                            ...prev,
                            price: p,
                            deposit: Math.min(prev.deposit, p)
                          }));
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-black text-slate-900 focus:outline-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Acompte demandé (FCFA) * (0 F = sans acompte)</label>
                      <input
                        type="number"
                        min="0"
                        max={editForm.price}
                        step="any"
                        required
                        value={editForm.deposit}
                        onChange={(e) => setEditForm({ ...editForm, deposit: Math.max(0, Number(e.target.value)) })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white font-black text-pink-700 focus:outline-amber-500"
                      />
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setEditForm(prev => ({ ...prev, deposit: 0 }))}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                            editForm.deposit === 0
                              ? 'bg-emerald-600 text-white border-emerald-600'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          }`}
                        >
                          Sans acompte (0 F)
                        </button>
                        {[0.2, 0.3, 0.5].map((pct) => {
                          const val = Math.round((editForm.price * pct) / 500) * 500;
                          return (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, deposit: val }))}
                              className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                            >
                              {pct * 100}% ({val.toLocaleString()} F)
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Description courte</label>
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-300 text-xs bg-white text-slate-900 focus:outline-amber-500"
                      />
                    </div>

                    {/* Photo de la prestation */}
                    <div className="sm:col-span-2 pt-2 border-t border-amber-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        Photo de la réalisation (Lookbook)
                      </label>
                      <div className="flex items-center gap-3">
                        {editForm.imageUrl ? (
                          <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-amber-400 shrink-0 bg-slate-100 group shadow-xs">
                            <img src={editForm.imageUrl} alt="Aperçu prestation" className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setEditForm(prev => ({ ...prev, imageUrl: '' }))}
                              title="Supprimer la photo"
                              className="absolute inset-0 bg-slate-950/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 text-rose-300" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => editPhotoInputRef.current?.click()}
                            className="w-16 h-16 rounded-2xl border-2 border-dashed border-amber-300 bg-white hover:border-amber-500 flex flex-col items-center justify-center text-amber-600 cursor-pointer transition-all shrink-0"
                          >
                            {uploadingEditPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                          </div>
                        )}

                        <div className="flex-1">
                          <button
                            type="button"
                            onClick={() => editPhotoInputRef.current?.click()}
                            disabled={uploadingEditPhoto}
                            className="px-3.5 py-1.5 rounded-xl bg-white border border-amber-300 hover:bg-amber-100 text-amber-900 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                          >
                            {uploadingEditPhoto ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                            <span>{uploadingEditPhoto ? 'Téléversement...' : (editForm.imageUrl ? 'Changer la photo' : 'Ajouter une photo')}</span>
                          </button>
                          {editUploadError && <p className="text-[11px] text-rose-600 font-semibold mt-1">{editUploadError}</p>}
                        </div>

                        <input
                          ref={editPhotoInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleEditPhotoUpload}
                          className="hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white cursor-pointer"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm shadow-amber-600/20 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      <span>Enregistrer les modifications</span>
                    </button>
                  </div>
                </form>
              );
            }

            // Affichage normal de la prestation
            return (
              <div key={s.id} className="py-3.5 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  {(s.imageUrl || s.image_url) ? (
                    <img
                      src={s.imageUrl || s.image_url}
                      alt={s.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-pink-100 shadow-2xs shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-pink-50/80 border border-pink-100 text-pink-500 flex items-center justify-center shrink-0">
                      <Sparkles className="w-5 h-5 opacity-40" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h5 className="font-bold text-xs sm:text-sm text-slate-950 truncate">{s.name}</h5>
                      <span className="text-[10px] font-semibold px-2 py-0.5 bg-pink-50 text-pink-700 border border-pink-100 rounded-md shrink-0">
                        {s.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                      {s.duration} {s.description ? `• ${s.description}` : ''}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-black text-slate-900 block">
                      {formatFCFA(s.price)}
                    </span>
                    {(Number(s.deposit) || 0) <= 0 ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        0 F acompte
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-pink-700 bg-pink-50 px-2 py-0.5 rounded-md border border-pink-100">
                        Acompte: {formatFCFA(s.deposit)}
                      </span>
                    )}
                  </div>

                  {/* Bouton Modifier */}
                  <button
                    onClick={() => startEditing(s)}
                    title="Modifier cette prestation"
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-amber-700 hover:bg-amber-50 border border-transparent hover:border-amber-200 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Bouton Supprimer */}
                  <button
                    onClick={() => deleteService(s.id)}
                    title="Supprimer la prestation"
                    className="w-8 h-8 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
