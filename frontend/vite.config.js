import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: null,
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [
            {
              urlPattern: new RegExp(env.VITE_API_URL?.replace(/\/$/, '') || '/api'),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 300,
                },
              },
            },
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*$/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365,
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: false,
        },
        manifest: {
          name: 'OctoISP - Plataforma de Gerenciamento de Rede',
          short_name: 'OctoISP',
          description: 'Plataforma SaaS multi-tenant para gerenciamento de redes ISP',
          theme_color: '#0EA5E9',
          background_color: '#f8fafc',
          display: 'standalone',
          icon: 'public/icon.svg',
          lang: 'pt-BR',
          dir: 'ltr',
          icons: [
            {
              src: 'icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
          ],
        },
      }),
    ],
    server: {
      port: 3000,
      open: true,
    },
    build: {
      outDir: 'build',
    },
  };
});
