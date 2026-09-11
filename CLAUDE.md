# Rocket.Chat

Monorepo: the main Meteor app lives in `apps/meteor/`, shared libraries in `packages/`, other services in `apps/` and `ee/`.

## Writing code here

Comments explain **why**, never what. Keep blocks under 6 lines and comment lines
under ~10% of the production code you add — the repository's own average is 4.3%.
No narration, no change history, no analysis dumps, no commented-out code. Never
commit `*_SUMMARY.md` / `*_ANALYSIS.md` files describing how a change was reached:
that reasoning goes in the PR description, or in an ADR if it is a design decision.

Full rules, with examples: [docs/code-comments.md](docs/code-comments.md).

## Documentation index

Read the doc that matches the task instead of scanning `docs/` wholesale.

### Cross-cutting

- [docs/code-comments.md](docs/code-comments.md) — when a comment earns its place, length budgets, register, what never goes in a comment or a committed analysis doc
- [docs/i18n.md](docs/i18n.md) — translation keys: where they live, naming, namespaces, interpolation, plurals, server-side `lng`, what the i18n linter enforces

### Frontend

- [docs/frontend/](docs/frontend/) — frontend guidelines, split by topic:
  - [typescript-conventions.md](docs/frontend/typescript-conventions.md) — ES modules, `import type`, `type` vs `interface`, `any` vs `unknown`
  - [migrating-from-javascript.md](docs/frontend/migrating-from-javascript.md) — gradual JS → TS migration
  - [react.md](docs/frontend/react.md) — component structure, naming, exports, explicit and generic props types
  - [building-components.md](docs/frontend/building-components.md) — application vs Fuselage components, styling rules, Storybook-first
  - [i18n.md](docs/frontend/i18n.md) — client side only: `useTranslation`, `Trans`, runtime keys, escaping (shared rules in [docs/i18n.md](docs/i18n.md))
- [docs/form-validation.md](docs/form-validation.md) — standardized form validation patterns
- [docs/anchor-navigation.md](docs/anchor-navigation.md) — deep-linking to a field via URL hash fragments
- [docs/bundle-optimization-react-aria.md](docs/bundle-optimization-react-aria.md) — barrel-import patches; Meteor's bundler does not tree-shake

### Backend

- [docs/backend-folder-structure.md](docs/backend-folder-structure.md) — how `apps/meteor/` server code is organized and where new code goes
- [docs/api-endpoint-migration.md](docs/api-endpoint-migration.md) — migrating `API.v1.addRoute()` to the validated `API.v1.get()`/`.post()`/… pattern
- [docs/ajv-instances.md](docs/ajv-instances.md) — when to use `ajv` vs `ajvQuery` in `@rocket.chat/rest-typings`
- [docs/apps-engine-migration.md](docs/apps-engine-migration.md) — phased extraction of apps execution into a microservice

### Build and tooling

- [docs/meteor-modern-stack.md](docs/meteor-modern-stack.md) — Meteor modern build stack, file-watching caveats
- [docs/coverage.md](docs/coverage.md) — coverage instrumentation in build and CI
- [docs/npm-publishing.md](docs/npm-publishing.md) — how the public packages reach npm: `release.yml`, changesets, OIDC trusted publishing, provenance

### Testing

- [Playwright E2E testing guide](apps/meteor/tests/e2e/README.md) — setup, locators, page objects, cleanup, performance patterns, and testing conventions

### Other

- [docs/adr/](docs/adr/) — architecture decision records
- [docs/features/](docs/features/) — per-feature notes
- [docs/proposals/](docs/proposals/) — design proposals, not yet implemented
