import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig({
  plugins: [preact()],
  root: 'src',           // source files live here
  build: {
    outDir: '../dist',   // built site will be at /home/michael/ellioth/dist
    emptyOutDir: true
  },
  base: '/',             // site served at root (https://ellioth.othdb.de/)
})
