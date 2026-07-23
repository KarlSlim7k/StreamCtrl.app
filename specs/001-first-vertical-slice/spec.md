# Feature Specification: Primer ciclo vertical de partido

**Feature Branch**: `codex/spec-first-vertical-slice`

**Created**: 2026-07-23

**Status**: Ready for planning

**Input**: User description: "Preparar el primer ciclo vertical de StreamCtrl.app
para operar un partido de fútbol, controlar marcador y reloj, tomar un lower
third, entregar un overlay transparente a vMix y recuperarse de desconexiones o
reinicios."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Operar marcador y reloj (Priority: P1)

Un operador crea o carga un partido, identifica a los equipos y controla el
marcador, el periodo y el reloj oficial desde una sola vista. Puede iniciar,
pausar, reanudar y corregir el reloj, además de corregir el marcador sin perder
el registro de lo ocurrido.

**Why this priority**: Sin un estado oficial y confiable del partido, ningún
gráfico posterior puede considerarse apto para salir al aire.

**Independent Test**: Se puede validar creando un partido, ejecutando una
secuencia de cambios de marcador y reloj, corrigiendo un error y comprobando que
la vista oficial y el historial coincidan.

**Acceptance Scenarios**:

1. **Given** un partido nuevo con dos equipos, **When** el operador inicia el
   primer tiempo, **Then** el reloj avanza desde el valor configurado y el panel
   muestra que está en ejecución.
2. **Given** un reloj en ejecución, **When** el operador lo pausa, reanuda o
   corrige, **Then** el valor oficial cambia una sola vez y la acción queda
   registrada.
3. **Given** un marcador incorrecto, **When** el operador realiza una
   corrección, **Then** el resultado oficial se actualiza sin borrar el
   historial previo.
4. **Given** el final de un periodo, **When** el operador añade tiempo o cambia
   de periodo, **Then** el estado del partido refleja claramente la transición.

---

### User Story 2 - Llevar gráficos a Program (Priority: P2)

El operador previsualiza el scorebug y un lower third antes de enviarlos a
Program. Puede mostrarlos, ocultarlos y ejecutar una acción de emergencia que
limpia todos los gráficos sin alterar los datos oficiales del partido.

**Why this priority**: Convierte el control del partido en una salida visual
utilizable y reduce el riesgo de publicar información incompleta o equivocada.

**Independent Test**: Se puede validar conectando una vista de Program,
preparando un lower third, tomándolo al aire y usando la acción de emergencia,
sin depender de automatización externa.

**Acceptance Scenarios**:

1. **Given** datos editados pero no confirmados, **When** el operador observa
   Preview, **Then** Program conserva exactamente el contenido que ya estaba al
   aire.
2. **Given** un scorebug preparado, **When** el operador lo toma, **Then**
   Program muestra marcador, periodo y reloj oficiales.
3. **Given** un lower third con nombre y función, **When** el operador lo toma,
   **Then** aparece y sale mediante acciones explícitas sin reemplazar el estado
   oficial del partido.
4. **Given** uno o más gráficos visibles, **When** el operador ejecuta
   `all.hide`, **Then** Program queda limpio y el panel confirma el resultado.

---

### User Story 3 - Recuperarse durante una transmisión (Priority: P3)

El operador puede continuar después de que el panel, el overlay o toda la
aplicación se cierre inesperadamente. Al reconectar, cada vista recupera el
último estado confirmado sin repetir acciones ni requerir reconstrucción
manual.

**Why this priority**: Una final deportiva necesita recuperación predecible;
una demostración que solo funciona en condiciones ideales no es suficiente.

**Independent Test**: Se puede validar cerrando por separado el panel, la vista
de Program y la aplicación completa durante un partido simulado, y comprobando
que cada reinicio restaura el mismo estado confirmado.

**Acceptance Scenarios**:

1. **Given** un partido activo, **When** una vista de Program se reconecta,
   **Then** reconstruye el marcador, reloj y gráficos visibles desde un estado
   completo.
2. **Given** una acción ya confirmada, **When** su entrega se repite después de
   una reconexión, **Then** no se aplica por segunda vez.
3. **Given** un cierre completo, **When** la aplicación vuelve a abrir,
   **Then** ofrece restaurar el último partido confirmado con su historial.
4. **Given** que la automatización de vMix no responde, **When** el operador
   continúa trabajando, **Then** el estado oficial y la salida web permanecen
   disponibles y el fallo se muestra por separado.

