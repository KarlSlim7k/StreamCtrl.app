import { describe, expect, it, vi } from "vitest";

import { VmixHttpAdapter } from "../src/vmix-http.js";

describe("vMix HTTP adapter isolation", () => {
  it("returns a bounded failure instead of throwing into official match flow", async () => {
    const adapter = new VmixHttpAdapter({
      enabled: true,
      baseUrl: "http://127.0.0.1:8088/api/",
      timeoutMs: 50,
      fetch: vi.fn().mockRejectedValue(new Error("offline"))
    });

    await expect(adapter.execute("OverlayInput1In")).resolves.toMatchObject({
      ok: false,
      code: "VMIX_UNAVAILABLE"
    });
  });

  it("opens the circuit after repeated failures and retries after cooldown", async () => {
    let now = 0;
    const fetch = vi.fn().mockRejectedValue(new Error("offline"));
    const adapter = new VmixHttpAdapter({
      enabled: true,
      baseUrl: "http://127.0.0.1:8088/api/",
      failureThreshold: 2,
      cooldownMs: 1_000,
      now: () => now,
      fetch
    });

    await adapter.execute("A");
    await adapter.execute("B");
    expect((await adapter.execute("C")).code).toBe("CIRCUIT_OPEN");
    expect(fetch).toHaveBeenCalledTimes(2);

    now = 1_001;
    await adapter.execute("D");
    expect(fetch).toHaveBeenCalledTimes(3);
  });
});
