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

- `yarn .testunit:jest --coverage=false client/views/room/composer client/lib/chats client/lib/createComposerAPICore client/lib/createRichTextComposerAPI client/lib/composerHistory client/lib/composerStateCore` (corrected on 2026-11-26, see the review below: the original command, without the last three paths, missed three suites that cover the same code; `composerStateCore` exists only after step 1.3)
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
| 1.3 | `6a075486dc9` | none directly (enables 2.2) | `createComposerAPI.spec.ts` 9, `sendMessage.spec.ts` 4, `MessageBox.spec.tsx` 4, `RichTextMessageBox.spec.tsx` 2 unchanged; new `composerStateCore.spec.ts` 6; `tsc` unchanged proves the exported signature and return keys. | yes | `composerRef` is not in the state core (the plan says no `HTMLElement` in its signature); the DOM part adds it back, so the returned object has the same keys. `quoteMessage` stays in the DOM part (focus), over `addQuotedMessage` in the state core. `createRichTextComposerAPI` also calls the core and is covered by `tsc`, `RichTextMessageBox.spec.tsx` and its own `apps/meteor/client/lib/createRichTextComposerAPI.spec.ts` (corrected in the review below). |
| 1.4 | `2a5ba554fb8` | none directly (enables R43 to R47) | `useDraft.spec.tsx` 41 unchanged; new `useDraftStorage.spec.ts` 5 in `packages/ui-client` (226 to 231 there). | yes | Same key, same `getItem`, `setItem`, `removeItem` calls. `@rocket.chat/ui-client` must be rebuilt (`yarn build` in the package) for `apps/meteor` jest and `tsc` to see the new export. No `.native.ts` twin yet. |
| 1.5 | not done | R36, R37 enabling | `tsc` experiment, below | n/a | Stopped, tree left at 1.4. Moved into 2.14 by decision of the user on 2026-11-26. |

### 1.5 stopped: not a type-only widening

Widening `Upload.file` to `File | { uri, name, type, size? }` (with `UploadsAPI.send`, `UploadsStore.send` and `uploadFiles`) was tried and reverted. `tsc` then reports 11 new errors in 8 files: `uploadFiles.ts` (48 and 76: `e2eRoom.encryptFile` and `EncryptedFile` need a `File`), `uploads.ts` (94: `new File([upload.file], ...)`; 159: `sdk.rest.upload` takes a `File`), `processMessageUploads.ts` (61: `URL.createObjectURL`; 88 and 89: `size` becomes optional), `MessageComposerFileItem.tsx` (18), `MessageComposerGenericFile.tsx` (31, 49) and `MessageComposerImageFile.tsx` (6). Each reads `File`-only members. Fixing them takes runtime narrowing in web upload, encryption and preview code, which is a behavior change on web, not a type change. Narrowing only at the entry of `uploadFiles` would need a branch for a descriptor that web never reaches, and what that branch does (a twin store, or an adapter to a `File`) is a design decision for 2.14. Decided by the user on 2026-11-26: 1.5 is done inside 2.14, once the native upload path is chosen (a twin store or an adapter to a `File`: that choice, and the web-visible narrowing it implies, is made in 2.14 as its own commit inside the POC, extracted as a pull request when the POC settles).

### Gaps confirmed on 2026-11-26

The user accepted the three gaps the plan raised: (1) a synchronous `useDraftStorage` seam, with a memory map hydrated from AsyncStorage on native, because `useDraft` reads its initial value on first render; (2) a sheet dependency for the emoji sheet (a new native module, so a dev client rebuild), choosing the lightest maintained one at that step; (3) step 2.1 is tried first, and native twins of the send flow are decided only if it fails to load under Metro without Meteor.

### Spec wording

`COMPOSER-SPEC.md` lists `wrapSelection.ts` as pure. It holds DOM event handlers (`handleSelectionWrapping`); the pure arithmetic was in `createComposerAPI.ts` (lines 68 to 123, re-verified) and is now `wrapSelectionText.ts`. The spec text is unchanged.

## Review of Phase 1 (2026-11-26)

An independent review of 1.1 to 1.4 found one web difference and several notes. Fixes are new commits on top of the extractions: F1, F3 and F4 in the web code, F5 as a test.

Spec counts. The original command gives 21 suites and 233 passed; with `client/lib/composerStateCore` it is 22 suites and 239. `createRichTextComposerAPI`, `composerHistory` and `composerStateCore` add 3 suites and 69 tests (run alone before and after the fixes: 3 suites, 69 passed, identical). The corrected command at the Baseline 0.4 section now includes them. After the fixes, that command runs 25 suites and 306 tests, all passing, with four tests added by the fixes and no existing assertion changed.

- **F1, the only real web change (Low or Medium, opt-in rich text preview composer only).** The old `select` ended the replaced range at `chat.composer.selection.start`. The extraction ended it at the length of `composer.substring(0, selection.start)`, equal to the caret only when `substring(0, n).length === n`. That holds for the textarea API and not for `createRichTextComposerAPI`, whose `substring` goes through `getText()` (strips one trailing `\n`, `createRichTextComposerAPI.ts:26`) while `selection.start` counts the closing `\n` (`buildOffsetMap`, `getContentEndOffset`). Choosing a mention with the caret on the empty last line replaced `{ start: 0, end: 4 }` instead of `{ start: 0, end: 5 }`, keeping a newline the old code consumed. Fix: `getPopupReplaceRange(option, textBeforeCaret, caret)` takes the caret, and the hook passes `selection.start`. Proof: the new hook spec `useComposerBoxPopup.spec.tsx` (a composer whose `substring` strips the trailing newline and whose `selection.start` is one past it) failed with `end: 4` against the extracted behavior and passes with `end: 5`; `composerPopupTrigger.spec.ts` gained a caret-past-length case. The legacy grid there had hard-coded `end: text.length`; it now passes the caret explicitly. The fix commit belongs squashed into `106b2730529` when the extractions are lifted into their own pull requests.
- **Equivalence fuzz.** The reviewer compared old and new `wrapSelection` over 13,816 cases, in the jsdom fallback and with an emulated `execCommand`: identical, except the clamp case where the pattern has no `{{text}}`, which no web caller reaches.
- **F2.** If `wrapSelectionText` is reused natively, it must guard `indexOf('{{text}}') === -1` itself; the web callers never pass such a pattern, so the guard is not there.
- **F3.** `getPopupFilter` is typed `string` but returns `undefined` for a `matchSelectorRegex` with one capture group (the real slash command regex, `ComposerPopupProvider.tsx:395`), as the old inline code did. Typed as `string | undefined`, with the hook's `filter` state widened to match; runtime values unchanged; a spec case uses the real regex.
- **F4.** The order of operations in `setOptionByInput` changed; it is harmless unless `matchSelectorRegex` is global or sticky (`lastIndex` would carry over between calls). A doc comment on `ComposerPopupOption.matchSelectorRegex` says it must not be.
- **F5.** `createComposerAPI.spec.ts` gained a sorted `Object.keys` assertion. The pre-refactor tree (`92e7adc2ab9`) returns 31 keys: the 21 of `createComposerAPICore` plus 10 of the DOM API (`setText`, `wrapSelection`, `replaceText`, `replyWith`, `substring`, `getCursorPosition`, `setCursorToEnd`, `setCursorToStart`, `text`, `selection`). The "21 keys" is the core alone. This only adds a test to an existing spec file.
- **F6.** The 1.3 sentence about `createRichTextComposerAPI` coverage and the Baseline command are corrected above.
- **F7.** `createComposerAPI.wrapSelection.spec.ts` runs only the jsdom fallback branch (no `document.execCommand`); the `execCommand` path of the DOM `wrapSelection` has no spec.
- **F8.** Naming, recorded and not changed now: `composerPopupTrigger.ts` is not a hook but lives in `composer/hooks/`, and `wrapSelectionText.ts` sits next to the DOM `wrapSelection.ts`.

## Step 2.1 results (2026-11-27)

Tree at `97fd96a7565` plus the three commits of this step. Bundled with `CI=1 node node_modules/expo/bin/cli export --platform ios` (probe mode: `EXPO_PUBLIC_SHARED_PROBE=1`) and run on the iPhone 17 Pro simulator (dev client, Hermes, own Metro on 8086). Screenshot: `docs/composer/shared-modules-probe.png`. The probe is `src/sharedModulesProbe.ts` (one string-literal `require` per module, each run in its own `try`), shown by `src/SharedProbeScreen.tsx`.

