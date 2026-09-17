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
    galleryLabel: 'Nos Créations Coiffure',
    defaultServices: [
      { name: 'Knotless Braids Mi-Dos', duration: 120, price: 15000, category: 'Tresses' },
      { name: 'Nattes Collées Stylisées avec Motif', duration: 60, price: 8000, category: 'Nattes' },
      { name: 'Pose Tissage Fermé / Lace Closure', duration: 90, price: 18000, category: 'Tissage' },
      { name: 'Soin Profond Hydratant & Brushing', duration: 60, price: 12000, category: 'Soins' }
    ]
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
    galleryLabel: 'Nos Poses d\'Ongles',
    defaultServices: [
      { name: 'Pose Américaine (Gel X) avec Vernis Semi-Permanent', duration: 60, price: 12000, category: 'Pose Mains' },
      { name: 'Remplissage Résine / Acrylique + Finition', duration: 60, price: 10000, category: 'Entretien' },
      { name: 'Pédicure Spa Complète & Gommage', duration: 45, price: 8000, category: 'Pieds' },
      { name: 'Nail Art Personnalisé (Strass & Dessins)', duration: 30, price: 4000, category: 'Nail Art' }
    ]
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
    galleryLabel: 'Nos Réalisations Glam',
    defaultServices: [
      { name: 'Extensions Cils Volume Russe Intense', duration: 90, price: 20000, category: 'Cils' },
      { name: 'Pose Cils Pose Mixte / Effet Naturel', duration: 75, price: 15000, category: 'Cils' },
      { name: 'Maquillage Glam Soirée / Cérémonie', duration: 60, price: 15000, category: 'Makeup' },
      { name: 'Restructuration Sourcils & Teinture Henna', duration: 40, price: 8000, category: 'Sourcils' }
    ]
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
    galleryLabel: 'Nos Réalisations Barbershop',
    defaultServices: [
      { name: 'Dégradé Américain / Taper', duration: 45, price: 5000, category: 'Coupe' },
      { name: 'Taille & Soin Barbe Complète', duration: 30, price: 3500, category: 'Barbe' },
      { name: 'Forfait VIP (Coupe + Barbe + Masque Noir)', duration: 75, price: 10000, category: 'Formules VIP' },
      { name: 'Coloration / Teinture Barbe & Contours', duration: 30, price: 4000, category: 'Soins' }
    ]
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
    galleryLabel: 'Notre Espace Spa',
    defaultServices: [
      { name: 'Massage Relaxant aux Huiles Chaudes (1h)', duration: 60, price: 20000, category: 'Massages' },
      { name: 'Gommage Corporel au Café & Savon Noir', duration: 45, price: 15000, category: 'Soins Corps' },
      { name: 'Soin Visage Purifiant & Éclat', duration: 60, price: 18000, category: 'Visage' },
      { name: 'Rituel Hammam & Détente Complète', duration: 90, price: 30000, category: 'Rituels' }
    ]
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
    galleryLabel: 'Nos Réalisations',
    defaultServices: [
      { name: 'Brushing & Soin Protéiné Femme', duration: 60, price: 10000, category: 'Coiffure' },
      { name: 'Pose Ongles Américaine Gel X', duration: 60, price: 12000, category: 'Ongles' },
      { name: 'Coupe Homme & Taille de Barbe', duration: 45, price: 6000, category: 'Barber' },
      { name: 'Soin Visage Express Éclat', duration: 30, price: 8000, category: 'Soins' }
    ]
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
    galleryLabel: 'Nos Créations & Réalisations',
    defaultServices: [
      { name: 'Pose Perruque Lace / Tresses Africaines', duration: 90, price: 15000, category: 'Coiffure' },
      { name: 'Pose Ongles Américaine (Gel X) avec Finition', duration: 60, price: 12000, category: 'Ongles' },
      { name: 'Maquillage Glamour Soirée / Cérémonie', duration: 60, price: 15000, category: 'Makeup' },
      { name: 'Pose Cils Volume Russe / Regard Éclatant', duration: 90, price: 20000, category: 'Regard' }
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

