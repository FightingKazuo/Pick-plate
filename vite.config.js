import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // autoUpdate: 新しいSWが検出されたら即座に適用
      registerType: 'autoUpdate',

      // workbox設定: キャッシュを積極的に更新させる
      workbox: {
        // キャッシュ名にビルドIDを含めることで古いキャッシュを自動削除
        cacheId: 'pick-plate-v1',
        // 古いキャッシュを即座にクリア
        clientsClaim: true,
        skipWaiting: true,
        // ナビゲーションのフォールバック
        navigateFallback: '/index.html',
        // キャッシュするファイルのパターン
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // ランタイムキャッシュ（外部フォントなど）
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },

      manifest: {
        name: 'Pick Plate',
        short_name: 'Pick Plate',
        description: '献立を選んで、買い物リストへ。ふたりでシェア。',
        theme_color: '#F5F3EE',
        background_color: '#F5F3EE',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }
        ]
      }
    })
  ]
})
