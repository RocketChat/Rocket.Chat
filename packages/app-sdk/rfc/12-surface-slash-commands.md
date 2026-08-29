# Slash commands

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy** — `getArguments(): string[]`, five-arg `executor`.

```ts
class RemindCommand implements ISlashCommand {
  command = 'remind';
  i18nParamsExample = 'remind_example';
  i18nDescription = 'remind_desc';
  providesPreview = false;
  async executor(context: SlashCommandContext, read, modify, http, persis) {
    const [who, minutesStr, ...rest] = context.getArguments();  // parse by hand
    const minutes = Number(minutesStr);                          // validate by hand
    // …
  }
}
```

**Proposed** — schema-parsed, typed args, one `ctx`. Full file:
[`examples/reminder-app/commands/remind.ts`](../examples/reminder-app/commands/remind.ts).

```ts
export const remind = app.slashCommand({
  command: 'remind',
  i18nDescription: 'remind_command_desc',
  permission: 'message.write',
  arguments: z.object({
    who:     z.string().describe('who to remind (username or "me")'),
    minutes: z.number().describe('minutes from now'),
    text:    z.string().describe('reminder text'),
  }),
  async run(ctx) {
    const { who, minutes, text } = ctx.args;   // typed { who: string; minutes: number; text: string }
    const dueAt = new Date(Date.now() + minutes * 60_000);
    const reminderId = await ctx.store.reminders.insert(
      { userId: ctx.sender, roomId: ctx.room, text, dueAt: dueAt.toISOString(), delivered: false },
      { associations: [{ model: 'room', id: ctx.room }] },   // cascade-cleaned with the room
    );
    await ctx.scheduler.runAt(deliverReminder, dueAt, { reminderId, roomId: ctx.room, userId: ctx.sender, text });
    await ctx.notify.user(ctx.sender, { room: ctx.room, text: `✅ Reminder set.` });
  },
});
```

The runtime tokenizes the raw input and coerces it against `arguments`
(positional fields in order, `--flag value` for named ones); a validation
failure is reported to the user before `run` executes. Omit `arguments` to get
raw `ctx.args: string[]`. The `providesPreview`/`previewer`/`executePreviewItem`
trio collapses into an optional `preview: { render, onSelect }`.

