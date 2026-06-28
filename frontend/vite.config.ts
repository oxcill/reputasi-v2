{ defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/reputasi': {
        target: 'http://localhost:50002',
        changeOrigin: true,
      },
    },
  },
})