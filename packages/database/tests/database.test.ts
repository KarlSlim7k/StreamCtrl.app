import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import BetterSqlite3 from "better-sqlite3";
import { afterEach, describe, expect, it } from "vitest";

import { openDatabase } from "../src/database.js";
import { migrateDatabase, readMigrations } from "../src/migrate.js";
import { MatchRepository } from "../src/repositories/match-repository.js";

const handles: Array<{ close(): void }> = [];

afterEach(() => {
  while (handles.length > 0) {
    handles.pop()?.close();
  }
});

describe("database lifecycle", () => {
  it("finds source migrations before a package build has copied distribution assets", () => {
    expect(readMigrations()).toEqual([expect.objectContaining({ version: 1, name: "initial" })]);
  });

  it("applies the initial migration and enables WAL", async () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-db-"));
    const handle = await openDatabase({ path: join(directory, "streamctrl.db") });
    handles.push(handle);

    expect(handle.migration.currentVersion).toBe(1);
    expect(handle.database.pragma("journal_mode", { simple: true })).toBe("wal");
    expect(
      handle.database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'matches'")
        .get()
    ).toBeDefined();
  });

  it("rolls back every statement in a failed migration", () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-migration-"));
    const migrations = join(directory, "migrations");
    mkdirSync(migrations);
    writeFileSync(join(migrations, "001-valid.sql"), "CREATE TABLE stable (id INTEGER);");
    writeFileSync(
      join(migrations, "002-invalid.sql"),
      "CREATE TABLE should_rollback (id INTEGER); THIS IS INVALID SQL;"
    );

    const database = new BetterSqlite3(":memory:");
    handles.push(database);

    expect(() => migrateDatabase(database, migrations)).toThrow();
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'stable'")
        .get()
    ).toBeDefined();
    expect(
      database
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'should_rollback'")
        .get()
    ).toBeUndefined();
  });

  it("commits receipt, event and projection atomically and remains idempotent", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    handles.push(handle);
    const repository = new MatchRepository(handle.database);
    const occurredAt = "2026-07-23T18:00:00.000Z";
    const transition = {
      commandId: "command-1",
      matchId: "match-1",
      commandType: "match.create",
      operatorSessionId: "session-1",
      expectedRevision: 0,
      eventId: "event-1",
      eventKind: "create",
      eventPayload: { name: "Final" },
      occurredAt,
      projection: { name: "Final" }
    };

    const first = repository.commitAccepted(transition);
    const duplicate = repository.commitAccepted(transition);

    expect(first.resultingRevision).toBe(1);
    expect(first.duplicate).toBe(false);
    expect(duplicate.duplicate).toBe(true);
    expect(handle.database.prepare("SELECT COUNT(*) AS count FROM match_events").get()).toEqual({
      count: 1
    });
  });

  it("rolls back projection and receipt when any atomic write fails", async () => {
    const handle = await openDatabase({ path: ":memory:" });
    handles.push(handle);
    const repository = new MatchRepository(handle.database);
    const occurredAt = "2026-07-23T18:00:00.000Z";

    repository.commitAccepted({
      commandId: "command-1",
      matchId: "match-1",
      commandType: "match.create",
      operatorSessionId: "session-1",
      expectedRevision: 0,
      eventId: "event-1",
      eventKind: "create",
      eventPayload: {},
      occurredAt,
      projection: { score: 0 }
    });

    expect(() =>
      repository.commitAccepted({
        commandId: "command-2",
        matchId: "match-1",
        commandType: "match.scoreSet",
        operatorSessionId: "session-1",
        expectedRevision: 1,
        eventId: "event-1",
        eventKind: "score",
        eventPayload: { score: 1 },
        occurredAt,
        projection: { score: 1 }
      })
    ).toThrow();

    expect(repository.getProjection("match-1")).toEqual({
      revision: 1,
      state: { score: 0 }
    });
    expect(repository.findReceipt("command-2")).toBeNull();
  });
});
