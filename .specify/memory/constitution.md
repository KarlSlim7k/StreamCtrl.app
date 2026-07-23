<!--
Sync Impact Report
- Version change: template (unratified) -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Match State Is Authoritative
  - Template Principle 2 -> II. Safe Live Operation
  - Template Principle 3 -> III. Recovery Is a Feature
  - Template Principle 4 -> IV. Contracts Before Consumers
  - Template Principle 5 -> V. Test and Measure Production Behavior
- Added sections:
  - Product and Technical Boundaries
  - Delivery Workflow and Quality Gates
- Removed sections: none
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Runtime guidance reviewed:
  - ✅ README.md
  - ✅ copilot-instructions.md
  - ✅ docs/architecture.md
- Follow-up TODOs: none
-->
# StreamCtrl.app Constitution

## Core Principles

### I. Match State Is Authoritative

The match core MUST be the single source of truth for score, clock, periods,
players, events, lineups, and Program graphics. Control panels and overlays
MUST project that state and MUST NOT maintain competing official state. Every
accepted change MUST have an identifiable command, a monotonic revision, and a
recoverable result. This prevents divergent displays during a live match.

### II. Safe Live Operation

Every live-facing feature MUST make its current state and effect visible to the
operator. Edit, Preview, and Program MUST remain distinct. High-impact actions
MUST be confirmed or reversible, duplicate actions MUST be rejected, and an
`all.hide` emergency action MUST remain available. Operator speed never
justifies an ambiguous or silent on-air change.

### III. Recovery Is a Feature

Restart, reconnection, and partial dependency failure MUST be designed and
tested as normal operating scenarios. Confirmed match state and the action log
MUST persist atomically. A newly connected panel or overlay MUST reconstruct
itself from a complete snapshot without manual repair. Optional integrations,
including vMix automation, MUST fail without corrupting the match or blocking
the clean browser output.

### IV. Contracts Before Consumers

Commands, events, snapshots, cues, and errors MUST use runtime-validated,
versioned contracts defined before their producers and consumers. The match
core MUST remain independent of the user interface, persistence technology,
transport, Electron, and vMix. External outputs MUST be adapters so a future
NDI/OMT path does not require rewriting the domain.

### V. Test and Measure Production Behavior

Tests MUST precede or accompany each domain transition, contract, recovery
path, and critical operator journey. A change is incomplete until its relevant
unit, integration, and end-to-end checks pass. Claims about latency, frame
rate, memory, or reliability MUST include a reproducible measurement on stated
hardware and duration; absolute claims such as “zero latency” are prohibited.

## Product and Technical Boundaries

- The initial product MUST serve football graphics operated locally for vMix.
- vMix MUST remain the initial compositor and NDI/OMT output provider.
- Core operation MUST work without internet access.
- The Program overlay MUST target a transparent 1920x1080 output and sustained
  60 fps on the documented reference hardware.
- The approved foundation is TypeScript, Electron, React, Node.js, Socket.io,
  SQLite, runtime schema validation, and a dedicated animation system.
- Local services MUST bind to loopback by default. Renderer processes MUST NOT
  receive unrestricted Node.js or filesystem access.
- Social networks, PTZ control, AI, marketplaces, mobile applications, and
  direct NDI/OMT output are out of scope until the first production workflow
  satisfies its acceptance and endurance tests.

## Delivery Workflow and Quality Gates

Work MUST follow the Spec Kit sequence: constitution, specification,
clarification when required, implementation plan, tasks, consistency analysis,
and implementation. Feature specifications MUST describe user value and
measurable outcomes without choosing implementation details.

Every implementation plan MUST pass a Constitution Check before research and
again after design. Every task list MUST include required tests, reconnection
and recovery work, operator-safety checks, and measurable performance
validation when the feature affects Program. Pull requests MUST remain scoped
to one approved specification and MUST report validation results and known
risks.

The first deliverable MUST be a vertical slice: create or load a match, control
score and clock, take a lower third, render the transparent Program overlay,
reconnect from a snapshot, restore after restart, and execute `all.hide`.

## Governance

This constitution supersedes conflicting project guidance. Amendments require
a documented reason, a Sync Impact Report, updates to dependent Spec Kit
templates, and review before implementation continues.

Constitution versions follow semantic versioning:

- MAJOR for incompatible removal or redefinition of a principle.
- MINOR for a new principle or materially expanded governance.
- PATCH for clarifications that do not change obligations.

Every specification, plan, task list, and pull request MUST be checked for
compliance. Any deliberate violation MUST be recorded in the plan’s Complexity
Tracking table with the rejected simpler alternative. `README.md`,
`copilot-instructions.md`, and `docs/architecture.md` provide runtime and
technical guidance but cannot override this constitution.

**Version**: 1.0.0 | **Ratified**: 2026-07-23 | **Last Amended**: 2026-07-23
