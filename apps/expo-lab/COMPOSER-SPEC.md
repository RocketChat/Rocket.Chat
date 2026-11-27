# Spec: Native message composer

Status: Accepted: signed by the user on 2026-11-26. Ready to be planned ([COMPOSER-PLAN.md](COMPOSER-PLAN.md)); the open gates listed under Sign-off and Readiness stay gates.
Author: drafted by an agent; Guilherme Gazzo decides and owns the spec and the plan.
Intent: [COMPOSER-INTENT.md](COMPOSER-INTENT.md) (outcomes `O1` to `O19`, decisions `D1` to `D10`, gaps `Q1` to `Q15`). Lab evidence: [TEXTINPUT-FINDINGS.md](TEXTINPUT-FINDINGS.md). Gap report: [NATIVE-MESSAGE-COMPOSER-GAP.md](NATIVE-MESSAGE-COMPOSER-GAP.md), sections 6 to 9.

Format follows the XMPP package's specs (numbered observable requirements, proof table, open questions). Deviation: no front matter, since this lives in `apps/expo-lab` and has no code or test lists yet; the proof table carries them.

## Scope

In the first spec, for a room's composer in the Expo app: text field with growth, send (button and Return), edit, reply, mentions and channels as plain-text ranges, slash commands (list from the server, see R26), formatting through the selection, emoji picker sheet and `:shortcode:` autocomplete (unicode only), attach files and photos, drafts, typing indicator, disabled states through `resolveComposerState`, accessibility labels, and proof that web is unchanged.

Deferred, with the reason:

- Omnichannel composer, voice calls: outside the React Native scope (D1, D2).
- Thread composer (`tmid`, "also send to channel"): intent out of scope.
- UiKit and Marketplace message-box actions: not a composer text feature.
- Encrypted rooms (sending and decrypting): no native E2EE; the composer is disabled with a reason (R52).
- Audio recording (R39 to R42), video message, location: the user deferred recording to a later spec, audio only and no video, because it needs a device-only proof and a new native module; the ids stay reserved and are not renumbered.
- Custom (server-uploaded) emoji (`:name:`): needs the emoji data path; the sheet shows the unicode set only (R33, R34).
- Image paste, paste interception, modifier-key submit, shortcuts, history walk with arrows, drag and drop, rich-text composer: no event or no input device on native (intent, "Stays web-only").
- Canned responses, previews in the slash popup (`ComposerBoxPopupPreview`): not in the intent's outcomes; no built-in command provides a preview (R26).
- Blocked, not deferred: edit (R18, R20) waits for the message toolbar step (c1 in the plan), where the long-press actions menu starts it.
- Offline queue beyond the optimistic state; pixel parity; any server or schema change.

## Terms

- **Field**: the multiline native `TextInput` of the composer. **State**: `{ text, selection }` in React state, `selection` being `{ start, end }` in UTF-16 offsets, written to the field through its controlled `selection` prop.
- **Web composer**: the composer on the tree this branch builds from (re-checked before acceptance against `origin/message-list/09-thread-list-and-cleanup`, per the intent).
- **Same as web**: for the same text, selection, quotes, room and user preference, the same function runs or the same body reaches the same server call.
- **Return key**: the soft or hardware Return, detected through `onKeyPress` reporting `Enter`.

## Sign-off

On 2026-11-26 the user signed this spec in the session ("ok assinado") after reading the artifact checklist and the draft. What was signed: the 55 active requirements R1 to R59 (R39 to R42 stay deferred and are not part of acceptance), the settled decisions D1 to D10 of the intent, and the answers of 2026-11-26 listed under "Settled on 2026-11-26".

What the sign-off does not cover. These stay gates, not assumptions, and no requirement is weakened or removed by them:

- Probe P1: the live `commands.list` payload (R26, R27).
- Probe P2: that the server accepts a client publish on `notify-room` (R48, R49).
- Probe P3: `onKeyPress` order under a real Return, which needs idb or XCUITest (R7, R8; Q17).
- The real-device IME check (Q15; R54, R55).
- The Android decision: nothing here is accepted for Android.

## Requirements

