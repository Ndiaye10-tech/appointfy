import { DEFAULT_SCHEDULE } from '../lib/schedule';

export const DEFAULT_AMENITIES = [];

export const DEFAULT_REVIEWS = [];

export const DEFAULT_FAQ = [];

export const DEFAULT_HERO_CAROUSEL = [];

export const DEFAULT_STORY = {
  title: "",
  subtitle: "",
  content: "",
  founderName: "",
  founderRole: "",
  founderImage: "",
  quote: ""
};

export const DEFAULT_TEAM = [];

export const DEFAULT_LOOKBOOK = [];

export const DEFAULT_PRODUCTS = [];

export const initialSalon = {
  id: '',
  name: 'Mon Salon',
  slug: '',
  tagline: '',
  description: '',
  address: '',
  city: '',
  country: 'SN',
  business_type: 'beauty_studio',
  work_mode: 'salon',
  phone: '',
  whatsapp: '',
  wave_number: '',
  depositRate: 0.20,
  depositRequired: true,
  depositType: 'rate',
  depositFixedAmount: 2000,
  minLeadHours: 2,
  latenessTolerance: 15,
  acceptCash: true,
  acceptWave: true,
  paymentRecipientPhone: '',
  sendDigitalReceipt: true,
  whatsappConfirmEnabled: true,
  whatsappReminderEnabled: true,
  whatsappReminderHours: 24,
  whatsappTemplate: "Bonjour {nom_cliente} ! Votre rendez-vous pour {prestation} chez {nom_salon} est confirmé pour le {date} à {heure}. Acompte Wave validé. Merci et à très vite !",
  schedule: {
    lundi: { open: true, start: '09:00', end: '19:00', label: 'Lundi' },
    mardi: { open: true, start: '09:00', end: '19:00', label: 'Mardi' },
    mercredi: { open: true, start: '09:00', end: '19:00', label: 'Mercredi' },
    jeudi: { open: true, start: '09:00', end: '19:00', label: 'Jeudi' },
    vendredi: { open: true, start: '09:00', end: '19:00', label: 'Vendredi' },
    samedi: { open: true, start: '09:00', end: '19:00', label: 'Samedi' },
    dimanche: { open: true, start: '09:00', end: '19:00', label: 'Dimanche' }
  },
  slotInterval: 45,
  hours: 'Ouvert 7j/7',
  coverImage: '',
  avatarImage: '',
  theme: 'pink',
  welcomeMessage: '✨ Réservez votre place en 30s. Votre créneau est garanti dès validation de votre acompte Wave.',
  announcementBanner: '',
  instagram: '',
  tiktok: '',
  facebook: '',
  policyCancellation: 'Annulation possible jusqu\'à 24h avant le rendez-vous.',
  gallery: [],
  amenities: [],
  reviews: [],
  faq: [],
  heroMediaType: 'photo',
  heroVideoUrl: '',
  heroCarousel: [],
  story: {
    quote: '',
    title: '',
    subtitle: '',
    content: '',
    founderName: '',
    founderRole: '',
    founderImage: ''
  },
  teamMode: 'solo',
  team: [],
  lookbook: [],
  // Programme de Fidélité
  loyalty_enabled: true,
  loyalty_rate_fcfa: 1000, // 1 000 FCFA = 10 points
  loyalty_point_value_fcfa: 10, // 100 pts = 1 000 FCFA de remise
  loyalty_welcome_bonus: 50 // 50 points offerts
};

export const initialServices = [];

export const initialAppointments = [];

export const availableDates = [
  { label: 'Aujourd\'hui', subLabel: '13 Sept.', dateStr: '2026-09-13' },
  { label: 'Demain', subLabel: '14 Sept.', dateStr: '2026-09-14' },
  { label: 'Mardi', subLabel: '15 Sept.', dateStr: '2026-09-15' },
  { label: 'Mercredi', subLabel: '16 Sept.', dateStr: '2026-09-16' },
  { label: 'Jeudi', subLabel: '17 Sept.', dateStr: '2026-09-17' },
  { label: 'Vendredi', subLabel: '18 Sept.', dateStr: '2026-09-18' },
  { label: 'Samedi', subLabel: '19 Sept.', dateStr: '2026-09-19' },
];

export const availableTimeSlots = [
  { time: '09:30', available: true },
  { time: '11:00', available: true },
  { time: '13:00', available: false },
  { time: '14:30', available: true },
  { time: '16:00', available: true },
  { time: '17:30', available: true },
  { time: '18:45', available: true },
];
