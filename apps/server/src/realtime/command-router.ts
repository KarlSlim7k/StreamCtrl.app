import {
  CommandEnvelopeSchema,
  GraphicCueSchema,
  type CommandAcknowledgement,
  type CommandEnvelope,
  type StateSnapshot
} from "@streamctrl/contracts";
import type { StoredCommandReceipt } from "@streamctrl/database";
import type { Server as SocketIoServer, Socket } from "socket.io";
import { z } from "zod";

import type { GraphicsCommandService } from "../commands/graphics-commands.js";
import type { MatchCommandService } from "../commands/match-commands.js";
import type { SessionAccess } from "../sessions/production-lease.js";

const createPayloadSchema = z.object({
  commandId: z.string().min(1),
  match: z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    homeTeam: z.object({
      id: z.string().min(1),
      fullName: z.string().min(1),
      shortName: z.string().min(1),
      primaryColor: z.string(),
      secondaryColor: z.string()
    }),
    awayTeam: z.object({
      id: z.string().min(1),
      fullName: z.string().min(1),
      shortName: z.string().min(1),
      primaryColor: z.string(),
      secondaryColor: z.string()
    })
  })
});

const matchMutationSchema = z.object({
  commandId: z.string().min(1),
  matchId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative()
});

const graphicsMutationSchema = z.object({
  commandId: z.string().min(1),
  expectedRevision: z.number().int().nonnegative(),
  type: z.enum(["scorebug", "lowerThird"]).optional()
});

export interface CommandRuntime {
  matchCommands: MatchCommandService;
  graphicsCommands: GraphicsCommandService;
  snapshot(): StateSnapshot | null;
  findReceipt(commandId: string): StoredCommandReceipt | null;
  persistGraphics(input: {
    envelope: CommandEnvelope;
    state: ReturnType<GraphicsCommandService["allHide"]>;
    access: SessionAccess;
  }): StoredCommandReceipt;
}

export interface CommandRouterOptions {
  io: SocketIoServer;
  runtimeFor(access: SessionAccess): CommandRuntime;
}

function rejected(
  commandId: string,
  errorCode: "INVALID_PAYLOAD" | "PRODUCTION_LEASE_REQUIRED" | "INVALID_TRANSITION",
  message: string,
  currentRevision: number | null = null
): CommandAcknowledgement {
  return {
    accepted: false,
    commandId: commandId as never,
    errorCode,
    message,
    currentRevision
  };
}

function acceptedFromReceipt(receipt: StoredCommandReceipt): CommandAcknowledgement {
  return {
    accepted: true,
    commandId: receipt.commandId as never,
    resultingRevision: receipt.resultingRevision ?? 0
  };
}

function publishSnapshot(
  io: SocketIoServer,
  namespace: string,
  snapshot: StateSnapshot | null
): void {
  if (snapshot) io.to(`namespace:${namespace}`).emit("state.snapshot", snapshot);
}

export function attachCommandRouter(socket: Socket, options: CommandRouterOptions): void {
  socket.on(
    "command",
    async (input: unknown, acknowledge?: (result: CommandAcknowledgement) => void) => {
      const parsed = CommandEnvelopeSchema.safeParse(input);
      const fallbackId =
        input && typeof input === "object" && "payload" in input
          ? String((input as { payload?: { commandId?: unknown } }).payload?.commandId ?? "invalid")
          : "invalid";
      if (!parsed.success) {
        acknowledge?.(rejected(fallbackId, "INVALID_PAYLOAD", "El comando no es válido."));
        return;
      }

      const access = socket.data.sessionAccess as SessionAccess | null | undefined;
      if (!access?.canWrite) {
        acknowledge?.(
          rejected(
            parsed.data.payload.commandId,
            "PRODUCTION_LEASE_REQUIRED",
            "La sesión no tiene control de escritura."
          )
        );
        return;
      }

      const runtime = options.runtimeFor(access);
      try {
        const result = executeCommand(parsed.data, access, runtime);
        acknowledge?.(result);
        if (result.accepted && parsed.data.type !== "graphics.previewSet") {
          publishSnapshot(options.io, access.stateNamespace, runtime.snapshot());
        }
      } catch (error) {
        acknowledge?.(
          rejected(
            parsed.data.payload.commandId,
            "INVALID_TRANSITION",
            error instanceof Error ? error.message.slice(0, 240) : "Transición inválida."
          )
        );
      }
    }
  );

  socket.on("state.snapshotRequest", () => {
    const access = socket.data.sessionAccess as SessionAccess | null | undefined;
    if (!access) return;
    const snapshot = options.runtimeFor(access).snapshot();
    if (snapshot) socket.emit("state.snapshot", snapshot);
  });
}

