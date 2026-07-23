import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

export interface CrashMarker {
  processId: number;
  startedAt: string;
  version: string;
}

export interface LifecycleOptions {
  markerPath: string;
  logDirectory: string;
  version: string;
  now?: () => Date;
}

function parseMarker(path: string): CrashMarker | null {
  if (!existsSync(path)) return null;
  try {
    const parsed = JSON.parse(readFileSync(path, "utf8")) as Partial<CrashMarker>;
    return typeof parsed.processId === "number" &&
      typeof parsed.startedAt === "string" &&
      typeof parsed.version === "string"
      ? (parsed as CrashMarker)
      : null;
  } catch {
    return null;
  }
}

export class DesktopLifecycle {
  readonly #markerPath: string;
  readonly #logDirectory: string;
  readonly #now: () => Date;
  #active = false;

  constructor(private readonly options: LifecycleOptions) {
    this.#markerPath = resolve(options.markerPath);
    this.#logDirectory = resolve(options.logDirectory);
    this.#now = options.now ?? (() => new Date());
  }

  begin(): CrashMarker | null {
    const previousCrash = parseMarker(this.#markerPath);
    const marker: CrashMarker = {
      processId: process.pid,
      startedAt: this.#now().toISOString(),
      version: this.options.version
    };
    mkdirSync(dirname(this.#markerPath), { recursive: true });
    const temporary = `${this.#markerPath}.tmp`;
    writeFileSync(temporary, `${JSON.stringify(marker, null, 2)}\n`, "utf8");
    renameSync(temporary, this.#markerPath);
    this.#active = true;
    return previousCrash;
  }

  completeCleanShutdown(): void {
    if (!this.#active) return;
    if (existsSync(this.#markerPath)) unlinkSync(this.#markerPath);
    this.#active = false;
  }

  exportLogs(destinationDirectory: string): string[] {
    const destination = resolve(destinationDirectory);
    mkdirSync(destination, { recursive: true });
    if (!existsSync(this.#logDirectory)) return [];

    const exported: string[] = [];
    for (const filename of readdirSync(this.#logDirectory)) {
      if (![".log", ".gz"].includes(extname(filename))) continue;
      const source = join(this.#logDirectory, filename);
      const target = join(destination, basename(filename));
      copyFileSync(source, target);
      exported.push(target);
    }
    return exported;
  }
}
