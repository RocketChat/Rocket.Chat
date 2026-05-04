# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repo shape

Yarn 4 + Turborepo monorepo. Workspaces:

- `apps/meteor` — main app (Meteor 3 + React 18 + TypeScript). 90 % of work happens here.
- `apps/uikit-playground` — Apps-Engine UIKit dev playground.
- `packages/*` — community-edition shared libs (`core-services`, `core-typings`, `model-typings`, `models`, `rest-typings`, `i18n`, `ui-client`, `fuselage-ui-kit`, `patch-injection`, `tools`, `agenda`, `cron`, `logger`, etc.).
- `ee/apps/*` — enterprise microservices (`account-service`, `authorization-service`, `ddp-streamer`, `presence-service`, `stream-hub-service`, `queue-worker`, `omnichannel-transcript`, `federation-service`).
- `ee/packages/*` — enterprise libs (`license`, `abac`, `presence`, `omnichannel-services`, `federation-matrix`, `pdf-worker`, `ui-theming`, `network-broker`, `omni-core-ee`, `media-calls`).
- `apps/meteor/ee/server/services` — declared as workspace; EE-only server code lives under `apps/meteor/ee/`.

Node `22.22.2`, Yarn `4.12.0`, TypeScript `~5.9.3`. Pinned in `package.json` `engines` + `volta`. Use `mise`/`volta`/`asdf` (`.tool-versions`).

### EE vs CE licensing

EE code is under a **different license** from the rest of the repo. Rules:

- CE code MUST NOT carelessly import from EE without explicit human approval.
- EE code MUST NOT be moved into non-EE folders.
- This applies to **any** EE code, anywhere in the tree — not just `ee/` paths.
- Identify EE code by a `LICENSE` file sitting next to it. **License files are recursive**: if a parent folder has an enterprise `LICENSE`, every file in that folder and all its descendants is EE too (e.g. `apps/meteor/ee/LICENSE`, `ee/LICENSE`, `ee/packages/<pkg>/LICENSE`).
- When in doubt, walk up the tree until you find a `LICENSE`.

## Top-level commands (run from repo root)

```
yarn build            # turbo build all workspaces
yarn build:services   # only ee/apps services + deps
yarn dev              # dev server for @rocket.chat/meteor (parallel turbo)
yarn dsv              # meteor dev (`meteor npm run dev`) inside apps/meteor
yarn ms               # microservices dev (TRANSPORTER=TCP by default)
yarn lint             # turbo lint all workspaces
yarn testunit         # turbo testunit all workspaces
```

`yarn` (no args) bootstraps deps. `turbo run <task> --filter=<workspace>` to scope.

Per-workspace invocation: `yarn workspace <pkg-name> <script>` runs a script defined in that workspace's own `package.json` (e.g. `yarn workspace @rocket.chat/meteor lint`, `yarn workspace @rocket.chat/core-services build`). Use this when you want one workspace's script directly without going through turbo.

## Inside `apps/meteor`

Most relevant scripts:

```
yarn dev              # meteor run, excludes legacy/cordova archs
yarn dsv              # alias for meteor npm run dev (same)
yarn ms               # microservices mode (TRANSPORTER=TCP)
yarn obj:dev          # TEST_MODE=true yarn dev   (required for playwright)
yarn ha:start / ha:add  # multi-instance dev (HA / horizontal scale)

yarn lint             # stylelint + meteor lint + eslint .
yarn eslint <path>    # eslint with cache; `:fix` variant available
yarn stylelint        # CSS only
yarn typecheck        # meteor lint + tsc --noEmit (8 GB heap)

yarn testunit         # runs all 3: definition + jest + server-mocha+nyc
yarn .testunit:jest   # jest only (TZ=UTC, allowJs:false)
yarn .testunit:server # mocha for server (.mocharc.js)
yarn .testunit:definition  # mocha for definition (.mocharc.definition.js)
yarn testapi          # mocha REST integration (.mocharc.api.js) — needs running server (needs server with TEST_MODE=true)
yarn testapi:livechat # livechat REST integration (needs server with TEST_MODE=true)
yarn test:e2e         # playwright (needs server with TEST_MODE=true)
yarn test:e2e ./tests/e2e/foo.spec.ts   # single suite (needs server with TEST_MODE=true)
```

Single test file:

- Jest: `yarn .testunit:jest path/to/file.spec.ts`
- Mocha server: `yarn .testunit:server -- path/to/file.spec.ts`
- Mocha API: `yarn testapi -- --grep "<name>"`

Mocha specs are enumerated in `apps/meteor/.mocharc.js` — new server unit tests must match an entry there or be added to the glob list.

E2E env vars: `BASE_URL=...`, `PWDEBUG=1`. Server must be started with `TEST_MODE=true`.

## Architecture (apps/meteor)

Legacy Meteor layout coexists with newer structure. Three roots load code in parallel:

