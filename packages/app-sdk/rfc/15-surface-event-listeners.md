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


---

## The outcome vocabulary

`return`, `ctx.modify` and `ctx.prevent` cover three intents. In-tree **ADR
0002**, "A unified `EventResult` return type for apps-engine pre-events"
(`docs/adr/0002-unified-event-result-for-pre-events.md`, on branch
`feat/apps-media-call-hooks`), settled the same question for the *legacy* engine
and found a fourth: **prompt** — ask the user, and proceed only if they accept.

| Intent | This SDK | ADR 0002 variant |
|---|---|---|
| allow unchanged | `return` | `pass` |
| change the subject | `return ctx.modify(…)` | `patch` |
| block the action | `return ctx.prevent(…)` | `prevent` |
| ask the user first | *missing* — see [Interactive UI](16-surface-interactive-ui.md) | `prompt` |

The ADR reached that vocabulary by inventory: the legacy engine has 16 `IPre*`
handler interfaces and **five** unrelated return contracts across them — boolean,
entity object, `IEmailDescriptor`, void-plus-throw, and fire-and-forget. Three of
its four variants therefore unify mechanisms that already exist; only `prompt` is
new. This redesign starts from the vocabulary instead of arriving at it, so
`defineListener` should ship all four intents, not three.

The rest of this document is what the ADR settled and the SDK sketch has not.

## `modify` is a patch, and a patch is an encoding

`ctx.modify(subject)` takes a whole subject. ADR 0002 argues for `Partial<T>`,
and the argument transfers: the host applies both through the same shallow
`Object.assign`, and a whole subject makes an app ship fields it never touched
across the transport.

The shallow merge has three limits. The ADR names them as accepted costs, not
as defects to fix in v1:

- It cannot express **intent**. "Append one attachment" and "replace the
  attachment array" arrive identically. That costs audit fidelity and rules out
  path-granular gating.
- It cannot express **deletion**, because `JSON.stringify` drops `undefined`.
- It replaces nested objects and arrays wholesale.

The v1 rule that keeps the door open: **treat `Partial<T>` as one patch
*encoding*, not as the definition of a patch.** The runtime branches on the
payload's shape when it applies one, so a later `{ ops: [...] }` sibling is
purely additive. That costs nothing now; retrofitting it after apps ship would
be a wire-format break.

Two further rules come with the patch:

- **Patchable fields are an allow-list per subject**, mirroring what the legacy
  builders could already change. Identity and server-owned fields (`id`, `ts`,
  `updatedAt`) are never patchable.
- **Validate once**, after the last listener in the pass — not once per
  listener.

## `prevent` carries a reason the host can translate

`ctx.prevent(reason?: string)` takes a bare string. That is not enough: the host
puts the reason in front of a user, and the user's locale is a client fact. So
`prevent` takes either a literal or a translation key, and the two are mutually
exclusive members of a union:

```ts
return ctx.prevent({ reason: 'Attachment is larger than the workspace limit' });
return ctx.prevent({ i18n: { key: 'file_too_large', args: { max: '10 MB' } } });
```

The host resolves the key against the app's own translations, client-side, at
render time. An app that needs a literal fallback returns `reason` instead,
because a non-UI consumer of the error gets only the raw key and args.

- **The host stamps the attribution, not the app.** A prevented action names the
  app that blocked it. The runtime reads that name and those translations off
  the app record. Metadata an app sends itself is overwritten, never merged —
  the same reserved-key rule that protects
  [`ctx.actor`](40-platform-security-and-permissions.md).
- **Only `prevent` carries attribution.** A `pass` changed nothing, and a
  `patch` yields the subject as every app left it, so neither can be attributed
  to one app.

The legacy engine surfaces prevention reasons inconsistently — some call sites
throw the app's message, `updateMessage` and `deleteMessage` throw a canned
string and discard the reason. One vocabulary makes that one code path.

## Which events allow which outcome

[`src/listeners.ts`](../src/listeners.ts) already encodes two of the four
columns, as `PreventableEvent` and `ModifiableSubjects`. ADR 0002 supplies the
rest, and the rule that governs the fourth: **`prompt` is only realizable when
the operation can be aborted and safely retried** after the user answers,
without losing work or applying a side effect twice.