Shape of the graph: every module that imports `SDKClient`, `stores` or `settings` pulls the web client into the bundle. Modules reachable from each entry (Metro edges): `sendMessage`, `chats/data` and `uploadFiles` reach 6011 (1562 under `apps/meteor/client`, including `views/room/Room.tsx`); `composerStateCore`, `createComposerAPICore`, `processSlashCommand`, `uploads` and `UserAction` about 2570 (30 to 50 under `apps/meteor/client`); the pure files 1 to 86. The app without the probe still bundles 2573 modules, the same count as before this step.

### Module table

| Module (under `apps/meteor/client`) | Loads under Metro | Runs on Hermes | Blocker (first error, chain, file:line) | Fix or gap | Step |
| --- | --- | --- | --- | --- | --- |
| `views/room/composer/lib/composerState.ts` | yes | yes | none (no imports) | none | 2.2, 2.8 |
| `lib/messageBoxFormatting.ts` | yes | yes | imports the `@rocket.chat/ui-client` barrel (922 package modules), `settings`, `react-dom`, `AddLinkComposerActionModal` (`messageBoxFormatting.ts:1-10`); all evaluate. Needed the `@rocket.chat/random` rule and the Babel flag | fixed | 2.2, 2.12, 2.13 |
| `views/room/composer/messageBox/messageBoxHelpers.ts` | yes | yes | `@rocket.chat/gazzodown-alt` barrel imports `react-dom/server` (`gazzodown-alt/dist/renderComposerMarkup.js:2`) | fixed (alias from gazzodown-alt only) | 2.12, 2.13 |
| `lib/toggleLinePrefix.ts` | yes | yes | none | none | 2.12 |
| `views/room/composer/messageBox/wrapSelectionText.ts` | yes | yes | none | none | 2.12 |
| `views/room/composer/hooks/composerPopupTrigger.ts` | yes | yes | none | none | 2.10, 2.11 |
| `lib/composerStateCore.ts` | with stubs | no: `Property 'document' doesn't exist` | `composerStateCore.ts:5` imports `chats/uploads`, whose `uploads.ts:10` imports `SDKClient`; `SDKClient.ts:6` -> `sdk/ddpSdk.ts:19` (`document.baseURI`), `:183` (`window`), `meteor/accounts.ts:188` (`window.location`), `meteor/connection.ts:112`; `RestApiClient` -> `lib/baseURI.ts:2` | gap | 2.2 |
| `lib/createComposerAPICore.ts` | with stubs | no, same | imports `composerStateCore` (`createComposerAPICore.ts:5`) | gap | 2.2 |
| `lib/chats/flows/sendMessage.ts` | with stubs | no, same | see the send-flow verdict | gap | 2.4, 2.5 |
| `lib/chats/flows/processSlashCommand.ts` | with stubs | no, same | `SDKClient` (`:6`), `authorization` (`:7`), `settings` (`:8`), `slashCommand` (`:9`) | gap | 2.11, 2.13 |
| `lib/chats/flows/processMessageEditing.ts` | yes | yes | imports only `message-types`, `toast` and a type | none | 2.6 |
| `lib/chats/flows/processTooLongMessage.ts` | yes | yes (import) | `ui-client` barrel, `settings`, `toast`, `user` evaluate; it calls `imperativeModal`, a web modal host | none for loading | 2.5 |
| `lib/chats/data.ts` (`composeMessage`) | with stubs | no, same | `data.ts:7` `stores`, `:8` `SDKClient`, `:9` `authorization` | gap | 2.5 |
| `lib/chats/uploads.ts` | with stubs | no, same | `uploads.ts:10` `SDKClient`, `:11` `UserAction` | gap (not modified here) | 2.14 |
| `lib/chats/flows/uploadFiles.ts` | with stubs | no: `Property 'crypto' doesn't exist` | `uploadFiles.ts:3` `e2ee` (global `crypto`) | gap | 2.14 |
| `lib/UserAction.ts` | with stubs | no, same as `composerStateCore` | `UserAction.ts:5` `SDKClient`, `:8` `stores` | gap; the spec already plans a native twin | 2.9 |
| `packages/ui-client/src/hooks/useDraftStorage.ts` | yes | yes (import); calling it uses `localStorage`, hence the `.native.ts` twin of 2.7 | none at import | none | 2.7 |
| `@rocket.chat/ui-client` barrel | yes | yes (import) | 922 package modules | none | n/a |

"With stubs": Metro only produced a bundle because probe mode replaces dependencies it cannot resolve with `stubs/unresolved.js`, which throws when evaluated. Without it the bundle fails. Resolution errors found, all in the graph of `sendMessage`/`data`/`uploadFiles` unless noted:

- `node:crypto` from `packages/random/dist/NodeRandomGenerator.js` (`No resolver is registered for the 'node:' URI scheme`), chain `processSlashCommand.ts` -> `@rocket.chat/random` -> `main.server.js`. Fixed.
- `react-dom/server` -> `crypto`, `async_hooks` (`react-dom-server.node.production.js`): from `gazzodown-alt/dist/renderComposerMarkup.js:2` (fixed for that importer) and from `packages/layout` `BackgroundLayer.js` (only in the web UI graph, not fixed).
- `@rocket.chat/ui-voip` (`dist/index.js` missing, the package is not built in this tree) from 9 UI files (`views/room/Room.tsx`, `SidebarRail.tsx`, `NavBarControls.tsx`, `useMediaCallRoomAction.ts` ...). Chain: `sendMessage.ts` -> `processSetReaction.ts:6` -> `rooms/roomCoordinator.tsx` -> `views/room/RoomRoute.tsx` -> `RoomOpener.tsx` -> `Room.tsx`; also `...RoomProvider.tsx` -> `ui.ts` -> `useMediaCallRoomAction.ts`. Gap: inside the web UI.
- `../../rocketchat.info` from `lib/getURL.ts` (JSON file without an extension). Chain: `sendMessage.ts` -> `processMessageUploads.ts:7` -> `e2ee/rocketchat.e2e.ts` -> `getUserAvatarURL.ts` -> `getAvatarURL.ts` -> `getURL.ts`. Gap.
- No `meteor/meteor`, `meteor/tracker` or `meteor/reactive-var` resolution error: this graph no longer imports them.
- Babel: `declare public readonly` class fields (`lib/errors/NotSubscribedToRoomError.ts:8`) fail with Babel 7's TypeScript plugin. Fixed in `babel.config.js`.

### Send-flow verdict

`chat.flows.sendMessage` cannot be imported and called with an injected fake. Importing it evaluates the web singletons first, and the first Hermes error is `Property 'document' doesn't exist`: `sendMessage.ts:5` `stores`, `:16` `SDKClient` (`SDKClient.ts:6` -> `ddpSdk.ts:19` and `:183`, `meteor/accounts.ts:188`, `meteor/connection.ts:112`), `:18` `settings`, `:19` `user`. A fake `chat` does not help: the singletons load by import, before any call.

What the flow needs at call time, so a native caller (or an injectable web version) must provide it: `getUserId()`/`getUser()` (`sendMessage.ts:24`, `:32`); `Messages.state.get/store/update` (`:27`, `:55`, `:101`); `Rooms.state.get` (`:37`); `settings.peek` (`:51`); `onClientMessageReceived` (`:17`) and `onClientBeforeSendMessage` (`:6`, called in `process`); `sdk.rest.post('/v1/chat.sendMessage')` (`:95`); `dispatchToastMessage` (`:7`); `upsertThreadMessageInCache` (`:20`, React Query client). Through `process`: `processSetReaction` (imports `roomCoordinator`, `processSetReaction.ts:6`, which alone drags the whole room UI: the largest blocker), `processTooLongMessage`, `processSlashCommand` (`hasAtLeastOnePermission`, `slashCommands`, `sdk.rest.post('/v1/commands.run')`), `processMessageUploads` (`e2e` at `:7`, global `crypto`, `ui-client` modals), `processMessageEditing`. On `chat`: `data.isSubscribedToRoom/joinRoom/composeMessage/findMessageByID`, `readStateManager.clearUnreadMark`, `currentEditingMessage`, `composer`, `flows`. `composeMessage` is in `chats/data.ts` with the same singleton imports.

Modules that block it, minimal list: `SDKClient.ts` (plus `sdk/ddpSdk.ts`, `meteor/accounts.ts`, `meteor/connection.ts`), `stores/index.ts`, `processSetReaction.ts:6` (`roomCoordinator`), `processMessageUploads.ts:7` (`e2ee`), `chats/data.ts:7-9`. The session and e2ee ones are not shimmed under the rules of this step.

### Aliases and shims added (all in `apps/expo-lab`)

