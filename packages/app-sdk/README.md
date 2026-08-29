# @rocket.chat/app-sdk

> **RFC / design proposal — not a shipping package.**

A proposed, Mastra-inspired redesign of the Rocket.Chat **Apps Engine
app-facing API** — the surface an app author writes against. The internal
platform/runtime is intended to be *derived* from this surface, not the other
way around.

- **Read the RFC:** [`rfc/`](rfc/README.md) — one document per scope, with an
  index. Start at [the overview](rfc/00-overview.md).
- **The proposed API:** [`src/`](src) — compiles standalone under strict TS.
- **Worked examples:** [`examples/`](examples) — a full "Reminders" app plus a
  standalone-style app; both type-check against the SDK.

## Why

The legacy engine (`@rocket.chat/apps`, `@rocket.chat/apps-engine`) predates
modern TypeScript ergonomics: a god-class you subclass, string-dispatched
handler interfaces, positional accessor tuples, build-then-finish mutation
builders, and no schemas. This redesign adopts the shape of
[Mastra](https://github.com/mastra-ai/mastra): one declarative registry,
schema-first `define*` factories, and a single injected `ctx` — which, as a
bonus, is what lets the apps runtime move into its own microservice without apps
changing.

Packaging is unchanged: apps are still TypeScript, transpiled, bundled, and
zipped for upload.

## At a glance

```ts
export const remind = app.slashCommand({
  command: 'remind',
  i18nDescription: 'remind_command_desc',
  arguments: z.object({ who: z.string(), minutes: z.number(), text: z.string() }),
  async run(ctx) {
    const { who, minutes, text } = ctx.args;        // typed from the schema
    await ctx.scheduler.runAt(deliverReminder, new Date(Date.now() + minutes * 60_000), {
      roomId: ctx.room, userId: ctx.sender, text, reminderId: '…',
    });
  },
});
```

## Type-check

```bash
tsc -p tsconfig.json --noEmit        # the SDK
tsc -p tsconfig.examples.json        # SDK + examples (offline; uses a vendored zod shim)
```
