# StreamCtrl.app

Aplicación local para operar gráficos deportivos en tiempo real y enviarlos a
vMix mediante una única entrada de navegador transparente. El primer ciclo
vertical cubre marcador, reloj, Preview/Program, rótulo inferior, persistencia y
recuperación.

## Arquitectura

```text
Panel de control
      |
      v
Núcleo del partido + SQLite
      |
      +-- Socket.IO --> Overlay transparente --> vMix --> NDI/OMT
      |
      +-- Adaptador HTTP de vMix (opcional)
```

vMix continúa siendo el compositor y responsable de la salida NDI/OMT. El estado
oficial vive en StreamCtrl y puede reconstruirse desde SQLite y snapshots.

## Requisitos de desarrollo

- Windows 11 para la validación final con vMix.
- Node.js 24.
- pnpm 11 mediante Corepack.
- vMix Max 29 para la prueba de Browser Input; no es necesario para las pruebas
  unitarias, visuales ni de extremo a extremo.

Comprueba las versiones:

```powershell
node --version
pnpm --version
```

## Instalación y validación

```powershell
corepack enable
pnpm install --frozen-lockfile
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

El panel y el overlay pueden abrirse en modo de desarrollo con:

```powershell
pnpm dev
```

- Panel: `http://127.0.0.1:3101/`
- Program: `http://127.0.0.1:3100/overlay/program`
- Preview: `http://127.0.0.1:3100/overlay/preview`

También se pueden iniciar por separado con `pnpm dev:control` y
`pnpm dev:overlay`.

## Configuración de vMix

1. Inicia StreamCtrl antes de abrir la entrada.
2. En vMix agrega una sola entrada **Web Browser**.
3. Usa `http://127.0.0.1:3100/overlay/program`.
4. Configura 1920×1080 a 30 fps.
5. Deshabilita audio y entrada de teclado para ese Browser Input.
6. Coloca la entrada sobre el video y confirma que las zonas transparentes dejan
   ver la imagen inferior.
7. Conserva una entrada de respaldo deshabilitada en el equipo alterno.

No cargues Preview, controles ni diagnósticos en Program. El adaptador HTTP de
vMix es opcional: una falla de automatización no debe interrumpir el Browser
Input ni alterar el partido.

## Operación antes de una final

- Ejecuta todas las comprobaciones y el protocolo de dos horas.
- Exporta el paquete del partido y la configuración a un medio removible.
- Importa ese paquete en el equipo de respaldo y prueba su URL local.
- Verifica marcador, reloj, `all.hide`, reconexión y transparencia sobre video.
- Exporta los logs si ocurrió un cierre inesperado.

El procedimiento completo y los umbrales están en la
[guía de validación](specs/001-first-vertical-slice/quickstart.md). Los resultados
de esta estación se registran en
[hardware de referencia](docs/validation/reference-hardware.md).

## Estructura

```text
apps/
  control/       panel React
  desktop/       host Electron y ciclo de vida
  overlay/       Program/Preview transparentes
  server/        API local, Socket.IO y comandos
packages/
  adapters/      vMix y futuras salidas
  contracts/     mensajes y snapshots versionados
  core/          reglas del partido
  database/      SQLite, migraciones y repositorios
  graphics/      cues y coordinación Preview/Program
specs/
  001-first-vertical-slice/
```

## Desarrollo guiado por especificaciones

El proyecto usa GitHub Spec Kit:

- [Especificación](specs/001-first-vertical-slice/spec.md)
- [Plan técnico](specs/001-first-vertical-slice/plan.md)
- [Diseño del panel y gráficos](specs/001-first-vertical-slice/ui-design.md)
- [Tareas](specs/001-first-vertical-slice/tasks.md)
- [Constitución](.specify/memory/constitution.md)

Consulta también el [glosario operativo](docs/glossary.md), la
[arquitectura](docs/architecture.md) y la
[auditoría de dependencias](docs/security/dependency-audit.md).

## Licencia

[MIT](LICENSE)
