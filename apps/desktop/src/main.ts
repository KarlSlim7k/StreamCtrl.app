import { spawn, type ChildProcess } from "node:child_process";

import { app, BrowserWindow, dialog } from "electron";

export interface ServiceSupervisorOptions {
  command: string;
  args: readonly string[];
  cwd: string;
  env?: NodeJS.ProcessEnv;
  restartDelayMs?: number;
  onStatus?: (status: "starting" | "running" | "stopped" | "restarting") => void;
}

export class ServiceSupervisor {
  #process: ChildProcess | null = null;
  #stopping = false;
  readonly #restartDelayMs: number;

  constructor(private readonly options: ServiceSupervisorOptions) {
    this.#restartDelayMs = options.restartDelayMs ?? 1_000;
  }

  start(): void {
    if (this.#process) {
      return;
    }
    this.options.onStatus?.("starting");
    const child = spawn(this.options.command, [...this.options.args], {
      cwd: this.options.cwd,
      env: this.options.env,
      stdio: "pipe",
      windowsHide: true
    });
    this.#process = child;
    this.options.onStatus?.("running");
    child.once("exit", () => {
      this.#process = null;
      if (this.#stopping) {
        this.options.onStatus?.("stopped");
        return;
      }
      this.options.onStatus?.("restarting");
      setTimeout(() => this.start(), this.#restartDelayMs).unref();
    });
  }

  stop(): void {
    this.#stopping = true;
    this.#process?.kill();
    this.#process = null;
  }
}

export async function promptRestore(
  window: BrowserWindow,
  hasRecoverableMatch: boolean
): Promise<boolean> {
  if (!hasRecoverableMatch) {
    return false;
  }
  const result = await dialog.showMessageBox(window, {
    type: "question",
    title: "Restaurar partido",
    message: "Se encontró un partido confirmado.",
    detail: "¿Deseas restaurar el último estado antes de continuar?",
    buttons: ["Restaurar", "Comenzar sin restaurar"],
    defaultId: 0,
    cancelId: 1
  });
  return result.response === 0;
}

export async function createControlWindow(
  controlUrl: string,
  preloadPath?: string
): Promise<BrowserWindow> {
  await app.whenReady();
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      ...(preloadPath ? { preload: preloadPath } : {})
    }
  });
  await window.loadURL(controlUrl);
  return window;
}
