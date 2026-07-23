import { describe, expect, it, vi } from "vitest";

import { publishAfterCommit } from "../src/realtime/socket-server.js";

describe("persistence before publication", () => {
  it("does not publish an event when the transaction fails", async () => {
    const publish = vi.fn();

    await expect(
      publishAfterCommit(async () => {
        throw new Error("disk full");
      }, publish)
    ).rejects.toThrow("disk full");
    expect(publish).not.toHaveBeenCalled();
  });
});
