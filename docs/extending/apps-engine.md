# Extending: Apps-Engine (marketplace apps)

**Who this is for:** a developer working on the Apps platform, or deciding
between an App and an in-repo callback. **After reading:** you know what
Apps-Engine is, how apps hook into core, and the key gotcha.

> Deep migration/feature detail: [apps-engine-migration](../apps-engine-migration.md).

---

## What it is

Apps-Engine is the **SDK + runtime for third-party marketplace apps** — code
that is *not* part of this repo but plugs into Rocket.Chat at runtime.

- SDK / runtime: `packages/apps-engine` (the `App` base class:
  `packages/apps-engine/src/definition/App.ts`).
- Integration into the monolith: `packages/apps` + `apps/meteor/app/apps`.

**App vs callback:** use [callbacks](./callbacks.md) for first-party in-repo
behavior; Apps-Engine is for installable, sandboxed apps with their own
lifecycle (`initialize`, `onEnable`, `onSettingUpdated`, …).

## How apps hook into core flows

Core dispatches **events** that apps can handle. For messages, the flow fires
(see [critical-flows](../architecture/critical-flows.md)):

- `IPreMessageSentPrevent` — an app can **block** the send.
- `IPreMessageSentExtend` — an app can **modify** the message before save.
- `IPostMessageSent` — notify after save.

Plus many more (reactions, pins, room lifecycle, etc.).

## The gotcha: post-events are fire-and-forget

Core dispatches post-events without awaiting them:

```ts
void Apps.self?.triggerEvent(messageEvent, message);   // not awaited
```

So a crashing or slow app **cannot block** the core message flow. Consequences:

- An app **must handle its own errors** — an unhandled throw is swallowed, not
  surfaced to the user action.
- Don't rely on a post-event app having finished before the next core step runs.
- `Apps.self?.isLoaded()` is checked before triggering; if the Apps subsystem
  isn't loaded, events simply don't fire.

## What apps can provide

Custom slash commands, API endpoints, UI (UIKit blocks/contextual bars),
scheduler jobs, and reactions to the events above — all through the accessors
the SDK exposes, never by importing monolith internals.

---

**Next:** [integrations-webhooks](./integrations-webhooks.md) ·
[callbacks](./callbacks.md)
