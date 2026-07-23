import { randomUUID } from "node:crypto";
import { existsSync } from "node:fs";
import { createServer, type Server as HttpServer } from "node:http";
import { fileURLToPath } from "node:url";

import { parseEnvironment, type StateSnapshot } from "@streamctrl/contracts";
import {
  GraphicsRepository,
  MatchRepository,
  openDatabase,
  type DatabaseHandle
} from "@streamctrl/database";
import { CueCoordinator } from "@streamctrl/graphics";
import express from "express";
import type { Server as SocketIoServer } from "socket.io";

import { GraphicsCommandService } from "./commands/graphics-commands.js";
import { MatchCommandService } from "./commands/match-commands.js";
import { createHttpApplication } from "./http/health.js";
import { createLogger } from "./logging.js";
import { attachCommandRouter, type CommandRuntime } from "./realtime/command-router.js";
import { attachSocketServer } from "./realtime/socket-server.js";
import { ProductionLeaseManager, type SessionAccess } from "./sessions/production-lease.js";
import { SnapshotService } from "./state/snapshot-service.js";
import { exportMatchPackage, importMatchPackage } from "./backup/match-package.js";

interface RuntimeContext {
  handle: DatabaseHandle;
  matchRepository: MatchRepository;
  graphicsRepository: GraphicsRepository;
  runtime: CommandRuntime;
}

export interface RunningServer {
  httpServer: HttpServer;
  io: SocketIoServer;
  url: string;
  close(): Promise<void>;
}

function createRuntime(handle: DatabaseHandle): RuntimeContext {
  const matchRepository = new MatchRepository(handle.database);
  const graphicsRepository = new GraphicsRepository(handle.database);
  const snapshotService = new SnapshotService(matchRepository, graphicsRepository);
  const matchCommands = new MatchCommandService(matchRepository);
  const coordinator = new CueCoordinator(new Date().toISOString(), graphicsRepository.getState());
  const graphicsCommands = new GraphicsCommandService(coordinator);

  return {
    handle,
    matchRepository,
    graphicsRepository,
    runtime: {
      matchCommands,
      graphicsCommands,
      snapshot: () => snapshotService.restoreLatest(),
      findReceipt: (commandId) => graphicsRepository.findReceipt(commandId),
      persistGraphics: ({ envelope, state, access }) => {
        try {
          return graphicsRepository.commit({
            commandId: envelope.payload.commandId,
            matchId: typeof envelope.payload.matchId === "string" ? envelope.payload.matchId : null,
            commandType: envelope.type,
            operatorSessionId: access.sessionId,
            expectedRevision:
              typeof envelope.payload.expectedRevision === "number"
                ? envelope.payload.expectedRevision
                : state.programRevision - 1,
            state,
            occurredAt: state.updatedAt
          });
        } catch (error) {
          graphicsCommands.restore(graphicsRepository.getState());
          throw error;
        }
      }
    }
  };
}

function addRendererRoutes(application: express.Express): void {
  const overlayDirectory = fileURLToPath(new URL("../../overlay/dist/", import.meta.url));
  const controlDirectory = fileURLToPath(new URL("../../control/dist/", import.meta.url));
  const overlayIndex = fileURLToPath(new URL("../../overlay/dist/index.html", import.meta.url));
  const controlIndex = fileURLToPath(new URL("../../control/dist/index.html", import.meta.url));

  if (existsSync(overlayIndex)) {
    application.use("/overlay", express.static(overlayDirectory));
    application.get(/^\/overlay\/(?:program|preview)\/?$/, (_request, response) => {
      response.sendFile(overlayIndex);
    });
  }
  if (existsSync(controlIndex)) {
    application.use("/control", express.static(controlDirectory));
    application.get(/^\/control\/?$/, (_request, response) => {
      response.sendFile(controlIndex);
    });
  }
  application.get("/", (_request, response) => response.redirect("/control/"));
}

