import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["tests/e2e/**/*.spec.ts", "apps/overlay/tests/visual/**/*.spec.ts"],
  outputDir: "./test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  passWithNoTests: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  webServer: [
    {
      command: "corepack pnpm exec tsx tests/support/start-server.ts",
      url: "http://127.0.0.1:3103/health",
      reuseExistingServer: !process.env.CI
    },
    {
      command: "corepack pnpm --filter @streamctrl/control dev --host 127.0.0.1 --port 3101",
      url: "http://127.0.0.1:3101",
      reuseExistingServer: !process.env.CI
    },
    {
      command: "corepack pnpm --filter @streamctrl/overlay dev --host 127.0.0.1 --port 3100",
      url: "http://127.0.0.1:3100",
      reuseExistingServer: !process.env.CI
    }
  ],
  projects: [
    {
      name: "control",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:3101"
      }
    },
    {
      name: "overlay",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:3100",
        viewport: { width: 1920, height: 1080 }
      }
    }
  ]
});
