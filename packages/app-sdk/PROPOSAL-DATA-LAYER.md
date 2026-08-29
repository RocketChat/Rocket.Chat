# Proposal: the host data & query layer for apps

**Status:** RFC / design proposal
**Companion to:** [`PROPOSAL.md`](PROPOSAL.md) — that document designs the *app-facing*
shape (`defineApp`, `ctx`, schemas). This one designs what sits **behind**
`ctx.rooms`, `ctx.messages`, `ctx.users`, … on the host, and the contract that
crosses the process boundary when the apps runtime runs out of process.
**Scope:** platform data. App-private persistence (`ctx.store`) appears only
where its query language must agree with this one.

> This is a ground-up design. It reasons from two inputs: Rocket.Chat's own
> domain model, and how other plugin platforms solve the same problem. It does
> not treat any existing apps API as a baseline or a constraint.

---

## 1. TL;DR

The recommendation is a **hybrid**, not a single pattern:

| Layer | Pattern | Why |
|---|---|---|
| Host code organization | **Repository (gateway) per record** | One place owns each record. Testable. Swappable storage. |
| App-facing read | **Explicit selection** — the caller names the fields and the relations it wants (the Shopify Admin API idea, expressed in TypeScript, not in a query string) | One round trip per statement, and one entity type instead of a deep/shallow fork. |
| App-facing write | **Named commands** over server use-cases (the VS Code `WorkspaceEdit` idea: a write is a value, the host applies it) | Room and message writes are not CRUD. They carry invariants. |
| Derived entities (Thread, Discussion, DM) | **Lenses and traversals**, not repositories | They have no record of their own. |
| Query language | A **closed, versioned filter DSL** | A Mongo filter on the wire freezes our schema forever. |

