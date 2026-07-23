# Contributing to StreamCtrl.app

## Development method

Every feature follows the repository's Spec Kit workflow:

1. Read `.specify/memory/constitution.md`.
2. Create or update one specification under `specs/`.
3. Clarify material ambiguity before technical planning.
4. Generate and review `plan.md`, research, data model and contracts.
5. Generate `tasks.md` with tests and exact paths.
6. Run the cross-artifact analysis before implementation.
7. Implement tasks in order and record validation evidence.

Application code MUST NOT be merged when it has no approved specification or
when it violates a constitutional gate without a documented exception.

## Branches and commits

- Use `codex/<description>` for Codex-created branches.
- Keep one feature specification per pull request.
- Use Conventional Commit style, for example
  `feat(clock): add timestamp-based match clock`.
- Never commit `.env`, databases, logs, backups or generated performance data.

## Required checks

Documentation-only changes MUST pass the specification validation workflow.
After the monorepo is initialized, changes MUST also pass:

```text
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

Pull requests must state the scope, user impact, checks executed and known
production risks.
