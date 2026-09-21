# 14 — Invoker table mechanism

**PR 5** · **ADR decisions 10, 11, 13, 14** · **Depends on:** [04](04-bridge-names.md), [09](09-error-code-enum.md)

## Goal

Build the mechanism that binds a `bridges:*` request to a host bridge method. Add no contract
entries beyond the two or three needed to prove it. Task 16 adds the data.

Review this task for **mechanism**. Review task 16 for **data**.

## The four parts

### 1. Schemas in TypeBox

`protocol/src/contracts/bridges/schemas.ts` holds the TypeBox schemas. TypeBox schemas **are** JSON
Schema, so AJV compiles them with no conversion step. `@sinclair/typebox@0.34.33` is present
transitively and becomes a direct dependency of `packages/apps` here.

Keep the schemas shallow. The contract declares the **shape of the call** — arity and scalar
types. Domain objects belong to the converter codecs one layer down; see
`docs/proposals/apps-converters-zod`. A deep `IMessage` schema would validate the same payload
twice in two schema systems.

Every Mongo-reachable param is a scalar, so `{ type: 'string' }` defeats `{ $ne: null }`. That is
the injection class this validation exists to catch.

### 2. AJV validation, host side only

The subprocess is untrusted, so app→host params are **always** validated. Host→app is types-only
plus dev and test checks. The untrusted direction is also the cheap one — ids and scalars. This
also keeps AJV, and its `new Function` codegen, out of the subprocess.

`schemas.ts` must never be value-imported by the runtime. The host value-imports it; `base-runtime`
uses `import type` only, which TypeScript erases.

### 3. The invoker table

`packages/apps/src/server/runtime/bridgeContracts.ts`. It cannot live in `protocol/`, because
`protocol/` builds first and so cannot import `AppBridges`. That is the right seam: `protocol/`
declares the wire, and a host declares how the wire binds to **its** bridges.

Type it `Partial<Record<BridgeMethodKey, Entry>>` in this task. Task 18 flips it to `Required`.

### 4. Identity injection

The app id never crosses the wire. Each entry carries a typed invoker thunk, and the host passes
the connection-known app id into that thunk.

A thunk, not an index annotation, because identity is not reliably positioned:
`UserBridge.doCreate(data, appId, options?)`, `doGetAppUser(appId?)`,
`MessageBridge.doAddReaction(messageId, userId, reaction, appId)`.

Three buckets collapse into one mechanism:

| Bucket | Handling |
| --- | --- |
| Caller identity | the thunk supplies it |
| App-supplied argument appId | forwarded from the wire, so the capability is preserved — `ModerationBridge.doReport`, `doDismissReportsBy*`, `UserBridge.doDeleteUsersCreatedByApp` |
| Nested identity | the thunk spreads it in — `getHttpBridge:doCall`, which closes the impersonation gap ADR 0001 recorded as unfixed |

## Scope

| File | Change |
| --- | --- |
| `protocol/src/contracts/bridges/schemas.ts` | new |
| `packages/apps/src/server/runtime/bridgeContracts.ts` | new — the table and the `Entry` type |
| `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts` | `handleBridgeMessage` consults the table, then falls back |
| `packages/apps/package.json` | `@sinclair/typebox` becomes a direct dependency |

## The fallback

An undeclared method falls back to the legacy path: the global
`params.map(v => v === 'APP_ID' ? realId : v)` at `BaseRuntimeSubprocessController.ts:443`. The
fallback is what makes tasks 16 and 18 separable. Task 18 deletes it.

## Steps

1. Declare the `Entry` type: `{ params: TSchema; invoke: (bridge, params, appId) => Promise<unknown> }`.
2. Declare `BridgeMethodKey` as a mapped type over `AppBridges` plus `AppResourceBridge`.
3. Compile every declared schema with AJV once, at module load.
4. Wire `handleBridgeMessage`: look the key up, validate, call the thunk. On a miss, take the
   legacy path.
5. Add 2 or 3 entries that exercise all three identity buckets. `getMessageBridge:doAddReaction`,
   `getHttpBridge:doCall` and `getModerationBridge:doReport` cover them.

## Done when

- [ ] A declared method validates its params and rejects a violation with `-32602`.
- [ ] A declared method never sees `'APP_ID'` in its params.
- [ ] An undeclared method still works, through the fallback.
- [ ] `getHttpBridge:doCall`'s schema forbids an `appId` key, and a test proves that an app cannot
      impersonate another through it.
- [ ] `base-runtime` makes no value import of `schemas.ts`. Grep the emitted `base-runtime/dist`
      for `typebox`; it must not appear.
- [ ] `@sinclair/typebox` is a direct dependency of `packages/apps`.

## Size

~200 lines of mechanism, 3 entries. No schema data.
