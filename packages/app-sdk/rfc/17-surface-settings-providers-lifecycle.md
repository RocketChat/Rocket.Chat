# Settings, providers, lifecycle

> Part of the [Apps Engine SDK RFC](README.md).

**Settings** — a typed map (`defineSettings`); `ctx.settings.get(key)` returns
the value's type, `ctx.settings.set(key, value)` is type-checked. Legacy
`getValueById(id)` returned `any`.

**Persistence** — `defineStore` and `ctx.store` have their own scope: [The
store](18-surface-store.md), and [the relation
tag](18a-surface-store-associations.md).

**Providers** — `defineVideoConfProvider` / `defineOutboundProvider`; methods
receive `ctx`. See [`src/providers.ts`](../src/providers.ts) and
[`examples/standalone-video-conf.ts`](../examples/standalone-video-conf.ts).

**Lifecycle** — one `ctx` per hook (`onInstall`, `onEnable`, `onDisable`,
`onUninstall`, `onUpdate`, `onSettingUpdated`), replacing the positional
`(context, read, http, persistence, modify)` tuples. `onEnable` returns `false`
to refuse enabling.

