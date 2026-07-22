import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Wayfare Carpool',
        short_name: 'Wayfare',
        description: 'Find your perfect ride, securely.',
        theme_color: '#121620',
        background_color: '#121620',
        display: 'standalone',
        icons: [
          {
            src: '/Wayfare_favicon.jpeg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/Wayfare_favicon.jpeg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
            },
          },
        ]
      }
    })
  ],
  server: { port: 5173 }
})