| Where | What | Why it is safe | Needed by |
| --- | --- | --- | --- |
| `metro.config.js` | native: `@rocket.chat/random` resolves to `packages/random/dist/main.client.js` | The package maps `browser` to this file; Metro's native conditions chose the Node one (`node:crypto`), which cannot bundle on native, so nothing could use it before. Hermes has no `window.crypto`, so it uses the Alea generator (not cryptographically strong; used for message ids, not secrets: do not use it for anything security-relevant). The pin is explicit and does not depend on any rule about packages without a `dist`; it needs `packages/random` built (`dist/main.client.js`; its `src` imports use `.js` specifiers Metro cannot map). No general `node:` guard was added: `node:crypto` here is fixed by this pin, and no other `node:` import appeared in the graph | `messageBoxFormatting` and `processSlashCommand` load (2.2, 2.11, 2.12) |
| `metro.config.js` | native: `react-dom/server` imported from `packages/gazzodown-alt/` resolves to `stubs/empty.js` | Its only use is `renderComposerMarkup` (`renderToStaticMarkup`); the composer needs `sanitizeUrl` from the same barrel and never calls the renderer (it would fail on an undefined import) | `messageBoxHelpers` (2.12, 2.13) |
| `metro.config.js` + `stubs/unresolved.js` | probe mode only: a dependency Metro cannot resolve resolves to a module that throws when evaluated, and `src/probeScreenSlot.ts` (an empty slot `App.tsx` requires) is swapped for `SharedProbeScreen.tsx` | Nothing is silently satisfied. No config or mode but probe mode can reach the probe: `App.tsx` only references the empty slot, so even a Metro running an older config bundles 2573 modules, as before. Checked with a dev bundle from a default Metro (no probe or `NodeRandomGenerator` text in it) and with `expo export` (2573 modules default, 6773 in probe mode) | the probe |
| `babel.config.js` | `@babel/plugin-transform-typescript` with `allowDeclareFields` for files under `apps/meteor/client/` only | Changes only how `declare` and uninitialized class fields are emitted, for web client files no screen imported before. Not applied to `packages/*`, where uninitialized fields would change | any web client import (2.2 on) |

No shim module was written: every candidate sat on the session, network or storage path, or in the web UI graph.

### Recommendation for the decision gate

By the plan's rule, 2.1 fails for the send flow: native twins. Not decided here, for the person:

- 2.2 state: twin the state half over `{ text, selection }`. `composerStateCore` is blocked only by its `uploads` import (`composerStateCore.ts:5`); passing the uploads factory in as a parameter (a web-side extraction in `apps/meteor`) would let it load on Hermes.
- 2.4/2.5 send: a native function taking `{ sdk, store, user, settings }`, reusing what loads (`processMessageEditing`, the pure logic of `processTooLongMessage` and `composeMessage` if split from the modal and from `data.ts`). Making the web flow injectable is the alternative, also in `apps/meteor`.
- 2.9 typing: `UserAction` twin over the raw DDP SDK, as the spec says.
- Use as they are: `composerState`, `messageBoxFormatting`, `messageBoxHelpers`, `toggleLinePrefix`, `wrapSelectionText`, `composerPopupTrigger`, `processMessageEditing`.

Not verified: Android; calling the loaded functions on Hermes (only the import was run); anything behind the first error of each failing module (for example `crypto` after `document`).

## Phase 1b: injectable send flow and composer core (2026-11-27)

Decision x13 of the user, 2026-11-27: OPTION B. The web send flow becomes injectable so the native composer reuses it, instead of native twins (the 2.1 recommendation). Web behavior does not change. This section replaces, for the send path, the "native twin" fallback of 2.1 and the twin notes in 2.2, 2.4, 2.5, 2.9, 2.11 and 2.14; those native steps keep their numbers and are re-scoped below. A plan only: no source was edited. Marks: **(V)** verified by reading this tree (`6582c0de8e3`), **(I)** inferred, to be settled by the step's own check.

### Shape of the change

Each module keeps its path, export name, signature and behavior and becomes a thin adapter; its body moves to a core under `apps/meteor/client/lib/chats/core/` that takes `deps`. `ChatMessages.ts` (V: `ChatMessages.ts:173-181` binds `sendMessage.bind(this, this)`, `uploadFiles.bind(null, this)` and the rest) is not edited, so `chat.flows.*` and `ChatProvider`/`useChatMessagesInstance.ts:28` are untouched. New files:

- `chats/core/deps.ts`: types only (the interfaces below), no runtime code.
- `chats/core/messagePayload.ts`, `createComposerState.ts`, `processSlashCommandCore.ts`, `processTooLongMessageCore.ts`, `processSetReactionCore.ts`, `sendMessageCore.ts`, `createUserAction.ts`, `createUploadsStore.ts`, `uploadFilesCore.ts`, `processMessageUploadsCore.ts`, each with a spec beside it.
- `chats/core/importGuard.spec.ts`: walks the static and dynamic imports of every file in `chats/core/` (relative paths followed transitively, packages checked against an allowlist: `@rocket.chat/core-typings` (types), `random`, `tools`, `message-types`, `emitter`, `filesize`) and fails on any path in a denylist (`SDKClient`, `stores`, `settings`, `user`, `toast`, `authorization`, `e2ee`, `rooms/roomCoordinator`, `emoji`, `slashCommand`, `UserAction`, `utils/threadMessageUtils`, `queryClient`, `@rocket.chat/ui-client`, `meteor/*`, `lib/i18n`, `onClient*`) and on any module-level regex with the `g` or `y` flag. It also fails on `import(`, because `getPermaLink.ts` reaches `./SDKClient` and `../stores` by dynamic import (V), which Metro bundles all the same.

Rules for every adapter (V: why they matter): (a) `deps` entries are arrows that read the singleton at call time, never captured values, because `Messages.state` is a getter over `useStore.getState()` (`createGlobalStore.ts:9`) and `settings.peek` needs its `this`; (b) the adapter imports each singleton from the same relative path the module imports today, so every existing `jest.mock('<path>')` keeps hitting the same module; the adapter touches only the singletons the old body touched (`sendMessage.spec.ts` mocks `stores` with `Messages` and `Rooms` only); (c) regex literals stay inside function bodies, as today (`processSlashCommand.ts:13`, `processSetReaction.ts:85`), none global.

### Injected dependency interfaces (`chats/core/deps.ts`)

All shapes are (I) until `tsc` runs; they are read off the call sites.

```ts
type Translate = (key: string, options?: Record<string, unknown>) => string;                       // lib/i18n t
type Toast = (payload: { type: 'error' | 'warning' | 'success' | 'info'; message: unknown }) => void;
type Rest = Pick<(typeof sdk)['rest'], 'post'>;                                                   // import type only
type StoredMessage = IMessage & { temp?: boolean };
type MessageStore = {
  get(id: string): StoredMessage | undefined; find(p: (m: StoredMessage) => boolean): StoredMessage | undefined;
  store(m: StoredMessage): void;
  update(p: (m: StoredMessage) => boolean, f: (m: StoredMessage) => StoredMessage): void;
};
type Session = { getUserId(): string | undefined; getUser(): Pick<IUser, '_id' | 'username' | 'name'> | undefined };
type Settings = { peek<T = unknown>(id: string): T | undefined };
type ChatForSend = Pick<ChatAPI, 'composer' | 'data' | 'readStateManager' | 'currentEditingMessage' | 'flows' | 'uid' | 'ActionManager' | 'action'>;

type SendMessageDeps = Session & {
  messages: MessageStore; getRoom(rid: string): Pick<IRoom, 'federated'> | undefined; settings: Settings;
  rest: Rest; toast: Toast; t: Translate;
  onClientMessageReceived(m: IMessage): Promise<IMessage>;
  onClientBeforeSendMessage(m: AtLeast<IMessage, '_id' | 'rid' | 'msg'> & { isEditing?: boolean }): Promise<AtLeast<IMessage, '_id' | 'rid' | 'msg'>>;
  upsertThreadMessage(m: IMessage, rid: string, tmid: string): void;
  afterSendMessage(m: IMessage, rid: string): Promise<void>;
  flows: Record<'setReaction' | 'tooLong' | 'slashCommand' | 'uploads' | 'editing', (chat: ChatForSend, m: IMessage, previewUrls?: string[]) => Promise<boolean>>;
};
type SlashCommandDeps = { rest: Rest; settings: Settings; t: Translate; getCommand(name: string): SlashCommand | undefined;
  hasAtLeastOnePermission(permission: string | string[], rid: string): boolean };
type SetReactionDeps = Session & { messages: MessageStore; getRoom(rid: string): IRoom | undefined; hasSubscription(rid: string): boolean;
  emojiExists(shortcode: string): boolean; isReadOnly(room: IRoom, user: Pick<IUser, 'username'>): boolean; rest: Rest; toast: Toast };
type TooLongDeps = { settings: Settings; toast: Toast; t: Translate; offerAttachment?: (msg: string, chat: ChatForSend) => Promise<void> };
type PayloadDeps = { prependReplies(text: string, quoted: IMessage[]): Promise<string>; randomId(): string };
type ComposerStateDeps = { createUploads(room: { rid: string; tmid?: string }): UploadsAPI };
type UserActionDeps = Session & { publish(rid: string, username: string | undefined, activities: string[], extras: IExtras): void;
  stream(rid: string, handler: (username: string, activities: string[], extras?: IExtras) => void): () => void; useRealName(): boolean };
type UploadsStoreDeps<TFile extends PickedFile> = { settings: Settings; t: Translate; describeError(e: unknown): string; randomId(): string;
  isValidContentType(type: string | undefined): boolean; upload: Rest-like XHR starter (endpoint, params, events) => XHRLike;
  renameFile(file: TFile, name: string): TFile; stopUploadingActivity(rid: string, tmid?: string): void };
type PickedFile = { name: string; type: string; size?: number };   // web: TFile = File, so every web type is unchanged
```

