# Apps Engine host — RFC index

The other half of the [Apps Engine SDK RFC](../rfc/README.md). That RFC designs
what an app author writes and what crosses the wire. This one designs what the
**host** does when the envelope arrives: who the app is, what it may reach, how
the runtime holds it, and what the workspace sees.

Same shape as its sibling — one document per **scope**. Each document states one
problem, argues one design, and carries its own open questions. Read the scope
you want to discuss; you do not need the rest.

**Status:** RFC / design proposal. Nothing here ships yet. Every claim about the
current behaviour cites a file and a line on `develop`.

## Identity and authority

Who an app *is* on the workspace, and what that identity is allowed to decide.

| | Document | Scope |
|---|---|---|
| 10 | [The app user](10-identity-app-user.md) | the user assigned at install, and why it is the default actor |

## Conventions

- One scope per document. The number prefixes leave room in each range:
  **10–19** identity and authority, **20–29** enforcement, **30–39** the data
  gateway, **40–49** runtime and lifecycle, **50–59** wrap-up.
- Cross-references are links, not section numbers, so a document can be
  reorganized without breaking its neighbours.
- A claim about today's behaviour cites `path:line`. A claim about the proposal
  does not, because there is nothing to cite yet.

## Scopes we expect to add

Placeholders, not promises. Each becomes a document when it has an argument.

- **Enforcement (20s).** Where the gate from
  [SDK RFC 42](../rfc/42-platform-permissions.md#2-one-gate-and-the-default-is-closed)
  actually runs, the scope table as data, and the test that every `ctx` method
  appears in it.
- **The data gateway (30s).** The host counterpart of
  [SDK RFC 27](../rfc/27-data-host-gateways.md): `defineEntity`, the policy step,
  projection, the loader.
- **Runtime and lifecycle (40s).** Install, enable, disable, update, uninstall —
  what each one does to the app's user, its subscriptions, its jobs and its
  in-flight executions.
- **The workspace's view (40s).** What an admin sees and controls: the app's
  presence in the directory, its audit trail, and revocation.

## Related decisions

| Where | What it settles |
|---|---|
| [SDK RFC 40](../rfc/40-platform-security-and-permissions.md) | the four security rules the app-facing surface promises |
| [SDK RFC 42](../rfc/42-platform-permissions.md) | the grant, the single gate, the two principals, consent |
| [SDK RFC 43](../rfc/43-platform-field-permissions.md) | gating a field rather than a call |
| [SDK RFC 41](../rfc/41-platform-deployment-and-isolation.md) | in-process vs. the apps-runtime microservice |
