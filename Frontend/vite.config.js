import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Forms and the admin page call /api on their own address, as in production.
  server: { proxy: { "/api": "http://localhost:5000" } },
})
