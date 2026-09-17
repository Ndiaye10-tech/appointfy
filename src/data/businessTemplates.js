// src/data/businessTemplates.js

export const BUSINESS_TYPES = {
  beauty_studio: {
    id: 'beauty_studio',
    name: 'Studio de Beauté Féminine',
    shortName: 'Studio Beauté',
    subtitle: 'Coiffure, Ongles, Makeup & Cils',
    icon: 'Sparkles',
    emoji: '✨',
    tagline: 'L\'art de la mise en beauté : Coiffure, Onglerie & Makeup',
    heroSubtitle: 'Réservez votre coiffure, pose d\'ongles, makeup ou soin en quelques clics',
    galleryLabel: 'Nos Créations & Réalisations',
    defaultServices: [
      { name: 'Pose Perruque Lace / Tresses Africaines', duration: 90, price: 15000, category: 'Coiffure' },
      { name: 'Pose Ongles Américaine (Gel X) avec Finition', duration: 60, price: 12000, category: 'Ongles' },
      { name: 'Maquillage Glamour Soirée / Cérémonie', duration: 60, price: 15000, category: 'Makeup' },
      { name: 'Pose Cils Volume Russe / Regard Éclatant', duration: 90, price: 20000, category: 'Regard' }
    ]
  },
  barber: {
    id: 'barber',
    name: 'Barbershop & Coiffure Homme',
    shortName: 'Barbershop Homme',
    subtitle: 'Coupes, Dégradés & Barbe',
    icon: 'Scissors',
    emoji: '💈',
    tagline: 'L\'art de la coiffure et du soin masculin',
    heroSubtitle: 'Réservez votre dégradé, taille de barbe ou soin complet en quelques clics',
    galleryLabel: 'Nos Réalisations Barbershop',
    defaultServices: [
      { name: 'Dégradé Américain / Taper', duration: 45, price: 5000, category: 'Coupe' },
      { name: 'Taille & Soin Barbe Complète', duration: 30, price: 3500, category: 'Barbe' },
      { name: 'Forfait VIP (Coupe + Barbe + Masque Noir)', duration: 75, price: 10000, category: 'Formules VIP' },
      { name: 'Coloration / Teinture Barbe & Contours', duration: 30, price: 4000, category: 'Soins' }
    ]
  },
  mixte: {
    id: 'mixte',
    name: 'Salon Mixte (Hommes & Femmes)',
    shortName: 'Salon Mixte',
    subtitle: 'Prestations Hommes & Femmes',
    icon: 'Sparkles',
    emoji: '✂️',
    tagline: 'Coiffure & Soins pour Hommes et Femmes',
    heroSubtitle: 'Prestations complètes pour homme et femme sur rendez-vous',
    galleryLabel: 'Nos Réalisations',
    defaultServices: [
      { name: 'Coupe Homme & Taille de Barbe', duration: 45, price: 6000, category: 'Homme' },
      { name: 'Brushing & Soin Protéiné Femme', duration: 60, price: 10000, category: 'Femme' },
      { name: 'Pose Ongles Américaine ou Manucure', duration: 60, price: 12000, category: 'Ongles' },
      { name: 'Dégradé ou Tresses Express', duration: 60, price: 8000, category: 'Coiffure' }
    ]
  }
};

export const WORK_MODES = [
  { id: 'salon', label: 'En salon / institut', icon: 'Store', description: 'Vos clients viennent à votre adresse' },
  { id: 'home', label: 'À domicile', icon: 'Car', description: 'Vous vous déplacez chez vos clients' },
  { id: 'both', label: 'Les deux', icon: 'Sparkles', description: 'En salon & à domicile' }
];

export const DEPOSIT_OPTIONS = [
  { id: 'rate_20', label: '20% d\'acompte Wave', value: 20, type: 'percent', recommended: true },
  { id: 'rate_30', label: '30% d\'acompte Wave', value: 30, type: 'percent' },
  { id: 'fixed_5000', label: '5 000 FCFA fixe', value: 5000, type: 'fixed' },
  { id: 'none', label: 'Sans acompte', value: 0, type: 'none' }
];
