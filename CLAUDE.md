# Rocket.Chat

Monorepo: the main Meteor app lives in `apps/meteor/`, shared libraries in `packages/`, other services in `apps/` and `ee/`.

## Writing code here

Comments state the **intent** of a function, never the mechanism, and never explain
code that lives in another file — that belongs in `docs/features/`. Full rules:
[docs/code-comments.md](docs/code-comments.md).

Every database operation goes through a named model method in `packages/models`; code
outside a model never passes a filter or update document to `find`, `findOne`, `updateOne`
and the like. Models hold no business logic: they don't call other models or validate their
arguments. Full rules: [docs/database-access.md](docs/database-access.md).

Each pull request carries one classification and one concern, and can be reverted alone.
Fixes and enabling refactors are their own commits, ordered below the feature so
they can be extracted, even in a POC. Full rules:
[docs/change-organization.md](docs/change-organization.md).

Members can be barred from a room's earlier messages, and only the code that serves messages
enforces it. Any server code that gives someone a room's message content, or acts on a message ID
for them, applies the history restriction and gets a case in the restricted-history API test:
endpoints, methods, publications, stream events, search, exports, notifications, and messages
copied or quoted into others. Full rules:
[docs/features/restricted-message-history.md](docs/features/restricted-message-history.md#adding-a-path-that-returns-messages).

## Documentation index

Read the doc that matches the task instead of scanning `docs/` wholesale.

### Cross-cutting

- [docs/code-comments.md](docs/code-comments.md) — what a comment may say, and where reasoning goes when it is not a comment
- [docs/change-organization.md](docs/change-organization.md) — one concern per pull request, fixes → refactors → feature as a stack (POCs included), rebasing stacks after squash merges
- [docs/i18n.md](docs/i18n.md) — translation keys: where they live, naming, namespaces, interpolation, plurals, server-side `lng`, what the i18n linter enforces

### Frontend

- [docs/frontend/](docs/frontend/) — frontend guidelines, split by topic:
  - [typescript-conventions.md](docs/frontend/typescript-conventions.md) — ES modules, `import type`, `type` vs `interface`, `any` vs `unknown`
  - [migrating-from-javascript.md](docs/frontend/migrating-from-javascript.md) — gradual JS → TS migration
  - [react.md](docs/frontend/react.md) — component structure, naming, exports, explicit and generic props types
  - [layout.md](docs/frontend/layout.md) — screens compose named layout containers, never raw `Box` or styling props on Fuselage components; where a new container lives and when it gets promoted
  - [building-components.md](docs/frontend/building-components.md) — application vs Fuselage components, the props a component accepts, layout containers, adding a variation, Storybook-first
  - [list-keyboard-navigation.md](docs/frontend/list-keyboard-navigation.md) — the three keyboard models for lists (combobox, menu, composite list), the implementation of each, and how to test them
  - [dom-hooks.md](docs/frontend/dom-hooks.md) — hooks that attach listeners or observers return a callback ref instead of taking a `RefObject`
  - [i18n.md](docs/frontend/i18n.md) — client side only: `useTranslation`, `Trans`, runtime keys, escaping (shared rules in [docs/i18n.md](docs/i18n.md))
  - [adding-icons.md](docs/frontend/adding-icons.md) — adding an icon to `@rocket.chat/icons`: SVG cleanup, shape-based naming, directional icons, glyph mapping, changeset
- [docs/form-validation.md](docs/form-validation.md) — standardized form validation patterns
- [docs/anchor-navigation.md](docs/anchor-navigation.md) — deep-linking to a field via URL hash fragments
- [docs/bundle-optimization-react-aria.md](docs/bundle-optimization-react-aria.md) — barrel-import patches; Meteor's bundler does not tree-shake

### Backend

- [docs/backend-folder-structure.md](docs/backend-folder-structure.md) — how `apps/meteor/` server code is organized and where new code goes
- [docs/features/http-server.md](docs/features/http-server.md) — the server's own HTTP server: base middlewares, routes on the root app, the Meteor fallback, where to add a route
- [docs/features/ddp-sessions.md](docs/features/ddp-sessions.md) — DDP over the WebSocket with `@rocket.chat/ddp-server`: endpoints, what runs through Meteor, login, who follows a session
- [docs/database-access.md](docs/database-access.md) — every query and write is a named model method; what callers may still pass, how to add a method, why models never call other models or validate input
- [docs/api-endpoint-migration.md](docs/api-endpoint-migration.md) — migrating `API.v1.addRoute()` to the validated `API.v1.get()`/`.post()`/… pattern
- [docs/ajv-instances.md](docs/ajv-instances.md) — when to use `ajv` vs `ajvQuery` in `@rocket.chat/rest-typings`
- [docs/apps-engine-migration.md](docs/apps-engine-migration.md) — phased extraction of apps execution into a microservice
- [docs/service-brokers.md](docs/service-brokers.md) — how services reach each other: the local and Moleculer brokers, how events and stream relays reach other instances in each deployment, and the calls that only work because both ends share a process

### Build and tooling

- [docs/getting-started.md](docs/getting-started.md) — run from source: prerequisites (`scripts/check-deps.sh`), install, run modes, tests
- [docs/local-dev/troubleshooting.md](docs/local-dev/troubleshooting.md) — common local build/run failures and their fixes
- [docs/meteor-modern-stack.md](docs/meteor-modern-stack.md) — Meteor modern build stack, file-watching caveats
- [docs/coverage.md](docs/coverage.md) — coverage instrumentation in build and CI
- [docs/npm-publishing.md](docs/npm-publishing.md) — how the public packages reach npm: `release.yml`, changesets, OIDC trusted publishing, provenance
- [docs/typescript-7-migration.md](docs/typescript-7-migration.md) — TS7 (native compiler) migration: remaining work — packages pinned to TS5.9, deferred UI packages, constraints, follow-ups

### Testing

- [Playwright E2E testing guide](apps/meteor/tests/e2e/README.md) — setup, locators, page objects, cleanup, performance patterns, and testing conventions

### Other

- [docs/adr/](docs/adr/) — architecture decision records
- [ee/packages/xmpp-server/docs/](ee/packages/xmpp-server/docs/README.md) — the XMPP server is developed spec-first; its specs, ADRs, plans and compliance matrix live in the package, not here; `/xmpp-intent`, `/xmpp-spec` and `/xmpp-plan` drive its authoring stages from any directory
- [docs/features/](docs/features/) — per-feature notes
  - [uikit/](docs/features/uikit/README.md) — UiKit blocks, surfaces, rendering, interactions; field reference and per-surface support matrix
  - [web-client-hosting.md](docs/features/web-client-hosting.md) — how the server serves the Vite-built client (manifest, entry injection, CDN, cache) and how to serve the client from another host
- [docs/proposals/](docs/proposals/) — design proposals, not yet implemented
  - [serve-client-without-meteor-webapp.md](docs/proposals/serve-client-without-meteor-webapp.md) — serving the client without Meteor's `web.browser` program
  - [finish-moving-http-and-ddp-off-meteor.md](docs/proposals/finish-moving-http-and-ddp-off-meteor.md) — what still reaches Meteor's HTTP and DDP servers, and the order to move it
