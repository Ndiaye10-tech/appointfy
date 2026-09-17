import React, { useState, useRef, useEffect } from 'react';
import { useBooking } from '../../context/BookingContext';
import { uploadToCloudinary } from '../../lib/cloudinary';
import { ServiceManager } from './ServiceManager';
import {
  UploadCloud,
  Check,
  Copy,
  Share2,
  ExternalLink,
  Sparkles,
  Save,
  Image as ImageIcon,
  Palette,
  Type,
  MapPin,
  Clock,
  Phone,
  Trash2,
  Plus,
  Loader2,
  Eye,
  Layers,
  Info,
  CheckCircle2,
  AlertCircle,
  Scissors,
  Globe,
  Calendar,
  Sliders,
  Settings,
  MessageCircle,
  Star,
  MessageSquareQuote,
  HelpCircle,
  QrCode,
  Printer,
  Download,
  Coffee,
  Wind,
  Wifi,
  Car,
  CheckSquare,
  Square,
  ShieldCheck,
  RotateCcw,
  Video,
  Film,
  User,
  Users,
  BookOpen,
  Quote,
  BadgeCheck,
  Play,
  Pause,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  Smartphone,
  Tablet,
  Monitor,
  Maximize2,
  Minimize2,
  X,
  Lock,
  Camera
} from 'lucide-react';
import { DEFAULT_SCHEDULE, DAY_ORDER, formatScheduleSummary } from '../../lib/schedule';
import { THEMES, getTheme } from '../../lib/theme';
import { InstagramIcon, TikTokIcon, FacebookIcon, SocialLinkPill, formatSocialUrl, getSocialHandle } from '../common/SocialIcons';
import {
  DEFAULT_AMENITIES,
  DEFAULT_REVIEWS,
  DEFAULT_FAQ,
  DEFAULT_HERO_CAROUSEL,
  DEFAULT_STORY,
  DEFAULT_TEAM,
  DEFAULT_LOOKBOOK
} from '../../data/mockData';

