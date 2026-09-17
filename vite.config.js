import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        '/api/geniuspay': {
          target: 'https://api.geniuspay.ci/v1',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/geniuspay/, ''),
          secure: true,
          headers: {
            'X-API-Key': env.GENIUSPAY_API_KEY || env.VITE_GENIUSPAY_API_KEY || '',
            'X-API-Secret': env.GENIUSPAY_API_SECRET || env.VITE_GENIUSPAY_API_SECRET || ''
          }
        }
      }
    }
  }
})
