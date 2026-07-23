# Tasks: Primer ciclo vertical de partido

**Input**: Design documents from `specs/001-first-vertical-slice/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`,
`contracts/`, `ui-design.md`, `quickstart.md`

**Tests**: Required by the StreamCtrl.app constitution. Test tasks precede the
implementation they validate.

**Organization**: Tasks are grouped by user story and retain requirement IDs for
traceability.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel after its phase prerequisites.
- **[Story]**: Maps the task to a user story in `spec.md`.

## Phase 1: Setup

**Purpose**: Establish the monorepo, repeatable commands and repository policy.

- [ ] T001 Create pnpm workspace and root scripts in `package.json` and `pnpm-workspace.yaml`
- [ ] T002 [P] Add strict shared TypeScript configuration in `tsconfig.base.json`
- [ ] T003 [P] Configure ESLint and Prettier in `eslint.config.js` and `.prettierrc.json`
- [ ] T004 [P] Configure Vitest workspace and coverage in `vitest.workspace.ts`
- [ ] T005 [P] Configure Playwright projects for control and overlay in `playwright.config.ts`
- [ ] T006 Create application and package manifests under `apps/*/package.json` and `packages/*/package.json`
- [ ] T007 Add environment validation and documented defaults in `packages/contracts/src/environment.ts`
- [ ] T008 Add CI jobs for format, lint, typecheck, tests and build in `.github/workflows/ci.yml`

**Checkpoint**: A clean checkout can install dependencies and run all empty
quality commands consistently.

---

## Phase 2: Foundational

**Purpose**: Build the contracts and authority boundaries that block every user
story.

- [ ] T009 [P] Define branded IDs, revisions and timestamps in `packages/contracts/src/primitives.ts`
- [ ] T010 [P] Define command, event, acknowledgement and error envelopes for FR-002, FR-007 and FR-015 in `packages/contracts/src/realtime.ts`
- [ ] T011 [P] Define Match, Team, MatchClock and MatchFormat schemas for FR-001, FR-004, FR-005 and FR-006 in `packages/contracts/src/match.ts`
- [ ] T012 [P] Define GraphicCue, GraphicsState and StateSnapshot schemas for FR-009, FR-013 and FR-016 in `packages/contracts/src/graphics.ts`
- [ ] T013 Add contract parsing and version rejection tests in `packages/contracts/tests/contracts.test.ts`
- [ ] T014 Implement migration runner and initial schema in `packages/database/src/migrations/001-initial.sql` and `packages/database/src/migrate.ts`
- [ ] T015 Implement WAL database lifecycle and backup guard in `packages/database/src/database.ts`
- [ ] T016 Implement atomic command receipt, event and projection transaction for FR-017 in `packages/database/src/repositories/match-repository.ts`
- [ ] T017 Add migration, rollback and atomic failure tests in `packages/database/tests/database.test.ts`
- [ ] T018 Implement structured local logging with redaction and rotation in `apps/server/src/logging.ts`
- [ ] T019 Implement loopback-only configuration and health endpoint from `contracts/openapi.yaml` in `apps/server/src/http/health.ts`
- [ ] T020 Implement production lease and isolated rehearsal session rules for FR-021 in `apps/server/src/sessions/production-lease.ts`

**Checkpoint**: Contracts validate at runtime, storage is transactional and only
one production authority can accept commands.

---

## Phase 3: User Story 1 - Operar marcador y reloj (Priority: P1) MVP

**Goal**: Create/load a match and operate score, period and clock with a complete
audit trail.

**Independent Test**: Run the Scenario A sequence from `quickstart.md` without
the graphics applications and verify revisions, clock behavior and history.

### Tests for User Story 1

- [ ] T021 [P] [US1] Add match transition tests for FR-001, FR-003, FR-005, FR-006 and FR-008 in `packages/core/tests/match.test.ts`
- [ ] T022 [P] [US1] Add deterministic clock tests for start, pause, correction, added time and two-hour drift in `packages/core/tests/clock.test.ts`
- [ ] T023 [P] [US1] Add idempotency and revision-conflict contract tests for FR-015 in `apps/server/tests/commands.test.ts`
- [ ] T024 [US1] Add persisted restore integration test for FR-018 in `apps/server/tests/match-restore.test.ts`

### Implementation for User Story 1

