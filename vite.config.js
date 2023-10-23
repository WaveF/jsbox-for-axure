const path = require('path')
const { defineConfig } = require('vite')

const MODULE_NAME = 'jsbox'
module.exports = defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: path.resolve(__dirname, 'lib/main.js'),
      formats: ['es'],
      // formats: ['es', 'cjs', 'umd', 'iife'],
      name: MODULE_NAME,
      fileName: format => `axlib-jsbox-v2.min.js`,
      // fileName: (format) => `${MODULE_NAME}.${format}.js`
    }
  }
})