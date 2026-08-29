# Scheduled jobs

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy** — an `IProcessor` (with optional `startupSetting`) registered via
`scheduler.registerProcessors([...])`, then scheduled with
`scheduler.scheduleOnce({ id, when, data })` / `scheduleRecurring({ id, interval,
data })` where `id` is a string and `data` is untyped.

**Proposed** — one `defineJob`, optional declarative schedule, imperative
scheduling **by reference** so the payload is type-checked.

Recurring (inline cron — mirrors `createWorkflow({ schedule })`).
[`examples/reminder-app/jobs/daily-digest.ts`](../examples/reminder-app/jobs/daily-digest.ts):

```ts
export const dailyDigest = app.job({
  id: 'daily-digest',
  schedule: { cron: '0 9 * * *', timezone: 'UTC' },     // or { every: '1 hour' } or { onStartup: true }
  async run(ctx) {
    const channel = await ctx.settings.get('digestChannel');
    const room = channel ? await ctx.rooms.getByName(channel) : undefined;
    if (room) await ctx.messages.send({ room: room.id, text: '📋 Daily digest…' });
  },
});
```

One-off (imperative, typed payload).
[`examples/reminder-app/jobs/deliver-reminder.ts`](../examples/reminder-app/jobs/deliver-reminder.ts):

```ts
export const deliverReminder = app.job({
  id: 'deliver-reminder',
  inputSchema: z.object({ reminderId: z.string(), roomId: z.string(), userId: z.string(), text: z.string() }),
  async run(ctx) {
    const { reminderId, roomId, userId, text } = ctx.data;   // typed
    /* … */
  },
});

// elsewhere — `data` is checked against deliverReminder.inputSchema:
await ctx.scheduler.runAt(deliverReminder, dueAt, { reminderId, roomId, userId, text });
await ctx.scheduler.runEvery(deliverReminder, '30 minutes', { /* … */ });
await ctx.scheduler.cancel(scheduleId);
```