- [ ] T025 [P] [US1] Implement pure Match aggregate and transition results in `packages/core/src/match.ts`
- [ ] T026 [P] [US1] Implement timestamp-based MatchClock in `packages/core/src/clock.ts`
- [ ] T027 [US1] Implement append-only correction and undo transitions for FR-008 in `packages/core/src/history.ts`
- [ ] T028 [US1] Implement create, load, score, period and clock command handlers in `apps/server/src/commands/match-commands.ts`
- [ ] T029 [US1] Implement snapshot query and restore orchestration for FR-016 and FR-018 in `apps/server/src/state/snapshot-service.ts`
- [ ] T030 [P] [US1] Build match setup form in `apps/control/src/features/match/MatchSetup.tsx`
- [ ] T031 [P] [US1] Build score, period and clock controls in `apps/control/src/features/match/MatchControls.tsx`
- [ ] T032 [P] [US1] Build connection, revision and action history status in `apps/control/src/features/status/StatusAndHistory.tsx`
- [ ] T033 [US1] Connect the control panel to command acknowledgements and snapshots in `apps/control/src/state/match-store.ts`

**Checkpoint**: User Story 1 is usable as a local match-control MVP and survives
a full application restart.

---

## Phase 4: User Story 2 - Llevar gráficos a Program (Priority: P2)

**Goal**: Preview and take a scorebug and lower third, with a deterministic
emergency clear.

**Independent Test**: Run Scenario B from `quickstart.md` with separate Preview
and Program pages and verify that edits never leak to Program.

### Tests for User Story 2

- [ ] T034 [P] [US2] Add cue validation and exclusion tests for FR-009 through FR-013 in `packages/graphics/tests/cues.test.ts`
- [ ] T035 [P] [US2] Add overlay snapshot and revision-order tests in `apps/overlay/tests/program-state.test.ts`
- [ ] T036 [P] [US2] Add accessible panel interaction tests for FR-012 through FR-014 in `apps/control/tests/graphics-controls.test.tsx`
- [ ] T037 [US2] Add end-to-end Preview/Take/all.hide journey in `tests/e2e/graphics-program.spec.ts`

### Implementation for User Story 2

- [ ] T038 [P] [US2] Implement cue coordinator and Program projection in `packages/graphics/src/cue-coordinator.ts`
- [ ] T039 [P] [US2] Implement reusable animation lifecycle and interruption cleanup in `packages/graphics/src/timeline.ts`
- [ ] T040 [US2] Implement graphics command handlers and atomic all.hide for FR-013 in `apps/server/src/commands/graphics-commands.ts`
- [ ] T041 [P] [US2] Implement scorebug component from `ui-design.md` in `apps/overlay/src/graphics/Scorebug.tsx`
- [ ] T042 [P] [US2] Implement lower-third component from `ui-design.md` in `apps/overlay/src/graphics/LowerThird.tsx`
- [ ] T043 [US2] Implement clean Program and operator Preview routes in `apps/overlay/src/routes.tsx`
- [ ] T044 [US2] Build Preview/Program panes, cue controls and persistent all.hide in `apps/control/src/features/graphics/GraphicsWorkspace.tsx`

**Checkpoint**: Scorebug and lower third are independently operable through one
Program output.

---

## Phase 5: User Story 3 - Recuperarse durante una transmisión (Priority: P3)

**Goal**: Recover clients and the full application without duplicate actions or
manual state reconstruction.

**Independent Test**: Run Scenario C from `quickstart.md`, forcing client,
transport, storage and optional-adapter failures.

### Tests for User Story 3

- [ ] T045 [P] [US3] Add reconnect, event-gap and fallback snapshot tests for FR-016 in `apps/server/tests/recovery.test.ts`
- [ ] T046 [P] [US3] Add duplicate delivery and pending acknowledgement tests for FR-015 in `apps/control/tests/reconnect.test.ts`
- [ ] T047 [P] [US3] Add transaction-failure test proving no unpersisted event is published for FR-017 in `apps/server/tests/persistence-failure.test.ts`
- [ ] T048 [P] [US3] Add vMix-adapter isolation tests for FR-020 in `packages/adapters/tests/vmix.test.ts`
- [ ] T049 [US3] Add full restart and restore end-to-end test for FR-018 in `tests/recovery/full-restart.spec.ts`

### Implementation for User Story 3

