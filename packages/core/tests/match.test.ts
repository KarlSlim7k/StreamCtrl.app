import { describe, expect, it } from "vitest";

import {
  closeMatch,
  createMatch,
  setMatchPeriod,
  setScore,
  undoLastMatchTransition,
  type CreateMatchInput
} from "../src/match.js";
import { appendHistory, undoLastHistoryEntry } from "../src/history.js";

const now = "2026-07-23T18:00:00.000Z";

const input: CreateMatchInput = {
  id: "match-final",
  name: "Final",
  homeTeam: {
    id: "home",
    fullName: "Local",
    shortName: "LOC",
    primaryColor: "#112233",
    secondaryColor: "#ffffff"
  },
  awayTeam: {
    id: "away",
    fullName: "Visitante",
    shortName: "VIS",
    primaryColor: "#334455",
    secondaryColor: "#ffffff"
  }
};

describe("match aggregate", () => {
  it("creates a match with regulation defaults and distinct teams", () => {
    const aggregate = createMatch(input, now);

    expect(aggregate.match.revision).toBe(0);
    expect(aggregate.match.format).toMatchObject({
      regulationPeriods: 2,
      regulationMinutes: 45,
      extraTimeEnabled: true,
      penaltiesEnabled: true
    });
    expect(aggregate.teams.map((team) => team.score)).toEqual([0, 0]);
  });

  it("sets and corrects score without mutating earlier states", () => {
    const initial = createMatch(input, now);
    const scored = setScore(initial, { home: 2, away: 1 }, 0, now);
    const corrected = setScore(scored.aggregate, { home: 1, away: 1 }, 1, now);

    expect(initial.teams[0].score).toBe(0);
    expect(scored.aggregate.teams.map((team) => team.score)).toEqual([2, 1]);
    expect(corrected.aggregate.teams.map((team) => team.score)).toEqual([1, 1]);
    expect(corrected.event.kind).toBe("correction");
    expect(corrected.aggregate.match.revision).toBe(2);
  });

  it("enforces expected revision and enabled phases", () => {
    const initial = createMatch(
      {
        ...input,
        format: {
          regulationPeriods: 2,
          regulationMinutes: 45,
          extraTimeEnabled: false,
          extraTimePeriods: 0,
          extraTimeMinutes: 0,
          penaltiesEnabled: false
        }
      },
      now
    );

    expect(() => setScore(initial, { home: 1, away: 0 }, 2, now)).toThrow("Revision conflict");
    expect(() => setMatchPeriod(initial, "extraTimeFirst", 0, now)).toThrow(
      "Extra time is disabled"
    );
  });

  it("appends compensating history entries instead of deleting history", () => {
    const first = appendHistory([], {
      id: "event-1",
      kind: "score",
      before: { home: 0, away: 0 },
      after: { home: 1, away: 0 },
      revision: 1,
      occurredAt: now
    });
    const undone = undoLastHistoryEntry(first, {
      id: "event-2",
      revision: 2,
      occurredAt: now
    });

    expect(undone).toHaveLength(2);
    expect(undone[0]?.kind).toBe("score");
    expect(undone[1]).toMatchObject({
      kind: "undo",
      before: { home: 1, away: 0 },
      after: { home: 0, away: 0 },
      supersedesEventId: "event-1"
    });
  });

  it("closes a match and undoes the latest score without deleting history", () => {
    const initial = createMatch(input, now);
    const scored = setScore(initial, { home: 1, away: 0 }, 0, now);
    const aggregate = {
      ...scored.aggregate,
      history: [
        {
          id: "score-1",
          kind: "score" as const,
          before: scored.event.before,
          after: scored.event.after,
          revision: 1,
          occurredAt: now
        }
      ]
    };
    const undone = undoLastMatchTransition(aggregate, 1, now);
    const closed = closeMatch(undone.aggregate, 2, now);

    expect(undone.aggregate.teams.map((team) => team.score)).toEqual([0, 0]);
    expect(undone.event).toMatchObject({ kind: "undo", supersedesEventId: "score-1" });
    expect(closed.aggregate.match).toMatchObject({
      revision: 3,
      status: "finished",
      currentPeriod: "fullTime"
    });
  });
});
