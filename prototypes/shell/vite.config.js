import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

/* The components come from the Charrette repository's @charrette/ui, read as
   source. React is this app's own copy, so there is one React on the page. */
const ui = fileURLToPath(new URL('../../../charrette/packages/ui', import.meta.url))

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: {
    alias: {
      '@charrette/ui/styles.css': `${ui}/src/styles/global.css`,
      '@charrette/ui': `${ui}/src/index.ts`,
    },
    dedupe: ['react', 'react-dom'],
  },
  /* the package's modules are written against camelCase class names */
  css: { modules: { localsConvention: 'camelCaseOnly' } },
  server: { fs: { allow: ['.', fileURLToPath(new URL('../../../charrette', import.meta.url))] } },
})
