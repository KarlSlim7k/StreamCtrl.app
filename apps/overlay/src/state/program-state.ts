import { GraphicsStateSchema, type GraphicsState } from "@streamctrl/contracts";

export type ApplyResult = "applied" | "ignored" | "snapshot-required";

export class ProgramStateController {
  #current: GraphicsState | null = null;

  get current(): GraphicsState | null {
    return this.#current ? structuredClone(this.#current) : null;
  }

  applySnapshot(input: unknown): ApplyResult {
    this.#current = GraphicsStateSchema.parse(input);
    return "applied";
  }

  applyEvent(input: unknown): ApplyResult {
    const event = GraphicsStateSchema.parse(input);
    if (!this.#current) {
      return "snapshot-required";
    }
    if (event.programRevision <= this.#current.programRevision) {
      return "ignored";
    }
    if (event.programRevision !== this.#current.programRevision + 1) {
      return "snapshot-required";
    }
    this.#current = event;
    return "applied";
  }
}
