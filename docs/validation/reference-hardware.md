# Validación en hardware de referencia

Fecha de registro: 2026-07-23  
Estado: automatización y Browser Input aprobados; soak físico de dos horas
pendiente.

## Estación inspeccionada

| Componente             | Resultado                                               |
| ---------------------- | ------------------------------------------------------- |
| Equipo                 | ASUS TUF Gaming A16 FA607NUG                            |
| Sistema                | Windows 11 Home Single Language x64, 10.0.26200         |
| CPU                    | AMD Ryzen 7 7445HS, 6 núcleos / 12 procesadores lógicos |
| RAM                    | 16 GB                                                   |
| GPU dedicada           | NVIDIA GeForce RTX 4050 Laptop GPU, 6 GB                |
| Driver NVIDIA          | 573.05                                                  |
| GPU integrada          | AMD Radeon 740M                                         |
| Objetivo de producción | 1920×1080 a 30 fps                                      |
| vMix                   | Max 29.0.0.48, declarado para la estación               |
| Node local             | 22.22.3                                                 |
| pnpm local             | 11.9.0                                                  |

El repositorio exige Node 24. La diferencia local queda registrada como excepción
de entorno; CI es la evidencia normativa para Node 24.

## Evidencia automatizada

- El recorrido Playwright comprueba Preview/Program, toma explícita y
  `all.hide`.
- El snapshot visual comprueba lienzo transparente de 1920×1080 y safe areas.
- La simulación virtual de dos horas genera 25 muestras a 30 fps, 24 acciones de
  cue, tres reconexiones, deriva de reloj de 0 ms y crecimiento de memoria menor
  a 2 MB.
- Las pruebas de recuperación cubren cierre de Program, comando pendiente,
  reinicio completo, restauración desde snapshot y fallo del adaptador vMix.
- La auditoría de dependencias de producción no encontró vulnerabilidades
  conocidas.
- La integración ejecutable completó 50 pruebas en 21 archivos, incluidos
  persistencia de Program y publicación de snapshots a un cliente real de
  Socket.IO.
- Playwright completó los recorridos de operador y transparencia; el servidor
  de producción respondió `200` tanto para `/control/` como para
  `/overlay/program`, con base de datos saludable y vMix correctamente marcado
  como deshabilitado.

Estos valores validan algoritmos y umbrales, pero no sustituyen mediciones reales
de CPU, GPU, memoria y fluidez dentro de vMix.

## Validación física de Browser Input

Se ejecutó el 2026-07-23 con vMix Max 29.0.0.48:

| Comprobación                        | Resultado                                                                                   |
| ----------------------------------- | ------------------------------------------------------------------------------------------- |
| Entradas requeridas para StreamCtrl | Una entrada Browser                                                                         |
| URL                                 | `http://127.0.0.1:3100/overlay/program`                                                     |
| Captura de salida                   | 1920×1080                                                                                   |
| Alpha                               | Aprobado; el fondo de color de vMix permaneció visible fuera de los gráficos                |
| Contenido                           | Marcador 2–1, segundo tiempo, reloj 67:14 y rótulo de comentarista                          |
| Controles/diagnósticos en Program   | Ninguno                                                                                     |
| Audio del Browser Input             | Silenciado (`muted=True`)                                                                   |
| Teclado del Browser Input           | Deshabilitado mediante `BrowserKeyboardDisabled`                                            |
| Recuperación                        | Estado completo visible a los 2,915 ms tras reiniciar el servicio y recargar el mismo input |
| Recreación del Browser Input        | No fue necesaria                                                                            |

La evidencia local quedó en
`artifacts/vmix-validation/recovery-2900ms.jpg` y
`artifacts/vmix-validation/program-over-colour.jpg`. La primera se tomó después
de restaurar marcador y rótulo desde SQLite; ambas muestran el color inferior a
través de las zonas transparentes.

## Validación física pendiente

Falta ejecutar el protocolo continuo de dos horas para afirmar 30 fps sostenidos
y ausencia de presión creciente de memoria con vMix y StreamCtrl funcionando al
mismo tiempo. Hasta completar esa ventana, T069 permanece abierta y el hito no
se describe como final-ready.
