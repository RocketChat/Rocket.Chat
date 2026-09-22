# Task breakdown — `packages/apps/protocol`

These 20 tasks implement the delivery plan in [../README.md](../README.md). The decisions behind
them live in [ADR 0006](../../../adr/0006-apps-subprocess-protocol.md), which builds on
[ADR 0005](../../../adr/0005-ipc-channel-transport.md) for the transport.

One task is one reviewable unit of work. Each task file states its goal, its files, its steps, and
the conditions that make it done. A task never spans two PRs of the plan.

## Baseline

The tasks assume the tree after the IPC transport switch, which
[ADR 0005](../../../adr/0005-ipc-channel-transport.md) records. On that tree msgpack is gone, both
`codec.ts` files are deleted, and `sanitizeForIpc` plus `applySecureFieldsDeep` do what the codec
extensions did.

## The tasks

| # | Task | PR | ADR decisions | Depends on |
| --- | --- | --- | --- | --- |
| 01 | [Protocol project skeleton](01-protocol-project-skeleton.md) | 0 | 2 | — |
| 02 | [Control frames](02-control-frames.md) | 0 | 8 | 01 |
| 03 | [Metrics shape](03-metrics-shape.md) | 0 | 8 | 01 |
| 04 | [Bridge names](04-bridge-names.md) | 0 | 12 | 01 |
| 05 | [Move `SecureFields`](05-move-secure-fields.md) | 1 | 3 | 01 |
| 06 | [Move `IpcSanitizer`](06-move-ipc-sanitizer.md) | 1 | 3 | 01 |
| 07 | [Move the JSON-RPC surface](07-move-jsonrpc-surface.md) | 2 | 4 | 01 |
| 08 | [Asymmetric result envelope](08-asymmetric-result-envelope.md) | 2 | 5 | 07 |
| 09 | [Closed error code enum](09-error-code-enum.md) | 3 | 6 | 07 |
| 10 | [Retire error code `1000`](10-retire-code-1000.md) | 3 | 6 | 09 |
| 11 | [Host→app method set](11-host-to-app-method-set.md) | 4 | 7, 9 | 01, 07 |
| 12 | [Flatten the five keyed families](12-flatten-method-families.md) | 4 | 9 | 11 |
| 13 | [Map-lookup dispatch](13-map-lookup-dispatch.md) | 4 | 7, 9 | 12 |
| 14 | [Invoker table mechanism](14-invoker-table-mechanism.md) | 5 | 10, 11, 13, 14 | 04, 09 |
| 15 | [Contract round-trip test](15-contract-round-trip-test.md) | 5 | 17 | 14 |
| 16 | [Entries for the emitted set](16-contract-entries-emitted-set.md) | 5 | 13, 14 | 14, 15 |
| 17 | [Narrow the `bridgeCall` signature](17-narrow-bridgecall-signature.md) | 5 | 16 | 04 |
| 18 | [Entries for the remaining set](18-contract-entries-remaining-set.md) | 6 | 13, 14, 16 | 16 |
| 19 | [Listener method set and arity](19-listener-method-set.md) | 7 | 15 | 11 |
| 20 | [Listener injection table](20-listener-injection-table.md) | 7 | 15, 17 | 19 |

## Measured surface

Measured on the tree after the transport switch, at the time of this breakdown. Re-measure before
you size a task; the counts move.

| Quantity | Count |
| --- | --- |
| `AppBridges` getters | 28, plus `AppResourceBridge` off that surface |
| Getters that expose no `do*` | `getListenerBridge`, `getInternalFederationBridge`, `getExperimentalBridge` |
| `public do*` declarations across the 27 concrete bridge classes | 151 (126 unique names) |
| Reachable `(getter, do*)` pairs — the size of a complete contract table | **149** |
| Pairs that an accessor emits today | **121** |
| Pairs among those that send the `'APP_ID'` sentinel | **115** |
| Pairs that no accessor emits | **28** |
| Getters with no traffic at all | 5 |
| `bridgeCall` call sites in `base-runtime` | 150 over 38 files, excluding the declaration |
| Listener methods (`AppMethod` `check*`/`execute*`) | 74, over 51 `AppInterface` members |
| `_zPING` / `_zPONG` literal definitions | 4, over 4 files |
| Modules that import the JSON-RPC surface | 26 in `packages/apps`, plus the two `jsonrpc.ts` modules |
| `base-runtime` value imports of the host's compiled `dist` | 3 (`jsonrpc`, `SecureFields`, `IpcSanitizer`) |
| `base-runtime` type-only imports of the host's compiled `dist` | 2 (`roomFactory`, `handlers/app/construct`) |

## One correction to the plan

The plan first split PR 5 and PR 6 at "the ~30 methods accessors actually emit" against "the
remaining ~120". The measurement inverts that ratio: accessors emit **121** of the 149 pairs, and
only **28** pairs have no traffic. The split criterion still holds — PR 5 takes the set with
traffic, because sentinel removal must ride with each entry — but it puts 121 entries in PR 5 and
28 in PR 6. [../README.md](../README.md) now carries the corrected figures.

The ADR treats "the emitted set" and "the sentinel-sending set" as one set. They differ by 6: 121
pairs have traffic, and 115 of those send `'APP_ID'`. Task 16 takes all 121, so that the 6
sentinel-free pairs do not strand in PR 6 with no accessor to test them against.

Task 16 therefore subdivides the emitted set by bridge, and lists the sub-batches. Task 18 keeps
the remainder. If a reviewer prefers smaller units, split task 16 at its bridge boundaries; the
`Partial` table type makes any prefix of the set independently green.
