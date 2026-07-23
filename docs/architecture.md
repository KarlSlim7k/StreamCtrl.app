# Arquitectura inicial

## Contexto

StreamCtrl opera gráficos de fútbol desde una aplicación local y entrega una
sola página transparente a vMix. El sistema debe poder continuar sin internet,
recuperarse de una caída y permitir correcciones rápidas durante una final.

## Componentes

### Núcleo del partido

Máquina de estados pura que recibe comandos y produce eventos. Contiene reglas
del marcador, reloj, periodos, jugadores, alineaciones y eventos. No conoce la
interfaz, la base de datos ni vMix.

### Servidor local

Es la autoridad de escritura. Valida comandos, ejecuta transacciones, conserva
la revisión actual y distribuye snapshots/eventos a paneles y overlays.

### Panel de control

Interfaz Electron/React orientada al operador. Incluye Preview, Program,
acciones rápidas, historial, undo, estado de conexiones y modo ensayo.

### Motor gráfico

Aplicación React independiente con viewport lógico 1920x1080 y transparencia.
Consume el estado oficial y ejecuta timelines GSAP. No contiene reglas del
partido.

### Adaptadores

Implementan efectos externos:

- Browser output para vMix.
- API HTTP/TCP de vMix.
- En el futuro, control remoto u otra salida.

## Flujo de datos

```text
operador
  -> comando versionado
  -> validación
  -> transición del núcleo
  -> transacción SQLite
  -> evento + nueva revisión
  -> panel y overlay
```

Si un cliente pierde eventos, solicita un snapshot. La revisión del snapshot
permite descartar mensajes anteriores.

## Estados gráficos

Se distinguen tres espacios:

- **Edit:** datos que el operador prepara.
- **Preview:** representación que puede revisar.
- **Program:** estado confirmado que recibe el overlay de vMix.

Tomar un cue copia/valida los datos necesarios hacia Program. Editar un
formulario no debe alterar accidentalmente lo que ya está al aire.

## Resolución de cues

Cada cue declara:

- Identificador y versión.
- Componente gráfico.
- Payload validado.
- Capa y prioridad.
- Grupo de exclusión.
- Transiciones de entrada y salida.
- Duración manual o automática.

El coordinador gráfico evita combinaciones inválidas. Un scorebug puede
permanecer mientras aparece un lower third, pero una alineación de pantalla
completa puede ocultar temporalmente ambos según la plantilla.

## Disponibilidad

Para la primera versión:

- Persistencia después de cada transición confirmada.
- Snapshot completo al iniciar y reconectar.
- Reinicio del servidor sin perder el partido.
- Overlay capaz de reconectarse sin recargar vMix.
- Acción local `all.hide`.
- Logs rotativos y exportables.
- Pruebas de varias horas con reloj y animaciones.

Para finales se recomienda además una segunda computadora preparada con el
mismo paquete y una exportación reciente. La conmutación automática entre
equipos no forma parte del primer hito.

## Integración con vMix

vMix carga:

```text
http://127.0.0.1:3100/overlay/program
```

Configuración objetivo:

- 1920x1080.
- 30 fps, alineado con el perfil habitual de las transmisiones.
- Fondo transparente.
- Audio deshabilitado.

El adaptador de vMix puede activar inputs u overlays mediante su API, pero el
overlay sigue funcionando aunque esa automatización no esté disponible.

## Primeros contratos a implementar

- `match.create`
- `match.load`
- `match.scoreSet`
- `clock.start`
- `clock.pause`
- `clock.correct`
- `graphics.previewSet`
- `graphics.cueTake`
- `graphics.allHide`
- `state.snapshot`
- `state.changed`

## Criterios de aceptación del primer hito

- El marcador se actualiza desde el panel sin recargar el overlay.
- El reloj continúa correctamente tras pausar y reconectar.
- Un lower third entra y sale mediante un cue.
- Un overlay nuevo reconstruye el estado desde un snapshot.
- Reiniciar la aplicación restaura el último estado confirmado.
- `all.hide` limpia Program.
- La salida se carga con transparencia en un Browser Input de vMix.
- Una prueba de dos horas no presenta crecimiento continuo de memoria ni
  pérdida de sincronía visible.
