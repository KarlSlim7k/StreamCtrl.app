import { describe, expect, it } from "vitest";

import {
  correctClock,
  createClock,
  getElapsedMs,
  pauseClock,
  setAddedTime,
  startClock
} from "../src/clock.js";

const syncedAt = "2026-07-23T18:00:00.000Z";

describe("timestamp-based match clock", () => {
  it("starts, pauses and resumes from monotonic anchors", () => {
    const initial = createClock(syncedAt);
    const running = startClock(initial, 1_000, syncedAt);
    const paused = pauseClock(running, 11_000, syncedAt);
    const resumed = startClock(paused, 20_000, syncedAt);

    expect(getElapsedMs(running, 6_000)).toBe(5_000);
    expect(paused.accumulatedMs).toBe(10_000);
    expect(getElapsedMs(resumed, 25_000)).toBe(15_000);
  });

  it("corrects the official value and added time explicitly", () => {
    const running = startClock(createClock(syncedAt), 1_000, syncedAt);
    const corrected = correctClock(running, 65_000, 10_000, syncedAt);
    const withAddedTime = setAddedTime(corrected, 3, syncedAt);

    expect(getElapsedMs(withAddedTime, 12_000)).toBe(67_000);
    expect(withAddedTime.addedTimeMinutes).toBe(3);
  });

  it("derives two hours without interval drift", () => {
    const running = startClock(createClock(syncedAt), 100, syncedAt);
    const twoHoursLater = 100 + 2 * 60 * 60 * 1_000;

    expect(getElapsedMs(running, twoHoursLater)).toBe(7_200_000);
  });

  it("rejects duplicate start and pause transitions", () => {
    const running = startClock(createClock(syncedAt), 0, syncedAt);

    expect(() => startClock(running, 1, syncedAt)).toThrow("already running");
    expect(() => pauseClock(createClock(syncedAt), 1, syncedAt)).toThrow("not running");
  });
});
