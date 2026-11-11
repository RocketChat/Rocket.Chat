# `@rocket.chat/streamer` ships one barrel entry

- **Status:** accepted
- **Date:** 2026-09
- **Scope:** `packages/streamer`, its consumers in `apps/meteor` and `ee/apps/ddp-streamer`

## Decision

The Streamer, Notifications and Listeners modules move out of `apps/meteor/server` into `@rocket.chat/streamer`
so that `ee/apps/ddp-streamer` imports only workspace packages and never `../../../../apps/meteor`.
The package exposes a single entry, `src/index.ts`, compiled to `dist/index.js`, and consumers import
`@rocket.chat/streamer` only. Inside the package, modules import each other by file, never through the barrel.

## Why a barrel here

The repo otherwise discourages re-export-only files (see `docs/bundle-optimization-react-aria.md`), so the
choice needs a reason on record.

- **The tree-shaking argument does not apply.** Every module in this package is server-only and is loaded at
  process start by both consumers. There is no bundle to slim.
- **Per-module subpaths were tried first and cost more than they gave.** With the shared
  `moduleResolution: "node"`, a package.json `exports` map is invisible to TypeScript, so subpaths only resolve if
  a real file exists at that path. That means either emitting compiled files into the package root, gitignoring
  them and teaching turbo and ESLint about them, or importing through `dist/`. Both leak build layout into
  every consumer for no runtime benefit.
- **The public surface is small.** Six values and eight types. A barrel of that size is the interface, not a
  pass-through.

## Consequences

- A new public module is added to `src/index.ts` explicitly. Anything not exported there is package-internal,
  which is the point: `StreamPresence`, `StatusVisibilityGate` and the user-cache getter stay internal.
- If the repo moves to `moduleResolution: "node16"` or later, subpaths can be offered through an `exports` map
  without emitting to the root. Nothing in the current layout has to change first.
