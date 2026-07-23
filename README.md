# StreamCtrl.app

Aplicación local para operar gráficos deportivos en tiempo real y enviarlos a
vMix mediante una única fuente de navegador transparente.

El primer objetivo es fútbol, especialmente partidos y finales donde la
estabilidad, la corrección rápida de errores y la recuperación del estado son
tan importantes como el diseño gráfico.

## Objetivo

StreamCtrl separa la operación, los datos del partido y el renderizado:

```text
Panel de control
      |
      v
Núcleo del partido + SQLite
      |
      +-- WebSocket --> Overlay transparente --> vMix --> NDI/OMT
      |
      +-- Adaptador vMix API --> automatización de inputs y overlays
```

En la primera versión, vMix continúa siendo el compositor y responsable de la
salida NDI/OMT. Una salida directa podrá añadirse después como otro adaptador,
sin reemplazar el núcleo ni el panel.

## Alcance inicial

- Marcador permanente y cronómetro.
- Periodos, descanso, tiempo añadido y estado final.
- Goles, tarjetas y sustituciones.
- Alineaciones, suplentes y posiciones de jugadores.
- Estadísticas y notas informativas.
- Lower thirds para jugadores, técnicos y comentaristas.
- Pantallas de previa, medio tiempo y resultado final.
- Historial de eventos, corrección y deshacer.
- Recuperación automática después de cerrar o reiniciar la aplicación.
- Indicadores de conexión y de qué gráfico está al aire.
- Atajos de teclado, confirmaciones y protección contra dobles pulsaciones.
- Modo ensayo para probar una producción sin afectar la salida al aire.

## Stack tecnológico

- TypeScript en todo el proyecto.
- Electron para la aplicación de escritorio.
- React + Vite para el panel y el overlay.
- Node.js + Express para el servicio local.
- Socket.io para sincronización en tiempo real.
- SQLite + better-sqlite3 para persistencia local.
- Zustand para estado de interfaz.
- GSAP para animaciones del overlay.
- Vitest + React Testing Library para pruebas unitarias y de componentes.
- Playwright para flujos críticos y pruebas del overlay.

## Principios de arquitectura

1. El núcleo del partido es la única fuente de verdad.
2. El panel nunca controla directamente el DOM del overlay.
3. Los mensajes usan contratos tipados y versionados.
4. El overlay puede reconectarse y reconstruirse desde un snapshot completo.
5. Los relojes se calculan desde marcas de tiempo, no contando intervalos.
6. vMix, NDI y futuras salidas se implementan como adaptadores.
7. Las plantillas visuales no contienen reglas del deporte.
8. Toda acción operativa importante queda registrada.

Ejemplos de cues:

```text
scorebug.show
scorebug.hide
goal.show
lineup.show
lowerThird.show
note.show
all.hide
```

## Estructura prevista

```text
apps/
  desktop/       Electron, preload e IPC
  control/       panel React
  overlay/       salida transparente 1920x1080
  server/        API local, Socket.io y composición
packages/
  core/          reglas y estado del partido
  contracts/     comandos, eventos y snapshots
  database/      esquema, migraciones y repositorios
  graphics/      componentes y sistema de cues
  adapters/      vMix y futuras salidas
docs/
  architecture.md
```

## Primer hito: ciclo vertical

Antes de construir todos los gráficos se validará un flujo completo:

1. Crear o cargar un partido.
2. Cambiar el marcador desde el panel.
3. Sincronizar el cambio por WebSocket.
4. Renderizar y animar el scorebug transparente.
5. Mostrar y ocultar un lower third.
6. Reconectar el overlay y recuperar el estado.
7. Cargar la URL del overlay como Browser Input en vMix.

## Roadmap

- **Fase 0 — Fundación:** monorepo, contratos, núcleo, base de datos y pruebas.
- **Fase 1 — Ciclo vertical:** panel, marcador, reloj, lower third y overlay.
- **Fase 2 — Operación de fútbol:** jugadores, eventos, alineaciones y estadísticas.
- **Fase 3 — vMix:** Browser Input, API, estado al aire y acciones de emergencia.
- **Fase 4 — Producción:** ensayo, auditoría, recuperación y redundancia.
- **Fase 5 — Plantillas:** temas, branding y editor de datos.
- **Fase 6 — Empaquetado:** instalador Windows, actualización y documentación.
- **Futuro:** otros deportes, control remoto y salida NDI/OMT directa si se justifica.

## Estado

El proyecto se encuentra en fase de especificación y fundación. Aún no hay una
versión funcional ni se deben asumir promesas de “cero latencia”. Los objetivos
iniciales son 1920x1080 a 60 fps, activación perceptualmente inmediata y
recuperación determinista del estado.

Consulta [docs/architecture.md](docs/architecture.md) para la especificación
técnica inicial.

## Desarrollo guiado por especificaciones

El proyecto utiliza GitHub Spec Kit. La primera entrega está definida en:

- [Especificación](specs/001-first-vertical-slice/spec.md)
- [Plan técnico](specs/001-first-vertical-slice/plan.md)
- [Diseño del panel y gráficos](specs/001-first-vertical-slice/ui-design.md)
- [Protocolo de validación](specs/001-first-vertical-slice/quickstart.md)
- [Tareas de implementación](specs/001-first-vertical-slice/tasks.md)

Las contribuciones deben seguir [CONTRIBUTING.md](CONTRIBUTING.md) y la
[constitución del proyecto](.specify/memory/constitution.md).

## Licencia

[MIT](LICENSE).
