# Capability coverage (legacy → new)

> Part of the [Apps Engine SDK RFC](README.md).

Everything the legacy app-facing surface exposes has a home. `✅` designed here;
`◑` designed, deep details deferred (see [the open questions](51-open-questions.md)).

| Legacy | New | |
|---|---|---|
| `App` subclass + `extendConfiguration` | `defineApp` / `createApp` | ✅ |
| lifecycle hooks (positional accessors) | `lifecycle: { onInstall, onEnable, … }` (one `ctx`) | ✅ |
| `ISlashCommand` (+ preview trio) | `defineSlashCommand` (+ `preview`) | ✅ |
| `IProcessor` + `scheduleOnce/Recurring` | `defineJob` + `ctx.scheduler.runAt/runEvery` | ✅ |
| `IApi` / `IApiEndpoint` | `defineEndpoint` | ✅ |
| Pre/Post × Prevent/Extend/Modify interfaces | `defineListener` (intent by return) | ✅ |
| `ISettingsExtend` / typed reads | `defineSettings` + typed `ctx.settings` | ✅ |
| `IPersistence` + associations | `defineStore` typed collections (+ associations) | ✅ |
| `IRead` / `IModify` accessor trees | `ctx.*` domain clients | ✅ |
| `IHttp` / `INotifier` / `ILogger` | `ctx.http` / `ctx.notify` / `ctx.logger` | ✅ |
| `IEnvironmentRead/Write` | `ctx.settings` / `ctx.env` | ✅ |
| video-conf / outbound providers | `defineVideoConfProvider` / `defineOutboundProvider` | ✅ |
| action buttons | `ActionButton` with co-located `onClick` | ✅ |
| modals / contextual bars + interaction handlers | `defineModal` / `defineContextualBar` + `ctx.ui.open` (suspend/resume) | ◑ |
| UIKit block authoring (`BlockBuilder`) | `@rocket.chat/ui-kit` component helpers | ◑ |
| OAuth2 client helper | ships as an SDK helper over `ctx` (settings + endpoint) | ◑ |
| Livechat / Omnichannel accessors | `ctx.livechat` (trimmed here) | ◑ |
| external components (iframes) | surface contribution (out of scope here) | ◑ |
| federation / ABAC / experimental | out of scope here | ◑ |

