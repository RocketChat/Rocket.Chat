---
title: Interoperability with `@rocket.chat/core-typings`
kind: research report
status: informs a stated pillar; decides nothing on its own
decides: none
informs: "00-overview.md — the design principle \"Reuse core-typings\"; 21, 24, 26, 28, 43"
createdAt: 2026-08-31
author: Douglas Gubert
branch: claude/apps-engine-api-redesign-8py65c
baseCommit: e3b6f3db5cec368d8f5e2e825c86a36fbff921c3
baseRef: origin/develop
baseCommitDate: 2026-08-31
baseCommitSubject: "refactor: move `app/ui` modules (#41928)"
question: >
  Should the SDK depend on @rocket.chat/core-typings for its domain models, and
  in what form? What does the dependency cost, and what does a second, parallel
  map cost instead?
verification:
  method: static analysis of the tree at baseCommit; every count is a committed shell command
  commands: see the final section — each one reproduces a number quoted here
  packageVersions: "workspace 8.9.0-develop; npm latest 8.3.8, rc 8.8.0-rc.2"
  note: >
    npm view was run against the live registry on 2026-08-31, so the published
    version and dependency ranges may have moved since.
readAgainst:
  - packages/core-typings/src
  - packages/core-typings/dist
  - packages/apps-engine/src/definition
  - packages/apps/src
  - apps/meteor/app/apps/server/converters
  - packages/app-sdk/src
  - .changeset/config.json
  - docs/npm-publishing.md
findings:
  - "12 core-typings room fields reach an app nowhere — topic, announcement, broadcast, archived, encrypted, usersCount and 6 more"
  - "the parallel map costs 2,270 lines of converter plus 969 lines of golden test"
  - "apps-engine declares two disagreeing room shapes: IRoom (23 fields) and IRoomRaw (34), 13 fields in only one"
  - "core-typings is in a changesets `fixed` group with @rocket.chat/meteor, so its version is the server version"
  - "the barrel re-exports dist/Ajv.js — 456 KB of typia JSON Schema — with no exports map and no sideEffects flag"
  - "core-typings exports 45 is* guards; 28-data-views.md hand-writes three of them against the wrong field names"
  - "not blockers, as suspected: the typia patch: protocol is rewritten on publish, and mongodb is a devDependency in 3 files"
---

# Interoperability with `@rocket.chat/core-typings`

> Part of the [Apps Engine SDK RFC](../README.md).

**Companion to:** [the overview](../00-overview.md), whose design principle "Reuse
`core-typings`. One set of domain models for apps and server." this document
substantiates or qualifies. It also bears on
[the entities](../21-data-entities.md), [the read surface](../24-data-read-surface.md),
[the wire contract](../26-data-wire-contract.md), [views](../28-data-views.md) and
[field-level permissions](../43-platform-field-permissions.md).
**Scope:** one question — should the SDK depend on `@rocket.chat/core-typings`,
and in what form? The entity model, the read predicate and the cursor codec
belong to the other data-layer documents.

---

## 1. TL;DR

**Depend on `core-typings`, but not on its barrel.**

