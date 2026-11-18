# Rocket.Chat Constitution

## Core Principles

### I. One Concern per Change

- Every pull request MUST carry one classification (fix, refactor, feature, test, chore, ci)
  and one concern.
- A pull request MUST be revertible alone, without taking unrelated work with it.
- Fixes and enabling refactors MUST be their own commits, ordered below the feature:
  fixes → refactors → feature. This rule holds for POCs too.
- Every commit MUST build and pass tests on its own, so it can be extracted as is.
- The title MUST name what changes, not how the code does it.

Rationale: a reviewer follows one concern at a time, and a revert never removes unrelated work.
Details: [docs/change-organization.md](../../docs/change-organization.md).

### II. Named Model Methods for Data Access

- Every database operation MUST go through a named method on a model in `packages/models`.
- Code outside a model MUST NOT pass a filter or an update document to `find`, `findOne`,
  `updateOne`, `aggregate` or any other generic collection method.
- Callers MAY pass only `projection`, `sort`, `limit`, `skip` and `session`.
- A model MUST NOT call another model, validate its arguments, or hold business logic.
- A new method MUST be declared on `I<Name>Model` in `packages/model-typings`.

Rationale: each query sits next to the index that serves it, and the model interface lists
every query the product runs. Details: [docs/database-access.md](../../docs/database-access.md).

### III. Tests Prove the Change

- A fix MUST ship with a test that fails without the fix.
- A refactor MUST keep the existing tests green without edits to them.
- A feature MUST ship with tests for the behavior it adds.
- A unit test MUST sit next to the file it tests; a package's test MUST live in that package.
- A spec MUST mock models with `mockModel` in a `describe` hook, never with `proxyquire` or
  `jest.mock` on `@rocket.chat/models`.
- A spec MUST NOT depend on the execution order of other suites.

Rationale: the test is the proof that a classification is true.
Details: [docs/backend-folder-structure.md](../../docs/backend-folder-structure.md#tests).

### IV. Views Isolated from the Platform

- Code under `apps/meteor/client/views/` MUST reach the server and the app only through
  `@rocket.chat/ui-contexts`.
- Presentational components MUST take only props and callbacks. A subpart with data MUST own
  its query in a thin container next to it.
- Browser APIs MUST sit behind a hook. Web-only widgets MUST sit behind an app component.
- Screens MUST compose named layout containers. A screen MUST NOT use a raw `Box` for layout
  or pass undeclared styling props to a Fuselage component.
- The CI counts for raw layout and style props MUST NOT rise.

Rationale: screens run in tests and Storybook without Meteor or a browser.
Details: [docs/frontend/view-isolation.md](../../docs/frontend/view-isolation.md),
[docs/frontend/layout.md](../../docs/frontend/layout.md).

### V. Comments State Intent; Reasoning Lives in docs/

- A comment MUST state the intent of a function, never its mechanism.
- A comment MUST NOT explain code that lives in another file.
- Subsystem behavior MUST go in `docs/features/`. Design decisions MUST go in `docs/adr/`.
- Links from code MUST point to `docs/`, not to private tools such as Jira or Confluence.
- Commits MUST NOT contain narration, history, commented-out code or `*_SUMMARY.md` files.

Rationale: the repository is public, and a comment far from its subject drifts out of date.
Details: [docs/code-comments.md](../../docs/code-comments.md).

### VI. Validated Contracts at the Edges

- A new REST endpoint MUST use the validated `API.v1.get()`/`.post()`/`.put()`/`.delete()`
  pattern with request and response schemas.
- Input validation MUST live in the endpoint schema or in the service that owns the rule.
- User-facing text MUST use translation keys. A new key MUST go only in `en.i18n.json`.

Rationale: schemas catch type drift in tests and generate the OpenAPI docs.
Details: [docs/api-endpoint-migration.md](../../docs/api-endpoint-migration.md),
[docs/i18n.md](../../docs/i18n.md).

## Engineering Constraints

- The main Meteor app lives in `apps/meteor/`. Shared libraries live in `packages/`.
  Other services live in `apps/` and `ee/`.
- New server code MUST follow [docs/backend-folder-structure.md](../../docs/backend-folder-structure.md).
- Frontend code MUST follow the TypeScript and React rules in [docs/frontend/](../../docs/frontend/).
- Code MUST run on the supported Node versions, including Node 22.
- The XMPP server package follows its own spec-first process in
  [ee/packages/xmpp-server/docs/](../../ee/packages/xmpp-server/docs/README.md).

## Development Workflow

- A change that affects a published package or user-visible behavior MUST carry a changeset.
- A plan MUST list the fixes and refactors that the feature needs, as separate steps below it.
- A large mixed pull request MUST get a split proposal before anyone edits it.
- Review MUST check each principle above. A violation MUST be fixed or justified in the plan's
  Complexity Tracking table.

## Governance

This constitution governs Spec Kit specs, plans and tasks in this repository. The documents in
`docs/` hold the full rules; this file names the non-negotiable subset. When the two disagree,
`docs/` wins, and this file MUST be amended to match.

- Amendments go through a pull request that edits this file and the matching `docs/` page.
- Versioning follows semantic versioning: MAJOR removes or redefines a principle, MINOR adds a
  principle or section, PATCH clarifies wording.
- Each plan MUST pass the Constitution Check before research and again after design.
- `CLAUDE.md` and `docs/` provide the runtime guidance for development.

**Version**: 1.0.0 | **Ratified**: 2026-11-18 | **Last Amended**: 2026-11-18
