import { io } from "socket.io-client";

const socket = io("http://127.0.0.1:3100", {
  auth: { role: "control", sessionId: "vmix-validation", mode: "production" }
});

function waitFor(event: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 5_000);
    socket.once(event, (value) => {
      clearTimeout(timeout);
      resolve(value);
    });
  });
}

function send(type: string, payload: Record<string, unknown>): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out sending ${type}`)), 5_000);
    socket.emit(
      "command",
      {
        protocolVersion: 1,
        messageId: crypto.randomUUID(),
        type,
        sentAt: new Date().toISOString(),
        payload
      },
      (acknowledgement: Record<string, unknown>) => {
        clearTimeout(timeout);
        if (!acknowledgement.accepted) reject(new Error(JSON.stringify(acknowledgement)));
        else resolve(acknowledgement);
      }
    );
  });
}

await waitFor("connection.statusChanged");
await send("match.create", {
  commandId: "vmix-create",
  match: {
    id: "vmix-final",
    name: "Final de validación",
    homeTeam: {
      id: "vmix-home",
      fullName: "Local",
      shortName: "LOC",
      primaryColor: "#1f6feb",
      secondaryColor: "#ffffff"
    },
    awayTeam: {
      id: "vmix-away",
      fullName: "Visitante",
      shortName: "VIS",
      primaryColor: "#d1242f",
      secondaryColor: "#ffffff"
    }
  }
});
await send("match.scoreSet", {
  commandId: "vmix-score",
  matchId: "vmix-final",
  expectedRevision: 1,
  home: 2,
  away: 1
});
await send("match.periodSet", {
  commandId: "vmix-period",
  matchId: "vmix-final",
  expectedRevision: 2,
  period: "secondHalf"
});
await send("clock.correct", {
  commandId: "vmix-clock",
  matchId: "vmix-final",
  expectedRevision: 3,
  elapsedMs: 4_034_000
});
await send("graphics.previewSet", {
  commandId: "vmix-scorebug-preview",
  matchId: "vmix-final",
  cue: {
    cueId: "vmix-scorebug",
    type: "scorebug",
    action: "preview",
    layer: 10,
    payload: {},
    requestedAt: new Date().toISOString()
  }
});
await send("graphics.cueTake", {
  commandId: "vmix-scorebug-take",
  matchId: "vmix-final",
  expectedRevision: 0,
  type: "scorebug"
});
await send("graphics.previewSet", {
  commandId: "vmix-lower-preview",
  matchId: "vmix-final",
  cue: {
    cueId: "vmix-lower",
    type: "lowerThird",
    action: "preview",
    layer: 20,
    payload: { primaryText: "Ana Pérez", secondaryText: "Comentarista" },
    requestedAt: new Date().toISOString()
  }
});
await send("graphics.cueTake", {
  commandId: "vmix-lower-take",
  matchId: "vmix-final",
  expectedRevision: 1,
  type: "lowerThird"
});

socket.disconnect();
