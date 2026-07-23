CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  state_json TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  side TEXT NOT NULL CHECK (side IN ('home', 'away')),
  state_json TEXT NOT NULL,
  UNIQUE (match_id, side)
);

CREATE TABLE match_events (
  id TEXT PRIMARY KEY,
  match_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision > 0),
  occurred_at TEXT NOT NULL,
  supersedes_event_id TEXT,
  UNIQUE (match_id, revision)
);

CREATE INDEX match_events_match_revision_idx
  ON match_events (match_id, revision);

CREATE TABLE command_receipts (
  command_id TEXT PRIMARY KEY,
  match_id TEXT,
  type TEXT NOT NULL,
  accepted INTEGER NOT NULL CHECK (accepted IN (0, 1)),
  error_code TEXT,
  resulting_revision INTEGER,
  received_at TEXT NOT NULL,
  operator_session_id TEXT NOT NULL,
  CHECK (
    (accepted = 1 AND resulting_revision IS NOT NULL AND error_code IS NULL)
    OR
    (accepted = 0 AND resulting_revision IS NULL AND error_code IS NOT NULL)
  )
);

CREATE INDEX command_receipts_match_idx
  ON command_receipts (match_id, received_at);

CREATE TABLE graphics_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  state_json TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 0),
  updated_at TEXT NOT NULL
);

CREATE TABLE operator_sessions (
  id TEXT PRIMARY KEY,
  mode TEXT NOT NULL CHECK (mode IN ('production', 'rehearsal')),
  state_namespace TEXT NOT NULL,
  started_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);
