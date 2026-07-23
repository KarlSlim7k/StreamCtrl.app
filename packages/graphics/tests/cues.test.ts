import { describe, expect, it } from "vitest";

import { CueCoordinator, GraphicsRevisionConflictError } from "../src/cue-coordinator.js";

const now = "2026-07-23T18:00:00.000Z";

describe("graphic cue coordinator", () => {
  it("keeps preview isolated until a cue is taken", () => {
    const coordinator = new CueCoordinator(now);
    coordinator.preview({
      cueId: "lower-1",
      type: "lowerThird",
      action: "preview",
      layer: 20,
      requestedAt: now,
      payload: { primaryText: "Ana Pérez", secondaryText: "Comentarista" }
    });

    expect(coordinator.program.lowerThird).toBeNull();
    expect(coordinator.previewState.lowerThird?.payload).toMatchObject({
      primaryText: "Ana Pérez"
    });

    coordinator.take("lowerThird", 0, now);
    expect(coordinator.program.lowerThird?.payload).toMatchObject({
      primaryText: "Ana Pérez"
    });
  });

  it("rejects incomplete lower thirds before Program", () => {
    const coordinator = new CueCoordinator(now);

    expect(() =>
      coordinator.preview({
        cueId: "lower-1",
        type: "lowerThird",
        action: "preview",
        layer: 20,
        requestedAt: now,
        payload: { primaryText: "Ana Pérez", secondaryText: "" }
      })
    ).toThrow();
    expect(coordinator.program.lowerThird).toBeNull();
  });

  it("rejects stale revisions and clears all graphics atomically", () => {
    const coordinator = new CueCoordinator(now);
    coordinator.preview({
      cueId: "scorebug-1",
      type: "scorebug",
      action: "preview",
      layer: 10,
      requestedAt: now,
      payload: {}
    });
    coordinator.take("scorebug", 0, now);

    expect(() => coordinator.allHide(0, now)).toThrow(GraphicsRevisionConflictError);
    const cleared = coordinator.allHide(1, now);
    expect(cleared).toMatchObject({ scorebug: null, lowerThird: null, programRevision: 2 });
  });
});
