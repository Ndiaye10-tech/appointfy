import React, { useState } from 'react';
import { BookingProvider, useBooking } from './context/BookingContext';
import { NotificationProvider } from './context/NotificationContext';
import { NotificationToast } from './components/notifications/NotificationToast';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { AuthPage } from './components/auth/AuthPage';
import { SalonWebsite } from './components/client/SalonWebsite';

import { SalonSidebar } from './components/salon/SalonSidebar';
import { DashboardHome } from './components/salon/DashboardHome';
import { DashboardMetrics } from './components/salon/DashboardMetrics';
import { SlotRecoveryBanner } from './components/salon/SlotRecoveryBanner';
import { AppointmentsList } from './components/salon/AppointmentsList';
import { ClientCRMView } from './components/salon/ClientCRMView';
import { PosCashRegister } from './components/salon/PosCashRegister';
import { InventoryManager } from './components/salon/InventoryManager';
import { StaffManager } from './components/salon/StaffManager';
import { ClientPreviewEditor } from './components/salon/ClientPreviewEditor';
import { SettingsManager } from './components/salon/SettingsManager';
import { SubscriptionPaywall } from './components/salon/SubscriptionPaywall';
import { Menu, Eye, MapPin, Clock, Phone, ShieldCheck, Sparkles, LogOut, UserCheck, AlertTriangle } from 'lucide-react';

