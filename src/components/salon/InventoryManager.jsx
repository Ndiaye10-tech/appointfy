import React, { useState, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  TrendingUp,
  Boxes,
  Edit2,
  Trash2,
  Minus,
  CheckCircle2,
  X,
  Tag,
  DollarSign,
  Layers,
  Sparkles,
  ShoppingBag,
  ArrowUpDown
} from 'lucide-react';

export const InventoryManager = () => {
  const { products, addProduct, updateProduct, deleteProduct, adjustProductStock } = useBooking();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [filterAlertOnly, setFilterAlertOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Soins Capillaires',
    price: '',
    cost_price: '',
    stock_quantity: 10,
    alert_threshold: 3,
    is_retail: true,
    sku: ''
  });

  const categories = [
    'Tous',
    'Soins Capillaires',
    'Mèches & Tissages',
    'Onglerie',
    'Regard & Cils',
    'Consommables Pro',
    'Autre'
  ];

  // Calculs Financiers & KPIs
  const stats = useMemo(() => {
    let totalSaleValue = 0;
    let totalCostValue = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    products.forEach(p => {
      const qty = Number(p.stock_quantity) || 0;
      const price = Number(p.price) || 0;
      const cost = Number(p.cost_price) || 0;
      const threshold = Number(p.alert_threshold) || 3;

      totalSaleValue += price * qty;
      totalCostValue += cost * qty;

      if (qty === 0) {
        outOfStockCount++;
      } else if (qty <= threshold) {
        lowStockCount++;
      }
    });

    const potentialMargin = totalSaleValue - totalCostValue;

    return {
      totalSaleValue,
      totalCostValue,
      potentialMargin,
      totalCount: products.length,
      lowStockCount,
      outOfStockCount
    };
  }, [products]);

  // Filtrage des produits
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCat = selectedCategory === 'Tous' || p.category === selectedCategory;

      const isLowStock = (Number(p.stock_quantity) || 0) <= (Number(p.alert_threshold) || 3);
      const matchesAlert = !filterAlertOnly || isLowStock;

      return matchesSearch && matchesCat && matchesAlert;
    });
  }, [products, searchQuery, selectedCategory, filterAlertOnly]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Soins Capillaires',
      price: '',
      cost_price: '',
      stock_quantity: 10,
      alert_threshold: 3,
      is_retail: true,
      sku: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name || '',
      category: p.category || 'Général',
      price: p.price ?? '',
      cost_price: p.cost_price ?? '',
      stock_quantity: p.stock_quantity ?? 0,
      alert_threshold: p.alert_threshold ?? 3,
      is_retail: p.is_retail !== false,
      sku: p.sku || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    if (editingProduct) {
      await updateProduct(editingProduct.id, {
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price) || 0,
        cost_price: Number(formData.cost_price) || 0,
        stock_quantity: Number(formData.stock_quantity) || 0,
        alert_threshold: Number(formData.alert_threshold) || 3,
        is_retail: Boolean(formData.is_retail),
        sku: formData.sku?.trim() || null
      });
    } else {
      await addProduct({
        name: formData.name.trim(),
        category: formData.category,
        price: Number(formData.price) || 0,
        cost_price: Number(formData.cost_price) || 0,
        stock_quantity: Number(formData.stock_quantity) || 0,
        alert_threshold: Number(formData.alert_threshold) || 3,
        is_retail: Boolean(formData.is_retail),
        sku: formData.sku?.trim() || null
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Supprimer définitivement le produit "${name}" du stock ?`)) {
      await deleteProduct(id);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      
      {/* En-tête & Action principale */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-pink-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4" />
            <span>Gestion des Stocks & Produits</span>
          </div>
          <h1 className="text-2xl font-black text-slate-950 tracking-tight">
            Inventaire & Vente
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Suivez vos stocks en temps réel, évitez les ruptures de mèches ou soins et vendez au comptoir.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 active:scale-98 text-white font-bold text-sm shadow-md shadow-pink-200 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nouveau Produit</span>
        </button>
      </div>

      {/* 4 KPIs de synthèse financière du stock */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Valeur Vente (POS)</span>
            <div className="w-8 h-8 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900 truncate">
            {formatFCFA(stats.totalSaleValue)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Potentiel brut en caisse</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Marge Potentielle</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-600 truncate">
            +{formatFCFA(stats.potentialMargin)}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Bénéfice net estimé</p>
        </div>

        <div className="p-4 sm:p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold text-slate-500">Références Actives</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg sm:text-xl font-black text-slate-900">
            {stats.totalCount} <span className="text-xs font-semibold text-slate-400">produits</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Dans votre catalogue</p>
        </div>

        <div className={`p-4 sm:p-5 rounded-3xl border shadow-xs transition-colors ${
          stats.lowStockCount + stats.outOfStockCount > 0
            ? 'bg-amber-50/70 border-amber-200'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-bold ${
              stats.lowStockCount + stats.outOfStockCount > 0 ? 'text-amber-800' : 'text-slate-500'
            }`}>
              Alertes Stock
            </span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
              stats.lowStockCount + stats.outOfStockCount > 0
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className={`text-lg sm:text-xl font-black ${
            stats.lowStockCount + stats.outOfStockCount > 0 ? 'text-amber-700' : 'text-slate-900'
          }`}>
            {stats.lowStockCount + stats.outOfStockCount}
            <span className="text-xs font-semibold text-slate-500 ml-1">à réapprovisionner</span>
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats.outOfStockCount} rupture(s) • {stats.lowStockCount} sous le seuil
          </p>
        </div>
      </div>

      {/* Barre de Recherche & Filtres */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher par nom, référence SKU ou catégorie..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-pink-500 text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <button
            type="button"
            onClick={() => setFilterAlertOnly(!filterAlertOnly)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
              filterAlertOnly
                ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Alertes Stock {stats.lowStockCount + stats.outOfStockCount > 0 && `(${stats.lowStockCount + stats.outOfStockCount})`}</span>
          </button>
        </div>

        {/* Catégories défilables horizontalement */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grille / Liste des Produits */}
      {filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center mx-auto">
            <Package className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-slate-950 text-base">
            {products.length === 0 ? 'Votre inventaire est vide' : 'Aucun produit trouvé'}
          </h3>
          <p className="text-slate-400 text-xs max-w-sm mx-auto">
            {products.length === 0
              ? 'Vous n\'avez pas encore enregistré de produit. Cliquez ci-dessous pour ajouter vos premiers soins, mèches ou produits de revente.'
              : 'Aucun article ne correspond à vos filtres actuels.'}
          </p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nouveau Produit</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const qty = Number(product.stock_quantity) || 0;
            const threshold = Number(product.alert_threshold) || 3;
            const isOutOfStock = qty === 0;
            const isLowStock = !isOutOfStock && qty <= threshold;

            return (
              <div
                key={product.id}
                className={`bg-white rounded-3xl border p-4 sm:p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md ${
                  isOutOfStock
                    ? 'border-rose-300 bg-rose-50/20'
                    : isLowStock
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200/80'
                }`}
              >
                <div>
                  {/* Badges statut & catégorie */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold text-[10px] truncate max-w-[140px]">
                      {product.category || 'Général'}
                    </span>

                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />
                        Rupture
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px]">
                        <AlertTriangle className="w-3 h-3" />
                        Stock faible (&le; {threshold})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        En stock
                      </span>
                    )}
                  </div>

                  {/* Titre & SKU */}
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900 mb-1 leading-snug">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-4">
                    {product.sku && <span>Réf: <strong className="text-slate-600">{product.sku}</strong></span>}
                    <span>•</span>
                    <span>{product.is_retail ? '🛍️ Vente cliente' : '🧴 Consommable cabine'}</span>
                  </div>

                  {/* Tarifs Vente & Achat */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 rounded-2xl bg-slate-50 border border-slate-100 mb-4 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prix Vente</span>
                      <span className="font-extrabold text-slate-900">
                        {formatFCFA(product.price)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prix Achat</span>
                      <span className="font-semibold text-slate-600">
                        {product.cost_price ? formatFCFA(product.cost_price) : 'Non défini'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gestion Rapide du Stock & Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                  {/* Ajusteur - / + */}
                  <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => adjustProductStock(product.id, -1)}
                      disabled={qty <= 0}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 disabled:opacity-30 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      title="Diminuer le stock"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-9 text-center font-black text-xs sm:text-sm text-slate-900">
                      {qty}
                    </span>
                    <button
                      type="button"
                      onClick={() => adjustProductStock(product.id, 1)}
                      className="w-7 h-7 rounded-lg bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
                      title="Augmenter le stock"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Actions Éditer / Supprimer */}
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(product)}
                      className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                      title="Modifier"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(product.id, product.name)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL AJOUT / ÉDITION DE PRODUIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-slate-200 shadow-2xl space-y-4 max-h-[92dvh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-pink-50 text-pink-600 flex items-center justify-center">
                  <Package className="w-5 h-5" />
                </div>
                <h3 className="font-extrabold text-base text-slate-950">
                  {editingProduct ? 'Modifier le Produit' : 'Nouveau Produit en Stock'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nom du produit *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: Sérum Huile d'Argan Bio 100ml"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Catégorie
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none bg-white"
                  >
                    <option value="Soins Capillaires">Soins Capillaires</option>
                    <option value="Mèches & Tissages">Mèches & Tissages</option>
                    <option value="Onglerie">Onglerie</option>
                    <option value="Regard & Cils">Regard & Cils</option>
                    <option value="Consommables Pro">Consommables Pro</option>
                    <option value="Autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Référence / SKU (optionnel)
                  </label>
                  <input
                    type="text"
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="ex: OIL-ARG-100"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prix de Vente (FCFA) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    placeholder="ex: 7500"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prix d'Achat Fournisseur (FCFA)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                    placeholder="ex: 4000"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Permet de calculer votre marge</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Quantité en Stock *
                  </label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({ ...formData, stock_quantity: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-bold text-slate-900 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Seuil d'Alerte Rupture
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.alert_threshold}
                    onChange={(e) => setFormData({ ...formData, alert_threshold: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 focus:ring-2 focus:ring-pink-500 focus:outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">Alerte orange si stock &le; ce seuil</p>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_retail}
                    onChange={(e) => setFormData({ ...formData, is_retail: e.target.checked })}
                    className="w-4 h-4 text-pink-600 rounded-sm focus:ring-pink-500 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">
                      Disponible à la vente en caisse POS
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      Cocher si ce produit peut être acheté par les clientes au comptoir.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                >
                  {editingProduct ? 'Mettre à jour' : 'Enregistrer le Produit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
