const PALETTES = ['sky', 'aurora', 'circuit', 'solar', 'ocean'];

export const readThemePreferences = () => {
  if (typeof window === 'undefined') {
    return {
      compact: false,
      reducedMotion: false,
      glow: true,
      highContrast: false,
      darkMode: false,
      palette: 'sky',
    };
  }

  const stored = window.localStorage.getItem('octoisp.preferences');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      return {
        compact: Boolean(parsed.compact),
        reducedMotion: Boolean(parsed.reducedMotion),
        glow: Boolean(parsed.glow ?? true),
        highContrast: Boolean(parsed.highContrast),
        darkMode: Boolean(parsed.darkMode),
        palette: parsed.palette || window.localStorage.getItem('octoisp.themePalette') || 'sky',
      };
    } catch (error) {
      // fallback abaixo
    }
  }

  return {
    compact: false,
    reducedMotion: false,
    glow: true,
    highContrast: false,
    darkMode: window.localStorage.getItem('octoisp.theme') === 'dark',
    palette: window.localStorage.getItem('octoisp.themePalette') || 'sky',
  };
};

export const persistThemePreferences = (preferences) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('octoisp.preferences', JSON.stringify(preferences));
  window.localStorage.setItem('octoisp.theme', preferences.darkMode ? 'dark' : 'light');
  window.localStorage.setItem('octoisp.themePalette', preferences.palette || 'sky');
};

export const applyThemePreferences = (prefs) => {
  if (typeof window === 'undefined') return;
  const preferences = prefs || readThemePreferences();
  const body = document.body;

  body.classList.toggle('app-compact', preferences.compact);
  body.classList.toggle('app-reduced-motion', preferences.reducedMotion);
  body.classList.toggle('app-glow', preferences.glow);
  body.classList.toggle('app-high-contrast', preferences.highContrast);
  body.classList.toggle('theme-dark', preferences.darkMode);

  PALETTES.forEach((palette) => body.classList.remove(`theme-${palette}`));
  const palette = preferences.palette || 'sky';
  body.classList.add(`theme-${palette}`);
};
