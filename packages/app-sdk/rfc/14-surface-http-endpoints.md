# HTTP endpoints

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy** — `IApiExtend.provideApi({ endpoints: [{ path, post(request, endpoint,
read, modify, http, persis) }] })`, `request.content: any`.

**Proposed** — mirrors `registerApiRoute` + schema validation + one `ctx`. Same
URL space (`/api/apps/public/{appId}/{path}`), so existing integrations keep
working. [`examples/reminder-app/endpoints/webhook.ts`](../examples/reminder-app/endpoints/webhook.ts):

```ts
export const webhook = app.endpoint({
  path: '/reminders',
  method: 'POST',
  visibility: 'public',
  auth: 'none',
  bodySchema: z.object({ roomName: z.string(), userId: z.string(), text: z.string(), inMinutes: z.number() }),
  async handler(ctx) {
    const { roomName, userId, text, inMinutes } = ctx.body;      // typed
    const room = await ctx.rooms.getByName(roomName);
    if (!room) return ctx.json({ error: 'unknown room' }, 404);
    const id = await ctx.store.reminders.insert({ /* … */ });
    return ctx.json({ ok: true, reminderId: id }, 201);
  },
});
```

`bodySchema` / `querySchema` / `paramsSchema` type `ctx.body` / `ctx.query` /
`ctx.params`. `auth: 'user'` populates `ctx.actor`.

