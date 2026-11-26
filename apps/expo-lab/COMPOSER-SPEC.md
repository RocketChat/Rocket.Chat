# Spec: Native message composer

Status: Draft for the user's review. Not accepted; nothing is implemented from it until the user signs it.
Author: drafted by an agent; Guilherme Gazzo decides and owns the spec and the plan.
Intent: [COMPOSER-INTENT.md](COMPOSER-INTENT.md) (outcomes `O1` to `O19`, decisions `D1` to `D10`, gaps `Q1` to `Q15`). Lab evidence: [TEXTINPUT-FINDINGS.md](TEXTINPUT-FINDINGS.md). Gap report: [NATIVE-MESSAGE-COMPOSER-GAP.md](NATIVE-MESSAGE-COMPOSER-GAP.md), sections 6 to 9.

Format follows the XMPP package's specs (numbered observable requirements, proof table, open questions). Deviation: no front matter, since this lives in `apps/expo-lab` and has no code or test lists yet; the proof table carries them.

## Scope

In the first spec, for a room's composer in the Expo app: text field with growth, send (button and Return), edit, reply, mentions and channels as plain-text ranges, slash commands (list from the server, see Q6), formatting through the selection, emoji picker sheet and `:shortcode:` autocomplete, attach files and photos, audio recording, drafts, typing indicator, disabled states through `resolveComposerState`, accessibility labels, and proof that web is unchanged.

Deferred, with the reason:

- Omnichannel composer, voice calls: outside the React Native scope (D1, D2).
- Thread composer (`tmid`, "also send to channel"): intent out of scope.
- UiKit and Marketplace message-box actions: not a composer text feature.
- Encrypted rooms (sending and decrypting): no native E2EE; the composer is disabled with a reason (R52, Q8).
- Video message, location: audio only in this spec (Q7).
- Custom (server-uploaded) emoji: needs the emoji data path; the sheet shows the standard set (R34, Q3).
- Image paste, paste interception, modifier-key submit, shortcuts, history walk with arrows, drag and drop, rich-text composer: no event or no input device on native (intent, "Stays web-only").
- Canned responses, previews in the slash popup (`ComposerBoxPopupPreview`): not in the intent's outcomes; decide in Q6.
- Offline queue beyond the optimistic state; pixel parity; any server or schema change.

## Terms

- **Field**: the multiline native `TextInput` of the composer. **State**: `{ text, selection }` in React state, `selection` being `{ start, end }` in UTF-16 offsets, written to the field through its controlled `selection` prop.
- **Web composer**: the composer on the tree this branch builds from (re-checked before acceptance against `origin/message-list/09-thread-list-and-cleanup`, per the intent).
- **Same as web**: for the same text, selection, quotes, room and user preference, the same function runs or the same body reaches the same server call.
- **Return key**: the soft or hardware Return, detected through `onKeyPress` reporting `Enter`.

## Requirements

Each is one observable statement. `O#` is the intent outcome it implements; `Q#` marks a requirement that cannot be accepted until that open question is answered.

### Field and height

- **R1** In a room whose composer state is `message`, the room screen shows a multiline field at its bottom, and typed text appears in it. O1
- **R2** With the keyboard open, the whole field and the send button are visible above the keyboard. O1
- **R3** The empty field is 52 px high; it grows with its content, never exceeds 155 px, scrolls its content past that, and returns to 52 px when cleared. The web values are to be confirmed for touch. O2
- **R4** A 600-character text with no break opportunity wraps and reaches the maximum height (the case where the content-size callback goes stale). O2

### Send and return

- **R5** The send button sends the field's text whatever the `sendOnEnter` preference is. O3
- **R6** With an empty or whitespace-only field, the send button sends nothing and leaves the field as it was. O3
- **R7** With `sendOnEnter` on, Return sends the text as it stood before Return was pressed: the message and the cleared field contain no extra line break. O3, Q17
- **R8** With `sendOnEnter` off, Return inserts a line break at the caret and sends nothing. O3
- **R9** The sent text is trimmed and an unclosed code fence is closed, by the function web uses. O4
- **R10** The sent message appears in the message list at once in web's optimistic state, then shows as confirmed or as failed when the server answers. O4
- **R11** A message over the server's length limit goes through the same "too long" flow as web and is not truncated or dropped. O17
- **R12** After a send is accepted the field, the quoted messages and the attachment list are empty. O3, O4

### Payload parity

