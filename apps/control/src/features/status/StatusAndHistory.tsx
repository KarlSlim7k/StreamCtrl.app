export interface StatusHistoryEntry {
  id: string;
  label: string;
  revision: number;
  result: "accepted" | "rejected";
}

export function StatusAndHistory({
  connected,
  revision,
  clockRunning,
  visibleGraphics,
  history
}: {
  connected: boolean;
  revision: number;
  clockRunning: boolean;
  visibleGraphics: readonly string[];
  history: readonly StatusHistoryEntry[];
}) {
  return (
    <aside aria-label="Estado e historial">
      <dl>
        <dt>Conexión</dt>
        <dd>{connected ? "Conectado" : "Desconectado"}</dd>
        <dt>Revisión oficial</dt>
        <dd>{revision}</dd>
        <dt>Reloj</dt>
        <dd>{clockRunning ? "En marcha" : "Detenido"}</dd>
        <dt>Program</dt>
        <dd>{visibleGraphics.length > 0 ? visibleGraphics.join(", ") : "Limpio"}</dd>
      </dl>
      <ol aria-label="Historial de acciones">
        {history.map((entry) => (
          <li key={entry.id}>
            {entry.label} · revisión {entry.revision} ·{" "}
            {entry.result === "accepted" ? "confirmada" : "rechazada"}
          </li>
        ))}
      </ol>
    </aside>
  );
}
