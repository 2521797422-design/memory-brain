import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const memoriesDir = path.join(__dirname, 'public', 'memories')

/** Return 404 for missing files under /memories/ (avoid SPA HTML masquerading as images). */
function memoryAssetsDevPlugin() {
  return {
    name: 'memory-assets-404',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] ?? ''
        if (!url.startsWith('/memories/') || url === '/memories/') {
          next()
          return
        }
        const filePath = path.join(memoriesDir, path.basename(url))
        if (!fs.existsSync(filePath)) {
          res.statusCode = 404
          res.end('Memory asset not found')
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), memoryAssetsDevPlugin()],
})
