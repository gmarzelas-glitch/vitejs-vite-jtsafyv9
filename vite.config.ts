import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Actions θέτει αυτό το env var στο build για Pages
const isGitHubPages = process.env.GITHUB_ACTIONS === 'true'

export default defineConfig({
  plugins: [react()],
  // Για GitHub Pages πρέπει να είναι "/repo-name/"
  // Για Hostinger (custom domain / subdomain) πρέπει να είναι "/"
  base: isGitHubPages ? '/vitejs-vite-jtsafyv9/' : '/',
})
