# sendMessage + getReadReceipts: DDP → REST migration plan

Two methods we reverted in #40659 because client plumbing depends on
DDP-specific semantics. This document captures the root cause and the
work needed to migrate them cleanly.

---

## 1. `sendMessage` — optimistic-reconciliation gap

### Symptom

E2E test `tests/e2e/quote-attachment.spec.ts:29` (`should show file
preview and description when quoting a message with attachment`) fails
after migrating `apps/meteor/client/lib/chats/flows/sendMessage.ts` to
`sdk.rest.post('/v1/chat.sendMessage', { message, previewUrls })`.

Playwright observes the composer still in quote-preview state right
after pressing send — `getByRole('blockquote').getByText('Message for quote -')`
resolves to two elements: one inside `aria-label="Quoting the attachment"`
(the composer's quote preview), one inside `aria-label="Room composer"`.
No blockquote appears in the message list because the optimistic temp
message never gets replaced with the server-rendered version that
carries the rendered quote+attachment.

### Why DDP works

`sdk.call('sendMessage', message, previewUrls)` returns the saved
`IMessage` via the Meteor `Methods` protocol. As a side effect Meteor's
Minimongo collection sync mirrors the inserted document back into the
client `messages` collection at the same time the method result lands.
The room-messages stream subscription also publishes the document, but
the Minimongo path arrives first.

The composer flow assumes this reactive replacement:

```ts
// apps/meteor/client/lib/chats/flows/sendMessage.ts
chat.composer?.clear();                  // input drops, quote preview stays
await runOptimisticSendMessage(message); // pushes temp message into local store
await sdk.call('sendMessage', message, previewUrls); // <-- triggers DDP sync
Messages.state.update(                   // remove temp:true marker
    (record) => record._id === message._id && record.temp === true,
    ({ temp: _, ...record }) => record,
);
```

Two reactive consumers depend on the post-send state:

1. The quote-preview overlay watches for the temp message to be
   replaced by a non-temp record with rendered `attachments`. The
   server's `executeSendMessage` injects the quote block into
   `attachments[]`; when Minimongo replays the insert, the overlay
   detects the rendered quote and unmounts the preview.

2. The message list keeps the optimistic record in place but the
   reactive replacement carries server-side enrichments — `urls`,
   `attachments[]` rendered, `_updatedAt`, `mentions`.

### Why REST breaks it

`sdk.rest.post('/v1/chat.sendMessage', ...)` returns
`{ message: Serialized<IMessage> }`. There is no Minimongo replication.
The client only sees the server-rendered version when the streamer
`room-messages` event arrives — which can race after the
`Messages.state.update` call that strips `temp: true`.

The composer's quote-preview overlay sees:
1. A `temp: true` record (from optimistic send).
2. Then a record with `temp: false` but **no rendered attachments yet**.
3. The `room-messages` event eventually arrives with the rendered
   message, but by then the test has already failed.

### Migration plan

**Phase 1 — reconcile via REST response.** Use the `{ message }`
returned by REST to replace the optimistic temp record directly:

```ts
chat.composer?.clear();
await runOptimisticSendMessage(message);
const { message: saved } = await sdk.rest.post('/v1/chat.sendMessage', {
    message,
    previewUrls,
});
Messages.state.update(
    (record) => record._id === message._id,
    () => mapMessageFromApi(saved),
);
```

This swaps the optimistic record with the full server-rendered version
in the same tick the REST call resolves, mirroring the Minimongo
timing. The composer-preview overlay's reactive watch fires immediately.

**Phase 2 — handle send errors.** REST throws on non-2xx where DDP
errored through Meteor.Error. Wrap the call and surface failures the
same way:

```ts
try {
    const { message: saved } = await sdk.rest.post(...);
    ...
} catch (error) {
    Messages.state.update(
        (record) => record._id === message._id && record.temp === true,
        (record) => ({ ...record, error: serializeError(error) }),
    );
    dispatchToastMessage({ type: 'error', message: error });
}
```

**Phase 3 — fanout updates to composer overlay.** Confirm that the
quote-preview component listens to the `Messages` store update event
and not to a Minimongo-specific reactive callback. Today it uses
`Messages.use()` which works on either backend, so probably no change
needed. Verify with Playwright trace.

**Phase 4 — apply to the 8 callsites.** The flow above is the primary
send path; the other seven (asciiart slash commands, useNotification,
GameCenterInvitePlayersModal) are fire-and-forget and don't need the
reconcile dance — they can do `sdk.rest.post(...)` directly with no
optimistic record. Pull a thin `sendMessageRest` wrapper into the
sendMessage module and have those callsites use it without the
optimistic reconcile.

**Test plan.**
- Quote a regular text message.
- Quote a message with attachment (the failing case).
- Quote inside a thread.
- Edit a message after sending (eMx the optimistic record flow).
- Asciiart slash commands.
- Reply from desktop notification.
- Slow-network simulation (DevTools → Slow 3G): the optimistic
  reconcile should still happen on resolve, no double-render.

---

## 2. `getReadReceipts` — visitor self-receipt race

### Symptom

E2E test
`tests/e2e/omnichannel/omnichannel-livechat-read-receipts.spec.ts:53`
(`read receipts show both agent and visitor names`) fails after
migrating `ReadReceiptsModal.tsx` to
`useEndpoint('GET', '/v1/chat.getMessageReadReceipts')`.

The dialog renders one listitem instead of two. The expected items
are the visitor's self-receipt (auto-created when the visitor sends
the message through the livechat widget) and the agent's receipt
(created when the agent opens the chat and the unread-marker fires).

