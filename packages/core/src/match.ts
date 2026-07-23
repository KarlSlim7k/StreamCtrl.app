import {
  MatchFormatSchema,
  MatchSchema,
  TeamSchema,
  type Match,
  type MatchFormat,
  type Period,
  type Team
} from "@streamctrl/contracts";

import { createClock } from "./clock.js";
import type { HistoryEntry, HistoryKind } from "./history.js";

export interface TeamInput {
  id: string;
  fullName: string;
  shortName: string;
  primaryColor: string;
  secondaryColor: string;
}

export interface CreateMatchInput {
  id: string;
  name: string;
  homeTeam: TeamInput;
  awayTeam: TeamInput;
  format?: MatchFormat;
}

export interface MatchAggregate {
  match: Match;
  teams: readonly [Team, Team];
  history: readonly HistoryEntry[];
}

export interface MatchTransition {
  aggregate: MatchAggregate;
  event: {
    kind: HistoryKind;
    before: unknown;
    after: unknown;
    supersedesEventId?: string;
  };
}

export class MatchTransitionError extends Error {
  constructor(
    message: string,
    readonly code: "REVISION_CONFLICT" | "INVALID_TRANSITION"
  ) {
    super(message);
    this.name = "MatchTransitionError";
  }
}

function assertRevision(aggregate: MatchAggregate, expectedRevision: number): void {
  if (aggregate.match.revision !== expectedRevision) {
    throw new MatchTransitionError(
      `Revision conflict: expected ${expectedRevision}, current ${aggregate.match.revision}`,
      "REVISION_CONFLICT"
    );
  }
}

export function createMatch(input: CreateMatchInput, occurredAt: string): MatchAggregate {
  if (input.homeTeam.id === input.awayTeam.id) {
    throw new MatchTransitionError("Home and away teams must be distinct", "INVALID_TRANSITION");
  }

  const format = MatchFormatSchema.parse(
    input.format ?? {
      regulationPeriods: 2,
      regulationMinutes: 45,
      extraTimeEnabled: true,
      extraTimePeriods: 2,
      extraTimeMinutes: 15,
      penaltiesEnabled: true
    }
  );
  const homeTeam = TeamSchema.parse({
    ...input.homeTeam,
    score: 0,
    penaltyScore: 0
  });
  const awayTeam = TeamSchema.parse({
    ...input.awayTeam,
    score: 0,
    penaltyScore: 0
  });
  const match = MatchSchema.parse({
    id: input.id,
    name: input.name,
    status: "ready",
    homeTeamId: homeTeam.id,
    awayTeamId: awayTeam.id,
    currentPeriod: "preMatch",
    format,
    clock: createClock(occurredAt),
    revision: 0,
    createdAt: occurredAt,
    updatedAt: occurredAt
  });

  return { match, teams: [homeTeam, awayTeam], history: [] };
}

export function withMatchUpdate(
  aggregate: MatchAggregate,
  expectedRevision: number,
  occurredAt: string,
  kind: HistoryKind,
  update: (match: Match) => Match
): MatchTransition {
  assertRevision(aggregate, expectedRevision);
  const before = aggregate.match;
  const after = MatchSchema.parse({
    ...update(before),
    revision: expectedRevision + 1,
    updatedAt: occurredAt
  });

  return {
    aggregate: { ...aggregate, match: after },
    event: { kind, before, after }
  };
}

export function setScore(
  aggregate: MatchAggregate,
  score: { home: number; away: number },
  expectedRevision: number,
  occurredAt: string
): MatchTransition {
  assertRevision(aggregate, expectedRevision);
  if (
    !Number.isSafeInteger(score.home) ||
    !Number.isSafeInteger(score.away) ||
    score.home < 0 ||
    score.away < 0
  ) {
    throw new MatchTransitionError("Scores must be non-negative integers", "INVALID_TRANSITION");
  }

  const [home, away] = aggregate.teams;
  const nextHome = TeamSchema.parse({ ...home, score: score.home });
  const nextAway = TeamSchema.parse({ ...away, score: score.away });
  const correction = score.home < home.score || score.away < away.score;
  const nextMatch = MatchSchema.parse({
    ...aggregate.match,
    revision: expectedRevision + 1,
    updatedAt: occurredAt
  });

  return {
    aggregate: { ...aggregate, match: nextMatch, teams: [nextHome, nextAway] },
    event: {
      kind: correction ? "correction" : "score",
      before: { home: home.score, away: away.score },
      after: score
    }
  };
}

export function setMatchPeriod(
  aggregate: MatchAggregate,
  period: Period,
  expectedRevision: number,
  occurredAt: string
): MatchTransition {
  if (period.startsWith("extraTime") && !aggregate.match.format.extraTimeEnabled) {
    throw new MatchTransitionError("Extra time is disabled", "INVALID_TRANSITION");
  }
  if (period === "penalties" && !aggregate.match.format.penaltiesEnabled) {
    throw new MatchTransitionError("Penalties are disabled", "INVALID_TRANSITION");
  }

  return withMatchUpdate(aggregate, expectedRevision, occurredAt, "period", (match) => ({
    ...match,
    currentPeriod: period,
    status: period === "fullTime" ? "finished" : period === "preMatch" ? "ready" : "live"
  }));
}

export function closeMatch(
  aggregate: MatchAggregate,
  expectedRevision: number,
  occurredAt: string
): MatchTransition {
  return withMatchUpdate(aggregate, expectedRevision, occurredAt, "period", (match) => ({
    ...match,
    status: "finished",
    currentPeriod: "fullTime",
    clock: {
      ...match.clock,
      mode: "stopped",
      startedAtMonotonicMs: null,
      lastSyncedAt: occurredAt as never
    }
  }));
}

export function undoLastMatchTransition(
  aggregate: MatchAggregate,
  expectedRevision: number,
  occurredAt: string
): MatchTransition {
  assertRevision(aggregate, expectedRevision);
  const superseded = new Set(
    aggregate.history
      .filter((entry) => entry.kind === "undo")
      .map((entry) => entry.supersedesEventId)
      .filter((id): id is string => Boolean(id))
  );
  const target = [...aggregate.history]
    .reverse()
    .find((entry) => entry.kind !== "create" && entry.kind !== "undo" && !superseded.has(entry.id));
  if (!target) {
    throw new MatchTransitionError("There is no action to undo", "INVALID_TRANSITION");
  }

  let match = aggregate.match;
  let teams = aggregate.teams;
  if (target.kind === "score" || target.kind === "correction") {
    const before = target.before as { home: number; away: number };
    teams = [
      TeamSchema.parse({ ...teams[0], score: before.home }),
      TeamSchema.parse({ ...teams[1], score: before.away })
    ];
  } else {
    match = MatchSchema.parse({
      ...(target.before as Match),
      revision: expectedRevision + 1,
      updatedAt: occurredAt
    });
  }
  match = MatchSchema.parse({
    ...match,
    revision: expectedRevision + 1,
    updatedAt: occurredAt
  });

  return {
    aggregate: { ...aggregate, match, teams },
    event: {
      kind: "undo",
      before: { match: aggregate.match, teams: aggregate.teams },
      after: { match, teams },
      supersedesEventId: target.id
    }
  };
}
