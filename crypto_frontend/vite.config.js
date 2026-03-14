import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    allowedHosts: true, // Allow custom domains and Render subdomains
  },
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: true, // Specifically fix for Render preview command
  }
})
