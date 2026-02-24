# Rocket.Chat Development

## Cursor Cloud specific instructions

### Architecture Overview

Rocket.Chat is a Yarn 4 + Turborepo monorepo. The main application lives in `apps/meteor/` and uses the **Meteor** framework. ~55 shared packages under `packages/` and `ee/` provide core typings, models, UI components, and enterprise microservices.

### Required Services

| Service | How to start | Port |
|---------|-------------|------|
| MongoDB (replica set) | `mongod --replSet rs0 --dbpath /data/db --port 27017 --bind_ip_all --fork --logpath /tmp/mongod.log` then `mongosh --eval 'rs.initiate()'` | 27017 |
| Rocket.Chat (Meteor) | `MONGO_URL="mongodb://localhost:27017/rocketchat?replicaSet=rs0" MONGO_OPLOG_URL="mongodb://localhost:27017/local?replicaSet=rs0" ROOT_URL="http://localhost:3000" PORT=3000 meteor --exclude-archs "web.browser.legacy, web.cordova"` (run from `apps/meteor/`) | 3000 |

### Key Commands

- **Install deps**: `yarn install` (from repo root)
- **Build all packages**: `yarn build` (runs `turbo run build`)
- **Dev server**: `yarn dev` (runs turbo dev which starts Meteor with deps — requires MongoDB running)
- **Lint**: `yarn lint` (runs `turbo run lint` across all packages)
- **Unit tests**: `yarn testunit` (runs `turbo run testunit` across all packages)
- **Meteor app lint only**: `cd apps/meteor && yarn lint`
- **Meteor app tests only**: `cd apps/meteor && yarn testunit`

### Gotchas

- **Node version must be exactly 22.16.0.** The Yarn engines plugin enforces this strictly. Use `nvm use 22.16.0`.
- **MongoDB must be a replica set** (`--replSet rs0`). Rocket.Chat uses oplog tailing for real-time reactivity and will fail without it.
- **First `yarn build` may fail** because `@rocket.chat/ui-kit` runs `ts-patch install` which patches the shared TypeScript compiler mid-build, corrupting concurrent tsc processes. Simply re-run `yarn build` and it succeeds on the second attempt since ts-patch is already applied.
- **Deno must be installed** (any recent version). The `@rocket.chat/apps-engine` package requires it for its build step (`deno cache`).
- **First Meteor startup takes ~5 minutes** to compile the full application bundle. Subsequent starts with a warm cache are much faster.
- **Setup wizard bypass**: During initial setup, the workspace registration step may lack a visible "Skip" button. You can bypass it via: `mongosh mongodb://localhost:27017/rocketchat --eval "db.rocketchat_settings.updateOne({_id: 'Show_Setup_Wizard'}, {\\$set: {value: 'completed'}})"`.
