import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// base: './' genera rutas de assets relativas, así el build funciona tanto en
// una project page (usuario.github.io/repo/) como en una user page
// (usuario.github.io/), sin depender del nombre del repo.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
})
