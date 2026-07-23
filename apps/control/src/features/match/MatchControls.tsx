import type { ClockMode, Period } from "@streamctrl/contracts";

export interface MatchControlsProps {
  homeName: string;
  awayName: string;
  homeScore: number;
  awayScore: number;
  clockText: string;
  clockMode: ClockMode;
  period: Period;
  disabled?: boolean;
  onScore(home: number, away: number): void;
  onClock(action: "start" | "pause" | "stop"): void;
  onPeriod(period: Period): void;
  onClose(): void;
  onUndo(): void;
}

export function MatchControls(props: MatchControlsProps) {
  return (
    <section aria-label="Controles del partido">
      <div>
        <span>{props.homeName}</span>
        <output aria-label={`Marcador de ${props.homeName}`}>{props.homeScore}</output>
        <button
          disabled={props.disabled}
          onClick={() => props.onScore(props.homeScore + 1, props.awayScore)}
        >
          Sumar gol local
        </button>
        <button
          disabled={props.disabled || props.homeScore === 0}
          onClick={() => props.onScore(Math.max(0, props.homeScore - 1), props.awayScore)}
        >
          Corregir gol local
        </button>
      </div>
      <div>
        <span>{props.awayName}</span>
        <output aria-label={`Marcador de ${props.awayName}`}>{props.awayScore}</output>
        <button
          disabled={props.disabled}
          onClick={() => props.onScore(props.homeScore, props.awayScore + 1)}
        >
          Sumar gol visitante
        </button>
        <button
          disabled={props.disabled || props.awayScore === 0}
          onClick={() => props.onScore(props.homeScore, Math.max(0, props.awayScore - 1))}
        >
          Corregir gol visitante
        </button>
      </div>
      <output aria-label="Reloj oficial">{props.clockText}</output>
      <button
        disabled={props.disabled || props.clockMode === "running"}
        onClick={() => props.onClock("start")}
      >
        Iniciar reloj
      </button>
      <button
        disabled={props.disabled || props.clockMode !== "running"}
        onClick={() => props.onClock("pause")}
      >
        Pausar reloj
      </button>
      <button disabled={props.disabled} onClick={() => props.onClock("stop")}>
        Detener reloj
      </button>
      <label>
        Periodo
        <select
          disabled={props.disabled}
          value={props.period}
          onChange={(event) => props.onPeriod(event.target.value as Period)}
        >
          <option value="preMatch">Previa</option>
          <option value="firstHalf">Primer tiempo</option>
          <option value="halfTime">Descanso</option>
          <option value="secondHalf">Segundo tiempo</option>
          <option value="extraTimeFirst">Prórroga 1</option>
          <option value="extraTimeSecond">Prórroga 2</option>
          <option value="penalties">Penales</option>
          <option value="fullTime">Final</option>
        </select>
      </label>
      <button disabled={props.disabled} onClick={props.onUndo}>
        Deshacer última acción
      </button>
      <button disabled={props.disabled || props.period === "fullTime"} onClick={props.onClose}>
        Cerrar partido
      </button>
    </section>
  );
}
