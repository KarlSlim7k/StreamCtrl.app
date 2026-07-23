import { contextBridge, ipcRenderer } from "electron";

export interface StreamCtrlOperations {
  exportMatchPackage(): Promise<{ cancelled: boolean; path?: string }>;
  importMatchPackage(): Promise<{ cancelled: boolean; matchesImported?: number }>;
  exportLogs(): Promise<{ cancelled: boolean; files?: string[] }>;
}

const operations: StreamCtrlOperations = {
  exportMatchPackage: () => ipcRenderer.invoke("streamctrl:backup:export"),
  importMatchPackage: () => ipcRenderer.invoke("streamctrl:backup:import"),
  exportLogs: () => ipcRenderer.invoke("streamctrl:logs:export")
};

contextBridge.exposeInMainWorld("streamCtrlOperations", operations);
