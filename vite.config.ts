import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANT: Replace 'grammar-hub' with your actual GitHub repository name
  // If your repo is https://github.com/user/my-tool, this should be '/my-tool/'
  base: '/GrammarHub/', 
})