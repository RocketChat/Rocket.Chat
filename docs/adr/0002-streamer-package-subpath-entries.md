# `@rocket.chat/streamer` exposes subpath entries, not a barrel

- **Status:** accepted
- **Date:** 2026-09
- **Scope:** `packages/streamer`, its consumers in `apps/meteor` and `ee/apps/ddp-streamer`

## Decision

The Streamer, Notifications and Listeners modules move out of `apps/meteor/server` into `@rocket.chat/streamer`
so that `ee/apps/ddp-streamer` imports only workspace packages and never `../../../../apps/meteor`.
The package has **no `index.ts`**. Consumers import each module by subpath:
`@rocket.chat/streamer/streamer.module`, `@rocket.chat/streamer/notifications.module`,
`@rocket.chat/streamer/listeners.module`, `@rocket.chat/streamer/types`, and so on.
To make those paths resolve, `tsc` emits to the **package root** (`outDir: "."`, `rootDir: "./src"`) and the
emitted `*.js` / `*.d.ts` files are gitignored, the same arrangement `@rocket.chat/apps-engine` uses for its
`definition/` imports.

## Why not the obvious options

- **A single barrel `index.ts`** is what most packages in this repo do. It was rejected because a re-export-only
  file defeats tree-shaking in the Meteor bundle (see `docs/bundle-optimization-react-aria.md`), reprocesses the
  whole package on any incremental change, and is the shape the repo is moving away from.
- **A package.json `exports` map** would give the same clean paths with a normal `dist/` layout, but the shared
  tsconfig uses `moduleResolution: "node"`, which ignores `exports`. The paths would compile in Node and fail in
  TypeScript.
- **`@rocket.chat/streamer/dist/<module>`** works with zero build tricks, but leaks the build layout into every
  import and has no precedent beyond `@rocket.chat/apps/dist/...`, which is itself a known wart.

## Consequences

- Adding a public module to the package means adding a file under `src/`; nothing else to register.
- `packages/streamer/.gitignore` ignores every top-level `*.js`, `*.js.map` and `*.d.ts`, so emitted files never
  show up in `git status`. Hand-written files at the package root must therefore be `.ts`, `.json` or `.md`.
- If the repo ever moves to `moduleResolution: "node16"` or later, an `exports` map can replace root emission
  without changing a single consumer import.
