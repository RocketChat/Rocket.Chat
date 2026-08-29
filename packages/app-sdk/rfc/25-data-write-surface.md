# The write surface: named commands

> Part of the [Apps Engine SDK RFC](README.md).

## Writes are named commands

```ts
const roomId = await ctx.rooms.create({ type: 'p', name: 'incident-482', members: ['alice'] });

await ctx.rooms.addMembers(roomId, { users: ['bob'], asUser: ctx.actor });
await ctx.rooms.archive(roomId);

const discussionId = await ctx.rooms.createDiscussion({
  parentRoom: roomId, parentMessage: messageId, name: 'follow-up', members: ['alice'],
});
```

Each command names a domain operation, so the invariants from
[writes are not CRUD](21-data-entities.md#writes-are-not-crud) hold.

## Conditional writes

```ts
const message = await ctx.messages.get(id);
await ctx.messages.update(id, { text: redact(message.text) }, { ifUnchangedSince: message.updatedAt });
// throws ConflictError if a human edited it in between
```

**Decision needed:** is a lost update acceptable for apps, or is the precondition
mandatory on every update?

## Batched writes — optional

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

