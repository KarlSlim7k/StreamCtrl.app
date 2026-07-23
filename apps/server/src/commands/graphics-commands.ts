import type { GraphicsState } from "@streamctrl/contracts";
import { CueCoordinator } from "@streamctrl/graphics";

export class GraphicsCommandService {
  constructor(
    private coordinator: CueCoordinator,
    private readonly now: () => string = () => new Date().toISOString()
  ) {}

  preview(cue: unknown) {
    return this.coordinator.preview(cue);
  }

  take(type: "scorebug" | "lowerThird", expectedRevision: number): GraphicsState {
    return this.coordinator.take(type, expectedRevision, this.now());
  }

  hide(type: "scorebug" | "lowerThird", expectedRevision: number): GraphicsState {
    return this.coordinator.hide(type, expectedRevision, this.now());
  }

  allHide(expectedRevision: number): GraphicsState {
    return this.coordinator.allHide(expectedRevision, this.now());
  }

  get program(): GraphicsState {
    return this.coordinator.program;
  }

  restore(state: GraphicsState): void {
    this.coordinator = new CueCoordinator(state.updatedAt, state);
  }
}
