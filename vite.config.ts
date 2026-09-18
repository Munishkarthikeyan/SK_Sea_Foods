import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Only use the /SK_Sea_Foods/ subpath when building for GitHub Pages.
// Locally (npm run dev), the app stays at the root so paths like /Logo.png just work.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/SK_Sea_Foods/' : '/',
}))