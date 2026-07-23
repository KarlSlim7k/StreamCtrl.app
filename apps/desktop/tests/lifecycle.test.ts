import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { DesktopLifecycle } from "../src/lifecycle.js";

describe("desktop lifecycle", () => {
  it("detects an unclean prior run and removes its marker on clean shutdown", () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-lifecycle-"));
    const markerPath = join(directory, "runtime", "crash-marker.json");
    const first = new DesktopLifecycle({
      markerPath,
      logDirectory: join(directory, "logs"),
      version: "0.1.0",
      now: () => new Date("2026-07-23T18:00:00.000Z")
    });
    expect(first.begin()).toBeNull();
    expect(existsSync(markerPath)).toBe(true);

    const second = new DesktopLifecycle({
      markerPath,
      logDirectory: join(directory, "logs"),
      version: "0.1.0"
    });
    expect(second.begin()).toMatchObject({
      version: "0.1.0",
      startedAt: "2026-07-23T18:00:00.000Z"
    });
    second.completeCleanShutdown();
    expect(existsSync(markerPath)).toBe(false);
  });

  it("exports only operational log files", () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-logs-"));
    const logs = join(directory, "logs");
    const destination = join(directory, "export");
    const lifecycle = new DesktopLifecycle({
      markerPath: join(directory, "marker.json"),
      logDirectory: logs,
      version: "0.1.0"
    });

    lifecycle.begin();
    mkdirSync(logs, { recursive: true });
    writeFileSync(join(logs, "streamctrl.log"), "ready");
    writeFileSync(join(logs, "notes.txt"), "not a log");

    expect(lifecycle.exportLogs(destination)).toEqual([join(destination, "streamctrl.log")]);
    expect(existsSync(join(destination, "notes.txt"))).toBe(false);
  });
});
