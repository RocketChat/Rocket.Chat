# ADR 0014 — Message scheduling: storage, delivery and API state

- **Status:** proposed
- **Date:** 2026-11
- **Scope:** `packages/models` (`ScheduledMessages`), `apps/meteor/server/services/scheduled-messages`, the
  `scheduledMessages.*` experimental endpoints

[docs/features/message-scheduling.md](../features/message-scheduling.md) tells how the function works. This ADR
tells why.

## Decision

1. **A separate collection holds the scheduled messages** (`rocketchat_scheduled_message`). A message goes into the
   messages collection only when it posts. About 95 files query the messages collection, through 76 model methods.
   A hidden flag there needs a new filter in each query, and one missed filter shows a message before its time.
   The `watch.messages` broadcast and the after-save callbacks also run when the document goes in. The send steps
   must then run again by hand at the due time.
2. **One job at the next due time, and a watchdog every 5 minutes.** The shared `cronJobs` wrapper gives no job
   data to the callback, and Agenda locks only the job names that the process defines. Jobs with a name for each
   message thus stay without an owner after a restart. The watchdog sends the messages of a job that an instance
   lost.
3. **The server never sends a message again on its own.** If an instance stops during a send, the message becomes
   interrupted, and the user decides. "Send anyway" can then post a second copy. A message that the server posts two
   times is a worse error than a late one.
4. **A scheduled send is a live send.** It uses the same code and does the same checks at the send time. In an
   encrypted room, the client encrypts the text when it schedules the message, and the server keeps only the
   ciphertext. A scheduled message gets no path past a rule that a live message must obey.
5. **The REST endpoints stay experimental until all clients support the function**
   (`/api/experimental/scheduledMessages.*`). The data format and the API format need an agreement with the
   architecture team first. The mobile app will use the experimental endpoints, as it does for `rooms.setCategory`.
   One change moves them to `/api/v1` at the end.

### Alternatives rejected

- **A hidden flag on the messages collection.** See decision 1.
- **One Agenda job for each message.** See decision 2.
- **A new send after a crash, with no user action.** The server cannot know if the first send posted the message.
- **Stable endpoints from the start.** A change to the format after the release then breaks the clients.

## Consequences

- No query of the messages collection changes. Room history cannot show a scheduled message. If the timeline must
  show a "scheduled" marker later, examine the hidden flag again.
- The scheduled messages need their own cleanup. The "Cleanup" section of the feature doc lists the cases.
- After a lost job, a message can post up to 5 minutes late. The target is 1 minute.
- Files in encrypted rooms are not supported yet. An encrypted upload keeps its file keys in the encrypted content,
  and the scheduled message does not store that content.
- When the endpoints move to `/api/v1`, all clients must change at the same time, the mobile app included.

## Open questions

- **Recovery time.** Is a delay of 5 minutes after a lost job acceptable? If not, make the watchdog interval
  shorter, or change the target.
- **API format.** Which changes does the architecture team want before the endpoints move to `/api/v1`?
