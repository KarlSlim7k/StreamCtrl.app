import type Database from "better-sqlite3";

export interface StoredCommandReceipt {
  commandId: string;
  matchId: string | null;
  type: string;
  accepted: boolean;
  errorCode: string | null;
  resultingRevision: number | null;
  receivedAt: string;
  operatorSessionId: string;
  duplicate: boolean;
}

interface ReceiptRow {
  command_id: string;
  match_id: string | null;
  type: string;
  accepted: 0 | 1;
  error_code: string | null;
  resulting_revision: number | null;
  received_at: string;
  operator_session_id: string;
}

export interface AcceptedTransition {
  commandId: string;
  matchId: string;
  commandType: string;
  operatorSessionId: string;
  expectedRevision: number;
  eventId: string;
  eventKind: string;
  eventPayload: unknown;
  occurredAt: string;
  projection: unknown;
}

export interface RejectedCommand {
  commandId: string;
  matchId: string | null;
  commandType: string;
  operatorSessionId: string;
  errorCode: string;
  receivedAt: string;
}

export class RevisionConflictError extends Error {
  constructor(
    readonly expectedRevision: number,
    readonly currentRevision: number
  ) {
    super(`Expected revision ${expectedRevision}, current revision is ${currentRevision}`);
    this.name = "RevisionConflictError";
  }
}

function mapReceipt(row: ReceiptRow, duplicate: boolean): StoredCommandReceipt {
  return {
    commandId: row.command_id,
    matchId: row.match_id,
    type: row.type,
    accepted: row.accepted === 1,
    errorCode: row.error_code,
    resultingRevision: row.resulting_revision,
    receivedAt: row.received_at,
    operatorSessionId: row.operator_session_id,
    duplicate
  };
}

export class MatchRepository {
  readonly #findReceipt;
  readonly #findRevision;
  readonly #insertReceipt;
  readonly #insertEvent;
  readonly #upsertProjection;
  readonly #commitAccepted;
  readonly #recordRejected;

  constructor(private readonly database: Database.Database) {
    this.#findReceipt = database.prepare("SELECT * FROM command_receipts WHERE command_id = ?");
    this.#findRevision = database.prepare("SELECT revision FROM matches WHERE id = ?");
    this.#insertReceipt = database.prepare(`
      INSERT INTO command_receipts (
        command_id,
        match_id,
        type,
        accepted,
        error_code,
        resulting_revision,
        received_at,
        operator_session_id
      ) VALUES (
        @commandId,
        @matchId,
        @type,
        @accepted,
        @errorCode,
        @resultingRevision,
        @receivedAt,
        @operatorSessionId
      )
    `);
    this.#insertEvent = database.prepare(`
      INSERT INTO match_events (
        id,
        match_id,
        kind,
        payload_json,
        revision,
        occurred_at,
        supersedes_event_id
      ) VALUES (
        @eventId,
        @matchId,
        @kind,
        @payloadJson,
        @revision,
        @occurredAt,
        @supersedesEventId
      )
    `);
    this.#upsertProjection = database.prepare(`
      INSERT INTO matches (id, state_json, revision, updated_at)
      VALUES (@matchId, @stateJson, @revision, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        state_json = excluded.state_json,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    `);

    this.#commitAccepted = database.transaction(
      (transition: AcceptedTransition): StoredCommandReceipt => {
        const existing = this.findReceipt(transition.commandId);
        if (existing) {
          return { ...existing, duplicate: true };
        }

        const revisionRow = this.#findRevision.get(transition.matchId) as
          { revision: number } | undefined;
        const currentRevision = revisionRow?.revision ?? 0;
        if (currentRevision !== transition.expectedRevision) {
          throw new RevisionConflictError(transition.expectedRevision, currentRevision);
        }

        const resultingRevision = currentRevision + 1;
        const stateJson = JSON.stringify(transition.projection);
        const payloadJson = JSON.stringify(transition.eventPayload);

        this.#upsertProjection.run({
          matchId: transition.matchId,
          stateJson,
          revision: resultingRevision,
          updatedAt: transition.occurredAt
        });
        this.#insertEvent.run({
          eventId: transition.eventId,
          matchId: transition.matchId,
          kind: transition.eventKind,
          payloadJson,
          revision: resultingRevision,
          occurredAt: transition.occurredAt,
          supersedesEventId: null
        });
        this.#insertReceipt.run({
          commandId: transition.commandId,
          matchId: transition.matchId,
          type: transition.commandType,
          accepted: 1,
          errorCode: null,
          resultingRevision,
          receivedAt: transition.occurredAt,
          operatorSessionId: transition.operatorSessionId
        });

        const receipt = this.findReceipt(transition.commandId);
        if (!receipt) {
          throw new Error("Accepted command receipt was not persisted");
        }
        return receipt;
      }
    );

    this.#recordRejected = database.transaction(
      (command: RejectedCommand): StoredCommandReceipt => {
        const existing = this.findReceipt(command.commandId);
        if (existing) {
          return { ...existing, duplicate: true };
        }

        this.#insertReceipt.run({
          commandId: command.commandId,
          matchId: command.matchId,
          type: command.commandType,
          accepted: 0,
          errorCode: command.errorCode,
          resultingRevision: null,
          receivedAt: command.receivedAt,
          operatorSessionId: command.operatorSessionId
        });

        const receipt = this.findReceipt(command.commandId);
        if (!receipt) {
          throw new Error("Rejected command receipt was not persisted");
        }
        return receipt;
      }
    );
  }

  findReceipt(commandId: string): StoredCommandReceipt | null {
    const row = this.#findReceipt.get(commandId) as ReceiptRow | undefined;
    return row ? mapReceipt(row, false) : null;
  }

  commitAccepted(transition: AcceptedTransition): StoredCommandReceipt {
    return this.#commitAccepted(transition);
  }

  recordRejected(command: RejectedCommand): StoredCommandReceipt {
    return this.#recordRejected(command);
  }

  getProjection(matchId: string): { revision: number; state: unknown } | null {
    const row = this.database
      .prepare("SELECT state_json, revision FROM matches WHERE id = ?")
      .get(matchId) as { state_json: string; revision: number } | undefined;

    return row ? { revision: row.revision, state: JSON.parse(row.state_json) as unknown } : null;
  }
}
