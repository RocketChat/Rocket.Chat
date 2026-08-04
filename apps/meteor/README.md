# apps/meteor

Main Rocket.Chat app (Meteor 3 + React 18 + TS).

## Architecture

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

## Scripts

```
yarn dev              # meteor run, excludes legacy/cordova archs
yarn dsv              # alias for meteor npm run dev
yarn ms               # microservices mode (TRANSPORTER=TCP)
yarn obj:dev          # TEST_MODE=true yarn dev (required for playwright)
yarn ha:start / ha:add  # multi-instance dev (HA / horizontal scale)
yarn lint             # stylelint + meteor lint + eslint .
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

Single test file:

- Jest: `yarn .testunit:jest path/to/file.spec.ts`
- Mocha server: `yarn .testunit:server -- path/to/file.spec.ts`
- Mocha API: `yarn testapi -- --grep "<name>"`

Mocha specs enumerated in `apps/meteor/.mocharc.js` — new server unit tests must match an entry or be added to glob. E2E env: `BASE_URL=...`, `PWDEBUG=1`.

## Test conventions

- Mocha + chai for server/unit + REST API integration. Jest only where wired (`jest.config.ts`).
- Playwright at `tests/e2e/` — see `tests/e2e/README.md` for locator rules + Page Object conventions.
- REST integration tests assume running server (default `http://localhost:3000`); share state — order can matter.
- Don't mock DB in integration tests — hit real Mongo.

## Migrations

`yarn migration:add` scaffolds a server migration. Runner: `server/startup/migrations/index.ts`.