function addOperationRoutes(
  application: express.Express,
  token: string,
  getProduction: () => RuntimeContext,
  resetProduction: () => void
): void {
  application.use("/operations", express.json({ limit: "64kb" }));
  application.use("/operations", (request, response, next) => {
    if (request.header("x-streamctrl-operation-token") !== token) {
      response.status(403).json({ error: "Operación no autorizada" });
      return;
    }
    next();
  });
  application.post("/operations/export", (request, response) => {
    try {
      const path = zPath(request.body);
      const exportedPath = exportMatchPackage(getProduction().handle.database, path);
      response.json({ path: exportedPath });
    } catch (error) {
      response.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo exportar el paquete"
      });
    }
  });
  application.post("/operations/import", (request, response) => {
    try {
      const path = zPath(request.body);
      const result = importMatchPackage(getProduction().handle.database, path);
      resetProduction();
      response.json(result);
    } catch (error) {
      response.status(400).json({
        error: error instanceof Error ? error.message : "No se pudo importar el paquete"
      });
    }
  });
}

function zPath(body: unknown): string {
  if (
    !body ||
    typeof body !== "object" ||
    !("path" in body) ||
    typeof (body as { path: unknown }).path !== "string" ||
    (body as { path: string }).path.trim().length === 0
  ) {
    throw new Error("La ruta del paquete es obligatoria.");
  }
  return (body as { path: string }).path;
}

export async function startStreamCtrlServer(
  overrides: Partial<ReturnType<typeof parseEnvironment>> = {}
): Promise<RunningServer> {
  const environment = { ...parseEnvironment(), ...overrides };
  const startedAtMs = Date.now();
  const logger = createLogger({
    directory: environment.STREAMCTRL_LOG_DIRECTORY,
    level: environment.STREAMCTRL_LOG_LEVEL
  });
  const productionHandle = await openDatabase({ path: environment.STREAMCTRL_DATABASE_PATH });
  let production = createRuntime(productionHandle);
  const rehearsals = new Map<string, RuntimeContext>();
  const leases = new ProductionLeaseManager();

  async function contextFor(access: SessionAccess | null): Promise<RuntimeContext> {
    if (!access || access.stateNamespace === "production") return production;
    const existing = rehearsals.get(access.stateNamespace);
    if (existing) return existing;
    const context = createRuntime(await openDatabase({ path: ":memory:" }));
    rehearsals.set(access.stateNamespace, context);
    return context;
  }

  const application = createHttpApplication({
    version: "0.1.0",
    startedAtMs,
    databaseHealth: () => {
      try {
        production.handle.database.prepare("SELECT 1").get();
        return "ok";
      } catch {
        return "error";
      }
    },
    vmixHealth: () => (environment.STREAMCTRL_VMIX_ENABLED ? "disconnected" : "disabled")
  });
  const operationToken = process.env.STREAMCTRL_OPERATION_TOKEN;
  if (operationToken) {
    addOperationRoutes(
      application,
      operationToken,
      () => production,
      () => {
        production = createRuntime(productionHandle);
      }
    );
  }
  addRendererRoutes(application);
  const httpServer = createServer(application);
  const io = attachSocketServer(
    httpServer,
    async (access): Promise<StateSnapshot | null> => (await contextFor(access)).runtime.snapshot(),
    leases
  );
  io.on("connection", (socket) => {
    attachCommandRouter(socket, {
      io,
      runtimeFor(access) {
        if (access.stateNamespace === "production") return production.runtime;
        const context = rehearsals.get(access.stateNamespace);
        if (!context) throw new Error("La sesión de ensayo todavía no está preparada.");
        return context.runtime;
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(environment.STREAMCTRL_PORT, environment.STREAMCTRL_HOST, () => resolve());
  });
  const address = httpServer.address();
  const actualPort =
    typeof address === "object" && address ? address.port : environment.STREAMCTRL_PORT;
  const url = `http://${environment.STREAMCTRL_HOST}:${actualPort}`;
  logger.info({ url, runId: randomUUID() }, "StreamCtrl server ready");

  return {
    httpServer,
    io,
    url,
    async close() {
      await new Promise<void>((resolve) => io.close(() => resolve()));
      if (httpServer.listening) {
        await new Promise<void>((resolve, reject) =>
          httpServer.close((error) => (error ? reject(error) : resolve()))
        );
      }
      for (const context of rehearsals.values()) context.handle.close();
      production.handle.close();
    }
  };
}

const executedPath = process.argv[1];
if (executedPath && fileURLToPath(import.meta.url) === executedPath) {
  const running = await startStreamCtrlServer();
  const shutdown = async () => {
    await running.close();
    process.exitCode = 0;
  };
  process.once("SIGINT", () => void shutdown());
  process.once("SIGTERM", () => void shutdown());
}
