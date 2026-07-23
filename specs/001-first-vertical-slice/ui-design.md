# Initial UI and Graphics Design

## Operator panel

Target: 1440x900 minimum, dark theme, keyboard operable.

```text
┌──────────────────────────────────────────────────────────────────────────┐
│ StreamCtrl  ● SERVER  ● DB  ○ vMIX      MATCH REV 42      [ALL HIDE]   │
├───────────────┬────────────────────────────────┬─────────────────────────┤
│ MATCH         │ PREVIEW                        │ PROGRAM                 │
│ Local   2 [+] │ ┌────────────────────────────┐ │ ┌─────────────────────┐ │
│ Visit.  1 [+] │ │ scaled 16:9 preview        │ │ scaled 16:9 program  │ │
│               │ └────────────────────────────┘ │ └─────────────────────┘ │
│ 67:14 [PAUSE] │                                │ On air: scorebug      │
│ +3  2ND HALF  ├────────────────────────────────┴─────────────────────────┤
│               │ CUES                                                     │
│ [UNDO]        │ [Scorebug SHOW/HIDE] [Lower third PREVIEW] [TAKE]        │
├───────────────┼──────────────────────────────────────────────────────────┤
│ PERIOD        │ LOWER THIRD                                              │
│ 1H HT 2H ET P │ Name [________________]  Role [________________]         │
│               │ Validation / action feedback                            │
├───────────────┴──────────────────────────────────────────────────────────┤
│ HISTORY  12:05 Score corrected 1-1 → 2-1 • operator • confirmed rev 42 │
└──────────────────────────────────────────────────────────────────────────┘
```

### Interaction rules

- Red is reserved for destructive/emergency meaning; `ALL HIDE` is always in
  the same top-right position.
- Program uses a red outline and explicit “ON AIR”; Preview uses amber.
- Score changes use dedicated plus/minus controls and keyboard shortcuts.
- Corrections display before/after values and require confirmation when they
  reduce a score or move the clock backwards.
- Disabled actions explain why on hover/focus and in the feedback area.
- Enter never takes a cue unless focus is inside the cue control.
- Repeated clicks are disabled until acknowledgement or timeout.
- Connection loss never covers Preview or Program; it appears in the status bar.

## Scorebug

Logical canvas: 1920x1080. Safe area: 5% on each edge.

```text
X=96, Y=54
┌────────┬────────────────┬─────┬────────────────┬────────┐
│  2H    │ LOCAL          │  2  │ VISITANTE      │  1     │
├────────┴────────────────┴─────┴────────────────┴────────┤
│ 67:14                                      +3          │
└─────────────────────────────────────────────────────────┘
```

- Maximum logical width: 720 px; height: 118 px.
- Team short names truncate visually after 12 characters but retain full text
  in data.
- Clock uses tabular numerals.
- Default entry: 280 ms; exit: 220 ms.
- Score and clock updates do not replay the full entry animation.
- Theme tokens control color, type and spacing; rules do not live in theme data.

## Lower third

```text
X=96, bottom=96
┌─────────────────────────────────────────────────────────┐
│ NOMBRE PRINCIPAL                                        │
│ Función / contexto                                      │
└─────────────────────────────────────────────────────────┘
```

- Maximum logical width: 820 px; height: 148 px.
- Name required, 60 characters maximum; role optional, 80 maximum.
- Default entry: 320 ms; exit: 240 ms.
- Taking another lower third first exits the current instance, then enters the
  replacement.
- `all.hide` interrupts timelines and reaches a clean final state.

## Accessibility and localization

- Panel text initially in Spanish; domain contracts use stable English keys.
- All controls include accessible names and visible focus.
- Status is never communicated only through color.
- Shortcuts are configurable and listed beside their actions.
- Animations respect a diagnostic reduced-motion mode; Program timing remains
  deterministic.

## Diagnostic view

`/diagnostics` may display revisions, frame time, connection state and memory.
It is a separate route and MUST NOT share visible diagnostic components with
`/overlay/program`.
