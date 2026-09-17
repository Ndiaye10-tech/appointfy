import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import createPaymentHandler from './api/create-payment.js'
import checkPaymentHandler from './api/check-payment.js'

function vercelApiDevPlugin() {
  return {
    name: 'vercel-api-dev',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const host = req.headers.host || 'localhost:5173'
        const url = new URL(req.url, `http://${host}`)

        if (url.pathname === '/api/create-payment') {
          if (req.method === 'OPTIONS') {
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
            res.statusCode = 200
            return res.end()
          }

          let body = ''
          req.on('data', chunk => { body += chunk })
          req.on('end', async () => {
            try {
              req.body = body ? JSON.parse(body) : {}
              res.status = (code) => { res.statusCode = code; return res }
              res.json = (data) => {
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify(data))
                return res
              }
              await createPaymentHandler(req, res)
            } catch (err) {
              res.statusCode = 500
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ success: false, error: err.message }))
            }
          })
          return
        }

        if (url.pathname === '/api/check-payment') {
          req.query = Object.fromEntries(url.searchParams)
          res.status = (code) => { res.statusCode = code; return res }
          res.json = (data) => {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify(data))
            return res
          }
          await checkPaymentHandler(req, res)
          return
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      tailwindcss(),
      vercelApiDevPlugin(),
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

