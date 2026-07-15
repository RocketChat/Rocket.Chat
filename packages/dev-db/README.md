# @rocket.chat/dev-db

Fast-cutover development MongoDB orchestration package.

## Phase 0 Contract

This package defines the baseline contract and compatibility targets for the managed development database lifecycle.

### Non-negotiable DX outcomes

- One-command startup.
- No manual install requirement.
- Deterministic URL output.
- Clean stop and reset.
- Actionable diagnostics.

### Runtime compatibility matrix

- macOS: arm64, x64
- Linux: x64, aarch64
- Windows: x64

### Environment output contract

`dev-db url` and `dev-db status` must support:

- Human-readable text output.
- Machine-readable JSON output for scripts and CI.

JSON payload shape is modeled by `DevDbJsonOutput` in `src/product-contract.ts`.

### Existing MONGO_URL assumptions

`src/mongo-url-assumptions.ts` maps known script and runtime entrypoints that currently rely on framework-managed or implicit local Mongo defaults.

## Planned lifecycle surface

Commands to be implemented in subsequent phases:

- `up`
- `down`
- `status`
- `url`
- `logs`
- `doctor`
- `reset`
