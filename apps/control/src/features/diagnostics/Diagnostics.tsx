export interface DiagnosticSnapshot {
  matchRevision: number;
  graphicsRevision: number;
  frameTimeMs: number;
  memoryBytes: number;
  server: "connected" | "disconnected";
  database: "ok" | "error";
  vmix: "connected" | "disconnected" | "disabled";
}

export function Diagnostics({ snapshot }: { snapshot: DiagnosticSnapshot }) {
  return (
    <main aria-label="Diagnóstico">
      <h1>Diagnóstico</h1>
      <dl>
        <dt>Revisión del partido</dt>
        <dd>{snapshot.matchRevision}</dd>
        <dt>Revisión de gráficos</dt>
        <dd>{snapshot.graphicsRevision}</dd>
        <dt>Tiempo de frame</dt>
        <dd>{snapshot.frameTimeMs.toFixed(2)} ms</dd>
        <dt>Memoria</dt>
        <dd>{Math.round(snapshot.memoryBytes / 1024 / 1024)} MB</dd>
        <dt>Servidor</dt>
        <dd>{snapshot.server}</dd>
        <dt>Base de datos</dt>
        <dd>{snapshot.database}</dd>
        <dt>vMix</dt>
        <dd>{snapshot.vmix}</dd>
      </dl>
    </main>
  );
}
