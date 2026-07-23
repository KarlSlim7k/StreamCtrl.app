import { MatchClockSchema, type MatchClock } from "@streamctrl/contracts";

export class ClockTransitionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ClockTransitionError";
  }
}

export function createClock(syncedAt: string): MatchClock {
  return MatchClockSchema.parse({
    mode: "stopped",
    accumulatedMs: 0,
    startedAtMonotonicMs: null,
    displayOffsetMs: 0,
    addedTimeMinutes: 0,
    lastSyncedAt: syncedAt
  });
}

export function getElapsedMs(clock: MatchClock, monotonicNowMs: number): number {
  const runningDelta =
    clock.mode === "running" && clock.startedAtMonotonicMs !== null
      ? Math.max(0, monotonicNowMs - clock.startedAtMonotonicMs)
      : 0;
  return Math.max(0, clock.accumulatedMs + runningDelta + clock.displayOffsetMs);
}

export function startClock(
  clock: MatchClock,
  monotonicNowMs: number,
  syncedAt: string
): MatchClock {
  if (clock.mode === "running") {
    throw new ClockTransitionError("Clock is already running");
  }

  return MatchClockSchema.parse({
    ...clock,
    mode: "running",
    startedAtMonotonicMs: monotonicNowMs,
    lastSyncedAt: syncedAt
  });
}

export function pauseClock(
  clock: MatchClock,
  monotonicNowMs: number,
  syncedAt: string
): MatchClock {
  if (clock.mode !== "running" || clock.startedAtMonotonicMs === null) {
    throw new ClockTransitionError("Clock is not running");
  }

  return MatchClockSchema.parse({
    ...clock,
    mode: "paused",
    accumulatedMs: getElapsedMs(clock, monotonicNowMs),
    startedAtMonotonicMs: null,
    displayOffsetMs: 0,
    lastSyncedAt: syncedAt
  });
}

export function stopClock(clock: MatchClock, monotonicNowMs: number, syncedAt: string): MatchClock {
  return MatchClockSchema.parse({
    ...clock,
    mode: "stopped",
    accumulatedMs: getElapsedMs(clock, monotonicNowMs),
    startedAtMonotonicMs: null,
    displayOffsetMs: 0,
    lastSyncedAt: syncedAt
  });
}

export function correctClock(
  clock: MatchClock,
  elapsedMs: number,
  monotonicNowMs: number,
  syncedAt: string
): MatchClock {
  if (!Number.isSafeInteger(elapsedMs) || elapsedMs < 0) {
    throw new ClockTransitionError("Corrected clock value must be a non-negative integer");
  }

  return MatchClockSchema.parse({
    ...clock,
    accumulatedMs: elapsedMs,
    startedAtMonotonicMs: clock.mode === "running" ? monotonicNowMs : null,
    displayOffsetMs: 0,
    lastSyncedAt: syncedAt
  });
}

export function setAddedTime(clock: MatchClock, minutes: number, syncedAt: string): MatchClock {
  if (!Number.isSafeInteger(minutes) || minutes < 0) {
    throw new ClockTransitionError("Added time must be a non-negative integer");
  }

  return MatchClockSchema.parse({
    ...clock,
    addedTimeMinutes: minutes,
    lastSyncedAt: syncedAt
  });
}
