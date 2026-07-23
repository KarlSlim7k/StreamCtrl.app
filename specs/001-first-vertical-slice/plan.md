# Implementation Plan: Primer ciclo vertical de partido

**Branch**: `codex/spec-first-vertical-slice` | **Date**: 2026-07-23 |
**Spec**: [spec.md](spec.md)

**Input**: Feature specification from
`specs/001-first-vertical-slice/spec.md`

## Summary

Construir un ciclo vertical local que permita crear o restaurar un partido,
operar marcador y reloj, preparar/tomar un scorebug y un lower third, y mantener
una salida transparente para vMix. El servidor local será la autoridad: validará
comandos, persistirá transiciones atómicas y distribuirá snapshots y eventos
versionados. Panel y overlay serán proyecciones independientes.

## Technical Context

**Language/Version**: TypeScript 5.x estricto sobre Node.js 24 LTS

**Primary Dependencies**: Electron (versión soportada actual), React, Vite,
Express, Socket.IO 4.x, Zod, Zustand, GSAP 3.x

**Storage**: SQLite con better-sqlite3, WAL, migraciones y respaldos previos

**Testing**: Vitest, React Testing Library y Playwright; pruebas de contrato,
recuperación y endurance

**Target Platform**: Windows 11 x64; vMix Max 29.0.0.48 como referencia de
validación; overlay lógico 1920x1080 a 30 fps

**Project Type**: Monorepo de aplicación de escritorio, servicio local y dos
renderers web independientes

**Performance Goals**: feedback local menor a 250 ms; `all.hide` confirmado en
menos de 1 s; restauración de vista en menos de 3 s; reloj dentro de 100 ms
durante dos horas; 30 fps sostenidos en las escenas del MVP

**Constraints**: operación offline, una sola autoridad de escritura, servicios
ligados a loopback, salida transparente sin diagnósticos, persistencia antes de
publicación, un operador activo

**Scale/Scope**: un partido activo, hasta cuatro clientes locales simultáneos,
scorebug y un lower third, historial completo del partido, una salida Program

## Constitution Check

_GATE: Passed before Phase 0 research and re-checked after Phase 1 design._

- [x] Match state has one authoritative owner; renderers and adapters are
      read-only projections.
- [x] Edit, Preview, and Program are distinct in the UI and contracts.
- [x] Restart, reconnection, snapshot restoration, and vMix-adapter failure have
      defined scenarios and tasks.
- [x] Commands, events, snapshots, cues, and errors use versioned Zod contracts.
- [x] Domain logic remains independent from UI, storage, transport, and vMix.
- [x] Unit, contract, integration, end-to-end, recovery, and endurance
      validations are identified.
- [x] Scope remains inside the football + vMix first vertical slice.

Post-design review: **PASS**. El perfil 1920x1080p30 coincide con la
Constitución v1.1.0 y no requiere excepciones.

## Project Structure

### Documentation (this feature)

```text
specs/001-first-vertical-slice/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── ui-design.md
├── quickstart.md
├── contracts/
│   ├── realtime.md
│   └── openapi.yaml
├── checklists/
│   └── requirements.md
└── tasks.md
```

### Source Code (repository root)

```text
apps/
├── desktop/
│   └── src/
├── control/
│   ├── src/
│   └── tests/
├── overlay/
│   ├── src/
│   └── tests/
└── server/
    ├── src/
    └── tests/

packages/
├── core/
│   ├── src/
│   └── tests/
├── contracts/
│   ├── src/
│   └── tests/
├── database/
│   ├── src/
│   └── tests/
├── graphics/
│   ├── src/
│   └── tests/
└── adapters/
    ├── src/
    └── tests/

tests/
├── e2e/
├── recovery/
└── endurance/
```

**Structure Decision**: pnpm workspaces coordinará cuatro aplicaciones y cinco
paquetes. `core` y `contracts` no dependerán de frameworks. `server` será el
único escritor. `desktop` iniciará y supervisará el servicio, pero la salida
Program también podrá cargarse directamente desde vMix.

## Phase 0: Research

Las decisiones, alternativas y referencias quedan en
[research.md](research.md). No quedan elementos `NEEDS CLARIFICATION`.

## Phase 1: Design & Contracts

- Modelo y transiciones: [data-model.md](data-model.md)
- Contrato en tiempo real: [contracts/realtime.md](contracts/realtime.md)
- Superficie HTTP: [contracts/openapi.yaml](contracts/openapi.yaml)
- Diseño operativo y gráfico: [ui-design.md](ui-design.md)
- Validación reproducible: [quickstart.md](quickstart.md)

## Delivery Sequence

1. Fundación del monorepo y contratos.
2. Núcleo puro del partido y reloj.
3. Persistencia transaccional e historial.
4. Servicio autoritativo y sincronización.
5. Panel Edit/Preview/Program.
6. Overlay con scorebug, lower third y `all.hide`.
7. Supervisión Electron y adaptador vMix opcional.
8. Pruebas de recuperación, endurance y validación en vMix.

## Complexity Tracking

No existen violaciones constitucionales ni complejidad excepcional que requiera
justificación.
