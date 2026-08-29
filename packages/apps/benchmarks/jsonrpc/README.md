# JSON-RPC bridge benchmark

Measures `jsonrpc-lite@2.2.0` against the in-house JSON-RPC types on the traffic
the Apps-Engine bridge really carries.

```bash
yarn workspace @rocket.chat/apps bench:jsonrpc
```

## What it compares

Both contenders cover the same three steps of a message's life, so neither gets
a head start:

| step         | `jsonrpc-lite`                                                 | in-house                                       |
| ------------ | -------------------------------------------------------------- | ---------------------------------------------- |
| **build**    | factory call, validated with a throwaway `JSON.stringify`        | factory call, no validation                    |
| **encode**   | msgpack the object as a plain map of its properties              | msgpack through the JSON-RPC codec extension   |
| **receive**  | msgpack decode, then `parseObject()` to rebuild and re-validate  | msgpack decode; the envelope class comes back  |

`legacyCodec.ts` is a verbatim copy of `src/server/runtime/base/codec.ts` at
`origin/develop`, so the "before" column is the real pipeline, not an
approximation of it.

## The corpus

`fixtures.ts` holds 14 messages taken from actual call sites: `app:construct`
with the real `IParseAppPackageResult` of the test app under
`tests/test-data/apps/`, `bridges:*` requests as `bridgeCall()` emits them, the
`{ value, logs }` result envelope, a `log` notification, an error carrying its
log entries, and a 64 KiB upload. Message size on this bridge spans three orders
of magnitude, and the two implementations do not rank the same at both ends, so
the report is per fixture rather than one average.

## Reading the report

- **Correctness** runs first. Every fixture must come out of both pipelines
  field-for-field identical, or the benchmark stops.
- **Wire size** is deterministic: bytes msgpack writes to the pipe.
- **Speed** is ns per message, the median of `BENCH_SAMPLES` samples. `speedup`
  is `jsonrpc-lite / in-house`, so above `1.00x` means the in-house types win.
- **GC pressure** counts collections and total pause time per million messages.
  It is process-wide, so read it as a trend across fixtures, not an exact figure.
- **Retained heap** adds `external` to `heapUsed`, because a decoded `Buffer`
  lives off the JS heap and would otherwise not show up at all.

Environment overrides: `BENCH_SAMPLES` (default 7), `BENCH_TARGET_MS` (default
50, the time one sample should take), and `BENCH_FILTER` to run a subset by
fixture name.

## The `jsonrpc-lite` dependency

`@rocket.chat/apps` keeps `jsonrpc-lite` as a **devDependency** for this
benchmark only; no runtime code imports it any more. Drop it from
`package.json` along with this folder once the numbers have served their
purpose.
