// src/data/businessTemplates.js

export const BUSINESS_TYPES = {
  hair_braids: {
    id: 'hair_braids',
    name: 'Coiffure & Tresses',
    shortName: 'Coiffure & Tresses',
    subtitle: 'Knotless, Nattes, Tissage, Soins',
    icon: 'Scissors',
    emoji: '✂️',
    tagline: 'L\'art de la coiffure afro & moderne : Tresses, Nattes & Soins',
    heroSubtitle: 'Réservez votre coiffure, tresse ou soin capillaire en quelques clics',
    galleryLabel: 'Nos Créations Coiffure'
  },
  nails: {
    id: 'nails',
    name: 'Onglerie & Manucure',
    shortName: 'Onglerie',
    subtitle: 'Pose résine, Gel X, Nail Art, Pédicure',
    icon: 'Sparkles',
    emoji: '💅',
    tagline: 'Sublimez vos mains et pieds : Pose Américaine & Nail Art',
    heroSubtitle: 'Réservez votre pose d\'ongles, manucure ou pédicure spa',
    galleryLabel: 'Nos Poses d\'Ongles'
  },
  lashes_makeup: {
    id: 'lashes_makeup',
    name: 'Cils, Sourcils & Maquillage',
    shortName: 'Cils & Makeup',
    subtitle: 'Lash, Microblading, Glam Soirée',
    icon: 'Eye',
    emoji: '👁️',
    tagline: 'Mise en valeur du regard et maquillage professionnel',
    heroSubtitle: 'Extensions de cils, restructuration des sourcils et maquillage événementiel',
    galleryLabel: 'Nos Réalisations Glam'
  },
  barber: {
    id: 'barber',
    name: 'Barbershop & Coiffure Homme',
    shortName: 'Barbershop',
    subtitle: 'Coupes, Dégradés & Barbe',
    icon: 'Scissors',
    emoji: '💈',
    tagline: 'L\'art de la coiffure et du soin masculin',
    heroSubtitle: 'Réservez votre dégradé, taille de barbe ou soin complet en quelques clics',
    galleryLabel: 'Nos Réalisations Barbershop'
  },
  spa_massage: {
    id: 'spa_massage',
    name: 'Spa & Massages Bien-Être',
    shortName: 'Spa & Massage',
    subtitle: 'Massages relaxants, Gommages, Soins du corps',
    icon: 'Heart',
    emoji: '💆‍♀️',
    tagline: 'Détente absolue, soins du corps et rituels bien-être',
    heroSubtitle: 'Offrez-vous une parenthèse de sérénité et de relaxation',
    galleryLabel: 'Notre Espace Spa'
  },
  mixte: {
    id: 'mixte',
    name: 'Salon Mixte / Tout-en-un',
    shortName: 'Salon Tout-en-un',
    subtitle: 'Coiffure, Ongles, Soins & Esthétique',
    icon: 'Sparkles',
    emoji: '🌟',
    tagline: 'Votre institut complet : Coiffure, Onglerie & Soins',
    heroSubtitle: 'Toutes vos prestations beauté réunies sous un même toit',
    galleryLabel: 'Nos Réalisations'
  },
  beauty_studio: {
    id: 'beauty_studio',
    name: 'Studio de Beauté Féminine',
    shortName: 'Studio Beauté',
    subtitle: 'Coiffure, Ongles, Makeup & Cils',
    icon: 'Sparkles',
    emoji: '✨',
    tagline: 'L\'art de la mise en beauté : Coiffure, Onglerie & Makeup',
    heroSubtitle: 'Réservez votre coiffure, pose d\'ongles, makeup ou soin en quelques clics',
    galleryLabel: 'Nos Créations & Réalisations'
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
