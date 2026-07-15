# Dev DB Local Development

Local development supports managed MongoDB orchestration through `@rocket.chat/dev-db`.

## Happy path

1. Start the app normally:

   `yarn dev`

2. The Meteor dev entrypoint calls `dev-db up --json`, exports `MONGO_URL` and `MONGO_OPLOG_URL`, and then starts Meteor.

## Backend policy and per-run override

Project-level policy:

Set `DEV_DB_BACKEND_POLICY` to one of:

- `auto`
- `prefer-docker`
- `prefer-binary`
- `docker-only`
- `binary-only`
- `external-only`

Per-run backend override:

Set `DEV_DB_BACKEND` to one of:

- `auto`
- `docker`
- `binary`
- `external`

## Rollback switch

To temporarily bypass managed DB orchestration:

`DEV_DB_BYPASS_MANAGED=1 yarn workspace @rocket.chat/meteor run dev`

## Helpful commands

- `yarn dev-db:up`
- `yarn dev-db:status`
- `yarn dev-db:url`
- `yarn dev-db:doctor`
- `yarn dev-db:down`
- `yarn dev-db:reset`

## Troubleshooting

- If `dev-db up` fails with Docker availability errors, start Docker daemon or run with `DEV_DB_BACKEND=binary`.
- If binary startup fails and you have a local `mongod`, ensure it is in `PATH` or set `DEV_DB_BINARY_PATH`.
- For external MongoDB, set `DEV_DB_EXTERNAL_MONGO_URL` (or `MONGO_URL`) and use `DEV_DB_BACKEND=external`.
