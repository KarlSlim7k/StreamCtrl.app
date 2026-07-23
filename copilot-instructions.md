# Instrucciones de desarrollo de StreamCtrl.app

Estas reglas son obligatorias para cambios asistidos por IA y decisiones de
arquitectura.

## Misión

Construir una aplicación local, fiable y operable para gráficos deportivos de
fútbol en vMix. El producto inicial entrega un único overlay web transparente;
vMix compone video y produce NDI/OMT.

No ampliar el alcance hacia redes sociales, PTZ, IA, marketplace o salida NDI
directa antes de completar el ciclo vertical y los requisitos de producción.

## Orden de prioridades

1. Integridad del estado del partido.
2. Seguridad y claridad para el operador.
3. Recuperación ante fallos.
4. Rendimiento sostenido del overlay.
5. Calidad visual.
6. Funciones adicionales.

## Stack aprobado

- TypeScript estricto.
- pnpm workspaces.
- Electron con `contextIsolation: true` y Node deshabilitado en renderers.
- React + Vite.
- Node.js + Express + Socket.io.
- SQLite con better-sqlite3, WAL y migraciones.
- Zustand solamente para estado de UI; el servidor es la fuente de verdad.
- GSAP para animaciones.
- Zod para validación de contratos en límites de proceso y red.
- Vitest, React Testing Library y Playwright.

Agregar dependencias solo cuando exista una necesidad concreta.

## Límites de módulos

- `core`: reglas puras del partido; no depende de React, Electron, Express,
  Socket.io, SQLite ni vMix.
- `contracts`: schemas y tipos de comandos, eventos, snapshots y errores.
- `database`: persistencia, migraciones y recuperación.
- `server`: autoriza comandos, actualiza el núcleo y publica eventos.
- `control`: proyecta el estado y envía comandos; no contiene reglas del juego.
- `overlay`: proyecta snapshots/eventos y anima gráficos; no modifica el estado.
- `adapters`: integra vMix u otras salidas sin contaminar el núcleo.

Las dependencias apuntan hacia `core` y `contracts`, nunca al revés.

## Modelo mínimo

El dominio debe incluir:

- `Match`, `Team`, `Player`, `Official` y `Commentator`.
- `MatchClock` basado en timestamps y estado `running | paused | stopped`.
- Periodo, tiempo añadido y estado del partido.
- Marcador y eventos de gol, tarjeta, sustitución y nota.
- Alineación, suplentes y posiciones.
- Estado de gráficos al aire.
- Registro append-only de acciones con undo/corrección explícitos.

No usar `any`. Los datos desconocidos se reciben como `unknown` y se validan.

## Protocolo

El panel envía comandos con un identificador único. El servidor valida, aplica
una transición atómica y emite eventos. Los clientes reciben primero un
snapshot y después eventos ordenados.

Ejemplo conceptual:

```ts
type CommandEnvelope<T> = {
  version: 1;
  commandId: string;
  issuedAt: string;
  type: string;
  payload: T;
};

type StateSnapshot = {
  version: 1;
  revision: number;
  match: MatchState;
  graphics: GraphicsState;
};
```

Requisitos:

- Idempotencia por `commandId`.
- Revisión monotónica.
- Rechazo explícito de comandos inválidos.
- Snapshot al conectar o reconectar.
- Contratos versionados y validados en runtime.
- Los eventos Socket.io usan `domain.action`, por ejemplo
  `match.scoreChanged` o `graphics.cueTaken`.

## Reloj

Nunca incrementar el tiempo oficial mediante `setInterval`. Persistir tiempo
acumulado y timestamp de inicio; derivar la visualización desde un reloj
monotónico. El servidor decide el estado oficial y el overlay interpola entre
sincronizaciones.

## Gráficos y cues

Los gráficos se activan mediante cues, no manipulando componentes directamente:

```text
scorebug.show
scorebug.hide
goal.show
lineup.show
lowerThird.show
note.show
all.hide
```

Cada cue define datos, prioridad, exclusión, duración y transición. `all.hide`
debe estar siempre disponible como acción de emergencia.

El overlay debe:

- Tener fondo transparente y un viewport lógico 1920x1080.
- Mantener 30 fps en el hardware objetivo.
- Respetar safe areas.
- Limpiar timelines, timers y listeners.
- Reconstruirse únicamente con un snapshot.
- Proporcionar una vista de diagnóstico separada de la salida limpia.

## Operación segura

- Mostrar claramente conexión, revisión y gráficos al aire.
- Diferenciar Preview de Program.
- Confirmar acciones destructivas o de alto impacto.
- Evitar envíos dobles.
- Ofrecer undo y correcciones sin borrar el historial.
- Guardar cada acción con timestamp, operador y resultado.
- Incluir modo ensayo aislado de Program.
- Restaurar el último estado confirmado al reiniciar.

## vMix

Primera integración:

- URL estable, por ejemplo `http://127.0.0.1:3100/overlay/program`.
- Browser Input transparente en vMix.
- Adaptador separado para la API HTTP/TCP de vMix.
- Indicadores de conexión y errores sin contaminar el overlay.
- Timeout, reintentos acotados y circuit breaker para automatizaciones.

La aplicación no genera NDI/OMT inicialmente. vMix es responsable de la salida.
Una salida directa futura debe implementar la misma interfaz de adaptador.

## Persistencia

- Base de datos bajo `app.getPath("userData")`.
- SQLite WAL, transacciones e integridad referencial.
- Migraciones con rollback o respaldo previo.
- Guardado atómico del estado confirmado y del log de acciones.
- Exportación/importación de partidos y configuración.
- Nunca guardar secretos en texto plano.

## Seguridad

- Servicios locales enlazados a `127.0.0.1` por defecto.
- CORS con allowlist; sin comodines.
- CSP estricta.
- Sin Node.js en renderers.
- API Electron mínima, tipada y expuesta por preload.
- Sanitizar texto y limitar tamaños de imágenes/datos importados.
- No registrar secretos ni datos sensibles.

## Calidad

Todo cambio debe ejecutar, según corresponda:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Pruebas obligatorias para:

- Transiciones del núcleo y comandos inválidos.
- Reloj: iniciar, pausar, reanudar, corregir y recuperar.
- Idempotencia, orden y reconexión.
- Migraciones y restauración.
- Cues incompatibles y `all.hide`.
- Flujo panel → servidor → overlay.

No aceptar afirmaciones absolutas como “cero latencia” o “sin fallos”. Medir y
documentar hardware, resolución, fps, latencia y duración de las pruebas.

## Flujo de implementación

1. Mantener el cambio dentro de la fase activa.
2. Definir o actualizar el contrato antes de implementar consumidores.
3. Escribir pruebas del núcleo.
4. Implementar servidor, panel y overlay en ese orden.
5. Verificar reconexión y recuperación.
6. Documentar solamente decisiones o uso que hayan cambiado.

No generar carpetas vacías ni implementar características futuras como
placeholders engañosos.
