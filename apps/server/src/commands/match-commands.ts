import { randomUUID } from "node:crypto";

import {
  PeriodSchema,
  type CommandAcknowledgement,
  type MatchClock,
  type Period
} from "@streamctrl/contracts";
import {
  correctClock,
  closeMatch,
  createMatch,
  pauseClock,
  setAddedTime,
  setMatchPeriod,
  setScore,
  startClock,
  stopClock,
  undoLastMatchTransition,
  withMatchUpdate,
  type CreateMatchInput,
  type MatchAggregate,
  type MatchTransition
} from "@streamctrl/core";
import { RevisionConflictError } from "@streamctrl/database";
import type { MatchRepository, StoredCommandReceipt } from "@streamctrl/database";

export interface CommandContext {
  commandId: string;
  operatorSessionId: string;
}

export interface MatchMutationContext extends CommandContext {
  matchId: string;
  expectedRevision: number;
}

interface ServiceOptions {
  now?: () => string;
  monotonicNow?: () => number;
  createId?: () => string;
}

function receiptToAcknowledgement(receipt: StoredCommandReceipt): CommandAcknowledgement {
  return receipt.accepted
    ? {
        accepted: true,
        commandId: receipt.commandId as never,
        resultingRevision: receipt.resultingRevision ?? 0
      }
    : {
        accepted: false,
        commandId: receipt.commandId as never,
        errorCode: (receipt.errorCode ?? "PERSISTENCE_FAILED") as never,
        message: receipt.errorCode ?? "Command rejected",
        currentRevision: null
      };
}

export class MatchCommandService {
  readonly #now: () => string;
  readonly #monotonicNow: () => number;
  readonly #createId: () => string;

  constructor(
    private readonly repository: MatchRepository,
    options: ServiceOptions = {}
  ) {
    this.#now = options.now ?? (() => new Date().toISOString());
    this.#monotonicNow = options.monotonicNow ?? (() => performance.now());
    this.#createId = options.createId ?? randomUUID;
  }

  load(matchId: string): MatchAggregate | null {
    const projection = this.repository.getProjection(matchId);
    return projection ? (projection.state as MatchAggregate) : null;
  }

  create(command: CommandContext & { match: CreateMatchInput }): CommandAcknowledgement {
    const duplicate = this.repository.findReceipt(command.commandId);
    if (duplicate) {
      return receiptToAcknowledgement(duplicate);
    }

    const occurredAt = this.#now();
    const initial = createMatch(command.match, occurredAt);
    const aggregate: MatchAggregate = {
      ...initial,
      match: { ...initial.match, revision: 1, updatedAt: occurredAt },
      history: [
        {
          id: this.#createId(),
          kind: "create",
          before: null,
          after: initial.match,
          revision: 1,
          occurredAt
        }
      ]
    };

    return this.persist(command, aggregate, {
      kind: "create",
      before: null,
      after: aggregate.match
    });
  }

  setScore(command: MatchMutationContext & { home: number; away: number }): CommandAcknowledgement {
    return this.apply(command, "match.scoreSet", (aggregate, occurredAt) =>
      setScore(
        aggregate,
        { home: command.home, away: command.away },
        command.expectedRevision,
        occurredAt
      )
    );
  }

  setPeriod(command: MatchMutationContext & { period: Period | string }): CommandAcknowledgement {
    const period = PeriodSchema.parse(command.period);
    return this.apply(command, "match.periodSet", (aggregate, occurredAt) =>
      setMatchPeriod(aggregate, period, command.expectedRevision, occurredAt)
    );
  }

  close(command: MatchMutationContext): CommandAcknowledgement {
    return this.apply(command, "match.close", (aggregate, occurredAt) =>
      closeMatch(aggregate, command.expectedRevision, occurredAt)
    );
  }

  undo(command: MatchMutationContext): CommandAcknowledgement {
    return this.apply(command, "match.undo", (aggregate, occurredAt) =>
      undoLastMatchTransition(aggregate, command.expectedRevision, occurredAt)
    );
  }

