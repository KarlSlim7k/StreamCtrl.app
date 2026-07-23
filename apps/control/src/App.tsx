import { useEffect, useMemo, useState } from "react";

import type { GraphicCue, Period } from "@streamctrl/contracts";

import { GraphicsWorkspace } from "./features/graphics/GraphicsWorkspace.js";
import { BackupTools } from "./features/backup/BackupTools.js";
import { MatchControls } from "./features/match/MatchControls.js";
import { MatchSetup, type MatchSetupValue } from "./features/match/MatchSetup.js";
import { StatusAndHistory } from "./features/status/StatusAndHistory.js";
import { ControlRealtimeClient } from "./realtime/client.js";
import { useMatchStore, type MatchStore } from "./state/match-store.js";

function getSessionId(): string {
  const key = "streamctrl.sessionId";
  const current = localStorage.getItem(key);
  if (current) return current;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
}

function formatClock(snapshot: MatchStore["snapshot"]): string {
  if (!snapshot) return "00:00";
  const clock = snapshot.match.clock;
  const runningDelta =
    clock.mode === "running" ? Math.max(0, Date.now() - Date.parse(clock.lastSyncedAt)) : 0;
  const total = Math.max(0, clock.accumulatedMs + clock.displayOffsetMs + runningDelta);
  const minutes = Math.floor(total / 60_000);
  const seconds = Math.floor((total % 60_000) / 1_000);
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function App() {
  const connected = useMatchStore((state) => state.connected);
  const snapshot = useMatchStore((state) => state.snapshot);
  const acknowledgement = useMatchStore((state) => state.lastAcknowledgement);
  const [mode] = useState<"production" | "rehearsal">("production");
  const [, refreshClock] = useState(0);
  const client = useMemo(
    () =>
      new ControlRealtimeClient({
        serverUrl: import.meta.env.VITE_STREAMCTRL_SERVER_URL as string | undefined,
        sessionId: getSessionId(),
        mode,
        store: useMatchStore
      }),
    [mode]
  );

  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);

  useEffect(() => {
    if (snapshot?.match.clock.mode !== "running") return;
    const timer = window.setInterval(() => refreshClock((value) => value + 1), 250);
    return () => window.clearInterval(timer);
  }, [snapshot?.match.clock.mode]);

  async function createMatch(value: MatchSetupValue) {
    const matchId = crypto.randomUUID();
    await client.send("match.create", {
      match: {
        id: matchId,
        name: value.name,
        homeTeam: {
          id: crypto.randomUUID(),
          fullName: value.homeName,
          shortName: value.homeShortName,
          primaryColor: "#1f6feb",
          secondaryColor: "#ffffff"
        },
        awayTeam: {
          id: crypto.randomUUID(),
          fullName: value.awayName,
          shortName: value.awayShortName,
          primaryColor: "#d1242f",
          secondaryColor: "#ffffff"
        }
      }
    });
  }

  async function sendMatch(
    type:
      | "match.scoreSet"
      | "match.periodSet"
      | "match.close"
      | "match.undo"
      | "clock.start"
      | "clock.pause"
      | "clock.stop",
    extra: Record<string, unknown> = {}
  ) {
    if (!snapshot) return;
    await client.send(type, {
      matchId: snapshot.match.id,
      expectedRevision: snapshot.matchRevision,
      ...extra
    });
  }

  async function preview(cue: GraphicCue) {
    return client.send("graphics.previewSet", {
      matchId: snapshot?.match.id,
      cue
    });
  }

  async function graphicsMutation(
    type: "graphics.cueTake" | "graphics.cueHide" | "graphics.allHide",
    graphicType?: "scorebug" | "lowerThird"
  ) {
    return client.send(type, {
      matchId: snapshot?.match.id,
      expectedRevision: snapshot?.graphicsRevision ?? 0,
      ...(graphicType ? { type: graphicType } : {})
    });
  }

  const visibleGraphics = snapshot
    ? [
        ...(snapshot.graphics.scorebug ? ["Marcador"] : []),
        ...(snapshot.graphics.lowerThird ? ["Rótulo inferior"] : [])
      ]
    : [];

  return (
    <main>
      <header>
        <h1>StreamCtrl</h1>
        <p role="status">{connected ? "Conectado" : "Desconectado"}</p>
      </header>
      {!snapshot ? (
        <MatchSetup onCreate={(value) => void createMatch(value)} />
      ) : (
        <>
          <MatchControls
            awayName={snapshot.teams[1].shortName}
            awayScore={snapshot.teams[1].score}
            clockMode={snapshot.match.clock.mode}
            clockText={formatClock(snapshot)}
            homeName={snapshot.teams[0].shortName}
            homeScore={snapshot.teams[0].score}
            onClock={(action) => void sendMatch(`clock.${action}`)}
            onClose={() => void sendMatch("match.close")}
            onPeriod={(period: Period) => void sendMatch("match.periodSet", { period })}
            onScore={(home, away) => void sendMatch("match.scoreSet", { home, away })}
            onUndo={() => void sendMatch("match.undo")}
            period={snapshot.match.currentPeriod}
          />
          <GraphicsWorkspace
            graphics={snapshot.graphics}
            onAllHide={() => graphicsMutation("graphics.allHide")}
            onHide={(type) => graphicsMutation("graphics.cueHide", type)}
            onPreview={preview}
            onTake={(type) => graphicsMutation("graphics.cueTake", type)}
          />
          <StatusAndHistory
            clockRunning={snapshot.match.clock.mode === "running"}
            connected={connected}
            history={[
              {
                id: acknowledgement?.commandId ?? "initial",
                label: acknowledgement
                  ? acknowledgement.accepted
                    ? "Última acción"
                    : acknowledgement.message
                  : "Estado restaurado",
                result: acknowledgement?.accepted === false ? "rejected" : "accepted",
                revision: snapshot.matchRevision
              }
            ]}
            revision={snapshot.matchRevision}
            visibleGraphics={visibleGraphics}
          />
        </>
      )}
      <BackupTools />
    </main>
  );
}
