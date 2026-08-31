# Settings, persistence, providers, lifecycle

> Part of the [Apps Engine SDK RFC](README.md).

**Settings** — a typed map (`defineSettings`); `ctx.settings.get(key)` returns
the value's type, `ctx.settings.set(key, value)` is type-checked. Legacy
`getValueById(id)` returned `any`.

**Persistence** — typed collections (`defineStore`) with familiar CRUD +
`find(query)`, without the untyped surface. Legacy "associations" survive in the
sketch as an optional per-record tag, on the argument that they can drive
cascade cleanup. That argument is a secondary concern and is not settled — see
[Store associations](18-surface-store-associations.md). See
[`src/store.ts`](../src/store.ts) and `ctx.store` usage throughout the examples.

**Providers** — `defineVideoConfProvider` / `defineOutboundProvider`; methods
receive `ctx`. See [`src/providers.ts`](../src/providers.ts) and
[`examples/standalone-video-conf.ts`](../examples/standalone-video-conf.ts).

**Lifecycle** — one `ctx` per hook (`onInstall`, `onEnable`, `onDisable`,
`onUninstall`, `onUpdate`, `onSettingUpdated`), replacing the positional
`(context, read, http, persistence, modify)` tuples. `onEnable` returns `false`
to refuse enabling.

