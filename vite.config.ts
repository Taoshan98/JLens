import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