Each is one observable statement. `O#` is the intent outcome it implements; `Q#` marks a requirement that cannot be accepted until that open question is answered.

### Field and height

- **R1** In a room whose composer state is `message`, the room screen shows a multiline field at its bottom, and typed text appears in it. O1
- **R2** With the keyboard open, the whole field and the send button are visible above the keyboard. O1
- **R3** The empty field is 52 px high; it grows with its content, never exceeds 155 px, scrolls its content past that, and returns to 52 px when cleared. The web values are the starting point for touch and are to be measured later on a device; a change is an edit of this requirement. O2
- **R4** A 600-character text with no break opportunity wraps and reaches the maximum height (the case where the content-size callback goes stale). O2

### Send and return

- **R5** The send button sends the field's text whatever the `sendOnEnter` preference is. O3
- **R6** With an empty or whitespace-only field, the send button sends nothing and leaves the field as it was. O3
- **R7** With `sendOnEnter` on, Return sends, and the sent text never contains the line break of the Return that triggered the send, whichever of the key event and the text change reaches the composer first; the cleared field has none either. O3, Q17
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
- **R18** Blocked on the message toolbar step (c1). Choosing edit on one's own message, from the long-press actions menu, puts its text in the field with an "editing" hint and a cancel control. O8
- **R19** Sending in edit mode updates the message through the call web uses and leaves edit mode; cancel leaves edit mode and restores the field to what it held before the edit began. O8
- **R20** Blocked on the message toolbar step (c1). Edit is offered only on messages web allows the user to edit. O8

### Mentions and autocomplete

- **R21** After `@` at the start of the text or after whitespace, a list of matching users, plus the room-wide mentions web offers, appears above the field and narrows as the person types. O9
- **R22** Choosing an entry replaces the trigger text with `@username ` as web does; the field holds plain text, with no styling or chip. O9
- **R23** After choosing an entry the caret is right after the inserted space (unverified on native, Q2). O9
- **R24** `#` behaves as `@` for channels, inserting `#channel `. O9
- **R25** The list closes when the caret leaves the trigger word or the field is cleared. O9

### Slash commands

- **R26** Typing `/` at the start of the message shows the commands the user may run, taken from `GET /v1/commands.list` (all pages, the same fetch as `useAppSlashCommands`), filtered by the `permission` each entry carries through the same permission check as web, matched by substring, sorted by name, at most 11. The endpoint does not return the client-only registrations (`open`); native offers none of them, and offers the five `clientOnly` ones (`lennyface`, `tableflip`, `unflip`, `gimme`, `shrug`) only if native supplies their text itself, otherwise it omits them. Whether a live server returns the list this way is unverified (probe P1). O10
- **R27** Choosing a command inserts `/command `; sending it runs through the same slash-command path as web (`/v1/commands.run`), including the "command not recognized" ephemeral reply. A `clientOnly` command is never sent to `commands.run`. O10
- **R28** Commands are not offered where web does not offer them (an e2e room that disallows them). O10

### Formatting

- **R29** Each formatting button wraps a non-empty selection with web's pattern, and the resulting text equals web's `wrapSelection` result for the same text and selection. O12
- **R30** Pressing the same button on an already wrapped selection removes the wrapping, as on web. O12
- **R31** With an empty selection a formatting button inserts the empty pattern with the caret inside it. O12, Q2
- **R32** After a formatting action the selection is the one web leaves. O12, Q2

### Emoji

- **R33** Typing `:` and two characters offers unicode emoji matching the shortcode; choosing one inserts `:shortcode:`. Custom emoji are not offered. O11
- **R34** The emoji button opens a bottom sheet behind `EmojiPickerContext`; choosing an emoji inserts it at the caret and keeps the field's selection afterwards. The sheet lists the unicode set only. O11

### Attachments

- **R35** The attach action lets the person pick one or more files or photos; each shows in the composer with a remove control. O13
- **R36** Adding files beyond the web file-count limit is refused with web's toast and adds none. O13
- **R37** Sending uploads each file with the same server call as web, then clears the composer. O13
- **R38** An upload error or an e2e restriction shows the same toast as web. O13

### Audio (deferred to a later spec)

