// eslint-disable-next-line nuxt/no-cjs-in-config
require('./config.js');

export default {
  // Target: https://go.nuxtjs.dev/config-target
  target: 'static',
  ssr: false,
  generate: {
    fallback: true
  },

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    titleTemplate: '%s - Nosana Vesting',
    title: 'Nosana Vesting',
    htmlAttrs: {
      lang: 'en'
    },
    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { hid: 'description', name: 'description', content: '' }
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
      { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Space+Mono:ital,wght@0,400;0,700;1,400;1,700&display=swap' }
    ]
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    '@fortawesome/fontawesome-free/css/all.css',
    '@/assets/scss/global.scss'
  ],

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    { src: '@/plugins/sol.js', mode: 'client' }
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: [
    '@nuxtjs/eslint-module'
  ],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/axios
    '@nuxtjs/axios'
  ],

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {},

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    // eslint-disable-next-line no-empty-pattern
    extend (config, {}) {
      config.node = {
        fs: 'empty'
      };
    },
    transpile: [
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-sollet',
      '@solana/wallet-adapter-bitkeep',
      '@solana/wallet-adapter-bitpie',
      '@solana/wallet-adapter-blocto',
      '@solana/wallet-adapter-clover',
      '@solana/wallet-adapter-coinhub',
      '@solana/wallet-adapter-ledger',
      '@solana/wallet-adapter-mathwallet',
      '@solana/wallet-adapter-phantom',
      '@solana/wallet-adapter-safepal',
      '@solana/wallet-adapter-solflare',
      '@solana/wallet-adapter-solong',
      '@solana/wallet-adapter-tokenpocket',
      '@solana/wallet-adapter-torus',
      '@solana/wallet-adapter-coin98',
      '@solana/wallet-adapter-slope'
    ],
    loaders: {
      scss: {
        additionalData: '@import \'~assets/scss/variables.scss\';'
      }
    }
  },
  server: {
    host: '0.0.0.0'
  }
};
