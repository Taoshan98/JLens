import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    '__APP_VERSION__': JSON.stringify(packageJson.version),
  },
  base: './',
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'syntax-highlighter': ['react-syntax-highlighter'],
          'beautify': ['js-beautify'],
          'utils': ['fast-xml-parser', 'yaml', 'sql-formatter', 'papaparse'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
})
