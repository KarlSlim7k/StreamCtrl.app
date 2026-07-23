import type { Server as HttpServer } from "node:http";

import type { StateSnapshot } from "@streamctrl/contracts";
import { Server as SocketIoServer, type Socket } from "socket.io";

import {
  ProductionLeaseManager,
  type SessionAccess,
  type SessionMode
} from "../sessions/production-lease.js";

export type ClientRole = "control" | "overlay-program" | "overlay-preview" | "diagnostics";

const clientRoles = new Set<ClientRole>([
  "control",
  "overlay-program",
  "overlay-preview",
  "diagnostics"
]);

export async function publishAfterCommit<T>(
  commit: () => T | Promise<T>,
  publish: (result: T) => void | Promise<void>
): Promise<T> {
  const result = await commit();
  await publish(result);
  return result;
}

export class OrderedPublisher {
  #tail: Promise<void> = Promise.resolve();

  enqueue(publish: () => void | Promise<void>): Promise<void> {
    const next = this.#tail.then(publish);
    this.#tail = next.catch(() => undefined);
    return next;
  }
}

async function admitSocket(
  socket: Socket,
  snapshotProvider: (
    access: SessionAccess | null
  ) => StateSnapshot | null | Promise<StateSnapshot | null>,
  leases: ProductionLeaseManager
): Promise<void> {
  const role = socket.handshake.auth.role;
  if (typeof role !== "string" || !clientRoles.has(role as ClientRole)) {
    socket.emit("protocol.error", {
      errorCode: "INVALID_PAYLOAD",
      message: "A valid client role is required"
    });
    socket.disconnect(true);
    return;
  }

  let access: SessionAccess | null = null;
  if (role === "control" || role === "overlay-preview") {
    const sessionId = socket.handshake.auth.sessionId;
    const mode = socket.handshake.auth.mode;
    if (
      typeof sessionId !== "string" ||
      sessionId.length === 0 ||
      (mode !== "production" && mode !== "rehearsal")
    ) {
      socket.emit("protocol.error", {
        errorCode: "INVALID_PAYLOAD",
        message: "A sessionId and mode are required"
      });
      socket.disconnect(true);
      return;
    }
    access = leases.open({ sessionId, mode: mode as SessionMode });
    if (role === "control" && !access.canWrite) {
      socket.emit("protocol.error", {
        errorCode: "PRODUCTION_LEASE_REQUIRED",
        message: "Another operator owns the production lease"
      });
    }
  }
  socket.data.sessionAccess = access;
  const namespace = access?.stateNamespace ?? "production";
  const snapshot = await snapshotProvider(access);
  if (snapshot) {
    socket.emit("state.snapshot", snapshot);
  }
  await socket.join([role, `namespace:${namespace}`]);
  socket.emit("connection.statusChanged", {
    status: "synchronized",
    role,
    canWrite: access?.canWrite ?? false,
    namespace
  });
}

export function attachSocketServer(
  httpServer: HttpServer,
  snapshotProvider: (
    access: SessionAccess | null
  ) => StateSnapshot | null | Promise<StateSnapshot | null>,
  leases = new ProductionLeaseManager()
): SocketIoServer {
  const io = new SocketIoServer(httpServer, {
    serveClient: false,
    connectionStateRecovery: {
      maxDisconnectionDuration: 10_000,
      skipMiddlewares: false
    }
  });

  io.on("connection", (socket) => {
    void admitSocket(socket, snapshotProvider, leases).catch(() => {
      socket.disconnect(true);
    });
  });
  return io;
}
