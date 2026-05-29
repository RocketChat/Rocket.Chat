# Extending: callbacks (in-repo hooks)

**Who this is for:** a developer who needs core behavior to run extra logic at a
lifecycle point (message saved, room created, login validated, …). **After
reading:** you can register a callback correctly and pick the right priority.

> Callbacks are **in-repo** hooks (first-party code). For **marketplace apps**,
> use [apps-engine](./apps-engine.md) instead — different system, fired at
> overlapping points.

---

## The API

Defined in `apps/meteor/server/lib/callbacks.ts` (+ `callbacks/callbacksBase.ts`).

```ts
import { callbacks } from '../../../server/lib/callbacks';

callbacks.add(
  'afterSaveMessage',
  async (message, { room, user }) => {
    // do something; for transformative hooks, return the (modified) value
    return message;
  },
  callbacks.priority.MEDIUM,
  'my-feature-after-save-message',   // stable id (lets you remove/override)
);
```

`add(hook, callback, priority = MEDIUM, id)`.

## Two kinds of hook

- **Event-like** — fire-and-forget side effects (e.g. `afterSaveMessage`). Run
  with `callbacks.runAsync(hook, ...)`.
- **Transformative** — each callback receives a value and returns a (possibly
  modified) one, chained in priority order. Run with
  `await callbacks.run(hook, item, constant)`.

> Server-only: `callbacks.runAsync` throws if called on the client.

## Priority

`callbacks.priority` — **lower number runs first**:

| Name | Value |
|------|-------|
| `HIGH` | `-1000` |
| `MEDIUM` | `0` (default) |
| `LOW` | `1000` |

Use `HIGH` when your callback must see/modify the value before others;
`LOW` to run after everything else.

## Gotchas

- **Await transformative runs.** A caller that forgets `await callbacks.run(...)`
  may proceed before async callbacks finish. The hook system doesn't auto-await
  for you at the call site.
- **Give every callback a stable `id`.** It's how a callback is removed or
  overridden; anonymous callbacks are hard to manage and can be double-registered
  on hot reload.
- Keep callbacks **fast and defensive** — a throw in a transformative chain can
  break the whole operation.

---

**Next:** [apps-engine](./apps-engine.md) ·
[critical-flows](../architecture/critical-flows.md)
