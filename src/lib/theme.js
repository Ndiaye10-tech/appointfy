// Unique Brand Theme for Appointfy: Rose Principal & Blanc Secondaire
// Simple, épuré, élégant (Standard Planity / Fresha)

export const THEMES = {
  pink: {
    id: 'pink',
    name: 'Rose & Blanc',
    subtitle: 'Élégant & Épuré',
    previewHex: '#ec4899',
    primary: 'bg-pink-600',
    primaryHover: 'hover:bg-pink-700',
    primaryText: 'text-pink-600',
    primaryTextHover: 'hover:text-pink-700',
    primaryBorder: 'border-pink-600',
    borderLight: 'border-stone-200/80',
    borderMedium: 'border-stone-300',
    borderHover: 'hover:border-stone-400',
    bgLight: 'bg-white',
    bgLightAlt: 'bg-stone-50/60',
    badge: 'bg-pink-50 text-pink-700 border-pink-200/80',
    badgeFilled: 'bg-pink-50 text-pink-700',
    ring: 'ring-pink-100',
    ringFocus: 'focus:ring-pink-500',
    accentGradient: 'bg-gradient-to-r from-pink-600 to-rose-500',
    buttonGradient: 'bg-pink-600 hover:bg-pink-700 text-white',
    bannerGradient: 'bg-gradient-to-r from-pink-600 via-rose-500 to-pink-600',
    guaranteeGradient: 'bg-gradient-to-br from-pink-600 via-rose-500 to-pink-700',
    shadowGlow: 'shadow-pink-500/20',
    shadowBtn: 'shadow-pink-600/20',
    pageBg: 'bg-[#FAFAF8]',
    heroTextMuted: 'text-pink-100',
    iconColor: 'text-pink-600',
    iconFill: 'fill-pink-100'
  }
};

export const getTheme = () => {
  return THEMES.pink;
};
