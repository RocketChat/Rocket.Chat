# Web findings from the characterization goldens

Issue drafts for a person to review and file. Nothing here is filed, and nothing is fixed in the POC.

## About these drafts

- Source: while writing the Phase 1b goldens (`apps/meteor/client/lib/chats/**/*.golden.spec.ts`, `apps/meteor/client/lib/UserAction.golden.spec.ts`; see "Phase 1b golden results" in `COMPOSER-PLAN.md`), behaviors that look like bugs were pinned as they are. Each was then re-read against the current code on this tree.
- Not claimed: no live reproduction on a running server or browser. Every claim rests on the cited code, and where noted on a golden spec that asserts the behavior against the real module and real stores (with fakes for the network, toasts and modals).
- Decision (user, 2026-11-27): these are only REPORTED. The POC keeps the behavior (the goldens pin it, and native twins copy it). A fix is a separate `fix:` change a person orders.
- Evidence labels: "verified by a golden spec" = a test asserts the behavior on this tree; "read from code only" = no test asserts it.
- Line numbers are from this tree (`feat/expo-lab-all`). The drafts follow `.github/ISSUE_TEMPLATE/bug_report.md`; Server Setup Information is `n/a: found by reading the code`, and Client Setup and Relevant logs are left to the filer (none was collected).
- Duplicate check: `gh issue list --repo RocketChat/Rocket.Chat --search ... --state all`, read-only, title and keyword searches per finding. No likely duplicate was found for any finding (details at the end).

Summary

| # | Finding | Severity | Evidence |
| --- | --- | --- | --- |
| 1 | Typing indicator: one debounce for every room | Low | golden |
| 2 | Typing auto-stop of a thread publishes on the thread id channel | Low | golden |
| 3 | Failed-uploads modal dismissed: send never settles; too-long upload rejection: flow never settles | Low | golden |
| 4 | Failed `chat.sendMessage` leaves `temp: true` | Medium | golden for the store; UI effect from code |
| 5 | `/constructor` (and other inherited names) run as a slash command with `command: undefined` | Low | golden |
| 6 | Upload `send` resolves on `load` whatever the HTTP status | Low | golden |
| 7 | `Message_not_found` toast branch unreachable; a failing lookup rejects out of `sendMessage` | Low | golden |
| 8a | `+:emoji:` matches on any line of a multi-line text | Low | golden |
| 8b | `processSetReaction` does not roll back the optimistic reaction when the POST fails | Low | golden |
| 8c | `afterSendMessageCallback` gets the outer message, and also runs after a sub-flow ended the send | Low | golden |

---

## 1. Typing indicator: a single debounce is shared by every room

### Title
`UserAction`: a typing start in another room within 500 ms drops the pending publication of the first room

### Description
`emitActivities` is one module-level lodash `debounce` (`apps/meteor/client/lib/UserAction.ts:41`, 500 ms). Both `start` (`:134`) and `stop` (`:168`) call it with `(rid, extras)`. A debounced function runs once with the arguments of its last call, so a call for room B inside the window replaces a pending call for room A. Room A's activity is never published in that window.

### Steps to reproduce
1. Have two rooms A and B open or reachable from the same client (for example two threads or a room and a thread, or fast room switching with the composer typing handler).
2. Trigger a typing start in A, then a typing start in B less than 500 ms later.
3. Observe the `notify-room` publications.

### Expected behavior
One publication per room, `A/user-activity` and `B/user-activity`.

### Actual behavior
Only `B/user-activity` is published. A's activity stays in the local `roomActivities` set and goes out on the next start or stop for A (the renew window is 5 s, so a peer may miss up to that long).

### Server Setup Information
n/a: found by reading the code.
Evidence: `UserAction.ts:41-44`, `:134`, `:168`.

### Additional context
- Verified by a golden spec: `UserAction.golden.spec.ts`, test "shares one debounce across rooms: a start in another room inside the window replaces the pending publication" (starts in `rid` and `rid-other` 0 ms apart; after 500 ms the only publication is for `rid-other`).
- Severity: Low. Typical use has one composer focused, so two near-simultaneous starts are rare (thread plus main composer, programmatic starts, fast switching). Impact: a peer sees "is typing" later or not at all for the room that lost.
- Fix changes web behavior: yes, additively (the lost publication now goes out). Test that pins it: invert the golden above to expect both publications.
- Fix sketch: key the debounce per room (and thread), for example a `Map<string, DebouncedFunc>` keyed by `extras?.tmid || rid`, or debounce per key inside `emitActivities`.

