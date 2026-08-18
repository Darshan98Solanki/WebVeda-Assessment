import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The real "framer" module only exists inside Framer's own canvas
      // runtime — it's not an npm package this project can install. This
      // alias points that import at a local no-op shim so the exact same
      // SkillpathCourses.tsx (import and all) both runs here via
      // `npm run dev` / `npm run build` AND pastes unchanged into a Framer
      // code component, where Framer resolves the real module instead.
      framer: path.resolve(dirname, 'src/framer-shim.ts'),
    },
  },
})
