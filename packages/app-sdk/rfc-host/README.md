# Apps Engine host — RFC index

The other half of the [Apps Engine SDK RFC](../rfc/README.md). That index designs
what an app author writes and what crosses the wire. This one designs what the
host does once the envelope arrives: who the app is, what it may reach, how the
runtime holds it.

One document per scope. Writing rules in [`../CLAUDE.md`](../CLAUDE.md);
nomenclature in [`../GLOSSARY.md`](../GLOSSARY.md).

**Status:** RFC / design proposal. Nothing here ships yet.

## Identity and authority

| | Document | Scope |
|---|---|---|
| 10 | [The app user](10-identity-app-user.md) | the principal assigned at install, and the second gate |

## Storage

| | Document | Scope |
|---|---|---|
| 31 | [The store](31-store-persistence.md) | research report — where an app's records live, who builds the indexes, what an open store costs |

## Runtime and lifecycle

| | Document | Scope |
|---|---|---|
| 40 | [Durable suspend and resume](40-runtime-continuations.md) | research report — how one `await ctx.ui.open` survives a separate request |
| 41 | [The module boundary](41-runtime-module-boundary.md) | research report — what the host sees when an app reaches for `node:net`, and what it costs |

## Reserved ranges

| Range | Covers | Written |
|---|---|---|
| 10–19 | identity and authority | 10 |
| 20–29 | enforcement — where gate 1 runs, the scope table as data | |
| 30–39 | storage — the data gateway (the host side of [27](../rfc/27-data-host-gateways.md)), and the store | 31 |
| 40–49 | runtime and lifecycle — install, enable, disable, update, uninstall; audit and revocation; durable execution state | 40, 41 |
| 50–59 | wrap-up | |

## Related decisions

| | |
|---|---|
| [40](../rfc/40-platform-security-and-permissions.md) | the security rules the app-facing surface promises |
| [42](../rfc/42-platform-permissions.md) | the grant, the single gate, the two principals, consent |
| [43](../rfc/43-platform-field-permissions.md) | gating a field rather than a call |
| [41](../rfc/41-platform-deployment-and-isolation.md) | in-process vs. the apps-runtime microservice |
| [17](../rfc/17-surface-settings-persistence-lifecycle.md) | the app-facing store: `defineStore`, `ctx.store` |
| [18](../rfc/18-surface-store-associations.md) | the relation tag, and whether it survives |
