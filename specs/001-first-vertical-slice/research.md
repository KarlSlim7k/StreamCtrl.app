# Research: Primer ciclo vertical de partido

## Runtime de producción

**Decision**: Usar Node.js 24 LTS y fijar versiones exactas en el lockfile al
iniciar la implementación.

**Rationale**: La política oficial recomienda líneas Active o Maintenance LTS
para producción; Node 24 aparece como LTS al momento de esta planificación.

**Alternatives considered**:

- Node 26 Current: descartado para la base inicial por no ser LTS.
- Node 22 LTS: válido, pero ofrece una ventana de soporte menor.

**Reference**:
[Node.js release status](https://nodejs.org/en/about/previous-releases)

## Separación de procesos Electron

**Decision**: Mantener renderers sin Node.js, con aislamiento y sandbox; exponer
solo operaciones mínimas y tipadas mediante preload.

**Rationale**: Reduce el impacto de contenido inesperado y evita entregar IPC
genérico al panel. Electron recomienda aislamiento, sandbox, CSP y validación de
emisores.

**Alternatives considered**:

- Node.js habilitado en el renderer: rechazado por seguridad.
- Panel servido únicamente en navegador: se conserva como posibilidad futura,
  pero no reemplaza el empaquetado y supervisión local del MVP.

**References**:
[Electron security](https://www.electronjs.org/docs/latest/tutorial/security),
[Electron context isolation](https://www.electronjs.org/docs/latest/tutorial/context-isolation)

## Estado autoritativo y entrega en tiempo real

**Decision**: Socket.IO transporta comandos y eventos, pero la aplicación
implementa idempotencia, revisiones y snapshots propios. Cada comando requiere
ack; una reconexión no recuperable solicita snapshot completo.

**Rationale**: Socket.IO conserva el orden de mensajes, pero su garantía
predeterminada de llegada es “at most once”; la recuperación de conexión ayuda,
pero la propia documentación indica que no siempre tiene éxito. El protocolo de
StreamCtrl debe garantizar corrección más allá del transporte.

**Alternatives considered**:

- Confiar solo en buffers del transporte: rechazado porque el servidor no
  reenvía automáticamente todos los eventos perdidos.
- Enviar siempre estado completo: sencillo, pero aumenta ruido y dificulta
  auditoría; se usará snapshot al conectar y eventos después.

**References**:
[Socket.IO delivery guarantees](https://socket.io/docs/v4/delivery-guarantees),
[Socket.IO connection recovery](https://socket.io/docs/v4/connection-state-recovery)

## Persistencia local

**Decision**: SQLite mediante better-sqlite3 en WAL, con una única cola de
escritura, transacciones y migraciones versionadas.

**Rationale**: El dominio es local, de baja concurrencia y requiere
confirmaciones atómicas. better-sqlite3 ofrece transacciones y recomienda WAL.

**Alternatives considered**:

- Archivos JSON: rechazados por recuperación atómica e historial consultable.
- Base de datos de red: fuera de alcance y añade una dependencia innecesaria.

**Reference**:
[better-sqlite3 project documentation](https://github.com/WiseLibs/better-sqlite3)

## Reloj oficial

**Decision**: Persistir tiempo acumulado y referencias de inicio; derivar el
valor visible desde un reloj monotónico. El servidor emite sincronizaciones y
el overlay interpola.

**Rationale**: Contar intervalos acumula drift y se degrada al suspenderse un
proceso. El modelo por timestamps permite pausar, corregir y restaurar de forma
determinista.

**Alternatives considered**:

- Incrementar cada segundo: rechazado por drift.
- Usar el reloj del overlay como oficial: rechazado porque crea otra autoridad.

## Motor de animación

**Decision**: GSAP con timelines encapsulados y cleanup al desmontar cada
gráfico.

**Rationale**: Las timelines permiten secuencias controlables y GSAP documenta
cleanup específico para React. El MVP necesita transiciones deterministas más
que un motor 3D.

**Alternatives considered**:

- Solo transiciones CSS: válidas para elementos simples, pero menos cómodas para
  coordinar interrupciones y `all.hide`.
- Canvas/WebGL: pospuesto; añade complejidad sin beneficio para dos gráficos.

**References**:
[GSAP timelines](https://gsap.com/docs/v3/GSAP/),
[GSAP with React](https://gsap.com/resources/React/)

## Salida e integración con vMix

**Decision**: Entregar Program como una página transparente estable. El adaptador
HTTP de vMix será opcional y nunca será la ruta de datos del partido.

**Rationale**: vMix documenta transparencia en Browser Input y una API HTTP para
funciones comunes. Separar ambas rutas mantiene el overlay disponible aunque la
automatización falle.

**Alternatives considered**:

- Salida NDI/OMT directa: pospuesta hasta que exista una necesidad medida.
- Un input por gráfico: rechazado; el producto exige una única fuente.

**References**:
[vMix Web Browser input](https://www.vmix.com/help29/WebBrowser.html),
[vMix HTTP API](https://www.vmix.com/help26/DeveloperAPI.html)

## Hardware de referencia

**Decision**: Validar inicialmente en Windows 11 x64, CPU de 8 núcleos moderna
(Intel Core i7 12ª generación/Ryzen 7 5700X o superior), 32 GB RAM, GPU dedicada
equivalente a RTX 3060, SSD y pantalla/salida 1920x1080p60.

**Rationale**: Es una referencia reproducible para desarrollo y no un requisito
mínimo comercial. Permite medir la aplicación junto con vMix bajo carga
realista.

**Alternatives considered**:

- Publicar requisitos mínimos sin benchmarks: rechazado.
- Validar solo la aplicación sin vMix: insuficiente para el ciclo vertical.
