import {
  GraphicCueSchema,
  GraphicsStateSchema,
  type GraphicCue,
  type GraphicInstance,
  type GraphicsState
} from "@streamctrl/contracts";

type OnAirCueType = "scorebug" | "lowerThird";

export interface PreviewState {
  scorebug: Extract<GraphicCue, { type: "scorebug" }> | null;
  lowerThird: Extract<GraphicCue, { type: "lowerThird" }> | null;
}

export class GraphicsRevisionConflictError extends Error {
  constructor(
    readonly expectedRevision: number,
    readonly currentRevision: number
  ) {
    super(`Expected graphics revision ${expectedRevision}, current is ${currentRevision}`);
    this.name = "GraphicsRevisionConflictError";
  }
}

export class CueCoordinator {
  #program: GraphicsState;
  #preview: PreviewState = { scorebug: null, lowerThird: null };

  constructor(initialTimestamp: string, initialState?: GraphicsState) {
    this.#program =
      initialState ??
      GraphicsStateSchema.parse({
        programRevision: 0,
        scorebug: null,
        lowerThird: null,
        updatedAt: initialTimestamp
      });
  }

  get program(): GraphicsState {
    return structuredClone(this.#program);
  }

  get previewState(): PreviewState {
    return structuredClone(this.#preview);
  }

  preview(input: unknown): PreviewState {
    const cue = GraphicCueSchema.parse(input);
    if (cue.type === "allHide") {
      throw new Error("all.hide cannot be staged in Preview");
    }
    this.#preview = { ...this.#preview, [cue.type]: cue };
    return this.previewState;
  }

  take(type: OnAirCueType, expectedRevision: number, occurredAt: string): GraphicsState {
    this.assertRevision(expectedRevision);
    const cue = this.#preview[type];
    if (!cue) {
      throw new Error(`No ${type} cue is available in Preview`);
    }

    const instance: GraphicInstance = {
      cueId: cue.cueId,
      type,
      payload: cue.payload,
      shownAt: occurredAt as never
    };
    this.#program = GraphicsStateSchema.parse({
      ...this.#program,
      [type]: instance,
      programRevision: expectedRevision + 1,
      updatedAt: occurredAt
    });
    return this.program;
  }

  hide(type: OnAirCueType, expectedRevision: number, occurredAt: string): GraphicsState {
    this.assertRevision(expectedRevision);
    this.#program = GraphicsStateSchema.parse({
      ...this.#program,
      [type]: null,
      programRevision: expectedRevision + 1,
      updatedAt: occurredAt
    });
    return this.program;
  }

  allHide(expectedRevision: number, occurredAt: string): GraphicsState {
    this.assertRevision(expectedRevision);
    this.#program = GraphicsStateSchema.parse({
      ...this.#program,
      scorebug: null,
      lowerThird: null,
      programRevision: expectedRevision + 1,
      updatedAt: occurredAt
    });
    return this.program;
  }

  private assertRevision(expectedRevision: number): void {
    if (this.#program.programRevision !== expectedRevision) {
      throw new GraphicsRevisionConflictError(expectedRevision, this.#program.programRevision);
    }
  }
}
