import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';
import { OnboardingWizard } from './OnboardingWizard';
import { X, Sparkles, Mail, Lock, ArrowRight, ShieldCheck, MessageCircle, AlertCircle, Loader2 } from 'lucide-react';

export const RegisterModal = ({ isOpen, onClose, initialPlan = 'pro', defaultTab = 'register' }) => {
  const { setSalon, setCurrentView, setCurrentUser, completeOnboarding } = useBooking();
  const [tab, setTab] = useState(defaultTab); // 'register' | 'login'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  if (!isOpen) return null;

  if (tab === 'register') {
    return (
      <OnboardingWizard
        isOpen={isOpen}
        onClose={onClose}
        onSwitchToLogin={() => {
          setTab('login');
          setErrorMsg('');
        }}
        onComplete={async (onboardingData) => {
          if (completeOnboarding) {
            await completeOnboarding(onboardingData);
          }
          if (onClose) onClose();
          setCurrentView('salon');
        }}
      />
    );
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (!loginEmail || !loginPassword) {
        throw new Error('Veuillez renseigner votre email et mot de passe.');
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (authError) {
        throw authError;
      }

      setCurrentUser(authData?.user || { email: loginEmail });

      // Fetch salon linked to this owner
      if (authData?.user?.id) {
        const { data: salonData } = await supabase
          .from('salons')
          .select('*')
          .eq('owner_id', authData.user.id)
          .maybeSingle();

        if (salonData) {
          setSalon(prev => ({
            ...prev,
            ...salonData,
            business_type: salonData.business_type || salonData.notification_settings?.business_type || 'beauty_studio',
            work_mode: salonData.work_mode || salonData.notification_settings?.work_mode || 'salon',
            wave_number: salonData.wave_number || salonData.notification_settings?.wave_number || salonData.phone
          }));
        }
      }

      onClose();
      setCurrentView('salon');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || 'Identifiants invalides.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-pink-100 relative">
        
        {/* Header */}
        <div className="p-5 border-b border-pink-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-600 to-rose-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-black text-gray-900 text-sm">Connexion Gérant</h3>
              <p className="text-[10px] text-gray-500">Accéder à votre dashboard</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-pink-50 text-xs font-bold bg-pink-50/50 p-1">
          <button
            type="button"
            onClick={() => setTab('register')}
            className="flex-1 py-1.5 text-center transition cursor-pointer text-gray-600 hover:text-pink-600"
          >
            Créer ma vitrine
          </button>
          <button
            type="button"
            className="flex-1 py-1.5 text-center bg-pink-600 text-white rounded-lg shadow-xs cursor-default"
          >
            Connexion
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleLoginSubmit} className="p-5 space-y-3.5">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-center gap-1.5">
              <AlertCircle size={14} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Email professionnel
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="contact@mon-salon.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-pink-100 focus:border-pink-500 font-medium"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs shadow-md shadow-pink-500/20 flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 mt-1"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Connexion...</span>
              </>
            ) : (
              <>
                <span>Se connecter</span>
                <ArrowRight size={13} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-pink-50/40 px-4 py-3 border-t border-pink-50 text-center">
          <span className="text-[10px] text-pink-900/70 font-semibold flex items-center justify-center gap-1">
            <ShieldCheck size={13} className="text-pink-600" />
            Plateforme certifiée anti-lapin Wave Sénégal
          </span>
        </div>

      </div>
    </div>
  );
};
