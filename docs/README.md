# Rocket.Chat — Developer Docs

Technical documentation versioned alongside the code. Canonical source for
monorepo developers. Reviewed in PRs like any other code.

> **Start here:** [getting-started.md](./getting-started.md) — clone to a running
> app.

## Start here

- **[Getting Started](./getting-started.md)** — prerequisites, install, run,
  environment variables, tests.
- **[Troubleshooting (local dev)](./local-dev/troubleshooting.md)** — Watchman,
  file watching, Mongo, ports, versions.

## Architecture (mental model)

- **[Architecture overview](./architecture/overview.md)** — one-page map; start
  here to place a feature in the right layer.
- [Monorepo layout](./architecture/monorepo-layout.md) — `apps/`, `packages/`,
  `ee/`; where code lives and where new code goes.
- [Monolith & microservices](./architecture/meteor-and-microservices.md) — how
  the Meteor app relates to the `ee/apps/*` services and run modes.
- [Critical flows](./architecture/critical-flows.md) — REST lifecycle, message
  send, real-time delivery, login, write→MongoDB.
- [Glossary](./reference/glossary.md) — Rocket.Chat-specific vocabulary and the
  gotchas behind each term.

## Conventions (how we write code)

**Backend:**

- **[REST endpoints](./conventions/backend/rest-endpoints.md)** — the typed
  `API.v1.get/post/...` pattern, AJV validation, guards, response schemas.
- [Settings](./conventions/backend/settings.md) — registering and reading
  settings; the cache gotcha.
- [Models (data access)](./conventions/backend/models.md) —
  `@rocket.chat/models`, proxify, the updater pattern, migrations.
- [Error handling](./conventions/backend/error-handling.md) —
  `error-<domain>-<issue>` codes and how to raise them.

**Frontend:**

- [Folder structure](./conventions/frontend/folder-structure.md) — colocation,
  promote-when-shared, UI-semantic layout.
- [Components & styling](./conventions/frontend/components-and-styling.md) —
  Fuselage first, design tokens, gazzodown for messages.
- [Data fetching](./conventions/frontend/data-fetching.md) — `useEndpoint` +
  React Query; `useMethod` is legacy.
- [Contexts & hooks](./conventions/frontend/contexts-and-hooks.md) —
  `ui-contexts` (settings, permissions, i18n, routing, user).

Deeper references: [API endpoint migration](./api-endpoint-migration.md) ·
[AJV instances](./ajv-instances.md) ·
[Form validation](./form-validation.md) ·
[Anchor navigation](./anchor-navigation.md) · [Coverage](./coverage.md).

## Extending the system

- [Callbacks (in-repo hooks)](./extending/callbacks.md) — `before*/after*`
  lifecycle hooks and priorities.
- [Slash commands](./extending/slash-commands.md) — adding a `/command`.
- [Apps-Engine](./extending/apps-engine.md) — marketplace apps; events &
  fire-and-forget gotcha. Deep dive: [migration](./apps-engine-migration.md).
- [Integrations & webhooks](./extending/integrations-webhooks.md) — incoming /
  outgoing webhooks and the sandbox constraint.

## Guides (hands-on)

- [Add a REST endpoint end-to-end](./guides/add-a-rest-endpoint.md).

## Build & stack

- [Meteor modern build stack](./meteor-modern-stack.md) — Meteor build, watcher,
  Watchman/TurboRepo caveats.
- [Bundle optimization (react-aria)](./bundle-optimization-react-aria.md).

## Real-time & DDP

- **[Real-time architecture & DDP decision](./architecture/realtime-and-ddp.md)**
  — why our streamer is an event stream (not a collection mirror), why we bypass
  Meteor's DDP mergebox, and why new client-server calls go through REST instead
  of DDP. **Read before writing any real-time or client-server code.**

> The line-by-line migration tracker (`ddp-remaining-methods.md`) still lives in
> this folder for reference, but is intentionally not linked here — it is a
> transient work log, not onboarding material.

## Examples / features

- [features/](./features/) — feature implementation examples.
- [proposals/](./proposals/) — technical proposals.

---

## How to evolve these docs

- **In-repo, reviewed in PRs.** Stale docs become a review comment.
- **Capture at the moment of pain:** stuck on something undocumented? Open a
  `docs` issue or a short PR. Don't wait for a "documentation week".
- **Every doc opens with "who this is for" + "what you can do after reading".**
- Code links point to `path:line` where useful (clickable in the editor).
- **Write all docs in English.**

> Larger roadmap for this initiative (architecture, conventions, extension,
> glossary): see the docs/onboarding plan maintained by the engineering team.
