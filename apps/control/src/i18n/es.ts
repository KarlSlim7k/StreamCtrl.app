export const es = {
  app: {
    name: "StreamCtrl",
    rehearsal: "Ensayo",
    live: "Al aire"
  },
  graphics: {
    allHide: "Ocultar todos los gráficos",
    clean: "Limpio",
    cues: "Gráficos",
    functionLabel: "Función",
    lowerThird: "Rótulo inferior",
    lowerThirdHidden: "Rótulo inferior oculto",
    lowerThirdOnProgram: "Rótulo inferior confirmado en Program",
    lowerThirdReady: "Rótulo inferior listo en Preview",
    missingFunction: "La función es obligatoria",
    missingPrimary: "El nombre principal es obligatorio",
    nameLabel: "Nombre principal",
    preview: "Preview",
    previewLowerThird: "Previsualizar rótulo inferior",
    program: "Program",
    programClean: "Program limpio",
    scorebug: "Marcador",
    showScorebug: "Mostrar marcador",
    hideScorebug: "Ocultar marcador",
    takeLowerThird: "Tomar rótulo inferior",
    prepareFirst: "Primero prepara el rótulo inferior en Preview"
  },
  status: {
    connected: "Conectado",
    disconnected: "Desconectado",
    disabled: "Deshabilitado",
    error: "Error",
    ok: "Correcto"
  }
} as const;

export type SpanishStrings = typeof es;
