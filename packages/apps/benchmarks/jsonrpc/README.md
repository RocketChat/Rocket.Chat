# JSON-RPC bridge benchmark

Measures three pipelines against each other on the traffic the Apps-Engine
bridge really carries.

```bash
yarn workspace @rocket.chat/apps bench:jsonrpc
```

## What it compares

| contender          | types           | codec                                        | receive                                                 |
| ------------------ | --------------- | -------------------------------------------- | ------------------------------------------------------- |
| `jsonrpc-lite`     | `jsonrpc-lite`  | copy of the codec at `origin/develop`         | decode, then `parseObject()` to rebuild and re-validate |
| `in-house, no ext` | in-house        | copy of the codec at `origin/develop`         | decode; the type guards categorize at the dispatch site |
| `in-house`         | in-house        | the real `src/server/runtime/base/codec.ts`   | decode; the type guards categorize at the dispatch site |

Every pipeline puts the message on the wire as a plain msgpack map of its own
properties. The first two rows differ only in the types, so their gap is what
the in-house types bought.

The last two rows differ only in which codec file they import. There used to be
a real difference there - a JSON-RPC extension that tagged the envelope as a
positional tuple and handed back a class instance on decode - and `RESULTS.md`
measured it as a net loss (0.88x encode, 0.92x round-trip, for 0.4% of the
wire). It is gone, so the `vs in-house, no ext` column now reads the harness
noise floor. That is the check that it is really gone.

All three cover the same three steps of a message's life, so none gets a head
start:

| step        | `jsonrpc-lite`                                            | in-house                    |
| ----------- | --------------------------------------------------------- | --------------------------- |
| **build**   | factory call, validated with a throwaway `JSON.stringify` | factory call, no validation |
| **encode**  | `Encoder#encode`                                          | `Encoder#encode`            |
| **receive** | `Decoder#decode` plus the categorization step above       | same                        |

`noExtensionCodec.ts` is a verbatim copy of `src/server/runtime/base/codec.ts`
at `origin/develop`, so the two "no extension" columns run the real pre-change
codec, not an approximation of it.

## The corpus

`fixtures.ts` holds 14 messages taken from actual call sites: `app:construct`
with the real `IParseAppPackageResult` of the test app under
`tests/test-data/apps/`, `bridges:*` requests as `bridgeCall()` emits them, the
`{ value, logs }` result envelope, a `log` notification, an error carrying its
log entries, and a 64 KiB upload. Message size on this bridge spans three orders
of magnitude, and the implementations do not rank the same at both ends, so the
report is per fixture rather than one average.

## Reading the report

- **Correctness** runs first. Every fixture must come out of all three pipelines
  field-for-field identical, or the benchmark stops.
- **Wire size** is deterministic: bytes msgpack writes to the pipe.
- **Speed** is ns per message, the median of `BENCH_SAMPLES` samples.
- **GC pressure** counts collections and total pause time per million messages.
  It is process-wide, so read it as a trend across fixtures, not an exact figure.
- **Retained heap** adds `external` to `heapUsed`, because a decoded `Buffer`
  lives off the JS heap and would otherwise not show up at all.

Every table carries one value column per contender, then one `vs` column per
other contender. A `vs` column always reads *the last contender against that
column*: on the speed tables it is a speedup, so above `1.00x` means `in-house`
wins; everywhere else it is a signed percentage, so below `0%` means `in-house`
uses less.

Environment overrides: `BENCH_SAMPLES` (default 7), `BENCH_TARGET_MS` (default
50, the time one sample should take), `BENCH_FILTER` to run a subset by fixture
name, and `BENCH_CONTENDERS` to run a subset of the pipelines by name, e.g.
`BENCH_CONTENDERS='no ext,in-house'` to answer only the extension question.

## The `jsonrpc-lite` dependency

`@rocket.chat/apps` keeps `jsonrpc-lite` as a **devDependency** for this
benchmark only; no runtime code imports it any more. Drop it from
`package.json` along with this folder once the numbers have served their
purpose.
