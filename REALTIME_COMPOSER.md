# Realtime Composer — AI working notes

> ⚠️ **DISCLAIMER — DELETE THIS FILE BEFORE MERGING THE FEATURE BRANCH.**
> This is scratch context for AI assistants working on the realtime composer branch. It is not
> product documentation, it is not kept in sync automatically, and it must not land on `develop`.
> Remove `REALTIME_COMPOSER.md` as part of the final PR cleanup.

All paths below are relative to the repo root, not to this file.

## 1. What this project is

Render Markdown **live, inside the composer, as the user types**, instead of only after send.

Hard requirements that shape every design decision here:

- **Parser parity** — composer output must come from the same AST the message list uses
  (`@rocket.chat/message-parser`). No second grammar, no regex-only renderer.
- **No typing lag, no caret jumps.** Rendering happens on every keystroke; the caret must survive a
  full DOM rewrite each time.
- **Nothing existing may break** — mentions/slash-command popups, emoji picker, drafts, paste,
  uploads, undo/redo, keyboard shortcuts, a11y.
- **Not** full WYSIWYG. Markdown markers stay visible (`*bold*` renders as `*` **bold** `*`).
  The composer text is still plain Markdown; only its *presentation* changes.

Explicitly out of scope: mobile apps, new Markdown syntax, tables, changing the spec.

## 2. Why `gazzodown-alt` exists

`@rocket.chat/gazzodown` (message-list renderer) is unusable in the composer:

- emits block elements (`<div>`, `<p>`, `<br>`) — breaks flat-offset caret math and `innerText`
- pulls heavy Fuselage components (MessageHighlight, CheckBox, KaTeX, …) — too slow to re-render
  per keystroke
- hides the Markdown markers, which the composer must keep visible

