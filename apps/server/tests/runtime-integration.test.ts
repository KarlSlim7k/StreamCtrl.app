import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { io, type Socket } from "socket.io-client";
import { afterEach, describe, expect, it } from "vitest";

import { startStreamCtrlServer, type RunningServer } from "../src/bootstrap.js";

let running: RunningServer | null = null;
const sockets: Socket[] = [];

afterEach(async () => {
  for (const socket of sockets.splice(0)) socket.disconnect();
  await running?.close();
  running = null;
});

function nextEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), 3_000);
    socket.once(event, (value: T) => {
      clearTimeout(timeout);
      resolve(value);
    });
  });
}

function send(socket: Socket, type: string, payload: Record<string, unknown>) {
  return new Promise<Record<string, unknown>>((resolve) => {
    socket.emit(
      "command",
      {
        protocolVersion: 1,
        messageId: crypto.randomUUID(),
        type,
        sentAt: new Date().toISOString(),
        payload
      },
      resolve
    );
  });
}

describe("executable realtime runtime", () => {
  it("publishes persisted match and graphics snapshots to Program", async () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-runtime-"));
    running = await startStreamCtrlServer({
      STREAMCTRL_PORT: 0,
      STREAMCTRL_DATABASE_PATH: join(directory, "streamctrl.db"),
      STREAMCTRL_LOG_DIRECTORY: join(directory, "logs"),
      STREAMCTRL_LOG_LEVEL: "silent"
    });
    const control = io(running.url, {
      auth: { role: "control", sessionId: "operator-1", mode: "production" }
    });
    sockets.push(control);
    await nextEvent(control, "connection.statusChanged");

    const matchSnapshot = nextEvent<{ matchRevision: number }>(control, "state.snapshot");
    expect(
      await send(control, "match.create", {
        commandId: "create-1",
        match: {
          id: "match-1",
          name: "Final",
          homeTeam: {
            id: "home",
            fullName: "Local",
            shortName: "LOC",
            primaryColor: "#112233",
            secondaryColor: "#ffffff"
          },
          awayTeam: {
            id: "away",
            fullName: "Visitante",
            shortName: "VIS",
            primaryColor: "#334455",
            secondaryColor: "#ffffff"
          }
        }
      })
    ).toMatchObject({ accepted: true, resultingRevision: 1 });
    expect(await matchSnapshot).toMatchObject({ matchRevision: 1 });

    const program = io(running.url, { auth: { role: "overlay-program" } });
    sockets.push(program);
    expect(await nextEvent(program, "state.snapshot")).toMatchObject({
      matchRevision: 1,
      graphicsRevision: 0
    });

    expect(
      await send(control, "graphics.previewSet", {
        commandId: "preview-1",
        matchId: "match-1",
        cue: {
          cueId: "cue-1",
          type: "lowerThird",
          action: "preview",
          layer: 20,
          payload: { primaryText: "Ana Pérez", secondaryText: "Comentarista" },
          requestedAt: new Date().toISOString()
        }
      })
    ).toMatchObject({ accepted: true, resultingRevision: 0 });

    const graphicsSnapshot = nextEvent<{
      graphicsRevision: number;
      graphics: { lowerThird: { payload: { primaryText: string } } };
    }>(program, "state.snapshot");
    expect(
      await send(control, "graphics.cueTake", {
        commandId: "take-1",
        matchId: "match-1",
        expectedRevision: 0,
        type: "lowerThird"
      })
    ).toMatchObject({ accepted: true, resultingRevision: 1 });
    expect(await graphicsSnapshot).toMatchObject({
      graphicsRevision: 1,
      graphics: { lowerThird: { payload: { primaryText: "Ana Pérez" } } }
    });
  });
});
