import { useState, type FormEvent } from "react";

export interface MatchSetupValue {
  name: string;
  homeName: string;
  homeShortName: string;
  awayName: string;
  awayShortName: string;
}

export function MatchSetup({ onCreate }: { onCreate(value: MatchSetupValue): void }) {
  const [value, setValue] = useState<MatchSetupValue>({
    name: "Final",
    homeName: "",
    homeShortName: "",
    awayName: "",
    awayShortName: ""
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onCreate(value);
  }

  return (
    <form aria-label="Crear partido" onSubmit={submit}>
      <label>
        Nombre del partido
        <input
          required
          value={value.name}
          onChange={(event) => setValue({ ...value, name: event.target.value })}
        />
      </label>
      <fieldset>
        <legend>Equipo local</legend>
        <input
          aria-label="Nombre del equipo local"
          required
          value={value.homeName}
          onChange={(event) => setValue({ ...value, homeName: event.target.value })}
        />
        <input
          aria-label="Abreviatura del equipo local"
          maxLength={12}
          required
          value={value.homeShortName}
          onChange={(event) => setValue({ ...value, homeShortName: event.target.value })}
        />
      </fieldset>
      <fieldset>
        <legend>Equipo visitante</legend>
        <input
          aria-label="Nombre del equipo visitante"
          required
          value={value.awayName}
          onChange={(event) => setValue({ ...value, awayName: event.target.value })}
        />
        <input
          aria-label="Abreviatura del equipo visitante"
          maxLength={12}
          required
          value={value.awayShortName}
          onChange={(event) => setValue({ ...value, awayShortName: event.target.value })}
        />
      </fieldset>
      <button type="submit">Crear partido</button>
    </form>
  );
}
