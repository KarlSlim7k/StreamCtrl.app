import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MatchRepository, openDatabase } from "@streamctrl/database";

import { MatchCommandService } from "../src/commands/match-commands.js";
import { SnapshotService } from "../src/state/snapshot-service.js";

describe("persisted match restore", () => {
  it("restores the latest confirmed match and history after reopening the database", async () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-restore-"));
    const databasePath = join(directory, "streamctrl.db");
    const firstHandle = await openDatabase({ path: databasePath });
    const firstRepository = new MatchRepository(firstHandle.database);
    const commands = new MatchCommandService(firstRepository);

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
    commands.setScore({
      commandId: "score-1",
      operatorSessionId: "operator-1",
      matchId: "match-1",
      expectedRevision: 1,
      home: 1,
      away: 0
    });
    firstHandle.close();

    const secondHandle = await openDatabase({ path: databasePath });
    const snapshots = new SnapshotService(new MatchRepository(secondHandle.database));
    const restored = snapshots.restoreLatest();
    secondHandle.close();

    expect(restored?.matchRevision).toBe(2);
    expect(restored?.teams.map((team) => team.score)).toEqual([1, 0]);
  });
});
