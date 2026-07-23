import { startStreamCtrlServer } from "../../apps/server/src/bootstrap.js";

const running = await startStreamCtrlServer({
  STREAMCTRL_PORT: 3103,
  STREAMCTRL_DATABASE_PATH: ":memory:",
  STREAMCTRL_LOG_DIRECTORY: "artifacts/e2e-logs",
  STREAMCTRL_LOG_LEVEL: "silent"
});

const shutdown = async () => {
  await running.close();
  process.exitCode = 0;
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
