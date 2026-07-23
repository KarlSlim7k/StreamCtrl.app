# Auditoría de dependencias

Fecha: 2026-07-23  
Alcance: dependencias de producción y herramientas del primer ciclo vertical.

## Resultado

Desde la raíz del repositorio se ejecutó:

```powershell
pnpm audit --prod
```

Resultado: **sin vulnerabilidades conocidas**.

También se ejecutó `pnpm outdated --format list`. Sólo se ofrecieron versiones
fuera de la línea fijada por el proyecto:

- `@types/node` 24.13.3 → 26.1.1.
- TypeScript 5.9.3 → 7.0.2.

No se actualizan en este hito porque Node 24 es el runtime declarado y TypeScript
7 es un cambio mayor que requiere una migración independiente.

## Riesgos aceptados

- La estación inspeccionada tiene Node 22.22.3, mientras el repositorio y CI
  exigen Node 24. Las comprobaciones locales pasan, pero la validación de release
  debe ejecutarse con Node 24.
- Electron y `better-sqlite3` incluyen código nativo o binarios distribuidos.
  Deben instalarse únicamente desde el lockfile revisado y el instalador final
  debe firmarse.
- La API HTTP de vMix es un adaptador opcional y acotado por timeout/circuit
  breaker. Sus fallos no pueden modificar el estado oficial del partido.
- El servidor escucha sólo en `127.0.0.1`; exponerlo a la red requerirá un modelo
  de autenticación y amenazas nuevo.
- Los respaldos manuales contienen datos editoriales del partido. Deben guardarse
  en medios controlados y verificarse por checksum antes de importarlos.

## Criterio para repetirla

Repetir `pnpm audit --prod`, pruebas, build y revisión de licencias antes de cada
final deportiva, al actualizar el lockfile o al cambiar Node/Electron.
