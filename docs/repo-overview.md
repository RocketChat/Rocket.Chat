## Repo shape

Yarn 4 + Turborepo monorepo. Workspaces:

- `apps/meteor` — main app (Meteor 3 + React 18 + TS). 90% of work here.
- `apps/uikit-playground` — Apps-Engine UIKit playground.
- `packages/*` — CE shared libs (typings, models, REST, i18n, UI kits, patch-injection, tooling, ...). List: `ls packages/`.
- `ee/apps/*` — EE microservices (auth, presence, ddp-streamer, queue-worker, omnichannel-transcript, federation, ...). List: `ls ee/apps/`.
- `ee/packages/*` — EE libs (license, abac, presence, omnichannel, federation-matrix, pdf-worker, ui-theming, network-broker, ...). List: `ls ee/packages/`.
- `apps/meteor/ee/server/services` — workspace; EE-only server code under `apps/meteor/ee/`.

Node/Yarn/TS versions: `package.json` (`engines`, `volta`, `devDependencies`) or `.tool-versions`. Use `volta`/`nvm`.

### EE vs CE licensing

EE is **different license**. CE MUST NOT import EE without explicit human approval. EE MUST NOT move into non-EE folders. Applies to **any** EE code anywhere — not just `ee/` paths. EE marker = `LICENSE` file beside it; **recursive** — parent enterprise `LICENSE` makes every descendant EE (e.g. `apps/meteor/ee/LICENSE`, `ee/LICENSE`, `ee/packages/<pkg>/LICENSE`). When in doubt walk up tree until `LICENSE` found.

## Commands (repo root)

```
yarn build            # turbo build all
yarn build:services   # ee/apps services + deps only
yarn dev              # @rocket.chat/meteor dev (parallel turbo)
yarn dsv              # meteor dev inside apps/meteor
yarn ms               # microservices dev (TRANSPORTER=TCP default)
yarn lint             # turbo lint all
yarn testunit         # turbo testunit all
```

`yarn` (no args) bootstraps. Scope: `turbo run <task> --filter=<workspace>`.

## Inside `apps/meteor`

Same `yarn dev`/`dsv`/`ms`/`lint` plus:

```
yarn obj:dev          # TEST_MODE=true yarn dev (required for playwright)
yarn ha:start / ha:add  # multi-instance dev (HA / horizontal scale)
yarn eslint <path>    # eslint w/ cache; `:fix` variant
yarn stylelint        # CSS only
yarn typecheck        # meteor lint + tsc --noEmit (8 GB heap)

yarn testunit              # all 3: definition + jest + server-mocha+nyc
yarn .testunit:jest        # jest only (TZ=UTC, allowJs:false)
yarn .testunit:server      # mocha server (.mocharc.js)
yarn .testunit:definition  # mocha definition (.mocharc.definition.js)
yarn testapi               # mocha REST integration (.mocharc.api.js); needs server w/ TEST_MODE=true
yarn testapi:livechat      # livechat REST integration; needs TEST_MODE=true
yarn test:e2e [path]       # playwright; needs TEST_MODE=true
```

`yarn lint` runs stylelint + meteor lint + eslint.

Single test file:

- Jest: `yarn .testunit:jest path/to/file.spec.ts`
- Mocha server: `yarn .testunit:server -- path/to/file.spec.ts`
- Mocha API: `yarn testapi -- --grep "<name>"`

Mocha specs enumerated in `apps/meteor/.mocharc.js` — new server unit tests must match an entry or be added to glob. E2E env: `BASE_URL=...`, `PWDEBUG=1`.

## Architecture (apps/meteor)

Legacy Meteor + newer structure coexist. Three roots load in parallel:

