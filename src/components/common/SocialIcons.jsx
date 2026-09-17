import React from 'react';

/**
 * Format any raw input (username, @handle, or full URL) into a valid clickable URL
 */
export const formatSocialUrl = (network, rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  // Already a full valid URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Strip leading '@' or slashes or domain prefixes
  const clean = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
    .replace(/^[@/]+/, '')
    .trim();

  if (!clean) return '';

  switch (network.toLowerCase()) {
    case 'instagram':
    case 'insta':
      return `https://instagram.com/${clean}`;
    case 'tiktok':
      return `https://tiktok.com/@${clean}`;
    case 'facebook':
    case 'fb':
      return `https://facebook.com/${clean}`;
    default:
      return `https://${clean}`;
  }
};

/**
 * Extract clean handle or short display text from raw value
 */
export const getSocialHandle = (network, rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return '';
  const trimmed = rawValue.trim();
  if (!trimmed) return '';

  let clean = trimmed
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, '')
    .replace(/^https?:\/\/(www\.)?tiktok\.com\/@?/i, '')
    .replace(/^https?:\/\/(www\.)?facebook\.com\//i, '')
    .replace(/^[@/]+/, '')
    .replace(/\/.*$/, '')
    .trim();

  if (!clean) return network;
  return clean.startsWith('@') ? clean : `@${clean}`;
};

/**
 * Official Instagram SVG Icon
 */
export const InstagramIcon = ({ className = "w-4 h-4", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

/**
 * Official TikTok SVG Icon
 */
export const TikTokIcon = ({ className = "w-4 h-4", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.298-.002.595.042.88.13V9.4a6.33 6.33 0 0 0-1-.08A6.34 6.34 0 0 0 3 15.66a6.34 6.34 0 0 0 10.82 4.48 6.3 6.3 0 0 0 1.87-4.47V8.75a8.28 8.28 0 0 0 4.9 1.59V6.89a4.84 4.84 0 0 1-1-.2z" />
  </svg>
);

/**
 * Official Facebook SVG Icon
 */
export const FacebookIcon = ({ className = "w-4 h-4", ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
    {...props}
  >
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

/**
 * Clickable Badge Pill for Salon Website Hero & Contact
 */
export const SocialLinkPill = ({ network, value, showHandle = false, className = "" }) => {
  const url = formatSocialUrl(network, value);
  if (!url) return null;

  const handle = getSocialHandle(network, value);

  if (network.toLowerCase() === 'instagram') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Ouvrir le profil Instagram ${handle}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-pink-500/10 via-rose-500/10 to-amber-500/10 hover:from-pink-500/20 hover:to-amber-500/20 text-pink-700 border border-pink-200/80 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-2xs group ${className}`}
      >
        <span className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] flex items-center justify-center text-white shadow-2xs group-hover:rotate-6 transition-transform shrink-0">
          <InstagramIcon className="w-3 h-3 fill-white" />
        </span>
        <span className="font-extrabold">{showHandle ? handle : 'Instagram'}</span>
      </a>
    );
  }

  if (network.toLowerCase() === 'tiktok') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Ouvrir le compte TikTok ${handle}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-black text-white font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-2xs group ${className}`}
      >
        <span className="w-5 h-5 rounded-lg bg-slate-800 flex items-center justify-center text-white shadow-2xs group-hover:-rotate-6 transition-transform shrink-0">
          <TikTokIcon className="w-3 h-3 fill-white" />
        </span>
        <span className="font-extrabold">{showHandle ? handle : 'TikTok'}</span>
      </a>
    );
  }

  if (network.toLowerCase() === 'facebook') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        title={`Ouvrir la page Facebook ${handle}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-[#1877F2] border border-blue-200 font-bold text-xs transition-all hover:scale-105 active:scale-95 shadow-2xs group ${className}`}
      >
        <span className="w-5 h-5 rounded-lg bg-[#1877F2] flex items-center justify-center text-white shadow-2xs group-hover:scale-110 transition-transform shrink-0">
          <FacebookIcon className="w-3 h-3 fill-white" />
        </span>
        <span className="font-extrabold">{showHandle ? handle : 'Facebook'}</span>
      </a>
    );
  }

  return null;
};