---

## 2. Typing auto-stop publishes on the thread id channel

### Title
`UserAction`: the 15 s auto-stop of a thread activity publishes on `<tmid>/user-activity` instead of `<rid>/user-activity`

### Description
`start` schedules the auto-stop with `this.stop(trid, activityType, extras)` where `trid = extras?.tmid || rid` (`UserAction.ts:143`). `stop(rid, ...)` then passes its first argument as the room to `emitActivities(rid, extras)` (`:148`, `:168`), which publishes on `${rid}/user-activity` (`:43`). For a thread, that first argument is the thread id. An explicit `stop(rid, type, { tmid })` publishes on the real room id.

### Steps to reproduce
1. Start a typing activity in a thread (`extras.tmid` set) and do nothing for 15 s.
2. Watch the `notify-room` publications.

### Expected behavior
The auto-stop is published on `<rid>/user-activity`, like the start and like an explicit stop.

### Actual behavior
The auto-stop is published on `<tmid>/user-activity`. Nobody subscribes to a thread-id channel (`addStream(rid)` subscribes by room id, `:80-104`), so peers never receive the stop and rely on their own 15 s timeout (`handleStreamAction`, `:57-60`).

### Server Setup Information
n/a: found by reading the code.
Evidence: `UserAction.ts:143`, `:148-168`, `:43`.

### Additional context
- Verified by a golden spec: `UserAction.golden.spec.ts`, test "publishes the auto-stop of a thread activity on the thread channel, not the room channel" (publishes `rid` with `tmid: 't1'`, then `t1` with `tmid: 't1'`). The explicit stop is pinned by "an explicit stop publishes on the room channel and cancels the pending auto-stop".
- Severity: Low. Impact: the thread typing indicator can linger up to 15 s after the user stopped, only when the sender goes idle without sending or stopping.
- Fix changes web behavior: yes (the stop now reaches subscribers). Test: invert the golden above to expect `publication(rid, [], { tmid: 't1' })`.
- Fix sketch: call `this.stop(rid, activityType, extras)` in the timeout (stop already derives `trid` itself).

---

## 3. Sends that never settle (failed-uploads modal, too-long upload)

### Title
Composer: `sendMessage` hangs forever when the failed-uploads modal is dismissed, and when the too-long-message upload fails

### Description
a) `processMessageUploads` returns a promise that only `onConfirm` of the "some failed" modal resolves (`apps/meteor/client/lib/chats/flows/processMessageUploads.ts:184-217`). `onCancel`, `onClose`, the all-failed `onConfirm` ("Ok") and `onClose` only call `imperativeModal.close()` and never call `resolve`. `sendMessage` awaits it inside `process` (`flows/sendMessage.ts:77`, `:164`), so the call never returns and `afterSendMessageCallback` never runs.

b) `processTooLongMessage` wraps the modal in `new Promise` whose `onConfirm` is `async` and calls `resolve()` only after `await chat.flows.uploadFiles(...)` (`flows/processTooLongMessage.ts:27-40`). If `uploadFiles` rejects, `resolve` is never reached, the handler's rejection goes unhandled, and `sendMessage` stays pending.

### Steps to reproduce
a) Attach files so that at least one upload has failed, press send, dismiss the warning (Cancel, Escape or Ok). b) Type a text longer than `Message_MaxAllowedSize` with attachment conversion enabled, confirm "send as attachment" while `uploadFiles` rejects (for example the room is no longer in the store).

### Expected behavior
`sendMessage` settles (for a, with `false` or a cancel outcome; for b, with the error toasted).

### Actual behavior
The promise stays pending. The text is not cleared (a); the confirm handler rejects unhandled (b).

### Server Setup Information
n/a: found by reading the code.

### Additional context
- Verified by golden specs: `flows/processMessageUploads.golden.spec.ts`, tests "never settles when the user dismisses ..." (`onCancel`, `onClose`) and "never settles after %s: the modal only ..." (all-failed `onConfirm`, `onClose`); `flows/processTooLongMessage.golden.spec.ts`, test "never resolves when the upload rejects: the confirm handler rejects and the flow stays pending".
- Severity: Low. The user can send again, because the composer is not locked by this promise as far as the code shows (read from code only: not checked against every caller of `chat.flows.sendMessage`). Impact: a leaked pending promise, and callers that await the send never continue.
- Fix changes web behavior: only for callers that await the send (they would now continue). Test: invert the goldens to expect a settled promise (a: `false`; b: rejection reaching the `sendMessage` `catch`, one error toast).
- Fix sketch: a) resolve `false` in every dismissing handler. b) wrap the `onConfirm` body in `try`, `reject` (or toast and resolve) on failure.

