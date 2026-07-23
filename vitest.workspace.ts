import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "coverage"
    },
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["packages/**/tests/**/*.test.ts", "apps/server/tests/**/*.test.ts"]
        }
      },
      {
        test: {
          name: "renderers",
          environment: "jsdom",
          include: ["apps/{control,overlay}/tests/**/*.{test,spec}.{ts,tsx}"]
        }
      }
    ]
  }
});
