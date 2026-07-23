# Realtime Contract v1

## Transport roles

- `control`: may request snapshots and, when it owns the production lease, send
  commands.
- `overlay-program`: read-only; receives Program snapshots and events.
- `overlay-preview`: read-only; receives Preview state for the operator.
- `diagnostics`: read-only; receives health and measurement signals.

## Envelope

Every message uses:

```json
{
  "protocolVersion": 1,
  "messageId": "opaque-id",
  "type": "domain.action",
  "sentAt": "2026-07-23T12:00:00.000Z",
  "payload": {}
}
```

Unknown protocol versions or message types are rejected with a structured
error; they are never silently interpreted.

## Command

```json
{
  "protocolVersion": 1,
  "messageId": "msg-1",
  "type": "match.scoreSet",
  "sentAt": "2026-07-23T12:00:00.000Z",
  "payload": {
    "commandId": "cmd-1",
    "matchId": "match-1",
    "expectedRevision": 8,
    "home": 2,
    "away": 1
  }
}
```

The server replies with exactly one acknowledgement:

```json
{
  "accepted": true,
  "commandId": "cmd-1",
  "resultingRevision": 9
}
```

Rejected acknowledgements include a stable `errorCode`, a safe message and the
current revision. Reusing `commandId` returns the original acknowledgement.

## Commands

| Type | Required payload |
|---|---|
| `match.create` | teams, name, format |
| `match.load` | matchId |
| `match.scoreSet` | matchId, expectedRevision, home, away |
| `match.periodSet` | matchId, expectedRevision, period |
| `clock.start` | matchId, expectedRevision |
| `clock.pause` | matchId, expectedRevision |
| `clock.stop` | matchId, expectedRevision |
| `clock.correct` | matchId, expectedRevision, elapsedMs |
| `clock.addedTimeSet` | matchId, expectedRevision, minutes |
| `graphics.previewSet` | cue type and validated draft |
| `graphics.cueTake` | cueId, expected graphics revision |
| `graphics.cueHide` | cue type, expected graphics revision |
| `graphics.allHide` | expected graphics revision |
| `state.snapshotRequest` | last known revisions |

## Server events

| Type | Meaning |
|---|---|
| `state.snapshot` | Complete authoritative state |
| `match.stateChanged` | Confirmed match projection |
| `clock.synchronized` | Clock anchor for interpolation |
| `graphics.programChanged` | Confirmed Program projection |
| `command.rejected` | Safe rejection details |
| `connection.statusChanged` | Dependency status for control only |

## Ordering and recovery

1. A client receives a snapshot before incremental events.
2. Events with a revision less than or equal to the applied revision are
   discarded.
3. A gap triggers `state.snapshotRequest`.
4. Program never displays connection banners or errors.
5. Failed transport recovery always falls back to a full snapshot.

## Stable error codes

- `INVALID_PAYLOAD`
- `UNSUPPORTED_PROTOCOL`
- `REVISION_CONFLICT`
- `DUPLICATE_COMMAND`
- `INVALID_TRANSITION`
- `INCOMPLETE_CUE`
- `PRODUCTION_LEASE_REQUIRED`
- `PERSISTENCE_FAILED`
- `MATCH_NOT_FOUND`
- `VMIX_UNAVAILABLE`
