import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: '장막 아래 수련회 핸드북',
        short_name: '수련회 핸드북',
        description: '청년부 수련회 일정, 본문, 개인 메모',
        lang: 'ko',
        theme_color: '#f6f6f4',
        background_color: '#f6f6f4',
        display: 'standalone',
        start_url: './',
        icons: [
          {
            src: 'icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[^/]+\.supabase\.co\/rest\/v1\/handbook/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/handbook\.json(?:\?.*)?$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
})
