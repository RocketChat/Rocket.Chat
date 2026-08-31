# Apps Engine host — RFC index

The other half of the [Apps Engine SDK RFC](../rfc/README.md). That index designs
what an app author writes and what crosses the wire. This one designs what the
host does once the envelope arrives: who the app is, what it may reach, how the
runtime holds it.

One document per scope. Writing rules in [`../CLAUDE.md`](../CLAUDE.md).

**Status:** RFC / design proposal. Nothing here ships yet.

## Identity and authority

| | Document | Scope |
|---|---|---|
| 10 | [The app user](10-identity-app-user.md) | the principal assigned at install, and the second gate |

## Reserved ranges

| | | |
|---|---|---|
| 10–19 | identity and authority | 10 |
| 20–29 | enforcement | where gate 1 runs, the scope table as data |
| 30–39 | the data gateway | the host side of [27](../rfc/27-data-host-gateways.md) |
| 40–49 | runtime and lifecycle | install, enable, disable, update, uninstall; audit and revocation |
| 50–59 | wrap-up | |

## Related decisions

| | |
|---|---|
| [40](../rfc/40-platform-security-and-permissions.md) | the security rules the app-facing surface promises |
| [42](../rfc/42-platform-permissions.md) | the grant, the single gate, the two principals, consent |
| [43](../rfc/43-platform-field-permissions.md) | gating a field rather than a call |
| [41](../rfc/41-platform-deployment-and-isolation.md) | in-process vs. the apps-runtime microservice |
