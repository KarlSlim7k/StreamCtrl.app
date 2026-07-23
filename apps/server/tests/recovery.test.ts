import { describe, expect, it } from "vitest";

import { RecoveryCoordinator } from "../src/realtime/recovery.js";

describe("server revision recovery", () => {
  it("requires a snapshot for first admission and revision gaps", () => {
    const recovery = new RecoveryCoordinator();

    expect(recovery.evaluate(null, 4)).toBe("snapshot-required");
    expect(recovery.evaluate(4, 6)).toBe("snapshot-required");
    expect(recovery.evaluate(4, 5)).toBe("apply");
    expect(recovery.evaluate(5, 5)).toBe("ignore");
  });
});