| Event | pass | patch | prevent | prompt |
|---|---|---|---|---|
| `upload.beforeUploaded` | ✅ | ⚠️ later | ✅ | ✅ |
| `message.beforeSent` / `message.beforeUpdated` | ✅ | ✅ | ✅ | ⚠️ later |
| `message.beforeDeleted` | ✅ | — | ✅ | ⚠️ later |
| `room.beforeCreated` | ✅ | ✅ | ✅ | ⚠️ later |
| `room.beforeDeleted` | ✅ | — | ✅ | ⚠️ later |
| `room.beforeUserJoined` / `room.beforeUserLeave` | ✅ | — | ✅ | ❌ |
| `email.beforeSent` | ✅ | ✅ | ✅ | ❌ |
| livechat room create | ✅ | — | ✅ | ❌ |
| every `*.sent` / `*.created` / post event | ✅ | — | — | — |

- **Upload can prompt** because the two-step `rooms.media` → `rooms.mediaConfirm`
  flow already stages the bytes and defers the message. Upload is also the shape
  to copy: its hard block and its prompt live on **different hooks** — the block
  at the pre-stage, the prompt on the confirm step.
- **Message and room prompting is possible but heavy.** Those run inside a
  synchronous server pipeline, so a prompt means aborting with a challenge and
  having the client re-issue the action with a token — the plumbing 2FA already
  has.
- **Join, leave, livechat and email cannot prompt.** They are often triggered by
  server-side flows with no user to ask.

## Many apps on one event

One event still runs every app that listens to it. The legacy engine chains
Modify handlers and short-circuits Prevent handlers; ADR 0002 writes down the
composition rules that were implicit, and `defineListener` needs the same ones:

1. **Precedence:** `prevent` > `prompt` > `patch` > `pass`. A prevent wins
   immediately and stops the loop.
2. **Patches chain.** Each app sees the subject as the previous apps left it.
   The runtime forwards the **patched subject**, never the outcome wrapper.
3. **First prompt wins.** A prompt suspends the operation at once. On resume the
   chain re-runs from the top, so a later app may prompt in turn, and an app that
   would have prevented gets its say on the second pass.
4. **An outcome the event does not allow is logged and treated as `pass`**
   (fail-open). The types make this unreachable for a well-formed app; the rule
   covers a tampered payload. A disallowed variant is never a legitimate block,
   and failing open degrades better than a user-facing outage on a hot path.

Rule 3 has a cost the ADR accepts explicitly: a prompt can fire even though a
later, un-consulted app would have prevented the action. Consulting every app
before resolving would forfeit the short circuit on the hottest paths.

## The outcome must survive the transport

`ListenerOutcome` is a compile-time brand. At runtime the outcome crosses
JSON-RPC, and two facts decide its runtime shape:

- **A class instance arrives stripped of its prototype and methods.** The
  runtime always sees plain data, so the outcome is a plain object and
  `ctx.prevent` / `ctx.modify` are factories that stamp it. Nothing is lost by
  making them factories, and the app author never writes the stamp.
- **The discriminator cannot be `type`.** `IMessage` and `IRoom` both carry a
  top-level `type` field, so `'type' in result` cannot tell an outcome from a
  message — and a value allow-list would let a future `MessageType` collide on a
  hot path. ADR 0002 reserves `'@kind': 'EventResult'` instead, recognized by one
  guard that runs **before** any legacy branch. The `@` prefix keeps it out of
  the space of legitimate property names.

This is also what gives the engine a **non-exceptional prevention channel**:
blocking an action no longer means throwing an exception across the transport
and matching on its name at the other end.

## The host type is derived, not restated

ADR 0002 derives its host-side outcome type from the app-facing union: it strips
the marker, which has done its job once the guard recognized the result, and adds
attribution to the `prevent` variant alone.

That is [the sixth design principle](00-overview.md#design-principles) applied to
one return type, and it buys a property worth naming: **a new variant costs one
edit.** Widening the app-facing union widens every host outcome type with it,
where a hand-written host union would silently keep the old vocabulary.
