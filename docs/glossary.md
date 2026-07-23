# Glosario operativo

Este glosario fija los términos que se muestran al operador. Los nombres de
protocolos y superficies de producción se conservan cuando traducirlos podría
crear ambigüedad durante una transmisión.

| Término         | Uso en StreamCtrl                                                              |
| --------------- | ------------------------------------------------------------------------------ |
| Program         | Salida confirmada que recibe vMix. Nunca contiene controles ni diagnósticos.   |
| Preview         | Preparación local de un gráfico antes de enviarlo a Program.                   |
| Tomar           | Confirmar que el contenido preparado pase de Preview a Program.                |
| Cue             | Orden tipada para mostrar, ocultar o actualizar un gráfico.                    |
| Marcador        | Gráfico persistente con equipos, resultado y reloj; nombre técnico: scorebug.  |
| Rótulo inferior | Gráfico temporal con nombre y función; nombre técnico: lower third.            |
| Al aire         | Estado visible actualmente en Program.                                         |
| Limpio          | Program sin gráficos visibles.                                                 |
| Ocultar todos   | Acción de emergencia `all.hide` que limpia Program.                            |
| Revisión        | Número secuencial del estado confirmado del partido o de gráficos.             |
| Snapshot        | Copia completa y versionada usada para reconstruir una pantalla al reconectar. |
| Ensayo          | Sesión operativa que no debe afectar una salida de producción.                 |
| Browser Input   | Entrada de navegador transparente configurada en vMix.                         |
| Adaptador vMix  | Integración opcional con la API HTTP de vMix; no es la fuente de verdad.       |

Los mensajes deben indicar el estado con texto además de color. En instrucciones
para operadores se escriben **Preview**, **Program** y **Browser Input** tal como
aparecen en vMix.
