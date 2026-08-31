# The app user

> Part of the [Apps Engine host RFC](README.md).

An install assigns the app a user. That user is the app's **principal** — the
identity every host call runs under, and the one gate 2 checks.

## The record

`AppManager.createAppUser` (`packages/apps/src/server/AppManager.ts:1186`) writes
it at install and `removeAppUser` (`:1210`) deletes it at uninstall:

```ts
{ username: `${nameSlug}.bot`, name, appId, type: UserType.APP,
  roles: ['app'], status: 'online', isEnabled: true }
```

`roles: ['app']` is already a policy. Fifteen entries in
`apps/meteor/server/lib/authorization/constant/permissions.ts` name that role:

| | |
|---|---|
| create | `create-c`, `create-d`, `create-p`, `start-discussion`, `start-discussion-other-user` |
| see | `view-c-room`, `view-d-room`, `view-joined-room` — and **not** `view-p-room` |
| join | `join-without-join-code`, `leave-c`, `leave-p` |
| messages | `send-many-messages`, `message-impersonate`, `bypass-time-limit-edit-and-delete` |
| transport | `api-bypass-rate-limit` |

Nothing reads it:

```
$ grep -rn "canAccessRoom\|hasPermission" apps/meteor/app/apps/server/bridges/*.ts
$
```

## 1. The host resolves the principal

The envelope carries a discriminator, never an identity:

```ts
principal: { kind: 'app' }      // → the user keyed by this binding's appId
principal: { kind: 'actor' }    // → the user the platform stamped on ctx.actor
```

The app process is untrusted under
[41](../rfc/41-platform-deployment-and-isolation.md), so both branches resolve
host-side. A user id inside an app-supplied payload is data, never authority.

## 2. Two gates, one code path

```
ctx.rooms.get(id)                       ctx.rooms.get(id, { as: ctx.actor })
        ▼                                          ▼
gate 1  grant covers room.read          gate 1  + act-as-user
        ▼                                          ▼
gate 2  canAccessRoom(appUser, room)    gate 2  canAccessRoom(actor, room)
        ▼                                          ▼
        policy / projection / loader — [27](../rfc/27-data-host-gateways.md)
```

> **An app can do what its user can do, within what its grant allows.**

Gate 2 calls the workspace's own `hasPermission` / `canAccessRoom`. Only the
resolved user differs between the columns, which is what makes
[42's intersection rule](../rfc/42-platform-permissions.md#3-two-principals-and-they-intersect)
total: it now covers the default principal too.

## 3. Membership is the room scope

`view-p-room` is not on the `app` role, so a private room is reachable when the
app's user is a member of it. That answers
[42's open question 4](../rfc/42-platform-permissions.md#open-questions) with a
concept admins already have — "only in these rooms" is a subscription list, not a
new axis on the grant.

Two consequences:

- `joinDefaultChannels: true` is dropped from `createAppUser`. Membership follows
  from what the app declares and the admin approves, never from an install
  side effect.
- **Migration.** An installed app that reads private rooms today stops. Each
  install either subscribes its user to the rooms it currently reaches, or runs
  with `view-p-room` granted until an admin reviews it.

## 4. A role per app

`app:<appId>`, seeded from the `app` baseline at install.

A declined optional scope
([consent](../rfc/42-platform-permissions.md#4-consent-is-per-scope)) needs a
durable representation that gate 2 can read, and one shared role gives an admin
no handle on a single app. The cost is one role document per install, in a list
built for organisational roles.

## 5. Identity is keyed, not named

```ts
Users.findOneByAppId(appId)                    // matches any record carrying the id
Users.findOne({ appId, type: UserType.APP })   // the principal — unique index on the pair
```

`appId` is the key. `${nameSlug}.bot` is a label, free to change on update, and
never an input to a decision.

## Lifecycle

| | |
|---|---|
| install | user created, deactivated until enable |
| enable | activated, status `online` |
| disable | **deactivated** — a surviving job or in-flight execution loses its principal at gate 2 |
| update | display name and avatar refresh from the new manifest |
| uninstall | user deleted; the audit trail keeps the id |

## Addressability is declared

Every app gets a principal. Whether that principal is listed in the directory,
messageable and present is a separate flag the app declares. An app with no
conversational surface declares `false` and still has an identity to be checked
against.

## Open questions

1. **What subscribes the app user to a room?** A manifest declaration, an admin
   action at install, or a `room.join` call. Not the first event the app
   receives — that turns delivery into authority, which
   [15](../rfc/15-surface-event-listeners.md#when-narrows-delivery-permissions-narrow-authority)
   rejects.
2. **Is one user per app enough?** An app that runs several bot personas creates
   extra users. Do they inherit the app's authority, carry their own, or stay
   display-only?
3. **Reinstall.** Deleting the user orphans the author line on every message it
   sent; keeping it lets a later install adopt a record nobody reviewed.
4. **Does the actor principal also need the app user?** Requiring both — the
   intersection of three sets — stops an app from using a privileged user as a
   lens onto rooms the app itself cannot see.
5. **Where does gate 2 run under the remote runtime?** Same fork as
   [42's open question 5](../rfc/42-platform-permissions.md#open-questions): a
   lookup per call, or a capability minted per execution.
