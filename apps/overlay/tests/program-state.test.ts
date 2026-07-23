import { describe, expect, it } from "vitest";

import { ProgramStateController } from "../src/state/program-state.js";

const state = (revision: number) => ({
  programRevision: revision,
  scorebug: null,
  lowerThird: null,
  updatedAt: "2026-07-23T18:00:00.000Z"
});

describe("Program state ordering", () => {
  it("loads a complete snapshot before accepting events", () => {
    const controller = new ProgramStateController();

    expect(controller.applyEvent(state(1))).toBe("snapshot-required");
    expect(controller.applySnapshot(state(4))).toBe("applied");
    expect(controller.current?.programRevision).toBe(4);
  });

  it("ignores stale events and requests a snapshot for revision gaps", () => {
    const controller = new ProgramStateController();
    controller.applySnapshot(state(4));

    expect(controller.applyEvent(state(4))).toBe("ignored");
    expect(controller.applyEvent(state(6))).toBe("snapshot-required");
    expect(controller.applyEvent(state(5))).toBe("applied");
  });
});