- [ ] T050 [P] [US3] Implement connection recovery with revision-gap detection in `apps/server/src/realtime/recovery.ts`
- [ ] T051 [US3] Implement snapshot-first room admission and ordered publication in `apps/server/src/realtime/socket-server.ts`
- [ ] T052 [P] [US3] Implement client reconnection state machine in `apps/control/src/realtime/reconnect.ts`
- [ ] T053 [P] [US3] Implement Program reconnection state machine in `apps/overlay/src/realtime/reconnect.ts`
- [ ] T054 [US3] Implement Electron service supervision and restore prompt in `apps/desktop/src/main.ts`
- [ ] T055 [US3] Implement bounded, optional vMix HTTP adapter with circuit breaker in `packages/adapters/src/vmix-http.ts`

**Checkpoint**: Restart and dependency-failure scenarios restore the last
confirmed state within specification thresholds.

---

## Phase 6: User Story 4 - Validar la salida en vMix (Priority: P4)

**Goal**: Prove transparency, 1080p60 behavior, stability and recovery in the
actual vMix Browser Input.

**Independent Test**: Complete Scenario D and the two-hour protocol from
`quickstart.md` on the reference hardware.

### Tests for User Story 4

- [ ] T056 [P] [US4] Add transparent-frame and safe-area visual snapshots for FR-019 in `apps/overlay/tests/visual/program.spec.ts`
- [ ] T057 [P] [US4] Add frame-time, memory and clock-drift collector for FR-024 in `tests/endurance/metrics.ts`
- [ ] T058 [US4] Add automated two-hour rehearsal driver for SC-007 through SC-009 in `tests/endurance/two-hour-match.spec.ts`

### Implementation and validation for User Story 4

- [ ] T059 [P] [US4] Add production CSP, transparent body and diagnostic-free Program shell in `apps/overlay/src/program.css` and `apps/overlay/index.html`
- [ ] T060 [P] [US4] Add separate diagnostics dashboard in `apps/control/src/features/diagnostics/Diagnostics.tsx`
- [ ] T061 [US4] Add performance artifact writer and machine manifest in `tests/endurance/report.ts`
- [ ] T062 [US4] Execute and record Browser Input validation using `specs/001-first-vertical-slice/quickstart.md`
- [ ] T063 [US4] Document measured reference results and any threshold exception in `docs/validation/reference-hardware.md`

**Checkpoint**: The single transparent Program source passes the vMix and
endurance protocols on documented hardware.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T064 [P] Add Spanish UI strings and terminology glossary in `apps/control/src/i18n/es.ts` and `docs/glossary.md`
- [ ] T065 [P] Add keyboard navigation, visible focus and non-color status checks in `apps/control/tests/accessibility.spec.ts`
- [ ] T066 Add import/export and manual backup package for the pre-final procedure in `apps/server/src/backup/match-package.ts`
- [ ] T067 Add clean shutdown, crash marker and log export in `apps/desktop/src/lifecycle.ts`
- [ ] T068 Run dependency audit and document accepted risks in `docs/security/dependency-audit.md`
- [ ] T069 Run every command and scenario in `specs/001-first-vertical-slice/quickstart.md`
- [ ] T070 Update root usage and vMix setup instructions in `README.md`

---

## Dependencies & Execution Order

### Phase dependencies

- Setup → Foundational → US1 → US2.
- US3 depends on the authoritative flows from US1 and US2.
- US4 depends on US2 and US3.
- Polish follows all selected user stories.

### User story dependencies

```text
US1 Match authority
 └── US2 Program graphics
      └── US3 Recovery
           └── US4 vMix validation
```

Although implementation is sequential at story level, `[P]` tasks inside a
phase can run concurrently after the preceding checkpoint.

## Parallel Execution Examples

### User Story 1

After T020, run T021–T023 in parallel; after their failures are established, run
T025 and T026 in parallel. T030–T032 can proceed in parallel once command
contracts stabilize.

### User Story 2

Run T034–T036 in parallel, then T038 and T039, then T041 and T042. T037 remains
the final story gate.

### User Story 3

Run T045–T048 in parallel. Implement T050, T052, T053 and T055 in parallel
before integrating T051 and T054.

### User Story 4

Run T056 and T057 in parallel. T059 and T060 can proceed in parallel before the
full endurance and vMix validation.

## Implementation Strategy

### MVP first

Complete Setup, Foundational and User Story 1. This yields a persistent,
testable match-control application even before graphics.

### First usable broadcast slice

Add User Story 2. This is the earliest version that can produce graphics for
vMix, but it is not final-ready until User Stories 3 and 4 pass.

### Production candidate

Complete User Stories 3 and 4 plus all Polish gates. No release may be described
as final-ready without recorded recovery and endurance evidence.
