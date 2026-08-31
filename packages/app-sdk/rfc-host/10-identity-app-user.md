# The app user

> Part of the [Apps Engine host RFC](README.md).

An app is assigned a user in the workspace when it is installed. This document
argues that this user is the app's **default actor** — the principal every host
call runs under, and the thing several workspace permissions are checked
against.

The mechanism already exists. `AppManager` creates the user at install and
deletes it at uninstall, the record carries the `app` role, and that role already
holds fifteen workspace permissions. What does not exist is the check. The app
user is an author line on a message and a row in the directory; it decides
nothing.

[SDK RFC 42](../rfc/42-platform-permissions.md#3-two-principals-and-they-intersect)
states the rule for the *actor* principal: a call on a user's behalf succeeds
only if the app's grant covers the scope **and** the user's own permissions cover
the resource. This document supplies the missing half of that sentence — what
the intersection means when the principal is the app itself.

---

## What exists today

`AppManager.createAppUser` runs during install and during update
(`packages/apps/src/server/AppManager.ts:624`, `:778`, defined at `:1186`):

```ts
const userData: Partial<IUser> = {
  username: `${appInfo.nameSlug}.bot`,
  name: appInfo.name,
  roles: ['app'],
  appId: appInfo.id,
  type: UserType.APP,
  status: 'online',
  isEnabled: true,
};

return bridge.create(userData, appInfo.id, {
  avatarUrl: appInfo.iconFileContent || appInfo.iconFile,
  joinDefaultChannels: true,
  sendWelcomeEmail: false,
});
```

Five facts follow from those twelve lines.

- **The record is a real user.** It is inserted into the `users` collection
  (`apps/meteor/app/apps/server/bridges/users.ts:96`), it takes an avatar, it
  joins the default channels, and it reports itself online.
- **It is keyed by `appId`,** with a sparse index on that field
  (`packages/models/src/models/Users.ts:74`). One app, one user, resolvable
  without the app telling anyone who it is.
- **The app can read it** through `read.getUserReader().getAppUser()`, which is
  `Users.findOneByAppId` (`apps/meteor/app/apps/server/bridges/users.ts:37`).
- **It is removed at uninstall** (`AppManager.ts:709` → `removeAppUser` at
  `:1210`), and re-created rather than duplicated on the next install, because
  `createAppUser` returns early when the user already exists.
- **It carries the `app` role,** and that role is not empty.

Fifteen entries in `apps/meteor/server/lib/authorization/constant/permissions.ts`
name `app` in their `roles` array:

| what it covers | permissions held by the `app` role |
|---|---|
| create rooms | `create-c`, `create-d`, `create-p`, `start-discussion`, `start-discussion-other-user` |
| see rooms | `view-c-room`, `view-d-room`, `view-joined-room` |
| join and leave | `join-without-join-code`, `leave-c`, `leave-p` |
| messages | `send-many-messages`, `message-impersonate`, `bypass-time-limit-edit-and-delete` |
| transport | `api-bypass-rate-limit` |

Read that table as a policy and it is a coherent one. An app may see every public
channel, every direct message and any room it has joined; it may **not** see a
private room it is not a member of, because `view-p-room` is granted to `admin`,
`user`, `federated-external`, `anonymous` and `guest` — and not to `app`
(`permissions.ts:83`). It may impersonate a user when it sends, and it may edit
past the workspace's edit window.

That is a deliberate, reviewable answer to "what is an app allowed to do here".
It is also, today, entirely decorative.

---

## What the app user does not do

### 1. Nothing checks it

Grep the bridge layer for the two functions that decide room access and
workspace authority:

```
$ grep -rn "canAccessRoom\|hasPermission" apps/meteor/app/apps/server/bridges/*.ts
$
```

No hits. Every bridge method reaches the models or a server-side `execute*`
helper directly. So the `view-p-room` line above — the one interesting decision
in the whole table — is never consulted. An app with `message.read` reads a
private room it was never invited to, exactly as it reads a public one, and the
role that says otherwise is a comment.

This is [hand-written enforcement](../rfc/42-platform-permissions.md#what-is-broken-today)
seen from the other side. That document observes that a bridge method without a
scope guard is unrestricted. The observation here is narrower and worse: even the
bridge methods that *do* carry a scope guard check only the grant. There is no
second check, because there is no principal to check.

### 2. Identity is an argument, not an authority

`AppMessageBridge.create` (`apps/meteor/app/apps/server/bridges/messages.ts:28`):

```ts
const sentMessage = await executeSendMessage(definedMessage.u._id, definedMessage);
```

The user id comes from the message object the app built. The host does not derive
it, does not compare it to the app user, and does not ask whether this app may
act as that person. `message-impersonate` — the permission that exists precisely
to answer this — is never read. Impersonation is a field an app fills in.

This is the `ctx.actor` rule from
[SDK RFC 40](../rfc/40-platform-security-and-permissions.md) stated for writes
instead of reads, and today it does not hold in either direction.

### 3. "The app user" is ambiguous

`getUserCreatedByApp` filters on `{ appId, type }`
(`apps/meteor/server/lib/users/getUserCreatedByApp.ts`). `findOneByAppId` filters
on `{ appId }` alone (`packages/models/src/models/Users.ts:590`). An app that
creates its own bot users can put its `appId` on them — the converter copies the
field straight through (`apps/meteor/app/apps/server/converters/codecs/users.ts:44`)
— and then "who is this app" is whatever `findOne` returns first.

A principal resolved by a query with no unique key is not a principal.

### 4. Two authority systems that never meet

The workspace has roles and permissions. The apps engine has a grant catalog. An
admin who installs an app agrees to `message.read`; the same install silently
confers `message-impersonate` through the `app` role. Neither system knows the
other exists. The consent screen does not mention the role, and the role does not
narrow when a grant is declined.

### 5. The username is a label pretending to be an identifier

`${nameSlug}.bot` is derived once, at install. Rename the app and the username
is stale; two apps whose slugs collide fail the install with
`The username "x.bot" is already being used`
(`apps/meteor/app/apps/server/bridges/users.ts:93`). Meanwhile `appId` — the
actual key — is stable and unique. The username should be a display concern from
the start.

---

## The rule

> **Every host operation runs under exactly one principal. The default principal
> is the app's assigned user, and the host derives it — the app never names it.**

Three clauses, each carrying a decision.

**"Exactly one."** Not "the app, plus whatever user id appeared in the payload".
The envelope
([the wire contract](../rfc/26-data-wire-contract.md)) carries a *discriminator*,
not an identity:

```ts
principal: { kind: 'app' }                  // the default
principal: { kind: 'actor' }                // the authenticated trigger user
```

The gateway resolves it. `app` → the user record keyed by this binding's `appId`.
`actor` → the user the platform stamped on `ctx.actor`, which the app can pass
through and cannot construct. Neither branch reads a user id out of app-supplied
data, so defect 2 has nowhere to live.

**"The app's assigned user."** The record `createAppUser` already writes. No new
concept, no second identity table, no service account. What changes is that the
record becomes an input to a decision.

**"The host derives it."** Under
[the remote runtime](../rfc/41-platform-deployment-and-isolation.md) the app
process is not trusted, so any principal it computes for itself is a claim. The
resolution belongs on the host side of the transport, in the same gateway that
runs gate 1.

---

## Two checks, always

Gate 1 asks whether the app may perform this kind of operation at all. It reads
the grant. Gate 2 asks whether *this principal* may touch *this resource*. It
reads roles, permissions and subscriptions — the same
`hasPermission` / `canAccessRoom` the REST API uses.

```
ctx.rooms.get(id)                    ctx.rooms.get(id, { as: ctx.actor })
   │                                    │
   ▼                                    ▼
gate 1  grant covers room.read?      gate 1  grant covers room.read?
        (42, the scope table)                + grant covers act-as-user?
   │                                    │
   ▼                                    ▼
gate 2  may the APP USER see          gate 2  may THIS USER see this room?
        this room?                            (their roles, their subscriptions)
   │                                    │
   ▼                                    ▼
policy / projection / loader (27)    policy / projection / loader (27)
```

The two columns differ only in which user gate 2 resolves. That is the point:
**the app principal stops being a special case.** Today "as the app" means "no
check"; under this rule it means "checked against the app's own user", by the
same code path that checks everybody else.

The intersection rule from
[SDK RFC 42](../rfc/42-platform-permissions.md#3-two-principals-and-they-intersect)
now reads the same way in both columns:

> A call succeeds only if the app's grant covers the scope **and** the acting
> principal's own workspace authority covers the resource.

And the failure mode 42 warns about for the actor principal turns out to be the
one we already ship for the app principal. Grant only, and an app borrows an
identity it was never given. There is no identity to borrow when the app has
none of its own.

---

## What this costs, and what it buys

Making the `app` role real changes behaviour. Two changes are worth naming.

**A private room the app user is not in becomes unreadable.** This is the
`view-p-room` line, enforced. It is also the largest compatibility risk in this
document, because an unknown number of installed apps read private rooms today
through a moderation, analytics or archival feature. Three ways out, and the
choice belongs to the 20s scope on enforcement:

1. Grant `view-p-room` to the `app` role and change nothing. Honest, and it
   makes the table above uniformly permissive.
2. Keep it ungranted and make room access a *membership* question: an app reaches
   a private room when its user is in that room. This is the mechanism
   [SDK RFC 42's open question 4](../rfc/42-platform-permissions.md#open-questions)
   is missing — "this app may only act in these rooms" becomes "this app's user
   is a member of these rooms", with no new axis to model.
3. Make it a declared scope. `room.read.private` in the manifest, granted by an
   admin at install, translated into a permission on that app's user.

Option 2 is the one this document recommends, because it reuses a concept every
admin already understands and it survives the remote runtime unchanged. It needs
a migration: existing installs get their user subscribed to what they can
currently reach, or get option 1 as a compatibility flag until they are reviewed.

**Impersonation becomes a check.** `asUser` and `as: ctx.actor` require
`act-as-user` in the grant (gate 1) and `message-impersonate` on the app user
(gate 2). An app that declines the scope, or an admin who strips the permission,
gets a denial rather than a forged author line.

What both buy is a single sentence an admin can act on: **an app can do what its
user can do, within what its grant allows.** Nothing in that sentence needs the
reader to know what a bridge is.

---

## One role, or one role per app?

The `app` role is shared by every installed app. That is fine while it decides
nothing and becomes a problem the moment it does, because an admin who wants to
narrow one app has no handle that does not narrow all of them.

Two options.

- **Shared role, per-user overrides.** Keep `app` as the baseline; express a
  per-app difference as permissions on that app's user record. Cheap, and it
  matches how the workspace already handles exceptions.
- **A role per app,** `app:<appId>`, seeded from the `app` baseline at install.
  Every app gets an independent, nameable, editable authority, and the admin UI
  has something to render. It costs one role document per install and it puts
  app-shaped rows in a list built for organisational roles.

The recommendation is the **per-app role**, for one reason: the grant has to land
somewhere. When an admin declines an optional scope
([consent, in 42](../rfc/42-platform-permissions.md#4-consent-is-per-scope)),
that decision needs a durable representation that gate 2 can read. A role named
after the app is that representation, and it makes the grant and the workspace's
own authority model the same object instead of two systems that never meet
(defect 4).

---

## Lifecycle

The user is not only created and deleted. Five moments need an answer, and today
only two have one.

| moment | today | proposed |
|---|---|---|
| install | user created, joins default channels | user created; **no** auto-join — subscriptions are a grant, not a side effect |
| enable | nothing | user activated, status `online` |
| disable | nothing — the user stays online | user deactivated; it stops answering as a principal, and its subscriptions survive |
| update | `createAppUser` runs again, returns early | same, plus the display name and avatar refresh from the new manifest |
| uninstall | user deleted (`AppManager.ts:709`) | unchanged; the audit trail keeps the id |

Two of those rows are arguments, not bookkeeping.

**`joinDefaultChannels: true` is the wrong default.** It is how an app ends up in
every general channel on a workspace that never asked for it, and — under
recommendation 2 above — it silently widens what the app can read. Membership
should follow from what the app declares and the admin approves.

**A disabled app's user must stop being a principal.** Otherwise a scheduled job
or an in-flight execution that survives the disable keeps acting under a live
identity. Deactivating the user makes gate 2 refuse it without a second
mechanism.

---

## What the workspace sees

The app user is visible: it is in the directory, it can be messaged, and it
reports a presence. That is a product decision the code makes by accident, and
this RFC should make it on purpose.

The argument for visibility is that an app that posts messages needs an author a
reader can click, and an app that answers questions needs a DM to answer them in.
The argument against is that fifteen installed apps put fifteen bots in a
directory built for people.

The position this document takes: **visibility is a property of the app, not of
the identity.** Every app gets a user, because every app needs a principal. An
app declares whether that user is *addressable* — listed, messageable, present —
and an app with no conversational surface declares that it is not. The principal
exists either way, which is what matters for gate 2.

---

## What this changes on the host

- `createAppUser` (`packages/apps/src/server/AppManager.ts:1186`) drops
  `joinDefaultChannels`, and seeds a per-app role instead of the shared `app`
  role.
- `getAppUser` resolves on `{ appId, type: UserType.APP }`, not on `{ appId }`
  alone, and the index becomes unique on that pair.
- The gateway grows a principal-resolution step ahead of the policy step from
  [SDK RFC 27](../rfc/27-data-host-gateways.md), and the policy step calls the
  workspace's own `hasPermission` / `canAccessRoom`.
- The username stops being an identifier: `appId` is the key, `${nameSlug}.bot`
  is a label the update flow may change.
- Nothing changes in the app-facing surface. `ctx.app.user` is already readable
  and was never writable; `asUser` already exists and only now costs something.

---

## Open questions

1. **Does `view-p-room` get granted, or does membership decide?** The three
   options above have different migration costs and different failure modes. The
   answer decides how much of the installed base breaks.
2. **What subscribes the app user to a room?** An explicit manifest declaration,
   an admin action at install, an app call gated by `room.join`, or the first
   event the app receives from that room. The last one is convenient and turns
   delivery into authority, which
   [the event listeners](../rfc/15-surface-event-listeners.md#when-narrows-delivery-permissions-narrow-authority)
   already warns against.
3. **Is one user per app enough?** An app that manages several bot personas
   already creates extra users, and those users are not principals. Do they
   inherit the app's authority, carry their own, or stay display-only identities?
4. **What happens to an app user when the app is uninstalled and reinstalled?**
   Deleting it loses the author line on every message it ever sent. Keeping it
   leaves an orphan record that a later install adopts without review.
5. **Does the actor principal need the app user at all?** A call `as: ctx.actor`
   checks the triggering user. Should it *also* require the app user to have
   reached that resource — the intersection of three sets rather than two? It is
   stricter, and it stops an app from using a privileged user as a lens onto
   rooms the app itself may not see.
6. **Where does gate 2 run under the remote runtime?** Same fork as
   [42's open question 5](../rfc/42-platform-permissions.md#open-questions): a
   synchronous lookup per call, or a capability minted per execution.
