import { afterEach, describe, expect, it } from "vitest";

import { openDatabase, MatchRepository } from "@streamctrl/database";

import { MatchCommandService } from "../src/commands/match-commands.js";

const handles: Array<{ close(): void }> = [];

afterEach(() => {
  while (handles.length > 0) {
    handles.pop()?.close();
  }
});

describe("match commands", () => {
  it("returns the original acknowledgement for duplicate command delivery", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    handles.push(handle);
    const service = new MatchCommandService(new MatchRepository(handle.database));

    const command = {
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
    };

    const first = service.create(command);
    const duplicate = service.create(command);

    expect(first).toMatchObject({ accepted: true, resultingRevision: 1 });
    expect(duplicate).toEqual(first);
    expect(handle.database.prepare("SELECT COUNT(*) AS count FROM match_events").get()).toEqual({
      count: 1
    });
  });

  it("returns a deterministic revision conflict without changing state", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    handles.push(handle);
    const service = new MatchCommandService(new MatchRepository(handle.database));

    service.create({
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

    const rejected = service.setScore({
      commandId: "score-1",
      operatorSessionId: "operator-1",
      matchId: "match-1",
      expectedRevision: 0,
      home: 1,
      away: 0
    });

    expect(rejected).toMatchObject({
      accepted: false,
      errorCode: "REVISION_CONFLICT",
      currentRevision: 1
    });
    expect(service.load("match-1")?.teams.map((team) => team.score)).toEqual([0, 0]);
  });

  it("persists an append-only undo receipt and closes the match", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    handles.push(handle);
    const service = new MatchCommandService(new MatchRepository(handle.database));
    service.create({
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
    service.setScore({
      commandId: "score-1",
      operatorSessionId: "operator-1",
      matchId: "match-1",
      expectedRevision: 1,
      home: 1,
      away: 0
    });

    expect(
      service.undo({
        commandId: "undo-1",
        operatorSessionId: "operator-1",
        matchId: "match-1",
        expectedRevision: 2
      })
    ).toMatchObject({ accepted: true, resultingRevision: 3 });
    expect(service.load("match-1")?.teams.map((team) => team.score)).toEqual([0, 0]);
    expect(
      service.close({
        commandId: "close-1",
        operatorSessionId: "operator-1",
        matchId: "match-1",
        expectedRevision: 3
      })
    ).toMatchObject({ accepted: true, resultingRevision: 4 });
    expect(service.load("match-1")?.match.status).toBe("finished");
  });
});