- **R13** For the same text, quotes and room, the message passed to `/v1/chat.sendMessage` has the same fields as web's (`rid`, `msg`, `_id`, quote attachments), with no `tshow` and no `md`. O5
- **R14** Markup characters typed in the field are sent unchanged: the client adds no markup web does not add. O5

### Reply and edit

- **R15** Choosing reply on a message shows a quote of it above the field with a dismiss control. O7
- **R16** Sending with a quote includes the quote attachment exactly as web does. O7
- **R17** Dismissing a quote removes it, sends nothing and leaves the field text unchanged. O7
- **R18** Choosing edit on one's own message, from the message actions, puts its text in the field with an "editing" hint and a cancel control. O8, Q9
- **R19** Sending in edit mode updates the message through the call web uses and leaves edit mode; cancel leaves edit mode and restores the field to what it held before the edit began. O8
- **R20** Edit is offered only on messages web allows the user to edit. O8, Q9

### Mentions and autocomplete

- **R21** After `@` at the start of the text or after whitespace, a list of matching users, plus the room-wide mentions web offers, appears above the field and narrows as the person types. O9
- **R22** Choosing an entry replaces the trigger text with `@username ` as web does; the field holds plain text, with no styling or chip. O9
- **R23** After choosing an entry the caret is right after the inserted space. O9, Q2
- **R24** `#` behaves as `@` for channels, inserting `#channel `. O9
- **R25** The list closes when the caret leaves the trigger word or the field is cleared. O9

### Slash commands

- **R26** Typing `/` at the start of the message shows the commands the user may run, taken from the server's list. O10, Q6
- **R27** Choosing a command inserts `/command `; sending it runs through the same slash-command path as web, including the "command not recognized" ephemeral reply. O10, Q6
- **R28** Commands are not offered where web does not offer them (an e2e room that disallows them). O10

### Formatting

- **R29** Each formatting button wraps a non-empty selection with web's pattern, and the resulting text equals web's `wrapSelection` result for the same text and selection. O12
- **R30** Pressing the same button on an already wrapped selection removes the wrapping, as on web. O12
- **R31** With an empty selection a formatting button inserts the empty pattern with the caret inside it. O12, Q2
- **R32** After a formatting action the selection is the one web leaves. O12, Q2

### Emoji

- **R33** Typing `:` and two characters offers emoji matching the shortcode; choosing one inserts `:shortcode:`. O11
- **R34** The emoji button opens a sheet; choosing an emoji inserts it at the caret and keeps the field's selection afterwards. The sheet lists the standard set only. O11, Q3

### Attachments

- **R35** The attach action lets the person pick one or more files or photos; each shows in the composer with a remove control. O13
- **R36** Adding files beyond the web file-count limit is refused with web's toast and adds none. O13
- **R37** Sending uploads each file with the same server call as web, then clears the composer. O13
- **R38** An upload error or an e2e restriction shows the same toast as web. O13

### Audio

- **R39** The record control starts a recording and the composer shows that recording is in progress. O14, Q7
- **R40** Cancelling a recording discards it and sends nothing. O14, Q7
- **R41** Sending a recording uploads an audio attachment of the same kind web sends. O14, Q7
- **R42** With the microphone permission denied, recording is unavailable and the composer says so as web does. O14, Q7

### Drafts

- **R43** Leaving a room and coming back restores its unsent text. O6
- **R44** Restarting the app restores the unsent text of a room. O6
- **R45** Sending or clearing removes the local draft and the server draft. O6
- **R46** When the server holds a draft for the room it is shown instead of the local one. O6
- **R47** Drafts are per room: the text of one room never appears in another. O6

### Typing

- **R48** While the person types, others in the room see them typing; it stops after send, clear or the web timeout. O15, Q13
- **R49** The composer shows who else is typing in the room. O15, Q13

### Disabled states

- **R50** For every `resolveComposerState` kind other than `message` and `omnichannel`, native shows web's replacement for that kind and no field. O16
- **R51** The decision comes from the shared `resolveComposerState` called with the same inputs, never from a native copy. O16
- **R52** In an encrypted room that does not allow unencrypted messages, the field is disabled with a stated reason. O16, Q8
- **R53** For the `omnichannel` kind native shows a fixed "not available in this app" replacement and no field. O16, Q16

### Accessibility and input methods

- **R54** Autocorrect, dictation and the platform emoji keyboard work in the field. O18, Q15
- **R55** While an IME composition is active, no popup, autocomplete or formatting action rewrites the field value. O18, Q15
- **R56** Every control (send, attach, record, emoji, formatting, dismiss, cancel, list entries) has an accessible name and role. New: not an intent outcome, confirm it belongs.

