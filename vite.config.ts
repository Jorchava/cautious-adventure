import { defineConfig } from 'vite'
import { imagetools } from 'vite-imagetools'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue(), imagetools()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
})