Deferred by the user on 2026-11-26: audio only, no video, in a later spec. The ids are kept so the intent's outcome 14 still maps to something; none is part of this spec's acceptance and none has a proof row.

- **R39** (deferred) The record control starts a recording and the composer shows that recording is in progress. O14
- **R40** (deferred) Cancelling a recording discards it and sends nothing. O14
- **R41** (deferred) Sending a recording uploads an audio attachment of the same kind web sends. O14
- **R42** (deferred) With the microphone permission denied, recording is unavailable and the composer says so as web does. O14

### Drafts

- **R43** Leaving a room and coming back restores its unsent text. O6
- **R44** Restarting the app restores the unsent text of a room. O6
- **R45** Sending or clearing removes the local draft and the server draft. O6
- **R46** When the server holds a draft for the room it is shown instead of the local one. O6
- **R47** Drafts are per room: the text of one room never appears in another. O6

### Typing

- **R48** While the person types, others in the room see them typing, through a publish on `notify-room` with key `<rid>/user-activity`; it stops after send, clear or the web timeout (15 s). The native session `sdk` is the `DDPSDK` itself, whose `publish(name, key, ...args)` is not the web wrapper's `publish(name, [key, ...args])`, so native supplies the call shape. In the first milestone. O15
- **R49** The composer shows who else is typing in the room. In the first milestone. O15

### Disabled states

- **R50** For every `resolveComposerState` kind other than `message`, `omnichannel` and `federation`, native shows web's replacement for that kind and no field. O16
- **R51** The decision comes from the shared `resolveComposerState` called with the same inputs, never from a native copy. O16
- **R52** In an encrypted room that does not allow unencrypted messages, the composer shows the disabled state with the reason "this room requires encryption, unavailable in this app" and never attempts to send. No native E2EE in the first version. O16
- **R53** For the `omnichannel` and `federation` kinds native shows the disabled state with a stated reason (omnichannel is outside the React Native scope, federation is not supported natively) and no field; it never attempts to write. For `federation` this departs from web, which shows a field when `blocked` is false. O16

### Accessibility and input methods

- **R54** Autocorrect, dictation and the platform emoji keyboard work in the field. O18, Q15
- **R55** While an IME composition is active, no popup, autocomplete or formatting action rewrites the field value. O18, Q15
- **R56** Every control (send, attach, emoji, formatting, dismiss, cancel, list entries) has an accessible name and role. Not an intent outcome; the user confirmed it belongs to the spec.

### Web parity

- **R57** Every existing web composer spec (`MessageBox`, `createComposerAPI`, `wrapSelection`, `messageBoxHelpers`, `useDraft`, `composerState`, `sendMessage`, `uploads` and the others in the same folders) passes with no edit to any spec file. O19
- **R58** The web client's composer e2e passes. O19
- **R59** Each extraction of shared code is its own commit below the feature, edits no spec file, and the web composer specs pass at that commit. O19

## Interfaces

No code here. The seam is the existing `ComposerAPI` type in `apps/meteor/client/lib/chats/ChatAPI.ts`; this spec adds a native implementation of it and does not add members.

State: `{ text: string, selection: { start: number, end: number } }`. The controlled `selection` prop is the only way the composer places the caret. `ref.setSelection` is not used for edits. The composer writes the intended selection itself after every programmatic edit, because native does not report it back.

`ComposerAPI` members and how native supplies them:

- State and edits, over React state: `text`, `selection`, `setText`, `insertText`, `insertNewLine`, `replaceText`, `substring`, `clear`, `wrapSelection`, `getCursorPosition`, `setCursorToEnd`, `setCursorToStart`, `focus`, `blur`, `release`.
- Subscribables, native twin of the state half of `createComposerAPICore`: `quotedMessages`, `editing`, `formatters`, `uploads`; `replyWith`, `quoteMessage`, `dismissQuotedMessage`, `dismissAllQuotedMessages`, `setEditingMode`.
- `recording`, `isMicrophoneDenied`, `setRecordingMode`, `recordingVideo`, `setRecordingVideo`: inert constants (recording is deferred).
- `composerRef: RefObject<HTMLElement | null>`: stays in the neutral type as an inert ref on native; the native implementation never reads it and no DOM member is added to the type (settled 2026-11-26).

