# The redesign, in one page

> Part of the [Apps Engine SDK RFC](README.md).

**Status:** RFC / design proposal
**Scope:** the *app-facing* API — what an app author writes. The internal
platform/runtime is derived from this surface, not specified here.
**Package:** `@rocket.chat/app-sdk` — illustrative types + worked examples that
type-check (see [Trying it](52-trying-it.md)). Not a shipping implementation.

> This proposal deliberately ignores the current `@rocket.chat/apps` and
> `@rocket.chat/apps-engine` designs except as a reference for what to move away
> from. Packaging is unchanged: an app is still TypeScript, transpiled, bundled,
> and zipped for upload.

---

## TL;DR

Today an app is a subclass of a god-class `App` that registers capabilities
imperatively, implements behavior through dozens of single-method interfaces
dispatched by string name, and reaches the platform through a deep, positional
accessor tree (`read.getRoomReader().getById()`, `modify.getCreator().startMessage()…finish()`).

The proposed SDK borrows Mastra's core shape:

| Mastra | This proposal |
|---|---|
| `new Mastra({ agents, workflows, tools })` — one declarative registry | `defineApp({...})` / `createApp({...})` — one declarative registry |
| `createTool` / `createWorkflow` / `createStep` / `defineSchedule` — factories returning typed, self-validating definitions | `defineSlashCommand` / `defineJob` / `defineEndpoint` / `defineListener` / `defineSetting(s)` / `defineStore` — same idea |
| Schema-first (Standard Schema / Zod) at every boundary | same — args, settings, HTTP bodies, persisted records, modal state |
| One injected params object into `execute` (`{ mastra, requestContext, inputData, … }`) | one injected `ctx` into every handler |
| `suspend()` / `resumeData` for human-in-the-loop | `await ctx.ui.open(modal)` for interactive surfaces |
| Registration injects deps (`__registerMastra`, `__registerPrimitives`) | registration binds `ctx` (local **or** NATS-RPC proxy) |
| Deployers / bundler abstraction | apps-runtime service + Helm knobs |

The single biggest structural win is that **the platform is reached only through
the injected `ctx`**. That one property is what lets the apps runtime move into a
separate, independently-scaled microservice (the stated apps-engine goal) without
apps changing a line.

---

## Design principles

- **One registry, by value.** An app is a set of definitions composed in one
  place. No base class, no `this`, no imperative `provide*`.
- **One factory per capability.** `define*` returns a typed, validated,
  independently-testable definition.
- **One `ctx`.** Every handler receives a single injected context. Read and
  write are unified per domain; mutations take plain (validated) objects, not
  builders.
- **Schemas at every boundary.** If untrusted data enters, a schema describes
  it and the runtime validates it before your code runs.
- **Intent by return value.** Observe = return nothing; pass =
  `ctx.event.pass()`; patch = `ctx.event.patch(subject)`; prevent =
  `ctx.event.prevent(reason)`; prompt = ask the user, then proceed. In-tree ADR
  0002 settles that vocabulary for the legacy engine, and the SDK adopts it —
  see [the event listeners](15-surface-event-listeners.md#the-outcome-vocabulary).
- **The platform is only reachable through `ctx`.** No app imports server
  internals. This is what makes local vs. remote (microservice) execution an
  implementation detail.
- **Reuse `core-typings`.** One set of domain models for apps and server.

