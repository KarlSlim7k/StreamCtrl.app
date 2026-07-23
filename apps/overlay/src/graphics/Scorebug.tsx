import type { Match, Team } from "@streamctrl/contracts";

function clockText(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1_000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function Scorebug({
  match,
  teams,
  elapsedMs
}: {
  match: Match;
  teams: readonly [Team, Team];
  elapsedMs: number;
}) {
  return (
    <section className="scorebug" aria-label="Marcador">
      <span className="scorebug__period">{match.currentPeriod}</span>
      <span title={teams[0].fullName}>{teams[0].shortName}</span>
      <strong>{teams[0].score}</strong>
      <span title={teams[1].fullName}>{teams[1].shortName}</span>
      <strong>{teams[1].score}</strong>
      <time>{clockText(elapsedMs)}</time>
      {match.clock.addedTimeMinutes > 0 && <span>+{match.clock.addedTimeMinutes}</span>}
    </section>
  );
}