Pure and shared with web (moved only by extraction commits, R59): `wrapSelection.ts`, `messageBoxHelpers.ts` (both in `views/room/composer/messageBox/`), `lib/messageBoxFormatting.ts`, `views/room/composer/lib/composerState.ts` (already pure), the pure part of `views/room/composer/hooks/useComposerBoxPopup.ts`, and the state half of `lib/createComposerAPICore.ts`.

Native twins and new files (names to be fixed by the plan): the native `ComposerAPI` implementation, composer view and view-model hook in `apps/expo-lab/src`; `useDraftStorage` with a `.native.ts` over AsyncStorage in `packages/ui-client` (D9); a file-picker hook in `packages/ui-client` with a `.native.ts` sibling, only with this consumer (D4); the audio-recorder hook waits for the audio spec.

Existing files that change (web-visible, so R57 to R59 apply): `views/room/composer/messageBox/hooks/useDraft.ts` (read and write local storage through `useDraftStorage`); `lib/chats/flows/uploadFiles.ts` and `lib/chats/uploads.ts` (`File[]` becomes a type that also accepts a picked `{uri, name, type}`; its own commit inside the POC, extracted as a pull request when the POC settles; D8); the files of the extractions above.

Called as they are: `chat.flows.sendMessage` (ends in `/v1/chat.sendMessage`), `processMessageEditing`, `processSlashCommand` (`/v1/commands.run`), `processTooLongMessage`, `UserAction` (`sdk.publish('notify-room', [key, ...])` through the web `SDKClient` wrapper, `apps/meteor/client/lib/UserAction.ts:43`; native cannot import it as is, since the web wrapper is `apps/meteor/client/lib/SDKClient.ts:305` and native has the raw `DDPSDK`). Whether these evaluate under Metro without Meteor is intent risk 2 and is not yet probed.

## Platform notes

- iOS (iPhone 17 Pro simulator, iOS 26.5, React Native 0.88.1, New Architecture): the lab proved controlled text, a non-empty controlled selection in both write orders, the wrap arithmetic, UTF-16 offsets and min/max height. Not proved: caret position after an edit, anything under real typing.
- Android: not run. A different native component and event counting; the iOS result is not assumed to carry over. Nothing in this spec is accepted for Android until a lab run.
- IME, dictation, emoji keyboard, autocorrect effects: unverified. Code-read only: a controlled value that always echoes the native text is safe; any rewrite during composition ends it (R55).
- `onPaste` does not exist and `onKeyPress` has no modifier flags (code-read, 0.88.1), hence the deferred list. A multiline field inserts a newline on Return by default and `onSubmitEditing` does not fire (code-read); The decision is that Return is detected through `onKeyPress` on the multiline field and sends only when `sendOnEnter` is on; the order of `onKeyPress` and the text change is untested (Q17), and R7 is worded to hold either way. Inferred, not observed: if the change arrives first, the send path removes the one line break at the caret; if the key arrives first, it sends the field text and ignores the newline the field then inserts.

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
| R7 | I | Specs for both orders of `onKeyPress` and change (U part), then keystroke injection of Return on the simulator; the real order is untested (Q17, probe P3) |
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
| R18 | S | Blocked on c1. Trigger edit from the long-press actions menu, probe field text, screenshot hint |
| R19 | U | Spec: edit send calls `processMessageEditing`; cancel restores prior text |
| R20 | U | Blocked on c1. Same predicate web uses, specced with permission and age cases |
| R21 | I | Trigger detection from text and caret is a pure function (U); the visible list needs injected typing |
| R22 | U | Pure replace-range spec against the web insertion text; lab row 4 for the native text |
| R23 | I | Caret is not observable by the lab (blinks); injected typing then a second keystroke shows where it lands |
| R24 | U | Same spec for channels |
| R25 | U | Pure trigger-detection spec |
| R26 | S | Probe P1: `commands.list` against a live server, compared with the names in this spec's command table; screenshot of the popup. Filter, sort and limit are also a U spec |
| R27 | U | Spec that the native path calls the same `processSlashCommand` and never sends a `clientOnly` command to `commands.run`; ephemeral reply by S on a dev server |
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
| R43 | S | Scripted leave and return, probe text |
| R44 | S | Scripted app kill and relaunch, probe text |
| R45 | U | `useDraftStorage` and `useDraft` specs: both stores empty after send and clear |
| R46 | U | `useDraft` spec with both values present (existing case, extended for native storage) |
| R47 | U | Storage-key spec |
| R48 | S | Probe P2: two clients on a dev server, one publishes `notify-room` `<rid>/user-activity` through `DDPSDK.publish`, the other receives it. `publish` exists in code; acceptance by the server is unproven |
| R49 | S | Same, second client shows the indicator |
| R50 | U | `composerState.spec.ts` for the decision, native view spec per kind |
| R51 | U | Spec that the native view calls the shared function; import check |
| R52 | U | Spec of the encrypted predicate and the disabled view with its reason |
| R53 | U | Spec of both kinds (`omnichannel`, `federation` with `blocked` true and false) and the view |
| R54 | R | Real device, real keyboard, dictation |
| R55 | R | Real device with a Japanese or Korean IME, popup open while composing; a value-echo spec (U) guards the code path only |
| R56 | S | Accessibility tree dump on the simulator lists a name and role per control |
| R57 | E | `yarn .testunit:jest` on the composer folders, run unedited, at every commit |
| R58 | E | The web composer Playwright specs |
| R59 | U | `git diff --stat` of each extraction commit shows no spec file |

