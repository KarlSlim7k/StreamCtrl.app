import { Writable } from "node:stream";

import { describe, expect, it } from "vitest";

import { readHealth } from "../src/http/health.js";
import { createLogger } from "../src/logging.js";
import { ProductionLeaseManager } from "../src/sessions/production-lease.js";

describe("server foundation", () => {
  it("reports degraded health when an enabled vMix adapter is disconnected", async () => {
    await expect(
      readHealth(
        {
          version: "0.1.0",
          startedAtMs: 1_000,
          databaseHealth: () => "ok",
          vmixHealth: () => "disconnected"
        },
        1_250
      )
    ).resolves.toEqual({
      status: "degraded",
      version: "0.1.0",
      uptimeMs: 250,
      database: "ok",
      vmix: "disconnected"
    });
  });

  it("redacts credentials from structured logs", async () => {
    let output = "";
    const destination = new Writable({
      write(chunk, _encoding, callback) {
        output += chunk.toString();
        callback();
      }
    });
    const logger = createLogger({
      directory: "unused",
      level: "info",
      destination
    });

    logger.info({ password: "secret", token: "token-value" }, "credential test");
    await new Promise((resolve) => destination.end(resolve));

    expect(output).not.toContain("secret");
    expect(output).not.toContain("token-value");
    expect(output).toContain("[REDACTED]");
  });

  it("allows one production writer while keeping rehearsal isolated", () => {
    const leases = new ProductionLeaseManager(1_000);

    expect(leases.open({ sessionId: "operator-1", mode: "production" }, 0).canWrite).toBe(true);
    expect(leases.open({ sessionId: "operator-2", mode: "production" }, 100).canWrite).toBe(false);
    expect(leases.open({ sessionId: "rehearsal-1", mode: "rehearsal" }, 100)).toMatchObject({
      canWrite: true,
      stateNamespace: "rehearsal:rehearsal-1"
    });
    expect(leases.open({ sessionId: "operator-2", mode: "production" }, 1_001).canWrite).toBe(true);
  });
});
