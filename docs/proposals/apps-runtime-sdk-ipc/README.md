# Plan: extracting the host↔subprocess protocol into `packages/apps/protocol`

**The decisions behind this plan live in [ADR 0005](../../adr/0005-apps-subprocess-protocol.md).**
This document is only the delivery sequence, and is deleted when the last PR lands.

## Why

The controller in `packages/apps/src/server/runtime/` and the app subprocess in
`packages/apps/base-runtime/` speak an implicit JSON-RPC-ish protocol over msgpack. Neither side
declares it. Both re-derive it — by splitting method strings on `:`, reading positional `params[0]`,
`params[1]` with `as`-casts, and matching substrings of method names to decide what to inject.

The cost is already paid, not hypothetical: the two `codec.ts` files have drifted into complementary
halves of one format, each implementing the other's gaps, so neither can round-trip its own output.
The gap is still widening — each half has since grown its own answer to nested ext-2 coding, a pooled
encoder on the host and a fresh decoder in the runtime, each reasoned out without the other. The goal
is to make that class of divergence impossible to introduce. Contract testing is the mechanism; type
safety is a by-product.

## Sequence

Eight PRs, ordered so the riskiest unknown is proved first and no PR mixes a pure refactor with a
behavior change. Each is independently green.

| # | Content | ADR decisions | Why here |
| --- | --- | --- | --- |
| 0 | `protocol/` skeleton: 4th tsc project, `build:protocol` first, `strict: true`. Plus the zero-dependency contents — control-frame constants (deleting four duplicate literals and the dead JSON-RPC `ping`), bridge and method **names**, metrics shape + NDJSON framing | 2, 10, 11, 15 | ~50 lines. The biggest unknown is whether a 4th tsc project consumed as Deno source works across all four consumers. Prove that with trivia, not with the codec — reading the config says it needs no `deno.jsonc` or `--allow-read` change; running it is the proof |
| 1 | Codec unification, `SecureFields` move, and the `apps/meteor` import fix | 3, 4, 5 | Independent of everything downstream; deletes the first of two compiled-CJS-from-sandbox imports. Unification now also has to reconcile the nested-codec machinery each half grew separately |
| 2 | JSON-RPC surface — move `src/lib/jsonrpc.ts` into `protocol/framing/`, delete the `base-runtime/src/lib/jsonrpc.ts` dist shim, repoint ~25 importers; envelope typed asymmetrically | 6, 7 | **Pure move, zero behavior change.** ADR 0004 already built the surface, so this is a path change plus the import-path fix. Reviewable by shape-diffing |
| 3 | Error taxonomy: closed enum, `1000` → `-32601`/`-32602`, declared `data` shapes | 8 | **Behavior change**, split from #2 so review attention lands where semantics move |
| 4 | Method-name flattening and per-entry `kind`; rewrites `requestRouter`, `api-handler`, and `handleApp` dispatch | 9, 12 | Lands the host→app half of the contract. Must be one PR — both sides change together, which no-version-skew permits |
| 5 | Bridge contract **mechanism** plus the ~30 methods accessors actually emit: AJV validation, invoker table (`Partial<Record<…>>`), identity injection, sentinel removal at those sites. Contract test and coverage report | 13, 14, 16, 17, 19, 20 | Reviewable for *mechanism*. Undeclared methods fall back to the legacy value-match path |
| 6 | The remaining ~120 schemas and thunks; table flips to `Required`; fallback and the global `params.map(v === 'APP_ID')` deleted | 16, 17, 19 | Reviewable for *data* — near-identical entries, skimmable |
| 7 | Listener injection table replacing substring matching, plus the arity assertion | 18, 20 | Last, per ADR decision 18: by then the contract supplies the authoritative method set to enumerate against |

### Three things the sequence depends on

- **The `Partial` → `Required` staging is what makes #5 and #6 separable.** The compile-time
  exhaustiveness check cannot exist until the table is complete, so the table type starts permissive
  with a runtime fallback and tightens in #6. Without that, #5 and #6 are one ~150-entry PR.
- **Identity removal must be simultaneous per method.** If a thunk injects `appId` while the accessor
  still sends `'APP_ID'`, arity breaks. So sentinel removal rides with each method's contract entry —
  which is why #5 covers exactly the emitted set (the sentinel-sending set) and #6 covers the rest
  (which send nothing today).
- **`strict: true` is a hidden cost in #1, not #0.** Host and `base-runtime` both compile
  `strict: false`; the codec and `SecureFields` have to be made strict-clean on the way into
  `protocol/`. It is the one place in the series where "move a file" is not just a move.

### Already landed

Two items this plan once scheduled are done, before the series starts, in the `jsonrpc-lite`
replacement recorded as [ADR 0004](../../adr/0004-in-house-jsonrpc-types-plain-msgpack-envelopes.md):
the in-house JSON-RPC types and the top-level `meta` envelope property. That shrinks PR #2 from
"build a surface over a library" to "move a module", and it removes the `isProtocolError` brand
from the plan — the structural sites already test types this repository owns.

It also adds work to PR #2 that was not there before. `base-runtime/src/lib/jsonrpc.ts` re-exports
the host's **compiled** `dist/lib/jsonrpc`, so there are now two value imports of `dist` from inside
the Deno sandbox, not one. PR #1 deletes the `SecureFields` one; PR #2 deletes this one.

### Not scheduled

Moving the envelope tuple up to the messenger (ADR follow-up 3) — left open and unmeasured by
ADR 0004. It needs `protocol/` to own the framing first, so it sits after #2 at the earliest.

## Surface being covered

- **App→host:** 152 `public do*` declarations across 27 bridge classes (127 unique names, 15 of them
  on `AppResourceBridge`), reachable through 28 `AppBridges` getters plus `AppResourceBridge`; four
  notifications (`ready`, `log`, `unhandledRejection`, `uncaughtException`); `_zPONG`; and the stderr
  metrics line.
- **Host→app:** 11 lifecycle methods, ~70 listeners, 5 UIKit interactions, 1 upload event, the five
  provider/registration-keyed families being flattened in #4, and `_zPING`.

The one-page version of this lands in `packages/apps/protocol/README.md` in PR 0, next to the
contract tables it summarizes.
