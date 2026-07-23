import { describe, expect, it } from "vitest";

import { openDatabase } from "../src/database.js";
import {
  GraphicsRepository,
  GraphicsRevisionConflictError
} from "../src/repositories/graphics-repository.js";

describe("graphics repository", () => {
  it("persists Program and returns the original receipt for duplicates", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    const repository = new GraphicsRepository(handle.database);
    const state = {
      ...repository.getState("2026-07-23T18:00:00.000Z"),
      programRevision: 1,
      updatedAt: "2026-07-23T18:01:00.000Z" as never
    };
    const command = {
      commandId: "graphics-1",
      matchId: null,
      commandType: "graphics.allHide",
      operatorSessionId: "operator-1",
      expectedRevision: 0,
      state,
      occurredAt: "2026-07-23T18:01:00.000Z"
    };

    expect(repository.commit(command).duplicate).toBe(false);
    expect(repository.commit(command).duplicate).toBe(true);
    expect(repository.getState()).toEqual(state);
    handle.close();
  });

  it("rejects a stale graphics revision without changing Program", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    const repository = new GraphicsRepository(handle.database);
    const state = {
      ...repository.getState("2026-07-23T18:00:00.000Z"),
      programRevision: 1,
      updatedAt: "2026-07-23T18:01:00.000Z" as never
    };
    repository.commit({
      commandId: "graphics-1",
      matchId: null,
      commandType: "graphics.allHide",
      operatorSessionId: "operator-1",
      expectedRevision: 0,
      state,
      occurredAt: "2026-07-23T18:01:00.000Z"
    });

    expect(() =>
      repository.commit({
        commandId: "graphics-2",
        matchId: null,
        commandType: "graphics.allHide",
        operatorSessionId: "operator-1",
        expectedRevision: 0,
        state,
        occurredAt: "2026-07-23T18:02:00.000Z"
      })
    ).toThrow(GraphicsRevisionConflictError);
    expect(repository.getState().programRevision).toBe(1);
    handle.close();
  });
});
