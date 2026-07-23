import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results",
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  passWithNoTests: true,
  retries: process.env.CI ? 2 : 0,
  use: {
    trace: "retain-on-failure",
    video: "retain-on-failure"
  },
  projects: [
    {
      name: "control",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:3100/control"
      }
    },
    {
      name: "overlay",
      use: {
        ...devices["Desktop Chrome"],
        baseURL: "http://127.0.0.1:3100/overlay/program",
        viewport: { width: 1920, height: 1080 }
      }
    }
  ]
});
