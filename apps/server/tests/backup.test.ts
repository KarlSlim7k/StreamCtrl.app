import { existsSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { openDatabase } from "@streamctrl/database";
import { afterEach, describe, expect, it } from "vitest";

import { exportMatchPackage, importMatchPackage } from "../src/backup/match-package.js";

const handles: Array<{ close(): void }> = [];

afterEach(() => {
  while (handles.length > 0) handles.pop()?.close();
});

describe("manual match package", () => {
  it("exports atomically and restores state with settings", async () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-package-"));
    const source = await openDatabase({ path: ":memory:" });
    const target = await openDatabase({ path: ":memory:" });
    handles.push(source, target);

    source.database
      .prepare("INSERT INTO matches (id, state_json, revision, updated_at) VALUES (?, ?, ?, ?)")
      .run("final-1", JSON.stringify({ home: "Local", away: "Visitante" }), 4, "2026-07-23");

    const packagePath = exportMatchPackage(
      source.database,
      join(directory, "final.streamctrl.json"),
      { language: "es-MX", resolution: "1920x1080" }
    );
    const result = importMatchPackage(target.database, packagePath);

    expect(existsSync(packagePath)).toBe(true);
    expect(existsSync(`${packagePath}.tmp`)).toBe(false);
    expect(result).toEqual({
      matchesImported: 1,
      settings: { language: "es-MX", resolution: "1920x1080" }
    });
    expect(
      target.database.prepare("SELECT revision FROM matches WHERE id = ?").get("final-1")
    ).toEqual({ revision: 4 });
  });

  it("rejects a package whose checksum no longer matches", async () => {
    const directory = mkdtempSync(join(tmpdir(), "streamctrl-package-"));
    const source = await openDatabase({ path: ":memory:" });
    const target = await openDatabase({ path: ":memory:" });
    handles.push(source, target);
    const packagePath = exportMatchPackage(source.database, join(directory, "match.json"));
    const tampered = readFileSync(packagePath, "utf8").replace(
      '"exportedAt":',
      '"unexpected": true, "exportedAt":'
    );
    const alteredPath = join(directory, "altered.json");
    writeFileSync(alteredPath, tampered);

    expect(() => importMatchPackage(target.database, alteredPath)).toThrow(
      "incompleto o fue modificado"
    );
  });
});