---

### User Story 4 - Validar la salida en vMix (Priority: P4)

Un técnico agrega una única fuente de navegador transparente en vMix y confirma
que los gráficos respetan la resolución, las áreas seguras y el comportamiento
esperado durante una prueba prolongada.

**Why this priority**: El ciclo vertical solo termina cuando la salida real de
producción es verificable, aunque vMix no sea necesario durante el desarrollo
inicial.

**Independent Test**: Se puede validar cargando la salida limpia en vMix,
simulando un partido y observando transparencia, fluidez, sincronía y
recuperación.

**Acceptance Scenarios**:

1. **Given** una fuente de navegador configurada a 1920x1080, **When** carga la
   salida de Program, **Then** el fondo es transparente y no aparecen controles
   ni mensajes de diagnóstico.
2. **Given** un partido simulado de dos horas, **When** se operan marcador,
   reloj y lower thirds, **Then** la salida conserva fluidez y sincronía
   perceptual.
3. **Given** que la vista de Program pierde conexión, **When** el servicio se
   recupera, **Then** vuelve al último estado confirmado sin recrear la fuente
   en vMix.

### Edge Cases

- El operador intenta iniciar un reloj que ya está corriendo o pausar uno
  detenido.
- Dos pulsaciones iguales llegan casi al mismo tiempo.
- Se corrige el marcador después de haber mostrado un gráfico de gol.
- El reloj cruza el minuto reglamentario mientras existe tiempo añadido.
- El partido requiere prórroga o tanda de penales.
- Faltan el nombre o la función del lower third al intentar tomarlo.
- Preview y Program reciben revisiones en distinto orden.
- El almacenamiento no puede confirmar una acción.
- Una vista se reconecta con una revisión más reciente o más antigua.
- La automatización de vMix falla mientras la salida de navegador sigue activa.
- `all.hide` se ejecuta durante una animación de entrada o salida.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema MUST permitir crear, guardar, cargar y cerrar un partido
  con dos equipos identificables.
- **FR-002**: El sistema MUST mantener una única revisión oficial del estado del
  partido y comunicarla a todas las vistas conectadas.
- **FR-003**: El operador MUST poder establecer y corregir el marcador de ambos
  equipos sin borrar acciones anteriores.
- **FR-004**: El operador MUST poder iniciar, pausar, reanudar, detener y
  corregir el reloj oficial.
- **FR-005**: El sistema MUST admitir primer tiempo, descanso, segundo tiempo,
  tiempo añadido, prórroga y tanda de penales mediante transiciones explícitas.
- **FR-006**: La duración reglamentaria y el tiempo añadido MUST ser
  configurables; el valor inicial recomendado será de dos periodos de 45
  minutos.
- **FR-007**: El sistema MUST registrar cada acción aceptada o rechazada con
  momento, resultado y revisión relacionada.
- **FR-008**: Las correcciones y deshacer MUST crear nuevas acciones y MUST NOT
  eliminar el historial previo.
- **FR-009**: El sistema MUST separar los datos en edición, la previsualización
  y el estado confirmado de Program.
- **FR-010**: El operador MUST poder mostrar y ocultar un scorebug que represente
  el marcador, periodo y reloj oficiales.
- **FR-011**: El operador MUST poder preparar, previsualizar, mostrar y ocultar
  un lower third con nombre principal y función secundaria.
- **FR-012**: El sistema MUST impedir que un lower third incompleto llegue a
  Program y MUST explicar qué dato falta.
- **FR-013**: El operador MUST disponer de `all.hide` para limpiar todos los
  gráficos de Program sin modificar el partido.
- **FR-014**: El panel MUST indicar conexión, revisión oficial, estado del reloj
  y gráficos actualmente visibles en Program.
- **FR-015**: Las acciones repetidas MUST ser idempotentes y producir como
  máximo una transición oficial.
- **FR-016**: Toda vista que se conecte o reconecte MUST reconstruirse desde un
  snapshot completo antes de procesar cambios posteriores.
- **FR-017**: El sistema MUST persistir atómicamente el último estado confirmado
  y su historial, y MUST rechazar una transición si no puede confirmarla.
- **FR-018**: Después de reiniciar, el operador MUST poder restaurar el último
  partido confirmado sin reconstruir manualmente marcador, reloj o Program.
- **FR-019**: El sistema MUST ofrecer una salida de Program limpia, transparente
  y sin controles, apta para una única fuente de navegador en vMix.
