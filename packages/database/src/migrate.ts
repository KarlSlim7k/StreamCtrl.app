import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import type Database from "better-sqlite3";

const MIGRATION_FILE_PATTERN = /^(?<version>\d+)-(?<name>[a-z0-9-]+)\.sql$/i;

export interface Migration {
  version: number;
  name: string;
  path: string;
  sql: string;
}

export interface MigrationResult {
  applied: readonly Migration[];
  currentVersion: number;
}

function resolveMigrationDirectory(directory?: string | URL): string {
  if (directory instanceof URL) {
    return fileURLToPath(directory);
  }

  return directory ?? fileURLToPath(new URL("./migrations/", import.meta.url));
}

export function readMigrations(directory?: string | URL): Migration[] {
  const migrationDirectory = resolveMigrationDirectory(directory);

  return readdirSync(migrationDirectory)
    .map((filename) => {
      const match = MIGRATION_FILE_PATTERN.exec(filename);
      if (!match?.groups) {
        return undefined;
      }

      const path = join(migrationDirectory, filename);
      return {
        version: Number.parseInt(match.groups.version ?? "", 10),
        name: match.groups.name ?? filename,
        path,
        sql: readFileSync(path, "utf8")
      };
    })
    .filter((migration): migration is Migration => migration !== undefined)
    .sort((left, right) => left.version - right.version);
}

function ensureMigrationTable(database: Database.Database): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    );
  `);
}

export function getCurrentMigrationVersion(database: Database.Database): number {
  ensureMigrationTable(database);
  const row = database
    .prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations")
    .get() as { version: number };
  return row.version;
}

export function migrateDatabase(
  database: Database.Database,
  directory?: string | URL
): MigrationResult {
  ensureMigrationTable(database);
  const currentVersion = getCurrentMigrationVersion(database);
  const pending = readMigrations(directory).filter(
    (migration) => migration.version > currentVersion
  );

  for (const migration of pending) {
    const apply = database.transaction(() => {
      database.exec(migration.sql);
      database
        .prepare("INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)")
        .run(migration.version, migration.name, new Date().toISOString());
    });

    apply();
  }

  return {
    applied: pending,
    currentVersion: pending.at(-1)?.version ?? currentVersion
  };
}
