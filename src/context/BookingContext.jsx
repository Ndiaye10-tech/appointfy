import React, { createContext, useContext, useState, useEffect } from 'react';
import { initialSalon, initialServices, initialAppointments, DEFAULT_PRODUCTS } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { DEFAULT_SCHEDULE, formatScheduleSummary } from '../lib/schedule';
import { BUSINESS_TYPES } from '../data/businessTemplates';

const BookingContext = createContext();

export const useBooking = () => {
  const context = useContext(BookingContext);
  if (!context) {
    return {
      salon: initialSalon,
      services: initialServices,
      appointments: [],
      currentView: 'landing',
      setCurrentView: () => {},
      step: 1,
      setStep: () => {},
      currentUser: null,
      isSubscriptionExpired: false,
      updateSalon: async () => {},
      logout: () => {},
      login: async () => {},
      register: async () => {}
    };
  }
  return context;
};

import { formatFCFA } from '../lib/format';
import { useNotifications } from './NotificationContext';
export { formatFCFA };

export const BookingProvider = ({ children }) => {
  // Notification Hook (Son LOUD + Toast + Push)
  let notifyNewBooking = null;
  try {
    const notifs = useNotifications();
    notifyNewBooking = notifs?.notifyNewBooking;
  } catch (e) {
    // Fallback if rendered outside NotificationProvider
  }

  // Current Auth User with localStorage persistence
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('appointfy_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Navigation State: Si déjà connecté -> direct 'salon', sinon 'landing'
  const [currentView, setCurrentView] = useState(() => {
    try {
      const saved = localStorage.getItem('appointfy_user');
      if (saved && JSON.parse(saved)) {
        return 'salon';
      }
    } catch {
      // fallback
    }
    return 'landing';
  });

  const [authMode, setAuthMode] = useState('register'); // 'register' | 'login'
  const [isRealtimeConnected, setIsRealtimeConnected] = useState(false);
  const [mySalonId, setMySalonId] = useState(() => {
    try {
      const saved = localStorage.getItem('appointfy_my_salon_id');
      return saved || null;
    } catch {
      return null;
    }
  });

  // Persistent Salon Data
  const [salon, setSalon] = useState(() => {
    const saved = localStorage.getItem('appointfy_salon');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...initialSalon,
          ...parsed,
          schedule: parsed.schedule || DEFAULT_SCHEDULE,
          slotInterval: parsed.slotInterval || 45,
          amenities: parsed.amenities || initialSalon.amenities,
          reviews: parsed.reviews || initialSalon.reviews,
          faq: parsed.faq || initialSalon.faq
        };
      } catch {
        return initialSalon;
      }
    }
    return initialSalon;
  });

  const isSalonOwner = Boolean(
    currentUser?.id && (
      (salon?.owner_id && salon.owner_id === currentUser.id) ||
      (mySalonId && salon?.id && mySalonId === salon.id)
    )
  );

  // Reconnaissance du Super-Admin de la Plateforme (mahmoudndiaye100@gmail.com)
  const isPlatformAdmin = Boolean(
    currentUser?.email?.toLowerCase() === 'mahmoudndiaye100@gmail.com' ||
    salon?.owner_email?.toLowerCase() === 'mahmoudndiaye100@gmail.com'
  );

  // Vérification stricte de l'expiration de l'abonnement ou de l'essai 14 jours
  const isSubscriptionExpired = (() => {
    if (!salon?.id) return false;
    // Droits Super Admin à vie : Aucune restriction d'abonnement
    if (isPlatformAdmin) return false;
    
    // 1. Statut explicite 'expired' ou compte désactivé
    if (salon.subscriptionStatus === 'expired') return true;
    if (salon.isSubscriptionActive === false) return true;

    // 2. Si salon en période d'essai gratuit (14 jours)
    if (salon.subscriptionStatus === 'trial' || !salon.subscriptionStatus) {
      const trialTime = salon.trialEndsAt 
        ? new Date(salon.trialEndsAt).getTime() 
        : (salon.subscriptionExpiresAt ? new Date(salon.subscriptionExpiresAt).getTime() : 0);
      if (trialTime && Date.now() > trialTime) {
        return true; // 14 jours écoulés sans paiement -> RESTRICTIONS BLOQUANTES
      }
      return false; // Essai en cours -> accès gratuit sans restriction
    }

    // 3. Si salon abonné payant (30 jours)
    if (salon.subscriptionStatus === 'active') {
      const expTime = salon.subscriptionExpiresAt ? new Date(salon.subscriptionExpiresAt).getTime() : 0;
      if (expTime && Date.now() > expTime) {
        return true; // 30 jours écoulés sans renouvellement -> RESTRICTIONS BLOQUANTES
      }
      return false; // Abonnement actif à jour
    }

    return false;
  })();

  const [services, setServices] = useState(() => {
    const saved = localStorage.getItem('appointfy_services');
    return saved ? JSON.parse(saved) : initialServices;
  });

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('appointfy_appointments');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Nettoyer les anciennes fausses réservations BK-*
        const real = parsed.filter(a => a && a.id && !a.id.startsWith('BK-'));
        return real;
      } catch {
        return [];
      }
    }
    return [];
  });

  // Gestion des Produits & Stocks (Inventory) - 100% réel, aucun produit fictif par défaut
  const [products, setProducts] = useState(() => {
    try {
      const saved = localStorage.getItem('appointfy_products');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Filtrer d'éventuels anciens produits de démo (prod-1, prod-2, etc.)
        const realProducts = Array.isArray(parsed) ? parsed.filter(p => p && p.id && !String(p.id).startsWith('prod-')) : [];
        return realProducts;
      }
      return [];
    } catch {
      return [];
    }
  });

  // Programme de Fidélité Clients (100% réel, zéro fausse cliente)
  const [clientLoyalty, setClientLoyalty] = useState(() => {
    try {
      const saved = localStorage.getItem('appointfy_loyalty');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          delete parsed['221770001122'];
          return parsed;
        }
      }
      return {};
    } catch {
      return {};
    }
  });

  // Membre du personnel actuellement actif (Niveau 1, 2 ou 3)
  const [activeStaffMember, setActiveStaffMember] = useState(() => {
    try {
      const saved = localStorage.getItem('appointfy_active_staff');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Client booking flow state
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("Aujourd'hui");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [clientInfo, setClientInfo] = useState({
    name: '',
    phone: '',
    notes: ''
  });
  const [selectedPractitioner, setSelectedPractitioner] = useState(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [lastBooking, setLastBooking] = useState(null);
  const [slotAlert, setSlotAlert] = useState(null);
  const [globalAnnouncement, setGlobalAnnouncement] = useState(() => {
    return localStorage.getItem('appointfy_global_broadcast') || '';
  });

  // Chargement en direct de l'annonce officielle depuis Supabase
  const fetchGlobalAnnouncement = async () => {
    try {
      const { data, error } = await supabase
        .from('platform_announcements')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        setGlobalAnnouncement(data.message || '');
        if (data.message) {
          localStorage.setItem('appointfy_global_broadcast', data.message);
        } else {
          localStorage.removeItem('appointfy_global_broadcast');
        }
        return data;
      }
    } catch (e) {
      console.warn('Fallback lecture annonce plateforme:', e);
    }
    return null;
  };

  useEffect(() => {
    fetchGlobalAnnouncement();
  }, []);

  // LocalStorage Persistence
  useEffect(() => {
    localStorage.setItem('appointfy_salon', JSON.stringify(salon));
  }, [salon]);

  useEffect(() => {
    localStorage.setItem('appointfy_services', JSON.stringify(services));
  }, [services]);

  useEffect(() => {
    localStorage.setItem('appointfy_appointments', JSON.stringify(appointments));
  }, [appointments]);

  useEffect(() => {
    localStorage.setItem('appointfy_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('appointfy_loyalty', JSON.stringify(clientLoyalty));
  }, [clientLoyalty]);

  useEffect(() => {
    if (activeStaffMember) {
      localStorage.setItem('appointfy_active_staff', JSON.stringify(activeStaffMember));
    } else {
      localStorage.removeItem('appointfy_active_staff');
    }
  }, [activeStaffMember]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('appointfy_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('appointfy_user');
    }
  }, [currentUser]);

  // Listen to Supabase Auth State
  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUser(session.user);
        }
      } catch (e) {
        // Ignored
      }
    };

    checkSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session?.user || null);
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  // Détecter l'ouverture d'un lien salon public (?salon=slug ou /slug)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    let slug = params.get('salon');

    if (!slug) {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      if (path && path !== 'salon' && path !== 'client' && path !== 'auth' && !path.includes('.')) {
        slug = path.replace(/^(reserver|salon)\//, '').split('/')[0];
      }
    }

    if (slug) {
      setCurrentView('client');
      // Charger les données de ce salon depuis Supabase
      const loadSalonFromSlug = async () => {
        try {
          const { data, error } = await supabase
            .from('public_salons')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();

          if (!error && data) {
            setSalon({
              id: data.id,
              name: data.name || 'Salon',
              slug: data.slug || '',
              tagline: data.tagline || '',
              description: data.description || '',
              theme: data.theme || 'pink',
              coverImage: data.cover_image || '',
              coverPosition: data.story?.coverPosition ?? 20,
              coverZoom: data.story?.coverZoom ?? 100,
              coverFit: data.story?.coverFit ?? 'cover',
              avatarImage: data.avatar_image || '',
              phone: data.phone || '',
              whatsapp: data.whatsapp || '',
              instagram: data.instagram || '',
              tiktok: data.tiktok || '',
              facebook: data.facebook || '',
              address: data.address || '',
              hours: data.hours || 'Sur rendez-vous',
              schedule: (() => {
                if (!data.schedule) return null;
                if (typeof data.schedule === 'object') return data.schedule;
                try { return JSON.parse(data.schedule); } catch { return null; }
              })(),
              welcomeMessage: data.welcome_message || '',
              announcementBanner: data.announcement_banner || '',
              gallery: Array.isArray(data.gallery) ? data.gallery : [],
              amenities: Array.isArray(data.amenities) ? data.amenities : [],
              reviews: Array.isArray(data.reviews) ? data.reviews : [],
              faq: Array.isArray(data.faq) ? data.faq : [],
              heroMediaType: data.hero_media_type || 'photo',
              heroVideoUrl: data.hero_video_url || '',
              heroCarousel: Array.isArray(data.hero_carousel) ? data.hero_carousel : [],
              story: (() => {
                if (!data.story) return {};
                if (typeof data.story === 'object') return data.story;
                try { return JSON.parse(data.story); } catch { return {}; }
              })(),
              teamMode: data.team_mode || (Array.isArray(data.team) && data.team.length > 0 ? 'team' : 'solo'),
              team: Array.isArray(data.team) ? data.team : [],
              lookbook: Array.isArray(data.lookbook) ? data.lookbook : [],
              depositRate: data.deposit_rate !== undefined && data.deposit_rate !== null ? Number(data.deposit_rate) : 0.20,
              depositRequired: data.deposit_required !== false,
              depositType: data.deposit_type || 'rate',
              depositFixedAmount: data.deposit_fixed_amount || 2000,
              country: data.country || 'SN',
              currency: data.currency || 'FCFA',
              businessType: data.business_type || 'hair_braids',
              workMode: data.work_mode || 'salon',
              bookingPolicy: data.booking_policy || 'deposit',
              waveNumber: data.wave_number || data.phone || '',
              notificationSettings: data.notification_settings || {},
              policyCancellation: data.policy_cancellation || "Annulation sans frais possible jusqu'à 24h avant le rendez-vous.",
              subscriptionStatus: data.subscription_status || 'trial',
              subscriptionExpiresAt: data.subscription_expires_at || null,
              trialEndsAt: data.trial_ends_at || data.subscription_expires_at || null,
              isSubscriptionActive: data.is_subscription_active !== false
            });

            // Charger les prestations depuis la vue publique sécurisée
            if (data.id) {
              const { data: salonServices, error: srvErr } = await supabase
                .from('public_services')
                .select('*')
                .eq('salon_id', data.id);

              if (srvErr) {
                console.warn('Erreur chargement prestations publiques:', srvErr);
              }

              const servicesList = Array.isArray(salonServices) ? [...salonServices] : [];
              // Tri sécurisé en mémoire sans dépendance à une colonne spécifique
              servicesList.sort((a, b) => {
                if (a.created_at && b.created_at) return new Date(a.created_at) - new Date(b.created_at);
                return (Number(a.price) || 0) - (Number(b.price) || 0);
              });

              setServices(servicesList.map(s => ({
                ...s,
                imageUrl: s.image_url || s.imageUrl || ''
              })));
            }
              // Charger les créneaux occupés pour le calcul de disponibilité (Directement depuis appointments)
              try {
                const { data: occupiedSlots, error: occErr } = await supabase
                  .from('appointments')
                  .select('id, date, date_formatted, time_slot, duration, status, is_blocked, practitioner_name, expires_at')
                  .eq('salon_id', data.id)
                  .in('status', ['confirmed', 'completed', 'blocked', 'pending']);

                if (!occErr && occupiedSlots) {
                  setAppointments(occupiedSlots.map(s => ({
                    id: s.id || `occ_${s.date}_${s.time_slot}`,
                    date: s.date,
                    dateStr: s.date || s.date_formatted,
                    dateFormatted: s.date_formatted || s.date,
                    timeSlot: s.time_slot,
                    duration: s.duration || '',
                    status: s.status,
                    expiresAt: s.expires_at,
                    isBlocked: s.is_blocked || s.status === 'blocked',
                    practitionerName: s.practitioner_name || s.practitionerName || null
                  })));
                }
              } catch (e) {
                console.warn('Erreur chargement créneaux occupés:', e);
              }
            }
        } catch (err) {
          console.warn('Erreur chargement salon par URL:', err);
        }
      };
      loadSalonFromSlug();
    }
  }, []);

  // Sync with Supabase on mount
  useEffect(() => {
    const syncWithSupabase = async () => {
      // Isolation multi-tenant : Ne jamais synchroniser si aucun utilisateur connecté
      if (!currentUser?.id) return;

      try {
        // 1. Charger STRICTEMENT le salon de l'utilisateur connecté via owner_id
        const { data: mySalon, error: salonErr } = await supabase
          .from('salons')
          .select('*')
          .eq('owner_id', currentUser.id)
          .maybeSingle();

        if (salonErr || !mySalon) {
          console.warn('Aucun salon trouvé pour cet utilisateur connecté.');
          return;
        }

        const currentSalonId = mySalon.id;
        setMySalonId(mySalon.id);
        localStorage.setItem('appointfy_my_salon_id', mySalon.id);

        // Si l'utilisateur consulte un AUTRE salon public via l'URL (?salon=... ou /reserver/...),
        // ne pas écraser les données du salon consulté par les données du gérant connecté
        const urlParams = new URLSearchParams(window.location.search);
        let urlSlug = urlParams.get('salon');
        if (!urlSlug && typeof window !== 'undefined') {
          const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
          if (path && path !== 'salon' && path !== 'client' && path !== 'auth' && !path.includes('.')) {
            urlSlug = path.replace(/^(reserver|salon)\//, '').split('/')[0];
          }
        }
        if (urlSlug && mySalon.slug && urlSlug !== mySalon.slug) {
          return;
        }

        // 2. Mettre à jour les données du salon : ISOLATION STRICTE SANS AUCUN HÉRITAGE DE DONNÉES RÉSIDUELLES
        setSalon({
          id: mySalon.id,
          name: mySalon.name || '',
          owner_name: mySalon.owner_name || '',
          slug: mySalon.slug || '',
          tagline: mySalon.tagline || '',
          description: mySalon.description || '',
          address: mySalon.address || '',
          city: mySalon.city || '',
          country: mySalon.country || 'SN',
          business_type: mySalon.business_type || 'beauty_studio',
          work_mode: mySalon.work_mode || 'salon',
          phone: mySalon.phone || '',
          whatsapp: mySalon.whatsapp || '',
          wave_number: mySalon.wave_number || mySalon.phone || '',
          hours: mySalon.hours || 'Ouvert 7j/7',
          schedule: mySalon.schedule || DEFAULT_SCHEDULE,
          slotInterval: mySalon.slot_interval || 45,
          coverImage: mySalon.cover_image || '',
          coverPosition: mySalon.story?.coverPosition ?? 20,
          coverZoom: mySalon.story?.coverZoom ?? 100,
          coverFit: mySalon.story?.coverFit ?? 'cover',
          avatarImage: mySalon.avatar_image || '',
          theme: mySalon.theme || 'pink',
          gallery: Array.isArray(mySalon.gallery) ? mySalon.gallery : [],
          welcomeMessage: mySalon.welcome_message || '',
          announcementBanner: mySalon.announcement_banner || '',
          instagram: mySalon.instagram || '',
          tiktok: mySalon.tiktok || '',
          facebook: mySalon.facebook || '',
          amenities: Array.isArray(mySalon.amenities) ? mySalon.amenities : [],
          reviews: Array.isArray(mySalon.reviews) ? mySalon.reviews : [],
          faq: Array.isArray(mySalon.faq) ? mySalon.faq : [],
          heroMediaType: mySalon.hero_media_type || 'photo',
          heroVideoUrl: mySalon.hero_video_url || '',
          heroCarousel: Array.isArray(mySalon.hero_carousel) ? mySalon.hero_carousel : [],
          story: (mySalon.story && typeof mySalon.story === 'object') ? mySalon.story : null,
          teamMode: mySalon.team_mode || 'solo',
          team: Array.isArray(mySalon.team) ? mySalon.team : [],
          lookbook: Array.isArray(mySalon.lookbook) ? mySalon.lookbook : [],
          depositRate: Number(mySalon.deposit_rate ?? 0.20),
          policyCancellation: mySalon.policy_cancellation || "Annulation sans frais possible jusqu'à 24h avant le rendez-vous.",
          depositRequired: mySalon.notification_settings?.depositRequired ?? true,
          depositType: mySalon.notification_settings?.depositType || 'rate',
          depositFixedAmount: Number(mySalon.notification_settings?.depositFixedAmount ?? 2000),
          minLeadHours: Number(mySalon.notification_settings?.minLeadHours ?? 2),
          latenessTolerance: Number(mySalon.notification_settings?.latenessTolerance ?? 15),
          acceptCash: mySalon.notification_settings?.acceptCash ?? true,
          acceptWave: mySalon.notification_settings?.acceptWave ?? true,
          paymentRecipientPhone: mySalon.notification_settings?.paymentRecipientPhone || mySalon.phone || '',
          sendDigitalReceipt: mySalon.notification_settings?.sendDigitalReceipt ?? true,
          whatsappConfirmEnabled: mySalon.notification_settings?.whatsappConfirmEnabled ?? true,
          whatsappReminderEnabled: mySalon.notification_settings?.whatsappReminderEnabled ?? true,
          whatsappTemplate: mySalon.notification_settings?.whatsappTemplate || "Bonjour {nom_cliente} ! Votre rendez-vous pour {prestation} chez {nom_salon} est confirmé pour le {date} à {heure}. Acompte Wave validé. Merci et à très vite !",
          subscriptionStatus: mySalon.subscription_status || 'trial',
          subscriptionPrice: 9900,
          subscriptionExpiresAt: mySalon.subscription_expires_at || mySalon.trial_ends_at,
          trialEndsAt: mySalon.trial_ends_at,
          isSubscriptionActive: mySalon.is_subscription_active !== false,
          lastSubscriptionPaymentAt: mySalon.last_subscription_payment_at || null,
          lastSubscriptionRef: mySalon.last_subscription_ref || null
        });

        // 3. Charger les rendez-vous STRICTEMENT filtrés par salon_id (Uniquement RDV confirmés ou bloqués)
        // RÈGLE ABSOLUE : Les réservations 'pending' (non payées) ou 'expired' ne sont JAMAIS chargées
        const { data: remoteAppointments, error: apptErr } = await supabase
          .from('appointments')
          .select('*')
          .eq('salon_id', currentSalonId)
          .in('status', ['confirmed', 'completed', 'no_show', 'blocked'])
          .order('created_at', { ascending: false });

        if (!apptErr && remoteAppointments) {
          const formatted = remoteAppointments.map(a => ({
            id: a.id,
            clientName: a.client_name,
            clientPhone: a.client_phone,
            serviceName: a.service_name,
            date: a.date,
            dateStr: a.date || a.date_formatted,
            dateFormatted: a.date_formatted || a.date,
            timeSlot: a.time_slot,
            price: a.price,
            depositPaid: a.deposit_paid,
            remainingBalance: a.remaining_balance,
            paymentMethod: a.payment_method,
            practitionerName: a.practitioner_name || a.practitionerName || '',
            isBlocked: a.is_blocked || a.isBlocked || a.status === 'blocked',
            duration: a.duration || '',
            status: a.status,
            expiresAt: a.expires_at,
            notes: a.notes,
            createdAt: a.created_at
          }));
          setAppointments(formatted);
        } else {
          setAppointments([]);
        }

        // 4. Charger les prestations STRICTEMENT filtrées par salon_id
        const { data: remoteServices, error: servErr } = await supabase
          .from('services')
          .select('*')
          .eq('salon_id', currentSalonId)
          .order('created_at', { ascending: true });

        if (!servErr && remoteServices) {
          setServices(remoteServices.map(s => ({
            ...s,
            imageUrl: s.image_url || s.imageUrl || ''
          })));
        } else {
          setServices([]);
        }

        // 5. Charger les produits et stocks
        try {
          const { data: remoteProducts, error: prodErr } = await supabase
            .from('products')
            .select('*')
            .eq('salon_id', currentSalonId)
            .order('created_at', { ascending: false });

          if (!prodErr && remoteProducts && remoteProducts.length > 0) {
            setProducts(remoteProducts.map(p => ({
              id: p.id,
              name: p.name,
              category: p.category || 'Général',
              price: Number(p.price) || 0,
              cost_price: Number(p.cost_price) || 0,
              stock_quantity: Number(p.stock_quantity) || 0,
              alert_threshold: Number(p.alert_threshold) || 3,
              is_retail: p.is_retail !== false,
              sku: p.sku || ''
            })));
          }
        } catch (e) {
          // Table optionnelle si non encore exécutée
        }

        // 6. Charger le programme de fidélité
        try {
          const { data: remoteLoyalty, error: loyErr } = await supabase
            .from('client_loyalty')
            .select('*')
            .eq('salon_id', currentSalonId);

          if (!loyErr && remoteLoyalty && remoteLoyalty.length > 0) {
            const loyaltyMap = {};
            remoteLoyalty.forEach(l => {
              const target = Number(salon?.loyalty_target_visits) || 5;
              const visits = Number(l.visits_count) || (Number(l.points_balance) > 0 ? Math.min(target, Math.floor(Number(l.points_balance) / 50)) : 0);
              loyaltyMap[l.client_phone] = {
                pointsBalance: Number(l.points_balance) || 0,
                visitsCount: visits,
                rewardsEarned: Number(l.rewards_earned) || 0,
                rewardsPending: Number(l.rewards_pending) || (visits >= target ? 1 : 0),
                totalEarned: Number(l.total_points_earned) || 0,
                totalSpent: Number(l.total_points_spent) || 0,
                history: Array.isArray(l.history) ? l.history : []
              };
            });
            setClientLoyalty(loyaltyMap);
          }
        } catch (e) {
          // Table optionnelle
        }
      } catch (err) {
        console.warn('Erreur synchronisation Supabase:', err);
      }
    };

    syncWithSupabase();
  }, [currentUser?.id]);

  // Écoute 100% TEMPS RÉEL Supabase Realtime (Salons, Rendez-vous, Prestations)
  useEffect(() => {
    if (!salon?.id) return;

    // 1. Canal TEMPS RÉEL pour le profil du Salon (nom, adresse, téléphone, photos, horaires, etc.)
    const salonChannel = supabase
      .channel(`salon-realtime-${salon.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'salons',
          filter: `id=eq.${salon.id}`
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            const s = payload.new;
            setSalon(prev => {
              if (!prev || prev.id !== s.id) return prev;
              const next = {
                ...prev,
                name: s.name ?? prev.name,
                owner_name: s.owner_name ?? prev.owner_name,
                address: s.address ?? prev.address,
                city: s.city ?? prev.city,
                phone: s.phone ?? prev.phone,
                whatsapp: s.whatsapp ?? prev.whatsapp,
                wave_number: s.wave_number ?? prev.wave_number,
                tagline: s.tagline ?? prev.tagline,
                description: s.description ?? prev.description,
                hours: s.hours ?? prev.hours,
                cover_image: s.cover_image ?? prev.cover_image,
                coverImage: s.cover_image ?? prev.coverImage,
                coverPosition: s.story?.coverPosition ?? prev.coverPosition,
                coverZoom: s.story?.coverZoom ?? prev.coverZoom,
                coverFit: s.story?.coverFit ?? prev.coverFit,
                avatar_image: s.avatar_image ?? prev.avatar_image,
                avatarImage: s.avatar_image ?? prev.avatarImage,
                theme: s.theme ?? prev.theme,
                gallery: Array.isArray(s.gallery) ? s.gallery : prev.gallery,
                welcome_message: s.welcome_message ?? prev.welcome_message,
                welcomeMessage: s.welcome_message ?? prev.welcomeMessage,
                announcement_banner: s.announcement_banner ?? prev.announcement_banner,
                announcementBanner: s.announcement_banner ?? prev.announcementBanner,
                deposit_rate: s.deposit_rate ?? prev.deposit_rate,
                depositRate: s.deposit_rate !== undefined ? Number(s.deposit_rate) : prev.depositRate,
                notification_settings: s.notification_settings ?? prev.notification_settings,
                schedule: s.schedule ?? prev.schedule,
                policy_cancellation: s.policy_cancellation ?? prev.policy_cancellation,
                policyCancellation: s.policy_cancellation ?? prev.policyCancellation
              };
              if (typeof window !== 'undefined' && prev.owner_id === currentUser?.id) {
                localStorage.setItem('appointfy_salon', JSON.stringify(next));
              }
              return next;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsRealtimeConnected(true);
        }
      });

    // 2. Canal TEMPS RÉEL pour les Rendez-vous et Créneaux (Appointments)
    const appointmentsChannel = supabase
      .channel(`appts-realtime-${salon.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'appointments',
          filter: `salon_id=eq.${salon.id}`
        },
        (payload) => {
          // A. Suppression immédiate en temps réel (créneau débloqué ou RDV annulé)
          if (payload.eventType === 'DELETE') {
            const deletedId = payload.old?.id;
            if (deletedId) {
              setAppointments(prev => prev.filter(item => item.id !== deletedId));
            }
            return;
          }

          const a = payload.new;
          if (!a) return;

          // B. Annulation ou expiration : libère le créneau instantanément en temps réel
          if (a.status === 'expired' || a.status === 'cancelled') {
            setAppointments(prev => prev.filter(item => item.id !== a.id));
            return;
          }

          // C. Pour la gérante connectée : les paiements en cours (pending) n'apparaissent pas encore
          if (a.status === 'pending' && isSalonOwner) {
            setAppointments(prev => prev.filter(item => item.id !== a.id));
            return;
          }

          // D. RDV confirmés, complétés, bloqués (ou pending pour les clientes qui choisissent leur créneau)
          setAppointments(prev => {
            const exists = prev.some(item => item.id === a.id);

            const formatted = {
              id: a.id,
              clientName: a.client_name || 'Nouvelle Cliente',
              clientPhone: a.client_phone || '',
              serviceName: a.service_name || 'Prestation',
              date: a.date,
              dateStr: a.date || a.date_formatted,
              dateFormatted: a.date_formatted || a.date,
              timeSlot: a.time_slot,
              price: a.price || 0,
              depositPaid: a.deposit_paid || 0,
              remainingBalance: a.remaining_balance || 0,
              paymentMethod: a.payment_method || 'Wave',
              practitionerName: a.practitioner_name || '',
              isBlocked: a.is_blocked || a.status === 'blocked',
              duration: a.duration || '',
              status: a.status || 'confirmed',
              notes: a.notes || '',
              createdAt: a.created_at || new Date().toISOString()
            };

            // Alerte sonore et visuelle UNIQUEMENT pour la gérante connectée lors d'un nouveau RDV confirmé
            if (isSalonOwner && !exists && notifyNewBooking && !formatted.isBlocked && formatted.status === 'confirmed') {
              notifyNewBooking(formatted);
            }

            if (exists) {
              return prev.map(item => item.id === a.id ? formatted : item);
            }
            return [formatted, ...prev];
          });
        }
      )
      .subscribe();

    // 3. Canal TEMPS RÉEL pour les Prestations du Salon (Services)
    const servicesChannel = supabase
      .channel(`services-realtime-${salon.id}-${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'services',
          filter: `salon_id=eq.${salon.id}`
        },
        async (payload) => {
          // Mise à jour optimiste immédiate en temps réel (0 milliseconde)
          if (payload.eventType === 'DELETE') {
            const delId = payload.old?.id;
            if (delId) {
              setServices(prev => prev.filter(s => s.id !== delId));
            }
          } else if (payload.eventType === 'INSERT' && payload.new) {
            const s = payload.new;
            setServices(prev => {
              if (prev.some(item => item.id === s.id)) return prev;
              return [...prev, { ...s, imageUrl: s.image_url || s.imageUrl || '' }];
            });
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const s = payload.new;
            setServices(prev => prev.map(item => item.id === s.id ? { ...s, imageUrl: s.image_url || s.imageUrl || '' } : item));
          }

          // Rafraîchissement complet en arrière-plan pour synchronisation parfaite
          try {
            const { data: updatedServices } = await supabase
              .from('services')
              .select('*')
              .eq('salon_id', salon.id)
              .order('created_at', { ascending: true });
            if (updatedServices) {
              setServices(updatedServices.map(s => ({
                ...s,
                imageUrl: s.image_url || s.imageUrl || ''
              })));
            }
          } catch (err) {
            console.warn('Erreur rafraîchissement temps réel prestations:', err);
          }
        }
      )
      .subscribe();

    return () => {
      setIsRealtimeConnected(false);
      supabase.removeChannel(salonChannel);
      supabase.removeChannel(appointmentsChannel);
      supabase.removeChannel(servicesChannel);
    };
  }, [salon?.id, isSalonOwner, notifyNewBooking]);

  // Update Salon profile & aesthetics directly to Supabase
  const updateSalon = async (updates) => {
    if (updates.schedule && !updates.hours) {
      updates.hours = formatScheduleSummary(updates.schedule);
    }
    setSalon(prev => {
      const next = { ...prev, ...updates };
      localStorage.setItem('appointfy_salon', JSON.stringify(next));
      return next;
    });

    try {
      const payload = {};
      if (updates.name !== undefined) payload.name = updates.name;
      if (updates.owner_name !== undefined) payload.owner_name = updates.owner_name;
      if (updates.ownerName !== undefined) payload.owner_name = updates.ownerName;
      if (updates.tagline !== undefined) payload.tagline = updates.tagline;
      if (updates.description !== undefined) payload.description = updates.description;
      if (updates.address !== undefined) payload.address = updates.address;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.country !== undefined) payload.country = updates.country;
      if (updates.business_type !== undefined) payload.business_type = updates.business_type;
      if (updates.work_mode !== undefined) payload.work_mode = updates.work_mode;
      if (updates.phone !== undefined) payload.phone = updates.phone;
      if (updates.whatsapp !== undefined) payload.whatsapp = updates.whatsapp;
      if (updates.wave_number !== undefined) payload.wave_number = updates.wave_number;
      if (updates.hours !== undefined) payload.hours = updates.hours;
      if (updates.coverImage !== undefined) payload.cover_image = updates.coverImage;
      if (updates.avatarImage !== undefined) payload.avatar_image = updates.avatarImage;
      if (updates.theme !== undefined) payload.theme = updates.theme;
      if (updates.gallery !== undefined) payload.gallery = updates.gallery;
      if (updates.welcomeMessage !== undefined) payload.welcome_message = updates.welcomeMessage;
      if (updates.announcementBanner !== undefined) payload.announcement_banner = updates.announcementBanner;
      if (updates.instagram !== undefined) payload.instagram = updates.instagram;
      if (updates.tiktok !== undefined) payload.tiktok = updates.tiktok;
      if (updates.facebook !== undefined) payload.facebook = updates.facebook;
      if (updates.policyCancellation !== undefined) payload.policy_cancellation = updates.policyCancellation;
      if (updates.depositRate !== undefined) payload.deposit_rate = Number(updates.depositRate);
      if (updates.amenities !== undefined) payload.amenities = updates.amenities;
      if (updates.reviews !== undefined) payload.reviews = updates.reviews;
      if (updates.faq !== undefined) payload.faq = updates.faq;
      if (updates.heroMediaType !== undefined) payload.hero_media_type = updates.heroMediaType;
      if (updates.heroVideoUrl !== undefined) payload.hero_video_url = updates.heroVideoUrl;
      if (updates.heroCarousel !== undefined) payload.hero_carousel = updates.heroCarousel;
      if (updates.story !== undefined || updates.coverPosition !== undefined || updates.coverZoom !== undefined || updates.coverFit !== undefined) {
        const currentStory = (typeof updates.story === 'object' && updates.story !== null) ? updates.story : (salon?.story || {});
        payload.story = {
          ...currentStory,
          coverPosition: updates.coverPosition !== undefined ? updates.coverPosition : (currentStory.coverPosition ?? salon?.coverPosition ?? 20),
          coverZoom: updates.coverZoom !== undefined ? updates.coverZoom : (currentStory.coverZoom ?? salon?.coverZoom ?? 100),
          coverFit: updates.coverFit !== undefined ? updates.coverFit : (currentStory.coverFit ?? salon?.coverFit ?? 'cover')
        };
      }
      if (updates.team !== undefined) payload.team = updates.team;
      if (updates.teamMode !== undefined) payload.team_mode = updates.teamMode;
      if (updates.lookbook !== undefined) payload.lookbook = updates.lookbook;
      if (updates.manager_pin !== undefined) payload.manager_pin = updates.manager_pin;

      // Always resolve target salon ID
      let targetId = salon?.id || updates.id || mySalonId;
      if (!targetId && currentUser?.id) {
        const { data: s } = await supabase.from('salons').select('id').eq('owner_id', currentUser.id).maybeSingle();
        if (s?.id) targetId = s.id;
      }
      if (!targetId) {
        console.error('updateSalon : aucun salon_id fourni.');
        return;
      }

      // Handle extended settings inside notification_settings JSONB
      const extendedKeys = [
        'depositRequired', 'depositType', 'depositFixedAmount', 'minLeadHours', 'latenessTolerance',
        'acceptCash', 'acceptWave', 'paymentRecipientPhone', 'sendDigitalReceipt',
        'whatsappConfirmEnabled', 'whatsappReminderEnabled', 'whatsappReminderHours', 'whatsappTemplate'
      ];
      const hasExtendedKeys = extendedKeys.some(k => updates[k] !== undefined);
      if (hasExtendedKeys) {
        let currentNotif = {};
        const { data: currentRecord } = await supabase
          .from('salons')
          .select('notification_settings')
          .eq('id', targetId)
          .maybeSingle();
        if (currentRecord?.notification_settings && typeof currentRecord.notification_settings === 'object') {
          currentNotif = currentRecord.notification_settings;
        }
        const updatedNotif = { ...currentNotif };
        extendedKeys.forEach(k => {
          if (updates[k] !== undefined) {
            updatedNotif[k] = updates[k];
          }
        });
        payload.notification_settings = updatedNotif;
      }

      if (targetId) {
        // Try saving with schedule column if available
        let fullPayload = { ...payload };
        if (updates.schedule !== undefined) fullPayload.schedule = updates.schedule;
        if (updates.slotInterval !== undefined) fullPayload.slot_interval = updates.slotInterval;

        const { error: fullError } = await supabase.from('salons').update(fullPayload).eq('id', targetId);
        if (fullError) {
          // If schedule column not yet in DB, fallback to basic payload
          const { error: fallbackError } = await supabase.from('salons').update(payload).eq('id', targetId);
          if (fallbackError) {
            console.warn('Supabase update fallback error:', fallbackError.message);
            throw fallbackError;
          }
        }
      }
    } catch (err) {
      console.warn('Sync salon to Supabase warning:', err);
      throw err;
    }
  };

  // Onboarding complet : enregistrement du salon et injection des prestations du métier
  const completeOnboarding = async (onboardingData) => {
    try {
      const trialEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const currentUserId = currentUser?.id || onboardingData.owner_id || null;

      const resolvedAddress = (onboardingData.address || onboardingData.city || '').trim();
      const resolvedCity = (onboardingData.city || onboardingData.address || '').trim();

      // Payload pour un nouveau salon 100% propre (page vierge sans AUCUNE donnée factice)
      const cleanPayload = {
        name: onboardingData.name,
        slug: onboardingData.slug,
        phone: onboardingData.phone,
        whatsapp: onboardingData.whatsapp,
        city: resolvedCity,
        address: resolvedAddress,
        tagline: '',
        description: '',
        owner_name: onboardingData.owner_name || '',
        owner_id: currentUserId,
        country: onboardingData.country || 'SN',
        currency: 'FCFA',
        business_type: onboardingData.business_type || 'hair_braids',
        work_mode: onboardingData.work_mode || 'salon',
        booking_policy: onboardingData.booking_policy || (onboardingData.deposit_required !== false ? 'deposit' : 'instant'),
        wave_number: onboardingData.wave_number || onboardingData.phone,
        deposit_required: onboardingData.deposit_required !== false,
        deposit_rate: onboardingData.deposit_rate ?? 0.20,
        deposit_type: onboardingData.deposit_type || 'rate',
        deposit_fixed_amount: onboardingData.deposit_fixed || 2000,
        onboarding_completed: true,
        cover_image: null,
        avatar_image: null,
        gallery: [],
        story: null,
        reviews: [],
        faq: [],
        team: [],
        lookbook: [],
        amenities: [],
        welcome_message: '',
        announcement_banner: '',
        subscription_status: 'trial',
        trial_ends_at: trialEnd,
        subscription_expires_at: trialEnd,
        subscription_price: 9900,
        notification_settings: {
          owner_name: onboardingData.owner_name || '',
          business_type: onboardingData.business_type || 'hair_braids',
          work_mode: onboardingData.work_mode || 'salon',
          wave_number: onboardingData.wave_number || onboardingData.phone,
          country: onboardingData.country || 'SN',
          depositRequired: onboardingData.deposit_required !== false,
          depositType: onboardingData.deposit_type || 'rate',
          depositFixedAmount: onboardingData.deposit_fixed || 2000,
          paymentRecipientPhone: onboardingData.wave_number || onboardingData.phone,
          acceptCash: true,
          acceptWave: true,
          sound_enabled: true,
          sound_preset: 'cash',
          push_enabled: true,
          in_app_alerts: true,
          whatsappConfirmEnabled: true,
          whatsappReminderEnabled: true
        }
      };

      // 1. Création atomique via RPC PostgreSQL 'onboard_new_salon' (sans AUCUNE prestation pré-remplie)
      let savedSalon = null;

      try {
        const { data: rpcData, error: rpcError } = await supabase.rpc('onboard_new_salon', {
          p_salon: cleanPayload,
          p_services: [] // 100% propre : aucune prestation injectée d'office
        });

        if (!rpcError && rpcData && rpcData.id) {
          savedSalon = rpcData;
        }
      } catch (rpcErr) {
        console.warn('RPC onboard_new_salon fallback:', rpcErr);
      }

      // 2. Repli standard si la fonction RPC n'est pas encore disponible
      if (!savedSalon) {
        const { data, error } = await supabase
          .from('salons')
          .insert([cleanPayload])
          .select()
          .maybeSingle();

        if (!error && data) {
          savedSalon = data;
        } else {
          console.warn('Tentative insertion standard échouée, repli sans owner_name:', error);
          const fallbackPayload = { ...cleanPayload };
          delete fallbackPayload.owner_name;
          const { data: fbData, error: fbError } = await supabase
            .from('salons')
            .insert([fallbackPayload])
            .select()
            .single();

          if (fbError) {
            console.error('Erreur insertion salon dans Supabase:', fbError);
            throw new Error(`Impossible d'enregistrer votre salon : ${fbError.message}`);
          }
          savedSalon = fbData;
        }
      }

      const effectiveSalon = savedSalon;
      setSalon({
        ...effectiveSalon,
        address: effectiveSalon.address || resolvedAddress,
        city: effectiveSalon.city || resolvedCity,
        coverImage: '',
        avatarImage: '',
        gallery: [],
        reviews: [],
        faq: [],
        amenities: [],
        story: null,
        owner_name: onboardingData.owner_name || effectiveSalon.owner_name || '',
        country: effectiveSalon.country || 'SN',
        currency: effectiveSalon.currency || 'FCFA',
        business_type: effectiveSalon.business_type || 'hair_braids',
        work_mode: effectiveSalon.work_mode || 'salon',
        booking_policy: effectiveSalon.booking_policy || 'deposit',
        wave_number: effectiveSalon.wave_number || effectiveSalon.phone,
        depositRate: effectiveSalon.deposit_rate,
        depositRequired: effectiveSalon.notification_settings?.depositRequired ?? true,
        depositType: effectiveSalon.notification_settings?.depositType || 'rate',
        depositFixedAmount: effectiveSalon.notification_settings?.depositFixedAmount || 2000,
        paymentRecipientPhone: effectiveSalon.notification_settings?.paymentRecipientPhone || effectiveSalon.phone
      });

      // 3. Salon 100% vierge : aucune prestation factice ou imposée
      setServices([]);
      localStorage.setItem('appointfy_services', JSON.stringify([]));

      if (effectiveSalon.id) {
        setMySalonId(effectiveSalon.id);
        localStorage.setItem('appointfy_my_salon_id', effectiveSalon.id);
      }

      return effectiveSalon;
    } catch (err) {
      console.error('Error completing onboarding:', err);
      throw err;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // Ignored
    }
    localStorage.removeItem('appointfy_user');
    localStorage.removeItem('appointfy_salon');
    localStorage.removeItem('appointfy_appointments');
    localStorage.removeItem('appointfy_services');
    localStorage.removeItem('appointfy_my_salon_id');
    setCurrentUser(null);
    setMySalonId(null);
    setSalon(initialSalon);
    setAppointments([]);
    setServices([]);
    setCurrentView('landing');
  };

  // Flow actions
  const selectService = (service) => {
    setSelectedService(service);
    const hasTeam = (salon?.teamMode === 'team' || salon?.team_mode === 'team') && Array.isArray(salon?.team) && salon.team.length > 1;
    if (!hasTeam) {
      setSelectedPractitioner(null);
    }
    setStep(2);
  };

  const [selectedDateStr, setSelectedDateStr] = useState('');

  const selectSlot = (date, slot, dateStr = null) => {
    setSelectedDate(date);
    setSelectedSlot(slot);
    if (dateStr) setSelectedDateStr(dateStr);
    const hasTeam = (salon?.teamMode === 'team' || salon?.team_mode === 'team') && Array.isArray(salon?.team) && salon.team.length > 1;
    setStep(hasTeam ? 4 : 3);
  };

  const updateClientInfo = (field, value) => {
    setClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const proceedToPayment = () => {
    if (!clientInfo.name || !clientInfo.phone) return false;
    const deposit = Number(selectedService?.deposit) || 0;
    if (deposit <= 0) {
      // Prestation sans acompte : validation directe et instantanée !
      completePayment('Sur place (Sans acompte)');
      return true;
    }
    setIsPaymentModalOpen(true);
    return true;
  };

  const createPendingBooking = async (paymentMethod = 'Wave') => {
    if (isSubscriptionExpired) {
      throw new Error("Les réservations en ligne pour ce salon sont temporairement en pause. Veuillez contacter directement le salon.");
    }

    const newId = 'AL-' + Math.floor(1000 + Math.random() * 9000);
    const price = Number(selectedService?.price) || 0;
    const depositPaid = Math.max(0, Number(selectedService?.deposit) || 0);
    const remainingBalance = Math.max(0, price - depositPaid);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    const dateFormatted = selectedDateStr || selectedDate;
    const salonCountry = (salon?.country || 'SN').toUpperCase();
    const paymentProvider = salonCountry === 'CI' ? 'paystack' : (paymentMethod.toLowerCase().includes('wave') ? 'wave' : 'geniuspay');

    const pendingItem = {
      id: newId,
      salon_id: salon.id || null,
      country: salonCountry,
      currency: 'FCFA',
      payment_provider: paymentProvider,
      client_name: clientInfo.name,
      client_phone: clientInfo.phone,
      service_id: selectedService?.id || null,
      service_name: selectedService?.name || 'Prestation',
      date: dateFormatted,
      date_formatted: selectedDate,
      time_slot: selectedSlot,
      duration: selectedService?.duration || '45 min',
      price: price,
      deposit_paid: depositPaid,
      remaining_balance: remainingBalance,
      payment_method: paymentMethod,
      status: 'pending',
      expires_at: expiresAt,
      practitioner_name: selectedPractitioner?.name || null,
      notes: clientInfo.notes || ''
    };

    const { error } = await supabase.from('appointments').insert([pendingItem]);
    if (error) {
      console.error('Erreur verrouillage pending:', error);
      if (error.code === '23505') {
        throw new Error("Ce créneau horaire vient d'être réservé par un autre client. Veuillez sélectionner un autre horaire.");
      }
      throw new Error(error.message || "Impossible de réserver temporairement ce créneau.");
    }

    // Le créneau est verrouillé en base dans Supabase pendant 15 min (idx_unique_confirmed_or_pending_slot)
    // MAIS il n'est PAS ajouté au dashboard du salon tant que le paiement n'est pas validé par GeniusPay !

    return { id: newId, expiresAt };
  };

  const cancelPendingBooking = async (appointmentId) => {
    if (!appointmentId) return;
    try {
      await supabase
        .from('appointments')
        .update({ status: 'expired' })
        .eq('id', appointmentId)
        .eq('status', 'pending');
    } catch (e) {
      console.warn('Erreur annulation pending:', e);
    }
    setAppointments(prev => prev.filter(a => a.id !== appointmentId));
  };

  const confirmPendingBooking = async (appointmentId, paymentMethod = 'Wave', customRef = null) => {
    if (isSalonOwner) return;
    const ref = customRef || (
      paymentMethod === 'Wave' 
        ? 'WV-' + Math.floor(1000000 + Math.random() * 9000000)
        : 'DIR-' + Math.floor(1000000 + Math.random() * 9000000)
    );

    const price = Number(selectedService?.price) || 0;
    const depositPaid = Math.max(0, Number(selectedService?.deposit) || 0);
    const remainingBalance = Math.max(0, price - depositPaid);
    const salonCountry = (salon?.country || 'SN').toUpperCase();
    const paymentProvider = salonCountry === 'CI' ? 'paystack' : (paymentMethod.toLowerCase().includes('wave') ? 'wave' : 'geniuspay');

    const confirmedBooking = {
      id: appointmentId,
      salonId: salon.id || null,
      country: salonCountry,
      currency: 'FCFA',
      paymentProvider: paymentProvider,
      clientName: clientInfo.name,
      clientPhone: clientInfo.phone,
      serviceId: selectedService?.id || 'custom',
      serviceName: selectedService?.name || 'Prestation',
      date: selectedDateStr || selectedDate,
      dateStr: selectedDateStr || selectedDate,
      dateFormatted: selectedDate,
      timeSlot: selectedSlot,
      price: price,
      depositPaid: depositPaid,
      remainingBalance: remainingBalance,
      paymentMethod: paymentMethod,
      transactionRef: ref,
      practitionerName: selectedPractitioner?.name || null,
      status: 'confirmed',
      notes: clientInfo.notes,
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [
      confirmedBooking,
      ...prev.filter(a => a.id !== appointmentId)
    ]);
    setLastBooking(confirmedBooking);
    setIsPaymentModalOpen(false);
    setStep(5);

    if (notifyNewBooking) {
      notifyNewBooking(confirmedBooking);
    }

    try {
      await supabase
        .from('appointments')
        .update({
          status: 'confirmed',
          expires_at: null,
          confirmed_at: new Date().toISOString(),
          country: salonCountry,
          currency: 'FCFA',
          payment_provider: paymentProvider,
          practitioner_name: selectedPractitioner?.name || null,
          payment_method: paymentMethod,
          transaction_ref: ref,
          geniuspay_reference: customRef || ref
        })
        .eq('id', appointmentId);
    } catch (e) {
      console.warn('Supabase update confirmed fallback:', e);
    }
  };

  const completePayment = async (paymentMethod = 'Sur place (Sans acompte)', customRef = null, pendingBookingId = null) => {
    if (isSalonOwner) {
      console.warn("Réservation bloquée : la propriétaire ne peut pas réserver sur son propre salon");
      return;
    }
    if (pendingBookingId) {
      return await confirmPendingBooking(pendingBookingId, paymentMethod, customRef);
    }
    const newId = 'AL-' + Math.floor(1000 + Math.random() * 9000);
    const ref = customRef || (
      paymentMethod === 'Wave' 
        ? 'WV-' + Math.floor(1000000 + Math.random() * 9000000)
        : 'DIR-' + Math.floor(1000000 + Math.random() * 9000000)
    );

    const price = Number(selectedService?.price) || 0;
    const depositPaid = Math.max(0, Number(selectedService?.deposit) || 0);
    const remainingBalance = Math.max(0, price - depositPaid);

    const newBooking = {
      id: newId,
      clientName: clientInfo.name,
      clientPhone: clientInfo.phone,
      serviceId: selectedService?.id || 'custom',
      serviceName: selectedService?.name || 'Prestation',
      date: selectedDateStr || selectedDate,
      dateStr: selectedDateStr || selectedDate,
      dateFormatted: selectedDate,
      timeSlot: selectedSlot,
      duration: selectedService?.duration || '45 min',
      price: price,
      depositPaid: depositPaid,
      remainingBalance: remainingBalance,
      paymentMethod: paymentMethod,
      transactionRef: ref,
      practitionerName: selectedPractitioner?.name || null,
      status: 'confirmed',
      notes: clientInfo.notes,
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [newBooking, ...prev]);
    setLastBooking(newBooking);
    setIsPaymentModalOpen(false);
    setStep(5);

    // Déclencher alerte sonore LOUD + Toast + Push Navigateur
    if (notifyNewBooking) {
      notifyNewBooking(newBooking);
    }

    const salonCountry = (salon?.country || 'SN').toUpperCase();
    const paymentProvider = salonCountry === 'CI' ? 'paystack' : (paymentMethod.toLowerCase().includes('wave') ? 'wave' : 'sur_place');

    try {
      await supabase.from('appointments').insert([{
        id: newId,
        salon_id: salon.id || null,
        country: salonCountry,
        currency: 'FCFA',
        payment_provider: paymentProvider,
        confirmed_at: new Date().toISOString(),
        client_name: newBooking.clientName,
        client_phone: newBooking.clientPhone,
        service_id: selectedService?.id || null,
        service_name: newBooking.serviceName,
        date: newBooking.date,
        date_formatted: newBooking.dateFormatted,
        time_slot: newBooking.timeSlot,
        duration: newBooking.duration || '45 min',
        price: newBooking.price,
        deposit_paid: newBooking.depositPaid,
        remaining_balance: newBooking.remainingBalance,
        payment_method: newBooking.paymentMethod,
        transaction_ref: newBooking.transactionRef,
        geniuspay_reference: customRef || newBooking.transactionRef,
        practitioner_name: selectedPractitioner?.name || null,
        status: newBooking.status,
        notes: newBooking.notes
      }]);
    } catch (e) {
      console.warn('Supabase insert appointment fallback:', e);
    }
  };

  const addManualAppointment = async (data) => {
    const newId = 'AL-' + Math.floor(1000 + Math.random() * 9000);
    const ref = data.paymentMethod === 'Wave' 
      ? 'WV-' + Math.floor(1000000 + Math.random() * 9000000)
      : 'ESP-' + Math.floor(100000 + Math.random() * 900000);

    const price = Number(data.price) || 0;
    const depositPaid = Number(data.depositPaid) || 0;
    const remainingBalance = Math.max(0, price - depositPaid);

    const cleanPhone = data.clientPhone.startsWith('+') ? data.clientPhone : '+221 ' + data.clientPhone;
    const salonCountry = (salon?.country || 'SN').toUpperCase();

    const today = new Date();
    const todayISO = today.toISOString().split('T')[0];
    const tmr = new Date(today);
    tmr.setDate(tmr.getDate() + 1);
    const tmrISO = tmr.toISOString().split('T')[0];

    let isoDate = todayISO;
    if (data.date === "Demain") {
      isoDate = tmrISO;
    } else if (data.dateStr) {
      isoDate = data.dateStr;
    } else if (data.date && /^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
      isoDate = data.date;
    }

    const newAppointment = {
      id: newId,
      clientName: data.clientName,
      clientPhone: cleanPhone,
      serviceId: data.serviceId || 'custom',
      serviceName: data.serviceName,
      date: data.date || "Aujourd'hui",
      dateStr: isoDate,
      dateFormatted: isoDate,
      timeSlot: data.timeSlot || '11:00',
      duration: data.duration || '1h',
      price: price,
      depositPaid: depositPaid,
      remainingBalance: remainingBalance,
      paymentMethod: data.paymentMethod || 'Espèces',
      transactionRef: ref,
      status: data.status || 'confirmed',
      isBlocked: data.isBlocked || false,
      practitionerName: data.practitionerName || data.staffName || '',
      notes: data.notes || '',
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [newAppointment, ...prev]);

    try {
      await supabase.from('appointments').insert([{
        id: newId,
        salon_id: salon.id || null,
        country: salonCountry,
        currency: 'FCFA',
        payment_provider: 'manual',
        confirmed_at: new Date().toISOString(),
        client_name: newAppointment.clientName,
        client_phone: newAppointment.clientPhone,
        service_id: newAppointment.serviceId !== 'custom' ? newAppointment.serviceId : null,
        service_name: newAppointment.serviceName,
        date: isoDate,
        date_formatted: isoDate,
        time_slot: newAppointment.timeSlot,
        duration: newAppointment.duration || '1h',
        price: newAppointment.price,
        deposit_paid: newAppointment.depositPaid,
        remaining_balance: newAppointment.remainingBalance,
        payment_method: newAppointment.paymentMethod,
        transaction_ref: newAppointment.transactionRef,
        practitioner_name: newAppointment.practitionerName || null,
        status: newAppointment.status,
        notes: newAppointment.notes
      }]);
    } catch (e) {
      console.warn('Supabase insert fallback:', e);
    }

    return newAppointment;
  };

  const blockSlot = async ({ date, dateStr, timeSlot, duration = '1h', reason = 'Pause / Indisponible', practitionerName = '' }) => {
    const newId = 'BLK-' + Math.floor(1000 + Math.random() * 9000);
    const todayISO = new Date().toISOString().split('T')[0];
    const isoDate = dateStr || (date === "Aujourd'hui" ? todayISO : (date || todayISO));

    const blockedItem = {
      id: newId,
      clientName: practitionerName ? `Indisponible (${practitionerName})` : 'Créneau Bloqué',
      clientPhone: '',
      serviceId: 'blocked',
      serviceName: reason || 'Pause Déjeuner / Fermeture',
      date: date || "Aujourd'hui",
      dateStr: isoDate,
      dateFormatted: isoDate,
      timeSlot: timeSlot,
      duration: duration,
      price: 0,
      depositPaid: 0,
      remainingBalance: 0,
      paymentMethod: 'Interne',
      status: 'blocked',
      isBlocked: true,
      practitionerName: practitionerName || '',
      notes: reason,
      createdAt: new Date().toISOString()
    };

    setAppointments(prev => [blockedItem, ...prev]);

    try {
      await supabase.from('appointments').insert([{
        id: newId,
        salon_id: salon.id || null,
        client_name: blockedItem.clientName,
        client_phone: '',
        service_id: 'blocked',
        service_name: blockedItem.serviceName,
        date: blockedItem.date,
        date_formatted: isoDate,
        time_slot: blockedItem.timeSlot,
        duration: blockedItem.duration,
        price: 0,
        deposit_paid: 0,
        remaining_balance: 0,
        payment_method: 'Interne',
        status: 'blocked',
        is_blocked: true,
        practitioner_name: blockedItem.practitionerName,
        notes: blockedItem.notes
      }]);
    } catch (e) {
      console.warn('Supabase insert blocked slot fallback:', e);
    }

    return blockedItem;
  };

  const assignPractitioner = async (appointmentId, practitionerName) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === appointmentId) {
        return { ...app, practitionerName };
      }
      return app;
    }));

    try {
      let query = supabase.from('appointments').update({ practitioner_name: practitionerName }).eq('id', appointmentId);
      if (salon?.id) query = query.eq('salon_id', salon.id);
      const { error } = await query;
      if (error) console.warn('Erreur assignPractitioner Supabase:', error.message);
    } catch (e) {
      console.warn('Erreur assignPractitioner:', e);
    }
  };

  const deleteAppointment = async (id) => {
    setAppointments(prev => prev.filter(app => app.id !== id));
    try {
      let query = supabase.from('appointments').delete().eq('id', id);
      if (salon?.id) query = query.eq('salon_id', salon.id);
      const { error } = await query;
      if (error) console.warn('Erreur deleteAppointment Supabase:', error.message);
    } catch (e) {
      console.warn('Erreur deleteAppointment:', e);
    }
  };

  const resetBookingFlow = () => {
    setSelectedService(null);
    setSelectedSlot(null);
    setSelectedDateStr('');
    setSelectedPractitioner(null);
    setClientInfo({ name: '', phone: '', notes: '' });
    setLastBooking(null);
    setStep(1);
  };

  const updateAppointmentStatus = async (id, newStatus) => {
    setAppointments(prev => prev.map(app => {
      if (app.id === id) {
        return { ...app, status: newStatus };
      }
      return app;
    }));

    try {
      let query = supabase.from('appointments').update({ status: newStatus }).eq('id', id);
      if (salon?.id) query = query.eq('salon_id', salon.id);
      const { error } = await query;
      if (error) console.warn('Erreur updateAppointmentStatus Supabase:', error.message);
    } catch (e) {
      console.warn('Erreur updateAppointmentStatus:', e);
    }
  };

  const checkoutAppointment = async (appointmentId, onSitePaymentMethod = 'Espèces') => {
    const app = appointments.find(a => a.id === appointmentId);
    if (!app) return;

    const price = Number(app.price) || 0;
    const currentDeposit = Number(app.depositPaid) || 0;
    const remaining = Number(app.remainingBalance) || Math.max(0, price - currentDeposit);

    // Formater le mode de règlement final
    const finalMethod = currentDeposit > 0 && app.paymentMethod?.includes('Wave') && onSitePaymentMethod !== 'Wave'
      ? `Wave (acompte) + ${onSitePaymentMethod} (solde)`
      : onSitePaymentMethod;

    setAppointments(prev => prev.map(a => {
      if (a.id === appointmentId) {
        return {
          ...a,
          status: 'completed',
          depositPaid: price,
          remainingBalance: 0,
          paymentMethod: finalMethod,
          onSitePaymentMethod: onSitePaymentMethod,
          completedAt: new Date().toISOString()
        };
      }
      return a;
    }));

    try {
      let query = supabase.from('appointments').update({
        status: 'completed',
        deposit_paid: price,
        remaining_balance: 0,
        payment_method: finalMethod
      }).eq('id', appointmentId);
      if (salon?.id) query = query.eq('salon_id', salon.id);
      const { error } = await query;
      if (error) console.warn('Erreur checkout appointment Supabase:', error.message);
    } catch (e) {
      console.warn('Erreur checkout appointment Supabase:', e);
    }
  };

  const cancelAndBroadcastSlot = (appointment) => {
    updateAppointmentStatus(appointment.id, 'cancelled');
    setSlotAlert({
      time: appointment.timeSlot,
      date: appointment.date,
      serviceName: appointment.serviceName,
      potentialClients: 6,
      timestamp: Date.now()
    });
  };

  const closeSlotAlert = () => {
    setSlotAlert(null);
  };

  const addService = async (newService) => {
    let salonId = salon.id;
    if (!salonId) {
      console.error('Impossible d\'ajouter un service sans salon connecté');
      throw new Error('Action impossible : aucun salon identifié.');
    }

    const tempId = 's_' + Date.now();
    const serviceOptimistic = {
      ...newService,
      id: tempId,
      popular: false
    };
    setServices(prev => [...prev, serviceOptimistic]);

    try {
      const payloadWithImage = {
        salon_id: salonId,
        name: newService.name,
        category: newService.category || 'Général',
        duration: newService.duration || '1h00',
        price: Number(newService.price) || 0,
        deposit: Number(newService.deposit) || 0,
        description: newService.description || '',
        image_url: newService.imageUrl || newService.image_url || null,
        popular: false
      };

      const { data, error } = await supabase.from('services').insert([payloadWithImage]).select();

      if (error) {
        if (error.message && error.message.includes('image_url')) {
          delete payloadWithImage.image_url;
          const { data: fallbackData } = await supabase.from('services').insert([payloadWithImage]).select();
          if (fallbackData && fallbackData.length > 0) {
            setServices(prev => prev.map(s => s.id === tempId ? { ...fallbackData[0], imageUrl: newService.imageUrl } : s));
          }
        } else {
          console.warn('Supabase insert service error:', error.message);
        }
      } else if (data && data.length > 0) {
        setServices(prev => prev.map(s => s.id === tempId ? { ...data[0], imageUrl: data[0].image_url || newService.imageUrl } : s));
      }
    } catch (e) {
      console.warn('Error saving service to Supabase:', e);
    }
  };

  const deleteService = async (id) => {
    setServices(prev => prev.filter(s => s.id !== id));
    try {
      let query = supabase.from('services').delete().eq('id', id);
      if (salon?.id) query = query.eq('salon_id', salon.id);
      const { error } = await query;
      if (error) {
        console.warn('Supabase delete service error:', error.message);
      }
    } catch (e) {
      console.warn('Error deleting service from Supabase:', e);
    }
  };

  const updateService = async (id, updatedFields) => {
    setServices(prev => prev.map(s => {
      if (s.id === id) {
        return {
          ...s,
          ...updatedFields,
          imageUrl: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : (s.imageUrl || s.image_url)
        };
      }
      return s;
    }));

    try {
      const payload = {
        name: updatedFields.name,
        category: updatedFields.category,
        duration: updatedFields.duration,
        price: Number(updatedFields.price) || 0,
        deposit: Number(updatedFields.deposit) || 0,
        description: updatedFields.description,
        image_url: updatedFields.imageUrl !== undefined ? updatedFields.imageUrl : undefined
      };

      Object.keys(payload).forEach(k => payload[k] === undefined && delete payload[k]);

      let query = supabase.from('services').update(payload).eq('id', id);
      if (salon?.id) query = query.eq('salon_id', salon.id);
      const { error } = await query;
      if (error) {
        if (error.message && error.message.includes('image_url')) {
          delete payload.image_url;
          let fallbackQuery = supabase.from('services').update(payload).eq('id', id);
          if (salon?.id) fallbackQuery = fallbackQuery.eq('salon_id', salon.id);
          await fallbackQuery;
        } else {
          console.warn('Supabase update service error:', error.message);
        }
      }
    } catch (e) {
      console.warn('Error updating service in Supabase:', e);
    }
  };

  // KPIs
  const totalSecuredDeposits = appointments
    .filter(a => a.status === 'confirmed' || a.status === 'completed' || a.status === 'no_show')
    .reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);

  const totalHonorables = appointments.filter(a => a.status === 'completed').length;
  const totalNoShows = appointments.filter(a => a.status === 'no_show').length;
  const totalConfirmed = appointments.filter(a => a.status === 'confirmed').length;
  const noShowRecoveredRevenue = appointments
    .filter(a => a.status === 'no_show')
    .reduce((acc, curr) => acc + (curr.depositPaid || 0), 0);

  const reliabilityRate = (totalHonorables + totalNoShows) > 0 
    ? Math.round((totalHonorables / (totalHonorables + totalNoShows)) * 100)
    : 100;



  // ================= PRODUITS & STOCKS (INVENTORY) =================
  const addProduct = async (productData) => {
    const tempId = productData.id || ('prod_' + Date.now());
    const newProd = {
      ...productData,
      id: tempId,
      price: Number(productData.price) || 0,
      cost_price: Number(productData.cost_price) || 0,
      stock_quantity: Number(productData.stock_quantity) || 0,
      alert_threshold: Number(productData.alert_threshold) || 3,
      is_retail: productData.is_retail !== false
    };

    setProducts(prev => [newProd, ...prev]);

    if (salon?.id) {
      try {
        const { data, error } = await supabase.from('products').insert({
          salon_id: salon.id,
          name: newProd.name,
          category: newProd.category || 'Général',
          price: newProd.price,
          cost_price: newProd.cost_price,
          stock_quantity: newProd.stock_quantity,
          alert_threshold: newProd.alert_threshold,
          is_retail: newProd.is_retail,
          sku: newProd.sku || null
        }).select().maybeSingle();

        if (!error && data) {
          setProducts(prev => prev.map(p => p.id === tempId ? { ...p, id: data.id } : p));
        }
      } catch (err) {
        console.warn('Erreur addProduct Supabase:', err);
      }
    }
    return newProd;
  };

  const updateProduct = async (id, updates) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));

    if (salon?.id) {
      try {
        const payload = { ...updates };
        if (payload.price !== undefined) payload.price = Number(payload.price);
        if (payload.cost_price !== undefined) payload.cost_price = Number(payload.cost_price);
        if (payload.stock_quantity !== undefined) payload.stock_quantity = Number(payload.stock_quantity);
        if (payload.alert_threshold !== undefined) payload.alert_threshold = Number(payload.alert_threshold);

        let query = supabase.from('products').update(payload).eq('id', id);
        query = query.eq('salon_id', salon.id);
        await query;
      } catch (err) {
        console.warn('Erreur updateProduct Supabase:', err);
      }
    }
  };

  const deleteProduct = async (id) => {
    setProducts(prev => prev.filter(p => p.id !== id));

    if (salon?.id) {
      try {
        let query = supabase.from('products').delete().eq('id', id);
        query = query.eq('salon_id', salon.id);
        await query;
      } catch (err) {
        console.warn('Erreur deleteProduct Supabase:', err);
      }
    }
  };

  const adjustProductStock = async (productId, delta) => {
    let newQty = 0;

    // Optimistic local update
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        newQty = Math.max(0, (p.stock_quantity || 0) + delta);
        return { ...p, stock_quantity: newQty };
      }
      return p;
    }));

    if (salon?.id && isSupabaseConfigured) {
      try {
        if (delta < 0) {
          // P2.1 : Déstockage atomique via RPC PostgreSQL
          const { data: serverQty, error: rpcErr } = await supabase.rpc('decrement_product_stock', {
            p_product_id: productId,
            p_quantity: Math.abs(delta)
          });

          if (!rpcErr && typeof serverQty === 'number') {
            newQty = serverQty;
            setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock_quantity: serverQty } : p));
          } else {
            // Fallback direct update
            await supabase.from('products').update({
              stock_quantity: newQty,
              updated_at: new Date().toISOString()
            }).eq('id', productId).eq('salon_id', salon.id);
          }
        } else {
          // Réapprovisionnement
          await supabase.from('products').update({
            stock_quantity: newQty,
            updated_at: new Date().toISOString()
          }).eq('id', productId).eq('salon_id', salon.id);
        }
      } catch (err) {
        console.warn('Erreur adjustProductStock Supabase:', err);
      }
    }
    return newQty;
  };

  // ================= PROGRAMME DE FIDÉLITÉ & CARTE À TAMPONS (LOYALTY) =================
  const getClientLoyalty = (clientPhone) => {
    const target = Number(salon?.loyalty_target_visits) || 5;
    if (!clientPhone) {
      return {
        pointsBalance: 0,
        visitsCount: 0,
        targetVisits: target,
        rewardsPending: 0,
        rewardsEarned: 0,
        isRewardAvailable: false,
        totalEarned: 0,
        totalSpent: 0,
        history: []
      };
    }
    const cleanPhone = clientPhone.replace(/\D/g, '');
    const data = clientLoyalty[cleanPhone] || clientLoyalty[clientPhone] || {};
    const visits = Number(data.visitsCount) || 0;
    const rewardsPending = Number(data.rewardsPending) || (visits >= target ? 1 : 0);
    const isRewardAvailable = rewardsPending > 0 || visits >= target;

    return {
      pointsBalance: Number(data.pointsBalance) || 0,
      visitsCount: visits,
      targetVisits: target,
      rewardsPending: rewardsPending,
      rewardsEarned: Number(data.rewardsEarned) || 0,
      isRewardAvailable: isRewardAvailable,
      totalEarned: Number(data.totalEarned) || 0,
      totalSpent: Number(data.totalSpent) || 0,
      history: Array.isArray(data.history) ? data.history : []
    };
  };

  // Enregistrer un passage/visite sur la carte à tampons de la cliente
  const recordLoyaltyVisit = async ({ phone, name, amount = 0, serviceName = '' }) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, '');
    const current = getClientLoyalty(cleanPhone);
    const target = Number(salon?.loyalty_target_visits) || 5;
    
    // Nouveau compteur de visites
    const nextVisits = current.visitsCount + 1;
    const rewardUnlocked = nextVisits >= target;
    const newRewardsPending = rewardUnlocked ? (current.rewardsPending + 1) : current.rewardsPending;
    const ptsEarned = Math.max(10, Math.floor((Number(amount) || 0) / 100));

    const updated = {
      pointsBalance: (current.pointsBalance || 0) + ptsEarned,
      visitsCount: rewardUnlocked ? target : nextVisits, // Si atteint, reste à target jusqu'à validation de la gérante
      targetVisits: target,
      rewardsPending: newRewardsPending,
      rewardsEarned: current.rewardsEarned || 0,
      totalEarned: (current.totalEarned || 0) + ptsEarned,
      totalSpent: current.totalSpent || 0,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          points: `+${ptsEarned}`,
          visit: `${Math.min(target, nextVisits)}/${target}`,
          reason: rewardUnlocked 
            ? `🎉 5ème visite complétée ! Récompense fidélité débloquée (${serviceName || 'Prestation'})`
            : `Tampon visite ${nextVisits}/${target} (${serviceName || 'Prestation'})`
        },
        ...(current.history || [])
      ]
    };

    setClientLoyalty(prev => ({
      ...prev,
      [cleanPhone]: updated
    }));

    if (salon?.id) {
      try {
        await supabase.from('client_loyalty').upsert({
          salon_id: salon.id,
          client_phone: cleanPhone,
          client_name: name || null,
          points_balance: updated.pointsBalance,
          visits_count: updated.visitsCount,
          rewards_pending: updated.rewardsPending,
          rewards_earned: updated.rewardsEarned,
          total_points_earned: updated.totalEarned,
          total_points_spent: updated.totalSpent,
          history: updated.history,
          updated_at: new Date().toISOString()
        }, { onConflict: 'salon_id,client_phone' });
      } catch (err) {
        console.warn('Erreur recordLoyaltyVisit Supabase:', err);
      }
    }

    return { rewardUnlocked, currentVisits: updated.visitsCount, target };
  };

  // Validation d'une récompense fidélité par la gérante (remise à zéro du cycle)
  const redeemLoyaltyReward = async ({ phone, discountFCFA = 0, rewardDescription = '' }) => {
    if (!phone) return 0;
    const cleanPhone = phone.replace(/\D/g, '');
    const current = getClientLoyalty(cleanPhone);

    const updated = {
      ...current,
      visitsCount: 0, // Nouveau cycle de tampons démarre à 0
      rewardsPending: Math.max(0, (current.rewardsPending || 1) - 1),
      rewardsEarned: (current.rewardsEarned || 0) + 1,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          points: discountFCFA > 0 ? `-${discountFCFA} F` : 'Cadeau',
          reason: `👑 Récompense accordée : ${rewardDescription || (discountFCFA > 0 ? `Remise ${discountFCFA} FCFA` : 'Cadeau fidélité')}`
        },
        ...(current.history || [])
      ]
    };

    setClientLoyalty(prev => ({
      ...prev,
      [cleanPhone]: updated
    }));

    if (salon?.id) {
      try {
        await supabase.from('client_loyalty').upsert({
          salon_id: salon.id,
          client_phone: cleanPhone,
          points_balance: updated.pointsBalance,
          visits_count: updated.visitsCount,
          rewards_pending: updated.rewardsPending,
          rewards_earned: updated.rewardsEarned,
          total_points_earned: updated.totalEarned,
          total_points_spent: updated.totalSpent,
          history: updated.history,
          updated_at: new Date().toISOString()
        }, { onConflict: 'salon_id,client_phone' });
      } catch (err) {
        console.warn('Erreur redeemLoyaltyReward Supabase:', err);
      }
    }

    return discountFCFA;
  };

  const awardLoyaltyPoints = async ({ phone, name, points, reason }) => {
    if (!phone || !points || points <= 0) return;
    const cleanPhone = phone.replace(/\D/g, '');

    const current = getClientLoyalty(cleanPhone);
    const updated = {
      ...current,
      pointsBalance: (current.pointsBalance || 0) + points,
      totalEarned: (current.totalEarned || 0) + points,
      totalSpent: current.totalSpent || 0,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          points: `+${points}`,
          reason: reason || 'Points réservation honorée'
        },
        ...(current.history || [])
      ]
    };

    setClientLoyalty(prev => ({
      ...prev,
      [cleanPhone]: updated
    }));

    if (salon?.id) {
      try {
        await supabase.from('client_loyalty').upsert({
          salon_id: salon.id,
          client_phone: cleanPhone,
          client_name: name || null,
          points_balance: updated.pointsBalance,
          total_points_earned: updated.totalEarned,
          total_points_spent: updated.totalSpent,
          history: updated.history,
          updated_at: new Date().toISOString()
        }, { onConflict: 'salon_id,client_phone' });
      } catch (err) {
        console.warn('Erreur awardLoyaltyPoints Supabase:', err);
      }
    }
  };

  const redeemLoyaltyPoints = async ({ phone, pointsToRedeem, discountFCFA }) => {
    if (!phone || !pointsToRedeem || pointsToRedeem <= 0) return 0;
    const cleanPhone = phone.replace(/\D/g, '');

    const current = getClientLoyalty(cleanPhone);
    const newBalance = Math.max(0, (current.pointsBalance || 0) - pointsToRedeem);
    const updated = {
      ...current,
      pointsBalance: newBalance,
      totalEarned: current.totalEarned || 0,
      totalSpent: (current.totalSpent || 0) + pointsToRedeem,
      history: [
        {
          date: new Date().toISOString().split('T')[0],
          points: `-${pointsToRedeem}`,
          reason: `Remise fidélité appliquée (-${discountFCFA} FCFA)`
        },
        ...(current.history || [])
      ]
    };

    setClientLoyalty(prev => ({
      ...prev,
      [cleanPhone]: updated
    }));

    if (salon?.id) {
      try {
        await supabase.from('client_loyalty').upsert({
          salon_id: salon.id,
          client_phone: cleanPhone,
          points_balance: updated.pointsBalance,
          total_points_earned: updated.totalEarned,
          total_points_spent: updated.totalSpent,
          history: updated.history,
          updated_at: new Date().toISOString()
        }, { onConflict: 'salon_id,client_phone' });
      } catch (err) {
        console.warn('Erreur redeemLoyaltyPoints Supabase:', err);
      }
    }
    return discountFCFA;
  };

  // ================= GESTION DU PERSONNEL & RÔLES D'ACCÈS =================
  const currentAccessLevel = activeStaffMember?.accessLevel || 'level_1';

  const staffLoginWithPin = (pinCode) => {
    if (!pinCode) return false;
    const cleanPin = pinCode.trim();

    // Code gérant par défaut (0000 ou 1234)
    if (cleanPin === '0000' || cleanPin === (salon?.manager_pin || '1234')) {
      setActiveStaffMember({
        id: 'owner',
        name: salon?.owner_name || 'Gérante',
        role: 'Propriétaire / Gérante',
        accessLevel: 'level_1'
      });
      return true;
    }

    // Vérifier parmi l'équipe configurée
    const team = Array.isArray(salon?.team) ? salon.team : [];
    const matched = team.find(m => (m.pin || m.pinCode) === cleanPin);
    if (matched) {
      setActiveStaffMember({
        id: matched.id || matched.name,
        name: matched.name,
        role: matched.role || 'Praticienne',
        accessLevel: matched.accessLevel || 'level_2',
        avatar: matched.avatar || null
      });
      return true;
    }

    return false;
  };

  const verifyManagerPin = (pinCode) => {
    if (!pinCode) return false;
    const clean = pinCode.trim();
    const currentPin = salon?.manager_pin || '1234';
    return clean === currentPin || clean === '0000';
  };

  const staffLogout = () => {
    setActiveStaffMember(null);
  };

  // ================= ACTIONS SUPER-ADMIN SAAS (mahmoudndiaye100@gmail.com) =================
  const fetchAllSalons = async () => {
    try {
      const { data, error } = await supabase
        .from('salons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn('Erreur fetchAllSalons:', err);
      return [];
    }
  };

  const fetchSuperAdminStats = async () => {
    try {
      // 1. Tenter l'appel RPC Supabase
      const { data, error } = await supabase.rpc('get_super_admin_stats');
      if (!error && data) {
        return data;
      }
    } catch (e) {
      console.warn('RPC get_super_admin_stats fallback:', e);
    }

    // 2. Calcul direct en base si RPC non encore exécuté
    try {
      const [
        { data: allSalons },
        { data: allAppointments },
        { data: allPayments }
      ] = await Promise.all([
        supabase.from('salons').select('id, country, subscription_status, is_subscription_active, trial_ends_at, subscription_expires_at'),
        supabase.from('appointments').select('id, deposit_paid, price, status, created_at'),
        supabase.from('subscription_payments').select('id, amount, status')
      ]);

      const salonsList = allSalons || [];
      const apptsList = allAppointments || [];
      const paysList = allPayments || [];

      let active = 0, trial = 0, expired = 0, sn = 0, ci = 0;
      salonsList.forEach(s => {
        const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : 0;
        const isTrialValid = (s.subscription_status === 'trial' || !s.subscription_status) && (trialEnd > Date.now() || !trialEnd);
        const isSubActive = s.subscription_status === 'active' && s.is_subscription_active !== false;

        if (isSubActive) {
          active++; // VRAI abonné payant
        } else if (isTrialValid) {
          trial++; // En période d'essai gratuit 14 jours (NE COMPTE PAS DANS LE MRR)
        } else {
          expired++; // 14 jours écoulés sans payer -> RESTRICTIONS
        }

        if (s.country === 'CI') ci++;
        else sn++;
      });

      const totalDeposits = apptsList.reduce((acc, a) => acc + (Number(a.deposit_paid) || 0), 0);
      // Chiffre d'affaires SaaS réel encaissé (strictement la somme des paiements réussis Wave 🇸🇳 ou Paystack 🇨🇮)
      const totalSaasRevenue = paysList.filter(p => p.status === 'success' || p.status === 'completed').reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

      const todayStr = new Date().toISOString().split('T')[0];
      const apptsToday = apptsList.filter(a => a.created_at && a.created_at.startsWith(todayStr)).length;

      return {
        total_salons: salonsList.length,
        active_subscribers: active,
        trial_salons: trial,
        expired_salons: expired,
        salons_sn: sn,
        salons_ci: ci,
        mrr_fcfa: active * 9900,
        total_saas_revenue: totalSaasRevenue,
        total_appointments: apptsList.length,
        appointments_today: apptsToday,
        total_deposits_secured: totalDeposits
      };
    } catch (err) {
      console.warn('Erreur calcul stats super admin:', err);
      return {
        total_salons: 0,
        active_subscribers: 0,
        trial_salons: 0,
        expired_salons: 0,
        salons_sn: 0,
        salons_ci: 0,
        mrr_fcfa: 0,
        total_saas_revenue: 0,
        total_appointments: 0,
        appointments_today: 0,
        total_deposits_secured: 0
      };
    }
  };

  const fetchSubscriptionPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_payments')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error && data) return data;
    } catch (e) {
      console.warn('fetchSubscriptionPayments fallback:', e);
    }
    return [];
  };

  const fetchPlatformAppointments = async (limit = 100) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (!error && data) return data;
    } catch (e) {
      console.warn('fetchPlatformAppointments fallback:', e);
    }
    return [];
  };

  const saveGlobalAnnouncement = async (message, isActive = true) => {
    try {
      const cleanMsg = (message || '').trim();
      setGlobalAnnouncement(isActive ? cleanMsg : '');
      if (isActive && cleanMsg) {
        localStorage.setItem('appointfy_global_broadcast', cleanMsg);
      } else {
        localStorage.removeItem('appointfy_global_broadcast');
      }

      // Désactiver les anciennes annonces
      await supabase
        .from('platform_announcements')
        .update({ is_active: false })
        .eq('is_active', true);

      if (isActive && cleanMsg) {
        const { data, error } = await supabase
          .from('platform_announcements')
          .insert([{
            message: cleanMsg,
            is_active: true,
            author: currentUser?.email || 'Super-Admin',
            target_country: 'ALL',
            updated_at: new Date().toISOString()
          }])
          .select()
          .single();

        if (error) throw error;
        return { success: true, data };
      }

      return { success: true, deactivated: true };
    } catch (err) {
      console.warn('saveGlobalAnnouncement fallback:', err);
      return { success: true, fallback: true };
    }
  };

  const verifyTransactionWithAPI = async (reference) => {
    if (!reference) return { success: false, error: 'Référence requise' };
    try {
      // 1. Appel API GeniusPay backend
      let apiData = null;
      try {
        const res = await fetch(`/api/check-payment?reference=${encodeURIComponent(reference.trim())}`);
        apiData = await res.json();
      } catch (err) {
        apiData = { success: false, error: err.message };
      }

      // 2. Recherche en base locale Supabase
      const [apptRes, subRes] = await Promise.all([
        supabase.from('appointments').select('*').or(`transaction_ref.eq.${reference},geniuspay_reference.eq.${reference}`).maybeSingle(),
        supabase.from('subscription_payments').select('*').eq('transaction_ref', reference).maybeSingle()
      ]);

      return {
        success: true,
        apiResult: apiData,
        databaseRecord: apptRes.data || subRes.data || null,
        type: apptRes.data ? 'appointment_deposit' : (subRes.data ? 'saas_subscription' : 'external')
      };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const adminManageSalon = async (salonId, action, days = 14) => {
    try {
      // 1. Appel RPC Supabase
      const { data: rpcData, error: rpcErr } = await supabase.rpc('admin_manage_salon', {
        p_salon_id: salonId,
        p_action: action,
        p_days: days
      });
      if (!rpcErr && rpcData?.success) {
        return { success: true, message: rpcData.message };
      }

      // 2. Fallback update direct
      let updates = {};
      if (action === 'activate') {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (days || 30));
        updates = {
          subscription_status: 'active',
          is_subscription_active: true,
          subscription_expires_at: expDate.toISOString(),
          last_subscription_payment_at: new Date().toISOString()
        };

        try {
          await supabase.from('subscription_payments').insert([{
            salon_id: salonId,
            amount: 9900,
            currency: 'FCFA',
            payment_provider: 'admin_grant',
            transaction_ref: 'ADM-' + Math.floor(100000 + Math.random() * 900000),
            period_days: days || 30,
            status: 'success',
            notes: `Activation manuelle (+${days || 30} jours)`
          }]);
        } catch (_) {}

      } else if (action === 'extend_trial') {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + (days || 14));
        updates = {
          subscription_status: 'trial',
          is_subscription_active: true,
          trial_ends_at: expDate.toISOString(),
          subscription_expires_at: expDate.toISOString()
        };
      } else if (action === 'suspend') {
        updates = {
          subscription_status: 'expired',
          is_subscription_active: false
        };
      } else if (action === 'delete') {
        await supabase.from('appointments').delete().eq('salon_id', salonId);
        await supabase.from('services').delete().eq('salon_id', salonId);
        await supabase.from('subscription_payments').delete().eq('salon_id', salonId);
        await supabase.from('salons').delete().eq('id', salonId);
        return { success: true, message: 'Salon supprimé définitivement.' };
      }

      const { error: updateErr } = await supabase
        .from('salons')
        .update(updates)
        .eq('id', salonId);

      if (updateErr) throw updateErr;
      return { success: true, message: 'Salon mis à jour avec succès.' };
    } catch (err) {
      console.error('Erreur adminManageSalon:', err);
      return { success: false, error: err.message };
    }
  };

  return (
    <BookingContext.Provider
      value={{
        salon,
        setSalon,
        updateSalon,
        services,
        appointments,
        products,
        setProducts,
        addProduct,
        updateProduct,
        deleteProduct,
        adjustProductStock,
        clientLoyalty,
        getClientLoyalty,
        awardLoyaltyPoints,
        redeemLoyaltyPoints,
        recordLoyaltyVisit,
        redeemLoyaltyReward,
        activeStaffMember,
        setActiveStaffMember,
        currentAccessLevel,
        staffLoginWithPin,
        staffLogout,
        verifyManagerPin,
        isRealtimeConnected,
        currentView,
        setCurrentView,
        authMode,
        setAuthMode,
        currentUser,
        setCurrentUser,
        isSalonOwner,
        isSubscriptionExpired,
        isPlatformAdmin,
        globalAnnouncement,
        fetchGlobalAnnouncement,
        saveGlobalAnnouncement,
        fetchSuperAdminStats,
        fetchSubscriptionPayments,
        fetchPlatformAppointments,
        verifyTransactionWithAPI,
        fetchAllSalons,
        adminManageSalon,
        completeOnboarding,
        logout,
        step,
        setStep,
        selectedService,
        selectedDate,
        selectedSlot,
        selectedPractitioner,
        setSelectedPractitioner,
        selectPractitioner: setSelectedPractitioner,
        clientInfo,
        isPaymentModalOpen,
        setIsPaymentModalOpen,
        lastBooking,
        slotAlert,
        selectService,
        selectSlot,
        updateClientInfo,
        proceedToPayment,
        completePayment,
        createPendingBooking,
        cancelPendingBooking,
        confirmPendingBooking,
        addManualAppointment,
        assignPractitioner,
        blockSlot,
        deleteAppointment,
        resetBookingFlow,
        updateAppointmentStatus,
        checkoutAppointment,
        cancelAndBroadcastSlot,
        closeSlotAlert,
        addService,
        updateService,
        deleteService,
        stats: {
          totalSecuredDeposits,
          totalHonorables,
          totalNoShows,
          totalConfirmed,
          noShowRecoveredRevenue,
          reliabilityRate
        }
      }}
    >
      {children}
    </BookingContext.Provider>
  );
};