export const ClientPreviewEditor = () => {
  const { salon, updateSalon, services, setCurrentView, setSalon } = useBooking();

  // Local form editing state
  const [formData, setFormData] = useState({
    name: salon.name || '',
    tagline: salon.tagline || '',
    description: salon.description || '',
    welcomeMessage: salon.welcomeMessage || '✨ Salon certifié Appointfy : Réservez votre place en 30s. Votre créneau est garanti à 100% dès validation de votre acompte Wave.',
    announcementBanner: salon.announcementBanner || '',
    instagram: salon.instagram || '',
    tiktok: salon.tiktok || '',
    facebook: salon.facebook || '',
    policyCancellation: salon.policyCancellation || 'Annulation remboursée à 100% jusqu\'à 24h avant le rendez-vous.',
    address: salon.address || '',
    hours: salon.hours || formatScheduleSummary(salon.schedule || DEFAULT_SCHEDULE),
    schedule: salon.schedule || DEFAULT_SCHEDULE,
    slotInterval: salon.slotInterval || 45,
    phone: salon.phone || '',
    whatsapp: salon.whatsapp || '',
    coverImage: salon.coverImage || '',
    coverPosition: salon.coverPosition !== undefined ? salon.coverPosition : (salon.story?.coverPosition ?? 20),
    coverZoom: salon.coverZoom !== undefined ? salon.coverZoom : (salon.story?.coverZoom ?? 100),
    coverFit: salon.coverFit || salon.story?.coverFit || 'cover',
    avatarImage: salon.avatarImage || '',
    theme: salon.theme || 'pink',
    gallery: salon.gallery || [],
    amenities: Array.isArray(salon.amenities) ? salon.amenities : [],
    reviews: Array.isArray(salon.reviews) ? salon.reviews : [],
    faq: Array.isArray(salon.faq) ? salon.faq : [],
    heroMediaType: salon.heroMediaType || 'photo',
    heroVideoUrl: salon.heroVideoUrl || '',
    heroCarousel: Array.isArray(salon.heroCarousel) ? salon.heroCarousel : [],
    story: (() => {
      const s = salon.story || DEFAULT_STORY;
      return {
        ...s,
        content: (s.content !== undefined) 
          ? s.content 
          : (Array.isArray(s.paragraphs) ? s.paragraphs.join('\n\n') : '')
      };
    })(),
    teamMode: salon.teamMode || 'solo',
    team: Array.isArray(salon.team) ? salon.team : [],
    lookbook: Array.isArray(salon.lookbook) ? salon.lookbook : []
  });

  // Sync formData when salon is loaded from Supabase for the first time
  const lastLoadedSalonIdRef = useRef(null);
  useEffect(() => {
    if (salon && salon.id && lastLoadedSalonIdRef.current !== salon.id) {
      lastLoadedSalonIdRef.current = salon.id;
      setFormData(prev => ({
        ...prev,
        name: salon.name || prev.name || '',
        tagline: salon.tagline || prev.tagline || '',
        description: salon.description || prev.description || '',
        welcomeMessage: salon.welcomeMessage || prev.welcomeMessage || '',
        announcementBanner: salon.announcementBanner !== undefined ? salon.announcementBanner : prev.announcementBanner,
        instagram: salon.instagram || prev.instagram || '',
        tiktok: salon.tiktok || prev.tiktok || '',
        facebook: salon.facebook || prev.facebook || '',
        policyCancellation: salon.policyCancellation || prev.policyCancellation || '',
        address: salon.address || prev.address || '',
        hours: salon.hours || prev.hours || '',
        schedule: salon.schedule || prev.schedule || DEFAULT_SCHEDULE,
        slotInterval: salon.slotInterval || prev.slotInterval || 45,
        phone: salon.phone || prev.phone || '',
        whatsapp: salon.whatsapp || prev.whatsapp || '',
        coverImage: salon.coverImage !== undefined ? (salon.coverImage || '') : '',
        coverPosition: salon.coverPosition !== undefined ? salon.coverPosition : (salon.story?.coverPosition ?? prev.coverPosition ?? 20),
        coverZoom: salon.coverZoom !== undefined ? salon.coverZoom : (salon.story?.coverZoom ?? prev.coverZoom ?? 100),
        coverFit: salon.coverFit || salon.story?.coverFit || prev.coverFit || 'cover',
        avatarImage: salon.avatarImage !== undefined ? (salon.avatarImage || '') : '',
        theme: salon.theme || prev.theme || 'pink',
        gallery: Array.isArray(salon.gallery) ? salon.gallery : [],
        amenities: Array.isArray(salon.amenities) ? salon.amenities : [],
        reviews: Array.isArray(salon.reviews) ? salon.reviews : [],
        faq: Array.isArray(salon.faq) ? salon.faq : [],
        heroMediaType: salon.heroMediaType || prev.heroMediaType || 'photo',
        heroVideoUrl: salon.heroVideoUrl !== undefined ? (salon.heroVideoUrl || '') : prev.heroVideoUrl,
        heroCarousel: Array.isArray(salon.heroCarousel) ? salon.heroCarousel : [],
        story: {
          title: salon.story?.title || '',
          subtitle: salon.story?.subtitle || '',
          content: salon.story?.content || (Array.isArray(salon.story?.paragraphs) ? salon.story.paragraphs.join('\n\n') : ''),
          founderName: salon.story?.founderName || '',
          founderRole: salon.story?.founderRole || '',
          founderImage: salon.story?.founderImage || '',
          quote: salon.story?.quote || ''
        },
        teamMode: salon.teamMode || 'solo',
        team: Array.isArray(salon.team) ? salon.team : [],
        lookbook: Array.isArray(salon.lookbook) ? salon.lookbook : []
      }));
    }
  }, [salon?.id]);

  // Synchronisation en arrière-plan : debouncée à 400ms pour fluidité absolue de frappe
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(async () => {
      try {
        await updateSalon(formData);
      } catch (err) {
        console.warn('Auto-save Supabase warning:', err);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [formData]);

  // UI state
  const [activeEditorTab, setActiveEditorTab] = useState('branding'); // 'branding' | 'services' | 'schedule' | 'info' | 'team' | 'gallery' | 'promo' | 'qrcode'
  const [mobileMode, setMobileMode] = useState('edit'); // 'edit' | 'preview'
  const [mobileSection, setMobileSection] = useState(null); // null (Hub menu) | 'services' | 'schedule' | 'branding' | 'team' | 'info' | 'advanced'
  const [previewDevice, setPreviewDevice] = useState('mobile'); // 'mobile' | 'large_mobile' | 'desktop'
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [iframeKey, setIframeKey] = useState(0);

  // Cloudinary upload loaders
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingFounder, setUploadingFounder] = useState(false);
  const [uploadingTeamMember, setUploadingTeamMember] = useState(false);
  const [uploadingLookbook, setUploadingLookbook] = useState(false);

  // Hidden file inputs
  const coverInputRef = useRef(null);
  const avatarInputRef = useRef(null);
  const founderInputRef = useRef(null);
  const teamMemberInputRef = useRef(null);
  const lookbookInputRef = useRef(null);

  // Handle text input changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Schedule toggle & changes
  const handleDayToggle = (dayKey) => {
    setFormData(prev => {
      const currentDay = prev.schedule?.[dayKey] || DEFAULT_SCHEDULE[dayKey];
      const newSchedule = {
        ...prev.schedule,
        [dayKey]: {
          ...currentDay,
          open: !currentDay.open
        }
      };
      return {
        ...prev,
        schedule: newSchedule,
        hours: formatScheduleSummary(newSchedule)
      };
    });
  };

  const handleDayHours = (dayKey, field, value) => {
    setFormData(prev => {
      const currentDay = prev.schedule?.[dayKey] || DEFAULT_SCHEDULE[dayKey];
      const newSchedule = {
        ...prev.schedule,
        [dayKey]: {
          ...currentDay,
          [field]: value
        }
      };
      return {
        ...prev,
        schedule: newSchedule,
        hours: formatScheduleSummary(newSchedule)
      };
    });
  };

  const handlePresetSchedule = (type) => {
    let newSchedule = { ...DEFAULT_SCHEDULE };
    if (type === 'classic') {
      DAY_ORDER.forEach(d => {
        newSchedule[d] = {
          ...newSchedule[d],
          open: d !== 'lundi',
          start: '09:30',
          end: '19:30'
        };
      });
    } else if (type === '7j7') {
      DAY_ORDER.forEach(d => {
        newSchedule[d] = {
          ...newSchedule[d],
          open: true,
          start: '09:00',
          end: '20:00'
        };
      });
    } else if (type === 'mon_sat') {
      DAY_ORDER.forEach(d => {
        newSchedule[d] = {
          ...newSchedule[d],
          open: d !== 'dimanche',
          start: '09:00',
          end: '19:00'
        };
      });
    }

    setFormData(prev => ({
      ...prev,
      schedule: newSchedule,
      hours: formatScheduleSummary(newSchedule)
    }));
  };

  // Upload Cover to Cloudinary
  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file);
      handleChange('coverImage', res.url);
    } catch (err) {
      setUploadError("Erreur lors de l'envoi de la bannière : " + (err.message || ''));
    } finally {
      setUploadingCover(false);
    }
  };

  // Upload Avatar to Cloudinary
  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file);
      handleChange('avatarImage', res.url);
    } catch (err) {
      setUploadError("Erreur lors de l'envoi du logo : " + (err.message || ''));
    } finally {
      setUploadingAvatar(false);
    }
  };


  // Founder photo upload
  const handleFounderImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFounder(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file);
      setFormData(prev => ({
        ...prev,
        story: {
          ...(prev.story || DEFAULT_STORY),
          founderImage: res.url,
          founderPhoto: res.url
        }
      }));
    } catch (err) {
      setUploadError("Erreur lors de l'upload de la photo fondatrice : " + (err.message || ''));
    } finally {
      setUploadingFounder(false);
    }
  };

  const handleRemoveFounderImage = () => {
    setFormData(prev => ({
      ...prev,
      story: {
        ...(prev.story || DEFAULT_STORY),
        founderImage: '',
        founderPhoto: ''
      }
    }));
  };

  // Story handlers
  const handleStoryChange = (field, value) => {
    setFormData(prev => {
      const currentStory = prev.story || DEFAULT_STORY;
      const updatedStory = {
        ...currentStory,
        [field]: value
      };
      if (field === 'content') {
        updatedStory.paragraphs = value ? value.split('\n').filter(p => p.trim()) : [];
      }
      return {
        ...prev,
        story: updatedStory
      };
    });
  };

  // Team state & handlers
  const [showAddTeam, setShowAddTeam] = useState(false);
  const [newTeamMember, setNewTeamMember] = useState({
    name: '',
    role: '',
    description: '',
    image: ''
  });

  const handleTeamMemberImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTeamMember(true);
    setUploadError(null);
    try {
      const res = await uploadToCloudinary(file);
      setNewTeamMember(prev => ({ ...prev, image: res.url }));
    } catch (err) {
      setUploadError("Erreur upload photo membre équipe : " + (err.message || ''));
    } finally {
      setUploadingTeamMember(false);
    }
  };

  const handleAddTeamMember = (e) => {
    e?.preventDefault();
    if (!newTeamMember.name.trim()) return;
    const member = {
      id: 'team_' + Date.now(),
      name: newTeamMember.name.trim(),
      role: newTeamMember.role.trim() || 'Coiffeuse Styliste',
      description: (newTeamMember.description || '').trim(),
      image: newTeamMember.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'
    };
    setFormData(prev => ({
      ...prev,
      team: [...(prev.team || []), member]
    }));
    setNewTeamMember({ name: '', role: '', description: '', image: '' });
    setShowAddTeam(false);
  };

  const handleRemoveTeamMember = (id) => {
    setFormData(prev => ({
      ...prev,
      team: (prev.team || []).filter(m => m.id !== id)
    }));
  };

  const handleResetTeam = () => {
    setFormData(prev => ({ ...prev, team: DEFAULT_TEAM }));
  };

  // Galerie Photos state & handlers
  const handleLookbookImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingLookbook(true);
    setUploadError(null);
    try {
      const newItems = [];
      for (const file of files) {
        const res = await uploadToCloudinary(file);
        newItems.push({
          id: 'lb_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
          title: 'Réalisation du salon',
          category: 'Nos Réalisations',
          image: res.url
        });
      }
      setFormData(prev => ({
        ...prev,
        lookbook: [...newItems, ...(prev.lookbook || [])]
      }));
    } catch (err) {
      setUploadError("Erreur upload photo galerie : " + (err.message || ''));
    } finally {
      setUploadingLookbook(false);
      if (lookbookInputRef.current) lookbookInputRef.current.value = '';
    }
  };

  const handleUpdateLookbookTitle = (id, newTitle) => {
    setFormData(prev => ({
      ...prev,
      lookbook: (prev.lookbook || []).map(item => item.id === id ? { ...item, title: newTitle } : item)
    }));
  };

  const handleRemoveLookbookItem = (id) => {
    setFormData(prev => ({
      ...prev,
      lookbook: (prev.lookbook || []).filter(lb => lb.id !== id)
    }));
  };

  const handleResetLookbook = () => {
    setFormData(prev => ({ ...prev, lookbook: DEFAULT_LOOKBOOK }));
  };





  // QR Code download & print
  const handleDownloadQr = () => {
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(realUrl)}&margin=15`;
    const link = document.createElement('a');
    link.href = qrUrl;
    link.download = `qrcode-${salon?.slug || 'salon'}.png`;
    link.target = '_blank';
    link.click();
  };

  const handlePrintPoster = () => {
    window.print();
  };

  // Save changes to Context & Supabase
  const handleSave = async () => {
    setIsSaving(true);
    setUploadError(null);
    try {
      await updateSalon(formData);
      setSaveSuccess(true);
      setIframeKey(k => k + 1);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setUploadError("Erreur lors de l'enregistrement : " + (err.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  // Real public link
  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const realUrl = `${origin}/?salon=${salon?.slug || 'mon-salon'}`;
  const displayUrl = typeof window !== 'undefined' ? `${window.location.host}/?salon=${salon?.slug || 'mon-salon'}` : realUrl;
  const publicUrl = displayUrl;
  const handleCopyLink = () => {
    navigator.clipboard.writeText(realUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const currentTheme = THEMES[formData.theme] || THEMES.pink;

  return (
    <div className="space-y-6">

      {/* Top Bar: Headline & 2 Unique Action Buttons */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-pink-100 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-pink-50 text-pink-600 font-bold text-sm">
                🎨 Ma Vitrine
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Éditeur de Vitrine & Page Publique
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Personnalisez les prestations, photos, équipe et horaires que vos clientes découvrent sur votre lien de réservation.
            </p>
          </div>

          {/* Actions: UN SEUL bouton Copier, UN SEUL bouton Ouvrir, et Enregistrer */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Bouton unique : Copier mon lien de réservation */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="px-4 py-2.5 rounded-2xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs flex items-center gap-2 transition-all border border-pink-200 cursor-pointer shadow-2xs"
            >
              {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copiedLink ? 'Lien copié !' : 'Copier mon lien de réservation'}</span>
            </button>

            {/* 2. Bouton unique : Ouvrir ma vitrine (nouvel onglet) */}
            <a
              href={realUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => updateSalon(formData)}
              className="px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs flex items-center gap-2 transition-all border border-slate-200 cursor-pointer shadow-2xs"
              title="Ouvrir la vitrine dans un nouvel onglet"
            >
              <ExternalLink className="w-4 h-4 text-slate-600" />
              <span>Ouvrir ma vitrine ↗</span>
            </a>

            {/* Bouton Enregistrer */}
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs flex items-center gap-2 transition-all shadow-md shadow-pink-500/20 cursor-pointer disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{saveSuccess ? 'Enregistré !' : isSaving ? 'Enregistrement...' : 'Enregistrer'}</span>
            </button>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {uploadError && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}
      </div>

      {/* Sélecteur de Mode Mobile : [ ✏️ Modifier ma vitrine ] [ 👁️ Voir le résultat live ] */}
      <div className="lg:hidden flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileMode('edit')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileMode === 'edit'
              ? 'bg-white text-pink-700 shadow-xs border border-pink-100'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-pink-600" />
          <span>✏️ Modifier ma vitrine</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileMode('preview')}
          className={`flex-1 py-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
            mobileMode === 'preview'
              ? 'bg-pink-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>👁️ Voir le résultat live</span>
        </button>
      </div>

      {/* Mode Aperçu Live sur Mobile */}
      {mobileMode === 'preview' && (
        <div className="lg:hidden space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between text-xs shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-bold truncate">Aperçu direct (Vue cliente)</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <a
                href={realUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-bold text-slate-200 hover:text-white flex items-center gap-1 cursor-pointer bg-slate-800 hover:bg-slate-700 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Plein écran ↗</span>
              </a>
              <button
                type="button"
                onClick={() => setIframeKey(k => k + 1)}
                className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition-all cursor-pointer"
                title="Actualiser la vitrine"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Iframe adaptative à l'écran mobile réel */}
          <div className="w-full h-[calc(100dvh-200px)] min-h-[520px] rounded-3xl border-2 border-slate-200 shadow-lg overflow-hidden bg-white">
            <iframe
              key={iframeKey}
              src={`${realUrl}&v=${iframeKey}`}
              title="Aperçu Mobile Salon"
              className="w-full h-full border-0"
            />
          </div>
        </div>
      )}

      {/* Layout Split-Screen: Configuration à gauche, Aperçu Live à droite */}
      <div className={`grid grid-cols-1 lg:grid-cols-12 gap-6 items-start ${mobileMode === 'preview' ? 'hidden lg:grid' : 'grid'}`}>
        
        {/* Colonne Gauche: Onglets & Formulaires de configuration */}
        <div className="lg:col-span-7 space-y-5">
          
          {/* 1. Hub d'Édition Mobile (Très clair, illustré, compréhensible) */}
          {mobileSection === null ? (
            <div className="lg:hidden space-y-3.5">
              <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-2xl border border-pink-100 flex items-start gap-3 text-xs text-pink-950">
                <Sparkles className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold block text-pink-900">Que souhaitez-vous modifier ?</span>
                  <p className="text-[11px] text-pink-800/80 mt-0.5">
                    Touchez l'une des rubriques ci-dessous pour mettre à jour votre salon en toute simplicité :
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5">
                {/* 1. Logo ou Photo de Profil / Bannière */}
                <button
                  type="button"
                  onClick={() => { setActiveEditorTab('branding'); setMobileSection('branding'); }}
                  className="p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-violet-100 text-violet-700 flex items-center justify-center shrink-0">
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">Logo & Photo de Profil</span>
                        <span className="px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 text-[10px] font-black">
                          Prioritaire
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Photo de profil, logo du salon et bannière de couverture
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>

                {/* 2. Prestations & Tarifs */}
                <button
                  type="button"
                  onClick={() => { setActiveEditorTab('services'); setMobileSection('services'); }}
                  className="p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <Scissors className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">Prestations & Tarifs</span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-700 text-[10px] font-black">
                          {services?.length || 0} soins
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Ajouter ou modifier vos coiffures, durées et prix
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>

                {/* 3. Horaires d'ouverture */}
                <button
                  type="button"
                  onClick={() => { setActiveEditorTab('schedule'); setMobileSection('schedule'); }}
                  className="p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-sm text-slate-900 block">Horaires d'ouverture</span>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Jours et créneaux horaires de rendez-vous
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>

                {/* 4. Coordonnées & Réseaux */}
                <button
                  type="button"
                  onClick={() => { setActiveEditorTab('info'); setMobileSection('info'); }}
                  className="p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <Phone className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-black text-sm text-slate-900 block">Coordonnées & Réseaux</span>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        WhatsApp, Téléphone, Adresse à Dakar
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>

                {/* 5. Notre Équipe */}
                <button
                  type="button"
                  onClick={() => { setActiveEditorTab('team'); setMobileSection('team'); }}
                  className="p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">Notre Équipe</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black">
                          {formData.team?.length || 0} membres
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Vos coiffeuses et collaboratrices
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>

                {/* 6. Galerie Photos */}
                <button
                  type="button"
                  onClick={() => { setActiveEditorTab('gallery'); setMobileSection('gallery'); }}
                  className="p-4 rounded-2xl bg-white border border-pink-100 hover:border-pink-300 shadow-2xs flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-2xl bg-pink-100 text-pink-700 flex items-center justify-center shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-slate-900">Galerie Photos</span>
                        <span className="px-2 py-0.5 rounded-full bg-pink-100 text-pink-800 text-[10px] font-black">
                          {formData.lookbook?.length || 0} photos
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">
                        Vos plus belles coiffures et réalisations
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
                </button>
              </div>
            </div>
          ) : (
            /* Barre de retour claire sur Mobile quand on est dans une section */
            <div className="lg:hidden">
              <button
                type="button"
                onClick={() => setMobileSection(null)}
                className="w-full py-2.5 px-4 rounded-2xl bg-slate-900 text-white text-xs font-black flex items-center justify-between gap-2 shadow-xs cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ChevronLeft className="w-4 h-4 text-pink-400" />
                  <span>← Revenir aux rubriques</span>
                </div>
                <span className="text-[10px] text-pink-300 uppercase tracking-wider font-bold">
                  {activeEditorTab === 'branding' && 'Logo & Photos'}
                  {activeEditorTab === 'services' && 'Prestations'}
                  {activeEditorTab === 'schedule' && 'Horaires'}
                  {activeEditorTab === 'info' && 'Coordonnées'}
                  {activeEditorTab === 'team' && 'Équipe'}
                  {activeEditorTab === 'gallery' && 'Galerie'}
                </span>
              </button>
            </div>
          )}

          {/* 2. Editor Tabs Navigation (Visible UNIQUEMENT sur Desktop PC) */}
          <div className="hidden lg:flex bg-white p-2 rounded-2xl border border-pink-100 shadow-xs gap-1 overflow-x-auto scrollbar-none">
            {/* 1. Logo & Bannière en premier */}
            <button
              onClick={() => setActiveEditorTab('branding')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'branding'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logo & Photo de Profil</span>
            </button>

            {/* 2. Prestations & Tarifs */}
            <button
              onClick={() => setActiveEditorTab('services')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'services'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Prestations & Tarifs ({services?.length || 0})</span>
            </button>

            {/* 3. Horaires & Disponibilités */}
            <button
              onClick={() => setActiveEditorTab('schedule')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'schedule'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Horaires & Disponibilités</span>
            </button>

            {/* 4. Coordonnées & Localisation */}
            <button
              onClick={() => setActiveEditorTab('info')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'info'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Type className="w-3.5 h-3.5" />
              <span>Coordonnées</span>
            </button>

            {/* 5. Notre Équipe */}
            <button
              onClick={() => setActiveEditorTab('team')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'team'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Notre Équipe ({formData.team?.length || 0})</span>
            </button>

            {/* 6. Galerie Photos */}
            <button
              onClick={() => setActiveEditorTab('gallery')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'gallery'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Galerie Photos ({formData.lookbook?.length || 0})</span>
            </button>

            {/* 7. Annonce & Réseaux */}
            <button
              onClick={() => setActiveEditorTab('promo')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'promo'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Annonce & Réseaux</span>
            </button>

            {/* 8. QR Code Comptoir */}
            <button
              onClick={() => setActiveEditorTab('qrcode')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeEditorTab === 'qrcode'
                  ? 'bg-pink-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-pink-600 hover:bg-pink-50'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code Comptoir</span>
            </button>
          </div>

          {/* Formulaires d'édition (Visibles sur PC toujours, et sur mobile uniquement si mobileSection !== null) */}
          <div className={`${mobileSection === null ? 'hidden lg:block' : 'block'} space-y-5`}>

          {/* TAB 1: PRESTATIONS & PRIX (SERVICE MANAGER) */}
          {activeEditorTab === 'services' && (
            <ServiceManager />
          )}

          {/* TAB: GALERIE PHOTOS / LOOKBOOK */}
          {activeEditorTab === 'gallery' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-6">
              {/* Hidden file input for single or multiple photo upload */}
              <input
                ref={lookbookInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleLookbookImageUpload}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Camera className="w-4 h-4 text-pink-600" />
                    <span>Galerie de vos Réalisations ({formData.lookbook?.length || 0})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Importez directement les photos de vos coiffures et créations. Vos clientes sauront que ce sont vos propres œuvres.
                  </p>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => lookbookInputRef.current?.click()}
                    disabled={uploadingLookbook}
                    className="px-4 py-2.5 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-2 cursor-pointer shadow-xs transition-all disabled:opacity-50"
                  >
                    {uploadingLookbook ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Envoi des photos en cours...</span>
                      </>
                    ) : (
                      <>
                        <UploadCloud className="w-4 h-4" />
                        <span>+ Importer des photos</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Loader alert while uploading */}
              {uploadingLookbook && (
                <div className="p-4 rounded-2xl bg-pink-50 border border-pink-200 flex items-center gap-3 text-xs font-bold text-pink-700">
                  <Loader2 className="w-4 h-4 animate-spin shrink-0 text-pink-600" />
                  <span>Optimisation et enregistrement de vos photos dans la galerie...</span>
                </div>
              )}

              {/* Galerie Photos List */}
              {(!formData.lookbook || formData.lookbook.length === 0) ? (
                <div className="p-10 rounded-2xl bg-pink-50/30 border border-dashed border-pink-200 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-pink-100 text-pink-600 flex items-center justify-center mx-auto">
                    <Camera className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Aucune photo dans votre galerie</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                      Cliquez sur le bouton ci-dessous pour importer vos plus belles coiffures et poses.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => lookbookInputRef.current?.click()}
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold inline-flex items-center gap-2 shadow-xs cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Choisir des photos</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {formData.lookbook.map((item) => (
                    <div
                      key={item.id}
                      className="group relative rounded-2xl overflow-hidden bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-2xs hover:border-pink-300 hover:shadow-xs transition-all"
                    >
                      <div className="relative aspect-square w-full overflow-hidden bg-slate-100">
                        <img
                          src={item.image}
                          alt={item.title || 'Réalisation'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLookbookItem(item.id)}
                          className="absolute top-2 right-2 p-1.5 rounded-xl bg-red-600 text-white shadow-md opacity-90 hover:opacity-100 hover:scale-110 transition-all cursor-pointer"
                          title="Supprimer cette photo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold">
                          {item.category || 'Nos Réalisations'}
                        </span>
                      </div>

                      <div className="p-2.5 bg-white border-t border-slate-100">
                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => handleUpdateLookbookTitle(item.id, e.target.value)}
                          placeholder="Nom de la réalisation..."
                          className="w-full text-xs font-bold text-slate-800 bg-transparent hover:bg-slate-50 focus:bg-pink-50/50 px-1.5 py-1 rounded-lg border border-transparent hover:border-slate-200 focus:border-pink-300 focus:outline-none transition-all"
                          title="Cliquez pour modifier le nom de cette réalisation"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB: NOTRE ÉQUIPE */}
          {activeEditorTab === 'team' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Users className="w-4 h-4 text-pink-600" />
                    <span>Notre Équipe d'Expertes</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Présentez vos coiffeuses, praticiennes et prothésistes pour instaurer un lien de confiance direct.
                  </p>
                </div>
              </div>

              {/* SÉLECTEUR DU MODE D'ORGANISATION : SOLO VS ÉQUIPE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-pink-50/30 border border-slate-200/80 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                      Mode d'Organisation du Salon
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Définissez si vous travaillez seule ou avec une équipe de praticiennes.
                    </p>
                  </div>
                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                    formData.teamMode === 'team'
                      ? 'bg-pink-100 text-pink-700 border-pink-200'
                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  }`}>
                    {formData.teamMode === 'team' ? '👥 Mode Équipe (Plusieurs praticiennes)' : '👤 Mode Solo (Praticienne unique)'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, teamMode: 'solo' }));
                      updateSalon({ teamMode: 'solo' });
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      formData.teamMode === 'solo'
                        ? 'border-pink-500 bg-white ring-4 ring-pink-500/10 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${formData.teamMode === 'solo' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <User className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900">Je travaille seule (Solo)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Un seul agenda unifié. Chaque réservation bloque le fauteuil pour toute la durée de la prestation (ex: 2h).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({ ...prev, teamMode: 'team' }));
                      updateSalon({ teamMode: 'team' });
                    }}
                    className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                      formData.teamMode === 'team'
                        ? 'border-pink-500 bg-white ring-4 ring-pink-500/10 shadow-xs'
                        : 'border-slate-200 bg-white/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${formData.teamMode === 'team' ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                        <Users className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-black text-slate-900">J'ai une équipe (Plusieurs coiffeuses)</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                      Chaque coiffeuse a son propre planning distinct. La cliente peut choisir sa praticienne préférée lors de la réservation.
                    </p>
                  </button>
                </div>
              </div>

              {/* SI MODE SOLO : Message informatif clair */}
              {formData.teamMode === 'solo' && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-pink-100 text-pink-700 flex items-center justify-center mx-auto">
                    <User className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Vous travaillez actuellement en Mode Solo</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Votre salon fonctionne sur un agenda unique sans choix d'employée pour la cliente. Pour ajouter des coiffeuses et permettre aux clientes de choisir leur praticienne préférée, cliquez sur <strong>"J'ai une équipe"</strong> ci-dessus.
                  </p>
                </div>
              )}

              {/* SI MODE ÉQUIPE : Bouton Ajouter un membre + Formulaire + Liste */}
              {formData.teamMode === 'team' && (
                <div className="space-y-6 pt-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-3">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider">
                        Membres de votre équipe ({formData.team?.length || 0})
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Chaque coiffeuse ajoutée ici apparaîtra comme option de choix pour les clientes.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={handleResetTeam}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Réinitialiser</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddTeam(!showAddTeam)}
                        className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Ajouter un membre</span>
                      </button>
                    </div>
                  </div>

                  {/* Add Team Member Form */}
                  {showAddTeam && (
                    <form onSubmit={handleAddTeamMember} className="p-5 rounded-2xl bg-pink-50/50 border border-pink-200 space-y-4">
                      <h4 className="text-xs font-black uppercase text-pink-900 tracking-wider">
                        Nouveau membre d'équipe
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Prénom & Nom *</label>
                          <input
                            type="text"
                            required
                            value={newTeamMember.name}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="ex: Awa Diop"
                            className="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">Fonction *</label>
                          <input
                            type="text"
                            required
                            value={newTeamMember.role}
                            onChange={(e) => setNewTeamMember(prev => ({ ...prev, role: e.target.value }))}
                            placeholder="ex: Coiffeuse Styliste"
                            className="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Description ou Présentation</label>
                        <textarea
                          rows={2}
                          value={newTeamMember.description}
                          onChange={(e) => setNewTeamMember(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="ex: Passionnée par les tresses protectrices, les soins profonds et la mise en valeur des cheveux naturels."
                          className="w-full px-3.5 py-2 rounded-xl border border-pink-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                        />
                      </div>

                      {/* Photo upload */}
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Photo du membre</label>
                        <input
                          ref={teamMemberInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleTeamMemberImageUpload}
                          className="hidden"
                        />
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => teamMemberInputRef.current?.click()}
                            disabled={uploadingTeamMember}
                            className="px-4 py-2 rounded-xl bg-white border border-pink-200 hover:bg-pink-50 text-pink-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
                          >
                            {uploadingTeamMember ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
                            <span>{uploadingTeamMember ? 'Envoi...' : 'Choisir une photo'}</span>
                          </button>
                          {newTeamMember.image && (
                            <div className="flex items-center gap-2">
                              <img src={newTeamMember.image} alt="Aperçu" className="w-10 h-10 rounded-xl object-cover border border-pink-200" />
                              <span className="text-[11px] text-emerald-700 font-bold">✓ Photo prête</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setShowAddTeam(false)}
                          className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 cursor-pointer"
                        >
                          Annuler
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold cursor-pointer"
                        >
                          Enregistrer le membre
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Team list */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {(formData.team || []).map((member) => (
                      <div key={member.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0">
                          <img src={member.image} alt={member.name} className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-200" />
                          <div className="min-w-0">
                            <h4 className="font-extrabold text-slate-900 text-xs truncate">{member.name}</h4>
                            <p className="text-[11px] text-pink-600 font-bold truncate">{member.role}</p>
                            {(member.description || member.specialty) && (
                              <p className="text-[10px] text-slate-500 line-clamp-2 mt-0.5">{member.description || member.specialty}</p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveTeamMember(member.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                          title="Supprimer ce membre"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: HORAIRES & DISPONIBILITÉS RÉELLES */}
          {activeEditorTab === 'schedule' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-pink-600" />
                    <span>Disponibilités & Créneaux Réels</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Définissez vos jours et heures de réception. Vos clientes ne pourront réserver que sur vos plages réelles.
                  </p>
                </div>

                {/* Slot Interval */}
                <div className="flex items-center gap-2 bg-pink-50/80 p-2 rounded-2xl border border-pink-100 shrink-0">
                  <Sliders className="w-3.5 h-3.5 text-pink-600" />
                  <span className="text-xs font-bold text-slate-700">Intervalle :</span>
                  <select
                    value={formData.slotInterval}
                    onChange={(e) => handleChange('slotInterval', parseInt(e.target.value))}
                    className="px-2.5 py-1 rounded-xl border border-pink-200 text-xs font-bold text-pink-700 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500 cursor-pointer"
                  >
                    <option value={30}>30 min</option>
                    <option value={45}>45 min (conseillé)</option>
                    <option value={60}>1 heure</option>
                    <option value={90}>1h30</option>
                  </select>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Modèles d'horaires rapides en 1 clic :
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handlePresetSchedule('classic')}
                    className="px-3.5 py-2 rounded-xl bg-pink-50 hover:bg-pink-100 text-pink-700 font-bold text-xs border border-pink-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>✨ Classique Dakar (Mardi au Dimanche 09h30 - 19h30, Lundi Fermé)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSchedule('7j7')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>⚡ Ouvert 7j/7 (09h00 - 20h00)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePresetSchedule('mon_sat')}
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <span>📅 Lundi au Samedi (09h00 - 19h00, Dimanche Fermé)</span>
                  </button>
                </div>
              </div>

              {/* Day by day table */}
              <div className="border border-pink-100 rounded-2xl overflow-hidden divide-y divide-pink-50 shadow-2xs">
                {DAY_ORDER.map((dayKey) => {
                  const day = formData.schedule?.[dayKey] || DEFAULT_SCHEDULE[dayKey];
                  const isOpen = !!day.open;

                  return (
                    <div
                      key={dayKey}
                      className={`p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                        isOpen ? 'bg-white' : 'bg-slate-50/70'
                      }`}
                    >
                      {/* Day switch & name */}
                      <div className="flex items-center gap-3.5 min-w-[180px]">
                        <button
                          type="button"
                          onClick={() => handleDayToggle(dayKey)}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isOpen ? 'bg-pink-600' : 'bg-slate-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                              isOpen ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        <div>
                          <span className={`text-xs font-black capitalize block ${isOpen ? 'text-slate-900' : 'text-slate-400'}`}>
                            {day.label}
                          </span>
                          <span className={`text-[10px] font-bold ${isOpen ? 'text-emerald-600' : 'text-slate-400'}`}>
                            {isOpen ? 'Ouvert au public' : 'Fermé (Repos)'}
                          </span>
                        </div>
                      </div>

                      {/* Hours selectors if open */}
                      {isOpen ? (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500 font-semibold">Ouverture :</span>
                          <input
                            type="time"
                            value={day.start}
                            onChange={(e) => handleDayHours(dayKey, 'start', e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                          <span className="text-slate-500 font-semibold">Fermeture :</span>
                          <input
                            type="time"
                            value={day.end}
                            onChange={(e) => handleDayHours(dayKey, 'end', e.target.value)}
                            className="px-3 py-1.5 rounded-xl border border-pink-200 text-xs font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-pink-500"
                          />
                        </div>
                      ) : (
                        <div className="text-xs text-slate-400 italic">
                          Le salon est fermé. Aucun créneau ne sera ouvert à la réservation.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Live Summary Box */}
              <div className="p-4 rounded-2xl bg-pink-50/70 border border-pink-100 flex items-start gap-3 text-xs text-slate-700">
                <Clock className="w-4 h-4 text-pink-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-slate-900 block mb-1">
                    Résumé des horaires affiché en direct sur votre site web :
                  </span>
                  <span className="font-bold text-pink-700 bg-white px-3 py-1.5 rounded-xl border border-pink-200 inline-block shadow-2xs">
                    {formatScheduleSummary(formData.schedule)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOGO & BANNIÈRE (IDENTITÉ VISUELLE HD) */}
          {activeEditorTab === 'branding' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-8">
              
              {/* Section 1: Logo & Photo de Profil */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      1. Logo ou Photo de Profil du Salon
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ce visuel s'affiche dans votre barre de navigation, sur votre profil certifié et dans les reçus WhatsApp.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full">
                    Format Carré (400 x 400px)
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5 p-4 rounded-2xl bg-pink-50/40 border border-pink-100">
                  <div className="relative w-24 h-24 rounded-3xl overflow-hidden border-2 border-pink-200 shadow-md shrink-0 bg-slate-100 flex items-center justify-center">
                    {formData.avatarImage ? (
                      <img
                        src={formData.avatarImage}
                        alt="Logo salon"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-pink-500 to-rose-600 text-white font-black text-2xl flex items-center justify-center">
                        {formData.name?.charAt(0) || 'S'}
                      </div>
                    )}
                    {uploadingAvatar && (
                      <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-center sm:text-left flex-1">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <button
                        type="button"
                        onClick={() => avatarInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        {uploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UploadCloud className="w-3.5 h-3.5" />}
                        <span>{uploadingAvatar ? 'Envoi en cours...' : (formData.avatarImage ? 'Changer de logo' : 'Importer mon logo / photo')}</span>
                      </button>

                      {formData.avatarImage && (
                        <button
                          type="button"
                          onClick={() => handleChange('avatarImage', '')}
                          title="Supprimer la photo de profil"
                          className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1.5 border border-rose-200 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Supprimer</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Formats acceptés : JPG, PNG, WEBP. Stocké en haute qualité sur nos serveurs.
                    </p>
                  </div>
                </div>

                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>

              {/* Section 2: Grande Bannière de Couverture */}
              <div className="space-y-4 pt-6 border-t border-pink-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      2. Grande Bannière de Couverture HD
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      La grande image vitrine en tête de votre site web qui impressionne vos futures clientes.
                    </p>
                  </div>
                  <span className="text-[11px] font-bold text-pink-600 bg-pink-50 px-2.5 py-1 rounded-full">
                    Format Paysage HD (1200 x 500px)
                  </span>
                </div>

                {formData.coverImage ? (
                  <div className="space-y-4">
                    {/* Visual Live Preview Frame */}
                    <div className="relative h-56 sm:h-72 w-full rounded-3xl overflow-hidden border border-slate-200 bg-stone-950 group shadow-md">
                      {/* Fond flouté d'ambiance si mode contain */}
                      {formData.coverFit === 'contain' && (
                        <img
                          src={formData.coverImage}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-60 pointer-events-none"
                        />
                      )}
                      {/* Photo avec cadrage interactif en temps réel */}
                      <img
                        src={formData.coverImage}
                        alt="Bannière salon"
                        style={{
                          objectPosition: typeof formData.coverPosition === 'number' || (!isNaN(Number(formData.coverPosition)) && formData.coverPosition !== '')
                            ? `center ${Number(formData.coverPosition)}%`
                            : formData.coverPosition === 'bottom'
                            ? 'center 100%'
                            : formData.coverPosition === 'center'
                            ? 'center 50%'
                            : 'center 0%',
                          transform: Number(formData.coverZoom || 100) > 100 ? `scale(${Number(formData.coverZoom || 100) / 100})` : undefined,
                          transformOrigin: typeof formData.coverPosition === 'number' || (!isNaN(Number(formData.coverPosition)) && formData.coverPosition !== '')
                            ? `center ${Number(formData.coverPosition)}%`
                            : 'center 0%'
                        }}
                        className={`w-full h-full transition-all duration-150 ${
                          formData.coverFit === 'contain' ? 'object-contain' : 'object-cover'
                        }`}
                      />
                      
                      {/* Badge indicateur de prévisualisation */}
                      <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-xs border border-white/20">
                        <Eye className="w-3.5 h-3.5 text-pink-400" />
                        <span>Aperçu en direct sur votre site</span>
                      </div>

                      {/* Overlay boutons d'action rapide */}
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => coverInputRef.current?.click()}
                          disabled={uploadingCover}
                          className="px-3 py-1.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-900 font-bold text-xs hover:bg-white transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          {uploadingCover ? <Loader2 className="w-3.5 h-3.5 animate-spin text-pink-600" /> : <UploadCloud className="w-3.5 h-3.5 text-pink-600" />}
                          <span>Remplacer</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleChange('coverImage', '')}
                          className="p-1.5 rounded-xl bg-rose-600/90 backdrop-blur-md text-white hover:bg-rose-600 transition-all shadow-xs cursor-pointer"
                          title="Supprimer la bannière"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Studio d'ajustement et de cadrage de la bannière */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-pink-50/40 border border-pink-100 space-y-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <SlidersHorizontal className="w-4 h-4 text-pink-600" />
                          <h4 className="font-black text-xs sm:text-sm text-slate-900 uppercase tracking-wide">
                            Système d'Ajustement du Cadrage
                          </h4>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            handleChange('coverPosition', 20);
                            handleChange('coverZoom', 100);
                            handleChange('coverFit', 'cover');
                          }}
                          className="text-[11px] font-bold text-pink-600 hover:text-pink-700 flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Réinitialiser</span>
                        </button>
                      </div>

                      {/* 1. Curseur de position verticale (Haut ↔ Bas) */}
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            Position Verticale (Haut ↔ Bas) :
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-black text-[11px]">
                            {Number(formData.coverPosition ?? 20)}%
                            {Number(formData.coverPosition ?? 20) <= 25 ? ' (Haut / Visage & Coiffure)' : Number(formData.coverPosition ?? 20) >= 75 ? ' (Bas)' : ' (Centre)'}
                          </span>
                        </div>
                        
                        <input
                          type="range"
                          min="0"
                          max="100"
                          step="1"
                          value={Number(formData.coverPosition ?? 20)}
                          onChange={(e) => handleChange('coverPosition', Number(e.target.value))}
                          className="w-full accent-pink-600 h-2 bg-pink-100 rounded-lg cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>⬆️ 0% (Haut - Visages & Coiffures)</span>
                          <span>⏺️ 50% (Centre)</span>
                          <span>⬇️ 100% (Bas)</span>
                        </div>

                        {/* Boutons de réglage rapide en 1 clic */}
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => handleChange('coverPosition', 0)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              Number(formData.coverPosition) === 0
                                ? 'bg-pink-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-pink-50 border border-pink-100'
                            }`}
                          >
                            <span>⬆️ Haut (Tête)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChange('coverPosition', 50)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              Number(formData.coverPosition) === 50
                                ? 'bg-pink-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-pink-50 border border-pink-100'
                            }`}
                          >
                            <span>⏺️ Centre</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleChange('coverPosition', 100)}
                            className={`py-2 px-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              Number(formData.coverPosition) === 100
                                ? 'bg-pink-600 text-white shadow-xs'
                                : 'bg-white text-slate-700 hover:bg-pink-50 border border-pink-100'
                            }`}
                          >
                            <span>⬇️ Bas (Sol)</span>
                          </button>
                        </div>
                      </div>

                      {/* 2. Zoom & Échelle de la photo */}
                      <div className="space-y-2.5 pt-3 border-t border-pink-100/80">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-700">
                            Agrandissement / Zoom :
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-pink-100 text-pink-700 font-black text-[11px]">
                            {Number(formData.coverZoom ?? 100)}%
                          </span>
                        </div>

                        <input
                          type="range"
                          min="100"
                          max="160"
                          step="5"
                          value={Number(formData.coverZoom ?? 100)}
                          onChange={(e) => handleChange('coverZoom', Number(e.target.value))}
                          className="w-full accent-pink-600 h-2 bg-pink-100 rounded-lg cursor-pointer"
                        />

                        <div className="flex justify-between text-[10px] font-semibold text-slate-500">
                          <span>100% (Taille normale)</span>
                          <span>130% (Zoom modéré)</span>
                          <span>160% (Gros plan)</span>
                        </div>
                      </div>

                      {/* 3. Mode d'affichage de la photo */}
                      <div className="space-y-2 pt-3 border-t border-pink-100/80">
                        <span className="font-bold text-xs text-slate-700 block">
                          Mode d'Affichage :
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => handleChange('coverFit', 'cover')}
                            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                              (formData.coverFit || 'cover') === 'cover'
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                : 'bg-white text-slate-700 border-pink-100 hover:bg-pink-50'
                            }`}
                          >
                            <div className="font-black text-xs flex items-center gap-1.5">
                              <span>🖼️ Remplir tout l'espace (Cover)</span>
                            </div>
                            <p className={`text-[11px] mt-0.5 ${(formData.coverFit || 'cover') === 'cover' ? 'text-pink-100' : 'text-slate-500'}`}>
                              Couvre toute la bannière avec le cadrage que vous avez choisi.
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleChange('coverFit', 'contain')}
                            className={`p-2.5 rounded-xl text-left transition-all cursor-pointer border ${
                              formData.coverFit === 'contain'
                                ? 'bg-pink-600 text-white border-pink-600 shadow-xs'
                                : 'bg-white text-slate-700 border-pink-100 hover:bg-pink-50'
                            }`}
                          >
                            <div className="font-black text-xs flex items-center gap-1.5">
                              <span>🔲 Photo entière à 100% (Contain)</span>
                            </div>
                            <p className={`text-[11px] mt-0.5 ${formData.coverFit === 'contain' ? 'text-pink-100' : 'text-slate-500'}`}>
                              Affiche l'intégralité de la photo sans aucun rognage, avec fond assorti flouté.
                            </p>
                          </button>
                        </div>
                      </div>

                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => coverInputRef.current?.click()}
                    className="h-44 sm:h-56 w-full rounded-3xl border-2 border-dashed border-pink-200 bg-pink-50/30 hover:bg-pink-50/60 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-xs flex items-center justify-center text-pink-600 mb-3 group-hover:scale-110 transition-transform">
                      {uploadingCover ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
                    </div>
                    <p className="font-bold text-xs sm:text-sm text-slate-800">
                      Aucune bannière de couverture pour l'instant
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                      Cliquez pour importer votre photo réelle depuis votre appareil (JPG, PNG, WEBP)
                    </p>
                    <span className="mt-3 px-4 py-2 rounded-xl bg-pink-600 group-hover:bg-pink-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm shadow-pink-500/20">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>{uploadingCover ? 'Envoi en cours...' : 'Importer ma photo de couverture'}</span>
                    </span>
                  </div>
                )}

                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCoverUpload}
                  className="hidden"
                />
              </div>

            </div>
          )}

          {/* TAB 4: COORDONNÉES & PRÉSENTATION */}
          {activeEditorTab === 'info' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Informations & Coordonnées du Salon
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Renseignez les détails pratiques pour que vos clientes vous identifient et vous contactent facilement.
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Nom commercial du salon *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="ex: Fatou Hair Studio"
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Slogan accrocheur (Tagline)
                  </label>
                  <input
                    type="text"
                    value={formData.tagline}
                    onChange={(e) => handleChange('tagline', e.target.value)}
                    placeholder="ex: Salon de coiffure afro & soins capillaires haut de gamme"
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Bio / Présentation du salon
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Présentez vos spécialités, votre savoir-faire et l'accueil que vous réservez à vos clientes..."
                    className="w-full px-4 py-2.5 rounded-xl border border-pink-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                    Adresse physique exacte à Dakar *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-pink-600 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => handleChange('address', e.target.value)}
                      placeholder="ex: Route des Almadies, en face Brioche Dorée, Dakar"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                      Téléphone pour appels clientes *
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-pink-600 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="+221 77 842 19 80"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-800 uppercase tracking-wider mb-1">
                      Numéro WhatsApp (pour le bouton WhatsApp direct) *
                    </label>
                    <div className="relative">
                      <MessageCircle className="w-4 h-4 text-emerald-600 absolute left-3.5 top-3" />
                      <input
                        type="text"
                        value={formData.whatsapp}
                        onChange={(e) => handleChange('whatsapp', e.target.value.replace(/\D/g, ''))}
                        placeholder="221778421980 (avec indicatif pays)"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-pink-200 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Réseaux Sociaux & Liens Bio */}
                <div className="pt-6 border-t border-pink-50 space-y-4">
                  <div>
                    <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <Share2 className="w-3.5 h-3.5 text-pink-600" />
                      <span>Réseaux Sociaux du Salon (Instagram, TikTok, Facebook)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Dès que vous renseignez un compte ou un lien, le logo officiel apparaît sur votre site et redirige directement vers votre page.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Instagram */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                      <label className="flex items-center justify-between text-xs font-black text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shrink-0 shadow-2xs">
                            <InstagramIcon className="w-3 h-3 fill-white" />
                          </span>
                          <span>Instagram</span>
                        </span>
                        {formData.instagram && (
                          <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Logo actif ✓
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
                        <input
                          type="text"
                          value={formData.instagram}
                          onChange={(e) => handleChange('instagram', e.target.value.replace(/^[@/]+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, ''))}
                          placeholder="fatouhairstudio"
                          className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      {formData.instagram && (
                        <a
                          href={formatSocialUrl('instagram', formData.instagram)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 hover:underline pt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Tester ({getSocialHandle('instagram', formData.instagram)}) ↗</span>
                        </a>
                      )}
                    </div>

                    {/* TikTok */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                      <label className="flex items-center justify-between text-xs font-black text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xs">
                            <TikTokIcon className="w-3 h-3 fill-white" />
                          </span>
                          <span>TikTok</span>
                        </span>
                        {formData.tiktok && (
                          <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Logo actif ✓
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
                        <input
                          type="text"
                          value={formData.tiktok}
                          onChange={(e) => handleChange('tiktok', e.target.value.replace(/^[@/]+/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, ''))}
                          placeholder="fatouhair_sn"
                          className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      {formData.tiktok && (
                        <a
                          href={formatSocialUrl('tiktok', formData.tiktok)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-black hover:underline pt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Tester ({getSocialHandle('tiktok', formData.tiktok)}) ↗</span>
                        </a>
                      )}
                    </div>

                    {/* Facebook */}
                    <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                      <label className="flex items-center justify-between text-xs font-black text-slate-800">
                        <span className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-2xs">
                            <FacebookIcon className="w-3 h-3 fill-white" />
                          </span>
                          <span>Facebook</span>
                        </span>
                        {formData.facebook && (
                          <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Logo actif ✓
                          </span>
                        )}
                      </label>
                      <input
                        type="text"
                        value={formData.facebook}
                        onChange={(e) => handleChange('facebook', e.target.value.replace(/^https?:\/\/(www\.)?facebook\.com\//i, ''))}
                        placeholder="nom_page_ou_profil"
                        className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                      {formData.facebook && (
                        <a
                          href={formatSocialUrl('facebook', formData.facebook)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline pt-0.5"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Tester ({getSocialHandle('facebook', formData.facebook)}) ↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}


          {/* TAB 6: ANNONCE & RÉSEAUX */}
          {activeEditorTab === 'promo' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">
                  Bandeau d'Annonce Flash & Réseaux Sociaux
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Mettez en avant vos offres spéciales, vos nouveaux créneaux et vos comptes Instagram / TikTok.
                </p>
              </div>

              {/* Announcement Banner */}
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-pink-50 via-rose-50 to-pink-50 border border-pink-200/80 space-y-2">
                <label className="block text-xs font-black text-pink-900 uppercase tracking-wider">
                  📢 Bandeau d'annonce en haut du site (Ruban défilant)
                </label>
                <input
                  type="text"
                  value={formData.announcementBanner}
                  onChange={(e) => handleChange('announcementBanner', e.target.value)}
                  placeholder="ex: 🎉 Promo Découverte : -2 000 FCFA sur toutes les tresses ce week-end !"
                  className="w-full px-4 py-2.5 rounded-xl border border-pink-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500 shadow-2xs"
                />
                <p className="text-[11px] text-pink-800/80">
                  Laissez vide pour masquer le bandeau. S'il est rempli, il s'affiche tout en haut de votre site avec une animation.
                </p>
              </div>

              {/* Socials */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Instagram */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <label className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shrink-0 shadow-2xs">
                        <InstagramIcon className="w-3 h-3 fill-white" />
                      </span>
                      <span>Instagram</span>
                    </span>
                    {formData.instagram && (
                      <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Logo actif ✓
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      value={formData.instagram}
                      onChange={(e) => handleChange('instagram', e.target.value.replace(/^[@/]+/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//i, ''))}
                      placeholder="fatouhairstudio"
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  {formData.instagram && (
                    <a
                      href={formatSocialUrl('instagram', formData.instagram)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-pink-600 hover:text-pink-700 hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Tester ({getSocialHandle('instagram', formData.instagram)}) ↗</span>
                    </a>
                  )}
                </div>

                {/* TikTok */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <label className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-slate-900 flex items-center justify-center text-white shrink-0 shadow-2xs">
                        <TikTokIcon className="w-3 h-3 fill-white" />
                      </span>
                      <span>TikTok</span>
                    </span>
                    {formData.tiktok && (
                      <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Logo actif ✓
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">@</span>
                    <input
                      type="text"
                      value={formData.tiktok}
                      onChange={(e) => handleChange('tiktok', e.target.value.replace(/^[@/]+/, '').replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, ''))}
                      placeholder="fatouhair_sn"
                      className="w-full pl-8 pr-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                  </div>
                  {formData.tiktok && (
                    <a
                      href={formatSocialUrl('tiktok', formData.tiktok)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-800 hover:text-black hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Tester ({getSocialHandle('tiktok', formData.tiktok)}) ↗</span>
                    </a>
                  )}
                </div>

                {/* Facebook */}
                <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50/70 border border-slate-200/80">
                  <label className="flex items-center justify-between text-xs font-black text-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-5 h-5 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shrink-0 shadow-2xs">
                        <FacebookIcon className="w-3 h-3 fill-white" />
                      </span>
                      <span>Facebook</span>
                    </span>
                    {formData.facebook && (
                      <span className="text-[10px] text-emerald-600 font-black bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        Logo actif ✓
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={formData.facebook}
                    onChange={(e) => handleChange('facebook', e.target.value.replace(/^https?:\/\/(www\.)?facebook\.com\//i, ''))}
                    placeholder="nom_page_ou_profil"
                    className="w-full px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-pink-500"
                  />
                  {formData.facebook && (
                    <a
                      href={formatSocialUrl('facebook', formData.facebook)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline pt-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Tester ({getSocialHandle('facebook', formData.facebook)}) ↗</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}



          {/* TAB: QR CODE COMPTOIR */}
          {activeEditorTab === 'qrcode' && (
            <div className="bg-white p-5 sm:p-7 rounded-3xl border border-pink-100 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-pink-50 pb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-pink-600" />
                    QR Code & Affichette de Comptoir
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Imprimez cette affichette ou posez le QR code sur votre caisse et vitrine : vos clientes scannent et réservent en 30s.
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-slate-600" />
                    <span>Télécharger l'image PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePrintPoster}
                    className="px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Imprimer l'affichette</span>
                  </button>
                </div>
              </div>

              {/* Poster Card Container for display & print */}
              <div className="max-w-md mx-auto bg-gradient-to-b from-pink-50 via-white to-pink-50/40 p-6 sm:p-8 rounded-3xl border-2 border-pink-200 text-center shadow-lg space-y-5">
                {/* Salon Brand */}
                <div className="space-y-1.5">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-pink-600 to-rose-400 p-0.5 shadow-md flex items-center justify-center overflow-hidden">
                    {formData.avatarImage ? (
                      <img src={formData.avatarImage} alt="Logo" className="w-full h-full object-cover rounded-[14px]" />
                    ) : (
                      <Scissors className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <h2 className="text-xl font-black text-slate-900 tracking-tight">
                    {formData.name || salon.name || 'Mon Salon Pro'}
                  </h2>
                  <p className="text-xs text-slate-600 max-w-xs mx-auto">
                    {formData.tagline || 'Réservation en ligne en 30s • Zéro attente garantie'}
                  </p>
                </div>

                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-100 text-pink-700 text-[11px] font-black uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Scannez pour réserver</span>
                </div>

                {/* The QR code */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-pink-100 inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(realUrl)}&margin=10`}
                    alt="QR Code Réservation"
                    className="w-56 h-56 mx-auto"
                  />
                </div>

                {/* Instructions */}
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-800">
                    Ouvrez l'appareil photo de votre téléphone et pointez le QR code.
                  </p>
                  <div className="flex items-center justify-center gap-2 text-[11px] text-slate-600 font-semibold">
                    <span className="px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold">🌊 Wave Sénégal</span>
                    <span>• Acompte déduit sur place</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-mono break-all pt-1">
                    {realUrl}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Bottom Save Bar */}
          <div className="bg-pink-50/60 p-4 sm:p-5 rounded-3xl border border-pink-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <Info className="w-4 h-4 text-pink-600 shrink-0" />
              <span>Vos modifications sont enregistrées et appliquées directement sur votre lien de réservation.</span>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-pink-600 hover:bg-pink-700 text-white font-black text-xs flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-md shadow-pink-500/20 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
            </div>

          </div>

        </div>

        {/* Colonne Droite: Aperçu Live Interactif Multi-Écrans Responsive */}
        <div className="hidden lg:block lg:col-span-5 sticky top-6 space-y-3">
          {/* Top Control Bar with Device Switcher */}
          <div className="bg-slate-900 text-white p-2.5 rounded-2xl flex items-center justify-between gap-2 text-xs shadow-md border border-slate-800">
            {/* Device selector */}
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Format Smartphone standard (375px)"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>375px</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('large_mobile')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'large_mobile' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Format Grand Smartphone Max (425px)"
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>425px</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
                title="Format Ordinateur / Pleine largeur"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>PC</span>
              </button>
            </div>

            {/* Actions: Fullscreen modal, refresh, open in new tab */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsFullscreenPreview(true)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Agrandir en mode simulateur plein écran"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setIframeKey(k => k + 1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Rafraîchir l'aperçu"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => window.open(realUrl, '_blank')}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Ouvrir dans un nouvel onglet"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Device Frame Display (Responsive Height & Width) */}
          <div className="flex justify-center w-full">
            {previewDevice === 'desktop' ? (
              /* Desktop Browser Mockup */
              <div className="relative w-full h-[calc(100vh-175px)] min-h-[520px] max-h-[740px] rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-2xl overflow-hidden transition-all duration-300 flex flex-col">
                <div className="h-8 bg-slate-900 border-b border-slate-800 px-3 flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-rose-500/80" />
                    <div className="w-2 h-2 rounded-full bg-amber-500/80" />
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
                  </div>
                  <div className="flex-1 max-w-xs mx-auto bg-slate-950 px-2.5 py-0.5 rounded-md text-[10px] text-slate-400 flex items-center gap-1.5 truncate border border-slate-800">
                    <Lock className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                </div>
                <iframe
                  key={`desktop-${iframeKey}`}
                  src={`${realUrl}&v=${iframeKey}`}
                  title="Aperçu Vitrine Salon Ordinateur"
                  className="w-full flex-1 bg-white border-0"
                />
              </div>
            ) : (
              /* Smartphone Mockup (Mobile 375px ou Grand 425px) */
              <div
                className={`relative mx-auto w-full ${
                  previewDevice === 'large_mobile' ? 'max-w-[425px]' : 'max-w-[375px]'
                } h-[calc(100vh-175px)] min-h-[520px] max-h-[740px] rounded-[42px] border-[6px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800 transition-all duration-300`}
              >
                {/* Dynamic Island */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-24 h-4 bg-black rounded-full z-20 flex items-center justify-center pointer-events-none shadow-xs">
                  <div className="w-2 h-2 rounded-full bg-slate-900/80 ml-auto mr-2" />
                </div>

                <iframe
                  key={`${previewDevice}-${iframeKey}`}
                  src={`${realUrl}&v=${iframeKey}`}
                  title="Aperçu Vitrine Salon Mobile"
                  className="w-full h-full bg-white rounded-[36px] border-0"
                />
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Modal Plein Écran de Test Responsive (Simulateur Immersion) */}
      {isFullscreenPreview && (
        <div className="fixed inset-0 z-[99999] bg-slate-950/90 backdrop-blur-md p-3 sm:p-6 flex flex-col animate-in fade-in duration-200">
          {/* Header Bar */}
          <div className="flex items-center justify-between bg-slate-900 px-4 sm:px-6 py-3 rounded-2xl border border-slate-800 text-white mb-4 shadow-xl">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-sm hidden sm:inline">Simulateur Responsive en Direct</span>
              <span className="font-bold text-xs sm:hidden">Simulateur</span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center bg-slate-800 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'mobile' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile (375px)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('large_mobile')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'large_mobile' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Tablet className="w-3.5 h-3.5" />
                <span>Grand (425px)</span>
              </button>

              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                  previewDevice === 'desktop' ? 'bg-pink-600 text-white shadow-xs' : 'text-slate-300 hover:text-white'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>Ordinateur</span>
              </button>
            </div>

            {/* Close modal */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIframeKey(k => k + 1)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Rafraîchir"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsFullscreenPreview(false)}
                className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <X className="w-4 h-4" />
                <span>Fermer</span>
              </button>
            </div>
          </div>

          {/* Canvas Wrapper */}
          <div className="flex-1 flex items-center justify-center overflow-hidden w-full">
            {previewDevice === 'desktop' ? (
              <div className="w-full h-full max-w-6xl rounded-2xl border-2 border-slate-800 bg-slate-950 shadow-2xl overflow-hidden flex flex-col">
                <div className="h-9 bg-slate-900 border-b border-slate-800 px-4 flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 max-w-md mx-auto bg-slate-950 px-3 py-1 rounded-lg text-xs text-slate-400 flex items-center gap-2 border border-slate-800">
                    <Lock className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="truncate">{displayUrl}</span>
                  </div>
                </div>
                <iframe
                  key={`modal-desktop-${iframeKey}`}
                  src={`${realUrl}&v=${iframeKey}`}
                  title="Simulateur Plein Écran Desktop"
                  className="w-full flex-1 bg-white border-0"
                />
              </div>
            ) : (
              <div
                className={`relative mx-auto w-full ${
                  previewDevice === 'large_mobile' ? 'max-w-[425px]' : 'max-w-[375px]'
                } h-full max-h-[820px] rounded-[48px] border-[8px] border-slate-900 bg-slate-900 shadow-2xl overflow-hidden ring-1 ring-slate-800 transition-all duration-300`}
              >
                {/* Dynamic Island */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-4 bg-black rounded-full z-20 flex items-center justify-center pointer-events-none shadow-xs">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-900/80 ml-auto mr-2" />
                </div>

                <iframe
                  key={`modal-mobile-${previewDevice}-${iframeKey}`}
                  src={`${realUrl}&v=${iframeKey}`}
                  title="Simulateur Plein Écran Mobile"
                  className="w-full h-full bg-white rounded-[40px] border-0"
                />
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};


