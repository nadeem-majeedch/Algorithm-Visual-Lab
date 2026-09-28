import { defineConfig, devices } from '@playwright/test'

const PORT = 4173
const BASE_PATH = '/Algorithm-Visual-Lab/'
const baseURL = `http://127.0.0.1:${PORT}${BASE_PATH}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list']],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  // Serves the real production build (npm run build output) so e2e tests
  // validate exactly what GitHub Pages will serve.
  webServer: {
    // Bind IPv4 explicitly: on Windows, Vite's default `localhost` can bind
    // IPv6 (::1) only, which the 127.0.0.1 readiness poll never reaches.
    command: 'npm run preview -- --port 4173 --strictPort --host 127.0.0.1',
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
