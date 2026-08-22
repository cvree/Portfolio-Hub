import { defineConfig, devices } from '@playwright/test';

/* The site is static: the "server" is a directory. Playwright serves the
   repository root exactly as GitHub Pages does, so what the tests exercise is
   the committed HTML rather than a build output that only exists in CI. */
const PORT = Number(process.env.PORT || 8123);
const chromiumPath = process.env.PW_CHROMIUM_PATH;

const only = (process.env.BROWSERS || 'chromium').split(',').map((s) => s.trim());

const all = [
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      ...(chromiumPath ? { launchOptions: { executablePath: chromiumPath } } : {}),
    },
  },
  { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  { name: 'webkit', use: { ...devices['Desktop Safari'] } },
];

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}/`,
    trace: 'retain-on-failure',
  },
  projects: all.filter((p) => only.includes(p.name)),
  webServer: {
    command: `python3 -m http.server ${PORT} --bind 127.0.0.1`,
    port: PORT,
    reuseExistingServer: true,
    stdout: 'ignore',
  },
});
