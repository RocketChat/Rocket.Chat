# E2EE local search

The server cannot read an end-to-end encrypted message, so it cannot search one. The local search keeps a full-text
index of the decrypted messages on the user's device. The search of an encrypted room reads that index. The decrypted
text never leaves the device. The feature is experimental and works only in a desktop app that offers an index.

The code is in `apps/meteor/client/lib/e2eeSearch/`. `apps/meteor/client/lib/e2ee/rocketchat.e2e.ts` connects the parts
to the E2EE client, the room streams and the subscription store.

## The parts

| Part | Job |
| --- | --- |
| Backend | The index itself. The desktop app supplies it through the bridge. |
| Session | Opens the index for the logged-in user when E2EE is unlocked. Locks or wipes it. |
| Writer | Collects the decrypted messages and sends them to the open index in batches. |
| Crawler | Reads the history of one room from the server, one page at a time, and indexes it. |
| Scheduler | Selects the next room and page for the crawler, and paces the requests. |
| Runtime | Starts a crawler and a scheduler for each open index, and tells the scheduler about room events. |
| Query | Searches the index and the server, and merges the two lists. |

## The desktop bridge

`packages/desktop-api/src/index.ts` declares the contract (`ISearchIndexBackend`). The desktop app exposes it as
`window.RocketChatDesktop.e2eeSearch`. Only desktop versions that keep a local index have it. The web client uses the
bridge only when every required method is present. Without a backend, encrypted rooms keep the old behavior: nobody can
search them.

The contract:

- `open({ userId, wrapKey })` opens the index of the user. The wrap key is 32 bytes derived from the user's E2EE
  private key, never the private key itself. Thus the index opens only for the same key. It survives a logout, and no
  server can open it for another user. The result tells whether the index is encrypted on disk (`encryptedAtRest`). On
  Linux with no key store, the desktop app keeps the index in memory only.
- `open` returns `locked: true` when it got no wrap key and the server holds an E2EE key for the user, or cannot tell.
  The desktop app then opens nothing and writes nothing. Each index call fails until an open with the wrap key.
- `upsert`, `remove`, `removeRoom` and `search` change and read the documents. A document is one decrypted message,
  with its attachment texts and file names. A hit snippet is HTML: the message text is escaped, and the only tags added
  are `<mark>` tags.
- `getRoomState` and `setRoomState` keep the crawler position of each room (`lastUpdate`, `backfillCursor`,
  `backfillDone`) in the index. Thus the work survives a restart.
- `listRooms` gives the rooms that have rows, so the web client can remove the rooms that the user left while the index
  was closed.
- `wipe()` deletes the open index. `wipe({ userId })` with no open index (E2EE locked) deletes the index of that user.
  The desktop app checks that user against the login session.
- `close` is optional. It closes the index and keeps it on disk, so the same user opens it again at the next login.
  Desktop versions without it close the index themselves at logout.
- `onIndexEvent` is optional. A `lost` event tells that rows of the open index are gone: the user cleared the index, or
  the index process stopped before it saved. A `changed` event tells that the index changed outside this page.

The desktop app sets limits on the documents, the batch size and the body length. The writer and `toSearchDoc` use the
same limits, so the desktop app does not reject a normal batch.

`searchIndexBackendContract.ts` is a test suite that every backend runs: the desktop index and the memory-only fake. It
makes sure that the web client gets the same hits from each backend. Both follow the text rules in
`searchIndexText.ts`. These rules set the word characters, the case and diacritic folding, and the snippet escaping.
The folding is the same as the desktop index's `unicode61 remove_diacritics 2`.

A development build can use a memory-only fake index in a browser. Set the local storage key `E2EESearch_FakeBackend`
to `true`. The fake never writes to disk, and a reload loses it.

## Opt-in and preferences

The local search is off until the user turns it on. Each device decides for itself. The choice is stored in the local
storage of the device, for each workspace and user. The server never receives it. Turning it off wipes the index at
once.

The account page "Local search" (`/account/local-search`) holds the opt-in and the other preferences of this device. It
shows only when E2EE is on and the app has an index backend. The preferences are:

- The rooms to index. The device indexes only the encrypted rooms that the user chose. The search of another encrypted
  room asks the user to start its indexing first.
- How many months of history to index. 0 indexes only new messages.
- A limit of messages for each room.
- The page size, the pause between two requests, and the backoff after errors.

The runtime clamps each value to a safe range before the crawler uses it. A missing or damaged stored value gives the
default, so a bad value never stops the index.

A logout clears the local storage, but it keeps three groups of keys. These are each opt-in that is on, the catch-up
time of each index, and the preferences. The sealed index stays on the device after a logout, so these keys must stay with it:

- Without the opt-in, the next login reads "off" and wipes the index.
- Without the catch-up time, the next open indexes every room again.
- Without the chosen rooms, the next open removes every room from the index.

The logout never removes these keys, not even for a moment. Another tab that saw its opt-in go off would wipe the index.
A change in one tab reaches the other tabs of the workspace through the `storage` event.

## The index session

The session (`searchIndexSession.ts`) has four states: `closed`, `opening`, `open` and `failed`.

- E2EE becomes ready (`READY` or `SAVE_PASSWORD`). If the user opted in, the session derives the wrap key and opens the
  index. The wrap key is an HKDF-SHA-256 of the private key with a fixed label and the user ID. The same key and user
  always give the same bytes, so the index opens again after a logout. A new label makes every sealed index unreadable,
  so the label changes only with a new index schema.
- If the user did not opt in, the session wipes the index of the user and does not open it. Thus no index and no key
  file of the user stays on the device while the local search is off.
- E2EE is locked (keys loading, password needed). The session keeps the index closed. It still wipes the index when
  the user did not opt in. These states come after the settings loaded, so the opt-in is reliable here.
- E2EE stops (`DISABLED`, `NOT_STARTED`, `ERROR`). A logout ends in `DISABLED`. The session stops using the index and
  closes it when the desktop app offers `close`.
- The user changes the opt-in. If the opt-in went off, the session wipes the open index. If the opt-in came on while
  E2EE is ready, the session opens the index.

Each open gets its own backend object. When the session stops using an index, that object rejects every call. Thus
work that an ended session started never reaches the next index. Opens, closes and wipes run one after the other.

Another user can log in on the same page without a logout (login with a token). From that moment until the next E2EE
state change, the session does not use the index of the previous user. The next state change closes that index before
the index of the new user opens.

The E2EE client has a related guard. Each start and stop of the client moves a generation number. A key load that
began under an older generation stops at its next step and writes no key to memory or storage. A decrypt that a logout
or another login ended does not send its text to the index.

A reset of the E2EE password does not wipe the index. The new key cannot open it. The desktop app replaces it at the
next open, when the server has another public key for the user. This also covers a reset on another device.

## The writer

The writer (`searchIndexWriter.ts`) is the only path into the index. The E2EE decrypt sends each decrypted message to
it. Live messages, room loads, the last message of a subscription and the crawler all use the same decrypt, so they
all reach the writer.

- The writer turns each message into a search document (`toSearchDoc`). The body holds the message text first, then
  the attachment texts, then the file names. A hit shows the start of the body or the words around the match. Thus a
  long file name does not push a caption out of the hit. A quote attachment is not indexed with the quoting message: the
  quoted message has its own document.
- It collects the documents for a short time and sends them in batches that the desktop app accepts.
- When the index rejects a batch, the writer splits it in halves and sends each half again, down to single documents.
  It sends a rejected document once more with its body cut to half. If the index rejects it again, the writer reports
  it by its id only, never by its words.
- Upserts and removes run one after the other. Thus a remove never lands before an upsert of the same message.
- The queue belongs to the index that was open when it started. When that index closes, or the index of another user
  opens, the writer drops the queue. Thus the words of one user never reach the index of another user. A decrypt binds
  to the open index before it starts, for the same reason.
- The writer remembers the recently deleted message ids. A decrypt that ends after the delete does not index the
  message again.
- The writer indexes only the rooms that the user chose and still has a subscription to. A decrypt that ends after the
  user left the room does not add rows that the room removal already deleted.