- `app/` — legacy per-feature modules (`app/api`, `app/livechat`, `app/authorization`, ...). Contains `client/`, `server/`, sometimes `lib/` per feature. Loaded via `server/importPackages.ts` and `client/importPackages.ts`.
- `server/` — newer server entry points: `services/`, `methods/`, `publications/`, `routes/`, `lib/`, `startup/`, `cron/`, `settings/`, `models.ts`. `main.ts` is the server bootstrap.
- `client/` — React app: `views/`, `components/`, `hooks/`, `providers/`, `contexts/`, `stores/`, `cachedStores/`, `router/`, `sidebar/`, `navbar/`, `apps/`, `startup/`. Heavy use of TanStack Query, Fuselage UI, i18next.
- `ee/` — enterprise overlay: `ee/server/`, `ee/app/`, `ee/client/`. Loaded only when license permits.
- `definition/` — shared types local to meteor (most types live in `packages/core-typings` / `packages/model-typings`).
- `tests/` — `unit/` (mocha+jest), `end-to-end/` (mocha REST), `e2e/` (playwright), `mocks/`, `data/`.

Models: declared in `packages/model-typings`, implemented in `packages/models/src/models/*` (BaseRaw is the MongoDB raw collection wrapper). Meteor binds them via `apps/meteor/server/models.ts`.

Services: `apps/meteor/server/services/*` are local-broker services consumed via `@rocket.chat/core-services`. EE microservices in `ee/apps/*` register against the network broker (Moleculer).

REST API: routes registered in `app/api/server/v1/*.ts` against the typed router from `packages/rest-typings`. Client calls go through `@rocket.chat/api-client`.

Settings: declared in `apps/meteor/server/settings/`. Auto-generates per-setting permission `change-setting-{id}`; admins bypass via `view-privileged-setting`.

### CE / EE hook pattern

Do **not** roll ad-hoc hook registries. Use `@rocket.chat/patch-injection`:

```ts
// CE side
import { makeFunction } from '@rocket.chat/patch-injection';
export const doX = makeFunction((arg: A): B => { /* default impl */ });

// EE side (only loaded when license active)
doX.patch((next, arg) => { /* override or wrap next(arg) */ });
```

Patches stack and run in order; pass `condition` for license/feature gates.

## Test conventions

- Mocha + chai for server/unit + REST API integration. Jest only where wired (search `jest.config.ts`).
- Playwright lives in `apps/meteor/tests/e2e/` (`.spec.ts`). Page Objects under `tests/e2e/page-objects/`. Locators must use `getByRole` / `getByLabel` / `getByText` — `data-qa-id` and `getByTestId` are last resort. Locator names start with `btn`/`link`/`input`/`select`/`checkbox`/`text`. See `apps/meteor/tests/e2e/README.md` and `.cursor/rules/playwright.mdc`.
- REST integration tests assume a running server (default `http://localhost:3000`). They share state — order can matter.
- Don't mock the database in integration tests — hit the real Mongo.

## Changesets

**Always confirm with the human before adding a changeset.**

Every user-visible change needs a changeset:

```
yarn changeset
```

Creates `.changeset/<random-name>.md` with affected workspaces and bump type (`patch`/`minor`/`major`) + a short release-note line. **Only changesets that bump `'@rocket.chat/meteor'` show up in the public release notes** — so it must be listed for any user-visible change, even when the actual code edit is in a sub-package (e.g. `@rocket.chat/ui-client`, `@rocket.chat/i18n`). Still bump every other workspace whose published surface changed; `@rocket.chat/meteor` is added on top of those.

## Migrations (Meteor)

`yarn migration:add` (in `apps/meteor`) scaffolds a server migration. The migration runner is in `apps/meteor/server/startup/migrations.ts` (search for it).

## PR / commit conventions

- Title prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`, `test:`, `i18n:`, `regression:`. See `.github/PULL_REQUEST_TEMPLATE.md`.
- CLA required (cla-assistant) before merge.
- Branch off `develop`; `master` lags. Releases tagged from `develop`.
- CI: `.github/workflows/ci.yml` is the monolith pipeline; unit/storybook/E2E/code-check split into peer files.

## Permissions / authorization

Two layers: RBAC (`Authorization` service, role-based) and ABAC (EE, `@rocket.chat/abac` + `ee/packages/abac`). Settings auto-generate permissions; check for `view-privileged-setting` before assuming an admin can read a setting.

## Useful entrypoints when lost

- Server bootstrap: `apps/meteor/server/main.ts` → `server/startup/`.
- Client bootstrap: `apps/meteor/client/startup/`.
- Method/publication registry: `apps/meteor/server/methods/`, `server/publications/`.
- REST routes: `apps/meteor/app/api/server/v1/*`.
- License gating: `ee/packages/license/src/` (`License.has(...)`).
- Model definitions: `packages/models/src/models/`, types in `packages/model-typings/src/models/`.
