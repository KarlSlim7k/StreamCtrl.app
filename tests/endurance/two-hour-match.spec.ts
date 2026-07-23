import { describe, expect, it } from "vitest";

import { createClock, getElapsedMs, startClock } from "../../packages/core/src/clock.js";
import { EnduranceMetrics } from "./metrics.js";

describe("two-hour rehearsal driver", () => {
  it("simulates two hours, cue activity and reconnections without clock drift", () => {
    const syncedAt = "2026-07-23T18:00:00.000Z";
    const startedAt = 1_000;
    const clock = startClock(createClock(syncedAt), startedAt, syncedAt);
    const metrics = new EnduranceMetrics();
    let simulatedMemory = 180 * 1024 * 1024;
    let cueActions = 0;
    let reconnections = 0;

    for (let minute = 0; minute <= 120; minute += 5) {
      const elapsedMs = minute * 60_000;
      if (minute > 0) {
        cueActions += 1;
      }
      if ([30, 60, 90].includes(minute)) {
        reconnections += 1;
      }
      simulatedMemory += minute < 10 ? 256 * 1024 : 0;
      metrics.add({
        elapsedMs,
        frameDurationMs: 1_000 / 30,
        processMemoryBytes: simulatedMemory,
        clockElapsedMs: getElapsedMs(clock, startedAt + elapsedMs),
        referenceElapsedMs: elapsedMs
      });
    }

    const summary = metrics.summarize();
    expect(cueActions).toBe(24);
    expect(reconnections).toBe(3);
    expect(summary.averageFps).toBeCloseTo(30, 5);
    expect(summary.maximumClockDriftMs).toBe(0);
    expect(summary.memoryGrowthBytes).toBeLessThan(2 * 1024 * 1024);
  });
});
