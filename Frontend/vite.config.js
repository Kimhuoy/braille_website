import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Forms and the admin page call /api on their own address, as in production.
  server: { proxy: { "/api": "http://localhost:5000" } },
  build: {
    rolldownOptions: {
      output: {
        // Libraries (React, router, axios...) in their own file: it changes less often
        // than the site's code, so browsers keep it cached across deploys.
        codeSplitting: { groups: [{ name: "vendor", test: /node_modules/ }] },
      },
    },
  },
})
