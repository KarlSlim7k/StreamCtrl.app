import { mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

import BetterSqlite3 from "better-sqlite3";

import { migrateDatabase, type MigrationResult } from "./migrate.js";

const DEFAULT_BACKUP_LIMIT = 5;

export interface OpenDatabaseOptions {
  path: string;
  backupDirectory?: string;
  backupLimit?: number;
  migrationsDirectory?: string | URL;
}

export interface DatabaseHandle {
  database: BetterSqlite3.Database;
  migration: MigrationResult;
  backupPath: string | null;
  close(): void;
}

function databaseAlreadyExists(path: string): boolean {
  if (path === ":memory:") {
    return false;
  }

  try {
    return statSync(path).size > 0;
  } catch {
    return false;
  }
}

function pruneBackups(directory: string, limit: number): void {
  const backups = readdirSync(directory)
    .filter((filename) => filename.endsWith(".db"))
    .map((filename) => {
      const path = join(directory, filename);
      return { path, modifiedAt: statSync(path).mtimeMs };
    })
    .sort((left, right) => right.modifiedAt - left.modifiedAt);

  for (const backup of backups.slice(limit)) {
    unlinkSync(backup.path);
  }
}

export async function openDatabase(options: OpenDatabaseOptions): Promise<DatabaseHandle> {
  const databasePath = options.path === ":memory:" ? options.path : resolve(options.path);
  const existed = databaseAlreadyExists(databasePath);

  if (databasePath !== ":memory:") {
    mkdirSync(dirname(databasePath), { recursive: true });
  }

  const database = new BetterSqlite3(databasePath);
  database.pragma("foreign_keys = ON");
  database.pragma("busy_timeout = 5000");
  database.pragma("synchronous = NORMAL");
  database.pragma("journal_mode = WAL");

  let backupPath: string | null = null;

  try {
    if (existed) {
      const backupDirectory = resolve(
        options.backupDirectory ?? join(dirname(databasePath), "backups")
      );
      mkdirSync(backupDirectory, { recursive: true });
      const timestamp = new Date().toISOString().replaceAll(":", "-");
      backupPath = join(backupDirectory, `streamctrl-${timestamp}.db`);
      await database.backup(backupPath);
      pruneBackups(backupDirectory, options.backupLimit ?? DEFAULT_BACKUP_LIMIT);
    }

    const migration = migrateDatabase(database, options.migrationsDirectory);

    return {
      database,
      migration,
      backupPath,
      close() {
        if (database.open) {
          database.pragma("wal_checkpoint(TRUNCATE)");
          database.close();
        }
      }
    };
  } catch (error) {
    database.close();
    throw error;
  }
}
