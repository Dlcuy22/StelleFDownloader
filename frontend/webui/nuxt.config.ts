// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  vite: {
    server: {
      allowedHosts: ['16e7-103-227-252-184.ngrok-free.app']
    }
  }
})
