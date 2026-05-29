# Extending: integrations (webhooks)

**Who this is for:** a developer working on incoming/outgoing webhooks or
debugging one. **After reading:** you know the two directions, where the code is,
and the sandbox constraint.

---

## Two directions

- **Incoming webhook** — an external system `POST`s to a generated URL; the
  integration turns the payload into a message. Entry:
  `apps/meteor/app/integrations/server/api/api.ts`.
- **Outgoing webhook** — a room event (new message, join, leave, …) triggers an
  HTTP request to an external URL. Dispatch:
  `apps/meteor/app/integrations/server/lib/triggerHandler.ts`; event wiring in
  `.../server/triggers.ts`.

Layout: `apps/meteor/app/integrations/server/` → `api/`, `lib/`, `methods/`,
`triggers.ts`. Persistence via the `Integrations` model.

## Trigger scripts run sandboxed

Both directions can run a user-provided **JavaScript script** to transform the
payload/message. These scripts execute in a **sandbox (isolated VM)** — they do
**not** have access to monolith internals, `require`, or the network beyond what
the integration provides.

> **Gotcha:** don't expect a trigger script to import server modules or call
> models directly. If an integration needs deeper access, that's a sign it
> should be an [App](./apps-engine.md), not a webhook script.

## When to use what

| Need | Use |
|------|-----|
| Bridge a simple external event ↔ a message | Integration / webhook |
| Rich behavior, UI, lifecycle, marketplace distribution | [Apps-Engine](./apps-engine.md) |
| First-party core behavior | [Callbacks](./callbacks.md) |

---

**Next:** [apps-engine](./apps-engine.md) · [callbacks](./callbacks.md)
