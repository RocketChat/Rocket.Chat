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


---

## `prompt` — a listener that asks before it allows

In-tree ADR 0002 (see [the event listeners](15-surface-event-listeners.md))
specifies a fourth listener outcome, `prompt`: ask the user, and let the action
proceed only if they accept. It ships **specified but not implemented**, for one
stated reason — the variant is inert without a suspend/resume path, and the
legacy engine has none. The SDK matches that: `ctx.event` exposes `pass`,
`patch` and `prevent`, and nothing else.

This section is that path. `await ctx.ui.open(...)` already suspends a handler
and resumes it with the user's answer, so a prompt is not new machinery here:

```ts
export const confirmLargeUpload = app.listener({
  event: 'upload.beforeUploaded',
  async handle(ctx) {
    if (ctx.data.upload.size < TEN_MB) return ctx.event.pass();      // allow unchanged
    const ok = await ctx.ui.confirm({ i18n: { key: 'confirm_large_upload' } });
    if (!ok) return ctx.event.prevent({ i18n: { key: 'upload_cancelled' } });
  },
});
```

`ctx.ui.confirm` is a proposed addition; [`src/ui.ts`](../src/ui.ts) has only
`open` today. It is `open` with a fixed two-button surface, so the ADR's simple
form (`{ message }` or `{ i18n }`) and its rich form (`{ title?, text?, blocks?,
confirmLabel?, cancelLabel? }`) are one call with an optional block list.

Two constraints come with it:

- **Only an abortable, retryable operation may prompt.** Upload qualifies,
  because the bytes are already staged when the confirm step runs. Message send
  needs the client challenge and re-send plumbing that 2FA has. The
  [capability matrix](15-surface-event-listeners.md#which-events-allow-which-outcome)
  is the authority on which events qualify.
- **On resume the listener chain re-runs from the top.** A handler must be safe
  to run twice up to the point where it prompts.

`prompt` also raises the stakes on the durability question
[the open questions](51-open-questions.md) already asks about modals. A
suspended slash command inconveniences one user; a suspended `message.beforeSent`
sits in the send path.
