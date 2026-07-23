import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

import type { DatabaseHandle } from "@streamctrl/database";

type StreamCtrlDatabase = DatabaseHandle["database"];

interface MatchRow {
  id: string;
  state_json: string;
  revision: number;
  updated_at: string;
}

interface TeamRow {
  id: string;
  match_id: string;
  side: "home" | "away";
  state_json: string;
}

interface MatchEventRow {
  id: string;
  match_id: string;
  kind: string;
  payload_json: string;
  revision: number;
  occurred_at: string;
  supersedes_event_id: string | null;
}

interface GraphicsStateRow {
  id: 1;
  state_json: string;
  revision: number;
  updated_at: string;
}

export interface MatchPackageContents {
  format: "streamctrl-match-package";
  version: 1;
  exportedAt: string;
  matches: MatchRow[];
  teams: TeamRow[];
  matchEvents: MatchEventRow[];
  graphicsState: GraphicsStateRow[];
  settings: Record<string, unknown>;
}

export interface MatchPackage extends MatchPackageContents {
  checksum: string;
}

function digest(contents: MatchPackageContents): string {
  return createHash("sha256").update(JSON.stringify(contents)).digest("hex");
}

function assertPackage(value: unknown): asserts value is MatchPackage {
  if (!value || typeof value !== "object") {
    throw new Error("El archivo de respaldo no contiene un paquete válido.");
  }
  const candidate = value as Partial<MatchPackage>;
  if (
    candidate.format !== "streamctrl-match-package" ||
    candidate.version !== 1 ||
    typeof candidate.exportedAt !== "string" ||
    typeof candidate.checksum !== "string" ||
    !Array.isArray(candidate.matches) ||
    !Array.isArray(candidate.teams) ||
    !Array.isArray(candidate.matchEvents) ||
    !Array.isArray(candidate.graphicsState) ||
    !candidate.settings ||
    typeof candidate.settings !== "object"
  ) {
    throw new Error("El formato o la versión del paquete no son compatibles.");
  }

  const { checksum, ...contents } = candidate as MatchPackage;
  if (digest(contents) !== checksum) {
    throw new Error("El paquete está incompleto o fue modificado.");
  }
}

export function createMatchPackage(
  database: StreamCtrlDatabase,
  settings: Record<string, unknown> = {},
  exportedAt = new Date().toISOString()
): MatchPackage {
  const contents: MatchPackageContents = {
    format: "streamctrl-match-package",
    version: 1,
    exportedAt,
    matches: database.prepare("SELECT * FROM matches ORDER BY updated_at, id").all() as MatchRow[],
    teams: database.prepare("SELECT * FROM teams ORDER BY match_id, side").all() as TeamRow[],
    matchEvents: database
      .prepare("SELECT * FROM match_events ORDER BY match_id, revision")
      .all() as MatchEventRow[],
    graphicsState: database.prepare("SELECT * FROM graphics_state ORDER BY id").all() as
      GraphicsStateRow[] | [],
    settings: structuredClone(settings)
  };
  return { ...contents, checksum: digest(contents) };
}

export function exportMatchPackage(
  database: StreamCtrlDatabase,
  destination: string,
  settings: Record<string, unknown> = {}
): string {
  const path = resolve(destination);
  mkdirSync(dirname(path), { recursive: true });
  const temporaryPath = `${path}.tmp`;
  writeFileSync(
    temporaryPath,
    `${JSON.stringify(createMatchPackage(database, settings), null, 2)}\n`,
    {
      encoding: "utf8",
      flag: "wx"
    }
  );
  renameSync(temporaryPath, path);
  return path;
}

export function importMatchPackage(
  database: StreamCtrlDatabase,
  source: string
): { matchesImported: number; settings: Record<string, unknown> } {
  const parsed: unknown = JSON.parse(readFileSync(resolve(source), "utf8"));
  assertPackage(parsed);

  const restore = database.transaction(() => {
    database.exec(`
      DELETE FROM command_receipts;
      DELETE FROM match_events;
      DELETE FROM teams;
      DELETE FROM graphics_state;
      DELETE FROM matches;
    `);

    const insertMatch = database.prepare(
      "INSERT INTO matches (id, state_json, revision, updated_at) VALUES (@id, @state_json, @revision, @updated_at)"
    );
    const insertTeam = database.prepare(
      "INSERT INTO teams (id, match_id, side, state_json) VALUES (@id, @match_id, @side, @state_json)"
    );
    const insertEvent = database.prepare(`
      INSERT INTO match_events (
        id, match_id, kind, payload_json, revision, occurred_at, supersedes_event_id
      ) VALUES (
        @id, @match_id, @kind, @payload_json, @revision, @occurred_at, @supersedes_event_id
      )
    `);
    const insertGraphics = database.prepare(
      "INSERT INTO graphics_state (id, state_json, revision, updated_at) VALUES (@id, @state_json, @revision, @updated_at)"
    );

    for (const match of parsed.matches) insertMatch.run(match);
    for (const team of parsed.teams) insertTeam.run(team);
    for (const event of parsed.matchEvents) insertEvent.run(event);
    for (const state of parsed.graphicsState) insertGraphics.run(state);
  });

  restore();
  return {
    matchesImported: parsed.matches.length,
    settings: structuredClone(parsed.settings)
  };
}
