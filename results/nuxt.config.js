const routerBase = process.env.DEPLOY_ENV === 'GH_PAGES' ? {
  router: {
    base: '/nuxt-generate-benchmarks/'
  }
} : {}

module.exports = {
  ...routerBase,
  modulesDir: [
    '../node_modules'
  ],
  modules: [
    { src: 'bootstrap-vue/nuxt', options: { css: true } }
  ],
  plugins: [
    { src: '../node_modules/d3/dist/d3.min.js', ssr: false },
    { src: '../node_modules/d3-3d/build/d3-3d.min.js', ssr: false }
  ],
  build: {
    publicPath: '/_nuxt/',
  }
}
