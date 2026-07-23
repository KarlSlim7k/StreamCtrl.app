import { useState } from "react";

interface Operations {
  exportMatchPackage(): Promise<{ cancelled: boolean; path?: string }>;
  importMatchPackage(): Promise<{ cancelled: boolean; matchesImported?: number }>;
  exportLogs(): Promise<{ cancelled: boolean; files?: string[] }>;
}

declare global {
  interface Window {
    streamCtrlOperations?: Operations;
  }
}

export function BackupTools() {
  const [status, setStatus] = useState("");
  const operations = window.streamCtrlOperations;
  if (!operations) return null;

  return (
    <section aria-label="Respaldo y soporte">
      <h2>Respaldo y soporte</h2>
      <button
        onClick={async () => {
          const result = await operations.exportMatchPackage();
          setStatus(result.cancelled ? "Exportación cancelada" : "Paquete exportado y verificado");
        }}
      >
        Exportar partido
      </button>
      <button
        onClick={async () => {
          const result = await operations.importMatchPackage();
          setStatus(
            result.cancelled
              ? "Importación cancelada"
              : `${result.matchesImported ?? 0} partido(s) importado(s)`
          );
        }}
      >
        Importar partido
      </button>
      <button
        onClick={async () => {
          const result = await operations.exportLogs();
          setStatus(
            result.cancelled
              ? "Exportación cancelada"
              : `${result.files?.length ?? 0} log(s) exportado(s)`
          );
        }}
      >
        Exportar logs
      </button>
      <p aria-live="polite">{status}</p>
    </section>
  );
}
