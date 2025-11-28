import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'grammar-hub' with your actual GitHub repository name
  base: '/GrammarHub/', 
  worker: {
    format: 'es',
  }
})
