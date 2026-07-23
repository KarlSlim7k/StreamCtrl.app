import type { GraphicsState } from "@streamctrl/contracts";

import { ProgramStateController, type ApplyResult } from "../state/program-state.js";

export class ProgramReconnectStateMachine {
  readonly #controller = new ProgramStateController();
  #connected = false;

  get connected(): boolean {
    return this.#connected;
  }

  get current(): GraphicsState | null {
    return this.#controller.current;
  }

  onConnected(): void {
    this.#connected = true;
  }

  onDisconnected(): void {
    this.#connected = false;
  }

  applySnapshot(snapshot: unknown): ApplyResult {
    return this.#controller.applySnapshot(snapshot);
  }

  applyEvent(event: unknown): ApplyResult {
    return this.#controller.applyEvent(event);
  }
}
