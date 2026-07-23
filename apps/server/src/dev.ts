import { startStreamCtrlServer } from "./bootstrap.js";

const running = await startStreamCtrlServer({
  STREAMCTRL_PORT: 3103,
  STREAMCTRL_DATABASE_PATH: "data/streamctrl-dev.db",
  STREAMCTRL_LOG_DIRECTORY: "logs"
});

const shutdown = async () => {
  await running.close();
  process.exitCode = 0;
};

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
