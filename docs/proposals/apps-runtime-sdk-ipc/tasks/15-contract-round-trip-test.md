# 15 — Contract round-trip test

**PR 5** · **ADR decision 17** · **Depends on:** [14](14-invoker-table-mechanism.md)

## Goal

Add one round-trip contract test that drives real accessor traffic through the real send path and
into the invoker table. The test is the mechanism that makes cross-runtime drift impossible to
introduce. Type safety is a by-product.

## The pipeline

For each accessor, per emitted `{ method, params }`:

1. Drive the real `base-runtime` accessor class with the existing `createRecordingSender` harness.
2. Push the emitted message through `sanitizeForIpc`.
3. Push it through a structured clone (`v8.serialize` / `v8.deserialize`, or
   `structuredClone`).
4. Validate `params` with the compiled AJV schema.
5. Call the invoker thunk against a stubbed bridge.

Assert three things: the params validate, the stub receives the right arity, and the app id lands
in the right slot.

Step 2 is the step that matters most. Under `serialization: 'advanced'` a function that the
sanitizer misses throws `DataCloneError` and fails the whole send, rather than dropping one field.

## Where it lives

The host suite. AJV, the bridge classes and the invoker table are all host-side, so the test
imports `base-runtime` **source** directly. This inverts ADR 0001's "the host imports nothing from
`base-runtime`" for tests only. `build:default` is untouched.

## No committed fixture corpus

A corpus regenerated alongside the change it was meant to catch proves nothing. The traffic comes
from the accessor classes at test time.

## The coverage report

Only part of the declared surface has real traffic. The test must assert the exercised set against
the declared set and print the un-exercised names. An un-exercised entry is schema-only: declared
and typechecked, never validated against real traffic.

Measured today: accessors emit **121** of the **149** reachable `(getter, do*)` pairs. **28** pairs
have no traffic. Five getters have none at all — `getApiBridge`, `getAppActivationBridge`,
`getAppDetailChangesBridge`, `getCommandBridge`, `getOutboundMessageBridge`.

## Steps

1. Build the harness: recording sender, sanitizer, structured clone, AJV, stub bridge.
2. Enumerate the accessor classes. 38 files in `base-runtime/src` make a `bridgeCall`, over 150
   call sites. 37 of them sit under `lib/accessors/`; `lib/roomFactory.ts` is the other.
3. Run every accessor method, assert the three properties, and collect the exercised keys.
4. Print the declared-minus-exercised set at the end of the run.
5. Add two explicit cases: an accessor that passes a function, and one that passes a `Buffer`.

## Done when

- [ ] The test drives every accessor method that makes a `bridgeCall`.
- [ ] It fails when an accessor sends a param the schema rejects.
- [ ] It fails when a thunk passes the wrong arity to the stub.
- [ ] It prints the un-exercised declared names. The count is 28 until task 18 lands, and stays 28
      after it.
- [ ] A `Buffer` param survives the round trip byte for byte.
- [ ] A function param does not throw, because the sanitizer removed it first.

## Size

~300 lines of harness. It grows with tasks 16 and 18 only in the entries it covers.
