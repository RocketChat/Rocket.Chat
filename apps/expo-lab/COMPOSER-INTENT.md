# Intent: Write and send messages from the Expo app

Author: Guilherme Gazzo (decisions); drafted by an agent. Status: draft. Nothing here is a spec: the numbered list below seeds the spec's requirement list, and every choice under "Open gaps" is an agent's until a person confirms it.

This follows the section style of `ee/packages/xmpp-server/docs/templates/intent.md` (title, author and status line, problem, proposed outcome, constraints, numbered open questions) with the sections `docs/change-organization.md` asks for (what, why, out of scope, decisions, gaps). Deviations: "Problem" is split into "What" and "Why now"; "Open questions" is called "Open gaps" and keeps the `Q1`, `Q2` numbering, never renumbered; "Affected users and systems" is folded into "What"; the outcomes list is new and is the only numbered requirement-like list (no `R1`: that is the spec).

## What

The Expo app (`apps/expo-lab`) can show a room's messages but cannot write one. This intent is for a composer in that app: a person in a room can write a message in a field that grows, send it with a button, edit and reply, mention people and channels, use slash commands, format text, attach a file or photo, record audio, pick an emoji and keep a draft per room. For the same input it does what the web composer does: same message payload, same markup, same permissions and the same disabled states (read-only room, blocked, archived, no permission, e2e).

## Why now

The Expo chat prototype plan has the room list, the room screen and the message rendering (steps A1 to A4 of the checklist). Sending is the next thing a person tries and the largest unknown: the web composer is 78 files in `apps/meteor/client/views/room/composer` that read the DOM (selection, `execCommand`, clipboard, `localStorage`, `MediaRecorder`) and `packages/ui-composer` is Fuselage-`Box` based. The isolation plan keeps `createComposerAPI` web-only in phase 1 and no one owns the composer. The measured gap is in `NATIVE-MESSAGE-COMPOSER-GAP.md`, sections 6 to 9; this intent turns it into something a person can accept or change before a spec.

## Out of scope

