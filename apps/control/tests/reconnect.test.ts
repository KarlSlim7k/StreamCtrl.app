import { describe, expect, it } from "vitest";

import { ControlReconnectStateMachine } from "../src/realtime/reconnect.js";

describe("control reconnection", () => {
  it("retains pending command identities and removes them only after acknowledgement", () => {
    const reconnect = new ControlReconnectStateMachine();
    reconnect.queue({ commandId: "command-1", type: "match.scoreSet" });
    reconnect.disconnected();

    expect(reconnect.pendingForRetry()).toEqual([
      { commandId: "command-1", type: "match.scoreSet" }
    ]);

    reconnect.acknowledge("command-1");
    expect(reconnect.pendingForRetry()).toEqual([]);
  });

  it("requires a fresh snapshot after reconnecting", () => {
    const reconnect = new ControlReconnectStateMachine();
    reconnect.connected();
    reconnect.synchronized(8);
    reconnect.disconnected();
    reconnect.connected();

    expect(reconnect.state).toBe("snapshot-required");
    expect(reconnect.revision).toBeNull();
  });
});
