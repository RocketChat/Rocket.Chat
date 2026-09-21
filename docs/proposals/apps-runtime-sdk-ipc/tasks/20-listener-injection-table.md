# 20 — Listener injection table

**PR 7** · **ADR decisions 15, 17** · **Depends on:** [19](19-listener-method-set.md)

## Goal

Replace substring matching over method names with an explicit per-method injection descriptor. The
table lives in `base-runtime`, because injection never crosses the wire.

This lands last. By now the contract supplies the authoritative method set to enumerate against.

## What substring matching decides today

`handlers/listener/handler.ts:parseArgs` makes six decisions from the shape of a method name:

| Test | Decision |
| --- | --- |
| `evtMethod.includes('Message')` | hydrate the context as a message |
| `endsWith('RoomUserJoined')` or `endsWith('RoomUserLeave')` | hydrate `context.room` |
| `includes('PreRoom')` | hydrate the whole context as a room |
| `startsWith('check')` | stop at `(context, reader, http)` |
| `endsWith('Extend')` | splice a `MessageExtender` or a `RoomExtender` at index 1 |
| `endsWith('Modify')` | splice a `MessageBuilder` or a `RoomBuilder` at index 1 |

Then `evtMethod === 'executePostMessageDeleted'` adds a second hydrated param.

`handlers/app/handler.ts` makes a seventh: `startsWith('check') || startsWith('execute')` routes to
the listener handler at all. Task 13 already removed that one.

## Why this is worth doing

No current misfire was found. The matching is correct by coincidence, not by construction. A future
event with the wrong word in its name silently gets different injection — an event named
`executePostRoomMessageArchived` would be hydrated as a message because of one substring.

## The arity assertion

ADR decision 17 pairs the table with an arity assertion. Assert the declared arity from task 19
against the params the host actually sends, and against the arity each descriptor produces.
`parseArgs` currently rejects `params.length < 1 || > 2`, which is the loose form of the same check.

## Scope

| File | Change |
| --- | --- |
| `base-runtime/src/handlers/listener/injection.ts` | new — one descriptor per listener |
| `base-runtime/src/handlers/listener/handler.ts` | `parseArgs` reads a descriptor |
| `base-runtime/src/handlers/tests/listener-handler.test.ts` | grows to cover the table |

## The descriptor

One descriptor states: which hydration the context gets, which extra object is spliced at index 1,
and which accessors follow. Derive nothing from the name.

## Steps

1. Enumerate the 74 listener names from the protocol set.
2. Compute each one's descriptor from today's `parseArgs`, mechanically. Do not correct a
   descriptor in this task, even if it looks wrong; record it and fix it separately.
3. Rewrite `parseArgs` as a descriptor read.
4. Add the arity assertion.
5. Add a test that asserts each of the 74 names has a descriptor.

## Done when

- [ ] `parseArgs` calls no `includes`, `startsWith` or `endsWith` on a method name.
- [ ] Every one of the 74 listener names has a descriptor, and a test asserts it.
- [ ] For each name, the new descriptor produces the same argument list the old matching produced.
      A differential test over all 74 names is the cheapest proof.
- [ ] The arity assertion fires when a listener receives the wrong number of params.
- [ ] `listener-handler.test.ts` passes, and the `*PostMessageDeleted` pair keeps its second param.

## Size

74 descriptors, ~200 lines. ~60 lines of `parseArgs` deleted. No wire change.

## After this task

The proposal document `docs/proposals/apps-runtime-sdk-ipc/` is deleted, per its own header.
ADR 0005 and ADR 0006 stay as the record.
