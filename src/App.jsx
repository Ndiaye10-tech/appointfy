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
import { SubscriptionManager } from './components/salon/SubscriptionManager';
import { SubscriptionPaywall } from './components/salon/SubscriptionPaywall';
import { SuperAdminDashboard } from './components/admin/SuperAdminDashboard';
import { usePWA } from './hooks/usePWA';
import { useNotifications } from './context/NotificationContext';
import { Menu, Eye, MapPin, Clock, Phone, ShieldCheck, Sparkles, LogOut, UserCheck, AlertTriangle, Download, Bell, BellRing, Check } from 'lucide-react';

const AppContent = () => {
  const { currentView, setCurrentView, authMode, step, appointments, salon, currentUser, logout, isSubscriptionExpired, isPlatformAdmin, globalAnnouncement } = useBooking();
  const { isInstallable, isInstalled, isIOS, installApp } = usePWA();
  const { pushPermission, requestPush } = useNotifications();
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
                <div className="relative z-10 w-72 max-w-[85vw] h-full h-[100dvh] bg-white shadow-2xl animate-in slide-in-from-left duration-200 flex flex-col overflow-hidden">
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
                      {salonTab === 'settings' && '⚙️ Paramètres'}
                      {salonTab === 'subscription' && '👑 Abonnement Appointfy'}
                    </h2>
                  </div>
                </div>

                {/* Droite : Bouton Voir mon site en direct + Nom du salon */}
                {/* Droite : Boutons d'Action Pro (Installer App + Notifications) */}
                <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
                  
                  {/* Bouton 1 : Télécharger / Installer l'Application (PWA) */}
                  <button
                    type="button"
                    onClick={installApp}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                      isInstalled
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gradient-to-r from-pink-600 to-rose-600 text-white hover:from-pink-700 hover:to-rose-700 border-transparent shadow-pink-200 hover:scale-[1.02]'
                    }`}
                    title={isInstalled ? "Application installée sur votre appareil" : "Installer Appointfy comme une application mobile"}
                  >
                    {isInstalled ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">App Installée</span>
                        <span className="sm:hidden">Installée</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5 animate-bounce" />
                        <span className="hidden sm:inline">Installer l'App</span>
                        <span className="sm:hidden">Installer</span>
                      </>
                    )}
                  </button>

                  {/* Bouton 2 : Activer les Notifications et Alertes Sonores */}
                  <button
                    type="button"
                    onClick={requestPush}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border ${
                      pushPermission === 'granted'
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                        : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300 animate-pulse'
                    }`}
                    title={pushPermission === 'granted' ? "Notifications push actives" : "Activer les alertes sonores et push de réservation"}
                  >
                    {pushPermission === 'granted' ? (
                      <>
                        <BellRing className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden md:inline">Alertes Actives</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      </>
                    ) : (
                      <>
                        <Bell className="w-3.5 h-3.5 text-amber-600" />
                        <span className="hidden sm:inline">Activer Notifications</span>
                        <span className="sm:hidden">Alertes</span>
                      </>
                    )}
                  </button>

                  <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
                    <span className="font-bold text-slate-700 truncate max-w-[140px]">{salon.name}</span>
                  </div>
                </div>
              </header>

              {/* Bannière de communication globale Super-Admin (synchronisée en direct depuis Supabase) */}
              {globalAnnouncement && (
                <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-purple-200 border-b border-purple-500/30 px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3 text-xs font-semibold animate-in fade-in duration-300">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/30 text-purple-300 text-[10px] font-black uppercase tracking-wider shrink-0">
                      📢 Annonce Plateforme
                    </span>
                    <span className="truncate sm:whitespace-normal">{globalAnnouncement}</span>
                  </div>
                </div>
              )}

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
                                Dès qu'un rendez-vous est annulé, le créneau est instantanément proposé aux clientes sur votre liste d'attente.
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

                    {/* Onglet 7 : Paramètres */}
                    {salonTab === 'settings' && (
                      <SettingsManager />
                    )}

                    {/* Onglet 8 : Abonnement Appointfy Dédié (Direct & Visible) */}
                    {salonTab === 'subscription' && (
                      <div className="space-y-6 animate-in fade-in duration-200">
                        <SubscriptionManager />
                      </div>
                    )}
                  </>
                )}

              </div>

            </div>

          </div>
        )}

        {/* ================= 5. ESPACE SUPER-ADMIN (TOUR DE CONTRÔLE SAAS) ================= */}
        {currentView === 'admin' && isPlatformAdmin && (
          <SuperAdminDashboard />
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
