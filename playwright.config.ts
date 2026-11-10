import { join } from "node:path";
import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/browser",
  use: {
    baseURL: "http://localhost:8081",
    launchOptions: {
      executablePath: process.env.CHROMIUM_PATH || "/usr/bin/chromium",
      args: ["--no-sandbox"],
    },
  },
  webServer: {
    command: "npm run web -- --port 8081",
    env: {
      EXPO_OFFLINE: "1",
      EXPO_NO_TELEMETRY: "1",
      __UNSAFE_EXPO_HOME_DIRECTORY: join(process.cwd(), ".expo-test-user"),
    },
    url: "http://localhost:8081",
    reuseExistingServer: true,
    timeout: 120000,
  },
  timeout: 60000,
});