Playwright auto-retries the locator nine times within 5s; the count
never reaches 2.

### Why DDP works

`sdk.call('getReadReceipts', { messageId })` is queued through the
Meteor methods pipeline. Behind it sits `useMethod`, which wraps the
call inside `Meteor.applyAsync`. Meteor's livedata server processes
method invocations serially per connection; the call queues behind any
in-flight subscription publishing the receipts collection.

Most importantly, the **agent reading the chat** path goes through
`afterReadMessages → ReadReceipt.markMessagesAsRead`, which inserts
the agent's receipt. The visitor's self-receipt is inserted by a
separate callback that fires on `afterSaveMessage` for visitor-authored
messages (this is the auto-self-receipt logic). Both inserts are
asynchronous; their ordering relative to the `getReadReceipts` call
matters.

In the DDP path, the method's userspace work yields the event loop a
few times more than the REST handler does, giving both inserts a
chance to land before `ReadReceipt.getReceipts(message)` runs.

### Why REST breaks it

`useEndpoint('GET', '/v1/chat.getMessageReadReceipts')` hits an Express
route directly. The handler runs `getReadReceiptsFunction(messageId,
this.userId)` synchronously after auth/license checks — no Meteor
yields. If the visitor's self-receipt write is still in flight, the
GET returns one document.

This is the classic read-after-write race: the receipts collection
write is fire-and-forget from the visitor message's hook chain, the
test waits for the agent to open the chat (which fires its own write),
then the test opens the dialog. Whether the visitor write completes
before the GET depends on event-loop timing — DDP happens to win,
REST loses.

### Migration plan

**Phase 1 — server-side await.** Make the visitor self-receipt
insertion synchronous on the message-send path, not fire-and-forget.
The hook today is registered as an async `afterSaveMessage` callback
with `runAsync`; switching to `run` for that one callback (or
short-circuiting the receipt insert inline) closes the race regardless
of which client transport queries it.

Concrete change: in the livechat message-save path, await the
ReadReceipt creation before returning the saved message. The
visitor's send already serializes on the API call that created the
message, so the latency cost is borne by the visitor, not the agent
or the test.

**Phase 2 — client-side resilience.** Add a refetch trigger on the
dialog: subscribe to the `notify-room/<rid>/messagesRead` stream and
invalidate the `['read-receipts', messageId]` query when an event
references the same message. This handles the "agent reads after the
dialog is open" case (which doesn't happen in tests today but can in
production).

```ts
const subscribeToNotifyRoom = useStream('notify-room');
useEffect(() => {
    if (!message.rid) return;
    return subscribeToNotifyRoom(`${message.rid}/messagesRead`, () => {
        queryClient.invalidateQueries({ queryKey: ['read-receipts', messageId] });
    });
}, [message.rid, messageId, queryClient, subscribeToNotifyRoom]);
```

**Phase 3 — migrate the client.** Once Phase 1 closes the race,
re-apply the `useEndpoint('GET', '/v1/chat.getMessageReadReceipts')`
swap. `mapReadReceiptFromApi` is already in place; reuse it.

**Test plan.**
- Visitor sends a livechat message; agent opens the chat; agent
  inspects read receipts → expects two entries.
- Agent sends a reply in the same room; visitor's widget consumes it
  → visitor's read receipt eventually shows up.
- Edit a message that has receipts → receipts get a fresh `_updatedAt`
  reflected via the stream invalidation.
- Open the dialog while the agent is actively reading new messages
  in the room → receipts re-render as new entries land.

---

## 3. Why we reverted in #40659 rather than fixing inline

- Phase 1 of sendMessage requires touching the optimistic-message
  reconciliation contract that every send path depends on. Worth its
  own PR with focused QA on regression-prone areas (composer, quoting,
  thread send, retries, offline send).

- Phase 1 of getReadReceipts is a behavior change on the server-side
  hook ordering. Changing it under a migration PR mixes the concerns
  — better as a "tighten read-receipt race" fix in its own commit.

- #40659 still gains the other 18 migrations (autotranslate, e2e.*,
  cloud:syncWorkspace, getRoomById, getThreadMessages, listCustomUserStatus,
  createDirectMessage, createPrivateGroup, executeSlashCommandPreview,
  getSlashCommandPreviews, getSingleMessage, saveRoomSettings,
  setUserStatus, personalAccessTokens:*). Those are clean.

## 4. Suggested PR sequencing

1. **PR A** — Server change: make livechat visitor self-receipt synchronous on save (fixes test, no client change).
2. **PR B** — Client change: re-apply REST migration for getReadReceipts + invalidation hook.
3. **PR C** — Composer reconciliation: swap optimistic temp record with REST `{message}` response in `sendMessage.ts`.
4. **PR D** — Re-apply REST migration on the 8 sendMessage callsites.

PR A and C can land in parallel. PR B depends on A. PR D depends on C.