The reason the answer is a hybrid is in [§3](#3-start-with-the-entities): the six
entities the SDK talks about — Message, Room, Thread, Discussion, Team, User —
are **three different kinds of thing** stored in **four collections**. One
mechanism cannot serve all three kinds without lying about at least one of them.

---

## 2. What this layer must deliver

1. **One shape per entity.** An app must never have to choose between a "full"
   and a "shallow" variant of the same entity, and the platform must never have
   to ship both.
2. **A serializable request.** `PROPOSAL.md` §14 makes the in-process vs.
   out-of-process split a packaging decision. That only holds if every read and
   every write is a value that survives NATS. This layer defines that value.
3. **A cost ceiling.** A shared apps runtime serves many apps. One app must not
   be able to ask for the whole workspace in one call.
4. **A stable public contract.** Apps compile against this. Once it ships, every
   field is a promise. The layer must therefore hide the storage model, not
   mirror it.
5. **Permission at the source.** The gateway decides what an app or an actor may
   see. Not the client, and not the app.

---

## 3. Start with the entities

### 3.1 The six entities against the real storage

| App-facing entity | Backing store | Identity | How you recognize it | A write that is *not* CRUD |
|---|---|---|---|---|
| **User** | `users` | `user._id` | — | deactivate, role grant |
| **Room** (channel / private) | `rocketchat_room` | `room._id` | `t: 'c' \| 'p'` | create, rename, archive, convert to team |
| **Room** (direct) | `rocketchat_room` | `room._id` | `t: 'd'`, `uids[]` | create DM — idempotent, derived from the participants |
| **Message** | `rocketchat_message` | `message._id` | — | send (renders, notifies, fires listeners), delete (retracts) |
| **Thread** | `rocketchat_message` **only** | the **parent message** `_id` | replies carry `tmid`; the parent carries `tcount` / `tlm` | a reply updates the parent's counters |
| **Discussion** | `rocketchat_room` **+** the parent `rocketchat_message` | the **room** `_id` | `room.prid` is set; the parent message carries `drid` | create — one room, one parent message, `drid`, members |
| **Team** | `rocketchat_team` **+** its main `rocketchat_room` | `team._id` **and** `team.roomId` | `room.teamMain`, `room.teamId` | create (team record + main room + members), add room to team |
| *(Membership)* | `rocketchat_subscription` | `rid` + `u._id` | — | add user to room — subscription, system message, counters, events |

Two facts jump out of this table.

**Thread and Discussion own no record.** A Thread is a predicate over messages.
A Discussion is a Room that points at a parent. Neither has an id of its own.

**Team owns a record, but it is welded to a Room.** `team.roomId` is the main
room; `room.teamId` and `room.teamMain` point back. Two ids circulate for one
concept.

### 3.2 Three kinds of thing, therefore three mechanisms

| Kind | Members | What it needs |
|---|---|---|
| **Record** — its own collection, its own id | User, Room, Message, Team, Upload, Subscription | a repository |
| **View** — a predicate plus extra fields over a record | Discussion, Direct message, Team room, Thread parent, Thread reply, Omnichannel room | a type guard and a lens |
| **Relation** — an edge between records | room → creator, room → parent room, room → team, room ↔ members, message → thread, message → discussion | a declared traversal |

The design rule falls straight out:

> **A repository per record. A lens per view. A declared traversal per relation.**

A design that gives Discussion its own repository next to Room tells the app a
lie. The app then writes `ctx.discussions.get(id)` and `ctx.rooms.get(id)` for
the same document, and every method must exist twice.

### 3.3 Identity needs to be explicit

| Entity | Its id is | Consequence |
|---|---|---|
| Thread | the parent message id | `type ThreadId = MessageId`, and a thread is reached **from** a message |
| Discussion | a room id | `ctx.rooms.get(discussionId)` must work |
| Team | *two* ids: `team._id` and `team.roomId` | the client must accept a tagged reference, not a bare string |

The sketch in [`src/models.ts`](src/models.ts) aliases every id to `string` and
records that branded ids were rejected, because ids arrive from untyped input
such as a job payload.

That objection dissolves under this proposal's own premise. `PROPOSAL.md` §4
puts a schema at every boundary. The schema is exactly the place that applies
the brand:

```ts
export const RoomId = z.string().brand<'RoomId'>();
export type  RoomId = z.infer<typeof RoomId>;
```

Untyped input therefore enters through `RoomId.parse(...)`, and the brand costs
the app author nothing. Branding matters more here than anywhere else, because
this layer is full of ids that are structurally identical and semantically
different: a thread id *is* a message id, a discussion id *is* a room id, and a
team id is *not* its main room id.

**Decision needed:** brand the ids, or keep plain strings?

### 3.4 Relations are the cost driver

Count the edges the six entities imply:

```
message ──► sender (user)          room ──► creator (user)
        ──► room                        ──► parent room  (discussion)
        ──► thread parent (message)     ──► team
        ──► discussion room             ──► last message
                                        ──► members (users)
```

If the entity type **embeds** its relations, then one message read is a message,
a room, two users and possibly a parent room: five document reads for one
logical fetch. A page of 100 messages is 500. Out of process, each unbatched
read is also a round trip.

A platform that embeds relations always reaches the same fork in the road, and
always takes the same turn: it ships a second, shallow variant of every entity
for list operations, plus a third "lookup" stub for the embedded user. Three
shapes for one concept, and the choice between them belongs to the *method*, so
an app that wants a hydrated list cannot ask for one.

Avoid the fork by moving the decision from the type to the call:

> **Hydration is an argument, never a property of the type.**

An empty selection *is* the shallow variant. A selection of
`['id','username']` *is* the lookup stub. Neither needs its own type.

### 3.5 Writes are not CRUD

Creating a discussion is not "insert a room with `prid` set". It creates the
room, creates or links the parent message, sets `drid` on that message, adds the
members, and emits the events that other apps listen for.

Adding a member to a room is not "insert a subscription". It writes the
subscription, posts a system message, updates the room's user count, and fires
the listeners.

Every one of those steps is an invariant. If apps write documents, apps break
the invariants, and every later refactor of the use-case breaks apps with it.

> **The write side is a catalog of named domain operations. It is not
> `repository.save(entity)`.**

### 3.6 What the entity analysis rules out

1. **A generic document API** — `ctx.db.collection('rooms').find(mongoFilter)`.
   It leaks the storage model into a public contract, has no cost ceiling, has
   no permission story, and freezes the schema permanently.
2. **A repository per app-facing concept.** `ctx.discussions` and `ctx.threads`
   as peers of `ctx.rooms` and `ctx.messages` duplicate every method and
   contradict [§3.1](#31-the-six-entities-against-the-real-storage).
3. **A room *type* for discussion and team.** The sketch declares:
   ```ts
   // src/models.ts:22 — wrong against the domain
   export type RoomType = 'channel' | 'private' | 'direct' | 'livechat' | 'discussion' | 'team';
   ```
   The domain has four room types (`'c' | 'd' | 'p' | 'l'`). Discussion and team
   are **flags** (`prid`, `teamMain`) on a channel or a private group. A
   discussion can be public or private, and so can a team. The union above makes
   that unrepresentable. [§10](#10-views-thread-discussion-team-direct-message)
   fixes it.

---

## 4. Pattern A — the repository

### 4.1 The shape

A repository is a collection-like object that hides the storage for **one
aggregate**. The caller asks in domain terms. The repository owns the query.

```ts
// host side
interface RoomRepository {
  byId(id: RoomId): Promise<Room | undefined>;
  byName(name: string): Promise<Room | undefined>;
  membersOf(id: RoomId, page: Page): Promise<User[]>;
  discussionsOf(id: RoomId, page: Page): Promise<Room[]>;
}
```

### 4.2 What it gets right for us

- **One owner per record.** Every read of a room goes through one file.
- **A seam for the projection.** The repository is where a selection becomes a
  database query. Nothing above it needs to know Mongo exists.
- **A seam for the policy.** Room visibility is one decorator around one object.
- **Testable.** A fake repository is a map.
- **It matches `ctx`.** `PROPOSAL.md` §6 lists one client per domain. A gateway
  per record is the mirror image of that on the host.

### 4.3 What it does not answer

| Question | Repository's answer |
|---|---|
| How does an app say "the room **and** its creator"? | none — which is how the deep/shallow fork of [§3.4](#34-relations-are-the-cost-driver) starts |
| Where do Thread and Discussion live? | ambiguous — the pattern is silent on views |
| What stops `find({})` from returning 400k rooms? | none |
| What does the call look like on the wire? | none — a repository is an object, not a message |
| How do writes preserve invariants? | `save(entity)` actively works against them |

The honest framing:

> **The repository pattern answers "where does the host code live". It does not
> answer "what can an app ask for".** We need both answers, and they are
> different patterns.

---

## 5. What other plugin systems do

### 5.1 Survey

| System | How a plugin reads host data | How it writes | Boundary |
|---|---|---|---|
| **Shopify apps** | GraphQL Admin API — versioned schema, selection sets, cursor connections, a per-call **cost budget in points** | mutations, i.e. named domain operations | HTTP, out of process |
| **Atlassian Forge** | `api.asApp()` / `api.asUser()` against the product REST API; `@forge/kvs` for app-private data | product REST | out of process, sandboxed |
| **VS Code** | curated namespaces (`workspace.textDocuments`), live document objects, events | a `WorkspaceEdit` **value**, applied by the host via `workspace.applyEdit()` | in process |
| **Figma** | a live proxy scene graph — property reads hit the host synchronously | assign to node properties | in process |
| **Kubernetes controllers** | informer / lister — a **locally synced read cache** | typed write-through, optimistic concurrency on `resourceVersion` | out of process |
| **Discourse, WordPress** | the ORM directly (`Topic.find`, `WP_Query`) | model `save` | none |

Three of these are worth developing. Two are worth naming as hazards.

### 5.2 Pattern B — the selection set (Shopify)

A Shopify app does not call `getOrder()` and then `getCustomer()`. It states the
shape it wants, and the platform returns exactly that:

```graphql
query { order(id: "…") { id name customer { id email } lineItems(first: 10) { … } } }
```

Four ideas here are directly useful to us.

1. **The caller declares the hydration.** This is precisely the cure for
   [§3.4](#34-relations-are-the-cost-driver). The platform never needs a shallow
   twin of an entity, because a shallow read is an empty selection.
2. **The schema is the versioned contract.** Shopify ships quarterly API
   versions and deprecates fields on a published clock. That is what buys them
   the freedom to change storage. We need the same freedom, for the same reason.
3. **A cost budget per call.** Shopify prices a query in points before it runs
   it, and rejects a query that is too expensive. A shared apps runtime needs
   exactly this ([§11.1](#111-cost)).
4. **Cursor connections, not `skip`/`limit`.** Offset paging over an active room
   silently drops or repeats messages. A cursor does not.

**What we should not take:** a GraphQL server, a query string, or unbounded
nesting. Apps write TypeScript. We want the *shape* of a selection set with
compile-time inference, not a language the app assembles as text.

### 5.3 Pattern C — the write as a value (VS Code)

A VS Code extension never mutates a file. It builds a description of the change
and hands it back:

```ts
const edit = new vscode.WorkspaceEdit();
edit.replace(uri, range, newText);
await vscode.workspace.applyEdit(edit);   // the host validates and applies
```

Three properties matter to us:

- **The host owns the invariants.** The extension cannot half-apply a change or
  skip a notification.
- **The edit is a value.** It serializes. It crosses a process boundary intact.
  It is also trivially testable and loggable.
- **Several changes travel together**, so the call cost is one round trip
  regardless of how many changes it carries.

This lines up with `PROPOSAL.md` §4 ("mutations take plain validated objects,
not builders") and it extends it: a write is not only a plain object, it is a
plain object the **host** applies through a domain operation that owns the
invariants ([§3.5](#35-writes-are-not-crud)).

Its read side is instructive too. VS Code exposes a small, curated set of
namespaces, and everything else is reached by traversal from an object you
already hold. That is the "few clients plus declared relations" shape, and it
argues against a client per concept.

### 5.4 Pattern D — the synced read cache (Kubernetes)

A controller does not query the API server per reconcile. An informer keeps a
local cache, and the controller reads from it. Writes go to the API server and
carry a `resourceVersion` for optimistic concurrency.

We should not build a full replica cache for apps. Two narrower ideas transfer:

- **A per-execution identity map.** Inside one handler, the same id read twice
  should cost one query. This also gives read-your-writes inside the handler.
- **Conditional writes.** An app that edits a message it read a second ago can
  lose a concurrent human edit. Passing the record's `_updatedAt` back as a
  precondition turns a lost update into a rejected write.

### 5.5 Two patterns to reject, and why

**The live proxy graph (Figma).** `node.parent.children[0].name` is delightful,
and it requires a **synchronous** property read against host memory. That is
in-process only. Adopting it would forfeit `PROPOSAL.md` §14 — the whole point
of reaching the platform only through `ctx` is that `ctx` can be an RPC proxy.
Figma itself needed a second JS realm to contain plugins, and still cannot move
them off the host.

**Direct ORM access (Discourse, WordPress).** Zero design cost on day one, and a
permanent tax after: the database schema becomes the public API, so it can never
change. Both platforms still pay it.

---

## 6. The recommendation

**Bounded repositories, explicit selection, named commands.** Six rules.

1. **One client per record**, exposed on `ctx`: `messages`, `rooms`, `users`,
   `uploads`, `teams`. Backed by one host gateway each.
2. **Every read takes a selection** — `select` for fields, `with` for relations.
   The return type is inferred from it. One entity type, no twins.
3. **Every write is a named command** with a schema, mapped to a domain
   operation that owns the invariants. No `save`.
4. **Views are guards and lenses on a record client**, never their own client —
   unless the view owns a record, which only Team does.
5. **Filters are a closed, versioned DSL.** Serializable. Never a Mongo filter.
6. **The host gateway owns projection, policy, and batching**, in that order.

---

## 7. The app-facing surface

The type machinery below is real: it lives in [`src/data.ts`](src/data.ts) and
compiles under the repo's strict settings. [`examples/data-layer.ts`](examples/data-layer.ts)
proves the inference is *exact* — every `@ts-expect-error` in that file is an
assertion that a field you did not select is genuinely absent, so the example
stops compiling if a read ever widens back to the whole entity. See
[§15](#15-trying-it).

### 7.1 Selection replaces the deep/shallow fork

```ts
// nothing extra: the record's own fields
const room = await ctx.rooms.get(roomId);
//    Room

// pull relations in the same round trip
const room = await ctx.rooms.get(roomId, { with: { creator: true, parent: true } });
//    Room & { creator: User; parent: Room | undefined }

// narrow the fields as well
const room = await ctx.rooms.get(roomId, {
  select: ['id', 'name', 'type'],
  with:   { creator: { select: ['id', 'username'] } },
});
//    { id: RoomId; name?: string; type: RoomType; creator: { id: UserId; username: string } }
```

`select` and `with` are const-inferred, so the return type is exactly what the
call asked for.

### 7.2 Lists are cursors with a closed filter

```ts
for await (const message of ctx.rooms.messages(roomId, {
  where:    { threads: 'exclude', since: yesterday, from: [ctx.actor] },
  with:     { sender: { select: ['id', 'username'] } },
  pageSize: 100,
})) {
  ctx.logger.info(message.sender.username, message.text);
}
```

`where` accepts only the keys the entity declares. It is not a Mongo filter, so
the host can rename a storage field without breaking an app.

### 7.3 Writes are named commands

```ts
const roomId = await ctx.rooms.create({ type: 'p', name: 'incident-482', members: ['alice'] });

await ctx.rooms.addMembers(roomId, { users: ['bob'], asUser: ctx.actor });
await ctx.rooms.archive(roomId);

const discussionId = await ctx.rooms.createDiscussion({
  parentRoom: roomId, parentMessage: messageId, name: 'follow-up', members: ['alice'],
});
```

Each command names a domain operation, so the invariants from
[§3.5](#35-writes-are-not-crud) hold.

### 7.4 Conditional writes

```ts
const message = await ctx.messages.get(id);
await ctx.messages.update(id, { text: redact(message.text) }, { ifUnchangedSince: message.updatedAt });
// throws ConflictError if a human edited it in between
```

**Decision needed:** is a lost update acceptable for apps, or is the precondition
mandatory on every update?

### 7.5 Batched writes — optional

The VS Code idea, reduced to what we can honestly deliver:

```ts
await ctx.apply([
  ctx.rooms.$addMembers(roomId, { users: ['bob'] }),
  ctx.messages.$send({ room: roomId, text: 'welcome' }),
]);
```

**This buys one round trip, not atomicity.** The underlying domain operations
are not transactional with each other, and pretending otherwise would be worse
than not offering the API. **Decision needed:** ship the batch for the round-trip
saving, or leave it out until the operations can be made atomic?

---

## 8. The wire contract

Every read compiles to one serializable envelope. This is the artifact that
makes `PROPOSAL.md` §14 real.

```jsonc
{
  "v": 1,
  "entity": "room",
  "op": "get",
  "id": "GENERAL",
  "select": ["id", "name", "type"],
  "with": { "creator": { "select": ["id", "username"] } },
  "principal": { "app": "…", "actor": "…", "as": "app" }
}
```

What the envelope gives us that an object graph cannot:

- **A NATS subject per entity**, e.g. `rocketchat.apps.data.room.get`.
- **JSON Schema validation on both sides**, generated from the same declarations
  that type the client.
- **One round trip per statement**, because the relations travel in the request.
- **A budget, a log line, and a rate limit per app**, because the request is a
  value the host can inspect *before* it runs it.
- **A version field**, which is how a field ever gets removed.

The response passes through one codec per entity, generated from the same
declaration ([§9.1](#91-declare-the-entity-once)), so the app-side type, the
JSON Schema, and the deserializer cannot drift.

---

## 9. The host side

```
ctx.rooms  (client, app process)
   │  builds a DataRequest envelope
   ▼
transport   local call  │  NATS RPC          ← the only thing that differs
   ▼
RoomGateway (host)
   ├─ policy      may this principal see this room? which fields?
   ├─ projection  selection → database projection
   ├─ loader      per-execution batch + dedupe (one query per relation, not per row)
   ├─ codec       schema-driven, shared with the client types
   └─ the server's room / subscription / team models
```

### 9.1 Declare the entity once

Relations, policy, projection, filters and commands come from one declaration —
the host mirror of `createApp`. This is the worked `roomEntity` from
[`src/data.ts`](src/data.ts):

```ts
export const roomEntity = defineEntity({
  name: 'room',
  fields: {                               // public name → storage field
    id: '_id', type: 't', name: 'name', displayName: 'fname',
    parentRoomId: 'prid', teamId: 'teamId', teamMain: 'teamMain', /* … */
  },
  relations: {
    creator:     belongsTo('user',    'u._id'),
    parent:      belongsTo('room',    'prid'),               // discussion → parent room
    team:        belongsTo('team',    'teamId'),
    lastMessage: belongsTo('message', 'lastMessage._id'),
    members:     hasMany('user', { through: 'subscription', localKey: '_id', foreignKey: 'rid' }),
    discussions: hasMany('room', { foreignKey: 'prid' }),
  },
  filters:  ['type', 'isDiscussion', 'parentRoomId', 'teamId', 'nameStartsWith'],
  commands: ['create', 'createDiscussion', 'rename', 'archive', 'addMembers', 'removeMembers', 'convertToTeam'],
  policy: { read: 'canSeeRoom', field: { topic: 'view-room-administration' } },
});
```

The `fields` map is the whole reason a storage rename does not break an app: it
is the only place where `parentRoomId` is known to be `prid`.

From this one declaration the host derives the projection, the loader plan, the
JSON Schema for the envelope, and the permission gate. The SDK derives the
client types. **The storage query lives only inside `relations` and `where`**,
which is the whole point: it is the only place that knows a discussion is a
`prid`.

### 9.2 The loader kills N+1

A page of 100 messages with `{ with: { sender: true } }` runs **two** queries:
one for the messages, one `find({ _id: { $in: [...] } })` for the distinct
senders. The loader is per execution, so it also serves
[§5.4](#54-pattern-d--the-synced-read-cache-kubernetes)'s identity map, and it
is discarded when the handler returns. No cross-execution cache, therefore no
staleness contract to define.

---

## 10. Views: Thread, Discussion, Team, Direct message

### 10.1 Thread — a relation on a message

A thread has no record. Model it as one:

```ts
type ThreadId = MessageId;   // branded alias, per §3.3

const message = await ctx.messages.get(id, { with: { thread: true } });
if (message.thread) {
  message.thread.count;       // tcount
  message.thread.lastReplyAt; // tlm
}

// the replies are a paged list on the message, not a repository
for await (const reply of ctx.messages.replies(parentId, { with: { sender: true } })) { … }
```

There is no `ctx.threads`. A thread is the parent message plus its replies, and
both are reachable from the message client.

### 10.2 Discussion — a lens on a room

```ts
export type Discussion = Room & { parentRoomId: RoomId; parentMessageId?: MessageId };
export const isDiscussion = (room: Room): room is Discussion => room.parentRoomId !== undefined;

const room = await ctx.rooms.get(id);
if (isDiscussion(room)) { /* room.parentRoomId is RoomId here */ }

for await (const d of ctx.rooms.list({ where: { isDiscussion: true, parentRoomId: roomId } })) { … }
```

`ctx.rooms.get(discussionId)` works, because a discussion **is** a room. There
is no `ctx.discussions`.

### 10.3 Team — the one view that owns a record

Team gets its own client, because it has its own collection. Its id duality is
handled in the reference, not by two clients:

```ts
const team = await ctx.teams.get({ teamId });        // or { mainRoomId }
const main = await ctx.rooms.get(team.mainRoomId);

for await (const r of ctx.teams.rooms(team.id)) { … }   // rooms with room.teamId === team.id
await ctx.teams.addRoom(team.id, roomId);

// and from the other side, as a declared relation:
const room = await ctx.rooms.get(id, { with: { team: true } });
```

`ctx.teams` is missing from `PROPOSAL.md` §6 altogether. It belongs there.

### 10.4 Direct message — a lens, and the room-type fix

```ts
export type RoomType = 'channel' | 'private' | 'direct' | 'livechat';  // four, matching the domain

export type DirectRoom = Room & { type: 'direct'; userIds: UserId[] };
export const isDirect   = (r: Room): r is DirectRoom => r.type === 'direct';
export const isTeamMain = (r: Room) => r.teamMain === true;
export const isInTeam   = (r: Room) => r.teamId !== undefined;
```

`'discussion'` and `'team'` leave the type union and become flags, per
[§3.6](#36-what-the-entity-analysis-rules-out). A private discussion inside a
public team is then representable, which it is not under the current sketch.

---

## 11. Cost, permission, consistency

### 11.1 Cost

Borrowed from Shopify, simplified:

| Control | Proposed default |
|---|---|
| Relation depth | 2 (`room.creator` yes; `room.parent.creator.…` no) |
| Page size | 100, hard cap |
| Relation fan-out per page | one batched query per relation |
| Requests per execution | budgeted per app, logged per envelope |
| Unbounded list without `where` | rejected — a workspace-wide list needs an explicit permission **and** a cursor |

The last row matters. "List every room in the workspace" is a full collection
scan. It must be a deliberate, permissioned, paged capability, not a default
reachable from any handler.

### 11.2 Permission

Every envelope carries a principal, and the default is the app, not the user:

```ts
await ctx.rooms.get(id);                       // as the app
await ctx.rooms.get(id, { as: ctx.actor });    // as the triggering user — permission-gated
```

This is Forge's `api.asApp()` / `api.asUser()` split, and it agrees with
`PROPOSAL.md` §6, where `ctx.actor` is set by the platform and is not forgeable.
The gateway enforces it. The client only transports it.

### 11.3 Consistency

- **Read-your-writes inside one execution** — the per-execution loader is
  invalidated by any command the same execution issues.
- **No guarantee across executions.** State that plainly in the docs.
- **Lost updates** — see [§7.4](#74-conditional-writes).

---

## 12. Why not just one pattern?

| If we shipped only… | The failure |
|---|---|
| Repositories | relation cost has no release valve, so a shallow twin of every entity appears within a year |
| A GraphQL-style query surface | apps write query strings, lose inference, and the host loses the named-command write path that protects invariants |
| A document/query API | the Mongo schema becomes the public contract, permanently |
| A live proxy graph | the apps runtime can never leave the monolith |

The hybrid keeps the repository where it is strong (host structure), the
selection set where it is strong (the read contract), and named commands where
they are non-negotiable (writes with invariants).

---

## 13. What changes in `PROPOSAL.md`

| Item | In the current sketch | Change |
|---|---|---|
| `models.ts` `RoomType` | includes `'discussion'`, `'team'` | four domain types; discussion and team become flags ([§10.4](#104-direct-message--a-lens-and-the-room-type-fix)) |
| ids | plain `string` aliases | branded, applied at the schema boundary ([§3.3](#33-identity-needs-to-be-explicit)) |
| `MessagesClient.get`, `RoomsClient.get` | no options | accept `{ select, with }` ([§7.1](#71-selection-replaces-the-deepshallow-fork)) |
| `ThreadsClient` | its own client returning `IMessage[]` | removed; `message.thread` relation + `ctx.messages.replies()` ([§10.1](#101-thread--a-relation-on-a-message)) |
| `ctx.teams` | absent | added ([§10.3](#103-team--the-one-view-that-owns-a-record)) |
| `RoomsClient.messages` | `PageOpts & { sort }` | cursor + closed `where` ([§7.2](#72-lists-are-cursors-with-a-closed-filter)) |
| `PageOpts` | `{ limit, skip }` | `{ pageSize, cursor }` |
| `Collection.find(query?: Partial<T>)` | ad-hoc | the same closed filter DSL, so an app learns one query language for platform data and for its own store |
| discussion creation | absent | `ctx.rooms.createDiscussion` ([§10.2](#102-discussion--a-lens-on-a-room)) |
| writes | plain objects | plain objects **plus** a named-command catalog per entity ([§7.3](#73-writes-are-named-commands)) |

---

## 14. Trying it

```bash
cd packages/app-sdk

# the data layer, with the rest of the SDK
tsc -p tsconfig.json --noEmit

# plus the worked example, whose @ts-expect-error lines assert exact inference
tsc -p tsconfig.examples.json
```

| File | What it holds |
|---|---|
| [`src/data.ts`](src/data.ts) | records, view lenses and guards, the entity model, `Selection` / `Selected` inference, the read clients and command catalogs, the `DataRequest` envelope with its budget checks, and the host-side `defineEntity` / gateway / transport seams |
| [`examples/data-layer.ts`](examples/data-layer.ts) | selection narrowing, relation hydration at depth 2, cursor lists with closed filters, thread and discussion as views, the team's tagged reference, named commands, and envelope budgeting |

`src/data.ts` is exported under a namespace — `import { data } from
'@rocket.chat/app-sdk'` — because it *supersedes* parts of `context.ts` and
`models.ts` rather than extending them. [§13](#13-what-changes-in-proposalmd)
lists what it replaces.

---

## 15. Open questions

1. **Versioned data contract.** Shopify buys schema freedom with quarterly API
   versions and a published deprecation clock. Do we adopt a version for the
   apps data layer, and who owns the deprecation calendar?
2. **Selection depth and budget.** Is depth 2 right? Do we price a call in
   points, or only cap it?
3. **Batched writes.** Ship `ctx.apply` for the round-trip saving with no
   atomicity claim, or wait until the domain operations are transactional?
4. **Conditional writes.** Mandatory precondition on update, or opt-in?
5. **Workspace-wide search.** Does a cross-room search belong in the room client
   at all, or in a separate indexed directory entity with its own permission and
   its own cost model?
6. **Team and main room.** Do we hide the main room behind the team, or keep
   both visible? Hiding it is cleaner; it also makes "post to a team" ambiguous.
7. **Command catalog ownership.** The commands in
   [§9.1](#91-declare-the-entity-once) are the public write contract. Who
   curates it, and what is the bar for adding one?
8. **Livechat, contacts, video conference.** Deliberately out of scope here.
   They are records with their own relation graphs and deserve the same
   treatment in a follow-up.
