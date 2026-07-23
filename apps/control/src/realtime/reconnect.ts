export interface PendingCommand {
  commandId: string;
  type: string;
}

export type ControlConnectionState = "disconnected" | "snapshot-required" | "synchronized";

export class ControlReconnectStateMachine {
  #state: ControlConnectionState = "disconnected";
  #revision: number | null = null;
  readonly #pending = new Map<string, PendingCommand>();

  get state(): ControlConnectionState {
    return this.#state;
  }

  get revision(): number | null {
    return this.#revision;
  }

  queue(command: PendingCommand): void {
    if (!this.#pending.has(command.commandId)) {
      this.#pending.set(command.commandId, structuredClone(command));
    }
  }

  acknowledge(commandId: string): void {
    this.#pending.delete(commandId);
  }

  pendingForRetry(): PendingCommand[] {
    return [...this.#pending.values()].map((command) => structuredClone(command));
  }

  connected(): void {
    this.#state = "snapshot-required";
    this.#revision = null;
  }

  synchronized(revision: number): void {
    this.#state = "synchronized";
    this.#revision = revision;
  }

  disconnected(): void {
    this.#state = "disconnected";
    this.#revision = null;
  }
}
