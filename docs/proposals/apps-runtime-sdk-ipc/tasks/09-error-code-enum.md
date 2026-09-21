# 09 — Closed error code enum

**PR 3** · **ADR decision 6** · **Depends on:** [07](07-move-jsonrpc-surface.md)

## Goal

Close the error code set in `protocol/src/framing/errors.ts`, and declare a `data` shape per code.
Half of this already exists: the moved `jsonrpc.ts` exports the five standard codes and
`SERVER_ERROR` as named constants, and `JsonRpcError` carries the matching static factories. The
codes are loose constants, so nothing stops a call site from writing a number.

## The closed set

| Code | Name | Meaning |
| --- | --- | --- |
| `-32700` | `PARSE_ERROR` | standard |
| `-32600` | `INVALID_REQUEST` | standard; also a known method used with the wrong `kind` |
| `-32601` | `METHOD_NOT_FOUND` | standard; also an unknown bridge or an unknown `do*` |
| `-32602` | `INVALID_PARAMS` | standard; also a schema violation |
| `-32603` | `INTERNAL_ERROR` | standard |
| `-32000` | `SERVER_ERROR` | a handler or a bridge threw |
| `-32070` | `APPS_ENGINE_EXCEPTION` | `AppsEngineException.JSONRPC_ERROR_CODE`, defined in `apps-engine` |

`-32070` sits outside the implementation-defined `-32000..-32099` range. It is not ours to
renumber; `ProxiedApp.call` consumes it.

## Why `data` needs a declared shape

`error.data` carries a raw `Error` at two sites in `handleApp` and one in `handleBridgeMessage`.
Under msgpack that decoded to `{}`. Under structured clone it keeps `name`, `message` and `stack`
and drops every **other** own property — including a `logs` field mutated onto that same `Error`.
The shape changed; it did not become useful. A declared `data` per code, with `logs` as a fixed
field rather than a mutated property, is still the fix.

## Scope

| File | Change |
| --- | --- |
| `protocol/src/framing/errors.ts` | new — the enum, the per-code `data` types, a `JsonRpcErrorCode` union |
| `protocol/src/framing/jsonrpc.ts` | `SerializedJsonRpcError.code` narrows to the union; `data` narrows per code |
| `base-runtime/src/handlers/app/handler.ts` | stop passing a raw `Error` as `data` |
| `src/server/runtime/base/BaseRuntimeSubprocessController.ts` | same, in `handleBridgeMessage` |
| `base-runtime/src/lib/messenger.ts` | `logs` moves onto the declared `data` field |

## Steps

1. Declare the enum and the union in `errors.ts`.
2. Declare one `data` type per code. Give every one of them an optional `logs` field.
3. Narrow `code` on `SerializedJsonRpcError` and on the `JsonRpcError` constructor.
4. Replace every raw-`Error` `data` with the declared shape. Carry `name`, `message` and `stack`
   explicitly if the receiver needs them.
5. Stop mutating `logs` onto an arbitrary `data`. Assign it to the declared field.

## Done when

- [ ] `JsonRpcError`'s constructor rejects a number outside the closed set at compile time.
- [ ] No call site passes an `Error` instance as `data`.
- [ ] `git grep "data.logs ="` and `git grep "\.logs = "` match nothing outside the factories.
- [ ] `-32070` is exported from `protocol/` and `apps-engine` stays the definition site.
- [ ] Existing error tests pass. Add one that asserts `data` shape per code.

## Size

~80 lines added. ~6 call sites changed. Behavior change on the `data` shape only.
