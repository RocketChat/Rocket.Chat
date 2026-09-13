# ADR 0004 — In-house JSON-RPC types with plain msgpack envelopes

## TL;DR

- `packages/apps` owns its JSON-RPC types in `src/lib/jsonrpc.ts`. `jsonrpc-lite` is gone.
- The factories build plain objects. Only `JsonRpcError` stays a class, because the runtime
  separates a failed handler from a successful one with `instanceof`.
- Every message goes on the wire as a plain msgpack map of its own properties.
- The receiver categorizes a message with the type guards at the dispatch site. There is no
  `parseObject()` rebuild and no re-validation. The runtime still gates its stream on the same
  guards, in `parseMessage`.
- Measured against `jsonrpc-lite`: build 3,200x, receive 12.1x, round-trip 11.0x.
- A msgpack codec extension for the envelope was measured and rejected. See
  [Alternatives considered](#alternatives-considered).

## Status

**Accepted — implemented.**

- **Date:** 2026-09
- **Scope:** `packages/apps` — the JSON-RPC envelope on the host/subprocess bridge
- **Builds on:** [ADR 0001](./0001-app-accessor-logic-in-base-runtime.md), which defines the
  message categories this envelope carries

## Decision

1. **The types are in-house.** `src/lib/jsonrpc.ts` exports the four envelope types, the
   factories, and the type guards. The `jsonrpc-lite` runtime dependency is removed.
2. **The factories build plain objects.** `JsonRpcError` is the single exception. The runtime
   tests it with `instanceof`, and its wire type is `SerializedJsonRpcError`.
3. **The wire format is a plain msgpack map** of the envelope's own properties.
4. **The receiver categorizes with the type guards** at the dispatch site — a few field tests per
   branch, no copy of `params`. The guards check the envelope's own slots: the `jsonrpc` version,
   the `method` or `error` payload, the presence of `result`, and the type of the `id`. They are
   mutually exclusive, so an ambiguous map is rejected rather than routed. They never read
   `params`, and they test `result` by presence, never by value.

## Context

The bridge carries `app:*` requests, `bridges:*` calls, results, log notifications, and errors.
Message size spans three orders of magnitude, from a 12-byte `ready` notification to a 64 KiB
upload. Both ends are trusted, and the bytes go to a local pipe, so CPU costs more than wire size.

`jsonrpc-lite` validates every message it builds with a throwaway `JSON.stringify`, then rebuilds
it on receive with `parseObject()`. Neither step buys anything on a trusted local channel.

## Measurements

A temporary benchmark compared the two pipelines over the same three steps — build, encode,
receive:

- **`jsonrpc-lite`** — the package's types, plain msgpack map, `parseObject()` on receive
- **in-house** — the in-house types, plain msgpack map, a six-line receive step that reads 4 fields

The corpus was 14 messages taken from real call sites: `app:construct` with the real
`IParseAppPackageResult` of the test app, `bridges:*` requests as `bridgeCall` emits them, the
`{ value, logs }` result envelope, a `log` notification, an error carrying its log entries, and a
64 KiB upload. All 14 round-tripped field-for-field identically through both pipelines.

Totals for one of each of the 14 messages, in ns, median of 7 samples:

| step       | `jsonrpc-lite` | in-house | ratio  |
| ---------- | -------------- | -------- | ------ |
| build      | 896,327        | 280      | 3,201x |
| encode     | 105,470        | 102,392  | 1.03x  |
| receive    | 862,360        | 71,365   | 12.1x  |
| round-trip | 1,856,104      | 168,990  | 11.0x  |

The throwaway `JSON.stringify` accounts for most of the gap. It is why the two heaviest fixtures
are the worst: the 64 KiB upload builds 47,812x faster in-house, and `app:construct` 1,406x.

Wire size is byte-for-byte equal at 76.0 KiB for the corpus, because both pipelines write the same
map. Retained heap is flat overall — 90.9 KiB against 91.4 KiB — but 16-31% lower in-house on the
small control messages, where the envelope is most of the object.

A re-run of the shipped code reads build 2,780x, receive 11.66x, and round-trip 10.41x against
`jsonrpc-lite`.

Measured on 2026-09-01 at commit `d9d8467f86`: Intel Core i7-11800H 8C/16T, 22 GiB, node v22.22.3,
`@msgpack/msgpack` 3.0.0-beta2, `jsonrpc-lite` 2.2.0, 7 samples of ~50 ms each. The host was a
developer laptop, not an isolated benchmark host. Speed repeated within a few percent between
runs. GC figures did not repeat and were read as trends only.

## Consequences

- `meta` crosses the process boundary, because a map carries a new field without a tuple slot.
- The receiver trusts the sender, and the two sides check it differently. The runtime runs the
  guards once in `parseMessage` and answers an `invalidRequest` to anything they all reject. The
  host has no such step: `parseStdout` categorizes at the dispatch site and logs an unrecognized
  message. Neither side rebuilds the envelope the way `parseObject()` did.
- The benchmark is removed. `jsonrpc-lite` was a runtime dependency on both sides — the
  `dependencies` block of `packages/apps/package.json` and the import map of
  `deno-runtime/deno.jsonc` — and the benchmark was its last remaining reader once the bridge
  stopped importing it. Both entries go with it. Re-adding them is what a re-measurement costs.

## Alternatives considered

### Keep `jsonrpc-lite`

Rejected. Its validation and parse steps are the measured cost.

### A msgpack codec extension for the envelope

Rejected. The first replacement kept the package's class structure, which opened an experiment:
teach the codec about those classes through an `ExtensionCodec` extension. The extension wrote the
envelope as a positional tuple, `[kind, id, method, params]`, and handed the object back on decode
with no receive step at all. The same benchmark ran it as a third pipeline, against the in-house
types on a plain map:

| step       | vs the plain map |
| ---------- | ---------------- |
| build      | 1.00x            |
| encode     | 0.88x            |
| receive    | 0.98x            |
| round-trip | 0.92x            |
| wire size  | -0.4%            |

That is 12% of encode throughput and 8% of round-trip throughput, for 0.4% of the wire.

`ExtensionCodec` hands the extension a byte array rather than a stream position, so the extension
runs a nested encoder, allocates its result, and lets the outer encoder copy those bytes into the
frame. A small control message pays 50-100 ns for the nested encoder. The 64 KiB upload pays the
copy twice: 6.7 us to encode plain, 11.6 us with the extension, and 34% of its round-trip. Without
the upload the extension still loses — encode 0.91x, receive 0.99x, round-trip 0.95x.

The extension won one fixture outright, an all-envelope error at 2.3x on encode, where the tuple
drops 5 map keys and a nested map. It lost round-trip on 10 of the 14 fixtures. The tuple does save
13-65% of the bytes of a small control message, and 25 bytes per message on a local pipe do not pay
for the extra encode.

Two things the experiment settled:

- **The classes were never the cost.** The plain-map pipeline used them throughout and still won.
- **Skipping the receive step buys little.** It helps against `parseObject()`, not against six
  lines that read 4 fields.

The removal is verified rather than assumed: against a verbatim copy of the pre-change codec, the
shipped code reads build 0.99x, encode 1.00x, receive 0.99x, and round-trip 1.01x. That is the
harness noise floor, which is the check that the extension is really gone.

The extension becomes justified again only if wire bytes outweigh CPU — for example if the bridge
stops being a local pipe.

### Move the tuple up to the messenger

Open, and unmeasured. The messenger would encode `[kind, id, method, params]` itself, which keeps
the wire-size gain without the nested encoder and without the copy. The tuple format is not what
lost the measurement; `ExtensionCodec` is.

## Reference index

### This decision

- Types, factories, and guards: `packages/apps/src/lib/jsonrpc.ts`
- Codec: `packages/apps/src/server/runtime/base/codec.ts`; runtime side
  `packages/apps/base-runtime/src/lib/codec.ts`
- Host dispatch: `packages/apps/src/server/runtime/base/BaseRuntimeSubprocessController.ts`;
  transport `.../ProcessMessenger.ts`
- Runtime dispatch: `packages/apps/base-runtime/src/mainLoop.ts`;
  transport `packages/apps/base-runtime/src/lib/messenger.ts`

### The benchmark

Removed from `packages/apps/benchmarks/` once it had served its purpose. The files, and what a
re-run needs, are kept at
<https://gist.github.com/d-gubert/91f0894db68b7232dcb20344e8932e4f>.

### Commits

- Benchmark, since removed: `d9d8467f86`
- `jsonrpc-lite` removal: `938d20930f`
- Codec-instance hoisting, which removed the extension's other cost — a fresh `Encoder` and its
  2 KiB buffer per message: `9167e771ae`
