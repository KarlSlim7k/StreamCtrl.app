import {
  CommandAcknowledgementSchema,
  type CommandAcknowledgement,
  type CommandType
} from "@streamctrl/contracts";
import { io, type Socket } from "socket.io-client";

import type { MatchStore } from "../state/match-store.js";

export interface ControlClientOptions {
  serverUrl: string | undefined;
  sessionId: string;
  mode: "production" | "rehearsal";
  store: {
    getState(): MatchStore;
  };
}

export class ControlRealtimeClient {
  readonly #socket: Socket;

  constructor(private readonly options: ControlClientOptions) {
    this.#socket = io(options.serverUrl, {
      autoConnect: false,
      auth: {
        role: "control",
        sessionId: options.sessionId,
        mode: options.mode
      },
      reconnection: true,
      reconnectionDelay: 250,
      timeout: 2_000
    });
    this.#socket.on("connect", () => options.store.getState().setConnected(true));
    this.#socket.on("disconnect", () => options.store.getState().setConnected(false));
    this.#socket.on("state.snapshot", (snapshot) =>
      options.store.getState().applySnapshot(snapshot)
    );
    this.#socket.on("protocol.error", () => options.store.getState().setConnected(false));
  }

  connect(): void {
    this.#socket.connect();
  }

  disconnect(): void {
    this.#socket.disconnect();
  }

  send(type: CommandType, payload: Record<string, unknown>): Promise<CommandAcknowledgement> {
    const commandId =
      typeof payload.commandId === "string" ? payload.commandId : crypto.randomUUID();
    this.options.store.getState().beginCommand(commandId);
    const envelope = {
      protocolVersion: 1,
      messageId: crypto.randomUUID(),
      type,
      sentAt: new Date().toISOString(),
      payload: { ...payload, commandId }
    };

    return new Promise((resolve) => {
      const timeout = window.setTimeout(() => {
        const acknowledgement = CommandAcknowledgementSchema.parse({
          accepted: false,
          commandId,
          errorCode: "INVALID_TRANSITION",
          message: "El servidor no confirmó la acción a tiempo.",
          currentRevision: this.options.store.getState().snapshot?.matchRevision ?? null
        });
        this.options.store.getState().acknowledge(acknowledgement);
        resolve(acknowledgement);
      }, 3_000);

      this.#socket.emit("command", envelope, (input: unknown) => {
        window.clearTimeout(timeout);
        const acknowledgement = CommandAcknowledgementSchema.parse(input);
        this.options.store.getState().acknowledge(acknowledgement);
        resolve(acknowledgement);
      });
    });
  }
}
