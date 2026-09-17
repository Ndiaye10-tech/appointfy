import React, { useState } from 'react';
import { useBooking } from '../../context/BookingContext';
import { supabase } from '../../lib/supabase';
import { BrandLogo } from '../common/BrandLogo';
import { OnboardingWizard } from './OnboardingWizard';
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';

export const AuthPage = ({ defaultMode = 'register' }) => {
  const { setCurrentView, setSalon, setCurrentUser, completeOnboarding } = useBooking();
  const [mode, setMode] = useState(defaultMode); // 'register' | 'login'
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      if (!loginEmail || !loginPassword) {
        throw new Error('Veuillez renseigner votre email et mot de passe.');
      }

      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: loginEmail.trim(),
        password: loginPassword
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes('email not confirmed')) {
          setCurrentUser({ email: loginEmail });
        } else {
          throw authError;
        }
      } else {
        setCurrentUser(authData?.user || { email: loginEmail });
      }

      // Fetch salon linked to this owner
      try {
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
      } catch (fetchErr) {
        // Ignored
      }

      setSuccessMessage('Connexion réussie !');
      setTimeout(() => {
        setCurrentView('salon');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
    } catch (err) {
      console.error(err);
      setErrorMessage(err.message || 'Identifiants incorrects. Veuillez vérifier votre mot de passe.');
    } finally {
      setLoading(false);
    }
  };

  // Si le mode est 'register', on affiche directement le parcours onboarding 2-questions zéro-scroll
  if (mode === 'register') {
    return (
      <div className="min-h-screen bg-[#fdfafc] flex items-center justify-center p-3">
        <OnboardingWizard
          isOpen={true}
          onClose={() => setCurrentView('landing')}
          onSwitchToLogin={() => {
            setMode('login');
            setErrorMessage('');
          }}
          onComplete={async (onboardingData) => {
            if (completeOnboarding) {
              await completeOnboarding(onboardingData);
            }
            setCurrentView('salon');
          }}
        />
      </div>
    );
  }

  // Si le mode est 'login', on affiche une carte compacte zéro-scroll
  return (
    <div className="min-h-screen bg-[#fdfafc] flex flex-col justify-center py-6 px-4 relative overflow-hidden">
      {/* Glow d'ambiance */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[450px] h-[250px] bg-gradient-to-tr from-pink-200/40 via-rose-100/30 to-amber-100/20 blur-[100px] rounded-full pointer-events-none -z-10" />

      {/* Bouton retour */}
      <div className="max-w-md w-full mx-auto mb-3">
        <button
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-pink-600 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour à l'accueil</span>
        </button>
      </div>

      {/* Carte de Connexion Compacte */}
      <div className="max-w-md w-full mx-auto bg-white rounded-3xl border border-pink-100 shadow-xl shadow-pink-500/5 overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b border-pink-50 text-center space-y-2">
          <div className="flex justify-center mb-1">
            <BrandLogo size="default" showBadge={false} />
          </div>
          <h2 className="text-xl font-black text-gray-900 tracking-tight">
            Espace Gérant & Planning
          </h2>
          <p className="text-xs text-gray-500 font-medium">
            Connectez-vous pour consulter vos rendez-vous et vos acomptes Wave.
          </p>

          {/* Switcher Inscription / Connexion */}
          <div className="pt-2 flex bg-pink-50/70 p-1 rounded-2xl border border-pink-100">
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMessage('');
              }}
              className="flex-1 py-1.5 rounded-xl text-xs font-bold text-gray-600 hover:text-pink-600 transition cursor-pointer"
            >
              Inscription (Nouveau)
            </button>
            <button
              type="button"
              className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-pink-600 text-white shadow-xs cursor-default"
            >
              Connexion
            </button>
          </div>
        </div>

        {/* Formulaire Login */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Email professionnel
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                placeholder="salon@gmail.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-medium text-gray-900"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">
              Mot de passe
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-100 font-medium text-gray-900"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-pink-600 via-rose-500 to-pink-500 hover:from-pink-500 hover:to-rose-400 text-white font-black text-sm rounded-xl shadow-md shadow-pink-500/20 flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Connexion en cours...</span>
              </>
            ) : (
              <>
                <span>Accéder à mon Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="bg-pink-50/40 p-3.5 border-t border-pink-50 text-center">
          <span className="text-[11px] text-pink-900/70 font-semibold flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-pink-600" />
            Accès sécurisé pour gérants & professionnels de la beauté
          </span>
        </div>

      </div>
    </div>
  );
};
