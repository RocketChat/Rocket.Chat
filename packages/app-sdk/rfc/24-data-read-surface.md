# The read surface: selection and cursors

> Part of the [Apps Engine SDK RFC](README.md).

The type machinery below is real: it lives in [`src/data.ts`](../src/data.ts) and
compiles under the repo's strict settings. [`examples/data-layer.ts`](../examples/data-layer.ts)
proves the inference is *exact* — every `@ts-expect-error` in that file is an
assertion that a field you did not select is genuinely absent, so the example
stops compiling if a read ever widens back to the whole entity. See
[Trying it](52-trying-it.md).

## Selection replaces the deep/shallow fork

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

## Lists are cursors with a closed filter

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

