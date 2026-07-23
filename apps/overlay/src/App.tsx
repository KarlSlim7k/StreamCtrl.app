import { useEffect, useMemo, useState } from "react";

import type { StateSnapshot } from "@streamctrl/contracts";

import { OverlayRealtimeClient } from "./realtime/client.js";
import { PreviewRoute, ProgramRoute } from "./routes.js";

function elapsedMs(snapshot: StateSnapshot): number {
  const clock = snapshot.match.clock;
  const delta =
    clock.mode === "running" ? Math.max(0, Date.now() - Date.parse(clock.lastSyncedAt)) : 0;
  return Math.max(0, clock.accumulatedMs + clock.displayOffsetMs + delta);
}

export function App() {
  const preview = window.location.pathname.includes("/preview");
  const [snapshot, setSnapshot] = useState<StateSnapshot | null>(null);
  const [, setConnected] = useState(false);
  const [, tick] = useState(0);
  const client = useMemo(
    () =>
      new OverlayRealtimeClient({
        role: preview ? "overlay-preview" : "overlay-program",
        serverUrl: import.meta.env.VITE_STREAMCTRL_SERVER_URL as string | undefined,
        sessionId: localStorage.getItem("streamctrl.sessionId") ?? "streamctrl-operator",
        mode: "production",
        onSnapshot: setSnapshot,
        onConnection: setConnected
      }),
    [preview]
  );

  useEffect(() => {
    client.connect();
    return () => client.disconnect();
  }, [client]);

  useEffect(() => {
    if (snapshot?.match.clock.mode !== "running") return;
    const timer = window.setInterval(() => tick((value) => value + 1), 250);
    return () => window.clearInterval(timer);
  }, [snapshot?.match.clock.mode]);

  if (!snapshot) return <main className="graphics-layer" aria-hidden="true" />;

  const props = {
    graphics: snapshot.graphics,
    match: snapshot.match,
    teams: snapshot.teams,
    elapsedMs: elapsedMs(snapshot)
  };
  return preview ? <PreviewRoute {...props} /> : <ProgramRoute {...props} />;
}
