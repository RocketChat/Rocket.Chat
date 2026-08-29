# Start with the entities

> Part of the [Apps Engine SDK RFC](README.md).

## The six entities against the real storage

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

## Three kinds of thing, therefore three mechanisms

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

## Identity needs to be explicit

| Entity | Its id is | Consequence |
|---|---|---|
| Thread | the parent message id | `type ThreadId = MessageId`, and a thread is reached **from** a message |
| Discussion | a room id | `ctx.rooms.get(discussionId)` must work |
| Team | *two* ids: `team._id` and `team.roomId` | the client must accept a tagged reference, not a bare string |

The sketch in [`src/models.ts`](../src/models.ts) aliases every id to `string` and
records that branded ids were rejected, because ids arrive from untyped input
such as a job payload.

That objection dissolves under this proposal's own premise. The [design principles](00-overview.md#design-principles)
put a schema at every boundary. The schema is exactly the place that applies
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

## Relations are the cost driver

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

## Writes are not CRUD

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

## What the entity analysis rules out

1. **A generic document API** — `ctx.db.collection('rooms').find(mongoFilter)`.
   It leaks the storage model into a public contract, has no cost ceiling, has
   no permission story, and freezes the schema permanently.
2. **A repository per app-facing concept.** `ctx.discussions` and `ctx.threads`
   as peers of `ctx.rooms` and `ctx.messages` duplicate every method and
   contradict [the entity table](21-data-entities.md#the-six-entities-against-the-real-storage).
3. **A room *type* for discussion and team.** The sketch declares:
   ```ts
   // src/models.ts:22 — wrong against the domain
   export type RoomType = 'channel' | 'private' | 'direct' | 'livechat' | 'discussion' | 'team';
   ```
   The domain has four room types (`'c' | 'd' | 'p' | 'l'`). Discussion and team
   are **flags** (`prid`, `teamMain`) on a channel or a private group. A
   discussion can be public or private, and so can a team. The union above makes
   that unrepresentable. [the views](28-data-views.md)
   fixes it.