const AppContent = () => {
  const { currentView, setCurrentView, authMode, step, appointments, salon, currentUser, logout, isSubscriptionExpired } = useBooking();
  const [salonTab, setSalonTab] = useState('dashboard'); // 'dashboard' | 'planning' | 'crm' | 'pos' | 'stats' | 'showcase' | 'settings'
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Règle : Si la personne a déjà créé son compte / est connectée, elle ne voit JAMAIS la landing page !
  React.useEffect(() => {
    if (currentUser && currentView === 'landing') {
      setCurrentView('salon');
    }
  }, [currentUser, currentView, setCurrentView]);

  return (
    <div className="min-h-screen bg-[#fdfafc] text-slate-900 flex flex-col font-sans antialiased w-full max-w-full overflow-x-hidden">
      {/* Navbar on top only when not handled by specific pages */}
      {currentView !== 'auth' && currentView !== 'client' && currentView !== 'salon' && currentView !== 'landing' && <Navbar />}

      <main className="flex-1 w-full max-w-full min-w-0 overflow-x-hidden">
        {/* ================= 1. PAGE AUTHENTIFICATION (INSCRIPTION / CONNEXION) ================= */}
        {currentView === 'auth' && (
          <AuthPage defaultMode={authMode} />
        )}

        {/* ================= 2. ACCUEIL LANDING PAGE SAAS (Uniquement si NON connecté) ================= */}
        {currentView === 'landing' && !currentUser && (
          <LandingPage />
        )}

        {/* ================= 3. VUE CLIENTE (SITE WEB STANDALONE OFFICIEL DU SALON) ================= */}
        {currentView === 'client' && (
          <SalonWebsite />
        )}

        {/* ================= 4. VUE SALON PRO (DASHBOARD GÉRANT AVEC SIDEBAR VERTICALE SUR PC) ================= */}
        {currentView === 'salon' && (
          <div className="flex min-h-screen bg-[#fdfafc] w-full">
            
            {/* Sidebar verticale fixe sur PC (Desktop) */}
            <div className="hidden lg:block shrink-0 sticky top-0 h-screen">
              <SalonSidebar
                salonTab={salonTab}
                setSalonTab={setSalonTab}
                appointmentsCount={appointments.length}
                salon={salon}
                currentUser={currentUser}
                logout={logout}
              />
            </div>

            {/* Mobile Drawer (Menu latéral coulissant sur smartphone) */}
            {mobileSidebarOpen && (
              <div className="fixed inset-0 z-50 lg:hidden flex">
                <div 
                  className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs animate-in fade-in"
                  onClick={() => setMobileSidebarOpen(false)}
                />
                <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
                  <SalonSidebar
                    salonTab={salonTab}
                    setSalonTab={setSalonTab}
                    appointmentsCount={appointments.length}
                    salon={salon}
                    currentUser={currentUser}
                    logout={logout}
                    onCloseMobile={() => setMobileSidebarOpen(false)}
                  />
                </div>
              </div>
            )}

            {/* Zone Principale de Travail (Contenu à droite de la Sidebar) */}
            <div className="flex-1 min-w-0 flex flex-col min-h-screen">
              
              {/* Header supérieur épuré */}
              <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                
                {/* Gauche : Bouton Hamburger Mobile + Titre de section */}
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => setMobileSidebarOpen(true)}
                    className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 cursor-pointer"
                    title="Ouvrir le menu"
                  >
                    <Menu className="w-5 h-5" />
                  </button>

                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-950 truncate flex items-center gap-2">
                      {salonTab === 'dashboard' && '🏠 Tableau de bord'}
                      {salonTab === 'planning' && '📅 Planning'}
                      {salonTab === 'crm' && '👥 Clients & Programme Fidélité'}
                      {salonTab === 'pos' && '💰 Caisse POS'}
                      {salonTab === 'inventory' && '📦 Stocks & Vente de Produits'}
                      {salonTab === 'staff' && '🛡️ Équipe & Niveaux d\'Accès'}
                      {salonTab === 'stats' && '📊 Statistiques'}
                      {(salonTab === 'showcase' || salonTab === 'share' || salonTab === 'services') && '🎨 Ma vitrine'}
                      {(salonTab === 'settings' || salonTab === 'subscription') && '⚙️ Paramètres'}
                    </h2>
                  </div>
                </div>

                {/* Droite : Bouton Voir mon site en direct + Nom du salon */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
                      window.open(`${origin}/?salon=${salon?.slug || 'mon-salon'}`, '_blank');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center gap-1.5 border border-pink-200 transition-all cursor-pointer shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Voir ma vitrine ↗</span>
                    <span className="sm:hidden">Vitrine</span>
                  </button>

                  <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[160px]">{salon.name}</span>
                  </div>
                </div>
              </header>

              {/* Bannière d'alerte expiration si les 14 jours sont écoulés */}
              {isSubscriptionExpired && (
                <div className="bg-gradient-to-r from-rose-600 to-amber-600 text-white px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md">
                  <div className="flex items-center gap-2.5 text-xs sm:text-sm font-bold">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-200" />
                    <span>Votre période d'essai de 14 jours est terminée. Activez votre abonnement mensuel (9 900 FCFA) pour débloquer votre agenda et recevoir des réservations.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSalonTab('subscription')}
                    className="px-4 py-1.5 rounded-xl bg-white text-rose-700 hover:bg-rose-50 font-black text-xs shrink-0 transition-all shadow-sm cursor-pointer"
                  >
                    Activer mon abonnement
                  </button>
                </div>
              )}

              {/* Contenu de l'onglet actif */}
              <div className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
                
                {/* Flash Slot Recovery Banner if triggered */}
                <SlotRecoveryBanner />

                {/* Si l'abonnement est expiré et qu'on tente d'accéder aux onglets opérationnels : Écran PAYWALL */}
                {isSubscriptionExpired && salonTab !== 'settings' && salonTab !== 'subscription' ? (
                  <SubscriptionPaywall onGoToSubscription={() => setSalonTab('subscription')} />
                ) : (
                  <>
                    {/* Onglet 1 : Accueil Tableau de Bord */}
                    {salonTab === 'dashboard' && (
                      <DashboardHome onNavigate={(tab) => setSalonTab(tab)} />
                    )}

                    {/* Onglet 2 : Planning Complet */}
                    {salonTab === 'planning' && (
                      <div className="space-y-6">
                        <AppointmentsList />
                      </div>
                    )}

                    {/* Onglet 3 : Clients CRM */}
                    {salonTab === 'crm' && (
                      <div className="space-y-6">
                        <ClientCRMView />
                      </div>
                    )}

                    {/* Onglet 4 : Caisse POS */}
                    {salonTab === 'pos' && (
                      <div className="space-y-6">
                        <PosCashRegister />
                      </div>
                    )}

                    {/* Onglet 4b : Stocks & Inventaire */}
                    {salonTab === 'inventory' && (
                      <div className="space-y-6">
                        <InventoryManager />
                      </div>
                    )}

                    {/* Onglet 4c : Équipe & Droits d'Accès */}
                    {salonTab === 'staff' && (
                      <div className="space-y-6">
                        <StaffManager />
                      </div>
                    )}

                    {/* Onglet 5 : Statistiques & Anti-Lapin */}
                    {salonTab === 'stats' && (
                      <div className="space-y-6">
                        <DashboardMetrics />
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-pink-100 shadow-xs space-y-4">
                          <h3 className="font-black text-slate-950 text-lg">
                            🛡️ Le Système Anti-No-Show Appointfy en action :
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                            <div className="p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                              <span className="font-black text-emerald-900 text-sm block">1. Engagement Financier Immédiat</span>
                              <p className="text-xs text-emerald-800 mt-1.5 leading-relaxed">
                                Chaque cliente s'engage via Wave avant que son créneau soit bloqué. Le taux de présence monte à 94%.
                              </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-rose-50/70 border border-rose-100">
                              <span className="font-black text-rose-900 text-sm block">2. Acompte acquis en cas de lapin</span>
                              <p className="text-xs text-rose-800 mt-1.5 leading-relaxed">
                                Si une cliente ne vient pas, l'acompte est acquis à votre salon pour dédommager le créneau et les produits réservés.
                              </p>
                            </div>
                            <div className="p-5 rounded-2xl bg-pink-50/70 border border-pink-100">
                              <span className="font-black text-pink-900 text-sm block">3. Récupération Flash des créneaux</span>
                              <p className="text-xs text-pink-800 mt-1.5 leading-relaxed">
                                Dès qu'un rendez-vous est annulé, le créneau est instantanément proposé aux clientes sur liste d'attente à Dakar.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Onglet 6 : Ma vitrine (Éditeur + Aperçu Live) */}
                    {(salonTab === 'showcase' || salonTab === 'share' || salonTab === 'services') && (
                      <ClientPreviewEditor />
                    )}

                    {/* Onglet 7 : Paramètres & Abonnement */}
                    {(salonTab === 'settings' || salonTab === 'subscription') && (
                      <SettingsManager defaultSection={salonTab === 'subscription' ? 'subscription' : undefined} />
                    )}
                  </>
                )}

              </div>

            </div>

          </div>
        )}
      </main>

      {/* ================= FOOTER (Uniquement sur SaaS Landing et Dashboard, pas sur la vitrine cliente) ================= */}
      {currentView !== 'auth' && currentView !== 'client' && (
        <footer className="border-t border-pink-100 bg-white py-6 text-center text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p>© 2026 Appointfy — La réservation qui protège votre chiffre d'affaires.</p>
            <div className="flex items-center gap-3 text-[11px] font-bold text-slate-600">
              <span>Paiement Sécurisé Wave</span>
              <span>•</span>
              <span>100% Responsive</span>
              <span>•</span>
              <span>Synchronisation Sécurisée en Direct</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("Erreur capturée:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#fdfafc] flex items-center justify-center p-6 text-center">
          <div className="max-w-xl w-full bg-white p-8 rounded-3xl border border-pink-200 shadow-xl space-y-4 text-left">
            <div className="w-16 h-16 bg-pink-100 text-pink-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
              ✨
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center">Chargement en cours</h2>
            <p className="text-xs text-slate-600 text-center">
              Une petite mise à jour est en train de s'appliquer. Cliquez ci-dessous pour rafraîchir.
            </p>
            {this.state.error && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-800 font-mono overflow-auto max-h-48">
                <strong>{this.state.error.name}:</strong> {this.state.error.message}
              </div>
            )}
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full py-3 px-4 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs transition-colors cursor-pointer shadow-md"
            >
              🔄 Rafraîchir la page
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <BookingProvider>
          <NotificationToast />
          <AppContent />
        </BookingProvider>
      </NotificationProvider>
    </ErrorBoundary>
  );
}
