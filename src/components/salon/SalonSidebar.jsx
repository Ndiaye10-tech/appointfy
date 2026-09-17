import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  Users,
  Palette,
  Settings,
  MessageCircle,
  LogOut,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Scissors,
  Boxes,
  ShieldCheck,
  Package
} from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';
import { useBooking } from '../../context/BookingContext';

export const SalonSidebar = ({
  salonTab,
  setSalonTab,
  appointmentsCount = 0,
  salon,
  currentUser,
  logout,
  onCloseMobile
}) => {
  const { currentAccessLevel, activeStaffMember, isPlatformAdmin, setCurrentView } = useBooking();

  const allSections = [
    {
      group: "AUJOURD'HUI",
      items: [
        { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, minLevel: 'level_3' },
        { id: 'planning', label: 'Planning', icon: Calendar, badge: appointmentsCount, minLevel: 'level_2' },
        { id: 'pos', label: 'Caisse POS', icon: CreditCard, minLevel: 'level_3' }
      ]
    },
    {
      group: "MON SALON",
      items: [
        { id: 'crm', label: 'Clients & Fidélité', icon: Users, minLevel: 'level_2' },
        { id: 'inventory', label: 'Stocks & Vente', icon: Boxes, minLevel: 'level_3' },
        { id: 'staff', label: 'Équipe & Droits', icon: ShieldCheck, minLevel: 'level_1' },
        { id: 'showcase', label: 'Ma vitrine', icon: Palette, minLevel: 'level_1' }
      ]
    },
    {
      group: "COMPTE",
      items: [
        { id: 'settings', label: 'Paramètres', icon: Settings, minLevel: 'level_1' }
      ]
    }
  ];

  // Filtrage selon le niveau d'accès de l'utilisateur actif
  const sections = allSections.map(group => ({
    ...group,
    items: group.items.filter(item => {
      if (currentAccessLevel === 'level_1') return true;
      if (currentAccessLevel === 'level_3') {
        return item.minLevel === 'level_3' || item.minLevel === 'level_2';
      }
      if (currentAccessLevel === 'level_2') {
        return item.minLevel === 'level_2';
      }
      return true;
    })
  })).filter(g => g.items.length > 0);

  const handleSelect = (tabId) => {
    setSalonTab(tabId);
    if (onCloseMobile) onCloseMobile();
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const showcaseUrl = `${origin}/?salon=${salon?.slug || 'mon-salon'}`;

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 flex flex-col justify-between h-full min-h-screen p-4 select-none shrink-0">
      
      {/* Top: Brand & Salon identity */}
      <div className="space-y-4">
        {/* Logo Appointfy */}
        <div className="px-2 py-1 flex items-center justify-between">
          <BrandLogo />
        </div>

        {/* Salon Card snippet */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-pink-50/70 to-rose-50/50 border border-pink-100 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pink-600 text-white flex items-center justify-center font-black text-sm shrink-0 overflow-hidden shadow-2xs">
              {salon?.avatarImage ? (
                <img src={salon.avatarImage} alt={salon.name} className="w-full h-full object-cover" />
              ) : (
                <Scissors className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-extrabold text-xs text-slate-900 truncate">
                {salon?.name || 'Mon Salon'}
              </h3>
              {salon?.owner_name && (
                <p className="text-[10px] text-pink-600 font-bold truncate">
                  👤 {salon.owner_name}
                </p>
              )}
              {(salon?.address || salon?.city) && (
                <p className="text-[10px] text-slate-500 font-medium truncate">
                  📍 {salon.address || salon.city}
                </p>
              )}
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-bold text-emerald-700">En ligne</span>
              </div>
            </div>
          </div>
          <a
            href={showcaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-1.5 px-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-all shadow-2xs"
          >
            <ExternalLink className="w-3 h-3 text-slate-500" />
            <span>Voir le site client ↗</span>
          </a>
        </div>
        
        {/* Accès Tour de Contrôle Super-Admin (Exclusif mahmoudndiaye100@gmail.com) */}
        {isPlatformAdmin && (
          <button
            type="button"
            onClick={() => {
              setCurrentView('admin');
              if (onCloseMobile) onCloseMobile();
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 border border-purple-500/40 text-purple-200 font-extrabold text-xs flex items-center justify-between shadow-md shadow-purple-950/40 hover:border-purple-400 transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-purple-500/30 flex items-center justify-center text-amber-300 font-bold text-xs">
                👑
              </div>
              <span className="group-hover:text-white transition-colors">Tour de Contrôle</span>
            </div>
            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-200 border border-purple-400/30">
              Admin
            </span>
          </button>
        )}

        {/* Navigation Sections */}
        <nav className="space-y-4 pt-1">
          {sections.map((sec) => (
            <div key={sec.group} className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-3 block">
                {sec.group}
              </span>
              <div className="space-y-0.5">
                {sec.items.map((item) => {
                  const isActive = salonTab === item.id || 
                    (item.id === 'showcase' && (salonTab === 'share' || salonTab === 'services')) ||
                    (item.id === 'settings' && salonTab === 'subscription');
                  const Icon = item.icon;

                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs transition-all cursor-pointer text-left ${
                        isActive
                          ? 'bg-pink-50 text-pink-700 font-extrabold shadow-2xs border border-pink-100/80'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-semibold'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-pink-600' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                          isActive ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom: Help & Logout */}
      <div className="pt-4 border-t border-slate-100 space-y-1">
        {/* Support WhatsApp Salons Inscrits */}
        <a
          href={`https://wa.me/221784722951?text=${encodeURIComponent(`Bonjour Appointfy, je suis le salon ${salon?.name || ''} et j'ai besoin d'aide pour mon salon.`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold text-emerald-800 bg-emerald-50/70 hover:bg-emerald-100/70 border border-emerald-200/60 transition-all cursor-pointer"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-left min-w-0">
              <span className="block truncate font-extrabold text-[11px]">Support Salons</span>
              <span className="block text-[10px] text-emerald-700 font-mono font-bold">78 472 29 51</span>
            </div>
          </div>
          <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-emerald-200 text-emerald-900 font-black uppercase shrink-0">
            WhatsApp
          </span>
        </a>

        {/* Déconnexion */}
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer text-left"
        >
          <LogOut className="w-4 h-4 text-slate-400 shrink-0" />
          <span>Déconnexion</span>
        </button>
      </div>

    </aside>
  );
};