---

## 4. A failed `chat.sendMessage` leaves the optimistic message as pending

### Title
Failed message send leaves the optimistic message with `temp: true` (shown as pending) in the room

### Description
`sendMessage` stores an optimistic copy with `temp: true` (`flows/sendMessage.ts:42-55`), then awaits `sdk.rest.post('/v1/chat.sendMessage', ...)` (`:95`). If the POST rejects, the code after it (`:101-104`, which clears `temp`) is not reached, and nothing removes the record. The outer `try` only toasts the error (`:166-168`). The message components render `temp` as pending (`components/message/variants/RoomMessage.tsx:116`, `:123` `aria-busy`; `ThreadMessage.tsx:48`).

### Steps to reproduce
1. Open a room and cut the network (or make `chat.sendMessage` fail server-side).
2. Send a message.

### Expected behavior
The optimistic message is removed, or marked as failed with a retry, and the composer text is recoverable.

### Actual behavior
An error toast appears, and the message stays in the list in its pending state until a reload or a stream update replaces it. The composer was already cleared (`:92`).

### Server Setup Information
n/a: found by reading the code.

### Additional context
- Verified by a golden spec (store contents): `flows/sendMessage.golden.spec.ts`, test "keeps the temp record, toasts, and skips the after-send callback when the request fails". The visual effect (pending styling) is read from code only.
- Severity: Medium. Impact: user-visible message that looks sent or sending but was never delivered, text lost from the composer. Possible partial mitigation elsewhere (a reconnect resend path) was not looked for.
- Fix changes web behavior: yes. Test: invert the golden (record removed, or flagged as failed) and add an e2e for an offline send.
- Fix sketch: in a `catch` around the POST, remove the optimistic record (or set a failed flag the message UI understands), restore the composer text, rethrow.

---

## 5. `/constructor` runs as a slash command

### Title
Slash commands: inherited `Object.prototype` names (`/constructor`, `/toString`, `/__proto__`) are resolved as commands and POST `commands.run` without a command

### Description
`parse` looks the name up with `slashCommands.commands[cmd]` (`flows/processSlashCommand.ts:20`). `commands` is a plain `{}` (`apps/meteor/client/lib/slashCommand.ts:25`), so names such as `constructor` resolve to inherited values and are treated as a registered command. The destructure then reads `permission`, `clientOnly`, `command: commandName` from a function or object, all `undefined`, so the flow clears the composer and POSTs `/v1/commands.run` with `command: undefined` (dropped by JSON), plus a telemetry POST with `command: undefined` (`:72-95`).

### Steps to reproduce
1. In a room where `Message_AllowUnrecognizedSlashCommand` is off (default), type `/constructor` and send.

### Expected behavior
The unrecognized-command warning (`No_such_command`), as for any unknown name.

### Actual behavior
No warning. The composer clears and the server receives `commands.run` with no `command`, so the server answers with an error; the user sees "Something went wrong while executing command" with an `undefined` name. (Server response is not verified here.)

### Server Setup Information
n/a: found by reading the code.

### Additional context
- Verified by a golden spec: `flows/processSlashCommand.golden.spec.ts`, test "resolves an inherited property name as a command: /constructor runs a command with undefined fields". Correction: `//` is NOT a finding. It parses to the name `/`, which is simply an unrecognized command (pinned as such).
- Severity: Low (input a user rarely types; no data impact).
- Fix changes web behavior: yes, for those names only. Test: invert the golden to expect the unrecognized-command warning and no POST.
- Fix sketch: look up with `Object.hasOwn(slashCommands.commands, cmd)` or build `commands` with `Object.create(null)`. Note for the native twin: keep the lookup a plain property read until this is decided, as the plan states.

---

## 6. Upload `send` resolves on `load` whatever the HTTP status

### Title
Uploads store: `send()` resolves for 400, 403 and 500 responses; failures are only visible through the store

### Description
In `UploadsStore.send` the promise resolves from the `load` callback (`apps/meteor/client/lib/chats/uploads.ts:166`) and is rejected only by validation, the `error` event, or cancel (`:144-153`, `:177`, `:209`). The `xhr.onload` handler (`:182-203`) records an error on the upload for 400/403 (parsed body) and for any other non-200 status (`FileUpload_Error`), but does not reject.

