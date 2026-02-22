import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { registerSW } from 'virtual:pwa-register';
import { applyThemePreferences, readThemePreferences } from './lib/theme';

applyThemePreferences(readThemePreferences());
if (typeof window !== 'undefined') {
  window.addEventListener('storage', () => applyThemePreferences(readThemePreferences()));
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

if (import.meta.env.PROD) {
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      updateSW(true);
    },
  });
}
