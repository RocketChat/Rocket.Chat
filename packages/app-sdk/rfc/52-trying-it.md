# Trying it

> Part of the [Apps Engine SDK RFC](README.md).

```bash
cd packages/app-sdk

# the SDK, including the data layer
tsc -p tsconfig.json --noEmit

# the SDK + all worked examples, whose @ts-expect-error lines assert exact
# inference (offline; uses a vendored zod shim)
tsc -p tsconfig.examples.json
```

Everything under [`src/`](../src) and [`examples/`](../examples) compiles under the
repo's strict TypeScript settings. The examples `import { z } from 'zod'`; offline,
the `zod` specifier is mapped to a tiny shim ([`examples/_vendor/zod.ts`](../examples/_vendor/zod.ts))
so the proposal type-checks without installing dependencies. A real app deletes
the shim and depends on `zod`; nothing else changes.

`src/data.ts` is exported under a namespace — `import { data } from
'@rocket.chat/app-sdk'` — because it *supersedes* parts of `context.ts` and
`models.ts` rather than extending them.
[What it changes](32-data-impact-on-the-surface.md) lists what it replaces.

---

## Package layout

```
packages/app-sdk/
├── README.md
├── rfc/                 ← this RFC, one document per scope (see rfc/README.md)
├── src/                 ← the proposed app-facing API (compiles standalone)
│   ├── app.ts           defineApp / createApp (composition root + DI seam)
│   ├── context.ts       the injected ctx (platform clients)
│   ├── commands.ts      defineSlashCommand
│   ├── jobs.ts          defineJob (+ scheduler client in context.ts)
│   ├── endpoints.ts     defineEndpoint
│   ├── listeners.ts     defineListener (+ event catalog)
│   ├── settings.ts      defineSettings (typed)
│   ├── store.ts         defineStore (typed persistence)
│   ├── ui.ts            defineModal / defineContextualBar / action buttons
│   ├── providers.ts     video-conf / outbound providers
│   ├── manifest.ts      app.json-in-code + permissions
│   ├── models.ts        trimmed domain models (real impl reuses core-typings)
│   ├── data.ts          host data & query layer — see rfc/20-data-overview.md
│   ├── logger.ts        ctx.logger
│   └── schema.ts        Standard Schema contract + inference helpers
└── examples/
    ├── reminder-app/    a full app: commands, jobs, listener, endpoint, modal, lifecycle
    ├── standalone-video-conf.ts   the standalone style + provider + action button
    ├── data-layer.ts    selection inference, views, commands, the request envelope
    └── _vendor/zod.ts   offline compile shim (delete in a real app)
```

| File | What it holds |
|---|---|
| [`src/data.ts`](../src/data.ts) | records, view lenses and guards, the entity model, `Selection` / `Selected` inference, the read clients and command catalogs, the `DataRequest` envelope with its budget checks, and the host-side `defineEntity` / gateway / transport seams |
| [`examples/data-layer.ts`](../examples/data-layer.ts) | selection narrowing, relation hydration at depth 2, cursor lists with closed filters, thread and discussion as views, the team's tagged reference, named commands, and envelope budgeting |