### Web parity

- **R57** Every existing web composer spec (`MessageBox`, `createComposerAPI`, `wrapSelection`, `messageBoxHelpers`, `useDraft`, `composerState`, `sendMessage`, `uploads` and the others in the same folders) passes with no edit to any spec file. O19
- **R58** The web client's composer e2e passes. O19
- **R59** Each extraction of shared code is its own commit below the feature, edits no spec file, and the web composer specs pass at that commit. O19

## Interfaces

No code here. The seam is the existing `ComposerAPI` type in `apps/meteor/client/lib/chats/ChatAPI.ts`; this spec adds a native implementation of it and does not add members.

State: `{ text: string, selection: { start: number, end: number } }`. The controlled `selection` prop is the only way the composer places the caret. `ref.setSelection` is not used for edits. The composer writes the intended selection itself after every programmatic edit, because native does not report it back.

`ComposerAPI` members and how native supplies them:

- State and edits, over React state: `text`, `selection`, `setText`, `insertText`, `insertNewLine`, `replaceText`, `substring`, `clear`, `wrapSelection`, `getCursorPosition`, `setCursorToEnd`, `setCursorToStart`, `focus`, `blur`, `release`.
- Subscribables, native twin of the state half of `createComposerAPICore`: `quotedMessages`, `editing`, `recording`, `isMicrophoneDenied`, `formatters`, `uploads`; `replyWith`, `quoteMessage`, `dismissQuotedMessage`, `dismissAllQuotedMessages`, `setEditingMode`, `setRecordingMode`.
- `recordingVideo`, `setRecordingVideo`: constant false (video deferred, Q7).
- `composerRef: RefObject<HTMLElement | null>`: a DOM member the native twin cannot honestly supply (Q18).

Pure and shared with web (moved only by extraction commits, R59): `wrapSelection.ts`, `messageBoxHelpers.ts` (both in `views/room/composer/messageBox/`), `lib/messageBoxFormatting.ts`, `views/room/composer/lib/composerState.ts` (already pure), the pure part of `views/room/composer/hooks/useComposerBoxPopup.ts`, and the state half of `lib/createComposerAPICore.ts`.

Native twins and new files (names to be fixed by the plan): the native `ComposerAPI` implementation, composer view and view-model hook in `apps/expo-lab/src`; `useDraftStorage` with a `.native.ts` over AsyncStorage in `packages/ui-client` (D9); a file-picker hook and an audio-recorder hook in `packages/ui-client` with `.native.ts` siblings, each only with this consumer (D4).

Existing files that change (web-visible, so R57 to R59 apply): `views/room/composer/messageBox/hooks/useDraft.ts` (read and write local storage through `useDraftStorage`); `lib/chats/flows/uploadFiles.ts` and `lib/chats/uploads.ts` (`File[]` becomes a type that also accepts a picked `{uri, name, type}`; its own commit inside the POC, D8 as decided for this spec); the files of the extractions above.

Called as they are: `chat.flows.sendMessage` (ends in `/v1/chat.sendMessage`), `processMessageEditing`, `processSlashCommand` (`/v1/commands.run`), `processTooLongMessage`, `UserAction` (`sdk.publish('notify-room', ...)`). Whether these evaluate under Metro without Meteor is intent risk 2 and is not yet probed.

## Platform notes

- iOS (iPhone 17 Pro simulator, iOS 26.5, React Native 0.88.1, New Architecture): the lab proved controlled text, a non-empty controlled selection in both write orders, the wrap arithmetic, UTF-16 offsets and min/max height. Not proved: caret position after an edit, anything under real typing.
- Android: not run. A different native component and event counting; the iOS result is not assumed to carry over. Nothing in this spec is accepted for Android until a lab run.
- IME, dictation, emoji keyboard, autocorrect effects: unverified. Code-read only: a controlled value that always echoes the native text is safe; any rewrite during composition ends it (R55).
- `onPaste` does not exist and `onKeyPress` has no modifier flags (code-read, 0.88.1), hence the deferred list. A multiline field inserts a newline on Return by default and `onSubmitEditing` does not fire (code-read); R7 depends on the order of `onKeyPress` and the text change, which is untested (Q17).

## Proof table

Class of proof: **U** unit spec (jest, no device); **S** simulator observation with scripted taps, probe and screenshots, as the lab did (no typing); **I** needs keystroke injection on the simulator (idb or XCUITest; neither is confirmed installed) and is weaker than a real keyboard; **R** only real typing or a real device; **E** the existing web run.

