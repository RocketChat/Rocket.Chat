# The host side

> Part of the [Apps Engine SDK RFC](README.md).

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

## Declare the entity once

Relations, policy, projection, filters and commands come from one declaration —
the host mirror of `createApp`. This is the worked `roomEntity` from
[`src/data.ts`](../src/data.ts):

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

## The loader kills N+1

A page of 100 messages with `{ with: { sender: true } }` runs **two** queries:
one for the messages, one `find({ _id: { $in: [...] } })` for the distinct
senders. The loader is per execution, so it also serves
[Pattern D](22-data-prior-art.md#pattern-d--the-synced-read-cache-kubernetes)'s identity map, and it
is discarded when the handler returns. No cross-execution cache, therefore no
staleness contract to define.