The drift risk is real and it is measurable. The legacy engine maintains a
parallel map of the same documents, and that map now hides **12 room fields
that an app cannot read at all** — including `topic`, `announcement`,
`encrypted`, `broadcast`, `archived` and `usersCount`. The translation layer
that keeps the two maps in step costs **2,270 lines** of converter code and
**969 lines** of test. This is the eighth defect in
[what's wrong with the legacy API](../02-legacy-api-problems.md), and the numbers
in [§3](#3-the-drift-is-measured-not-feared) prove it.

But `core-typings` is not a public app contract today, and three properties
block a naive dependency:

1. Its version is **welded to the server version** by a changesets `fixed`
   group. An app that pins `^8` pins a Rocket.Chat major.
2. Its barrel exports a **456 KB** typia-generated schema blob, with no
   `exports` map and no `sideEffects` flag.
3. Its types are **storage documents**, not an app contract: `_id`, `_updatedAt`,
   `e2eKeyId`, `usersWaitingForE2EKeys`, 35 `any`s and 14 `@deprecated` members.

The recommendation is a **curated, generated subset**: the SDK re-exports named
types from `core-typings` through its own module, and a build-time check fails
when a re-exported field disappears or changes shape. That gives one source of
truth without giving apps the storage document. [§6](#6-the-recommendation)
specifies it.

---

## 2. What "interoperability" can mean

The word covers three different couplings. They carry different risks, and the
RFC must choose per coupling, not once.

| # | Coupling | What it means | Verdict |
|---|---|---|---|
| **A** | **Type identity** | `Room` in the SDK *is* `IRoom` from `core-typings`, so a value flows between an app and server code with no cast | recommended, with a curated subset |
| **B** | **Runtime reuse** | An app calls `isDiscussion(room)`, `isThreadMessage(msg)` from `core-typings` | recommended, but re-export it; do not let apps import the barrel |
| **C** | **Wire identity** | the NATS envelope in [the wire contract](../26-data-wire-contract.md) carries `core-typings` documents verbatim | **rejected** — see [§5.4](#54-the-wire-does-not-carry-documents) |

Coupling A removes the second map. Coupling B removes the second set of type
guards. Coupling C would remove the projection layer, and with it the cost
ceiling and the field-permission gate.

---

## 3. The drift is measured, not feared

### 3.1 Two maps for one room

`core-typings` declares `IRoom` with **48 fields**
([`IRoom.ts:12`](../../../core-typings/src/IRoom.ts)). The legacy engine declares
two more shapes for the same document:

| Shape | Where | Fields |
|---|---|---|
| `IRoom` | [`apps-engine/definition/rooms/IRoom.ts`](../../../apps-engine/src/definition/rooms/IRoom.ts) | 23 |
| `IRoomRaw` | [`apps-engine/definition/rooms/IRoomRaw.ts`](../../../apps-engine/src/definition/rooms/IRoomRaw.ts) | 34 |

The two app-facing shapes do not agree with each other. Thirteen fields appear
only in `IRoomRaw` (`closedAt`, `closer`, `contactId`, `departmentId`, `isOpen`,
`isWaitingResponse`, `members`, `parentRoomId`, `responseBy`, `servedBy`,
`source`, `visitor`, `closedBy`). Two appear only in the rich `IRoom`
(`abacAttributes`, `parentRoom`). An app therefore reads a different room
depending on which method returned it.

### 3.2 Twelve fields an app cannot read

The codec at
[`converters/codecs/rooms.ts`](../../../../apps/meteor/app/apps/server/converters/codecs/rooms.ts)
maps 16 `core-typings` room fields by rename, plus a handful by function. The
following fields appear **nowhere** in the converter layer, in
`packages/apps/src`, or in the apps-engine room definitions. A grep across all
three returns zero:

```
topic            announcement        broadcast        archived
featured         reactWhenReadOnly   joinCodeRequired usersCount
muted            avatarETag          autoTranslate    e2eKeyId
```

`room.encrypted` and `room.lastMessage` also never reach an app; the only
matches for those names are unrelated (a marketplace license, and the
omnichannel visitor's `lastMessageTs`).

This is the cost of the parallel map stated as a user-visible defect. An app
cannot ask whether a room is archived. An app cannot read the topic it is
supposed to moderate. Nobody decided that; the second map simply never grew the
field.

### 3.3 What the translation costs

| Artifact | Lines |
|---|---|
| `apps/meteor/app/apps/server/converters/**` (converters + codecs) | 2,270 |
| `tests/unit/app/apps/server/converters.golden.spec.ts` + `.edge.spec.ts` | 969 |
| **Total** | **3,239** |

The largest single file is the room codec, at 462 lines. That is the price of
keeping two maps in step, and the golden tests exist because the maps *do* drift.

### 3.4 The SDK is on the same road

[`src/models.ts`](../../src/models.ts) already declares a third map. Its own
docblock names the problem and defers it. Its `RoomType` union is wrong against
the domain, and [the entities](../21-data-entities.md#what-the-entity-analysis-rules-out)
already records that. That is drift appearing inside a proposal that has not
shipped.

[Views](../28-data-views.md) hand-writes three type guards:

```ts
export const isDiscussion = (room: Room): room is Discussion => room.parentRoomId !== undefined;
export const isDirect     = (r: Room): r is DirectRoom => r.type === 'direct';
export const isTeamMain   = (r: Room) => r.teamMain === true;
```

`core-typings` already exports all three, plus 42 more `is*` guards, against the
real field names:

```ts
export const isDiscussion        = (room: Partial<IRoom>): room is IRoom => !!room.prid;
export const isDirectMessageRoom = (room: Partial<IRoom>): room is IDirectMessageRoom => room.t === 'd';
export const isTeamRoom          = (room: Partial<IRoom>): room is ITeamRoom => !!room.teamMain;
```

`isThreadMessage`, `isThreadMainMessage`, `isDiscussionMessage`,
`isPublicDiscussion`, `isPrivateDiscussion`, `isOmnichannelRoom`,
`isSystemMessage` and `isE2EEMessage` cover most of what
[views](../28-data-views.md) needs. **This is the single clearest benefit in the
report: the lens layer of the data design already exists and is already
maintained by the server team.**

---

## 4. Feasibility: what works today

### 4.1 The package is genuinely public

- It publishes to npm under `access: public` through `release.yml`, with OIDC
  provenance ([docs/npm-publishing.md](../../../../docs/npm-publishing.md)).
- The published tarball ships `dist` only, with `.d.ts` beside `.js`.
- The `patch:` protocol on `typia` is a **workspace** concern. The published
  `package.json` rewrites it to `~9.7.2`, so an npm or pnpm consumer resolves it.
  This was a suspected blocker. It is not one.

### 4.2 MongoDB does not leak into the runtime

`mongodb` is a **devDependency**, and only three files import from it —
`IRocketChatRecord.ts`, `ITeam.ts`, `ServerAudit/IAuditUserChangedEvent.ts` —
for `WithId`, `Filter`, `UpdateFilter`, `FindOptions`, `Document` and
`SchemaMember`. None of the six appears in `IRoom`, `IUser` or `IMessage`. A
curated subset therefore carries no driver dependency.

### 4.3 The runtime dependencies are small and shared

`zod ~4.3.6`, `typia ~9.7.2`, `@rocket.chat/ui-kit ~1.0.0`,
`@rocket.chat/message-parser ^0.31.35`, `@rocket.chat/icons ~0.47.0`.

The SDK wants `zod` anyway — [the design principles](../00-overview.md#design-principles)
put a schema at every boundary. It wants `ui-kit` anyway, for
[block authoring](19-ui-block-authoring.md). So two of the five are
already on the SDK's own bill of materials, and sharing one version is a benefit,
not a cost.

### 4.4 Schemas already exist for the boundary

`IRocketChatRecord` is defined *from* a Zod schema, not the reverse:

```ts
export const IRocketChatRecordSchema = z.object({ _id: z.string(), _updatedAt: TimestampSchema });
export interface IRocketChatRecord extends z.infer<typeof IRocketChatRecordSchema> {}
```

`TimestampSchema` is a `z.codec` that encodes a `Date` to an ISO string and
decodes it back. That is exactly the transformation
[the wire contract](../26-data-wire-contract.md) needs, and it is already written
and already tested by the server. See [§5.4](#54-the-wire-does-not-carry-documents)
for why this matters.

---

## 5. The risks

### 5.1 Version coupling — the highest risk

`.changeset/config.json` declares:

```json
"fixed": [["@rocket.chat/meteor", "@rocket.chat/core-typings", "@rocket.chat/rest-typings"]]
```

A `fixed` group forces every member to the **same version number on every
release**. `core-typings` 8.9.0 is therefore Rocket.Chat 8.9.0, and the package
has 314 changelog entries to prove the cadence. Two consequences follow.

**An app pins a server major.** An app that declares
`"@rocket.chat/core-typings": "^8"` states that it does not run against
Rocket.Chat 9. That is almost never what the app author means, and it is the
opposite of what the marketplace needs.

**The version carries no signal.** `core-typings` bumps a minor when the Meteor
app bumps a minor, whether or not a single type changed. An app author cannot
read the version to learn whether the models moved.

*Mitigation.* The SDK owns its own version line and re-exports. `core-typings`
becomes a **dependency of `@rocket.chat/app-sdk`**, never a peer dependency and
never a direct dependency of an app. The SDK's semver then describes the app
contract, which is the only thing an app author can act on. This mitigation is
the main reason [§6](#6-the-recommendation) rejects a plain re-export of the
barrel.

### 5.2 The barrel is heavy and unsplittable

| Property | Value |
|---|---|
| `dist` total | 2.8 MB |
| `dist` JavaScript | 1.2 MB |
| `dist/Ajv.js` | **456 KB** |
| `exports` map | none |
| `sideEffects` | not declared |
| Module format | CommonJS, `target: es2020` |

The barrel ends with `export { schemas } from './Ajv'`, where `schemas` is a
typia-generated JSON Schema document for 34 entity types. So
`import { isDiscussion } from '@rocket.chat/core-typings'` pulls 456 KB into any
bundler that does not tree-shake — and
[docs/bundle-optimization-react-aria.md](../../../../docs/bundle-optimization-react-aria.md)
records that Meteor's bundler does not. An app is bundled and zipped for upload,
so this lands in every app artifact.

*Mitigation.* Two fixes, and they are independent. The SDK re-exports through
its own module, so an app never names `core-typings` in an import. Separately,
`core-typings` should gain `"sideEffects": false` and an `exports` map with a
`./Ajv` subpath. The second fix helps the server too, so it is worth proposing
regardless of this RFC.

### 5.3 The types are storage documents

`core-typings` describes what MongoDB holds. It does not describe what an app
may see. The gap is concrete:

- **Identity.** `_id` and `_updatedAt`, not `id` and `updatedAt`. Relations are
  embedded and abbreviated: `u`, `prid`, `tmid`, `drid`, `rid`, `lm`, `msgs`.
- **Secrets.** `e2eKeyId`, `usersWaitingForE2EKeys`, `joinCode` and the whole
  `services` shape on `IUser` must never reach an app.
  [Field-level permissions](../43-platform-field-permissions.md) exists precisely
  for this, and today the room codec already reaches for
  `secureFieldsMapper` from `@rocket.chat/apps`.
- **Rot.** 35 `: any` occurrences and 14 `@deprecated` members. `IRoom` alone
  carries `/* @deprecated */ federated`, `/* @deprecated */ customFields:
  Record<string, any>`, and a `rolePrioritiesCreated?: number | boolean` whose
  own comment calls the boolean deprecated. `sysMes` carries the comment "this
  boolean might be an accident".
- **Scope.** The package also holds `license/`, `ee/IAuditLog`,
  `IWorkspaceCredentials`, LDAP and SAML types. An app has no business with any
  of them.

This is the strongest argument **against** type identity, and it must be
answered, not waved away. The answer is [§6](#6-the-recommendation): the SDK
re-exports a **subset**, and it names each member. A subset is still one source
of truth, because a subset cannot drift in *shape* — only in *coverage*, and
coverage is exactly what a generated check can police.

### 5.4 The wire does not carry documents

158 fields across the package are typed `Date`. JSON has no date, so a
`core-typings` document does not survive the NATS envelope in
[the wire contract](../26-data-wire-contract.md) unchanged. Type identity across
the transport is therefore a lie unless a codec runs on both ends.

*This is not a blocker, and it is not a reason to keep a second map.* The
**codec** that [the wire contract](../26-data-wire-contract.md) already calls for is
defined as "shared with the client types so they cannot drift" — the same
argument this report makes, one layer down. Half of it is written:
`TimestampSchema` at
[`core-typings/src/utils.ts:75`](../../../core-typings/src/utils.ts).

> The wire carries the **encoded** form of a projection. The SDK types describe
> the **decoded** form. One codec defines both, and `core-typings` already owns
> its timestamp half.

### 5.5 No stability contract for types

`core-typings` has no policy that a type change is a breaking change. A field
that becomes optional, a union that gains a member, a `@deprecated` field that
is finally deleted — none of these forces a major today, because the version is
driven by the `fixed` group.

*Mitigation.* The SDK's re-export list is the contract, and the build-time check
in [§6](#6-the-recommendation) turns a silent upstream change into a failed
build in this repo, before release. The server team keeps its freedom; the SDK
absorbs the change deliberately.

### 5.6 Dependency direction

`packages/apps-engine` does **not** depend on `core-typings` today. `core-typings`
depends on `apps-engine` — as a devDependency, referenced from `Apps.ts`,
`IInquiry.ts` and `omnichannel/outbound.ts`. A new SDK that depends on
`core-typings` therefore adds an edge that does not exist yet.

The edge is acyclic and safe, because the SDK is a new package and nothing in
`core-typings` will import it. But the existing `core-typings → apps-engine`
edge should be removed as the legacy engine retires, or the graph will cycle the
day someone points `core-typings` at the SDK.

---

## 6. The recommendation

**Adopt coupling A and B through one curated module. Reject coupling C.**

### 6.1 The shape

The SDK owns `src/models.ts`, and that file re-exports from `core-typings`
instead of re-declaring:

```ts
// packages/app-sdk/src/models.ts
export type {
  IRoom  as Room,
  IUser  as User,
  IMessage as Message,
  IUpload as Upload,
  ISubscription as Membership,
  RoomType,
} from '@rocket.chat/core-typings';

export {
  isDiscussion, isDirectMessageRoom, isTeamRoom,
  isThreadMessage, isThreadMainMessage, isDiscussionMessage,
  isOmnichannelRoom, isSystemMessage,
} from '@rocket.chat/core-typings';
```

Four rules make that safe.

1. **The SDK names every re-export.** No `export *`. The list *is* the app
   contract, and a reader can see it on one screen.
2. **An app never depends on `core-typings` directly.** It is a dependency of
   `@rocket.chat/app-sdk`, not a peer dependency. The SDK's own version
   describes the app contract.
3. **A projection, not a document, crosses the boundary.** The app receives the
   fields it selected, after the field-permission gate. `Room` is the *shape
   vocabulary*; it is not a promise that every field arrives.
4. **A generated check guards the subset.** A script compares the re-exported
   members against `core-typings` on every build. A removed field, a narrowed
   union or a new `@deprecated` marker fails the build in this repo.

### 6.2 Why a subset, and not the whole package

A subset answers [§5.3](#53-the-types-are-storage-documents) without giving up
the single source of truth. Drift needs two *independent* declarations of the
same field. A re-export has one. What a subset can lose is **coverage** — a new
field that the SDK never adds — and that is a much smaller failure than the
legacy engine's, because the field is one line away and the check reports it.

### 6.3 What stays the SDK's own

Four things are **not** `core-typings`, and the SDK must keep declaring them:

- The **branded ids** that [the entities](../21-data-entities.md#identity-needs-to-be-explicit)
  argues for. `core-typings` aliases ids to `string`.
- The **selection and hydration** types. Hydration is an argument, so
  `Selected<Room, ['id','topic']>` is an SDK construct.
- The **write commands**. [The write surface](../25-data-write-surface.md) is a
  catalog of domain operations, and `core-typings` has no vocabulary for it.
- The **wire codecs**, built on `TimestampSchema`.

### 6.4 Field naming: the one open cost

`core-typings` uses the storage names: `_id`, `t`, `u`, `prid`, `tmid`, `msgs`,
`lm`, `ro`, `fname`. The RFC's prose uses `id`, `type`, `parentRoomId`,
`threadId`, `readOnly`. Adopting `core-typings` for its types means adopting
those names, or reintroducing a rename map — which is the drift the report
argues against.

**Recommendation: take the storage names.** Two reasons. A rename map is a
second declaration, and a second declaration is the defect. And a shared name
lets an app author read the server's own source, its REST responses and its
documentation without a translation table.

The cost is real. `room.fname` and `room.ro` are poor names, and
[views](../28-data-views.md) must be rewritten against `prid` and `teamMain`.

---

## 7. What this changes in the RFC

| Document | Change |
|---|---|
| [00 overview](../00-overview.md) | promote "Reuse `core-typings`" from a bullet to a stated pillar, and link here |
| [21 entities](../21-data-entities.md) | brand the ids in the SDK; state that field names follow `core-typings` |
| [24 read surface](../24-data-read-surface.md) | `select` keys are `core-typings` field names |
| [26 wire contract](../26-data-wire-contract.md) | add the encode/decode rule from [§5.4](#54-the-wire-does-not-carry-documents) |
| [28 views](../28-data-views.md) | replace the three hand-written guards with the `core-typings` ones; fix the field names |
| [43 field permissions](../43-platform-field-permissions.md) | the gate is what makes a storage type safe to reuse; say so |
| [`src/models.ts`](../../src/models.ts) | replace the trimmed shapes with the re-export in [§6.1](#61-the-shape) |
| [51 open questions](../51-open-questions.md) | add the two decisions in [§8](#8-open-questions) |

---

## 8. Open questions

1. **Storage names or app names?** [§6.4](#64-field-naming-the-one-open-cost)
   recommends the storage names and accepts `fname` and `ro`. A reviewer who
   disagrees must say what stops the rename map from drifting.
2. **Does `core-typings` get an app-facing stability policy?** The SDK's
   generated check protects this repo. It does not stop an upstream change from
   forcing an SDK major. A written policy would; a `fixed` group makes one hard.
3. **Should the SDK re-export the omnichannel types?** `ILivechatRoom`,
   `ILivechatVisitor` and `ILivechatDepartment` are large, EE-adjacent, and
   already the most drifted part of the legacy converter.
4. **Who fixes the barrel?** `"sideEffects": false` and an `exports` map with an
   `./Ajv` subpath benefit the server independently. This RFC should propose it,
   but it is not the RFC's to land.

---

## 9. Verification

Every number above comes from the tree at `e3b6f3d`. The commands:

```sh
# field counts — 48, 23, 34
sed -n '/^export interface IRoom extends IRocketChatRecord {/,/^}/p' \
  packages/core-typings/src/IRoom.ts | grep -cP '^\t\w+\??:'
sed -n '/^export interface IRoom {/,/^}/p' \
  packages/apps-engine/src/definition/rooms/IRoom.ts | grep -cP '^\t\w+\??:'
sed -n '/^export interface IRoomRaw {/,/^}/p' \
  packages/apps-engine/src/definition/rooms/IRoomRaw.ts | grep -cP '^\t\w+\??:'

# the twelve invisible fields — each name sums to 0
grep -rc topic apps/meteor/app/apps/server/converters/ packages/apps/src/ \
         packages/apps-engine/src/definition/rooms/ | awk -F: '{s+=$2} END{print s}'

# the translation cost
wc -l apps/meteor/app/apps/server/converters/*.ts \
      apps/meteor/app/apps/server/converters/codecs/*.ts \
      apps/meteor/tests/unit/app/apps/server/converters.*.spec.ts

# the barrel weight
du -h packages/core-typings/dist/Ajv.js

# the published manifest
npm view @rocket.chat/core-typings version dist-tags dependencies --json
```
