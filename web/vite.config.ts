import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Enable .ohm file imports as raw strings
  assetsInclude: ['**/*.ohm'],

  // Allow importing from parent directory (FlowScript grammar)
  resolve: {
    alias: {
      '@flowscript': path.resolve(__dirname, '../src'),
    },
  },
})
