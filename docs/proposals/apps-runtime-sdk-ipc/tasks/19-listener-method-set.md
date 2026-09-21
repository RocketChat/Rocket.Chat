# 19 — Listener method set and arity

**PR 7** · **ADR decision 15** · **Depends on:** [11](11-host-to-app-method-set.md)

## Goal

Declare the listener method set and its arity in `protocol/`. Declare only what crosses the wire:
the method names and `1 | 2`.

## What crosses the wire

The wire contract for all listeners is a uniform `params: [context]`. One pair is the exception:
`checkPostMessageDeleted` and `executePostMessageDeleted` take `[message, context]`. That pair is
visible at `AppListenerManager.ts:~645`, where the call passes `message` then `context` with a
comment that says `message` stays for compatibility.

Injection — which accessors each listener receives — does **not** cross the wire. It must not live
in `protocol/`. Task 20 puts it in `base-runtime`.

## The source of truth

`AppMethod` in `packages/apps-engine/src/definition/metadata/AppMethod.ts` declares 74 `check*` and
`execute*` members, over 51 `AppInterface` members. Derive the set from `AppMethod`, not from a
hand-written list, so that a new listener in `apps-engine` shows up here.

## Steps

1. Add the listener entries to `protocol/src/contracts/methods.ts`, or to a sibling module that
   `methods.ts` re-exports.
2. Give each entry `arity: 1`, except the `*PostMessageDeleted` pair, which is `arity: 2`.
3. Add a test that enumerates `AppMethod`'s `check*` and `execute*` members and asserts that each
   has an entry. The test must fail when `apps-engine` adds a listener.

## Done when

- [ ] All 74 listener names have an entry.
- [ ] Only the `*PostMessageDeleted` pair has `arity: 2`.
- [ ] The enumeration test fails on a name with no entry.
- [ ] Nothing about accessor injection appears in `protocol/`.

## Size

74 entries, one line each. No behavior change.
