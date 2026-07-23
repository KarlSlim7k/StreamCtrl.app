import type { Server } from "node:http";

import express, { type Express } from "express";

export type DatabaseHealth = "ok" | "error";
export type VmixHealth = "connected" | "disconnected" | "disabled";

export interface HealthDependencies {
  version: string;
  startedAtMs: number;
  databaseHealth(): DatabaseHealth | Promise<DatabaseHealth>;
  vmixHealth(): VmixHealth | Promise<VmixHealth>;
}

export interface HealthSnapshot {
  status: "ok" | "degraded";
  version: string;
  uptimeMs: number;
  database: DatabaseHealth;
  vmix: VmixHealth;
}

export async function readHealth(
  dependencies: HealthDependencies,
  nowMs = Date.now()
): Promise<HealthSnapshot> {
  const [database, vmix] = await Promise.all([
    dependencies.databaseHealth(),
    dependencies.vmixHealth()
  ]);

  return {
    status: database === "ok" && vmix !== "disconnected" ? "ok" : "degraded",
    version: dependencies.version,
    uptimeMs: Math.max(0, nowMs - dependencies.startedAtMs),
    database,
    vmix
  };
}

export function createHttpApplication(dependencies: HealthDependencies): Express {
  const application = express();
  application.disable("x-powered-by");

  application.get("/health", async (_request, response, next) => {
    try {
      response.status(200).json(await readHealth(dependencies));
    } catch (error) {
      next(error);
    }
  });

  return application;
}

export function listenOnLoopback(
  application: Express,
  port: number,
  host: "127.0.0.1" = "127.0.0.1"
): Promise<Server> {
  return new Promise((resolve, reject) => {
    const server = application.listen(port, host, () => resolve(server));
    server.once("error", reject);
  });
}
