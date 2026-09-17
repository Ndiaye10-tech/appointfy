import React, { useState } from 'react';
import { useBooking } from '../context/BookingContext';
import { Store, User, Home, Lock, Plus, ShieldCheck, LogOut, ExternalLink, Eye } from 'lucide-react';
import { RegisterModal } from './auth/RegisterModal';
import { BrandLogo } from './common/BrandLogo';

export const Navbar = () => {
  const { currentView, setCurrentView, resetBookingFlow, salon, setAuthMode, currentUser, logout } = useBooking();

  const handleNav = (view) => {
    if (view === 'client') {
      resetBookingFlow();
    }
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openRegister = () => {
    setAuthMode('register');
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openLogin = () => {
    setAuthMode('login');
    setCurrentView('auth');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-pink-100 shadow-xs text-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
          
          {/* Brand Logo */}
          <div 
            onClick={() => handleNav(currentUser ? 'salon' : 'landing')}
            className="cursor-pointer group shrink-0 hover:opacity-90 transition-opacity"
          >
            <BrandLogo />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            
            {currentUser ? (
              /* Gérant Connecté : Boutons Dashboard + Voir mon site + Déconnexion */
              <div className="flex items-center gap-2">
                {currentView === 'client' ? (
                  <button
                    onClick={() => handleNav('salon')}
                    className="px-3 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  >
                    <Store className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Retour au Dashboard & Éditeur</span>
                    <span className="sm:hidden">Dashboard</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNav('client')}
                    className="px-3 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center gap-1.5 border border-pink-200 transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" />
                    <span className="hidden sm:inline">Voir mon site (Vue Cliente)</span>
                    <span className="sm:hidden">Mon site</span>
                  </button>
                )}

                <button
                  onClick={logout}
                  title="Déconnexion"
                  className="p-2 sm:p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : currentView === 'landing' ? (
              /* Visiteur Non Connecté sur Landing Page */
              <>
                <button
                  onClick={openLogin}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  Se connecter
                </button>

                <button
                  onClick={openRegister}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-extrabold text-xs shadow-md shadow-pink-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Créer mon espace</span>
                </button>
              </>
            ) : (
              /* Visiteur Non Connecté hors Landing */
              <div className="flex items-center gap-2">
                <button
                  onClick={openLogin}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-pink-600 transition-colors cursor-pointer"
                >
                  Se connecter
                </button>

                <button
                  onClick={openRegister}
                  className="px-4 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-extrabold text-xs shadow-md shadow-pink-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Créer mon espace</span>
                </button>
              </div>
            )}

          </div>

        </div>
      </header>
    </>
  );
};
