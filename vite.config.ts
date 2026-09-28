import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages serves project sites from a sub-path:
//   https://nadeem-majeedch.github.io/Algorithm-Visual-Lab/
// Every asset and internal link must therefore be prefixed with the
// repository name. Use `import.meta.env.BASE_URL` in application code —
// never hardcode '/'.
export const BASE_PATH = '/Algorithm-Visual-Lab/'

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
})
