import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
    proxy: {
      // Local dev: forward API calls to the ASP.NET Core backend.
      '/api': {
        target: 'http://localhost:5010',
        changeOrigin: true,
      },
    },
  },
})
