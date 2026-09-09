# API levels

> Part of the [Apps Engine host RFC](README.md).

This redesign removes surface, and the engine cannot remove surface. An app names
an engine *version range*, so a major release stops every app that named `^1.x` —
at least 75% of them, on the next boot rather than at install. This document
decides what an app declares instead; [43](43-runtime-level-retirement.md) decides
how a level is retired.

## The shape

```ts
{ "apiLevel": 2 }                   // app.json — the contract it was built against

// the load gate, replacing semver.satisfies (AppPackageParser.ts:51)
if (!SUPPORTED_API_LEVELS.has(info.apiLevel ?? 1)) throw new UnsupportedApiLevelError(info);
```

```
apiLevel 1 ──▶ frozen engine  + adapter accessors ─┐
apiLevel 2 ──▶ current engine + ctx               ─┴─▶ one set of host bridges
```

Four pieces, each dropping a different thing:

| Piece | Answers | Without it |
|---|---|---|
| the level ([1](#1-the-level-is-a-fact-not-a-prediction), [2](#2-absence-means-level-1)) | what contract is this app on | nothing to gate on |
| the shim ([3](#3-one-engine-per-level), [4](#4-the-shim-is-frozen-not-forked)) | how does it keep working | the upgrade stops workspaces |
| the codemod ([43](43-runtime-level-retirement.md)) | how does its author leave | the deadline is unfair, and missed |
| the window ([43](43-runtime-level-retirement.md)) | by when | the shim is permanent |

## 1. The level is a fact, not a prediction

A range asks the author which future engine versions the app will work with, and
the author cannot know: `^1.30.0` claims 1.99.0. A level asks which generation the
app was built against — known at build time, and read by a host that decides for
itself. Android's `targetSdk` is that mechanism.

| Android | Here |
|---|---|
| `targetSdk` | `apiLevel` |
| platform version | `@rocket.chat/apps-engine` npm version |
| per-`targetSdk` behavior gating | per-level engine and accessor resolution ([3](#3-one-engine-per-level)) |
| Play's target-API deadline | the support window ([43](43-runtime-level-retirement.md)) |

Row 2 is the crux: the npm major stops being load-bearing, so a major release
stops being an event. `requiredApiVersion` then means the one thing it can mean, a
feature floor.

## 2. Absence means level 1

```ts
const level = info.apiLevel ?? 1;   // never derived from requiredApiVersion
```

An app declaring `*` or `>=1.0.0` passes today's check against any engine and then
meets an API it was never compiled against. A permissive range is the absence of a
claim, not consent to a new one.

Set membership is monotone: widening `SUPPORTED_API_LEVELS` cannot stop an app
that loads today, and `?? 1` needs nothing in a legacy manifest to be well-formed.

## 3. One engine per level

The bundle never carries the engine — `bundler.ts:22` marks it external — so the
host picks the implementation at load, per app. Two call sites already resolve it
per subprocess:

| Runtime | Today | Change |
|---|---|---|
| Deno | `generateEphemeralDenoConfig` writes a per-app import map (`AppsEngineDenoRuntime.ts:28`), the engine entry at `:41` | point that entry at the level's directory |
| Node | `sandboxRequire` forwards the raw specifier (`node-runtime/src/lib/require.ts:25`) | map the specifier to the level's path first |

`getAppsEngineDir()` (`BaseRuntimeSubprocessController.ts:48`) takes the level and
returns the path. Accessors follow in `base-runtime`: a level-1 set wrapping the
current one, so the bridges never learn that old apps exist.

## 4. The shim is frozen, not forked

| Layer | Forked |
|---|---|
| host bridges — 37 files | **no**, one implementation, always current |
| JSON-RPC dispatch — `BaseRuntimeSubprocessController.ts:396` | **no** |
| `base-runtime` accessors | a thin adapter: the old set wraps the new |
| engine concrete exports | a frozen copy of 277 definition files, most erased at runtime |

**Level 1 means the 1.66 API exactly**, warts included. A curated subset — parity
minus the 43 `@deprecated` markers, adapted where semantics allow — asks us to
make those calls for apps we cannot see, run or test, and a wrong call arrives as
a customer incident with no path back.

Private apps are therefore the correctness risk, and validation aims at them: the
whole marketplace catalogue runs against the shim in CI and gates every shim
change, partners are invited to contribute private apps to a corpus under NDA, and
the shim takes security fixes only once it ships.

The alternative is two live APIs in tree, which forks code under active
development instead of freezing a dead artifact, and has no termination mechanism.

## Open questions

1. **Two live levels, or N?** The design permits N; each adds a test-matrix
   dimension. A hard cap of two keeps the cost predictable.
2. **Does the data layer version separately?** A level covers the module surface.
   Whether the entities and commands of
   [27](../rfc/27-data-host-gateways.md) move on the same clock is
   [51's data question 1](../rfc/51-open-questions.md#the-data-layer).
3. **Does per-level resolution hold?** Everything above rests on it, and it is
   falsifiable in about a day — copy the engine aside, thread the level through
   `getAppsEngineDir()`, install one app per level, run both runtimes.