### Steps to reproduce
1. Upload a file the server rejects with 400, 403 or 500 (for example over the server size limit when the client limit is higher).

### Expected behavior
`send()` rejects, or returns a result the caller can check, consistently with client-side validation failures (which do reject, then are recorded).

### Actual behavior
`send()` resolves. The failure exists only as `upload.error` in the store. `uploadFiles` uses `Promise.allSettled`, so a caller cannot tell the difference from the promise alone; `processMessageUploads` reads `upload.error` later, which is how the failed-uploads modal (finding 3a) appears.

### Server Setup Information
n/a: found by reading the code.

### Additional context
- Verified by a golden spec: `chats/uploads.golden.spec.ts`, test "stays pending until the load event, whatever the status", with "records a generic error for any other status" for the 500 case.
- Severity: Low. The user does see the error in the store-driven UI, so this is an inconsistent contract rather than a user-visible bug; it may be intentional.
- Fix changes web behavior: possibly (anything awaiting `send`). Test: invert the golden to expect rejection for 400/403/500 and re-run the `uploadFiles` goldens.
- Fix sketch: reject from `onload` after recording the error, or document the store as the single source of truth and keep it.

---

## 7. `Message_not_found` toast is unreachable; a failing lookup rejects out of `sendMessage`

### Title
`sendMessage`: the "Message not found" warning for an empty-text edit can never fire, and a failed `findMessageByID` rejects unhandled

### Description
In the empty-text edit branch, `sendMessage` checks `if (!originalMessage)` and toasts `Message_not_found` (`flows/sendMessage.ts:172-178`). `findMessageByID` (`apps/meteor/client/lib/chats/data.ts:37-39`) returns the store record, or the `chat.getMessage` REST result mapped by `mapMessageFromApi`; for a missing message the REST call rejects, so the function never resolves with `null`/`undefined`. The lookup sits outside the `try` (`:173`, also `:143`, `:149`), so the rejection leaves `sendMessage` with no toast.

### Steps to reproduce
1. Start editing your own message, clear its text, and have the message deleted (by a moderator or another session) before pressing Enter.

### Expected behavior
The "Message not found" warning.

### Actual behavior
Read from code only: `chat.getMessage` rejects, the promise returned by `sendMessage` rejects without a toast from this flow (the caller may handle it).

### Server Setup Information
n/a: found by reading the code.

### Additional context
- Verified by a golden spec: `flows/sendMessage.golden.spec.ts`, the "Message_not_found" case (`:616-636`) only works with `dataOverrides: { findMessageByID: async () => null }`, and the test "rejects (outside the try) when the lookup of the original itself fails" pins the rejection out of `sendMessage` (with `chat.getMessage` rejecting). That the real server rejects for a deleted message is read from code only.
- Severity: Low (dead branch plus an unusual race).
- Fix changes web behavior: yes (a toast appears). Test: a golden where the lookup rejects expecting the warning toast and `false`.
- Fix sketch: move the lookups into the `try`, toast `Message_not_found` for the rejection, or have `findMessageByID` return `null` for a 404.

---

## 8. Other pinned quirks that look like bugs

### 8a. Reaction shortcut matches any line

#### Title
`+:emoji:` reaction shortcut triggers when it is on any line of a multi-line message

#### Description
`processSetReaction` uses `msg.trim().match(/^\+(:.*?:)$/m)` (`flows/processSetReaction.ts:85`). The `m` flag makes `^`/`$` match at every line, so a message such as `hello there\n+:smile:` is treated as a reaction command: the composer is cleared, the whole text is dropped, and the reaction is posted on the last message.

#### Steps to reproduce
Type `hello` then Shift+Enter then `+:smile:` and send, with `smile` a known emoji.

#### Expected behavior
The message is sent as text (the shortcut is the whole message).

#### Actual behavior
A reaction is added to the last message, and the text (`hello`) is discarded.

#### Server Setup Information
n/a: found by reading the code.

#### Additional context
- Verified by a golden spec: `flows/processSetReaction.golden.spec.ts`, test "treats any line of a multi-line text as the reaction (the pattern is multiline)".
- Severity: Low-to-Medium (silent loss of typed text; needs an unusual message). Say Medium if a maintainer judges text loss important.
- Fix changes web behavior: yes. Test: invert the golden to expect `false` and a normal send.
- Fix sketch: drop the `m` flag.

### 8b. No rollback when the reaction POST fails

