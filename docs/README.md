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

## Conventions & patterns

- [API endpoint migration](./api-endpoint-migration.md) — migrating from
  `API.v1.addRoute()` to the typed `.get()/.post()/...` pattern with validation.
- [AJV instances](./ajv-instances.md) — schema validation with AJV.
- [Form validation](./form-validation.md) — form validation patterns.
- [Anchor navigation](./anchor-navigation.md) — navigation patterns.
- [Coverage](./coverage.md) — test coverage.

## Build & stack

- [Meteor modern build stack](./meteor-modern-stack.md) — Meteor build, watcher,
  Watchman/TurboRepo caveats.
- [Bundle optimization (react-aria)](./bundle-optimization-react-aria.md).

## Apps-Engine & extension

- [Apps-Engine migration](./apps-engine-migration.md).

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