| Req | Class | Proof |
| --- | --- | --- |
| R1 | S | Open a room on the simulator, probe the field text after a scripted `setText`, screenshot |
| R2 | S | Focus the field with the keyboard up, screenshot shows field and button above it |
| R3 | S | Lab rows 1, 3, 10, 40 lines: 52, 81, 155, 155; clear returns to 52 |
| R4 | S | Lab row with 600 unbroken characters; field height and wrapped lines |
| R5 | U | Hook spec: submit with `sendOnEnter` on and off calls send once |
| R6 | U | Hook spec: `''`, spaces, newlines call nothing |
| R7 | I | Spec with simulated `onKeyPress`/change order, then keystroke injection of Return on the simulator; ordering is untested (Q17) |
| R8 | I | Same, preference off: text gains `\n`, nothing sent |
| R9 | U | The shared function's existing spec, plus a native hook spec that it is called |
| R10 | U | Spec with the real store and a mocked server: optimistic, then confirmed, then failed |
| R11 | U | Spec: over-limit text takes the `processTooLongMessage` branch |
| R12 | U | Hook spec after an accepted send |
| R13 | U | One fixture of inputs run through web `composeMessage` and the native path; bodies deep-equal |
| R14 | U | Same fixture with `*`, `_`, backticks, `@`, `#` in the text |
| R15 | S | Trigger reply, screenshot of the quote and dismiss |
| R16 | U | Fixture of R13 with a quote |
| R17 | U | Subscribable spec: dismiss leaves text and sends nothing |
| R18 | S | Trigger edit from the actions, probe field text, screenshot hint |
| R19 | U | Spec: edit send calls `processMessageEditing`; cancel restores prior text |
| R20 | U | Same predicate web uses, specced with permission and age cases |
| R21 | I | Trigger detection from text and caret is a pure function (U); the visible list needs injected typing |
| R22 | U | Pure replace-range spec against the web insertion text; lab row 4 for the native text |
| R23 | I | Caret is not observable by the lab (blinks); injected typing then a second keystroke shows where it lands |
| R24 | U | Same spec for channels |
| R25 | U | Pure trigger-detection spec |
| R26 | S | Probe against a dev server for the list endpoint; screenshot of the popup. Blocked by Q6 |
| R27 | U | Spec that the native path calls the same `processSlashCommand`; ephemeral reply by S on a dev server |
| R28 | U | Spec of the predicate |
| R29 | U | Existing `wrapSelection.spec.ts` plus a spec that native passes state through it; lab rows 3 for text |
| R30 | U | Same spec, toggle case |
| R31 | I | Text by U; caret position needs injected typing after the action |
| R32 | I | Same; the highlighted range for a non-empty selection is already S (lab 2b to 2f) |
| R33 | I | Shortcode detection by U; list on screen by injected typing |
| R34 | S | Open the sheet, tap an entry, probe the text and screenshot the selection |
| R35 | S | Pick from the simulator photo library by scripted taps |
| R36 | U | Spec of the count check, same constant as web |
| R37 | U | Adapter spec: `{uri,name,type}` reaches the same upload call; one real upload on a dev server (S) |
| R38 | U | Spec of the toast branches |
| R39 | R | Microphone capture on a real device; the simulator route is unreliable |
| R40 | R | Same |
| R41 | R | Same, plus a dev-server check that the attachment type matches web's |
| R42 | S | Deny the permission in the simulator settings, observe |
| R43 | S | Scripted leave and return, probe text |
| R44 | S | Scripted app kill and relaunch, probe text |
| R45 | U | `useDraftStorage` and `useDraft` specs: both stores empty after send and clear |
| R46 | U | `useDraft` spec with both values present (existing case, extended for native storage) |
| R47 | U | Storage-key spec |
| R48 | S | Two clients on a dev server; the notify event for the room. Blocked if `sdk.publish` is absent (Q13) |
| R49 | S | Same, second client shows the indicator |
| R50 | U | `composerState.spec.ts` for the decision, native view spec per kind |
| R51 | U | Spec that the native view calls the shared function; import check |
| R52 | U | Spec of the encrypted predicate and the disabled view |
| R53 | U | Spec of the kind and the view |
| R54 | R | Real device, real keyboard, dictation |
| R55 | R | Real device with a Japanese or Korean IME, popup open while composing; a value-echo spec (U) guards the code path only |
| R56 | S | Accessibility tree dump on the simulator lists a name and role per control |
| R57 | E | `yarn .testunit:jest` on the composer folders, run unedited, at every commit |
| R58 | E | The web composer Playwright specs |
| R59 | U | `git diff --stat` of each extraction commit shows no spec file |