A decrypt that fails because the room key is missing marks the message with `decryptFailed`. The message text is then a
placeholder, so the writer does not index it. A field of the same name in the encrypted payload cannot set the marker.

## The history crawler

The live client sees only the messages that arrive while it runs. The crawler (`searchIndexCrawler.ts`) reads the rest
from `chat.syncMessages`, page by page, like the Seshat crawler. It has two kinds of work for each room:

- **Catch-up** applies the changes since the room's `lastUpdate`: new and edited messages, then deletes. `lastUpdate`
  moves only after the last page, so an interrupted catch-up starts again from it. The deletes are read after the
  updates, so a delete can be newer than an update that landed between the two reads. Thus `lastUpdate` does not count
  the deletes.
- **Backfill** reads older pages, newest first, until it reaches the start of the room, the depth limit (the months of
  history) or the message limit. A message is never sent after its last update, so no older page holds a message
  inside the depth limit.

The crawler saves the room state only after the page is decrypted and the writer flushed it. An interrupted page is
read again, never skipped.

The crawler always sends a paging cursor, because a call without one has no page-size limit on the server. A server
with compound cursors reads `<ms>_<_id>` as a position. It orders the messages of one millisecond by `_id`, so a page
boundary inside that millisecond skips nothing. An older server reads only the leading number. The crawler builds a
cursor only to start paging from a time. After that, it sends back the cursor of the server. The catch-up reads the
millisecond of `lastUpdate` again, because a message can be written in it after the read that set it.

The crawler reads the messages without `APIClient`, because its middleware replaces an HTTP error with the JSON body.
The scheduler needs the status and the rate-limit headers to back off or to remove a room.

**Missing room keys.** A page whose encrypted messages all failed to decrypt keeps its checkpoint and waits for the room
key. The page is read again after the key arrives, also after a restart. At last, only the waiting rooms stay. The crawler then
indexes their pages as they are, because the key may never come: a key of the room's history can be lost. The messages that
do not decrypt stay pending in memory, up to a limit, and the crawler tries them again when the room key arrives. When
the room has its current key and a message still fails, that message needs an old key that does not come back. The
crawler then saves the progress, so the next login does not read that history again.

## The scheduler

The scheduler (`searchIndexScheduler.ts`) runs one crawler request at a time, in the background, also while the user is
active. It waits between two requests.

The order of work:

1. A catch-up of every room, the room that the user opened first.
2. The backfill, one page for each room in turn, the most recently active rooms first.
3. A catch-up of each room whose backfill finished, for the messages sent while it ran.

A room with new activity gets a catch-up, also while a backfill runs. These catch-ups take turns with the backfill
pages, so a busy room does not stop the backfill. The rooms that the user opened, or whose search the user opened, get
three of every four backfill pages until their history is done. The other rooms never stop.

**Pacing.** The default pause uses half of the server's default REST rate limit for a route. Thus the client's own
`chat.syncMessages` calls keep their share. The catch-up of the room that the user opened can skip up to two pauses.
The next full pause repays them, so the average pace stays the same.

**Errors.**

- A rate limit (429) or a server error (5xx) makes the scheduler back off. The wait doubles after each new failure, up
  to the maximum, with jitter. A `Retry-After` or `X-RateLimit-Reset` header can make the wait longer.
- A network failure gets a few retries.
- 403, or 400 with `error-not-allowed`, means the user can no longer read the room. The scheduler removes the room from
  the index.
- Any other error skips the room for this run.

When no work is left, the scheduler waits and then reads the room list again. Thus it catches up the rooms with new
activity and starts the rooms that the user joined, or joined again.

## The runtime

The runtime (`searchIndexRuntime.ts`) starts a crawler and a scheduler when the session opens an index, and stops them
when the session closes it. A new login gets a new scheduler, so nothing of the previous user reaches the next index.

The runtime connects the scheduler to the client events:

