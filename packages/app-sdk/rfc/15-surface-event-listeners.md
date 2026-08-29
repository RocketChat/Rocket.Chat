# Event listeners — the big collapse

> Part of the [Apps Engine SDK RFC](README.md).

**Legacy** — to redact spam *and* block slurs on outgoing messages you implement
two interfaces (`IPreMessageSentModify`, `IPreMessageSentPrevent`), list both in
`implements[]`, and write `executePreMessageSentModify` / `checkPreMessageSentModify`
/ `executePreMessageSentPrevent`.

**Proposed** — one `defineListener`; intent is the return value (the Mastra
processor model: return modified, or `abort()`).
[`examples/reminder-app/listeners/moderate.ts`](../examples/reminder-app/listeners/moderate.ts):

```ts
export const moderate = app.listener({
  event: 'message.beforeSent',
  when: { roomTypes: ['channel', 'private'] },   // runtime pre-filter (replaces the `check…` gate)
  async handle(ctx) {
    const { message } = ctx.data;                // typed to the event
    const blocked = (await ctx.settings.get('blockedWords')).split(',').filter(Boolean);
    const hit = blocked.find((w) => (message.text ?? '').toLowerCase().includes(w));
    if (!hit) return;                                       // observe / allow
    if (hit.startsWith('!')) return ctx.prevent('blocked'); // prevent  (was …Prevent)
    return ctx.modify({ ...message, text: redact(message.text) }); // modify (was …Modify)
  },
});
```

`ctx.data` is precisely typed per event. `ctx.prevent` exists only on `*.before*`
events; `ctx.modify` only on events whose subject is modifiable — encoded in the
types (`PreventableEvent`, `ModifiableSubjects` in [`src/listeners.ts`](../src/listeners.ts)),
so you cannot call `modify` in a post-event handler. Post events
(`message.sent`, `room.created`, `user.updated`, …) return `void`.