- Voice calls and anything under `ComposerOmnichannel` (the isolation plan's RN scope is everything except omnichannel).
- The thread composer beyond what the room composer already shares (`tmid`, "also send to channel" are not part of this intent).
- UiKit blocks and app (Marketplace) message-box action buttons.
- Rendering messages (done in earlier steps) and the message list.
- Anything outside the composer: room header, sidebar, user card, settings screens.
- Federation-specific composer states beyond showing the same disabled state web shows.
- End-to-end encrypted rooms: sending and decrypting (see Q8).

## Stays web-only on purpose

- The rich-text composer (`RichTextMessageBox`, a `contentEditable` span behind the `realtimeMessageComposer` feature preview): it is built on DOM `Range` and cannot be ported. Native always uses the plain-text model.
- Drag and drop of files (`useFileUploadDropTarget`): no touch equivalent.
- Global and formatting keyboard shortcuts (`handleFormattingShortcut`, cmd/ctrl+key) and ArrowUp/ArrowDown at the field's edges to walk previous messages: React Native's `TextInput` reports keys without modifiers. Native gets buttons for the same actions.
- Paste handling of HTML and the `beforeinput` "wrap the selection when typing a markup character" behavior.
- The web `createComposerAPI`/`createComposerAPICore` implementations (they take an `HTMLElement`, dispatch `input` events and call `document.execCommand('insertText')`). The `ComposerAPI` type stays; native gets its own implementation of it (see Constraints).

## Observable outcomes

Each is testable by watching the app or by a test. "Same as web" means: given the same text, selection and state, the same message payload goes to `chat.sendMessage` (and the same call for edit, slash command and upload).

1. In a room where the person may write, a text field is shown at the bottom of the room screen; typing shows the text, and the keyboard never covers the field.
2. The field grows with its content up to a maximum height (web: 52 to 155 px, to be confirmed for touch) and scrolls inside past it; it shrinks back when the text is cleared.
3. A send button sends the text; the return key inserts a new line by default on touch. An empty or whitespace-only message sends nothing.
4. A sent message appears in the room list immediately, in the same optimistic state web shows, and is confirmed or marked failed when the server answers. The text sent is trimmed and an unclosed code fence is closed, as on web.
5. The message sent for a given text has the same fields as web sends (`rid`, `msg`, `_id`, quoted message attachments, `tshow` absent) and the server derives the same `md` markup for it; no client-side markup is sent that web does not send.
6. A draft is kept per room: leaving a room and coming back, or restarting the app, restores the unsent text; sending or clearing removes it. If the server holds a draft for the room, it wins over a local one, as on web.
7. Replying to a message puts a quote of it above the field with a dismiss control; sending includes the quote exactly as web does, and dismissing removes it without sending.
8. Editing one's own message (from the message actions, since there is no ArrowUp) puts its text in the field with an "editing" hint and a cancel control; sending updates the message through the same call web uses; cancel restores the field.
9. Typing `@` or `#` shows a list of matching people (and, for `@`, the room-wide mentions web offers) or channels above the field, filtered as the person types; choosing one inserts the same text web inserts (`@username `, `#channel `).
10. Typing `/` at the start of the message shows the commands the person may run; choosing one inserts it, and sending it runs it through the same slash-command path as web, including the "command not recognized" ephemeral reply. Commands are not offered in an e2e room that disallows them, as on web.
11. Typing `:` and two characters offers emoji; choosing one inserts `:shortcode:`. An emoji button opens a picker (a sheet) and inserts the chosen emoji at the caret.
12. Formatting buttons (bold, italic, strike, inline code, code block, link) wrap the selection with the same markup web uses; with no selection they insert the empty pattern with the caret inside. The selection after the action is where web leaves it.
13. A person can attach one or more files or photos from the device; each shows in the composer with a way to remove it; sending uploads them with the same server call and the same file limits and error toasts as web, then clears the composer.
14. A person can record an audio message, see that recording is in progress, cancel it, or send it; it arrives as the same kind of audio attachment web sends.
15. A person can see who else is typing in the room, and others see this person typing while they type; typing stops being reported after sending or clearing.
16. Where web shows no field, native shows the same replacement and no field: read-only room (without the post permission), blocked or blocker, archived, anonymous, must join with a password, ABAC locked, air-gapped restricted, selecting messages. The state is decided by the same pure function (`resolveComposerState`) for both.
17. A message longer than the server's limit is handled as web handles it (the same "too long" flow), not truncated or dropped.
18. Autocorrect, dictation, the platform emoji keyboard and IME composition work in the field, and composing text is not corrupted by the popup lists above it.
19. The web composer behaves exactly as before: its existing specs pass unedited and the web client's composer e2e still passes.

## Non-goals

- Pixel parity with web. The same behavior and tokens, not the same chrome.
- Offline queueing of unsent messages beyond the optimistic state web has.
- A second message pipeline. Sending, editing, slash commands and uploads reuse the web flows' logic, not a native rewrite of them.
- Changing any server endpoint or message schema.
- Rich-text editing or live markup preview in the field.

## Constraints

- Isolation rules (`docs/frontend/view-isolation.md`): no Meteor and no direct browser API (`document`, `window`, `navigator`, `localStorage`, `ResizeObserver`, `MediaRecorder`) in views; capability hooks (file picking, device permissions, draft storage) live in `packages/ui-client` and get a sibling `.native.ts` only together with the native consumer that needs it; web-only widgets sit behind app components.
- One neutral seam: the existing `ComposerAPI` type (`apps/meteor/client/lib/chats/ChatAPI.ts`) is the contract between the composer views, the formatting and popup logic, and the flows. Native implements that type; the type does not grow DOM members. If it needs to change, that is a web-visible change and a person decides it.
- Web unchanged and verified as unchanged: no behavior edit to web files; any extraction (pure string operations, `useComposerBoxPopup` pure part, view-model split) is its own refactor commit with existing specs green and unedited, below the feature (`docs/change-organization.md`). The isolation plan phase 1 states `createComposerAPI` stays web-only; this intent does not change that, it adds a twin.
- Behavior is judged against the web composer on the tree this branch builds from, and re-checked against `origin/message-list/09-thread-list-and-cleanup` before the spec is accepted, because that branch changes the composer (see "Web facts that matter").
- Payloads, permissions and disabled states come from the server and the shared pure logic, never re-implemented in the app.
- English in the repo; strings through the i18n rules in `docs/i18n.md`, with no new keys that duplicate existing ones.
- No push, no pull request, no leaving draft without a person (CLAUDE.md).

## Web facts that matter (re-verified in code)

- `ComposerAPI` is a neutral type (text, selection, `setText`, `insertText`, `replaceText`, `wrapSelection`, `clear`, `focus`, quote and editing subscribables, `uploads`). The implementation is DOM: `createComposerAPI.ts` has four `document.execCommand('insertText')` calls with a string fallback.
- Which composer state to show is already a pure function: `composer/lib/composerState.ts` (`resolveComposerState`) behind `useComposerState`, with a spec. Both trees have it.
- Return key: the web code is `useUserPreference('sendOnEnter') || isMobile`, then `sendOnEnter` is true only for `normal` (or `desktop` when not mobile). On a mobile layout the first expression is `true`, so Enter inserts a new line and sending needs Shift/Ctrl/Alt/Meta+Enter or the button. The gap report's one-line paraphrase of this is looser than the code.
- Sending goes through `chat.flows.sendMessage` and ends in `sdk.rest.post('/v1/chat.sendMessage', { message, previewUrls })`; the client builds the message (`composeMessage`) and never sends `md`; the server parses.
- Slash commands read the client registry `slashCommands.commands`; whether a native client can list the same commands from the server was not checked.
- Drafts: `useDraft.ts` uses `localStorage` plus a server-side draft (`saveDraft`, subscription draft); the server half is neutral.
- Uploads: `uploadFiles` takes `File[]`, applies the file-count and e2e checks, and `uploads.ts` sends by XHR. React Native files are `{uri, name, type}`.
- On `origin/message-list/09-thread-list-and-cleanup` the composer changed in 47 files (mostly Fuselage import paths, a timestamp picker, `useComposerActions`, `editingMessageSubscription`, a `ChatAPI.ts` +2 lines); none of it removes the DOM dependency of the implementation.

## Decisions already taken

Taken by the user or by the isolation plan, not by an agent:

- D1. React Native scope is everything except omnichannel (isolation plan, view-isolation decisions).
- D2. The composer's native client does not include omnichannel.
- D3. The seam is the neutral `ComposerAPI` type; the web implementation stays web-only and unchanged (isolation plan phase 1).
- D4. Hooks that touch the browser move to `ui-client` and get a `.native.ts` sibling only when a native consumer exists; expo-lab is that consumer.
- D5. Web stays as it is, and is verified as unchanged.
- D6. Work starts from this written intent, then a spec, then a plan (spec-first, as the XMPP package does); opening a pull request and leaving draft are a person's decisions.

## Open gaps

Every item is an agent's choice or a thing the agent does not know. Each has a recommendation and a question for a person.

- **Q1 Return key on touch.** Recommendation: Enter inserts a new line, the button sends, with no preference toggle; this is what web does on a mobile layout (see facts). Question: is "no way to send with return on a phone, even for a person who set `sendOnEnter`" acceptable, or should the preference be honored on native too?
- **Q2 Mentions model.** Recommendation: plain text with the same `@username ` text web inserts, found again by trigger detection from text and caret; no custom text model, no styled chips in the field. Question: is unstyled text in the field acceptable, given the server resolves mentions from the text?
- **Q3 Emoji picker.** Recommendation: a bottom sheet with a grid behind the existing `EmojiPickerContext` seam; `:shortcode:` autocomplete uses the same list web does. Question: sheet or inline panel above the keyboard? Is custom emoji (server-uploaded) in scope for the first spec?
- **Q4 Upload call.** Recommendation: the same `sdk.rest.upload` call and the same limits as web, fed by an adapter from picked `{uri, name, type}` to a form part, with the flow's `File` input replaced by a small interface. Question: is changing the flow's parameter type (a web-visible refactor commit) acceptable, or should native keep its own thin upload path?
- **Q5 Draft storage on native.** Recommendation: a `useDraftStorage` hook in `ui-client` with a `.native.ts` over AsyncStorage (a new dependency in expo-lab), plus the server draft as on web. Question: add AsyncStorage, or is the server draft alone enough for the first spec?
- **Q6 Slash command list.** Recommendation: fetch the permitted commands from the server rather than port the client registry. Not verified that an endpoint returns what the popup needs. Question: who confirms the endpoint, and is a command with a preview (`ComposerBoxPopupPreview`) in scope?
- **Q7 Recording.** Recommendation: audio only in the first spec; video message and location later. Question: is audio required for the first milestone or can the first spec stop at text, attach, and emoji?
- **Q8 E2E rooms.** Recommendation: in a room with `encrypted` set where unencrypted messages are not allowed, show a disabled state with a clear reason; no native E2EE. The web flow calls `onClientBeforeSendMessage` which encrypts. Question: confirm that encrypted rooms are read-only on native for now.
- **Q9 Edit entry point.** Recommendation: edit from the message actions (long press), since ArrowUp does not exist. Depends on the message toolbar (step 6 in the gap report) being present. Question: should the composer wait for it, or ship edit after it?
- **Q10 Pure extractions.** Recommendation: extract, as refactor commits below the feature, the pure string logic (`wrapSelection`, `messageBoxHelpers`) and the pure part of `useComposerBoxPopup`, so web and native share them; split `createComposerAPICore` into a state part (quote, editing, uploads subscribables) and a DOM part. Question: do the extractions go to `develop` as their own pull requests first, or stay as commits in the feature? They touch web files, so D5 applies.
- **Q11 Ownership and PR split.** Recommendation: one owner for the spec and one for the plan; intent, spec and plan land as docs first; code split as (a) pure extractions, (b) capability hooks in `ui-client`, (c) native composer in expo-lab, (d) popups, (e) formatting, (f) attach and record. Question: who owns the spec, and is this split right?
- **Q12 Styling props.** Recommendation: build the native composer on layout containers and Tamagui frames, not on `ui-composer`'s Box-based parts, until the Fuselage Box decision lands. Question: wait for the Fuselage owner or proceed with local frames?
- **Q13 Typing indicator.** Recommendation: include; it uses `sdk.publish` on `notify-room`. Not exercised in expo-lab; the native `sdk` may not support publish. Question: is it required in the first milestone?
- **Q14 Image paste.** Recommendation: leave out; text paste works through the field. Question: is pasting an image into the field expected?

## What would make this intent wrong

1. The native `sdk` cannot do what the flows need (`publish` for typing, `rest.upload` with a URI-based file, slash command listing): the outcomes about typing, upload and commands would move out of the first spec. Check first with a one-call probe of each against a dev server.
2. The web flows are not reusable from a React Native bundle without Meteor, `SDKClient` or `File`: if `chat.flows.sendMessage` imports an app singleton that cannot evaluate under Metro, "same payload" would need a shared extraction first, which changes the PR split and web-visible code.
3. A controlled `TextInput` cannot hold selection and programmatic edits reliably on iOS and Android (wrap selection, mention replace): outcomes 9 and 12 would need a different input model. Check first with a small prototype on both platforms.
4. The people who asked for "the same as web" mean visible parity including features this intent leaves web-only (shortcuts, rich text, drag and drop): the non-goals list would be too narrow.
5. The composer's disabled states are not all decidable from data the native app already loads (blocked, ABAC, air-gapped, permissions): outcome 16 would need more room and subscription data than the room screen fetches today.