Summary of 55 active requirements (R39 to R42 are deferred and have no row): 30 U, 14 S, 7 I, 2 R, 2 E. Class I (keystroke injection at least): R7, R8, R21, R23, R31, R32, R33. Class R (only real typing or a device): R54, R55. R18 (S) and R20 (U) are counted but blocked on c1.

Before and after this revision: 59 requirements with 30 U, 15 S, 7 I, 5 R, 2 E became 55 active with 30 U, 14 S, 7 I, 2 R, 2 E; the four removed rows were R39 to R41 (R) and R42 (S).

## Out of scope

Everything in the deferred list above, and: changes to any endpoint or message schema, the Fuselage Box decision (the user decided Box props are translated in the native host map, step x1, still to be implemented; this spec composes on layout containers and Tamagui frames until then), an Android lab run, the plan itself.

## Slash command coverage (code-read on this tree, not yet run against a server)

Everything here is read from source on this tree; nothing was run.

- Endpoint: `GET /v1/commands.list`, `apps/meteor/server/api/v1/commands.ts:131-175`, auth required, query `offset`, `count`, `sort` (default sort `{ name: 1 }`). Answers `202` with `appsLoaded: false` and an empty list while Apps are not loaded (`:144-155`), so the client must retry; `useAppSlashCommands.ts:63-65` throws and retries for this. Returns `{ commands, appsLoaded, offset, count, total }`, paged, `total` read before paging (`:161-165`).
- What it returns: every entry of the server's `slashCommands.commands` registry (`apps/meteor/server/lib/utils/slashCommand.ts:31-60`), typed as `SlashCommand` (`packages/core-typings/src/SlashCommands/index.ts:48-60`): `command`, `params`, `description`, `permission` (string or array), `clientOnly`, `providesPreview`, `appId`. Functions (`callback`, `previewer`, `previewCallback`, `result`) cannot be serialized. Inferred: `permission` is in the payload because web reads it from this same response (`apps/meteor/client/hooks/useAppSlashCommands.ts:91`). Descriptions and params are i18n keys, not text (`ComposerPopupProvider.tsx:339-340` translates them if the key exists).
- Not filtered by permission: the endpoint does no permission check on listing; the web popup does (`apps/meteor/client/views/room/providers/ComposerPopupProvider.tsx:357`, `hasAtLeastOnePermission(command.permission, rid)`). `commands.get` (`commands.ts:73-130`) returns one command without `permission`; not used for the list.
- Server registry, from `server/importPackages.ts:55-71` and the files listed: `archive`, `unarchive`, `ban`, `unban`, `create`, `help`, `hide`, `invite`, `invite-all-to`, `invite-all-from`, `join`, `kick`, `leave`, `part`, `me`, `msg`, `mute`, `unmute`, `status`, `topic`, plus `lennyface`, `tableflip`, `unflip`, `gimme`, `shrug` (all five `clientOnly: true`, in `server/slashcommands/asciiarts/`), `sendEmailAttachment` (`server/features/EmailInbox/EmailInbox_Outgoing.ts:107`), `slackbridge-import` (`server/bridges/slack/slackbridge_import.server.ts:83`), `xmpp-join` (`ee/server/startup/federation.ts:82`, inside a startup function), and commands registered by Apps (`server/modules/apps/bridges/commands.ts`). Whether the last four are present depends on settings and licenses on the live server: unverified.
- Web client registry: the 19 files of `apps/meteor/client/startup/slashCommands/` (`index.ts`) registered at startup, with callbacks, then merged with the list through `useAppSlashCommands` (mounted at `apps/meteor/client/providers/ActionManagerProvider.tsx:20`); `slashCommands.add` keeps the first registration (`client/lib/slashCommand.ts:37-39`), so the client's callbacks win over the list's entries. The popup reads this registry only (`ComposerPopupProvider.tsx:335`).
- Client-only: `open` (`client/startup/slashCommands/open.ts:9`) has a client callback and no server registration, so `commands.list` does not return it; it navigates through the web router and is not offered on native. The five asciiart commands are `clientOnly: true`: web runs the client callback and never calls `commands.run` (`client/lib/chats/flows/processSlashCommand.ts:73-77`); the list returns them, but native has no callback for them, so R26 says to omit them unless native supplies their text.
- Only on the server, so native gets them from the list and web gets them from the same list: `me`, `msg`, `mute`, `unmute`, `leave`, `part`, `help`, `sendEmailAttachment`, and Apps commands. Registered on both sides: `archive`, `unarchive`, `ban`, `unban`, `create`, `hide`, `invite`, `invite-all-to`, `invite-all-from`, `join`, `kick`, `status`, `topic`, `slackbridge-import`, `xmpp-join`.
- Popup behaviour to match (`ComposerPopupProvider.tsx:327-363`): trigger `/`, `triggerAnywhere: false`, suffix a space, `disabled` when `encrypted`, substring match on the name (`indexOf(filter) > -1`), permission check, sorted by name, first 11.
- Previews: the list carries `providesPreview` only. No built-in command sets it (`providesPreview: true` appears in source only in a web spec, `useAppSlashCommands.spec.ts:25`); Apps may. Out of scope, as in the deferred list.
- Unverified against a live server: that the list returns `permission` for each entry as inferred; that the five `clientOnly` entries come back; that `xmpp-join`, `slackbridge-import` and `sendEmailAttachment` show up; that the 202 retry path ends. Probe P1.

