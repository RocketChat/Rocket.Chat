# Settings, persistence, providers, lifecycle

> Part of the [Apps Engine SDK RFC](README.md).

**Settings** — a typed map (`defineSettings`); `ctx.settings.get(key)` returns
the value's type, `ctx.settings.set(key, value)` is type-checked. Legacy
`getValueById(id)` returned `any`.

**Persistence** — typed collections (`defineStore`) with familiar CRUD +
`find(query)`; the useful part of legacy "associations" survives as an optional
per-record tag for cascade cleanup, without the untyped surface. See
[`src/store.ts`](../src/store.ts) and `ctx.store` usage throughout the examples.

**Providers** — `defineVideoConfProvider` / `defineOutboundProvider`; methods
receive `ctx`. See [`src/providers.ts`](../src/providers.ts) and
[`examples/standalone-video-conf.ts`](../examples/standalone-video-conf.ts).

**Lifecycle** — one `ctx` per hook (`onInstall`, `onEnable`, `onDisable`,
`onUninstall`, `onUpdate`, `onSettingUpdated`), replacing the positional
`(context, read, http, persistence, modify)` tuples. `onEnable` returns `false`
to refuse enabling.

