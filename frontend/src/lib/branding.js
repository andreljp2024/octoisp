import { useEffect, useState } from 'react';

const DEFAULT_BRANDING = { name: 'OctoISP', logoUrl: '' };

export const getBrandingFromStorage = () => {
  if (typeof window === 'undefined') return DEFAULT_BRANDING;
  try {
    const stored = window.localStorage.getItem('octoisp.settings');
    if (!stored) return DEFAULT_BRANDING;
    const parsed = JSON.parse(stored);
    const general = parsed?.general || {};
    return {
      name: general.companyName || DEFAULT_BRANDING.name,
      logoUrl: general.logoUrl || DEFAULT_BRANDING.logoUrl,
    };
  } catch (error) {
    return DEFAULT_BRANDING;
  }
};

export const useBranding = () => {
  const [branding, setBranding] = useState(getBrandingFromStorage());

  useEffect(() => {
    const update = () => setBranding(getBrandingFromStorage());
    window.addEventListener('octoisp-settings-updated', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('octoisp-settings-updated', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return branding;
};
