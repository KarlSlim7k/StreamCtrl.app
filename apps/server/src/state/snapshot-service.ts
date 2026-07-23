import { StateSnapshotSchema, type StateSnapshot } from "@streamctrl/contracts";
import type { MatchAggregate } from "@streamctrl/core";
import type { GraphicsRepository, MatchRepository } from "@streamctrl/database";

export class SnapshotService {
  constructor(
    private readonly repository: MatchRepository,
    private readonly graphicsRepository?: GraphicsRepository
  ) {}

  restore(matchId: string): StateSnapshot | null {
    const projection = this.repository.getProjection(matchId);
    return projection ? this.toSnapshot(projection.state as MatchAggregate) : null;
  }

  restoreLatest(): StateSnapshot | null {
    const projection = this.repository.getLatestProjection();
    return projection ? this.toSnapshot(projection.state as MatchAggregate) : null;
  }

  private toSnapshot(aggregate: MatchAggregate): StateSnapshot {
    const generatedAt = new Date().toISOString();
    const graphics = this.graphicsRepository?.getState(generatedAt) ?? {
      programRevision: 0,
      scorebug: null,
      lowerThird: null,
      updatedAt: generatedAt
    };
    return StateSnapshotSchema.parse({
      protocolVersion: 1,
      matchRevision: aggregate.match.revision,
      graphicsRevision: graphics.programRevision,
      match: aggregate.match,
      teams: aggregate.teams,
      graphics,
      generatedAt
    });
  }
}
