# Interactive UI — the headline change

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy** — open in one method, handle the result in another, correlate by id:

```ts
// open
await modify.getUiController().openSurfaceView(view, { triggerId }, user);
// …later, a different method, matched by view.id:
async executeViewSubmitHandler(context: UIKitViewSubmitInteractionContext, read, http, persis, modify) {
  const { view } = context.getInteractionData();
  if (view.id !== 'reminders-settings') return { success: true };
  const state = view.state;                    // untyped
  // re-load whatever you stashed in persistence between the two calls…
}
```

**Proposed** — `await ctx.ui.open(...)` suspends the handler and resumes it with
the typed, validated submission when the user submits (Mastra `suspend()` /
`resumeData`). No `viewId` bookkeeping, no cross-callback state.
[`examples/reminder-app/commands/configure.ts`](../examples/reminder-app/commands/configure.ts):

```ts
const settingsModal = defineModal({
  title: 'Reminder settings',
  state: z.object({ digestChannel: z.string(), maxReminders: z.number() }),
  submit: { i18nLabel: 'save' },
  render: ({ blocks, values }) => [
    blocks.section('Configure reminders.'),
    blocks.input({ label: 'Digest channel', element: blocks.textInput({ key: 'digestChannel', initialValue: values?.digestChannel }) }),
    blocks.input({ label: 'Max per user',   element: blocks.textInput({ key: 'maxReminders' }) }),
  ],
});

export const configure = app.slashCommand({
  command: 'reminders-config',
  i18nDescription: 'reminders_config_desc',
  async run(ctx) {
    if (!ctx.triggerId) return;
    const result = await ctx.ui.open(settingsModal, { triggerId: ctx.triggerId, user: ctx.sender });
    if (!result.submitted) return;                            // user cancelled
    await ctx.settings.set('digestChannel', result.values.digestChannel);   // result.values is typed
    await ctx.settings.set('maxRemindersPerUser', result.values.maxReminders);
  },
});
```

The submit is a *separate* interaction request — potentially handled in a
different apps-runtime process — yet it resolves the original `await`. The
runtime persists the suspended continuation keyed by the view/trigger id and
resumes it on submit. Action buttons work the same way: the button's `onClick`
is co-located with its descriptor and typically calls `ctx.ui.open`
([`examples/standalone-video-conf.ts`](../examples/standalone-video-conf.ts)),
instead of routing to a distant `executeActionButtonHandler`.

> The *durability guarantees* of suspension (max window, behavior across app
> updates or runtime restarts) are a runtime decision — see [the open questions](51-open-questions.md).

