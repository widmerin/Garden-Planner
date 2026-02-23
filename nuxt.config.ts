export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ['@pinia/nuxt', '@nuxtjs/tailwindcss'],
  css: ['~/assets/css/main.css'],
  compatibilityDate: '2025-01-01',
  typescript: {
    strict: true,
    typeCheck: false
  }
})
