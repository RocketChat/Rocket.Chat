# Monorepo layout

**Who this is for:** a developer trying to figure out *where a piece of code
lives* or *where new code should go*. **After reading:** you can navigate
`apps/`, `packages/` and `ee/` and know what each holds.

---

## Tooling

- **Yarn 4 workspaces** — one `yarn` install at the root wires every package
  together. The workspace globs (`package.json`):
  `apps/*`, `packages/*`, `ee/apps/*`, `ee/packages/*`,
  `apps/meteor/ee/server/services`.
- **Turborepo** — orchestrates and caches `build`, `lint`, `typecheck`,
  `testunit`, etc. across workspaces (`turbo.json`).
- Run scripts on one workspace with `yarn workspace <name> run <script>`
  (see [getting-started](../getting-started.md#build-or-watch-a-single-package)).

## Top level

```text
Rocket.Chat/
├── apps/            # runnable applications
│   ├── meteor/      # THE main app (monolith) — most code lives here
│   └── uikit-playground/
├── packages/        # ~56 shared packages (Community)
├── ee/
│   ├── apps/        # 6 Enterprise microservices
│   └── packages/    # 9 Enterprise packages
└── docs/            # ← these in-repo developer docs (plain markdown)
```

> Rule of thumb: **feature code → `apps/meteor`**; **reusable/typed contracts →
> `packages/*`**; **enterprise-only → `ee/*`**.

## Inside `apps/meteor`

The monolith is the biggest place you'll work. Key directories:

| Dir | What's there |
|-----|--------------|
| `app/` | ~37 legacy feature modules (authorization, livechat, integrations, apps, slashcommands-* client code, …). Shrinking: the 2026 restructure moved API, auth, settings and most server code out — new server code goes in `server/`, not here. See [backend-folder-structure](../backend-folder-structure.md). |
| `server/` | Where server code lives now: `api/` (REST), `settings/`, `hooks/`, `meteor-methods/`, `services/` (in-process core-services impls), `slashcommands/`, `publications/`, `cron/`, `lib/` (incl. `callbacks.ts`), `modules/streamer/`, `startup/` |
| `client/` | React client (current UI) |
| `imports/` | Legacy Meteor dir; kept mainly to force Meteor to bundle these deps — don't add new code here |
| `ee/` | Enterprise features, incl. `ee/server/services/` (services workspace) |
| `definition/` | Ambient TypeScript types |
| `tests/` | e2e (Playwright) and test infra |
| `public/`, `private/` | Static assets (see memory note: Meteor bundler resolves `url()` in imported CSS — don't prune blindly) |

> A feature may have a REST endpoint **and/or** a legacy Meteor method — check
> both `server/api/v1/` and `server/meteor-methods/`.

## Package categories (`packages/*`, `ee/packages/*`)

You don't need all ~65 — these are the ones you'll touch most:

| Category | Examples | Why it matters |
|----------|----------|----------------|
| **Typed contracts** | `core-typings`, `rest-typings`, `model-typings` | Shared types; REST request/response shapes + AJV validators |
| **Data** | `models`, `mongo-adapter` | Proxified MongoDB models used everywhere |
| **Services** | `core-services` (+ `network-broker`, `presence` in `ee/packages`) | Service interfaces the monolith calls (proxified) |
| **UI** | `fuselage-ui-kit`, `ui-client`, `ui-contexts`, `ui-composer`, `gazzodown` | React components & contexts |
| **Apps platform** | `apps-engine`, `apps` | Marketplace app SDK + integration |
| **Utilities** | `random`, `logger`, `i18n`, `jwt` | Small shared helpers |
| **Tooling** | `eslint-config`, `tsconfig`, `jest-presets`, `tools` | Build/dev config |

Full inventory and tech details: [meteor-and-microservices](./meteor-and-microservices.md).

## Enterprise (`ee/`)

`ee/apps/*` are the 6 standalone microservices (see
[meteor-and-microservices](./meteor-and-microservices.md)). `ee/packages/*`
hold enterprise-only logic (e.g. `license`, `omni-core-ee`, `network-broker`). EE
features are gated by license; without one the app runs as Community Edition.

---

**Next:** [meteor-and-microservices](./meteor-and-microservices.md) ·
[critical-flows](./critical-flows.md)
