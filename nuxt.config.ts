export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', 'pinia-plugin-persistedstate/nuxt', '@nuxtjs/tailwindcss'],
  piniaPluginPersistedstate: {
    storage: 'localStorage',
    key: 'garden-planner:%id'
  },
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-01-01',
  typescript: {
    strict: true,
    typeCheck: false
  }
})
