import { describe, expect, it } from "vitest";

import {
  CommandEnvelopeSchema,
  GraphicCueSchema,
  MatchSchema,
  StateSnapshotSchema,
  parseEnvironment
} from "../src/index.js";

const now = "2026-07-23T18:00:00.000Z";

const homeTeam = {
  id: "team-home",
  fullName: "Club Local",
  shortName: "LOC",
  primaryColor: "#112233",
  secondaryColor: "#ffffff",
  score: 0,
  penaltyScore: 0
};

const awayTeam = {
  ...homeTeam,
  id: "team-away",
  fullName: "Club Visitante",
  shortName: "VIS",
  primaryColor: "#334455"
};

const match = {
  id: "match-1",
  name: "Final",
  status: "ready",
  homeTeamId: homeTeam.id,
  awayTeamId: awayTeam.id,
  currentPeriod: "preMatch",
  format: {
    regulationPeriods: 2,
    regulationMinutes: 45,
    extraTimeEnabled: true,
    extraTimePeriods: 2,
    extraTimeMinutes: 15,
    penaltiesEnabled: true
  },
  clock: {
    mode: "stopped",
    accumulatedMs: 0,
    startedAtMonotonicMs: null,
    displayOffsetMs: 0,
    addedTimeMinutes: 0,
    lastSyncedAt: now
  },
  revision: 0,
  createdAt: now,
  updatedAt: now
};

describe("runtime contracts", () => {
  it("parses a valid command and rejects unsupported protocol versions", () => {
    const command = {
      protocolVersion: 1,
      messageId: "message-1",
      type: "match.scoreSet",
      sentAt: now,
      payload: {
        commandId: "command-1",
        matchId: match.id,
        expectedRevision: 0,
        home: 1,
        away: 0
      }
    };

    expect(CommandEnvelopeSchema.parse(command).type).toBe("match.scoreSet");
    expect(() => CommandEnvelopeSchema.parse({ ...command, protocolVersion: 2 })).toThrow();
  });

  it("rejects a match whose team references are not distinct", () => {
    expect(() => MatchSchema.parse({ ...match, awayTeamId: homeTeam.id })).toThrow(
      "Home and away teams must be distinct"
    );
  });

  it("rejects an incomplete lower third", () => {
    expect(() =>
      GraphicCueSchema.parse({
        cueId: "cue-1",
        type: "lowerThird",
        action: "take",
        payload: { primaryText: "Ana Pérez", secondaryText: "" },
        layer: 20,
        requestedAt: now
      })
    ).toThrow();
  });

  it("parses a complete, internally consistent state snapshot", () => {
    const snapshot = StateSnapshotSchema.parse({
      protocolVersion: 1,
      matchRevision: 0,
      graphicsRevision: 0,
      match,
      teams: [homeTeam, awayTeam],
      graphics: {
        programRevision: 0,
        scorebug: null,
        lowerThird: null,
        updatedAt: now
      },
      generatedAt: now
    });

    expect(snapshot.teams).toHaveLength(2);
  });

  it("keeps every network-facing endpoint on loopback", () => {
    expect(parseEnvironment({}).STREAMCTRL_HOST).toBe("127.0.0.1");
    expect(() =>
      parseEnvironment({
        STREAMCTRL_HOST: "0.0.0.0",
        STREAMCTRL_VMIX_BASE_URL: "http://192.168.1.10:8088/api/"
      })
    ).toThrow();
  });
});