Summary of 59: 30 U, 15 S, 7 I, 5 R, 2 E. Only real typing or a device can prove R39 to R41, R54 and R55; R7, R8, R21, R23, R31 to R33 need keystroke injection at least.

## Out of scope

Everything in the deferred list above, and: changes to any endpoint or message schema, the Fuselage Box decision, an Android lab run, the plan itself.

## Open questions

Each says what blocks. Recommendations are the agent's until the user answers.

- **Q2 Caret after an edit and plain-text mentions.** Blocks R23, R31, R32. Unstyled mention text in the field is acceptable to the spec; caret placement after a programmatic edit is not observed. Recommendation: accept plain text, set the caret through the controlled `selection` prop, prove it with injected typing (I).
- **Q3 Emoji sheet and custom emoji.** Blocks R34 only for the sheet versus panel shape. Recommendation: bottom sheet over `EmojiPickerContext`, standard set only, custom emoji after the first spec.
- **Q6 Slash command list.** Blocks R26, R27. Found: `GET /v1/commands.list` exists (`apps/meteor/server/api/v1/commands.ts`) and returns the server's `slashCommands.commands`, paged, with `permission`, `clientOnly`, `providesPreview`. Not verified: whether it includes the commands web gets from its client registry, and the permission filter is left to the client. Recommendation: probe it on a dev server; if it lacks commands, mark the missing ones deferred in this spec. Previews out of scope.
- **Q7 Audio in the first milestone.** Blocks R39 to R42. Recommendation: audio stays in the spec but is the last commit; the first milestone may stop at text, attach, emoji.
- **Q8 Encrypted rooms.** Blocks R52. Recommendation: read-only with a reason on native; no native E2EE.
- **Q9 Edit entry point.** Blocks R18, R20. Recommendation: edit from the message actions; it ships after the message toolbar (gap report step 6) exists.
- **Q12 Styling props.** Blocks no requirement; shapes the files. Recommendation: layout containers and Tamagui frames, not `ui-composer`'s Box parts, until the Fuselage owner decides.
- **Q13 Typing indicator.** Blocks R48, R49. Recommendation: include; probe `sdk.publish` from the native SDK first; if absent the two requirements move to deferred.
- **Q14 Image paste.** Blocks nothing; recommendation: leave out (deferred list).
- **Q15 IME and popups.** Blocks R54, R55. Recommendation: popups never rewrite the value during composition; needs a real-device check before the spec is accepted.
- **Q16 (new) Omnichannel and federation kinds.** `resolveComposerState` also returns `omnichannel` and `federation` (the intent's outcome 16 lists neither). Blocks R53 and the federation part of R50. Recommendation: omnichannel shows a fixed unsupported notice (R53); federation shows web's blocked or active state as part of R50.
- **Q17 (new) Return sends the pre-Return text.** The Return keypress arrives through `onKeyPress` while the field still inserts a newline by default, so the text may already contain it, in the middle of the message. Blocks R7. Recommendation: the lab measures the order of `onKeyPress` and the change with injected keys; if the newline lands first, the send path takes the text with that one line break removed at the caret.
- **Q18 (new) `composerRef` in `ComposerAPI`.** The type has a DOM member (`RefObject<HTMLElement | null>`), against the intent's "the type does not grow DOM members". Blocks the Interfaces section. Recommendation: native supplies an inert ref and the plan records it; changing the type is a web-visible edit that the user decides.

## Readiness

Not ready to be planned. Met: every requirement is one observable statement with an outcome, an interface and a proof class; the decisions the user took are encoded (D7, D8 as a commit, D9, D10, `{text, selection}`, web-only items). Missing:

1. Answers to Q6, Q13 and Q17 (each needs one probe on a dev server or the simulator, and each can remove or reshape requirements).
2. Answers to Q8, Q9 and Q16, which are choices.
3. A real-device check for Q15 (R54, R55), and a decision on Android (none of this is proven there).
4. Confirmation that R56 belongs, that the 52/155 px bounds hold on touch (R3), and that `composerRef` (Q18) may be inert.
5. The simulator tooling for class I (idb or XCUITest) is not confirmed present; without it R7, R8, R21, R23, R31 to R33 fall to class R.
6. Intent text to update after sign-off: D8 says the signature change is its own pull request while D10 and this spec say its own commit; outcome 4 says "room list" where it means the message list.
