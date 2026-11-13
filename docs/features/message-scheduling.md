# Message scheduling

A user writes a message in the composer and selects a time. At that time, the server sends the message as the user.
The feature is experimental: its REST endpoints are under `/api/experimental/scheduledMessages.*` and can change in any
release.

## Turning it on

Two gates must both be open:

| Gate | Where | Checked by |
| --- | --- | --- |
| `Message_Scheduling_Enabled` (default off) | Admin, Message settings | the server and the client |
| `schedule-message` permission | Admin, Permissions | the server and the client |

When an admin turns `Message_Scheduling_Enabled` off, the server deletes every scheduled message and its held files.
They cannot be restored.

## Lifecycle

A scheduled message is a document in `rocketchat_scheduled_message`, apart from the messages collection. Its `status`
is one of:

- `pending`: waits for its `scheduledAt`. The author can edit, reschedule, send now, or delete it.
- `sending`: claimed for a send. Nobody can change it.
- `failed`: the send failed. `error` holds an i18n key for the reason. The author must act: retry, reschedule, edit,
  or delete. The server never deletes a failed message by itself.

After a send, the server deletes the document. The message is then a normal message in the room.

Editing a failed message changes its content but keeps it failed. Only a new time puts it back to `pending`, so an edit
never sends an overdue message at once.

## Sending

- **One timestamp job.** The cron job `scheduled-messages` runs at the earliest `scheduledAt` of a pending message.
  Each run sends every due message, then replaces the job with one at the next time. Every create, edit, delete and
  send does the same replacement. Within an instance the replacements run one at a time.
- **A watchdog.** The job `scheduled-messages-watchdog` runs every 5 minutes. It sends the due messages that a lost
  timestamp job did not send. It also marks as `error-scheduled-message-interrupted` a message that stays in `sending`
  for more than 5 minutes, for example after a crash. The panel then offers "Send anyway", because the message may already be in the room.
- **One send per message.** A send starts with an atomic claim (`pending` → `sending`). Two instances, or the job and
  "Send now", cannot claim the same message.
- **The same checks as a live send.** At send time the server checks again that the author is active, has
  `schedule-message` in the room, and can send in the room. A message that fails a check becomes `failed`.
- **A sent message stays sent.** When the send works but removing the document fails, the message stays in `sending`
  and the watchdog marks it interrupted. It never becomes a plain `failed` that "Retry" would send again.

## Files

A message can carry files uploaded from the composer. An upload is temporary until a message uses it, and the cleanup
of temporary uploads deletes it after a while. Scheduling a message marks its uploads as permanent, so they stay until
the send time. Deleting the message, its author, or its room deletes the held files.

The server posts one message per file, with the text on the first one, as a live upload does. After each file it
deletes that file and the text from the document. A retry after a partial failure then posts only the files that
remain.

## Cleanup

| Event | Effect |
| --- | --- |
| Setting turned off | All scheduled messages and held files deleted |
| Room deleted | Its scheduled messages deleted, and their authors notified |
| User deactivated or deleted | Their scheduled messages and held files deleted |

## Client

- Every view reads one query: the author's scheduled messages, at most 100 (`MAX_ITEMS_PER_USER`). The room panel, the
  count in the room menu and in the composer menu, and the sidebar icon each filter it by room.
- The server sends `notify.scheduledMessage` with the author's id after every change. The client listens on
  `notify-user` at `<uid>/scheduled-messages` and loads the list again.
- `useCanScheduleMessages` is the single client gate (setting and permission). Every scheduling UI checks
  it, including those that show cached data.
- The composer wraps Send in a split button only when the schedule menu shows. Without scheduling, Send is a plain
  button. The menu stays closed while the composer disables Send.
- Editing loads the message into the composer of its room or thread. When the edit ends, the composer gets back the
  text and files the user was writing before.

## Encrypted rooms

The server never reads or holds the text of a message scheduled in an end-to-end encrypted room.

- When the user schedules or edits the message, the client runs the same encryption step as a live send
  (`onClientBeforeSendMessage`). The scheduled message then holds `t: 'e2e'`, the ciphertext in `content`, and
  `e2eMentions`. Its `msg` is empty.
- At the send time, the server posts `content` as it is.
- The panel decrypts `content` to show the text and to load it for editing.
- The ciphertext carries the id of the room key. A member can still decrypt the message after a room key reset,
  because clients keep the old keys.
- The server refuses plain text for an encrypted message, and encrypted content for a plain one.

## Restrictions

| Case | Behavior |
| --- | --- |
| Files in an encrypted room | Not supported. The composer disables the schedule menu while it holds attachments. Encrypted uploads carry their file keys inside the encrypted content, and the server does not store that content yet. |
| Encrypted room without its key | The composer disables the schedule menu until the room key is ready. |
| Omnichannel rooms | The composer hides the schedule menu. |
| Slash commands | The composer does not schedule them. The server does not check for one: a scheduled `/command` goes out as plain text. |
| Quoted messages | The composer disables the schedule menu while it holds a quote, because the scheduled message would drop it. |
| File message in a thread | The server ignores "Also send to channel", as for a live upload. |
| Federated rooms | Not blocked. A scheduled send uses the live send path, so federation relays it like any other message. No test covers this yet. |
| Limits | At most 100 scheduled messages per user. The send time must be between 1 minute and 120 days ahead. |
