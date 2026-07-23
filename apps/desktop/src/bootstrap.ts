import { randomBytes } from "node:crypto";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { app, dialog, ipcMain } from "electron";

import { DesktopLifecycle } from "./lifecycle.js";
import { createControlWindow, promptRestore, ServiceSupervisor } from "./main.js";

async function waitForServer(url: string, timeoutMs = 10_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/health`);
      if (response.ok) return;
    } catch {
      // The supervisor may still be starting the local service.
    }
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  throw new Error("El servicio local no estuvo listo dentro de 10 segundos.");
}

async function operationRequest(
  serverUrl: string,
  token: string,
  operation: "export" | "import",
  path: string
): Promise<Record<string, unknown>> {
  const response = await fetch(`${serverUrl}/operations/${operation}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-streamctrl-operation-token": token
    },
    body: JSON.stringify({ path })
  });
  if (!response.ok) throw new Error(await response.text());
  return (await response.json()) as Record<string, unknown>;
}

export async function runDesktopApplication(): Promise<void> {
  await app.whenReady();
  const userData = app.getPath("userData");
  const databasePath = join(userData, "data", "streamctrl.db");
  const logDirectory = join(userData, "logs");
  const markerPath = join(userData, "runtime", "crash-marker.json");
  const lifecycle = new DesktopLifecycle({
    markerPath,
    logDirectory,
    version: app.getVersion()
  });
  const previousCrash = lifecycle.begin();
  const token = randomBytes(32).toString("hex");
  const serverUrl = "http://127.0.0.1:3100";
  const serverEntry =
    process.env.STREAMCTRL_SERVER_ENTRY ??
    fileURLToPath(new URL("../../server/dist/bootstrap.js", import.meta.url));
  const supervisor = new ServiceSupervisor({
    command: process.execPath,
    args: [serverEntry],
    cwd: dirname(serverEntry),
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      STREAMCTRL_DATABASE_PATH: databasePath,
      STREAMCTRL_LOG_DIRECTORY: logDirectory,
      STREAMCTRL_OPERATION_TOKEN: token
    }
  });
  supervisor.start();

  try {
    await waitForServer(serverUrl);
  } catch (error) {
    await dialog.showErrorBox(
      "StreamCtrl no pudo iniciar",
      error instanceof Error ? error.message : "Error desconocido"
    );
    supervisor.stop();
    app.quit();
    return;
  }

  const preloadPath = fileURLToPath(new URL("./preload.js", import.meta.url));
  const controlWindow = await createControlWindow(`${serverUrl}/control/`, preloadPath);
  if (previousCrash || existsSync(databasePath)) {
    await promptRestore(controlWindow, true);
  }

  ipcMain.handle("streamctrl:backup:export", async () => {
    const selection = await dialog.showSaveDialog(controlWindow, {
      title: "Exportar paquete del partido",
      defaultPath: "final.streamctrl.json",
      filters: [{ name: "Paquete StreamCtrl", extensions: ["json"] }]
    });
    if (selection.canceled || !selection.filePath) return { cancelled: true };
    await operationRequest(serverUrl, token, "export", selection.filePath);
    return { cancelled: false, path: selection.filePath };
  });

  ipcMain.handle("streamctrl:backup:import", async () => {
    const selection = await dialog.showOpenDialog(controlWindow, {
      title: "Importar paquete del partido",
      properties: ["openFile"],
      filters: [{ name: "Paquete StreamCtrl", extensions: ["json"] }]
    });
    const path = selection.filePaths[0];
    if (selection.canceled || !path) return { cancelled: true };
    const result = await operationRequest(serverUrl, token, "import", path);
    return { cancelled: false, matchesImported: result.matchesImported };
  });

  ipcMain.handle("streamctrl:logs:export", async () => {
    const selection = await dialog.showOpenDialog(controlWindow, {
      title: "Seleccionar carpeta para exportar logs",
      properties: ["openDirectory", "createDirectory"]
    });
    const path = selection.filePaths[0];
    if (selection.canceled || !path) return { cancelled: true };
    return { cancelled: false, files: lifecycle.exportLogs(path) };
  });

  let quitting = false;
  app.on("before-quit", () => {
    if (quitting) return;
    quitting = true;
    supervisor.stop();
    lifecycle.completeCleanShutdown();
  });
}

const executedPath = process.argv[1];
if (executedPath && fileURLToPath(import.meta.url) === executedPath) {
  await runDesktopApplication();
}