- `app/` — legacy per-feature modules (`app/api`, `app/livechat`, `app/authorization`, ...) w/ `client/`, `server/`, sometimes `lib/`. Loaded via `server/importPackages.ts` + `client/importPackages.ts`.
- `server/` — newer entry: `services/`, `methods/`, `publications/`, `routes/`, `lib/`, `startup/`, `cron/`, `settings/`, `models.ts`. `main.ts` = bootstrap.
- `client/` — React: `views/`, `components/`, `hooks/`, `providers/`, `contexts/`, `stores/`, `cachedStores/`, `router/`, `sidebar/`, `navbar/`, `apps/`, `startup/`. Uses TanStack Query, Fuselage UI, i18next.
- `ee/` — enterprise overlay: `ee/server/`, `ee/app/`, `ee/client/`. Loaded only w/ license.
- `definition/` — shared types local to meteor (most types live in `packages/core-typings` / `packages/model-typings`).
- `tests/` — `unit/` (mocha+jest), `end-to-end/` (mocha REST), `e2e/` (playwright), `mocks/`, `data/`.

Models declared in `packages/model-typings`, implemented in `packages/models/src/models/*` (BaseRaw = MongoDB raw collection wrapper). Bound via `apps/meteor/server/models.ts`.

Services: `apps/meteor/server/services/*` = local-broker, consumed via `@rocket.chat/core-services`. EE microservices in `ee/apps/*` register against network broker (Moleculer).

REST API: routes in `app/api/server/v1/*.ts` against typed router from `packages/rest-typings`. Client calls via `@rocket.chat/api-client`.

Settings declared in `apps/meteor/server/settings/`. Auto-generates per-setting permission `change-setting-{id}`; admins bypass via `view-privileged-setting`.

### CE / EE hook pattern

Do **not** roll ad-hoc hook registries. Use `@rocket.chat/patch-injection`:

```ts
// CE
import { makeFunction } from '@rocket.chat/patch-injection';
export const doX = makeFunction((arg: A): B => { /* default */ });

// EE (only loaded w/ license active)
doX.patch((next, arg) => { /* override or wrap next(arg) */ });
```

Patches stack, run in order; `condition` for license/feature gates.

## Test conventions

- Mocha + chai for server/unit + REST API integration. Jest only where wired (`jest.config.ts`).
- Playwright at `apps/meteor/tests/e2e/` (`.spec.ts`). Page Objects in `tests/e2e/page-objects/`. Locators MUST use `getByRole` / `getByLabel` / `getByText`; `data-qa-id` / `getByTestId` last resort. Locator names start `btn`/`link`/`input`/`select`/`checkbox`/`text`. See `apps/meteor/tests/e2e/README.md`, `.cursor/rules/playwright.mdc`.
- REST integration tests assume running server (default `http://localhost:3000`); share state — order can matter.
- Don't mock DB in integration tests — hit real Mongo.

## Changesets

**Confirm with human before adding.** Every user-visible change needs `yarn changeset` → `.changeset/<random-name>.md` w/ workspaces, bump (`patch`/`minor`/`major`), release-note line. **Only changesets that bump `'@rocket.chat/meteor'` appear in public release notes** — list it for any user-visible change even if actual edit is in sub-package (e.g. `@rocket.chat/ui-client`, `@rocket.chat/i18n`). Still bump every workspace whose published surface changed; `@rocket.chat/meteor` added on top.

## Migrations

`yarn migration:add` (in `apps/meteor`) scaffolds server migration. Runner: `apps/meteor/server/startup/migrations.ts`.

## PR / commit

Title prefix: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`, `ci:`, `test:`, `i18n:`, `regression:`. See `.github/PULL_REQUEST_TEMPLATE.md`. Branch off `develop`; `master` lags. Releases tagged from `develop`. CI: `.github/workflows/ci.yml` = monolith; unit/storybook/E2E/code-check split into peer files.

## Permissions

Two layers: RBAC (`Authorization` service, role-based) + ABAC (EE, `@rocket.chat/abac` + `ee/packages/abac`). Settings auto-generate permissions; check `view-privileged-setting` before assuming admin can read a setting.

## Entrypoints when lost

- Server bootstrap: `apps/meteor/server/main.ts` → `server/startup/`.
- Client bootstrap: `apps/meteor/client/startup/`.
- Methods/publications: `apps/meteor/server/methods/`, `server/publications/`.
- REST routes: `apps/meteor/app/api/server/v1/*`.
- License gating: `ee/packages/license/src/` (`License.has(...)`).
- Models: `packages/models/src/models/`, types `packages/model-typings/src/models/`.
