import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Forward API calls to the Express server during development.
    // 127.0.0.1 instead of localhost: on some Windows machines localhost
    // resolves to IPv6 (::1) and the proxy cannot reach the server.
    proxy: {
      '/api': 'http://127.0.0.1:3001',
    },
  },
  test: {
    environment: 'jsdom',
  },
})