#### Title
Optimistic reaction stays in the message after `chat.react` fails

#### Description
`processSetReaction` applies the optimistic update (`:102`), then toasts and rethrows if the POST fails (`:103-108`), without undoing the update. The composer was cleared at `:101`.

#### Steps to reproduce
Send `+:smile:` while `chat.react` fails (offline, or a read-only room the client check missed).

#### Expected behavior
The optimistic reaction is reverted and the typed text is not lost.

#### Actual behavior
Error toast; the reaction still shows locally until a reload or stream update.

#### Server Setup Information
n/a: found by reading the code.

#### Additional context
- Verified by a golden spec: `flows/processSetReaction.golden.spec.ts`, test "toasts, rethrows, and keeps the optimistic reaction".
- Severity: Low. Impact: a reaction displayed that the server does not have.
- Fix changes web behavior: yes. Test: invert the golden (record equals the pre-update record).
- Fix sketch: capture the message before the optimistic update and restore it in the `catch`.

### 8c. `afterSendMessageCallback` runs with the outer message and after sub-flows

#### Title
`sendMessage`: `afterSendMessageCallback` receives the pre-transform message, and runs even when a slash command, reaction or too-long error ended the send

#### Description
`sendMessage` calls `afterSendMessageCallback(message, message.rid)` (`flows/sendMessage.ts:165`) with the outer composed `message`. Inside `process`, `message` is reassigned to the result of `onClientBeforeSendMessage` (`:82`) and mutated (`:85-86`), but that is a different binding, so callbacks see the original object, not what was posted. Also `process` returns early for slash commands, reactions and the too-long toast (`:65-75`), and the callback still runs after each. It does not run when the transform or the request throws.

#### Steps to reproduce
Register an `afterSendMessageCallback` listener and send `/join foo`, `+:smile:`, or a too-long message.

#### Expected behavior
The callback runs only for a message that was actually sent, with the message as posted (for example the encrypted form is not exposed to it, and edits via `isEditing` are not mixed in).

#### Actual behavior
The callback runs in all three cases with the outer message. Whether any real listener is affected was not checked (read from code only: the callback's registered consumers were not enumerated).

#### Server Setup Information
n/a: found by reading the code.

#### Additional context
- Verified by golden specs: `flows/sendMessage.golden.spec.ts`, "posts what onClientBeforeSendMessage returned, minus e2e and isEditing, but ..." (the callback receives the outer message) and "ends in the slash flow for an unrecognized command and still runs the aft..." (callback after a sub-flow).
- Severity: Low (depends on what the listeners do; may be intended for slash commands).
- Fix changes web behavior: yes, for listeners. Test: invert the two goldens only after deciding the intended contract with the listener owners.
- Fix sketch: have `process` return an outcome (`'sent' | 'handled'`) plus the posted message, and call the callback only for `'sent'` with that message.

---

## Dropped or corrected

- `//` in finding 5: not a bug (an unrecognized command named `/`), dropped from that draft.
- "The rich-text popup range is fine" (the reviewer's note): nothing to file; not carried over.
- Pinned quirks not turned into drafts, because they read as deliberate or harmless: duplicate id toast with the POST still sent; federated room and user without username skipping the optimistic insert; the upper-case `TXT` extension of the e2e attachment; `uploadFiles` redefining `file.name`; `cancel` doing a second no-op `update`; the stream handler emptying the array it receives; the `processMessageUploads` rejection for an encrypted image whose size cannot be measured (outside the `try`), which a person may want to add to finding 3.

## Duplicate check

Read-only `gh issue list --repo RocketChat/Rocket.Chat --search "<keywords>" --state all --limit 10`, with and without `in:title`, for: typing indicator / debounce / user-activity, failed uploads / send anyway, stuck sending / pending message, slash command / constructor, reaction `+:emoji:`, upload status, `afterSendMessageCallback`. No likely duplicate. Related but not duplicates (different problems, listed so a person does not confuse them):

- #6819 (closed) "Rocket.Chat+ on Android: Sending message stuck in 'Sending' state, displaying wrong message owner": same symptom family as finding 4 but a different client and cause.
- #41324 (open) "Web client silently discards slash command text after the first line break before it reaches the command handler": same code path as finding 5, a different defect.
- #6985 and #8336 (closed): reaction duplicates and invalid emoji, not the multi-line shortcut.

Search was keyword-based and the GitHub search index is coarse, so a person should repeat it with their own phrasing before filing.
