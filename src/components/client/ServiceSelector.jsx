import React, { useState, useMemo } from 'react';
import { useBooking, formatFCFA } from '../../context/BookingContext';
import { getTheme } from '../../lib/theme';
import {
  Clock,
  Sparkles,
  ChevronRight,
  CheckCircle2,
  ArrowRight,
  Search,
  X,
  Scissors,
  Calendar,
  Eye
} from 'lucide-react';

export const ServiceSelector = ({ onImageClick }) => {
  const { services, selectedService, selectService, salon, isSalonOwner } = useBooking();
  const theme = getTheme(salon?.theme);
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [internalLightbox, setInternalLightbox] = useState(null);

  const categories = useMemo(() => {
    return ['Tous', ...new Set(services.map(s => s.category).filter(Boolean))];
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchCat = activeCategory === 'Tous' || s.category === activeCategory;
      const matchQuery = !searchQuery.trim() || 
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.category && s.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchQuery;
    });
  }, [services, activeCategory, searchQuery]);

  const handleOpenImage = (imgUrl) => {
    if (onImageClick) {
      onImageClick(imgUrl);
    } else {
      setInternalLightbox(imgUrl);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 pb-12 sm:pb-4 min-w-0 w-full">
      {/* Search & Category Filter Bar */}
      <div className="space-y-3 min-w-0 w-full">
        {/* Search Input Bar */}
        <div className="relative w-full min-w-0">
          <Search className={`w-4 h-4 ${theme.iconColor} opacity-70 absolute left-3.5 top-1/2 -translate-y-1/2`} />
          <input
            type="text"
            placeholder="Rechercher une prestation (ex: knotless, brushing, soin...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-9 py-2.5 rounded-2xl border border-stone-200/80 bg-stone-50/60 hover:bg-stone-50 focus:bg-white text-xs sm:text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 ${theme.ring} focus:border-stone-300 shadow-2xs transition-all`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="w-6 h-6 rounded-full bg-stone-200/60 hover:bg-stone-200 text-stone-600 absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Pills with Count (Luxury segmented scroll) */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-1 px-1 max-w-full">
          {categories.map((cat) => {
            const count = cat === 'Tous' 
              ? services.length 
              : services.filter(s => s.category === cat).length;
            const isCatActive = activeCategory === cat;

            return (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isCatActive
                    ? `${theme.primary} text-white shadow-2xs`
                    : 'bg-stone-100/80 text-stone-600 hover:text-stone-900 hover:bg-stone-200/70'
                }`}
              >
                <span>{cat}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  isCatActive ? 'bg-white/25 text-white' : 'bg-stone-200/70 text-stone-500'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty State if no service found */}
      {filteredServices.length === 0 && (
        <div className="p-10 rounded-3xl bg-stone-50 border border-stone-200/80 text-center space-y-3">
          <div className={`w-12 h-12 rounded-2xl bg-white flex items-center justify-center mx-auto shadow-2xs ${theme.primaryText}`}>
            <Scissors className="w-6 h-6 opacity-60" />
          </div>
          <div>
            <h4 className="font-bold text-stone-900 text-sm sm:text-base">Aucune prestation trouvée</h4>
            <p className="text-xs text-stone-500 mt-0.5">Aucun résultat ne correspond à « {searchQuery} »</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setActiveCategory('Tous');
            }}
            className={`px-4 py-2 rounded-xl ${theme.badgeFilled} text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5`}
          >
            <span>Réinitialiser</span>
          </button>
        </div>
      )}

      {/* Prestations Count */}
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="text-xs text-stone-500 font-medium">
          {filteredServices.length} prestation{filteredServices.length > 1 ? 's' : ''} disponible{filteredServices.length > 1 ? 's' : ''}
        </span>
      </div>

      {/* Prestations Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 min-w-0 w-full">
        {filteredServices.map((service) => {
          const isSelected = selectedService?.id === service.id;
          const photoUrl = service.imageUrl || service.image_url;

          return (
            <div
              key={service.id}
              onClick={() => selectService(service)}
              className={`group relative rounded-2xl overflow-hidden bg-white border transition-all duration-200 cursor-pointer flex flex-col justify-between min-w-0 w-full ${
                isSelected
                  ? `${theme.primaryBorder} ring-2 ${theme.ring} shadow-sm`
                  : 'border-stone-200/80 hover:border-stone-300 hover:shadow-xs'
              }`}
            >
              {photoUrl ? (
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenImage(photoUrl);
                  }}
                  className="relative w-full aspect-square bg-stone-100 overflow-hidden group/img cursor-pointer"
                  title="Agrandir la photo"
                >
                  <img
                    src={photoUrl}
                    alt={service.name}
                    className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white" />
                  </div>
                  {service.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-950/70 text-white backdrop-blur-md text-[9px] font-bold uppercase tracking-wider truncate max-w-[85%]">
                      {service.category}
                    </span>
                  )}
                </div>
              ) : (
                <div className="relative w-full aspect-square bg-gradient-to-br from-stone-50 via-pink-50/20 to-stone-100 flex flex-col items-center justify-center p-3 text-center border-b border-stone-100">
                  <div className="w-10 h-10 rounded-2xl bg-white shadow-2xs border border-stone-200/60 flex items-center justify-center text-pink-600 mb-1">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  {service.category && (
                    <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-stone-900/60 text-white backdrop-blur-md text-[9px] font-bold uppercase tracking-wider truncate max-w-[85%]">
                      {service.category}
                    </span>
                  )}
                </div>
              )}

              <div className="p-2.5 sm:p-3.5 space-y-2 flex-1 flex flex-col justify-between min-w-0">
                <div className="min-w-0">
                  <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1 truncate group-hover:text-stone-950">
                    {service.name}
                  </h4>
                  <p className="text-[10px] sm:text-[11px] text-stone-500 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate">{service.duration}</span>
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex flex-col min-[420px]:flex-row min-[420px]:items-center justify-between gap-1.5 min-w-0">
                  <span className="text-xs sm:text-sm font-black text-stone-900 tracking-tight truncate">
                    {formatFCFA(service.price)}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      selectService(service);
                    }}
                    className={`w-full min-[420px]:w-auto px-2 py-1.5 min-[420px]:px-2.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer shrink-0 ${
                      isSelected ? `${theme.primary} text-white ring-2 ${theme.ring}` : `${theme.primary} text-white hover:opacity-90`
                    }`}
                  >
                    {isSelected ? 'Choisi' : 'Choisir'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredServices.length === 0 && (
        <div className="text-center py-12 px-4 rounded-3xl bg-stone-50/80 border border-stone-200/70 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-white border border-stone-200 flex items-center justify-center mx-auto text-stone-400 shadow-2xs">
            <Sparkles className="w-6 h-6 text-pink-500" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-stone-900">
              {services.length === 0 ? 'Carte des prestations en cours de préparation' : 'Aucune prestation trouvée'}
            </h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              {services.length === 0
                ? `L'équipe de ${salon?.name || 'ce salon'} est en train de configurer ses prestations. Pour réserver ou vous renseigner, contactez directement l'établissement.`
                : 'Essayez un autre mot-clé de recherche ou réinitialisez les filtres.'}
            </p>
          </div>
          {salon?.whatsapp && (
            <a
              href={`https://wa.me/${salon.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
            >
              <span>Contacter sur WhatsApp</span>
            </a>
          )}
        </div>
      )}

      {/* Internal Lightbox Zoom Modal if used standalone */}
      {internalLightbox && (
        <div
          onClick={() => setInternalLightbox(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div className="relative max-w-2xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img
              src={internalLightbox}
              alt="Zoom prestation"
              className="w-full h-full object-contain"
            />
            <button
              onClick={() => setInternalLightbox(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
