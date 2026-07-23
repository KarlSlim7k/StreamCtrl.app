import { useState } from "react";

import {
  GraphicCueSchema,
  type CommandAcknowledgement,
  type GraphicCue,
  type GraphicsState
} from "@streamctrl/contracts";

import { es } from "../../i18n/es.js";

interface LowerThirdDraft {
  primaryText: string;
  secondaryText: string;
}

export interface GraphicsWorkspaceProps {
  graphics: GraphicsState;
  onPreview(cue: GraphicCue): Promise<CommandAcknowledgement>;
  onTake(type: "scorebug" | "lowerThird"): Promise<CommandAcknowledgement>;
  onHide(type: "scorebug" | "lowerThird"): Promise<CommandAcknowledgement>;
  onAllHide(): Promise<CommandAcknowledgement>;
}

function cue(type: "scorebug" | "lowerThird", payload: Record<string, unknown>): GraphicCue {
  return GraphicCueSchema.parse({
    cueId: crypto.randomUUID() as never,
    type,
    action: "preview",
    layer: type === "scorebug" ? 10 : 20,
    payload,
    requestedAt: new Date().toISOString() as never
  });
}

function acknowledgementText(
  acknowledgement: CommandAcknowledgement,
  acceptedMessage: string
): string {
  return acknowledgement.accepted ? acceptedMessage : acknowledgement.message;
}

export function GraphicsWorkspace(props: GraphicsWorkspaceProps) {
  const [draft, setDraft] = useState<LowerThirdDraft>({ primaryText: "", secondaryText: "" });
  const [preview, setPreview] = useState<LowerThirdDraft | null>(null);
  const [scorebugPrepared, setScorebugPrepared] = useState(false);
  const [feedback, setFeedback] = useState("");

  async function previewLowerThird() {
    if (!draft.primaryText.trim()) {
      setFeedback(es.graphics.missingPrimary);
      return;
    }
    if (!draft.secondaryText.trim()) {
      setFeedback(es.graphics.missingFunction);
      return;
    }
    const acknowledgement = await props.onPreview(cue("lowerThird", { ...draft }));
    if (acknowledgement.accepted) setPreview({ ...draft });
    setFeedback(acknowledgementText(acknowledgement, es.graphics.lowerThirdReady));
  }

  async function takeLowerThird() {
    if (!preview) {
      setFeedback(es.graphics.prepareFirst);
      return;
    }
    const acknowledgement = await props.onTake("lowerThird");
    setFeedback(acknowledgementText(acknowledgement, es.graphics.lowerThirdOnProgram));
  }

  async function toggleScorebug() {
    if (props.graphics.scorebug) {
      const acknowledgement = await props.onHide("scorebug");
      setFeedback(acknowledgementText(acknowledgement, "Marcador oculto"));
      return;
    }
    if (!scorebugPrepared) {
      const acknowledgement = await props.onPreview(cue("scorebug", {}));
      if (acknowledgement.accepted) setScorebugPrepared(true);
      setFeedback(acknowledgementText(acknowledgement, "Marcador listo en Preview"));
      return;
    }
    const acknowledgement = await props.onTake("scorebug");
    setFeedback(acknowledgementText(acknowledgement, "Marcador confirmado en Program"));
  }

  async function allHide() {
    const acknowledgement = await props.onAllHide();
    setFeedback(acknowledgementText(acknowledgement, es.graphics.programClean));
  }

  const program = props.graphics.lowerThird?.payload as
    { primaryText?: string; secondaryText?: string } | undefined;
  const onAir = Boolean(props.graphics.scorebug || props.graphics.lowerThird);

  return (
    <main>
      <button className="all-hide" onClick={() => void allHide()}>
        {es.graphics.allHide}
      </button>
      <section aria-label={es.graphics.preview}>
        <h2>{es.graphics.preview}</h2>
        <div data-testid="preview-lower-third">
          {preview && (
            <>
              <strong>{preview.primaryText}</strong>
              <span>{preview.secondaryText}</span>
            </>
          )}
        </div>
      </section>
      <section aria-label={es.graphics.program}>
        <h2>
          {es.graphics.program} ·{" "}
          {onAir
            ? es.app.live.toLocaleUpperCase("es-MX")
            : es.graphics.clean.toLocaleUpperCase("es-MX")}
        </h2>
        <div data-testid="program-lower-third">
          {program?.primaryText && program.secondaryText && (
            <>
              <strong>{program.primaryText}</strong>
              <span>{program.secondaryText}</span>
            </>
          )}
        </div>
      </section>
      <section aria-label={es.graphics.cues}>
        <button onClick={() => void toggleScorebug()}>
          {props.graphics.scorebug
            ? es.graphics.hideScorebug
            : scorebugPrepared
              ? "Tomar marcador"
              : "Preparar marcador"}
        </button>
        <label>
          {es.graphics.nameLabel}
          <input
            maxLength={120}
            value={draft.primaryText}
            onChange={(event) => setDraft({ ...draft, primaryText: event.target.value })}
          />
        </label>
        <label>
          {es.graphics.functionLabel}
          <input
            maxLength={160}
            value={draft.secondaryText}
            onChange={(event) => setDraft({ ...draft, secondaryText: event.target.value })}
          />
        </label>
        <button onClick={() => void previewLowerThird()}>{es.graphics.previewLowerThird}</button>
        <button disabled={!preview} onClick={() => void takeLowerThird()}>
          {es.graphics.takeLowerThird}
        </button>
        <button
          onClick={async () => {
            const acknowledgement = await props.onHide("lowerThird");
            setFeedback(acknowledgementText(acknowledgement, es.graphics.lowerThirdHidden));
          }}
        >
          {es.graphics.lowerThirdHidden}
        </button>
      </section>
      <p aria-live="polite" role="status">
        {feedback}
      </p>
    </main>
  );
}