`packages/gazzodown-alt` is a stripped, span-only renderer over the **same AST**. See the doc block
in [ComposerMarkup.tsx](packages/gazzodown-alt/src/ComposerMarkup.tsx#L13-L24).

## 3. Feature flag and entry point

| Thing | Where |
| --- | --- |
| Flag name | `realtimeMessageComposer` (Feature Preview, group `Message`, default off) |
| Registration | [useFeaturePreviewList.ts:40](packages/ui-client/src/hooks/useFeaturePreviewList.ts#L40) |
| i18n keys | `Realtime_message_composer`, `Realtime_message_composer_description` (en only) |
| Gate | [ComposerMessage.tsx:94](apps/meteor/client/views/room/composer/ComposerMessage.tsx#L94) — `FeaturePreviewOff` → classic `MessageBox`, `FeaturePreviewOn` → `RichTextMessageBox` |

Both composers are always compiled in; only one mounts. **The classic `<textarea>` path must keep
working unchanged** — any refactor that touches shared code has to serve both.

## 4. Architecture map

```
ComposerMessage (feature gate)
├── MessageBox.tsx            classic  → MessageComposerInputExpandable (<textarea>)
└── RichTextMessageBox.tsx    new      → RichTextComposerInputExpandable (contenteditable)
        both render →
        MessageBoxBase.tsx    shared shell: popups, hints, toolbars, recorders, send/join buttons

composer API
├── createComposerAPICore.ts        shared: quotes, editing/recording state, formatters,
│                                   uploads, draft persist (300ms debounce), insertText/clear
├── createComposerAPI.ts            textarea impl (value/selectionStart)
└── createRichTextComposerAPI.ts    contenteditable impl (innerText/Selection API)

rendering
├── messageStateHandler.ts     input → parse → render → restore caret
├── renderComposerMarkup.tsx   AST → HTML string via renderToStaticMarkup
└── packages/gazzodown-alt/    the span-only React components

caret
└── selectionRange.ts          flat integer offsets ⇄ DOM Range

history
├── composerHistory.ts         custom undo/redo stack
└── hooks/useComposerHistory.ts  wires it to the node

formatting
├── messageBoxHelpers.ts       handleFormattingShortcut (shared, cmd+B/I/…)
└── wrapSelection.ts           handleSelectionWrapping (textarea) +
                               handleRichTextSelectionWrapping (contenteditable)
```

Key files, full paths:

- [RichTextMessageBox.tsx](apps/meteor/client/views/room/composer/messageBox/RichTextMessageBox.tsx)
- [MessageBoxBase.tsx](apps/meteor/client/views/room/composer/messageBox/MessageBoxBase.tsx)
- [createRichTextComposerAPI.ts](apps/meteor/app/ui-message/client/messageBox/createRichTextComposerAPI.ts)
- [createComposerAPICore.ts](apps/meteor/app/ui-message/client/messageBox/createComposerAPICore.ts)
- [messageStateHandler.ts](apps/meteor/app/ui-message/client/messageBox/messageStateHandler.ts)
- [renderComposerMarkup.tsx](apps/meteor/app/ui-message/client/messageBox/renderComposerMarkup.tsx)
- [selectionRange.ts](apps/meteor/app/ui-message/client/messageBox/selectionRange.ts)
- [composerHistory.ts](apps/meteor/app/ui-message/client/messageBox/composerHistory.ts)
- [wrapSelection.ts](apps/meteor/client/views/room/composer/messageBox/wrapSelection.ts)
- [RichTextComposerInput.tsx](packages/ui-composer/src/MessageComposer/RichTextComposerInput.tsx)

## 5. The render loop (read this before touching anything)

Registered in [createRichTextComposerAPI.ts:64](apps/meteor/app/ui-message/client/messageBox/createRichTextComposerAPI.ts#L64):
`input.addEventListener('input', rerender)`.

Per keystroke, [`renderComposerContent`](apps/meteor/app/ui-message/client/messageBox/messageStateHandler.ts#L68):

1. read `target.innerText` — **`innerText` is the single source of truth for composer text**
2. `protectLinks()` swaps URLs/emails/Slack links for `[[[LINK_n]]]` placeholders
   (workaround; see gap list)
3. `parse(text, parseOptions)` — real message-parser, options from
   [RichTextMessageBox.tsx:169](apps/meteor/client/views/room/composer/messageBox/RichTextMessageBox.tsx#L169)
   (`colors`, `emoticons`, `customDomains`, `katex`)
4. `renderComposerMarkup(ast, parseOptions)` → `renderToStaticMarkup` of `ComposerMarkup`
5. `restoreLinks()` puts the URLs back
6. `target.innerHTML = finalHtml`
7. `setSelectionRange(target, selectionStart, selectionEnd)` restores the caret

Invariants:

- **`resolveComposerBox` bails on `!event.isTrusted`**
  ([messageStateHandler.ts:96](apps/meteor/app/ui-message/client/messageBox/messageStateHandler.ts#L96)).
  Programmatic paths (`triggerEvent`, history apply, `setText`) dispatch synthetic `input` events to
  keep drafts/React state in sync; the guard is what stops an infinite render loop. Do not remove it,
  and do not make synthetic events trusted.
- Rendering is synchronous React SSR to a string, not a React tree in the DOM. There is no
  reconciliation — the whole subtree is replaced every keystroke. That's why the caret model has to
  be DOM-independent.
- Empty composer normalizes to `<br>`; text `''` and `'\n'` are treated as the same empty state
  (reducer at [RichTextMessageBox.tsx:61](apps/meteor/client/views/room/composer/messageBox/RichTextMessageBox.tsx#L61),
  `normalize()` in composerHistory).

## 6. Caret model — flat offsets

`contenteditable` has no `selectionStart`. [selectionRange.ts](apps/meteor/app/ui-message/client/messageBox/selectionRange.ts)
builds a **flat character-offset map that mirrors `innerText` semantics**, so a caret is one integer
that survives the DOM being rewritten:

- text nodes contribute their length
- `<br>` contributes 1 newline unless it is a placeholder `<br>` (only child of its parent)
- block-element boundaries contribute 1 newline, but only when preceded by content
  (matches `innerText` giving `a\nb` for `<div>a</div><div>b</div>`)
- inline tags (`INLINE_TAGS` set) contribute nothing themselves

`getSelectionRange` maps DOM Range → offsets; `setSelectionRange` maps offsets → Range with a
deliberate resolution order (prefer the text node that *spans* the offset with an exclusive end, so a
boundary lands *inside* the following formatting; then a node starting exactly at the offset — e.g. a
placeholder `<br>` on an empty line; then a text node ending at the offset; then clamp to end).
If `range.setStart/setEnd` throws it parks the caret at the end rather than losing it.

When the input is blurred / selection is outside it, `getSelectionRange` returns end-of-text so
things like emoji-picker inserts append instead of collapsing to offset 0.

Blur/focus also stash the last caret per node in a `WeakMap`
([RichTextMessageBox.tsx:53](apps/meteor/client/views/room/composer/messageBox/RichTextMessageBox.tsx#L53))
and restore it on focus.

`getCursorSelectionInfo` (line/col helper, same file) is currently **unused** — either wire it or
drop it before merge.

## 7. Composer API differences (rich text vs textarea)

`createRichTextComposerAPI` returns the same `ComposerAPI` shape (`ChatAPI.ts` unchanged), backed by
`innerText` + Selection API:

- `text` → `input.innerText`; `substring`, `getCursorPosition`, `setCursorToStart/End`, `selection`
  all go through `getSelectionRange`/`setSelectionRange`.
- `setText` prefers `document.execCommand('insertText')` so the browser keeps its own bookkeeping,
  then **verifies the result** against the expected splice and falls back to writing `innerText`
  directly. `execCommand` can report success while inserting nothing (empty composer) or insert into
  a different focused element (emoji-picker search box) — hence the check.
- `wrapSelection` (formatting toolbar + cmd+B/I shortcuts):
  - strips trailing newlines from the selection so double-clicking the last word of a line doesn't
    push the closing marker onto the next line
  - detects an already-wrapped selection and unwraps it
  - **for multi-line replacements it bypasses `execCommand` entirely** (it drops embedded newlines
    and duplicates the last character) and rebuilds `innerText`, then calls `renderComposerContent`
    itself
- `replaceText` is what the mention/emoji/slash popups use to replace the token at the caret.
- Typing a wrapping character over a selection (`` ` ``, `*`, `_`, `~`, quotes, brackets) is handled
  on `beforeinput` by `handleRichTextSelectionWrapping`
  ([wrapSelection.ts:70](apps/meteor/client/views/room/composer/messageBox/wrapSelection.ts#L70)) —
  the contenteditable twin of the textarea version, identical logic with `innerText`/Selection API.

## 8. Undo/redo (`composerHistory.ts`)

Rewriting `innerHTML` every keystroke **destroys the browser's native undo stack**, so history is
reimplemented:

- snapshot = `{ text, selectionStart, selectionEnd }`; stacks capped at `limit = 100`
- `classify(event)` buckets `InputEvent.inputType` into insert / delete / newline / paste /
  programmatic
- coalescing: consecutive same-kind typing within `coalesceTimeout = 1000` ms is one step.
  Boundaries are forced by: kind change, paste, newline, pause, whitespace insertion, and
  **discontinuity** (caret moved, or a range was replaced)
- pre-edit selection is captured on `keydown` **in the document capture phase** so it lands before
  the composer's own keydown handler fires `execCommand` synchronously (cmd+B), plus on `beforeinput`
  for programmatic edits with no keydown (toolbar buttons)
- a text-identical/selection-only change is absorbed into the current entry, not pushed — otherwise
  `wrapSelection`'s "insert then re-select" produces a ghost undo step
- IME: `compositionstart/end` guard; a whole composition = one step
- keybindings: cmd/ctrl+Z, cmd+shift+Z, ctrl+Y (non-Mac). `historyUndo`/`historyRedo` `beforeinput`
  is handled best-effort (rarely fires, see above)
- `applyState` (in [useComposerHistory.ts](apps/meteor/client/views/room/composer/messageBox/hooks/useComposerHistory.ts))
  writes `innerText`, re-renders markup, then fires synthetic `input`/`change` so drafts and React
  state follow without triggering the render loop

## 9. `gazzodown-alt` component inventory

Renders **markers as literal text around styled inline elements** — `*` + `<strong>` + `*`,
`` ` `` + `<code>` + `` ` ``, `||` + span + `||`, `> ` prefix for quotes, `` ``` `` fences for code
blocks. Paragraphs are `<span>` + a literal `'\n'`, never `<div>`/`<br>`.

| AST node | Component | Notes |
| --- | --- | --- |
| PARAGRAPH | ComposerMarkup | `<span>` + `\n` |
| HEADING | ComposerMarkup | keeps `#` prefix, inline font-size style |
| QUOTE | ComposerMarkup | `> ` prefix per line, left border |
| SPOILER_BLOCK | ComposerMarkup | tinted background |
| CODE | ComposerCodeBlock | rebuilds the whole fenced block as text inside `<code>` |
| UNORDERED_LIST | ComposerUnorderedList | inline `<span>` per item, a `-` marker plus a space kept as literal text and emphasized like `.rcx-message-body ul li:before` (bold, `0.5rem` inline-start padding) |
| ORDERED_LIST | ComposerOrderedList | same shape, the marker is `${item.number}` followed by `.` and a space; the typed numbers are echoed, never renumbered, matching `ol li:before { content: attr(value) "." }` in the message list |
| LINE_BREAK | ComposerMarkup | `\n` |
| BOLD / ITALIC / STRIKE | ComposerBold/Italic/StrikeSpan | markers + `<strong>`/`<em>`/`<del>`; mutually nestable |
| SPOILER | ComposerSpoilerSpan | |
| INLINE_CODE | ComposerCodeElement | |
| LINK | ComposerLinkSpan | underlined span with `title=href`, **not** a real `<a>` (no clickable link inside the composer) |
| PLAIN_TEXT | ComposerPlainSpan | bare text, no wrapper element |
| EMOJI | ComposerEmojiElement | uses `detectEmoji` from context → `getEmojiClassNameAndDataTitle` (sprite/custom emoji) |
| MENTION_USER / MENTION_CHANNEL | ComposerMentionUser/Channel | bold + info color; `resolveUserMention`/`resolveChannelMention` context hooks exist but **are not supplied** by `renderComposerMarkup`, so mentions render unresolved (raw `@name`) — see gap list, they must match the message list |

Context is `ComposerMarkupContext` (`detectEmoji`, `useEmoji`, `convertAsciiToEmoji`, and the two
unused resolvers). Deliberately removed vs `gazzodown`: KaTeX, timestamps, colors, images, UiKit
blocks, message highlights.

## 10. The contenteditable element

[RichTextComposerInput.tsx](packages/ui-composer/src/MessageComposer/RichTextComposerInput.tsx):
Fuselage `Box is='span'` with `contentEditable`, `display: block`, **`white-space: pre-wrap`**
(without it whitespace collapses and wrecks `innerText`), `overflow-y: scroll`, class
`rc-message-box__divcontenteditable js-input-message`.

Placeholder is a separate absolutely-positioned `Box` toggled by the `hideplaceholder` prop
(the reducer sets it from "exactly one child and it's a `<br>`"). Note both the placeholder Box and
the editable Box receive `{...rest}`.

`RichTextComposerInputExpandable` adds the expand/collapse button (shown when `blockSize > 100`) and
resets expansion when the composer empties.

`useMessageBoxAutoFocus` got a guard so a contenteditable `SPAN` doesn't have focus stolen between
the room and thread composers
([useMessageBoxAutoFocus.ts:32](apps/meteor/client/views/room/composer/messageBox/hooks/useMessageBoxAutoFocus.ts#L32)).

Refs are merged via `useMessageComposerMergedRefs(popup.callbackRef, contentEditableRef, callbackRef,
autofocusRef, keyDownHandlerCallbackRef, beforeInputHandlerCallbackRef, composerHistoryRef)` —
order matters, `callbackRef` is what creates/releases the composer API and flushes the draft.

## 11. Known issues / open work (as of this branch)

1. **Mentions must render exactly as they do in the final message.** Today they don't: the
   `resolveUserMention`/`resolveChannelMention` context values are never supplied by
   `renderComposerMarkup`, so the composer shows a styled raw `@name` instead of the resolved
   user/channel the message list renders. Open work.
2. `protectLinks` is a placeholder-substitution hack; Slack-style `<url|label>` links still
   misbehave — `// TODO` at [messageStateHandler.ts:29](apps/meteor/app/ui-message/client/messageBox/messageStateHandler.ts#L29).
   It also runs 4 regexes over the whole text every keystroke.
3. **The e2e history suite is `test.describe.skip`** because Feature Preview caching needs reloads
   before the composer swaps
   ([message-composer-history.spec.ts:13](apps/meteor/tests/e2e/message-composer-history.spec.ts#L13)).
   Must be unskipped before GA.
4. The marker a list item was typed with is not in the AST — `listItem()` keeps only the item's
   inline value and, for ordered lists, `parseInt` of the digits — so the renderers rebuild it as
   `-` / `${number}.`, each followed by a space. Anything else fails the text guard in
   `renderComposerContent`, which drops the **whole** render back to plain text: an asterisk list
   (`* x`), any spacing other than a single space (`-  x`, `-\tx`, `1.  x`), or a padded number
   (`01. x`). Text survives, styling does not.
   Fixing it means carrying the literal marker on `LIST_ITEM`, the way `HORIZONTAL_RULE`/`TABLE`
   carry `fallback` source ranges. Tasks have the same gap and are still unstyled.
5. Loose ends: `setMdLines` state is written and never read; commented-out `textareaRef`/`style`
   lines; `/* eslint-disable complexity */` at the top of `RichTextMessageBox`; `getCursorSelectionInfo`
   is exported but unused; the hint chip text `"Experiment: Real Time Composer"` is hardcoded English.
6. No performance instrumentation yet — "no typing lag" is an assumption, not a measurement.
   Every keystroke does: parse + `renderToStaticMarkup` + full `innerHTML` replace + caret remap
   (with several linear `entries.find` scans over the offset map).
7. `gazzodown-alt` has no tests of its own; coverage lives in the meteor-side specs.

## 12. Tests

Unit (Jest + jsdom, near the source):

| File | Covers |
| --- | --- |
| `selectionRange.spec.ts` | offset mapping, block boundaries, inline tags, round-trips, clamping, **typing-DOM → rendered-DOM caret mapping** |
| `createRichTextComposerAPI.spec.ts` | `insertText` into empty/placeholder/mid-text, `execCommand` no-op fallback, `replaceText` caret placement, `wrapSelection` newline/blank-line/trailing-newline cases |
| `composerHistory.spec.ts` | coalescing, boundary rules, ghost-step avoidance, redo invalidation, limit, shortcuts, IME, release |
| `messageStateHandler.spec.ts` | untrusted events don't re-render |
| `renderComposerMarkup.spec.tsx` | caret round-trip against real rendered markup |

E2E: `apps/meteor/tests/e2e/message-composer-history.spec.ts` (currently skipped, see above).

Run unit specs with Jest from `apps/meteor` (`yarn .testunit:jest <path>`). Per project convention,
if a run fails for infrastructure reasons, stop and ask rather than working around it.

## 13. Rules of engagement for changes on this branch

- Never regress the classic textarea composer. Shared code (`createComposerAPICore`,
  `MessageBoxBase`, `messageBoxHelpers`, `wrapSelection`) has two consumers.
- `innerText` is the source of truth. Never read composer text out of `innerHTML` or the AST.
- Any DOM write must be followed by an explicit caret restore through `setSelectionRange`.
- Keep the `isTrusted` guard; use `triggerEvent` for synthetic `input`/`change`.
- Parser parity: changes to rendering go through the message-parser AST, never a new regex path.
- New AST node support belongs in `gazzodown-alt`, and must render its Markdown markers as literal
  text so the round trip `innerText → parse → render → innerText` stays stable.
- Add a unit spec for every caret/selection/history behaviour change; these are the documented
  make-or-break areas.

---

# QA section

Everything below is for the QA team and QA AI agents. The repro steps were derived by reading this
branch's code, **not by executing the app** — treat them as high-probability leads to confirm, not as
verified bug reports.

## 14. Turning the feature on

1. Admin → **Settings → Accounts → Feature Preview** → `Accounts_AllowFeaturePreview` = `true`.
2. Per user: **Account → Feature Preview → Message → "Realtime message composer"** → on.
   (REST equivalent: `POST /v1/users.setPreferences` with
   `featuresPreview: [{ name: 'realtimeMessageComposer', value: true }]`.)
3. **Reload.** Feature Preview state is cached client-side and the composer sometimes needs more than
   one reload to swap. This is a real, known annoyance — it is why the automated history suite is
   skipped ([message-composer-history.spec.ts:13](apps/meteor/tests/e2e/message-composer-history.spec.ts#L13)).
   Always confirm which composer you are on before reporting anything.

Confirming which composer is live — **the quickest check is the tag above the composer**: the realtime
composer renders a small flask-icon tag reading **`Experiment: Real Time Composer`** (a Fuselage `Tag`
inside `MessageComposerHint`, so `page.getByText('Experiment: Real Time Composer')`). The classic
composer shows nothing there. If that tag is absent, you are testing the old composer — stop and
re-check the preference and reload.

| | Classic | Realtime |
| --- | --- | --- |
| Tag above composer | none | flask tag **`Experiment: Real Time Composer`** |
| Element | `textarea.rc-message-box__textarea.js-input-message` | `span[contenteditable="true"].rc-message-box__divcontenteditable.js-input-message` |
| Typing `*bold*` | stays plain text | shows `*` **bold** `*` styled live |

The feature is per-user and per-client. It affects **both** the main room composer and the thread
composer, and the message-editing composer (editing reuses the same box).

## 15. How the realtime composer differs from a `<textarea>` (automation gotchas)

This is the part that will silently break existing Playwright specs when the flag is on.

- **`[name="msg"]` now matches two elements.** `RichTextComposerInput` spreads its props onto both the
  absolutely-positioned placeholder `Box` and the editable `Box`
  ([RichTextComposerInput.tsx](packages/ui-composer/src/MessageComposer/RichTextComposerInput.tsx)), so
  `name`, `aria-label`, `disabled` and the event handlers land on both nodes. `composer.inputMessage`
  (`this.root.locator('[name="msg"]')` in
  [composer.ts:38](apps/meteor/tests/e2e/page-objects/fragments/composer.ts#L38)) therefore trips
  Playwright strict mode. Existing workaround used in the new spec:
  `poHomeChannel.composer.inputMessage.and(page.locator('[contenteditable="true"]'))`.
  The duplicated `aria-label` on a non-editable node is also an a11y smell worth reporting.
- **No `value`.** `inputValue()` throws on a contenteditable. Read text with `innerText()` /
  `textContent()`, assert with `toContainText` / `toHaveText`.
- **`fill()` is not equivalent to typing.** It produces one bulk input event (one render, one undo
  step). For anything about caret position, per-keystroke rendering, or undo granularity use
  `pressSequentially()` and `page.keyboard.press()`. Note existing helpers such as
  `home-content.ts` `sendMessage`/`dragAndDropFile` use `fill()`.
- **`disabled` does nothing.** The rich input renders `disabled` as an attribute on a `<span>`, which
  browsers ignore, and `contentEditable` stays `true`. The classic path used a real `<textarea
  disabled>`. So `toBeDisabled()` assertions will not hold, and — **worth explicitly testing** —
  the user may still be able to type while an audio/video recording is in progress, while uploads
  are processing, or in a room they cannot post in (`canSend === false`, Join button shown).
- **The DOM inside the composer is now markup.** Text is wrapped in `<strong>/<em>/<del>/<code>/<span>`
  and the whole subtree is replaced on every keystroke. Locators that assumed a single text node, or
  that hold a reference to an inner node across keystrokes, will go stale.
- **Newlines are literal `\n` characters inside spans, never `<br>`** (except the single placeholder
  `<br>` of an empty composer). `innerText` is the contract; don't assert on `innerHTML`.
- Placeholder is a **separate element**, not a `placeholder` attribute; it is toggled by opacity.

Existing suites worth re-running with the flag on (none of them were written for a contenteditable,
so failures here are expected findings, not necessarily product bugs):
`message-composer.spec.ts`, `message-actions.spec.ts`, `message-mentions.spec.ts`,
`quote-messages.spec.ts`, `emojis.spec.ts`, `threads.spec.ts`,
`thread-persistence-on-navigation.spec.ts`, `jump-to-thread-message.spec.ts`.

## 16. Regression checklist, priority order

The two make-or-break areas per the project brief are **caret behaviour** and **input latency**.
Everything in group A should be exercised on every build.

**A. Caret, selection, newlines (highest risk)**

1. Type a long line, click into the middle, keep typing → caret must not jump to the end or into the
   markers.
2. Type `*bold*`; place the caret right after the closing `*` and keep typing → new text must stay
   outside the bold run. Place the caret just inside the markers → new text must extend the bold run.
3. Shift+Enter several times, type on each line, then arrow up/down and Home/End through the block.
4. Blank lines: `a`, Shift+Enter, Shift+Enter, `b` → both newlines survive; caret can rest on the
   empty middle line.
5. Blur the composer (click the message list) and click back → caret returns where it was, not to
   offset 0 (this is the `WeakMap` cursor stash).
6. Select text with the mouse, with Shift+arrows, and with Cmd/Ctrl+A → then type; the replacement
   must land correctly.
7. Double-click the **last word of a line** with more lines below, then Cmd+B → closing marker must
   stay on the same line and text from the next line must not be pulled in (regression fixed on this
   branch; commits `fix: selection eating new lines when applying md`, `fix: newline breaking
   selection and md wrap`).
8. Multi-line selection + Cmd+B / toolbar → embedded newlines preserved, no duplicated last
   character (this path deliberately bypasses `execCommand`).
9. Emoji picker insert, mention picker insert, slash-command insert → caret lands *after* the
   inserted token, not one character inside it.

**B. Formatting**

10. Toolbar buttons and shortcuts: Bold `Cmd/Ctrl+B` (`*x*`), Italic `Cmd/Ctrl+I` (`_x_`),
    Strikethrough (`~x~`), Inline code (`` `x` ``), Multi-line code (```` ```\nx\n``` ````), Link,
    KaTeX (only when `Katex_Enabled`).
11. Applying a formatter twice on the same selection must **unwrap** it.
12. Select text then type a wrapping character — `` ` `` `"` `'` `(` `<` `{` `[` `*` `_` `~` — must wrap
    the selection instead of replacing it.
13. Nested formatting: `*bold with _italic_ inside*`, `` *bold with `code`* ``, links inside bold.
14. Code block: type ```` ``` ````, newline, code, newline, ```` ``` ```` → renders as a mono block,
    text still editable, caret still movable inside it.

**C. Undo / redo (new custom implementation, no native fallback)**

15. Type a sentence, Cmd/Ctrl+Z → undo comes back in word-ish chunks (whitespace and >1s pauses are
    step boundaries), not one character at a time and not everything at once.
16. Cmd/Ctrl+Shift+Z and (Windows/Linux) Ctrl+Y redo.
17. Undo a formatting change → single step, no ghost intermediate step.
18. Send a message, focus the composer, Cmd/Ctrl+Z → the sent text is restored (documented behaviour
    in the spec — confirm this is what product wants).
19. Switch rooms mid-typing then undo → history must not leak the other room's text.
20. Undo/redo via the browser Edit menu / right-click menu — best-effort only, expected to be flaky.
21. IME (Japanese/Chinese/Korean): a whole composition must undo as one step; no mid-composition
    re-render.

**D. Popups and pickers**

22. `@mention` (user, `@all`, `@here`), `#channel`, `/slashcommand` with preview, emoji `:` autocomplete
    → filtering, arrow keys, Enter selects without sending, Escape closes.
23. Emoji picker button; `useEmojis` preference off → picker must not open.
24. Slash-command preview in E2EE rooms (blocked unless `E2E_Allow_Unencrypted_Messages`).

**E. Drafts**

25. Type, switch room, come back → draft restored. Local key `messagebox_<rid>[-<tmid>]`
    (localStorage), persisted debounced 300 ms; flushed to `POST /v1/rooms.saveDraft` when the
    composer unmounts ([useDraft.ts](apps/meteor/client/views/room/composer/messageBox/hooks/useDraft.ts)).
26. Reload mid-typing → draft survives; draft text is raw Markdown (`*bold*`), never HTML.
27. Thread composer drafts, and the sidebar draft indicator, still behave.

**F. Everything else that must not regress**

28. Send behaviour under all three `sendOnEnter` preferences (`normal`, `alternative`, `desktop`) plus
    mobile/touch; Shift+Enter always inserts a newline.
29. Edit a message (up-arrow on empty composer, or message action) → composer preloads the message,
    caret at end, Escape/Cancel resets it.
30. Quote / reply chains (`Message_QuoteChainLimit`), dismiss quote.
31. Arrow-up on an empty composer navigates to the previous message; arrow-down at the end navigates
    forward; Alt+arrow variants.
32. Paste: plain text, multi-line text, rich text/HTML from a browser or Word (should paste as text),
    an image (should start an upload named `Clipboard - <date>`), a file, drag-and-drop.
33. Uploads while typing; audio and video message recorders; expand/collapse button (appears once the
    composer grows past ~100px).
34. Read-only channel / not-a-member (Join button), archived room, federated room, E2EE room banner.
35. Screen reader pass (VoiceOver / NVDA): the composer is announced as a textbox with the room
    placeholder as its label; caret movement is announced; markup spans do not spam announcements.

## 17. Expected-broken today — do not file duplicates

| Symptom | Status |
| --- | --- |
| An **asterisk list** (`* item`), a list with irregular spacing (`-  item`, `-\titem`, `1.  item`), or a padded number (`01. item`) shows no marker emphasis — and while it is on screen the rest of the message renders unstyled too | Known — the AST does not carry the typed marker, so the render fails the text guard and falls back to plain text for the whole composer. No text is lost. |
| A **task** (`- [ ] x`) renders as plain text | Known — only unordered and ordered lists are styled so far. |
| A message consisting of **only emoji** vanishes (parser emits `BIG_EMOJI`, renderer has no case) | Same root cause as above. |
| With `Katex_Enabled`, typing KaTeX (`$$x^2$$`) vanishes; the KaTeX toolbar button inserts text that disappears | Same root cause. KaTeX is intentionally not rendered in the composer. |
| Colour codes and timestamp syntax vanish | Same root cause. |
| `@mentions` and `#channels` show as styled raw text, not resolved user/channel | Known gap — requirement is parity with the message list, resolvers are not wired yet. |
| Slack-style links `<https://x\|label>` misbehave | Known — `protectLinks` workaround. |
| Links in the composer are **not clickable** | Intentional: rendered as a styled span, not `<a>`. |
| Markdown markers stay visible (`*` around bold) | Intentional — not full WYSIWYG. |
| The `message-composer-history` Playwright suite is skipped | Known, blocked on Feature Preview cache/reload behaviour. |
| Hint chip text "Experiment: Real Time Composer" is untranslated English | Known, pre-GA cleanup. |

## 18. Parser-parity check procedure

Parity is a hard acceptance criterion, so test it as a diff, not by eyeballing one case:

1. Type the sample in the composer, screenshot the composer.
2. Send it, screenshot the rendered message.
3. Compare **structure and styling**, allowing for the intentional differences below.

Intentional differences (not bugs): markers visible in the composer; links not clickable; no KaTeX;
no colour swatches; no timestamps; no big-emoji scaling; code blocks styled inline rather than as a
full-width block; mentions not yet resolved (temporary — see §17).

Anything else that differs — a run styled in one place and not the other, different text after a
round trip, whitespace collapsed, characters lost — is a parity bug. The strongest invariant to test:
**what you typed must equal what gets sent.** Type a sample, copy it out of the composer, send, then
compare the sent message's raw source (message actions → copy text, or the API) to what you typed.

Suggested sample corpus: `*bold*`, `_italic_`, `~strike~`, `` `code` ``, fenced blocks with and
without a language, `> quote` and multi-line quotes, `||spoiler||`, `# heading` levels 1–4, links in
all supported forms, bare URLs, emails, `:emoji:` and unicode emoji and ASCII emoticons, `@user`
`@all` `#channel`, nested combinations, and adversarial input: unmatched markers (`*bold`), markers
inside words, `\*escaped\*`, very long unbroken strings, RTL text, CJK text, zero-width characters,
trailing/leading whitespace, many consecutive blank lines.

## 19. Performance and platform matrix

No latency budget or instrumentation exists yet, so treat perf as exploratory but report numbers.
Every keystroke runs: 4 regexes over the whole text, a full parse, a React
`renderToStaticMarkup`, a full `innerHTML` replacement, and a caret remap that scans the offset map
linearly. Cost therefore grows with the total length of the composer content, not with the edit.

Perf scenarios: type continuously in a composer that already holds ~5 000 characters / ~200 lines;
hold a key down; paste a very large block of text; type inside a long fenced code block; type with
the composer expanded; the same on a low-end machine and on a touch device. Watch for dropped
characters, visible lag, and caret drift — dropped characters and caret drift are release blockers.

Platform matrix (contenteditable and `execCommand` behaviour vary a lot between engines):

- Chrome/Edge, Firefox, Safari (Safari is the usual outlier for `execCommand('insertText')` and
  selection restoration).
- macOS (Cmd) vs Windows/Linux (Ctrl) for all shortcuts and undo/redo, including Ctrl+Y.
- IME input on all three engines.
- Touch/coarse-pointer devices: autofocus is deliberately disabled there, and mobile keyboards force
  send-on-Enter — verify both.
- Desktop app (Electron) in addition to the browsers.
