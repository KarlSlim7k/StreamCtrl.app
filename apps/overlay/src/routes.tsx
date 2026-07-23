import type { GraphicsState, Match, Team } from "@streamctrl/contracts";

import { LowerThird } from "./graphics/LowerThird.js";
import { Scorebug } from "./graphics/Scorebug.js";

export interface OverlayRouteProps {
  graphics: GraphicsState;
  match: Match | null;
  teams: readonly [Team, Team] | null;
  elapsedMs?: number;
}

function GraphicsLayer({ graphics, match, teams, elapsedMs = 0 }: OverlayRouteProps) {
  const lowerThird = graphics.lowerThird?.payload as
    { primaryText?: string; secondaryText?: string } | undefined;

  return (
    <main className="graphics-layer">
      {graphics.scorebug && match && teams && (
        <Scorebug match={match} teams={teams} elapsedMs={elapsedMs} />
      )}
      {lowerThird?.primaryText && lowerThird.secondaryText && (
        <LowerThird primaryText={lowerThird.primaryText} secondaryText={lowerThird.secondaryText} />
      )}
    </main>
  );
}

export function ProgramRoute(props: OverlayRouteProps) {
  return <GraphicsLayer {...props} />;
}

export function PreviewRoute(props: OverlayRouteProps) {
  return (
    <section className="preview-route">
      <h1>Preview</h1>
      <GraphicsLayer {...props} />
    </section>
  );
}
