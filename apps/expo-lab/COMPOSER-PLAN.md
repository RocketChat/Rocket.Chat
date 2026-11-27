# Plan: Native message composer (from COMPOSER-SPEC.md, 2026-11-26)

Status: approved by the user's sign-off on the spec; the plan itself awaits review. The plan never opens a pull request or takes one out of draft: both are a person's decision (CLAUDE.md, `docs/change-organization.md`).
Spec: [COMPOSER-SPEC.md](COMPOSER-SPEC.md), 55 active requirements (R39 to R42 deferred). Intent: [COMPOSER-INTENT.md](COMPOSER-INTENT.md). Format follows `ee/packages/xmpp-server/docs/templates/plan.md`: files that change, one-commit steps, risks, Proof table.

## How the work is organized

One POC draft pull request accumulates ordered commits. Fixes and enabling refactors are their own commits ordered below the feature: phase 1 (web refactors) first, then the native feature. Extractions stay commits in the POC; which of them become their own pull requests, merged first, is planned before leaving draft (a person decides). Agent loops are fine for the pure and unit steps; a step is done when its Proof holds.

The draft body carries the definition (what: native composer for a room in the Expo app; why: intent O1 to O19; out of scope: the spec's deferred list), the decisions a person made (spec "Settled on 2026-11-26", D1 to D10) and the gaps (below, "Open items"). Choices this plan makes on its own are marked "(gap)" until the user confirms them.

Every commit message is conventional, with no tool attribution. Rule for every phase 1 commit: `git diff --stat` shows no existing `*.spec.*` file edited (new spec files are allowed), the web specs of the touched folders pass unedited (R57, R59), web behavior is byte-identical.

Checks used throughout: `cd apps/meteor && yarn .testunit:jest <paths>` (plain `yarn jest` fails); `tsc --noEmit` for `apps/meteor` re-run after the last edit, specs included (jest does not typecheck); `tsc --noEmit` for `apps/expo-lab`; the Playwright specs `apps/meteor/tests/e2e/message-composer.spec.ts`, `message-composer-history.spec.ts`, `message-mentions.spec.ts`, `quote-messages.spec.ts` (local machine only).

## Files that change

Web, phase 1 (all web-visible, R57 to R59 apply), under `apps/meteor/client/` unless noted:

- `views/room/composer/messageBox/createComposerAPI.ts`: the `wrapSelection` arithmetic (lines 68 to 123) is DOM-bound; its pure core moves out. Spec gap: the spec lists `wrapSelection.ts` as pure, but that file holds the DOM event handlers (`handleSelectionWrapping`); the pure part is in this file.
- `views/room/composer/messageBox/wrapSelectionText.ts`: new, pure `(text, selection, pattern) => { text, selection }`, plus a new spec beside it.
- `views/room/composer/hooks/useComposerBoxPopup.ts`: the trigger selector built in both `select` and `setOptionByInput` moves out.
- `views/room/composer/hooks/composerPopupTrigger.ts`: new, pure trigger match and replace range, plus a new spec.
- `lib/createComposerAPICore.ts`: split into a state part (quoted messages, editing, formatters, uploads, recording flags, emitter) and a DOM part (`input`, `focus`, `blur`, `insertText` through `setText`).
- `lib/composerStateCore.ts`: new, the state part, no `HTMLElement` in its signature.
- `views/room/composer/messageBox/hooks/useDraft.ts`: reads and writes `localStorage` directly (lines 11, 13, 19); goes through `useDraftStorage`.
- `packages/ui-client/src/hooks/useDraftStorage.ts` and `packages/ui-client/src/hooks/index.ts`: new hook, web implementation over `localStorage`.
- `lib/chats/flows/uploadFiles.ts`, `lib/chats/uploads.ts`: `readonly File[]` becomes `readonly UploadableFile[]` (`File` or `{ uri, name, type }`).

Native, phases 2 to 4 (new unless stated): `apps/expo-lab/src/composer/` (`createNativeComposerAPI.ts`, `useNativeComposer.ts`, `MessageBox.tsx`, `ComposerView.tsx`, `ComposerDisabled.tsx`, `useNativeTyping.ts`, `useMentionPopup.tsx`, `useSlashCommands.ts`, `FormattingBar.tsx`, `EmojiSheet.tsx`, `useAttachments.ts`, with `*.spec.ts` beside them); `packages/ui-client/src/hooks/useDraftStorage.native.ts`; `packages/ui-client/src/hooks/useFilePicker.ts` and `.native.ts` (only with this consumer, D4); `apps/expo-lab/src/Room.tsx` (changes: mounts the composer); `apps/expo-lab/package.json` (changes: AsyncStorage, file and photo picker, sheet, jest setup; none of these is a dependency today); `apps/expo-lab/metro.config.js` (changes only if step 2.1 needs it); `docs/features/native-composer.md` (new, step 4.4, the feature note `docs/change-organization.md` asks for).

No server, schema, endpoint or README change.

## Dependency graph

```
0.4 baseline --> 1.1, 1.2, 1.3, 1.4, 1.5 --> 2.1 --> 2.2 --> 2.3 --> 2.4 --> 2.5 --> 2.6 --> 3.1 (also needs c1)
1.1 --> 2.12            1.2 --> 2.10 --> 2.11 --> 2.13        1.3 --> 2.2
1.4 --> 2.7             1.5 --> 2.14                           2.5 --> 2.8 --> 2.15
2.5 --> 2.9 (acceptance needs P2)       P3 (idb) --> proofs of 2.4, 2.10, 2.12, 2.13 (class I)
Phase 4 needs everything before it; 4.4 blocks leaving draft
```

Hard blocks: 1.1 blocks 2.12; 1.2 blocks 2.10 and 2.11; 1.3 blocks 2.2; 1.4 blocks 2.7; 1.5 blocks 2.14; 2.1 blocks all of phase 2; c1 blocks 3.1. P1 blocks the acceptance (not the code) of 2.11, P2 that of 2.9, P3 that of every class I proof.

## What can run today without idb or a server

- 0.4: baseline run of the web composer specs and the type check.
- All of phase 1 (jest and tsc; the Playwright specs need a local Meteor server and run on the person's machine).
- 2.1 to 2.6, 2.8, 2.12 (text part), 2.13 (data and insert part), 2.15: unit specs plus scripted simulator observations (classes U and S).
- 2.7 and 2.14: code and unit specs; their S proofs wait for a dev client rebuild.
- Waiting: P1 (live server, the user's session), P2 (two sessions), P3 and every class I proof (idb), 3.1 (c1), 4.1 (a device).

## Phase 0: pre-conditions and probes

No source change. Each probe records its result in the spec as a docs commit, so the gate closes in writing. No credentials in the repo or in any commit: sessions come from the user's own login.

### 0.1 Probe P1, `commands.list`
- Commit: `docs(expo-lab): record the live commands.list payload`. Files: `apps/expo-lab/COMPOSER-SPEC.md` (coverage section).
- Does: authenticated `GET /v1/commands.list` (all pages) on a dev server; record names, `permission` per entry, the five `clientOnly` entries, `xmpp-join`, `slackbridge-import`, `sendEmailAttachment`, the 202 retry.
- Unlocked by: the user's go-ahead and session on a live server. Gate for: acceptance of R26, R27 (2.11). Rollback: removes the recorded result only.

### 0.2 Probe P2, client publish on `notify-room`
- Commit: `docs(expo-lab): record the notify-room publish probe`. Files: `COMPOSER-SPEC.md` (typing section).
- Does: two sessions in one room; one calls `DDPSDK.publish('notify-room', '<rid>/user-activity', name, ['user-typing'], {})`, the other subscribes through `DDPSDK.stream`.
- Unlocked by: the user's go-ahead, the user's session and a second one. Gate for: R48, R49 (2.9). Rollback: as 0.1.

### 0.3 Probe P3, `onKeyPress` order under a real Return
- Commit: `docs(expo-lab): record the Return key event order`. Files: `TEXTINPUT-FINDINGS.md` (new row), the spec's Q17.
- Does: with idb injecting a real Return in the lab field, log whether `onKeyPress` precedes the text change.
- Unlocked by: idb installed (the Command Line Tools update). Gate for: the order handling in 2.4 and every class I proof. Rollback: as 0.1.

### 0.4 Baseline
- No commit. Run the web composer specs (`views/room/composer`, `lib/chats`, `packages/ui-client`) and `tsc` on the tip; record the pass counts in the draft body. Phase 1 compares against it.

## Phase 1: enabling refactors on the web code

Each is its own commit, class refactor. Neutrality is proven by the existing web spec of that code, run unedited, plus a diff stat free of spec edits (R59). Rollback of each restores the previous inline code.

### 1.1 Pure wrap arithmetic
- Commit: `refactor(meteor): extract the pure wrap-selection arithmetic from the composer API`. Files: `createComposerAPI.ts`, `wrapSelectionText.ts` and spec (new).
- Neutral because: `createComposerAPI.spec.ts` and `wrapSelection.spec.ts` pass unedited; the new spec runs wrap, toggle off and empty selection against the numbers the DOM version produces.
- Risk: the DOM version writes `selectionStart` after `execCommand`; the pure result must reproduce those numbers.

### 1.2 Pure popup trigger logic
- Commit: `refactor(meteor): extract popup trigger matching from useComposerBoxPopup`. Files: `useComposerBoxPopup.ts`, `composerPopupTrigger.ts` and spec (new).
- Neutral because: `ComposerBoxPopup.spec.tsx` and `MessageBox.spec.tsx` pass unedited; Playwright `message-mentions.spec.ts` on the person's machine; the new spec covers `@`, `#`, `/`, `:` with `triggerAnywhere`, `triggerLength`, `matchSelectorRegex`.
- Risk: the regex is built in two places; one divergence changes the popup.

### 1.3 Split `createComposerAPICore`
- Commit: `refactor(meteor): split the composer API core into state and DOM parts`. Files: `lib/createComposerAPICore.ts`, `lib/composerStateCore.ts` (new).
- Neutral because: `createComposerAPI.spec.ts`, `sendMessage.spec.ts`, `MessageBox.spec.tsx` pass unedited; the exported function's signature and return keys are unchanged, which `tsc` proves.
- Risk: emitter ordering and the `focus` side effect of `quoteMessage`.

### 1.4 `useDraft` to `useDraftStorage`
- Commit: `refactor(ui-client): read and write drafts through useDraftStorage`. Files: `useDraft.ts`, `packages/ui-client/src/hooks/useDraftStorage.ts`, `hooks/index.ts`.
- Design (gap): the seam is synchronous (`get(): string | null`, `set(value?)`) because `useDraft` reads its initial value in `useState` on first render; the native twin keeps a memory map hydrated before the first room render (2.7).
- Neutral because: `useDraft.spec.tsx` (existing cases: server wins, clear) passes unedited; same key `messagebox_<rid>[-<tmid>]`, same `localStorage` calls.
- Risk: web-visible edit to a storage path.

### 1.5 `uploadFiles` signature
- Decision 2026-11-26 (the user): this step is NOT done in Phase 1. It moves into 2.14, once the native upload path is chosen (see "1.5 stopped" below). The text of this section is the original plan.
- Commit: `refactor(meteor): let uploads accept a picked file descriptor`. Files: `lib/chats/flows/uploadFiles.ts`, `lib/chats/uploads.ts`.
- Neutral because: type-only widening; `uploads.spec.ts` unedited; `tsc` shows no new error; web call sites still pass `File[]`.
- Risk: code reading `File`-only members on the widened type.

No other extraction: the spec's Interfaces list ends here. `lib/messageBoxFormatting.ts` and `composerState.ts` are already shared; 2.1 checks they resolve under Metro.

## Phase 2: native implementation

All in `apps/expo-lab` unless noted, above phase 1, web untouched. Rollback of each removes that step's new files and its `Room.tsx` mount line.

### 2.1 Shared modules under Metro (enabling)
- Commit: `chore(expo-lab): resolve the shared composer modules under Metro`. Files: `metro.config.js`, `package.json` (jest setup), only if needed; a throwaway import spec.
- Does: imports `composerState`, `messageBoxFormatting`, `chat.flows.sendMessage`, `processSlashCommand` and the new pure files without Meteor (intent risk 2). If a flow cannot load, record the gap; the affected step gets a native twin (a person decides).
- Reqs: none. Proof: the imports load in the lab.

### 2.2 Native ComposerAPI over `{ text, selection }`
- Commit: `feat(expo-lab): composer state and API over text and selection`. Files: `composer/createNativeComposerAPI.ts`, `useNativeComposer.ts`, specs.
- Does: the `ComposerAPI` members of the spec's Interfaces; state from `composerStateCore` (1.3); `selection` written only through the controlled prop after each edit; `composerRef` inert; recording members inert.
- Reqs: none directly; enables every later step. Proof: spec per member (`insertText`, `replaceText`, `clear`, `setCursorToEnd`, `substring`).

### 2.3 Native field
- Commit: `feat(expo-lab): multiline composer field with min and max height`. Files: `composer/MessageBox.tsx`, `ComposerView.tsx`, `Room.tsx`.
- Does: multiline `TextInput`, min and max height styles 52 and 155, no `onContentSizeChange`, keyboard avoidance, send button.
- Reqs: R1 to R4. Proof: simulator probe and screenshots with the lab rows (S).

### 2.4 Send and Return
- Commit: `feat(expo-lab): send from the button and the Return key`. Files: `useNativeComposer.ts`, `MessageBox.tsx`, specs.
- Does: the button always sends; Return through `onKeyPress` on the multiline field sends only when `sendOnEnter`; the send path strips the one line break at the caret in both event orders; trim and fence close by the shared function.
- Reqs: R5 to R9, R12. Proof: hook specs for both orders (U); injected Return (I) after 0.3. Risk: the real order is unknown until P3.

### 2.5 Send pipeline and payload parity
- Commit: `feat(expo-lab): send through the web message flow`. Files: `composer/useNativeComposer.ts`, spec fixtures.
- Does: calls `chat.flows.sendMessage`; optimistic message, failure state, "too long" branch.
- Reqs: R10, R11, R13, R14. Proof: store spec with a mocked server (U); one fixture through web `composeMessage` and the native path, deep-equal, including markup characters.

### 2.6 Reply
- Commit: `feat(expo-lab): reply with a quote above the field`. Files: `composer/MessageBox.tsx`, spec.
- Reqs: R15 to R17. Proof: screenshot (S); quote fixture and dismiss spec (U).

### 2.7 Drafts
- Commit: `feat(ui-client): persist drafts on native with AsyncStorage`. Files: `useDraftStorage.native.ts`, `apps/expo-lab/package.json`, `Room.tsx` (hydrates before the first room render).
- Does: memory map hydrated from AsyncStorage, write-through; the server draft wins as in `useDraft`.
- Reqs: R43 to R47. Proof: storage and `useDraft` specs (U); scripted leave and return, app kill and relaunch (S). Risk: native module, dev client rebuild.

### 2.8 Disabled states
- Commit: `feat(expo-lab): disabled composer states through resolveComposerState`. Files: `composer/ComposerDisabled.tsx`, `ComposerView.tsx`, spec.
- Reqs: R50 to R53. Proof: `composerState.spec.ts` plus a native view spec per kind (U); import check for R51.

### 2.9 Typing indicator
- Commit: `feat(expo-lab): publish and show the typing indicator`. Files: `composer/useNativeTyping.ts`, spec.
- Does: web `UserAction` timings (500 ms debounce, 5 s renew, 15 s timeout) over `DDPSDK.publish('notify-room', '<rid>/user-activity', ...)` and `DDPSDK.stream`.
- Reqs: R48, R49. Proof: P2 outcome plus two clients on a dev server (S).

### 2.10 Mentions and channels
- Commit: `feat(expo-lab): mention and channel autocomplete as plain text`. Files: `composer/useMentionPopup.tsx`, spec.
- Does: trigger match from 1.2; popup above the field; replaces the trigger text; caret through `selection`.
- Reqs: R21 to R25. Proof: pure specs (U); visible list and caret by injected typing (I).

### 2.11 Slash commands
- Commit: `feat(expo-lab): slash command list from commands.list`. Files: `composer/useSlashCommands.ts`, spec.
- Does: all pages, permission check, substring, sort, 11; `clientOnly` omitted; sends through `processSlashCommand`.
- Reqs: R26 to R28. Proof: P1 plus filter spec (S, U); no `clientOnly` to `commands.run` (U).

### 2.12 Formatting
- Commit: `feat(expo-lab): formatting buttons over the selection`. Files: `composer/FormattingBar.tsx`, spec.
- Reqs: R29 to R32. Proof: `wrapSelectionText.spec.ts` plus native state-through spec (U); caret after the action (I).

### 2.13 Emoji
- Commit: `feat(expo-lab): unicode emoji sheet and shortcode autocomplete`. Files: `composer/EmojiSheet.tsx`, `package.json` if a sheet library is needed (gap).
- Reqs: R33, R34. Proof: shortcode detection (U), list by injected typing (I); sheet tap and probe (S).

### 2.14 Attachments
- Commit: `feat(expo-lab): attach files and photos`. Files: `packages/ui-client/src/hooks/useFilePicker.ts` and `.native.ts`, `composer/useAttachments.ts`, `package.json`.
- Does: picker to `{ uri, name, type }` (1.5), count limit and toasts as web, upload through `uploadFiles`.
- Reqs: R35 to R38. Proof: count, toast and adapter specs (U); simulator library pick (S), one real upload on a dev server. Risk: dev client rebuild.

### 2.15 Accessibility
- Commit: `feat(expo-lab): accessible names and roles on every composer control`. Files: the composer views.
- Reqs: R56. Proof: accessibility tree dump on the simulator (S).

## Phase 3: edit

### 3.1 Edit mode
- Commit: `feat(expo-lab): edit a message from the long-press actions`. Files: `useNativeComposer.ts`, `MessageBox.tsx`, spec. Blocked on the message toolbar step c1.
- Reqs: R18 to R20. Proof: simulator trigger and hint (S); `processMessageEditing` and cancel specs, predicate spec (U).

## Phase 4: verification passes

- **4.1 Device IME** (docs commit `docs(expo-lab): record the device IME check`): real device, keyboard, dictation, a Japanese or Korean IME with a popup open. Reqs: R54, R55.
- **4.2 Android decision** (docs commit): the user decides whether the first milestone covers Android; if yes a lab run precedes any claim. Reqs: none.
- **4.3 Real-server pass** (docs commit): the user's own session, no credentials in the repo; re-observes R10, R26, R37, R48. Reqs: none new (those rows stay in their steps).
- **4.4 Web parity gate and feature note** (`docs(expo-lab): native composer feature note`): web jest on the touched folders unedited, the four Playwright composer specs, `git diff --stat` over every phase 1 commit shows no spec edit, then `docs/features/native-composer.md`. Reqs: R57, R58, R59. Opens nothing.

Steps: phase 0, 4; phase 1, 5; phase 2, 15; phase 3, 1; phase 4, 4; total 29.

## Risks

- **Web regression from the extractions (highest).** Each is proven neutral by the unedited existing spec of that code (1.1: `createComposerAPI.spec.ts`, `wrapSelection.spec.ts`; 1.2: `ComposerBoxPopup.spec.tsx`, `MessageBox.spec.tsx`; 1.3: `createComposerAPI.spec.ts`, `sendMessage.spec.ts`; 1.4: `useDraft.spec.tsx`; 1.5: `uploads.spec.ts` and `tsc`), a diff with no spec edit, and the Playwright specs at 4.4. 1.2 and 1.4 carry the most risk. Run the web specs at every commit, not only at the end.
- **TextInput selection is write-only.** The caret is never read back, so R23, R31, R32 can only be shown by injected typing; until idb they stay unproven.
- **IME.** Any programmatic rewrite during composition ends it; popups must not rewrite the value (R55). Only a real device proves it (4.1).
- **Android unknown.** Nothing is accepted there (4.2).
- **Dev client rebuild.** AsyncStorage (2.7), the picker (2.14) and a sheet library (2.13) are native modules the current dev client cannot load.
- **Metro and the web flows.** `chat.flows.*` may import Meteor-bound code (2.1); the fallback is a native twin, which grows the plan.
- **Spec discrepancy.** `wrapSelection.ts` is DOM code; the pure arithmetic is in `createComposerAPI.ts` (1.1). R29 cites the existing `wrapSelection.spec.ts`, which covers the DOM handlers; the new `wrapSelectionText.spec.ts` proves the arithmetic. The spec text is unchanged; a person decides whether to amend it.
- **Size.** 29 steps, 25 with code. Grouping into pull requests is decided before leaving draft, not by this plan.

## Open items that need a person

1. Go-ahead and a session on a live server for P1 and P2 (0.1, 0.2), plus a second session for P2.
2. idb installed, for P3 and the class I proofs (0.3).
3. A device and a Japanese or Korean keyboard for 4.1.
4. The Android decision (4.2).
5. The message toolbar step c1 landing, for 3.1.
6. Confirm the choices marked gap: the synchronous `useDraftStorage` seam with a hydrated memory map (1.4, 2.7); a sheet dependency (2.13); native twins if 2.1 fails.
7. Rebuild the dev client when 2.7, 2.13 and 2.14 land.
8. Which phase 1 commits become their own pull requests, and when to open and undraft.

## Proof

Class as in the spec: U unit, S simulator, I injected keystrokes, R real device, E existing web run.

| Requirement | Step | Proven by |
| --- | --- | --- |
| R1 | 2.3 | S: room open, probe text after scripted `setText` |
| R2 | 2.3 | S: keyboard up, screenshot |
| R3 | 2.3 | S: lab rows 52, 81, 155, 155, clear returns to 52 |
| R4 | 2.3 | S: 600 unbroken characters reach max height |
| R5 | 2.4 | U: hook spec, send once with `sendOnEnter` on and off |
| R6 | 2.4 | U: hook spec, empty, spaces, newlines send nothing |
| R7 | 2.4 | U: both event orders; I: injected Return after P3 |
| R8 | 2.4 | I: injected Return with preference off |
| R9 | 2.4 | U: shared function called, existing spec |
| R10 | 2.5 | U: store spec optimistic, confirmed, failed |
| R11 | 2.5 | U: over-limit takes `processTooLongMessage` |
| R12 | 2.4 | U: hook spec after an accepted send |
| R13 | 2.5 | U: fixture through web `composeMessage` and native, deep-equal |
| R14 | 2.5 | U: same fixture with markup characters |
| R15 | 2.6 | S: reply, quote and dismiss screenshot |
| R16 | 2.6 | U: fixture with a quote |
| R17 | 2.6 | U: dismiss leaves text, sends nothing |
| R18 | 3.1 | S: after c1, edit from long-press, probe text, hint |
| R19 | 3.1 | U: `processMessageEditing` called, cancel restores |
| R20 | 3.1 | U: predicate with permission and age cases, after c1 |
| R21 | 2.10 | U: trigger detection; I: visible list |
| R22 | 2.10 | U: replace-range against web insertion text |
| R23 | 2.10 | I: second keystroke shows caret |
| R24 | 2.10 | U: same spec for channels |
| R25 | 2.10 | U: trigger detection closes the list |
| R26 | 2.11 | S: P1 and popup screenshot; U: filter, sort, limit |
| R27 | 2.11 | U: `processSlashCommand` used, no `clientOnly` to `commands.run` |
| R28 | 2.11 | U: predicate |
| R29 | 2.12 | U: `wrapSelectionText.spec.ts` and native state-through spec |
| R30 | 2.12 | U: toggle case |
| R31 | 2.12 | U: text; I: caret |
| R32 | 2.12 | I: selection after the action |
| R33 | 2.13 | U: shortcode detection; I: list on screen |
| R34 | 2.13 | S: sheet tap, probe text, selection |
| R35 | 2.14 | S: pick from the simulator library |
| R36 | 2.14 | U: count check, same constant as web |
| R37 | 2.14 | U: adapter reaches the same upload call; S: one real upload |
| R38 | 2.14 | U: toast branches |
| R43 | 2.7 | S: leave and return |
| R44 | 2.7 | S: kill and relaunch |
| R45 | 2.7 | U: both stores empty after send and clear |
| R46 | 2.7 | U: `useDraft` with both values, server wins |
| R47 | 2.7 | U: storage-key spec |
| R48 | 2.9 | S: P2, two clients on a dev server |
| R49 | 2.9 | S: second client shows the indicator |
| R50 | 2.8 | U: `composerState.spec.ts` and native view spec per kind |
| R51 | 2.8 | U: view calls the shared function, import check |
| R52 | 2.8 | U: encrypted predicate and view reason |
| R53 | 2.8 | U: `omnichannel`, `federation` blocked true and false |
| R54 | 4.1 | R: real device, keyboard, dictation |
| R55 | 4.1 | R: IME with popup open; U: value-echo guard |
| R56 | 2.15 | S: accessibility tree dump |
| R57 | 4.4 | E: web jest on touched folders, run unedited |
| R58 | 4.4 | E: the Playwright composer specs |
| R59 | 4.4 | U: `git diff --stat` of each phase 1 commit shows no spec edit |

## Baseline 0.4 (2026-11-26)

Tip `92e7adc2ab9`, before any phase 1 change. This worktree needed `yarn install --immutable` (links under `apps/meteor/node_modules/@rocket.chat`) and `yarn turbo run build --filter=@rocket.chat/meteor^...` before jest could resolve the workspace packages.

Commands (from `apps/meteor` unless noted, Node 22.22.3):

- `yarn .testunit:jest --coverage=false client/views/room/composer client/lib/chats client/lib/createComposerAPICore`
- `yarn jest --coverage=false` in `packages/ui-client`
- `npx tsc --noEmit --skipLibCheck` in `apps/meteor`

Web composer specs, 18 suites, 166 tests, all passing:

| Spec (under `apps/meteor/client/`) | Pass |
| --- | --- |
| `views/room/composer/messageBox/wrapSelection.spec.ts` | 11 |
| `views/room/composer/messageBox/createComposerAPI.spec.ts` | 9 |
| `views/room/composer/messageBox/messageBoxHelpers.spec.ts` | 32 |
| `views/room/composer/messageBox/MessageBox.spec.tsx` | 4 |
| `views/room/composer/messageBox/MessageBoxHint.spec.tsx` | 11 |
| `views/room/composer/messageBox/RichTextMessageBox.spec.tsx` | 2 |
| `views/room/composer/messageBox/hooks/useDraft.spec.tsx` | 41 |
| `views/room/composer/messageBox/MessageBoxActionsToolbar/hooks/useFileUploadAction.spec.ts` | 1 |
| `views/room/composer/ComposerBoxPopup.spec.tsx` | 7 |
| `views/room/composer/ComposerContainer.spec.tsx` | 3 |
| `views/room/composer/ComposerAbacLocked.spec.tsx` | 9 |
| `views/room/composer/ComposerFederation/ComposerFederation.spec.tsx` | 4 |
| `views/room/composer/ComposerOmnichannel/ComposerOmnichannelCallout.spec.tsx` | 3 |
| `views/room/composer/lib/composerState.spec.ts` | 16 |
| `lib/chats/flows/sendMessage.spec.ts` | 4 |
| `lib/chats/flows/replyBroadcast.spec.ts` | 1 |
| `lib/chats/uploads.spec.ts` | 2 |
| `lib/chats/readStateManager.spec.ts` | 6 |

`packages/ui-client`: 44 suites, 226 tests, all passing. No existing spec covers the DOM `wrapSelection` (`createComposerAPI.spec.ts` covers `replaceText` and `clear` only) or the popup trigger regex directly; step 1.1 and 1.2 add specs for them.

`tsc --noEmit --skipLibCheck` in `apps/meteor`: 2 errors, both `TS2307 Cannot find module '@rocket.chat/ui-contacts'` (`client/views/contacts/ContactsPageFilters.tsx`, `ContactsTab.tsx`), not composer related. The turbo build also stops at `@rocket.chat/fuselage-ui-kit` (`ImageBlock.tsx(71,45)` TS2322, `style` on `Skeleton`), unrelated and untouched. Baseline: 2 errors; the refactors must add none.

Not run: the Playwright specs (`message-composer.spec.ts`, `message-composer-history.spec.ts`, `message-mentions.spec.ts`, `quote-messages.spec.ts`). They need a local Meteor server, which this job does not start.

## Phase 1 results (2026-11-26)

Every step ran the unedited existing specs of the touched folders, `tsc` after the last edit (still the 2 baseline errors), `oxlint` and `prettier --check` on the touched files. `git diff --name-status 92e7adc2ab9 HEAD` shows only added spec files; no existing spec is modified. "Applies on develop" is `git merge-tree --write-tree --merge-base=<commit>^ origin/develop <commit>`, a cherry-pick of the commit alone onto `origin/develop` (`04882f1525b`): clean for all four. The commits touch disjoint files, so they can be taken in any order; none depends on the Tamagui cherry-picks. The only touched file that differs between develop and this branch is `createComposerAPICore.ts` (one line in `triggerEvent`, outside the commit's hunks).

| Step | Commit | Reqs | Proof | Applies on develop | Deviations |
| --- | --- | --- | --- | --- | --- |
| 1.1 | `30c8c3f37b5` | R29, R30, R59 | Existing `createComposerAPI.spec.ts` 9 and `wrapSelection.spec.ts` 11 unchanged. New `wrapSelectionText.spec.ts` 16 and `createComposerAPI.wrapSelection.spec.ts` 8 (the DOM version, written and passed on the untouched code first, then again after the extraction) share eight cases: wrap, empty selection, start of text, fence, toggle off, toggle off fence, only the opening marker, a `$&` in the selection. | yes | The pure function also returns `toggledOff` and `replacement` (the replaced span), which the DOM caller needs to keep its exact sequence of edit commands; not in the plan's `{ text, selection }`. The old DOM code expands `$&` and similar tokens in the selection through `String.replace`; this is kept and pinned by a case. |
| 1.2 | `106b2730529` | none directly (enables R21 to R25) | `ComposerBoxPopup.spec.tsx` 7, `MessageBox.spec.tsx` 4 unchanged. New `composerPopupTrigger.spec.ts` 43, including a grid that holds the three functions to the previous inline regexes over 22 texts and 5 option shapes. | yes | The plan says two builds; there were three (select, match, filter). The matching build used a non-capturing second group; the unified regex captures it, which `test` and `match()[0]` cannot tell apart. |
| 1.3 | `6a075486dc9` | none directly (enables 2.2) | `createComposerAPI.spec.ts` 9, `sendMessage.spec.ts` 4, `MessageBox.spec.tsx` 4, `RichTextMessageBox.spec.tsx` 2 unchanged; new `composerStateCore.spec.ts` 6; `tsc` unchanged proves the exported signature and return keys. | yes | `composerRef` is not in the state core (the plan says no `HTMLElement` in its signature); the DOM part adds it back, so the returned object has the same keys. `quoteMessage` stays in the DOM part (focus), over `addQuotedMessage` in the state core. `createRichTextComposerAPI` also calls the core and is covered only by `tsc` and `RichTextMessageBox.spec.tsx`. |
| 1.4 | `2a5ba554fb8` | none directly (enables R43 to R47) | `useDraft.spec.tsx` 41 unchanged; new `useDraftStorage.spec.ts` 5 in `packages/ui-client` (226 to 231 there). | yes | Same key, same `getItem`, `setItem`, `removeItem` calls. `@rocket.chat/ui-client` must be rebuilt (`yarn build` in the package) for `apps/meteor` jest and `tsc` to see the new export. No `.native.ts` twin yet. |
| 1.5 | not done | R36, R37 enabling | `tsc` experiment, below | n/a | Stopped, tree left at 1.4. Moved into 2.14 by decision of the user on 2026-11-26. |

### 1.5 stopped: not a type-only widening

Widening `Upload.file` to `File | { uri, name, type, size? }` (with `UploadsAPI.send`, `UploadsStore.send` and `uploadFiles`) was tried and reverted. `tsc` then reports 11 new errors in 8 files: `uploadFiles.ts` (48 and 76: `e2eRoom.encryptFile` and `EncryptedFile` need a `File`), `uploads.ts` (94: `new File([upload.file], ...)`; 159: `sdk.rest.upload` takes a `File`), `processMessageUploads.ts` (61: `URL.createObjectURL`; 88 and 89: `size` becomes optional), `MessageComposerFileItem.tsx` (18), `MessageComposerGenericFile.tsx` (31, 49) and `MessageComposerImageFile.tsx` (6). Each reads `File`-only members. Fixing them takes runtime narrowing in web upload, encryption and preview code, which is a behavior change on web, not a type change. Narrowing only at the entry of `uploadFiles` would need a branch for a descriptor that web never reaches, and what that branch does (a twin store, or an adapter to a `File`) is a design decision for 2.14. Decided by the user on 2026-11-26: 1.5 is done inside 2.14, once the native upload path is chosen (a twin store or an adapter to a `File`: that choice, and the web-visible narrowing it implies, is made in 2.14 as its own commit inside the POC, extracted as a pull request when the POC settles).

### Gaps confirmed on 2026-11-26

The user accepted the three gaps the plan raised: (1) a synchronous `useDraftStorage` seam, with a memory map hydrated from AsyncStorage on native, because `useDraft` reads its initial value on first render; (2) a sheet dependency for the emoji sheet (a new native module, so a dev client rebuild), choosing the lightest maintained one at that step; (3) step 2.1 is tried first, and native twins of the send flow are decided only if it fails to load under Metro without Meteor.

### Spec wording

`COMPOSER-SPEC.md` lists `wrapSelection.ts` as pure. It holds DOM event handlers (`handleSelectionWrapping`); the pure arithmetic was in `createComposerAPI.ts` (lines 68 to 123, re-verified) and is now `wrapSelectionText.ts`. The spec text is unchanged.