## Typing publish (code-read on this tree)

- `sdk.publish` exists on the native SDK: `DDPSDK.publish(name, key, ...args)` at `packages/ddp-client/src/DDPSDK.ts:113-118`, which calls `client.callAsync('stream-<name>', key, ...args)`. Expo-lab's session `sdk` is a `DDPSDK` (`apps/expo-lab/src/session.ts:1`, `:8`).
- Signature differs from the web wrapper: `apps/meteor/client/lib/SDKClient.ts:305-310` takes `publish(name, args: unknown[])` and spreads `args`, swallowing errors with a warning. `UserAction` calls the wrapper (`apps/meteor/client/lib/UserAction.ts:43`): `sdk.publish('notify-room', [`${rid}/user-activity`, shownName(user), [...activities], extras])`. Native cannot reuse `UserAction` unchanged; it needs the wrapper's shape over `DDPSDK.publish('notify-room', `${rid}/user-activity`, name, activities, extras)`.
- Stream and event: stream `notify-room`, key `<rid>/user-activity`, args `[username, activities[]]` plus `extras` (`packages/ddp-client/src/types/streams.ts:46-48`; the typed args omit `extras`, which web sends). Activities include `user-typing` (`UserAction.ts:15-20`). A legacy key `<rid>/typing` with `[username, boolean]` exists in the types (`streams.ts:48`); web does not send it from `UserAction`. Timing: 15 s timeout, renewed every 5 s, publish debounced 500 ms (`UserAction.ts:10-11`, `:41-43`).
- Receiving: `sdk.stream('notify-room', [`${rid}/user-activity`], handler)` (`UserAction.ts:87`); `DDPSDK.stream` takes `(name, key | [key, args], cb)` (`DDPSDK.ts:123-129`), a different shape from the web call, so native supplies it.
- Not settled from code: whether the server accepts a client publish on `notify-room` for this user and room (the allow-write rule lives in the streamer code, which I did not locate on this tree), and whether another client receives it. Probe P2.

