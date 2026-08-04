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

For `apps/meteor` scripts, architecture, test conventions, migrations: see `apps/meteor/README.md`.

## Hook pattern (CE/EE)

Do not roll ad-hoc hook registries. Use `@rocket.chat/patch-injection` (`makeFunction` + `.patch`). See `packages/patch-injection/README.md`.

## Changesets

User-visible change = needs `yarn changeset`. Confirm w/ human first. Rules + sub-package vs `@rocket.chat/meteor` bump details: see `.changeset/README.md`.

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
