# Data Model: Primer ciclo vertical de partido

## Conventions

- Todos los identificadores son strings opacos y estables.
- Fechas persistidas en UTC ISO 8601.
- `revision` es un entero monotónico por partido.
- Cada transición confirmada guarda estado e historial en una transacción.
- Los registros históricos no se eliminan; una corrección agrega otro registro.

## Match

| Field | Type | Rules |
|---|---|---|
| id | MatchId | Unique and immutable |
| name | string | 1–120 characters |
| status | MatchStatus | Controlled transition |
| homeTeamId | TeamId | Required, distinct from away |
| awayTeamId | TeamId | Required, distinct from home |
| currentPeriod | Period | Required |
| format | MatchFormat | Durations and enabled phases |
| clock | MatchClock | Embedded official clock |
| revision | integer | Starts at 0, strictly increasing |
| createdAt | timestamp | Immutable |
| updatedAt | timestamp | Updated on confirmation |

`MatchStatus`: `setup → ready → live ↔ paused → finished`.
`finished → live` requires an explicit correction command.

## MatchFormat

| Field | Type | Rules |
|---|---|---|
| regulationPeriods | integer | Default 2 |
| regulationMinutes | integer | Default 45 per period |
| extraTimeEnabled | boolean | Default true |
| extraTimePeriods | integer | Default 2 when enabled |
| extraTimeMinutes | integer | Default 15 |
| penaltiesEnabled | boolean | Default true |

## Team

| Field | Type | Rules |
|---|---|---|
| id | TeamId | Unique |
| fullName | string | 1–80 characters |
| shortName | string | 1–12 characters |
| primaryColor | color | Valid opaque color |
| secondaryColor | color | Valid opaque color |
| score | non-negative integer | Corrections are audited |
| penaltyScore | non-negative integer | Used only in penalties |

## MatchClock

| Field | Type | Rules |
|---|---|---|
| mode | ClockMode | `stopped`, `running`, `paused` |
| accumulatedMs | non-negative integer | Official elapsed value at anchor |
| startedAtMonotonicMs | number or null | Present only while running |
| displayOffsetMs | integer | Explicit correction |
| addedTimeMinutes | non-negative integer | Set manually |
| lastSyncedAt | timestamp | Diagnostic reference |

Displayed time while running:
`accumulatedMs + (monotonicNow - startedAtMonotonicMs) + displayOffsetMs`.

## MatchEvent

| Field | Type | Rules |
|---|---|---|
| id | EventId | Unique |
| matchId | MatchId | Required |
| kind | EventKind | score, clock, period, correction, restore |
| payload | validated object | Kind-specific |
| revision | integer | Revision produced |
| occurredAt | timestamp | Required |
| supersedesEventId | EventId or null | Links corrections |

## CommandReceipt

| Field | Type | Rules |
|---|---|---|
| commandId | string | Unique idempotency key |
| matchId | MatchId | Required |
| type | string | Versioned command name |
| accepted | boolean | Required |
| errorCode | string or null | Required when rejected |
| resultingRevision | integer or null | Present when accepted |
| receivedAt | timestamp | Required |
| operatorSessionId | SessionId | Required |

Repeated `commandId` returns the original receipt and never reapplies a
transition.

## GraphicCue

| Field | Type | Rules |
|---|---|---|
| cueId | CueId | Unique |
| type | CueType | scorebug, lowerThird, allHide |
| action | CueAction | preview, take, hide |
| payload | validated object | Snapshot at take time |
| layer | integer | Fixed by cue type in MVP |
| requestedAt | timestamp | Required |

## GraphicsState

| Field | Type | Rules |
|---|---|---|
| programRevision | integer | Monotonic |
| scorebug | GraphicInstance or null | At most one |
| lowerThird | GraphicInstance or null | At most one |
| updatedAt | timestamp | Required |

`all.hide` atomically sets both instances to null. It does not change Match.

## StateSnapshot

| Field | Type | Rules |
|---|---|---|
| protocolVersion | integer | Starts at 1 |
| matchRevision | integer | Required |
| graphicsRevision | integer | Required |
| match | Match | Complete |
| teams | Team[2] | Exactly two |
| graphics | GraphicsState | Complete |
| generatedAt | timestamp | Required |

## OperatorSession

| Field | Type | Rules |
|---|---|---|
| id | SessionId | Unique per launch |
| mode | SessionMode | production or rehearsal |
| startedAt | timestamp | Required |
| lastSeenAt | timestamp | Required |

Only one production session may issue commands in the MVP. Additional clients
are read-only. A rehearsal session writes to an isolated match instance.

## Transaction Boundaries

For an accepted command, one database transaction MUST:

1. Verify idempotency and expected revision.
2. Insert the command receipt.
3. Insert the immutable match event.
4. Update the current match or graphics projection.
5. Commit before publishing the resulting event.

If any step fails, no event is published and the previous revision remains
official.