## Settled on 2026-11-26

The user took the recommended option for each.

- Q2 plain text mentions: plain text with ranges, no chips (R22, R23, R31, R32); caret after insertion stays unverified.
- Q3 emoji: bottom sheet behind `EmojiPickerContext`, inserting at the caret, unicode only, custom `:name:` emoji deferred (R33, R34).
- Q6 slash commands: list from the server, probe first (R26, R27; "Slash command coverage" above; probe P1).
- Q7 audio: deferred to a later spec, audio only, no video (R39 to R42 moved to Deferred).
- Q8 encrypted rooms: disabled state with the reason "this room requires encryption, unavailable in this app"; no native E2EE (R52).
- Q9 edit: started from the long-press actions menu; R18 and R20 are blocked on the message toolbar step c1.
- Q12 styling: layout containers and Tamagui frames until the Box decision lands (the user decided Box props are translated in the native host map, x1, still to be implemented).
- Q13 typing: in the first milestone (R48, R49); `DDPSDK.publish` exists, server acceptance is probe P2.
- Q14 image paste: out of scope.
- Q16 omnichannel and federation: disabled state with a reason, never an attempt to write (R50, R53; outcome 16 in the intent).
- Q17 Return: decided; Return is detected through `onKeyPress` on the multiline field and sends only when `sendOnEnter` is on. The order of `onKeyPress` and the text change stays an open probe (P3); R7 is worded to hold either way.
- Q18 `composerRef`: stays in the neutral type as an inert ref on native, never read; no DOM member added.
- R56 belongs to the spec; the 52 to 155 px bounds are the starting point for touch, to be measured later (R3).
- Intent text fixed: D8 says the `File[]` change is a commit inside the POC, extracted when the POC settles; outcome 4 says "message list".

## Open questions

- **Q15 IME and popups.** Blocks R54, R55. Recommendation: popups never rewrite the value during composition; needs a real-device check before the spec is accepted.
- **Q17 Return order (probe P3).** Open only as a measurement: whether `onKeyPress` reports `Enter` before or after the field inserts its newline. R7's wording does not depend on the answer; the implementation does. Needs real key injection.
- **Android.** No decision yet whether the first spec covers Android; nothing here is proven there.
- **Probes P1 and P2** (below, under Readiness) are measurements, not choices.

## Readiness

Ready to be planned: the plan is the next document ([COMPOSER-PLAN.md](COMPOSER-PLAN.md)). Every requirement is one observable statement with an outcome, an interface and a proof class; the user signed the spec on 2026-11-26 (see Sign-off). Nothing is implemented yet.

Requirements blocked by an open gate. They are planned, but cannot be accepted until the gate is closed:

| Gate | Needs | Requirements |
| --- | --- | --- |
| P1 `commands.list` payload | a live server and the user's session | R26, R27 |
| P2 client publish on `notify-room` | a live server, two clients | R48, R49 |
| P3 `onKeyPress` order under a real Return | idb or XCUITest (the user is updating the Command Line Tools to install idb) | R7, R8 (the implementation choice; R7's wording holds either way) |
| Q15 real-device IME check | a real device | R54, R55 |
| Android decision | the user | every requirement, for Android only |
| Message toolbar step c1 | the toolbar step landing | R18, R20 |
| Q2 caret after insertion | injected typing (class I proofs) | R23, R31, R32 |
