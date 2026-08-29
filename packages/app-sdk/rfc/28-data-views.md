# Views: Thread, Discussion, Team, Direct message

> Part of the [Apps Engine SDK RFC](README.md).

## Thread — a relation on a message

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

## Discussion — a lens on a room

```ts
export type Discussion = Room & { parentRoomId: RoomId; parentMessageId?: MessageId };
export const isDiscussion = (room: Room): room is Discussion => room.parentRoomId !== undefined;

const room = await ctx.rooms.get(id);
if (isDiscussion(room)) { /* room.parentRoomId is RoomId here */ }

for await (const d of ctx.rooms.list({ where: { isDiscussion: true, parentRoomId: roomId } })) { … }
```

`ctx.rooms.get(discussionId)` works, because a discussion **is** a room. There
is no `ctx.discussions`.

## Team — the one view that owns a record

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

`ctx.teams` is missing from [the context](11-surface-context.md) altogether. It belongs there.

## Direct message — a lens, and the room-type fix

```ts
export type RoomType = 'channel' | 'private' | 'direct' | 'livechat';  // four, matching the domain

export type DirectRoom = Room & { type: 'direct'; userIds: UserId[] };
export const isDirect   = (r: Room): r is DirectRoom => r.type === 'direct';
export const isTeamMain = (r: Room) => r.teamMain === true;
export const isInTeam   = (r: Room) => r.teamId !== undefined;
```

`'discussion'` and `'team'` leave the type union and become flags, per
[what the entity analysis rules out](21-data-entities.md#what-the-entity-analysis-rules-out). A private discussion inside a
public team is then representable, which it is not under the current sketch.