- **FR-020**: Un fallo de automatización de vMix MUST mostrarse al operador y
  MUST NOT bloquear la salida de navegador ni alterar el estado oficial.
- **FR-021**: El sistema MUST incluir un modo ensayo aislado para simular
  acciones sin cambiar el Program de una producción activa.
- **FR-022**: El alcance de esta entrega MUST limitarse al ciclo vertical; goles
  animados, tarjetas, cambios, alineaciones completas, estadísticas, redes
  sociales, PTZ y salida NDI/OMT directa quedan fuera.
- **FR-023**: La entrega MUST incluir pruebas automatizadas de reglas, contratos,
  reconexión, restauración y flujos críticos del operador.
- **FR-024**: La entrega MUST incluir un protocolo reproducible para medir
  latencia percibida, fluidez, sincronía y uso de recursos en el hardware
  objetivo.

### Key Entities

- **Match**: Partido operado, con identidad, equipos, formato, estado actual,
  periodo y revisión.
- **Team**: Participante local o visitante con nombre corto, nombre completo,
  colores y marcador.
- **MatchClock**: Tiempo oficial, modo actual, valor acumulado, referencia de
  inicio y correcciones.
- **MatchEvent**: Registro cronológico de una acción deportiva o corrección sin
  borrado destructivo.
- **GraphicCue**: Solicitud de mostrar u ocultar un gráfico con contenido
  validado y comportamiento esperado.
- **GraphicsState**: Representación confirmada de los gráficos visibles en
  Program y su revisión.
- **StateSnapshot**: Copia completa y autoconsistente necesaria para iniciar o
  reconstruir una vista.
- **ActionRecord**: Evidencia de un comando aceptado o rechazado, su identidad,
  momento, resultado y revisión.
- **OperatorSession**: Contexto local de operación, incluido el modo producción
  o ensayo; el MVP admite un operador activo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un operador entrenado puede crear un partido y poner marcador y
  reloj listos para Preview en menos de 3 minutos.
- **SC-002**: Al menos 95% de las acciones normales de marcador, reloj y gráficos
  se completan con un máximo de dos interacciones deliberadas.
- **SC-003**: Cada acción confirmada produce feedback visible al operador en
  menos de 250 ms en el hardware objetivo.
- **SC-004**: `all.hide` deja Program limpio y confirmado en menos de 1 segundo.
- **SC-005**: Tras reconectar una vista, el último estado confirmado vuelve a
  mostrarse en menos de 3 segundos sin duplicar acciones.
- **SC-006**: Tras reiniciar la aplicación, el operador puede restaurar el
  partido confirmado en menos de 10 segundos.
- **SC-007**: Una prueba continua de dos horas mantiene el reloj dentro de 100 ms
  de la referencia elegida y no presenta crecimiento continuo de memoria.
- **SC-008**: La salida de Program mantiene 60 fotogramas por segundo en el
  hardware objetivo durante las escenas definidas del ciclo vertical, sin
  caídas sostenidas mayores a 1 segundo.
- **SC-009**: El 100% de los escenarios de corrección, duplicación, reconexión,
  reinicio y fallo de automatización definidos en esta especificación produce
  un resultado determinista y auditable.
- **SC-010**: Un técnico puede añadir la salida a vMix como una sola fuente,
  confirmar transparencia y completar el protocolo de validación en menos de
  15 minutos.

## Assumptions

- La primera entrega está pensada para Windows y un único operador local.
- No se requiere autenticación para un servicio ligado únicamente al equipo
  local durante el MVP.
- Los nombres, colores y datos básicos de los equipos se introducen
  manualmente; no existe proveedor deportivo externo.
- Prórroga y penales se controlan manualmente y no se activan automáticamente
  por reglas de competición.
- vMix realiza composición, grabación y salida NDI/OMT; la aplicación solo
  entrega el overlay y automatización opcional.
- El diseño visual inicial incluye un scorebug y un lower third neutros,
  personalizables más adelante.
- La referencia de reloj del MVP es el reloj del equipo local; la
  sincronización con un reloj oficial externo queda fuera.
- La producción cuenta con un hardware principal; la conmutación automática a
  un segundo equipo queda fuera, aunque se documentará un procedimiento manual.
- Toda prueba de rendimiento registrará CPU, GPU, memoria, resolución,
  frecuencia de cuadro, versión de vMix y duración.