`TooLongDeps.offerAttachment` is optional: absent means the branch "toast `Message_too_long`, restore the text" (the same branch web takes today when `FileUpload_Enabled` or `Message_AllowConvertLongMessagesToAttachment` is off). The web adapter always supplies it.

### Steps

Every step is its own commit, revertable alone. Rule for each: `git diff --stat` shows no existing `*.spec.*` file edited and no `.snap` edited after 1b.1/1b.2; the existing web specs of the touched folders pass unedited with the pass counts of Baseline 0.4 (18 suites, 166 tests for `views/room/composer`, `lib/chats`, `createComposerAPICore`, `createRichTextComposerAPI`, `composerHistory`, `composerStateCore`; `packages/ui-client` 44/226 plus 5 of 1.4); `tsc --noEmit --skipLibCheck` in `apps/meteor` stays at the 2 baseline errors, re-run after the last edit, specs included; `oxlint` and `prettier --check` on touched files. Order: cheapest first; `1b.1` and `1b.2` carry no web change at all.

#### 1b.1 Characterization of the send path (test only, M)
- Done as `c08d51862d3`; see Phase 1b golden results below. Deviations: inline expectations instead of `__snapshots__/*.snap` (the repo has no Jest snapshot tests since develop #42977), files named `*.golden.spec.ts`, and the real `Messages`/`Rooms`/`Subscriptions` stores plus the real data API (`createDataAPI`), recorded through the ordered log.
- Commit: `test(meteor): pin the send flow behavior before making it injectable`. Files (new): `lib/chats/flows/sendMessage.characterization.spec.ts`, `processSlashCommand.characterization.spec.ts`, `processSetReaction.characterization.spec.ts`, `processTooLongMessage.characterization.spec.ts`, `lib/chats/data.characterization.spec.ts` (composeMessage, updateMessage), `__snapshots__/*.snap`.
- Does: drives the REAL adapters and the REAL sub-flows against the real `Messages`, `Rooms`, `Subscriptions` stores (pure zustand, V: `stores/Messages.ts`) with `jest.mock` on `SDKClient`, `toast`, `user`, `settings`, `authorization`, `slashCommand`, `emoji`, `roomCoordinator`, `threadMessageUtils`, `afterSendMessageCallback`, and one ordered call log (`{ fn, args }`, shared by every fake incl. `composer.clear`, `dismissAllQuotedMessages`). A table of about 60 inputs: subscribed or not, join failing, text empty/spaces/unclosed fence, editing with and without text, quotes, files present, `+:emoji:` known and unknown, over-limit with and without attachment conversion, slash command unknown/permission denied/clientOnly/ok/rest failing, federated room, duplicate `_id`, `onClientBeforeSendMessage` rejecting, REST rejecting. Each case snapshots the log, the final store contents and the returned boolean.
- Reqs: R10, R11, R13, R14, R16, R27 (the oracle for 2.5, 2.11). Neutral: nothing outside the new files changes. Risk: none for web; a golden that encodes a bug. Rollback: delete the files.
- Mechanical differential: the goldens ARE the old path. After each later step the same specs run unedited; any difference in a call, argument, order or store state is a failing snapshot (the technique that caught F1). For a wider net, each step may also run an uncommitted fuzz (a frozen copy of the old module beside the adapter, 10,000 generated cases, as the Phase 1 reviewer did); its count goes in the results section.

#### 1b.2 Characterization of uploads, typing and composer state (test only, M)
- Done as `075220d81c0`; see Phase 1b golden results below. Same deviations as 1b.1. Composer state is already covered by `composerStateCore.spec.ts`, not repeated. The uploads goldens pin behavior for the native twin of 2.14, not for a Phase 1b refactor (see decisions).
- Commit: `test(meteor): pin uploads, typing and composer state behavior`. Files (new): `lib/chats/uploads.characterization.spec.ts`, `flows/uploadFiles.characterization.spec.ts`, `flows/processMessageUploads.characterization.spec.ts`, `lib/UserAction.characterization.spec.ts` (fake timers, a recording `sdk.publish`/`stream`), snapshots.
- Pins, among others (V): `processMessageUploads` returns a promise that never settles when the user dismisses the failed-uploads modal (`onCancel`, `onClose` and the all-failed `onConfirm` only close it, `processMessageUploads.ts:196,209,213`), so `sendMessage` hangs there today; `uploadFiles` redefines `file.name` as writable before the e2ee lookup (`uploadFiles.ts:35`); the 500 ms debounce, 5 s renew and 15 s timeout of `UserAction`.
- Reqs: R35 to R38, R48, R49 (oracle for 2.9, 2.14). Neutral and rollback: as 1b.1.

#### 1b.3 Payload builders (S)
- Commit: `refactor(meteor): extract message payload building from the data API`. Files: `chats/core/messagePayload.ts` (`composeMessageCore(deps: PayloadDeps, ctx, text, opts)`, `getUpdateMessageParams(message, previewUrls)`), `chats/data.ts` (the two closures call them; `prependReplies` and `Random.id` passed as deps), `chats/core/importGuard.spec.ts` (new, with this first core), `messagePayload.spec.ts`.
- Reqs: R13, R14, R16 directly; removes `chats/data.ts:7-9` from the native path. Neutral: `data.characterization` unchanged; the two encrypted/plain `chat.update` shapes are table-tested. Order that matters (V): `prependReplies` resolves permalinks in parallel but joins in input order, then the text is last; `_id` is `originalMessage._id ?? randomId()`; `tshow` only with a `tmid`.
- Risk: low. Rollback: restore the two closures.

#### 1b.4 Composer state without the uploads import (S)
- Commit: `refactor(meteor): let the composer state take its uploads factory`. Files: `chats/core/createComposerState.ts` (body of `createComposerStateCore` with `deps.createUploads`), `lib/composerStateCore.ts` (adapter: `createComposerState({ ... }, { createUploads: createUploadsAPI })`), `createComposerState.spec.ts`.
- Why a new file: the existing specs mock `./chats/uploads` by path and call `createComposerStateCore({ room })` (V: `composerStateCore.spec.ts:5-12`), so the adapter must keep the import and the signature, and a required parameter on the old name would force a spec edit.
- Stays shared, not injected: `settings.observe('*')` and `formattingButtons` (V: `messageBoxFormatting` loads on Hermes per 2.1). The native app must fill the same `settings` store before the composer mounts (a decision for 2.2, (I)).
- Order that matters (V): `uploads` is created last, after the formatter subscription starts; the emitter events keep their order. Neutral: `composerStateCore.spec` 6, `createComposerAPI.spec` 9, `createRichTextComposerAPI.spec`, `MessageBox.spec` unedited. Risk: low. Rollback: inline back.

#### 1b.5 Slash command core (S)
- Commit: `refactor(meteor): make processSlashCommand injectable`. Files: `chats/core/processSlashCommandCore.ts`, `flows/processSlashCommand.ts` (adapter: `getCommand: (n) => slashCommands.commands[n]`, `hasAtLeastOnePermission`, `sdk.rest`, `settings`, `t`), `processSlashCommandCore.spec.ts`.
- Reqs: R27, R28; removes `processSlashCommand.ts:6-9`. Imports that exist only for singletons and leave the core: `SDKClient`, `authorization`, `settings`, `slashCommand`, `t`. Legitimately shared and kept: `@rocket.chat/random` (aliased in `metro.config.js`), `escapeHTML` from `@rocket.chat/tools` ((I): not yet probed on Hermes), the `SlashCommand` type.
- Order that matters (V): `composer.clear()` precedes the warning or `commands.run`; the telemetry POST is fire-and-forget (`void`) before `generateTriggerId`; `notifyBusy` before the run, `notifyIdle` after the catch; an unknown name returns `false` only when `Message_AllowUnrecognizedSlashCommand`. `getCommand` must stay a plain property read (`/constructor` resolves to `Object.prototype.constructor` today; kept, pinned by a case). Risk: low.

#### 1b.6 Too-long message core (S)
- Commit: `refactor(meteor): split the too-long decision from its modal`. Files: `chats/core/processTooLongMessageCore.ts`, `flows/processTooLongMessage.ts` (adapter owns the `Blob`/`File`, `imperativeModal` and `uploadFiles`, passed as `offerAttachment`), spec.
- Reqs: R11. Removes the `@rocket.chat/ui-client` barrel (922 modules, V: 2.1) and `File`/`Blob` from the core. Web-only and staying so: the modal. Order (V): inside `onConfirm` it is build file, `composer.clear()`, `imperativeModal.close()`, `uploadFiles`, then resolve; the adapter keeps that sequence verbatim because `offerAttachment` is the old `new Promise` block moved whole. Native v1 omits `offerAttachment` (error toast, text restored); a native modal is a later choice for a person. Risk: low.

#### 1b.7 Set-reaction core (M)
- Commit: `refactor(meteor): make processSetReaction injectable`. Files: `chats/core/processSetReactionCore.ts`, `flows/processSetReaction.ts` (adapter: `isReadOnly: (room, user) => roomCoordinator.readOnly(room, user)`, `emojiExists: (s) => !!emoji.list[s]`, `hasSubscription`), spec.
- Removes the largest blocker (V: `processSetReaction.ts:6` `roomCoordinator` imports `RoomRoute`, `MainLayout`, `RouterProvider`; chain to `Room.tsx` and the unbuilt `@rocket.chat/ui-voip`; this alone explains most of the 6011 modules). Unblocks 2.5. Native owns `isReadOnly` (the room-type directives and `post-readonly` permission, (I): a native rule set, specified in 2.5) and `emojiExists` (2.13 data).
- Order (V): the emoji is checked twice (in `process` and in the optimistic part); `composer.clear()` then optimistic update then POST; on POST failure the toast fires and the error is rethrown. The optimistic updater is a pure function of the record: moved as is; identity (`{ ...record, reactions }`, `rest` without `reactions`) pinned by the characterization. Risk: medium: the store `update` callback shape.

#### 1b.8 Send message core (M)
- Commit: `refactor(meteor): make the send flow injectable`. Files: `chats/core/sendMessageCore.ts`, `flows/sendMessage.ts` (adapter), `sendMessageCore.spec.ts` (the four existing cases re-expressed on the core plus a case per branch), `importGuard.spec.ts` (entry added).
- Reqs: R10, R11, R13, R14 (and the shared path of R15, R16, R17 and R7 to R9 via `chat.composer`). Singleton-only imports that leave the core: `stores`, `SDKClient`, `settings`, `user`, `toast`, `lib/i18n`, `onClientMessageReceived`, `onClientBeforeSendMessage`, `threadMessageUtils` (queryClient), `afterSendMessageCallback` (`clientCallbacks` via the ui-client barrel), the five `process*` modules. Legitimately shared and kept: `closeUnclosedCodeBlock` (no imports) and `trim` from `stringUtils` (pulls `dompurify`, (I): its top-level `window` check must evaluate on Hermes; if not, replace by `String.prototype.trim` after a case proves equal for `''`, `undefined`, ` `).
- Order and identity that matter (V): `dismissAllQuotedMessages()` is called without `await`, before `process`; `afterSendMessage` receives the OUTER composed message, not the one `onClientBeforeSendMessage` returned; `delete message.e2e` and `isEditing` mutate the returned object, which is also the POST body; `composer.clear()` precedes the optimistic insert, which precedes the POST (asserted by the existing spec); the duplicate-id toast fires inside the optimistic step and the POST still follows; the final `update` clears `temp` only if the stream has not replaced the record; the flows are called by imported function in `process` but through `chat.flows.processMessageEditing` in the empty-text branch (kept). `flows` in the adapter are the imported modules, so `sendMessage.spec.ts` (which mocks each of them by path) is unedited.
- e2ee, stays web-only: the encryption lives in the transform registered on `onClientBeforeSendMessage` by `useE2EEncryption.ts:7` (V); the core only calls the injected function. Native passes the shared chain (V: `onClientBeforeSendMessage.ts` imports only types and `transforms.ts`, loads) or an identity; with no transform registered nothing is encrypted, which is why R52 (encrypted rooms are not writable natively) is a hard precondition, not a nicety. The `t === 'e2e'` attachment-preserving branch for edits moves with the core and is inert without `findMessageByID` returning such a message.
- Risk: medium. Rollback: restore the body. After this step run the web e2e set below.

#### 1b.9 Hermes probe for the send group (S, expo-lab)
- Commit: `chore(expo-lab): probe the injectable send flow on Hermes`. Files: `src/sharedModulesProbe.ts` (rows: `chats/core/messagePayload`, `createComposerState`, `processSlashCommandCore`, `processTooLongMessageCore`, `processSetReactionCore`, `sendMessageCore`), `src/sharedFlowsSmoke.ts` (new: runs `sendMessageCore` and `processSlashCommandCore` with fake deps and returns pass or fail; the 2.1 probe only imported), `SharedProbeScreen.tsx` (shows it).
- Proof: `EXPO_PUBLIC_SHARED_PROBE=1`, `expo export --platform ios`, then the dev client on the simulator with a Metro of its own (not 8081), as in 2.1; record the module count per entry (target: each core under 100 modules and none under `apps/meteor/client` except itself and `closeUnclosedCodeBlock`; the 6011 figure is the number to beat). The default bundle must stay at 2573 modules (probe mode is the only way in, unchanged). Risk: none for web. Rollback: revert the commit.

#### 1b.10 Typing core (M)
- Commit: `refactor(meteor): make the typing indicator injectable`. Files: `chats/core/createUserAction.ts`, `lib/UserAction.ts` (adapter: `export const UserAction = createUserAction({ ...session, publish: (...) => sdk.publish('notify-room', ...), stream: ..., useRealName: () => settings.peek('UI_Use_Real_Name') })`), spec.
- Reqs: R48, R49 (2.9 stops being a twin). State is per factory call: the adapter makes exactly ONE instance at module load, so the maps (timeouts, renews, intervals, performing users) stay process-wide as today. Order (V): `start` arms the renew timer before registering the activity, then emits through the 500 ms `debounce` (lodash, stays a shared import, V: `UserAction.ts:3`); `stop` clears the three timers then emits. `Users.state.get(uid)` in the stream handler equals `getUser()` (V: `user.ts`), so one `getUser` dep serves both. P2 (client publish on `notify-room`) still gates acceptance on a server. Risk: medium (timers). `uploads.ts` and `ChatMessages.ts` keep importing the same `UserAction`.

#### 1b.11 Uploads store, generic over the file type (L)
- MOVED (decision 2026-11-27): out of Phase 1b, into the native step 2.14 as a native twin.
- Commit: `refactor(meteor): make the uploads store injectable and generic over the file`. Files: `chats/core/createUploadsStore.ts` (the `UploadsStore` class over `UploadsStoreDeps<TFile>`), `chats/uploads.ts` (adapter, `TFile = File`, `createUploadsAPI` unchanged), `chats/Upload.ts` (`Upload` becomes `UploadOf<File>`; same exported names and shapes), spec.
- This is where 1.5 stopped: widening `File` broke 11 sites because web code reads `File` members. Generic instead of widened: web instantiates `TFile = File`, so web types and call sites are byte-identical and no web narrowing is needed; `tsc` must still report 2 errors. `sdk.rest.upload` becomes `deps.upload` returning an XHR-like object (`readyState`, `DONE`, `status`, `responseText`, `onload`, `abort`); native starts an `XMLHttpRequest` with a `FormData` file descriptor, which React Native supports ((I): proven only in 2.14's S step). `new File([file], name, file)` (V: `uploads.ts:94`) becomes `deps.renameFile`.
- Order (V): every state change goes through `set` (emits `update`); `send` appends the upload before validation; zero size, max size and content type reject inside the promise, then `updateUpload` records the error; `once('cancelling-id')` registered after the XHR starts. Risk: high within this phase (largest file, 219 lines, used by the real upload UI). Fallback below.

#### 1b.12 `uploadFiles` core (M)
- MOVED (decision 2026-11-27): out of Phase 1b, into 2.14.
- Commit: `refactor(meteor): make uploadFiles injectable`. Files: `chats/core/uploadFilesCore.ts` (generic `TFile`), `flows/uploadFiles.ts` (adapter), spec.
- Deps beyond those above: `encrypt?(room, file) => Promise<EncryptedPayload | undefined>` and `prepareFile?(file)`. Web-only and staying (state it): the `e2e.getInstanceByRoomId` + `encryptFile` + `encryptMessageContent` branch (needs global `crypto`, V: `uploadFiles.ts:3` is the 2.1 blocker) and `Object.defineProperty(file, 'name', ...)`, both in the adapter, called at the same points. The shared part is the count limit (R36, `MAX_MULTIPLE_UPLOADED_FILES`, from `lib/constants.ts`, no imports), the encrypted-room toast (R38, same predicate as web) and `performContinuously('uploading')`/`composer.focus()` in the `finally`. `ChatAPI.flows.uploadFiles` keeps `readonly File[]`; native calls the core directly with its own file type. Risk: medium.

#### 1b.13 `processMessageUploads` core (M)
- MOVED (decision 2026-11-27): out of Phase 1b, into 2.14.
- Commit: `refactor(meteor): make processMessageUploads injectable`. Files: `chats/core/processMessageUploadsCore.ts`, `flows/processMessageUploads.ts` (adapter), spec.
- Deps: `rest`, `toast`, `t`, `getE2ERoom(rid)` (web: `e2e.getInstanceByRoomId`; native: returns `undefined`), `getImageSize(file)` (web: `Image` + `URL.createObjectURL`, V: `:33-46,64`; native: `Image.getSize` on the `uri`), `confirmFailedUploads(info) => Promise<'sendAnyway' | 'dismiss'>`. The web `confirmFailedUploads` reproduces the never-settling promise on dismiss and on the all-failed notice (V, above) so behavior is identical; a fix is a separate `fix:` commit a person orders below the feature. Legitimately shared: `getFileExtension` (pure), `isEncryptedUpload`. The `e2e` import at `:7` (loads `getUserAvatarURL` -> `getURL` -> `rocketchat.info`, V: 2.1) leaves the core. Risk: medium; the e2ee content path is not exercised natively and is covered on web by Playwright.

#### 1b.14 Hermes probe for typing and uploads (S, expo-lab)
- Re-scoped (decision 2026-11-27): typing only (`createUserAction`); the `createUploadsStore`, `uploadFilesCore` and `processMessageUploadsCore` rows and the fake-XHR smoke run go away with 1b.11 to 1b.13.
- Commit: `chore(expo-lab): probe the injectable typing and uploads cores`. Files: `src/sharedModulesProbe.ts` rows for `createUserAction`, `createUploadsStore`, `uploadFilesCore`, `processMessageUploadsCore`; smoke run of `createUploadsStore` with a fake XHR.

#### 1b.15 Results
- Commit: `docs(expo-lab): composer plan phase 1b results`. Files: this document: per step the commit SHA, the pass counts, the module reach per entry, the fuzz counts, the guard output.

Steps: 15 commits (2 test, 10 refactor, 2 probe, 1 docs; 1b.9 and 1b.14 touch `apps/expo-lab`). Files: about 14 new core and 14 new spec files, 3 snapshot files, 11 edited web files (`data.ts`, `composerStateCore.ts`, `processSlashCommand.ts`, `processTooLongMessage.ts`, `processSetReaction.ts`, `sendMessage.ts`, `UserAction.ts`, `uploads.ts`, `Upload.ts`, `uploadFiles.ts`, `processMessageUploads.ts`), 3 in `apps/expo-lab`: about 45 files. Size: S 7 (1b.3 to 1b.6, 1b.9, 1b.14, 1b.15), M 7 (1b.1, 1b.2, 1b.7, 1b.8, 1b.10, 1b.12, 1b.13), L 1 (1b.11). Honest estimate: 1b.1 to 1b.8 is about two days of agent work and one local Playwright run; 1b.10 to 1b.13 is about as much again, and 1b.11 is where schedule risk sits.

### Blockers of 2.1 and the step that removes each

| Blocker (2.1) | Where | Removed by | Remains on web as |
| --- | --- | --- | --- |
| `SDKClient.ts:6` -> `ddpSdk.ts:19,183`, `meteor/accounts.ts:188`, `meteor/connection.ts:112` | `sendMessage.ts:16`, `processSlashCommand.ts:6`, `chats/data.ts:8`, `uploads.ts:10`, `UserAction.ts:5`, `processSetReaction.ts:4`, `processMessageUploads.ts:6` | `Rest`/`publish`/`stream` deps in 1b.3, 1b.5, 1b.7, 1b.8, 1b.10, 1b.11, 1b.13 | adapters import `sdk` |
| `stores/index.ts` (loads on Hermes (V), but it is the web store) | `sendMessage.ts:5`, `chats/data.ts:7`, `UserAction.ts:8` | `MessageStore`, `getRoom`, `hasSubscription` deps (1b.7, 1b.8, 1b.10) | adapters read `Messages`, `Rooms`, `Subscriptions` |
| `processSetReaction.ts:6` `roomCoordinator` (6011-module cause) | `processSetReaction.ts` | 1b.7 (`isReadOnly`) | adapter |
| `processMessageUploads.ts:7` `e2ee` (global `crypto`, `rocketchat.info`) | `processMessageUploads.ts`, `uploadFiles.ts:3` | 1b.12, 1b.13 (`encrypt`, `getE2ERoom`) | adapters |
| `chats/data.ts:7-9` | `composeMessage` | 1b.3 (`messagePayload.ts`); the rest of `createDataAPI` is not needed natively (native writes its own `data`, below) | `createDataAPI` |
| `composerStateCore.ts:5` -> `uploads.ts:10` | `composerStateCore.ts` | 1b.4 | adapter |
| `ui-client` barrel (922 modules) via `processTooLongMessage` and `afterSendMessageCallback` | both | 1b.6, 1b.8 | adapters |
| `@rocket.chat/ui-voip` (unbuilt) and `../../rocketchat.info` | only through `roomCoordinator` and `e2ee` | 1b.7, 1b.13 (they leave the graph, not shimmed) | web only |

### Effect on the native steps

- 2.2: `createComposerState` (1b.4) with `createUploads` = the native uploads store (1b.11) or a memory stub until 2.14. No twin of the state half.
- 2.4/2.5: no native send function. `sendMessageCore` with deps from the app session (`getUserId`, `getUser`, a native `MessageStore`, `rest.post` over the app's `api.ts`, a native toast, the shared `onClient*` chains), `processSlashCommandCore`, `processSetReactionCore`, `processTooLongMessageCore` without `offerAttachment`, `processMessageEditing` as it is (V: loads). Native must still write a small `ChatForSend` (`data.isSubscribedToRoom/joinRoom/findMessageByID/findLastMessage/pushEphemeralMessage/updateMessage` over its stores; `readStateManager.clearUnreadMark`; `currentEditingMessage`; `uid`; `action`; an `ActionManager` with `generateTriggerId`, `notifyBusy`, `notifyIdle`). R13/R14 are proved by running `composeMessageCore` and the native path against the 1b.1 fixtures.
- 2.9: `createUserAction` over `DDPSDK.publish`/`stream`; the P2 probe stays the acceptance gate.
- 2.11: `processSlashCommandCore` with `getCommand` over the `commands.list` result and `hasAtLeastOnePermission` over the native permission data.
- 2.14: `createUploadsStore<PickedFile>`, `uploadFilesCore`, `processMessageUploadsCore`. The "1.5 inside 2.14" decision is met by the generic parameter, with no web-visible narrowing (the 11 tsc errors do not arise because web stays `TFile = File`, (I) until 1b.11 runs `tsc`).

### Risks

- **Web regression (main).** Per step: goldens from 1b.1/1b.2 unchanged, existing specs unedited, importGuard, `tsc`. jsdom does not cover: `imperativeModal` and the real modals, a real `File`/`Blob` in the too-long path, `XMLHttpRequest` upload, `execCommand` (untouched by this phase; Phase 1 note F7 stands), e2ee with real `crypto`, real timers in typing.
- **Playwright has not run for any phase 1 commit.** It needs a local Meteor server (`yarn dev` in `apps/meteor`) on the person's machine. Run it after 1b.8 (send group), after 1b.13 (uploads), and once on the whole phase before leaving draft. Minimum set: `message-composer.spec.ts`, `message-composer-history.spec.ts`, `quote-messages.spec.ts`, `quote-attachment.spec.ts`, `message-mentions.spec.ts` (send path), `message-actions.spec.ts` (edit and delete), `threads.spec.ts` (`tmid`), `file-upload.spec.ts`, `image-upload.spec.ts`, and the `e2e-encryption/` folder (encrypted send and upload). Manual, not covered by any spec I found: `+:emoji:` reaction ((I): no e2e spec name or grep hit points at it), a long message to attachment, a failed upload then send, two sessions seeing the typing indicator.
- **Object identity and order.** Listed per step above; the golden logs are the guard. The two things the Phase 1 review found do not repeat by construction: the guard rejects module-level `g`/`y` regexes and any new module-level mutable state in a core (the only module-level state, `UserAction`'s maps, moves into the factory and the adapter makes one instance); no hook is added or reordered (the cores are plain functions, `chat.composer` calls keep their order).
- **A pre-existing hang** (dismissed failed-uploads modal never settles) is preserved on purpose; surfacing it as a `fix:` is a person's call.
- **Native-side inference.** `settings` filled on native (1b.4), `dompurify` on Hermes (1b.8), `escapeHTML` on Hermes (1b.5), `Image.getSize` and `FormData` uploads (1b.13, 2.14): (I), each caught by the probe or the S step.
- **Verified blockers I could not remove by injection: none.** Everything on the 2.1 list moves behind a dep. What injection cannot remove is the native work behind each dep (native store with the `update(predicate, updater)` semantics, `isReadOnly` rules, the `ChatForSend` object, an `XHR` upload).

### Fallback

If a step is not web-neutral (a golden differs and the difference is not a bug in the golden) or is larger than its size: revert that commit alone (they are independent after 1b.1/1b.2 and `deps.ts`), and the matching native step reverts to a native twin as the 2.1 recommendation said. By piece: 1b.11 to 1b.13 (uploads) are the first to give up, so 2.14 writes a native upload path against `{ uri, name, type }`; 1b.10 gives up to the twin the spec already allows for 2.9; 1b.7 gives up to a native reaction function (small: about 40 lines over the same rules); 1b.8 gives up last, because without it 2.4/2.5 write a native `send` taking `{ sdk, store, user, settings }` and reuse `composeMessageCore` (1b.3, the lowest risk piece) so R13/R14 parity still holds. The user can choose per module; no step depends on a later one except 1b.8 on 1b.5 to 1b.7 (it takes their results as `flows`, which a native twin of any of them can also fill).

### Needs a person

1. Confirm option B scope: whether uploads (1b.11 to 1b.13, the L piece) are in this phase or stay a twin inside 2.14.
2. Confirm the native toast/too-long behavior (no attachment conversion in v1) and that `settings` is filled natively.
3. Run the Playwright set above on a local Meteor after 1b.8 and 1b.13; nothing here starts a server.
4. Whether the pre-existing dismissed-modal hang gets its own `fix:`.
5. Which of these commits become pull requests, and when (`docs/change-organization.md`); this plan opens none.

## Phase 1b decisions (2026-11-27)

Approved by the user on 2026-11-27.

1. Uploads are OUT of Phase 1b. Steps 1b.11, 1b.12 and 1b.13 and the generic uploads store move into the native step 2.14 as a native twin (a store over `{ uri, name, type, size? }`, no web refactor). 1b.14 loses its uploads rows (typing only). The 1b.2 uploads goldens are still written: they are test only, add no web risk, and pin the behavior the 2.14 twin must match. The "uploads are the first to give up" line of the Fallback is now the plan; Needs-a-person item 1 is answered.
2. Native too-long behavior in v1: an error toast (`Message_too_long`), no attachment conversion (`TooLongDeps.offerAttachment` is omitted), and the native app fills the shared `settings` store (`Message_MaxAllowedSize` and the other settings the shared modules read) before the composer mounts. Needs-a-person item 2 is answered.
3. Playwright runs on a local Meteor after 1b.8 (send group). The user will run it or say how to start the server; nothing in this job starts one.
4. The dismissed-modal hang in `processMessageUploads` (the promise never settles after `onCancel`, `onClose`, or the all-failed `onConfirm`: `processMessageUploads.ts:196,209,213`) gets its OWN `fix:` commit, ordered by a person AFTER the goldens exist. The goldens pin the hang today (tests that expect the promise to stay pending); that fix commit flips exactly those tests. Needs-a-person item 4 is answered.
5. No commit becomes a pull request until the POC settles (`docs/change-organization.md`).

## Phase 1b golden results (2026-11-27)

Commits (on `feat/expo-lab-all`, nothing pushed): 1b.1 `c08d51862d3`, 1b.2 `075220d81c0`. Both add new files only: `git diff --name-status 1575621bc05 HEAD` shows only `A`; no existing spec and no non-test source file changed.

Method. Every spec runs the REAL module under test against the real zustand stores (`Messages`, `Rooms`, `Subscriptions`, `Users`) and, for the send flows, the real data API (`createDataAPI`) and the real sub-flows. The modules those import by path (`SDKClient`, `toast`, `user`, `settings`, `authorization`, `slashCommand`, `emoji`, `rooms/roomCoordinator`, `utils/threadMessageUtils`, `lib/i18n`, `@rocket.chat/random`, `@rocket.chat/ui-client`, `onClientBeforeSendMessage`, `onClientMessageReceived`, `afterSendMessageCallback`, `getPermaLink`, `e2ee`, `UserAction`) are `jest.mock`ed by those same paths with recording fakes from `client/lib/chats/goldenFakes.ts`; `goldenChat.ts` builds the `ChatAPI` (recording `composer`, `readStateManager`, `currentEditingMessage`, `action`, `ActionManager`, `flows`, and a recording wrapper over the real data API) and logs each change to the `Messages` store. One ordered log of `[name, ...args]` is asserted with inline `toEqual` arrays. Where a log is long, later cases assert a slice or a `toContainEqual`; the full order is in the case that owns it. Dates are fixed with fake timers. Deviation from the plan: no `toMatchSnapshot` and no `.snap` files (`git grep -l toMatchSnapshot apps/meteor packages` finds none; develop #42977 removed them).

| Module | Spec | Cases |
| --- | --- | --- |
| `sendMessage` (with the real `processSetReaction`, `processTooLongMessage`, `processSlashCommand`, `processMessageUploads`, `processMessageEditing`) | `flows/sendMessage.golden.spec.ts` | 47 |
| `processSlashCommand` | `flows/processSlashCommand.golden.spec.ts` | 23 |
| `processSetReaction` | `flows/processSetReaction.golden.spec.ts` | 27 |
| `processTooLongMessage` | `flows/processTooLongMessage.golden.spec.ts` | 16 |
| `composeMessage` and `updateMessage` params (`chats/data.ts`) | `chats/data.golden.spec.ts` | 29 |
| uploads store (`chats/uploads.ts`) | `chats/uploads.golden.spec.ts` | 33 |
| `uploadFiles` | `flows/uploadFiles.golden.spec.ts` | 17 |
| `processMessageUploads` | `flows/processMessageUploads.golden.spec.ts` | 23 |
| `UserAction` (fake timers) | `lib/UserAction.golden.spec.ts` | 25 |

Total 240 new cases in 9 suites. The existing composer command (`client/views/room/composer client/lib/chats client/lib/createComposerAPICore client/lib/createRichTextComposerAPI client/lib/composerHistory client/lib/composerStateCore`) gives 25 suites and 306 tests before and after (compared programmatically from `--json` output with the golden files excluded). `packages/ui-client`: 45 suites, 231 tests, unchanged. `tsc --noEmit --skipLibCheck` in `apps/meteor`: the 2 baseline `TS2307` errors. `oxlint` clean on the new files. A throwaway mutation (dropping `tshow` in `composeMessage` and `delete message.e2e` in `sendMessage`) made 5 goldens fail; the source was restored.

Quirks pinned (each is a test that asserts the current behavior; none is fixed):

- `processMessageUploads` returns a promise that never settles after `onCancel` or `onClose` of the "some failed" modal, and after `onConfirm` or `onClose` of the "all failed" modal (only `imperativeModal.close` is called). So `sendMessage` hangs there.
- `processTooLongMessage`: if `uploadFiles` rejects inside the modal `onConfirm`, `resolve` is never called: the confirm handler rejects and the flow stays pending.
- `sendMessage` runs `afterSendMessageCallback` with the OUTER composed message, not what `onClientBeforeSendMessage` returned, and also when a sub-flow (slash command, reaction, too-long toast) ended the send. It does not run when the transform or the request failed.
- A failed `chat.sendMessage` request leaves the optimistic record with `temp: true` in the store; the temp flag is only cleared if the record is still the optimistic one.
- Duplicate id: the toast fires and the POST still follows. A missing user id, a user without username, and a federated room skip the optimistic insert but still POST.
- In the empty-text edit branch, a failing `findMessageByID` rejects out of `sendMessage` (it is outside the `try`); the `Message_not_found` toast is only reachable if the data API resolves `null`, which the real API never does (it throws), so that case uses an overridden data method.
- `processSetReaction` matches `+:emoji:` on ANY line of a multi-line text (`/m` flag), takes the newest non-hidden message of the room or thread, rolls nothing back when the POST fails, and rethrows.
- `processSlashCommand`: `/constructor` resolves `Object.prototype.constructor` as a command and POSTs `commands.run` with `command: undefined`; `//` is the unrecognized command named `/`; leading-space text is not a command; the unrecognized-command warning is `console.error` plus an ephemeral message.
- Uploads store: `send` resolves only on the `load` event, whatever the status; a 400, 403 or 500 response records an error but does not reject; `cancel` removes the upload, stops the typing activity when it was the last one, then rejects and flags an upload that is already gone (a second, no-op `update`).
- `processMessageUploads`: an encrypted image whose dimensions cannot be loaded rejects the whole flow before any request (outside the `try`); an upload with no url is skipped and the flow still returns `true`; a failed `mediaConfirm` keeps the unconfirmed files and still returns `true`; the extension in the e2e attachment is upper case (`TXT`).
- `uploadFiles`: all files do their e2e instance lookup before any `send` (concurrent `map`); one failing file does not stop the rest (`allSettled`); the composer is focused in a `finally`.
- `UserAction`: ONE debounce is shared by every room, so a start in another room inside 500 ms replaces the pending publication (the first room is never published). The auto-stop timer calls `stop(trid, ...)` with the thread id as the room id, so a thread activity's auto-stop publishes on `<tmid>/user-activity`, while an explicit stop publishes on `<rid>/user-activity`. The stream handler empties the activity array it receives. The self filter compares the announced name with the real name or the username depending on the setting.

Not characterized, and why:

- Real modals: `imperativeModal` and `GenericModal` are fakes that record `open` and hand the props to the test; the rendered modal, focus and keyboard are not covered. A real `Blob` and `File` (jsdom) are used, but the content of the too-long attachment is not read back (name, type, size and `lastModified` are asserted).
- `XMLHttpRequest`: the XHR is a fake object driven by the test (`readyState`, `status`, `responseText`, `onload`, the three events); real progress, abort and network errors are not covered.
- Real timers: typing uses fake timers (lodash `debounce` was verified to follow them); the too-long and failed-uploads "stays pending" checks use microtask flushes, plus a 20 ms real wait for the uploads modal.
- `Image` and `URL.createObjectURL` are fakes (jsdom has no working ones), so the image-dimension path is characterized for its shape, not for a real decode.
- `editUploadFileName`'s failure branch is reached by making the `File` constructor throw; the real trigger is unknown.
- The rest of `createDataAPI` (finders, permission checks, drafts) is out of scope; `pushEphemeralMessage` is covered through the slash flow.
- `afterSendMessageCallback`, `onClientBeforeSendMessage`, `onClientMessageReceived` and the e2ee room are recording fakes, so their real transforms are not part of the contract.

What the later cores still need that the goldens do not pin: the real e2ee content encryption; the Playwright runs; the `ChatMessages.ts` binding of `chat.flows.*` and `chat.action.*` (the goldens build their own `ChatAPI`, so a wiring mistake in an adapter is caught only by the adapters' own specs and Playwright); and anything that depends on `settings.peek` keeping its `this` (the fake is a plain object).

## Phase 1b steps 1b.3 and 1b.4 results (2026-11-27)

Commits on `feat/expo-lab-all` (nothing pushed): 1b.3 `1b3703f772e`, 1b.4 `2ed74dca7b5`. `git diff --name-status 04c7ae4cfae HEAD` shows `A` for every new file and `M` only for `chats/data.ts` and `composerStateCore.ts` (plus the unrelated `A` of `WEB-FINDINGS.md` from another job); no existing spec and no golden helper changed.

### 1b.3 Message payload

Files (new): `chats/core/messagePayload.ts`, `chats/core/messagePayload.differential.spec.ts`, `chats/core/importGuard.spec.ts`, `chats/importGraph.ts` (the walker, test-only, outside `core/` so it is not guarded). Edited: `chats/data.ts`.

```ts
type PayloadDeps = { prependReplies(text: string, quoted: IMessage[]): Promise<string>; randomId(): string };
composeMessageCore(deps: PayloadDeps, ctx: { rid; tmid | undefined }, text: string, opts: { sendToChannel?; quotedMessages; originalMessage? }): Promise<IMessage>
getUpdateMessageParams(message: IEditedMessage, previewUrls?: string[])   // pure; the POST stays in the adapter
```

Adapter reads, all at call time: `prependReplies` (module function, through `(t, q) => prependReplies(t, q)`), `Random.id()` (through `() => Random.id()`, and only when `originalMessage?._id` is nullish: the core keeps the `??`), `rid` and `tmid` of the `createDataAPI` closure. `sdk.rest.post('/v1/chat.update', ...)` stays in `updateMessage`, after the params are built, as before. Order kept: permalinks (in parallel, joined in input order) before the id draw.

Import guard (`importGuard.spec.ts` plus `importGraph.ts`). A regex scan, not a TypeScript parse: the repo compiler is TypeScript 7, which has no JS API, and `@babel/parser` is not a declared dependency. It strips comments, skips `import type` and imports whose every specifier is `type`, follows relative imports resolved on disk (`.ts`, `.tsx`, `.js`, `.jsx`, `index.*`), and fails on a forbidden client path (list `FORBIDDEN_PATHS`: `SDKClient`, `sdk`, `stores`, `settings`, `user`, `toast`, `authorization`, `e2ee`, `roomCoordinator`, `threadMessageUtils`, `queryClient`, `i18n`, `getPermaLink`, `UserAction`, the web adapters, `meteor`, `views`, `providers`, `components`, `hooks`), a forbidden package prefix (`meteor/`, `react`, `react-dom`, `@rocket.chat/ui-client`, `ui-contexts`, `fuselage`), any `import(` or `require(` (even computed), and any relative import it cannot resolve. The guard itself is tested with fixture files in an `os.tmpdir()` directory (forbidden relative import, forbidden through a chain, forbidden package, dynamic import, require, re-export, type-only ignored, unresolved, cycle plus package listing). Later cores are covered with no edit: every non-spec `.ts` file in `chats/core/` is an entry.

### 1b.4 Composer state

Files (new): `chats/core/createComposerState.ts`, `chats/core/createComposerState.differential.spec.ts`. Edited: `composerStateCore.ts` (adapter, same path, exports `createComposerStateCore` and the type `ComposerStateCore`, same signature).

```ts
type ComposerStateDeps = {
  createUploads(room: { rid: string; tmid?: string }): ComposerAPI['uploads'];
  getFormattingButtons(): readonly FormattingButton[];
  observeSettings(callback: () => void): () => void;
};
createComposerState(params: ComposerStateCoreParams, deps: ComposerStateDeps): ComposerStateCore
```

Deviation from the plan: the plan kept `settings.observe('*')` and `formattingButtons` shared inside the core. The guard forbids `settings` and `messageBoxFormatting` (which pulls the `ui-client` barrel, `react-dom` and a modal), so both are injected too; the core imports only types from them. The comment on the coarse-grained subscription moved verbatim.

Adapter reads, all at call time: `createUploadsAPI` (arrow, so the spec's `jest.mock('./chats/uploads')` still hits), `formattingButtons` (read on every recompute, not captured), `settings.observe('*', cb)` (called as a method, so `this` holds). Order kept: first `recompute()` (so button conditions run), then `observe`, then `createUploads` last, in the returned object literal.

### Test numbers

| | before | after 1b.3 | after 1b.4 |
| --- | --- | --- | --- |
| existing composer set (`views/room/composer`, `lib/chats`, `createComposerAPICore`, `createRichTextComposerAPI`, `composerHistory`, `composerStateCore`) | 25 suites, 306 tests | 25, 306 | 25, 306 |
| goldens | 9, 240 | 9, 240 | 9, 240 |
| new: `messagePayload.differential` + `importGuard` | | 2, 34 | 2, 34 |
| new: `createComposerState.differential` | | | 1, 11 |
| `packages/ui-client` | 45, 231 | 45, 231 | 45, 231 |

Whole command incl. `client/lib/UserAction`: 36 suites 580 tests after 1b.3; 37 suites 591 tests after 1b.4. `tsc --noEmit --skipLibCheck` in `apps/meteor`: the 2 baseline `TS2307` after the last edit, specs included. `oxlint` and `prettier --check` clean on the touched files.

### Third-party imports per core (static, from the guard walk)

| Core | Runtime packages | Known on Hermes? |
| --- | --- | --- |
| `messagePayload.ts` | `@rocket.chat/core-typings` (`isEncryptedMessageContent`, a runtime import: the package index also loads its Ajv schemas) | Not proven by 2.1. Load it in the 1b.9 probe; if it fails or is heavy, move the one predicate into the core |
| `createComposerState.ts` | `@rocket.chat/emitter` | Not listed in 2.1; small and dependency free, to be proven in 1b.9 |

The walk found no relative import beyond the files themselves (1 file each), no dynamic import and no forbidden module. Neither core touches `dompurify`, `escapeHTML` or `trim`; those arrive with later cores.
