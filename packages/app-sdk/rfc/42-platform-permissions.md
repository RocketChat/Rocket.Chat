# Permissions

> Part of the [Apps Engine SDK RFC](README.md).

[Security & permissions](40-platform-security-and-permissions.md) states the
rules. This document states the model: what a grant is, where it is checked, and
who the principal is.

The catalog (`AppPermissions`) is kept as-is. Everything around it changes.

## What is broken today

| | |
|---|---|
| A grant is a bare name | no resource, no scope: `message.read` means the whole workspace |
| Enforcement is hand-written | 38 `hasPermission` call sites across 26 files; **default open** — an unguarded method is unrestricted |
| Consent is all-or-nothing | `AppPermissionsReviewModal` returns the array it was handed |
| Parameters are inert | `domains`, `hiddenSettings`, `scopes` are typed, defaulted to `[]`, read by no code |
| Tests cannot fail | `hasPermission` returns true when `NODE_ENV === 'test'` |
| One principal | nothing separates "the app reads" from "the app reads for a user who cannot" |
| Defaults are wide | `defaultPermissions` grants ~30 scopes to any pre-permissions app |

## 1. A grant is a scoped record

```ts
permissions: [
  'message.read',
  'message.write',
  { scope: 'networking',          domains:  ['api.example.com'] },
  { scope: 'server-setting.read', settings: ['Site_Url'] },
  { scope: 'act-as-user',         optional: true },
]
```

- The parameter travels with the grant, so the gate has something to check.
- `optional` marks a scope the admin may decline and the app must survive.
- **The union is closed.** `PermissionScope` today ends in `(string & {})`, which
  accepts `'mesage.read'`. Generate it from the host catalog — the retyped copy
  has already drifted (`command` is `slashcommand`, `apis` is `api`,
  `setting.read` does not exist, and `email.send`, `ui.registerButtons`,
  `role.write`, `threads.read`, `abac.read` and the `livechat-*` set are absent).

## 2. One gate, and the default is closed

```
ctx.rooms.archive(id)  →  envelope { entity, op, principal, … }
                              ▼
                          gateway (host)
                          ├─ 1. scope    grant covers  room.write ?   ← this document
                          ├─ 2. policy   may this principal?          ← 27
                          └─ 3. projection / loader / codec           ← 27
```

Gate 1 is a table, not a code path:

| `ctx` surface | scope | gate runs |
|---|---|---|
| `<entity>.get` / `.list` | `<entity>.read` | per envelope |
| `<entity>.<command>` | `<entity>.write` | per envelope |
| `store.*` | `persistence` | per envelope |
| `http.*` | `networking` + domain allow-list | client boundary |
| `scheduler.*` | `scheduler` | client boundary |
| `ui.open` / `ui.show` | `ui.interact` | client boundary |
| `env.serverSetting` | `server-setting.read` + setting allow-list | client boundary |
| `cloud.workspaceToken` | `cloud.workspace-token` + token scopes | client boundary |
| endpoint / command / job / action button | `api` / `slashcommand` / `scheduler` / `ui.registerButtons` | at load |

**A method with no row is denied.** The table is data, so one test asserts that
every `ctx` method appears in it. Registration gates run at load, so a command
declared without `slashcommand` fails to install instead of failing in front of a
user.

Field-level authority — `abacAttributes` and friends — is the same model one
grain finer: [43](43-platform-field-permissions.md).

## 3. Two principals, and they intersect

```ts
await ctx.rooms.get(id);                       // as the app
await ctx.rooms.get(id, { as: ctx.actor });    // as the user — needs act-as-user
```

> A call as the actor succeeds only if the app's grant covers the scope **and**
> the user's own permissions cover the resource. Intersection, never union.

Grant alone lets an app borrow an identity to reach rooms its grant never named.
User alone escalates every user that triggers it. `act-as-user` is itself a
scope, so "this app can act as your users" appears in the consent list.

## 4. Consent is per scope

- Required scope declined → install cancelled.
- Optional scope declined → app installs without it.
- On update the screen shows the **diff**. Re-listing everything trains admins to
  click Agree.

```ts
if (ctx.permissions.has('networking')) {      // sync: the grant is bound at load
  await ctx.http.post(url, { json: payload });
} else {
  await ctx.messages.send({ room, text: t('export_disabled') });
}
```

`ctx.permissions.has` is **advisory**. The app process is untrusted under
[41](41-platform-deployment-and-isolation.md), so the decision is always gate 1,
host-side.

## Parameterized scopes: enforce or delete

| scope | parameter | |
|---|---|---|
| `networking` | `domains` | Enforce host matching. Migration: `[]` must keep meaning *all* for installed apps; a new app must name its hosts. |
| `server-setting.read` | `hiddenSettings` | Invert to an allow-list `settings`. A deny-list leaks every setting added after the app shipped. |
| `cloud.workspace-token` | `scopes` | Enforce at mint. |

**A grant enumerates what an app may do, never what it may not.**

## The bundler cross-check

| | detection | verdict |
|---|---|---|
| Registered capability (`commands`, `endpoints`, `jobs`, `providers`, `actionButtons`) | literal in the registry | **error** |
| `ctx.<client>.<method>` in a handler | static, defeated by aliasing | warning |
| URL host, setting id built at runtime | undecidable | host allow-list only |
| Scope declared but unused | decidable from the manifest | warning (over-request, not breakage) |

## Tests must be able to fail

Delete the `NODE_ENV === 'test'` bypass.

```ts
const ctx = createTestContext({ grants: ['message.read'] });
await expect(app.commands.remind.run(ctx)).rejects.toThrow(PermissionDenied);
```

## What this changes in `src/`

- [`manifest.ts`](../src/manifest.ts) — `permissions?: AppPermission[]`: a closed
  scope name or `{ scope, …params, optional?, required? }`. Generate the union.
- [`context.ts`](../src/context.ts) — `readonly permissions: { has(scope): boolean }`.
- `as` / `asUser` gain the `act-as-user` prerequisite.

## Open questions

1. **Who marks a scope optional?** If only the author does, nobody ever marks
   `networking` optional. Should the catalog force some scopes to be declinable?
2. **What happens to `defaultPermissions`?** Recompute each legacy app's set from
   its bundle, or leave ~30 unreviewed scopes in place?
3. **Is a grant revocable after install?** Bound contexts, in-flight executions
   and scheduled jobs all hold the old answer. Is there an `onPermissionsChanged`?
4. **Is workspace-wide the only install scope?** "Only in these rooms" is the
   request admins actually make.
5. **Where does the actor check run under a remote runtime?** Per call in the
   gateway, or a signed capability minted per execution?
6. **Does the new catalog inherit `email.send`, `experimental.default`,
   `abac.read`?** They have no `ctx` surface here. See [50](50-capability-coverage.md).
