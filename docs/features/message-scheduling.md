# Message scheduling

A user writes a message in the composer and selects a time. At that time, the server sends the message as the user.
The feature is experimental: its REST endpoints are under `/api/experimental/scheduledMessages.*` and can change in any
release. [ADR 0014](../adr/0014-message-scheduling-storage-and-delivery.md) tells why the design is as it is.

## Turning it on

The setting `Message_Scheduling_Enabled` (default off) and the permission `schedule-message` must both allow it. The
server and the client check both. When an admin turns the setting off, the server deletes every scheduled message
and its held files. They cannot be restored.

## Lifecycle

A scheduled message is a document in `rocketchat_scheduled_message`. Its `status` is one of:

- `pending`: waits for its `scheduledAt`. The author can edit, reschedule, send now, or delete it.
- `sending`: claimed for a send. Nobody can change it.
- `failed`: the send failed, and `error` holds an i18n key for the reason. The author can always delete it. Retry,
  reschedule and edit show only when the reason is not final. An archived room, for example, is final. A failure
  never deletes the message.

After a send, the server deletes the document. An edit of a failed message keeps it failed. Only a new time puts it
back to `pending`, so an edit never sends an overdue message at once.

## Sending

- **One job.** The cron job `scheduled-messages` runs at the earliest `scheduledAt` of a pending message. Each run
  sends the due messages and replaces the job with one at the next time. Each change to a message also replaces it.
- **A watchdog.** The job `scheduled-messages-watchdog` runs every 5 minutes. It sends the due messages that a lost
  job did not send. It also sets each message that is in `sending` for more than 5 minutes to failed, with
  `error-scheduled-message-interrupted`. The watchdog does this check only when it runs, thus a message can stay in
  `sending` for 5 to 10 minutes. The panel then shows "Send anyway", because the message can already be in the room.
- **One claim.** A send starts with an atomic change to `sending`, from `pending`, or from `failed` for a retry.
  While the claim holds, two senders cannot send the same message. After an interrupted send, the server does not
  send the message again. The user decides, and "Send anyway" can post a second copy.
- **The same checks as a live send.** At the send time, the server checks again that the author is active, has
  `schedule-message`, and can post in the room.

## Files

Scheduling a message keeps its temporary uploads until the send time. Only temporary uploads of the author in that
room can be held. The server posts one message for each file, with the text on the first one, as a live upload
does. After each file, it takes that file out of the document, so a retry posts only the files that remain.

## Cleanup

Three events start a cleanup: an admin turns off the setting, someone deletes a room, or an admin deactivates or
deletes a user. The server then deletes the related scheduled messages and their held files, and notifies their
authors.

## Client

- One query gives the author's scheduled messages, at most 100. The room panel, the menu counts and the sidebar icon
  filter it by room.
- After each change, the server notifies the author on `notify-user` at `<uid>/scheduled-messages`. The client then
  loads the list again.
- An edit opens the message in the composer of its room or thread. When the edit ends, the composer gets back the
  draft the user had before.

## Encrypted rooms

The server never reads or holds the text of a message scheduled in an end-to-end encrypted room. The client encrypts
the text as for a live send, and the scheduled message holds `t: 'e2e'`, `content` and `e2eMentions`, with an empty
`msg`. The server posts `content` as it is. The panel decrypts it to show and to edit the text. The server refuses
plain text for an encrypted message, and encrypted content for a plain one.

## Restrictions

| Case | Behavior |
| --- | --- |
| Files in an encrypted room | Not supported. The composer disables the schedule menu while it holds attachments. |
| Encrypted room without its key | The composer disables the schedule menu until the room key is ready. |
| Quoted messages | The composer disables the schedule menu while it holds a quote. |
| Omnichannel rooms | The schedule menu does not show. The server does not refuse them. |
| Slash commands | The composer refuses them. Through the API, a scheduled `/command` posts as plain text. |
| Federated rooms | Not blocked. Federation relays the message as a live one. No test covers this yet. |
| Limits | 100 scheduled messages for each user. A send time from 1 minute to 120 days ahead. |
