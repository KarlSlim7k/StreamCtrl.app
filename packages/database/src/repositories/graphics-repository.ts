import type Database from "better-sqlite3";

import { GraphicsStateSchema, type GraphicsState } from "@streamctrl/contracts";

import type { StoredCommandReceipt } from "./match-repository.js";

interface GraphicsRow {
  state_json: string;
  revision: number;
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

export class GraphicsRevisionConflictError extends Error {
  constructor(
    readonly expectedRevision: number,
    readonly currentRevision: number
  ) {
    super(`Expected graphics revision ${expectedRevision}, current is ${currentRevision}`);
    this.name = "GraphicsRevisionConflictError";
  }
}

function mapReceipt(row: ReceiptRow, duplicate = false): StoredCommandReceipt {
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

export class GraphicsRepository {
  readonly #findReceipt;
  readonly #findState;
  readonly #upsertState;
  readonly #insertReceipt;
  readonly #commit;

  constructor(private readonly database: Database.Database) {
    this.#findReceipt = database.prepare("SELECT * FROM command_receipts WHERE command_id = ?");
    this.#findState = database.prepare(
      "SELECT state_json, revision FROM graphics_state WHERE id = 1"
    );
    this.#upsertState = database.prepare(`
      INSERT INTO graphics_state (id, state_json, revision, updated_at)
      VALUES (1, @stateJson, @revision, @updatedAt)
      ON CONFLICT(id) DO UPDATE SET
        state_json = excluded.state_json,
        revision = excluded.revision,
        updated_at = excluded.updated_at
    `);
    this.#insertReceipt = database.prepare(`
      INSERT INTO command_receipts (
        command_id, match_id, type, accepted, error_code, resulting_revision,
        received_at, operator_session_id
      ) VALUES (
        @commandId, @matchId, @type, 1, NULL, @resultingRevision,
        @receivedAt, @operatorSessionId
      )
    `);
    this.#commit = database.transaction(
      (input: {
        commandId: string;
        matchId: string | null;
        commandType: string;
        operatorSessionId: string;
        expectedRevision: number;
        state: GraphicsState;
        occurredAt: string;
      }): StoredCommandReceipt => {
        const existing = this.findReceipt(input.commandId);
        if (existing) return { ...existing, duplicate: true };

        const row = this.#findState.get() as GraphicsRow | undefined;
        const currentRevision = row?.revision ?? 0;
        if (currentRevision !== input.expectedRevision) {
          throw new GraphicsRevisionConflictError(input.expectedRevision, currentRevision);
        }

        const state = GraphicsStateSchema.parse(input.state);
        if (state.programRevision !== currentRevision + 1) {
          throw new GraphicsRevisionConflictError(currentRevision + 1, state.programRevision);
        }
        this.#upsertState.run({
          stateJson: JSON.stringify(state),
          revision: state.programRevision,
          updatedAt: input.occurredAt
        });
        this.#insertReceipt.run({
          commandId: input.commandId,
          matchId: input.matchId,
          type: input.commandType,
          resultingRevision: state.programRevision,
          receivedAt: input.occurredAt,
          operatorSessionId: input.operatorSessionId
        });
        const receipt = this.findReceipt(input.commandId);
        if (!receipt) throw new Error("Graphics command receipt was not persisted");
        return receipt;
      }
    );
  }

  findReceipt(commandId: string): StoredCommandReceipt | null {
    const row = this.#findReceipt.get(commandId) as ReceiptRow | undefined;
    return row ? mapReceipt(row) : null;
  }

  getState(initialTimestamp = new Date().toISOString()): GraphicsState {
    const row = this.#findState.get() as GraphicsRow | undefined;
    return row
      ? GraphicsStateSchema.parse(JSON.parse(row.state_json))
      : GraphicsStateSchema.parse({
          programRevision: 0,
          scorebug: null,
          lowerThird: null,
          updatedAt: initialTimestamp
        });
  }

  commit(input: {
    commandId: string;
    matchId: string | null;
    commandType: string;
    operatorSessionId: string;
    expectedRevision: number;
    state: GraphicsState;
    occurredAt: string;
  }): StoredCommandReceipt {
    return this.#commit(input);
  }
}
