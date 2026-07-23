import { StateSnapshotSchema, type StateSnapshot } from "@streamctrl/contracts";
import { io, type Socket } from "socket.io-client";

export interface OverlayClientOptions {
  role: "overlay-program" | "overlay-preview";
  serverUrl: string | undefined;
  sessionId?: string;
  mode?: "production" | "rehearsal";
  onSnapshot(snapshot: StateSnapshot): void;
  onConnection(connected: boolean): void;
}

export class OverlayRealtimeClient {
  readonly #socket: Socket;

  constructor(options: OverlayClientOptions) {
    this.#socket = io(options.serverUrl, {
      autoConnect: false,
      auth: {
        role: options.role,
        ...(options.role === "overlay-preview"
          ? {
              sessionId: options.sessionId ?? "streamctrl-operator",
              mode: options.mode ?? "production"
            }
          : {})
      },
      reconnection: true,
      reconnectionDelay: 250,
      timeout: 2_000
    });
    this.#socket.on("connect", () => options.onConnection(true));
    this.#socket.on("disconnect", () => options.onConnection(false));
    this.#socket.on("state.snapshot", (input) =>
      options.onSnapshot(StateSnapshotSchema.parse(input))
    );
  }

  connect(): void {
    this.#socket.connect();
  }

  disconnect(): void {
    this.#socket.disconnect();
  }
}
