import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Relative base for easy deployment to GitHub Pages
  server: {
    port: 3000,
    open: true
  }
})
