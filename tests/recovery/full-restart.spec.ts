import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MatchCommandService } from "../../apps/server/src/commands/match-commands.js";
import { SnapshotService } from "../../apps/server/src/state/snapshot-service.js";
import { MatchRepository, openDatabase } from "../../packages/database/src/index.js";

describe("full process restart", () => {
  it("restores the last confirmed revision from a new database connection", async () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-full-restart-"));
    const path = join(directory, "streamctrl.db");
    const before = await openDatabase({ path });
    const commands = new MatchCommandService(new MatchRepository(before.database));
    commands.create({
      commandId: "create-1",
      operatorSessionId: "operator-1",
      match: {
        id: "match-1",
        name: "Final",
        homeTeam: {
          id: "home",
          fullName: "Local",
          shortName: "LOC",
          primaryColor: "#112233",
          secondaryColor: "#ffffff"
        },
        awayTeam: {
          id: "away",
          fullName: "Visitante",
          shortName: "VIS",
          primaryColor: "#334455",
          secondaryColor: "#ffffff"
        }
      }
    });
    before.close();

    const after = await openDatabase({ path });
    const snapshot = new SnapshotService(new MatchRepository(after.database)).restoreLatest();
    after.close();

    expect(snapshot?.match.id).toBe("match-1");
    expect(snapshot?.matchRevision).toBe(1);
  });
});