| Event | Result |
| --- | --- |
| The connection to the server comes back | A catch-up of every room |
| A subscription's last activity moves | A catch-up of that room. It indexes what the last message does not carry: a burst of messages, an edit or delete of an older message, a thread reply |
| The user opens a room | Its backfill goes first. A room with no live stream also gets a catch-up |
| The client closes a room stream | The next open of the room catches it up again |
| A room key arrives | The pending messages of that room are decrypted again |
| The chosen rooms change, in this tab or another | The room list is read again |
| The user leaves a room, or stops indexing it | Its rows leave the index |

An edit or a delete does not move the room's activity. The client keeps a few rooms open with a live stream, and loads
a room again when it opens with none. The index catches up the room at the same point.

A room that is not open has no message stream. The last message of its subscription is how a new message reaches the
index as it arrives.

**Rooms left while closed.** When the index opens, the runtime waits for the subscription list. Then it removes the rows
of every room that is not a chosen room with a subscription. Such a room is one that the user left, or stopped indexing
in another tab. A sync after a reload also reports the rooms that the user left while the client was closed.

**Out-of-date index.** The server keeps deletion records for 30 days. A catch-up older than that cannot see every
delete. The runtime saves the time of the last full catch-up of every room. If that time is older than 25 days, or
unknown for an index with rows, the runtime empties every room before the backfill starts. Thus a message deleted in
between does not stay searchable. A skipped room was not caught up, so its time is not saved. A time in the future came
from a clock that was ahead, so the real age is unknown and the index is emptied.

**Lost rows.** A `lost` event starts a new crawler and scheduler. They read the room states again and catch up every
room. The room of the last request starts over, because its page can have saved its position after the loss.

## Deletes

A delete reaches the index by one of these paths:

- The room stream sends `deleteMessage` or `deleteMessageBulk` for an open room. The room manager publishes it on
  `roomMessageDeletes`, so it does not import the E2EE client. The runtime applies it only to the chosen rooms.
- A bulk delete with `filesOnly` keeps the messages. A loaded message is indexed again without its file names. A
  message that is not loaded, or has no text left, leaves the index until a sync brings it back.
- With `Message_ShowDeletedStatus` on, the server keeps a deleted message as a placeholder (`t: 'rm'`), so the delete
  arrives as an update. The decrypt and the crawler remove its document.
- An edit that leaves a message with no text removes the document of its old text.
- A catch-up reads the deletes of the room since its `lastUpdate`.
- A removed subscription removes every row of the room. The subscription store publishes the removals of a sync on
  `subscriptionRemovals`, for the same reason as above.

## The query

The search tab of an encrypted room that the user chose runs two searches with the same text:

- The local index finds the encrypted messages.
- The server search finds the messages in the room that are not encrypted.

The search text goes to the server too, because the room can hold messages that are not encrypted. This is the privacy
boundary of the feature: the decrypted messages stay on the device, but the words that the user searches for do not.

**Filters.** The local search reads the filters of the server search (`from:`, `before:`, `after:` and `on:`), with the
same words and the same day-month-year date format. The days are in the user's time zone (`utcOffset`). A `from:me` in
lowercase is the logged-in user, as on the server. A text with only filters lists the newest messages that match them.
One author goes to the index as a filter, by user id or by username. More authors need a filter on the hits.

**Paging.** The index returns at most 100 hits for each call. The local search reads more pages, each one older than
the last, until it has enough hits. The time bound is inclusive, so the next page starts at the oldest time again. A
search with a filter on the hits reads a limited number of pages, because each page is a bridge call.

**Merge.** The list shows the hits of both sources, newest first. The server hits outside the date window of the local
search are dropped, so both sources list the same days. Each source reads only its newest page. An older hit of one source could
skip a hit of the other source. Thus the list stops at the oldest message of a source that can have more.

The search runs again each time the index changes, so it finds the messages that the indexing adds while it shows.
While the search is open, the room gets a catch-up, so the search finds its edits and does not find its deleted
messages. The hits are decrypted text, so the client keeps them only while the panel shows them.

**Snippets.** A snippet is text that other users wrote. The client splits it into text parts, and only `<mark>` and
`</mark>` become highlights. The page renders the parts as text and never parses the snippet as HTML. Each line of the
body is a block. Thus the caption and the file name of a file hit show on separate lines, as in the server result.