function executeCommand(
  envelope: CommandEnvelope,
  access: SessionAccess,
  runtime: CommandRuntime
): CommandAcknowledgement {
  const context = {
    commandId: envelope.payload.commandId,
    operatorSessionId: access.sessionId
  };

  switch (envelope.type) {
    case "match.create": {
      const payload = createPayloadSchema.parse(envelope.payload);
      return runtime.matchCommands.create({ ...context, match: payload.match });
    }
    case "match.load": {
      const payload = z.object({ matchId: z.string().min(1) }).parse(envelope.payload);
      const aggregate = runtime.matchCommands.load(payload.matchId);
      return aggregate
        ? {
            accepted: true,
            commandId: context.commandId as never,
            resultingRevision: aggregate.match.revision
          }
        : rejected(context.commandId, "INVALID_TRANSITION", "No se encontró el partido.");
    }
    case "match.close":
    case "match.undo": {
      const payload = matchMutationSchema.parse(envelope.payload);
      const command = { ...context, ...payload };
      return envelope.type === "match.close"
        ? runtime.matchCommands.close(command)
        : runtime.matchCommands.undo(command);
    }
    case "match.scoreSet": {
      const payload = matchMutationSchema
        .extend({ home: z.number().int().nonnegative(), away: z.number().int().nonnegative() })
        .parse(envelope.payload);
      return runtime.matchCommands.setScore({ ...context, ...payload });
    }
    case "match.periodSet": {
      const payload = matchMutationSchema.extend({ period: z.string() }).parse(envelope.payload);
      return runtime.matchCommands.setPeriod({ ...context, ...payload });
    }
    case "clock.start":
    case "clock.pause":
    case "clock.stop": {
      const payload = matchMutationSchema.parse(envelope.payload);
      const command = { ...context, ...payload };
      if (envelope.type === "clock.start") return runtime.matchCommands.startClock(command);
      if (envelope.type === "clock.pause") return runtime.matchCommands.pauseClock(command);
      return runtime.matchCommands.stopClock(command);
    }
    case "clock.correct": {
      const payload = matchMutationSchema
        .extend({ elapsedMs: z.number().int().nonnegative() })
        .parse(envelope.payload);
      return runtime.matchCommands.correctClock({ ...context, ...payload });
    }
    case "clock.addedTimeSet": {
      const payload = matchMutationSchema
        .extend({ minutes: z.number().int().nonnegative() })
        .parse(envelope.payload);
      return runtime.matchCommands.setAddedTime({ ...context, ...payload });
    }
    case "graphics.previewSet": {
      const cue = GraphicCueSchema.parse(envelope.payload.cue);
      runtime.graphicsCommands.preview(cue);
      return {
        accepted: true,
        commandId: context.commandId as never,
        resultingRevision: runtime.graphicsCommands.program.programRevision
      };
    }
    case "graphics.cueTake":
    case "graphics.cueHide":
    case "graphics.allHide": {
      const payload = graphicsMutationSchema.parse(envelope.payload);
      const duplicate = runtime.findReceipt(context.commandId);
      if (duplicate) return acceptedFromReceipt({ ...duplicate, duplicate: true });
      const state =
        envelope.type === "graphics.allHide"
          ? runtime.graphicsCommands.allHide(payload.expectedRevision)
          : envelope.type === "graphics.cueTake"
            ? runtime.graphicsCommands.take(
                payload.type ??
                  (() => {
                    throw new Error("El tipo de gráfico es obligatorio.");
                  })(),
                payload.expectedRevision
              )
            : runtime.graphicsCommands.hide(
                payload.type ??
                  (() => {
                    throw new Error("El tipo de gráfico es obligatorio.");
                  })(),
                payload.expectedRevision
              );
      return acceptedFromReceipt(runtime.persistGraphics({ envelope, state, access }));
    }
    case "state.snapshotRequest": {
      return {
        accepted: true,
        commandId: context.commandId as never,
        resultingRevision: runtime.snapshot()?.matchRevision ?? 0
      };
    }
  }
}
