const path = require('path')
const { defineConfig } = require('vite')

const MODULE_NAME = 'jsbox'
module.exports = defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      name: MODULE_NAME,
      formats: ['iife'],
      fileName: format => `axlib-jsbox-v2.min.js`,
      // formats: ['es', 'cjs', 'umd', 'iife'],
      // fileName: (format) => `${MODULE_NAME}.${format}.js`
    }
  }
})