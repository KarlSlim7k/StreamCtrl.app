import { mkdirSync, writeFileSync } from "node:fs";
import { arch, cpus, freemem, hostname, platform, release, totalmem } from "node:os";
import { join, resolve } from "node:path";

import type { EnduranceSample, EnduranceSummary } from "./metrics.js";

export interface MachineManifest {
  hostname: string;
  platform: string;
  release: string;
  architecture: string;
  cpu: string;
  logicalProcessors: number;
  totalMemoryBytes: number;
  freeMemoryBytes: number;
  nodeVersion: string;
  resolution: "1920x1080";
  frameRate: 30;
  vmixVersion: string;
}

export function createMachineManifest(vmixVersion = "29.0.0.48 Max"): MachineManifest {
  const processors = cpus();
  return {
    hostname: hostname(),
    platform: platform(),
    release: release(),
    architecture: arch(),
    cpu: processors[0]?.model ?? "unknown",
    logicalProcessors: processors.length,
    totalMemoryBytes: totalmem(),
    freeMemoryBytes: freemem(),
    nodeVersion: process.version,
    resolution: "1920x1080",
    frameRate: 30,
    vmixVersion
  };
}

export function writeEnduranceReport(
  outputDirectory: string,
  report: {
    manifest: MachineManifest;
    summary: EnduranceSummary;
    samples: readonly EnduranceSample[];
  }
): string {
  const directory = resolve(outputDirectory);
  mkdirSync(directory, { recursive: true });
  const path = join(directory, "endurance-report.json");
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}
