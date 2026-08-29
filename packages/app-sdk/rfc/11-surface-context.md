# The context (`ctx`) — replacing the accessor tree

> Part of the [Apps Engine SDK RFC](README.md).

One object, capability clients as properties. Read and write unified per domain.
Full type in [`src/context.ts`](../src/context.ts).

```ts
async run(ctx) {
  const room   = await ctx.rooms.get(roomId);              // was read.getRoomReader().getById()
  const msgId  = await ctx.messages.send({ room: roomId, text: 'hi' }); // was modify.getCreator().startMessage()…finish()
  await ctx.messages.update(msgId, { text: 'edited' });
  const key    = await ctx.settings.get('digestChannel');  // typed, was getValueById(): any
  await ctx.store.reminders.insert({ /* typed record */ });
  await ctx.http.post('https://…', { json: { … } });
  await ctx.notify.user(userId, { room: roomId, text: '…' });
  ctx.logger.info('done');
}
```

`ctx` surface (each maps to a legacy accessor/bridge):

| `ctx.*` | replaces |
|---|---|
| `messages` | `IRead.getMessageReader` + `IModify.getCreator/getUpdater/getDeleter` (message) |
| `rooms` | `IRoomRead` + room creator/updater/deleter |
| `users` | `IUserRead` + `IUserUpdater` |
| `uploads` | `IUploadRead` + `IUploadCreator` |
| `threads` | `IThreadRead` |
| `roles` / `contacts` / `livechat` / `videoConf` / `moderation` / `oauthApps` | the matching readers/modifiers |
| `store` | `IPersistence` + `IPersistenceRead` (now typed collections) |
| `settings` | `IEnvironmentRead.getSettings` + `IEnvironmentWrite.getSettings` (now typed) |
| `env` | server settings + env vars (read) |
| `http` | `IHttp` |
| `notify` | `INotifier` |
| `ui` | `IModify.getUiController` |
| `scheduler` | `IModify.getScheduler` |
| `cloud` | `ICloudWorkspaceRead` |

Also on `ctx`: `ctx.app` (id/version/appUser) and, on triggered handlers,
`ctx.actor` — the authenticated triggering user, **set by the platform and not
forgeable by the app** (the Mastra reserved-key pattern). Apps act as the app
bot user by default; acting on behalf of a user is explicit and permission-gated
(`send({ …, asUser })`).

