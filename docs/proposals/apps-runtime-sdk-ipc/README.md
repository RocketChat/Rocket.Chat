# Plan: extracting the host↔subprocess protocol into `packages/apps/protocol`

**The decisions behind this plan live in [ADR 0006](../../adr/0006-apps-subprocess-protocol.md)**,
which builds on [ADR 0005](../../adr/0005-ipc-channel-transport.md) for the transport. This document
is only the delivery sequence, and is deleted when the last PR lands.

## Why

The controller in `packages/apps/src/server/runtime/` and the app subprocess in
`packages/apps/base-runtime/` speak an implicit JSON-RPC-ish protocol. Neither side declares it. Both
re-derive it — by splitting method strings on `:`, reading positional `params[0]`, `params[1]` with
`as`-casts, and matching substrings of method names to decide what to inject.

The cost was paid once already, and the evidence is now in the history rather than in the tree: the
two `codec.ts` files had drifted into complementary halves of one format, each implementing the
other's gaps, so neither could round-trip its own output, and each had since grown its own answer to
nested ext-2 coding. [ADR 0005](../../adr/0005-ipc-channel-transport.md) deleted both files with the
transport switch, which settles that instance without settling the class. The two halves are still
independently maintained, and the goal is still to make that kind of divergence impossible to
introduce. Contract testing is the mechanism; type safety is a by-product.

## Sequence

Eight PRs, ordered so that no PR mixes a pure refactor with a behavior change. Each is
independently green.

| # | Content | ADR decisions | Why here |
| --- | --- | --- | --- |
| 0 | `protocol/` skeleton: 4th tsc project, `build:protocol` first, `strict: true`. Plus the zero-dependency contents — control-frame constants (deleting four duplicate literals and the dead JSON-RPC `ping`), bridge and method **names**, and the `{ pid }` metrics shape | 2, 8 | ~50 lines. It is the project wiring, which every later PR needs, and nothing in it can fail in an interesting way |
| 1 | Serialization move: `SecureFields` and `IpcSanitizer` into `protocol/`, plus the `apps/meteor` import fix | 3 | Independent of everything downstream; deletes two of the three `dist` value imports. Two file moves made `strict`-clean. The secure-fields **walk** stays in `base-runtime`, which is where the app permissions are |
| 2 | JSON-RPC surface — move `src/lib/jsonrpc.ts` into `protocol/framing/`, delete the `base-runtime/src/lib/jsonrpc.ts` dist shim, repoint ~25 importers; envelope typed asymmetrically | 4, 5 | **Pure move, zero behavior change.** ADR 0004 already built the surface, so this is a path change plus the import-path fix. Reviewable by shape-diffing |
| 3 | Error taxonomy: closed enum, `1000` → `-32601`/`-32602`, declared `data` shapes | 6 | **Behavior change**, split from #2 so review attention lands where semantics move |
| 4 | Method-name flattening and per-entry `kind`; rewrites `requestRouter`, `api-handler`, and `handleApp` dispatch | 7, 9 | Lands the host→app half of the contract. Must be one PR — both sides change together, which no-version-skew permits |
| 5 | Bridge contract **mechanism** plus the ~30 methods accessors actually emit: AJV validation, invoker table (`Partial<Record<…>>`), identity injection, sentinel removal at those sites. Contract test and coverage report | 10, 11, 13, 14, 16, 17 | Reviewable for *mechanism*. Its round-trip step is `sanitizeForIpc` plus a structured clone. Undeclared methods fall back to the legacy value-match path |
| 6 | The remaining ~120 schemas and thunks; table flips to `Required`; fallback and the global `params.map(v === 'APP_ID')` deleted | 13, 14, 16 | Reviewable for *data* — near-identical entries, skimmable |
| 7 | Listener injection table replacing substring matching, plus the arity assertion | 15, 17 | Last, per ADR decision 15: by then the contract supplies the authoritative method set to enumerate against |

### Three things the sequence depends on

- **The `Partial` → `Required` staging is what makes #5 and #6 separable.** The compile-time
  exhaustiveness check cannot exist until the table is complete, so the table type starts permissive
  with a runtime fallback and tightens in #6. Without that, #5 and #6 are one ~150-entry PR.
- **Identity removal must be simultaneous per method.** If a thunk injects `appId` while the accessor
  still sends `'APP_ID'`, arity breaks. So sentinel removal rides with each method's contract entry —
  which is why #5 covers exactly the emitted set (the sentinel-sending set) and #6 covers the rest
  (which send nothing today).
- **`strict: true` is a hidden cost in #1, not #0.** Host and `base-runtime` both compile
  `strict: false`; `SecureFields` and `IpcSanitizer` have to be made strict-clean on the way into
  `protocol/`. It is the one place in the series where "move a file" is not just a move.

### Already landed

Two items this plan once scheduled are done, before the series starts, in the `jsonrpc-lite`
replacement recorded as [ADR 0004](../../adr/0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md):
the in-house JSON-RPC types and the top-level `meta` envelope property. That shrinks PR #2 from
"build a surface over a library" to "move a module", and it removes the `isProtocolError` brand
from the plan — the structural sites already test types this repository owns.

It also adds work to PR #2 that was not there before. `base-runtime/src/lib/jsonrpc.ts` re-exports
the host's **compiled** `dist/lib/jsonrpc`. With the sanitizer imported the same way, there are three
value imports of `dist` today: PR #1 deletes the `SecureFields` and `IpcSanitizer` ones, PR #2 this
one. Each of them makes `build:default` a precondition of `typecheck:base-runtime`.

### Not scheduled

Moving the envelope tuple up to the messenger ([ADR 0006](../../adr/0006-apps-subprocess-protocol.md)
follow-up 3) — left open and unmeasured by ADR 0004. It needs `protocol/` to own the framing first,
so it sits after #2 at the earliest. It also needs a fresh motive: the measurement behind it compared
msgpack encodings, and the wire is now structured clone.

Benchmarking a `Buffer`-heavy path ([ADR 0005](../../adr/0005-ipc-channel-transport.md)
follow-up 1). The transport changed unmeasured. It is not part of this extraction, but PR #5's
round-trip harness is the closest thing to a fixture.

## Surface being covered

- **App→host:** 152 `public do*` declarations across 27 bridge classes (127 unique names, 15 of them
  on `AppResourceBridge`), reachable through 28 `AppBridges` getters plus `AppResourceBridge`; five
  notifications (`ready`, `log`, `metrics`, `unhandledRejection`, `uncaughtException`); and `_zPONG`.
- **Host→app:** 11 lifecycle methods, ~70 listeners, 5 UIKit interactions, 1 upload event, the five
  provider/registration-keyed families being flattened in #4, and `_zPING`.

The one-page version of this lands in `packages/apps/protocol/README.md` in PR 0, next to the
contract tables it summarizes.