  startClock(command: MatchMutationContext): CommandAcknowledgement {
    return this.updateClock(command, "clock.start", (clock, occurredAt) =>
      startClock(clock, this.#monotonicNow(), occurredAt)
    );
  }

  pauseClock(command: MatchMutationContext): CommandAcknowledgement {
    return this.updateClock(command, "clock.pause", (clock, occurredAt) =>
      pauseClock(clock, this.#monotonicNow(), occurredAt)
    );
  }

  stopClock(command: MatchMutationContext): CommandAcknowledgement {
    return this.updateClock(command, "clock.stop", (clock, occurredAt) =>
      stopClock(clock, this.#monotonicNow(), occurredAt)
    );
  }

  correctClock(command: MatchMutationContext & { elapsedMs: number }): CommandAcknowledgement {
    return this.updateClock(command, "clock.correct", (clock, occurredAt) =>
      correctClock(clock, command.elapsedMs, this.#monotonicNow(), occurredAt)
    );
  }

  setAddedTime(command: MatchMutationContext & { minutes: number }): CommandAcknowledgement {
    return this.updateClock(command, "clock.addedTimeSet", (clock, occurredAt) =>
      setAddedTime(clock, command.minutes, occurredAt)
    );
  }

  private updateClock(
    command: MatchMutationContext,
    commandType: string,
    update: (clock: MatchClock, occurredAt: string) => MatchClock
  ): CommandAcknowledgement {
    return this.apply(command, commandType, (aggregate, occurredAt) =>
      withMatchUpdate(aggregate, command.expectedRevision, occurredAt, "clock", (match) => ({
        ...match,
        clock: update(match.clock, occurredAt)
      }))
    );
  }

  private apply(
    command: MatchMutationContext,
    commandType: string,
    transition: (aggregate: MatchAggregate, occurredAt: string) => MatchTransition
  ): CommandAcknowledgement {
    const duplicate = this.repository.findReceipt(command.commandId);
    if (duplicate) {
      return receiptToAcknowledgement(duplicate);
    }

    const aggregate = this.load(command.matchId);
    if (!aggregate) {
      return this.reject(command, commandType, "MATCH_NOT_FOUND", null);
    }

    const occurredAt = this.#now();
    try {
      const result = transition(aggregate, occurredAt);
      const eventId = this.#createId();
      const next: MatchAggregate = {
        ...result.aggregate,
        history: [
          ...result.aggregate.history,
          {
            id: eventId,
            kind: result.event.kind,
            before: result.event.before,
            after: result.event.after,
            revision: result.aggregate.match.revision,
            occurredAt,
            ...("supersedesEventId" in result.event &&
            typeof result.event.supersedesEventId === "string"
              ? { supersedesEventId: result.event.supersedesEventId }
              : {})
          }
        ]
      };
      return this.persist(
        {
          commandId: command.commandId,
          operatorSessionId: command.operatorSessionId
        },
        next,
        result.event,
        commandType,
        eventId
      );
    } catch (error) {
      const code =
        error instanceof RevisionConflictError ||
        (error instanceof Error && error.message.includes("Revision conflict"))
          ? "REVISION_CONFLICT"
          : "INVALID_TRANSITION";
      return this.reject(command, commandType, code, aggregate.match.revision);
    }
  }

  private persist(
    command: CommandContext & { match?: CreateMatchInput },
    aggregate: MatchAggregate,
    event: { kind: string; before: unknown; after: unknown; supersedesEventId?: string },
    commandType = "match.create",
    eventId = this.#createId()
  ): CommandAcknowledgement {
    try {
      const receipt = this.repository.commitAccepted({
        commandId: command.commandId,
        matchId: aggregate.match.id,
        commandType,
        operatorSessionId: command.operatorSessionId,
        expectedRevision: aggregate.match.revision - 1,
        eventId,
        eventKind: event.kind,
        eventPayload: event,
        occurredAt: aggregate.match.updatedAt,
        projection: aggregate,
        ...(event.supersedesEventId ? { supersedesEventId: event.supersedesEventId } : {})
      });
      return receiptToAcknowledgement(receipt);
    } catch {
      return this.reject(
        {
          commandId: command.commandId,
          operatorSessionId: command.operatorSessionId,
          matchId: aggregate.match.id
        },
        commandType,
        "PERSISTENCE_FAILED",
        aggregate.match.revision - 1
      );
    }
  }

  private reject(
    command: CommandContext & { matchId?: string },
    commandType: string,
    errorCode:
      "MATCH_NOT_FOUND" | "REVISION_CONFLICT" | "INVALID_TRANSITION" | "PERSISTENCE_FAILED",
    currentRevision: number | null
  ): CommandAcknowledgement {
    const receipt = this.repository.recordRejected({
      commandId: command.commandId,
      matchId: command.matchId ?? null,
      commandType,
      operatorSessionId: command.operatorSessionId,
      errorCode,
      receivedAt: this.#now()
    });
    return {
      accepted: false,
      commandId: receipt.commandId as never,
      errorCode,
      message: errorCode.replaceAll("_", " ").toLowerCase(),
      currentRevision
    };
  }
}
