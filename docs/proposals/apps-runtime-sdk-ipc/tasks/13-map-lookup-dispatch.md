# 13 — Map-lookup dispatch

**PR 4** · **ADR decisions 7, 9** · **Depends on:** [12](12-flatten-method-families.md)

## Goal

Replace string surgery with a map lookup against the declared method set. Three dispatchers do
string surgery today.

## The three dispatchers

### `mainLoop.ts:requestRouter`

Splits the method on `:` and indexes a `methodHandlers` object with the first segment. After task
02 the dead `ping` entry is gone. Replace the split with a lookup in `methods.ts`, and branch on
the entry's family rather than on a prefix string.

### `handlers/api-handler.ts`

Splits, pops the HTTP method, rejoins the rest as the path. Task 12 deletes the need for all three
operations. This task deletes the code.

### `handlers/app/handler.ts:handleApp`

Splits the method and then runs a chain over the second segment: `isOneOf(appMethod, uploadEvents)`,
`isOneOf(appMethod, uikitInteractions)`, `appMethod.startsWith('check') || appMethod.startsWith('execute')`,
and then a 10-arm `switch`. Replace the chain with one lookup that yields the handler.

## `kind` enforcement

Dispatch looks the method up **first**. An unknown method yields `-32601`. A known method used with
the wrong `kind` yields `-32600`. `requestRouter` answers every notification with `-32600` today,
which the new rule preserves; ADR 0006 records that deviation from JSON-RPC 2.0 as deliberate.

## Steps

1. Give `methods.ts` a family or handler discriminant per entry, if task 11 did not.
2. Rewrite `requestRouter` as a lookup plus a switch on the discriminant.
3. Delete `api-handler.ts`'s split, pop and join.
4. Rewrite `handleApp`'s prefix chain and `switch` as one lookup.
5. Keep `getStatus` special-cased. It deliberately produces no log.

## Done when

- [ ] `git grep "split(':')"` matches nothing in `packages/apps/base-runtime/src`.
- [ ] `git grep "startsWith('check')\|startsWith('execute')"` matches nothing in
      `handlers/app/handler.ts`.
- [ ] An unknown method yields `-32601`, and a test asserts it.
- [ ] A notification on a request-kind method yields `-32600`, and a test asserts it.
- [ ] `app-handler.test.ts`, `api-handler.test.ts`, `scheduler-handler.test.ts`,
      `slashcommand-handler.test.ts` and `videoconference-handler.test.ts` pass.

## Size

~120 lines rewritten, ~60 deleted. No wire change beyond task 12's.
