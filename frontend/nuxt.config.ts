// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: process.env.ENVIRONMENT == "dev" },
  modules: ['@nuxt/eslint', '@pinia/nuxt', '@nuxtjs/tailwindcss'],
  routeRules: {
    '/api/**': { proxy: `${process.env.API_URL}/**` },
  },
})