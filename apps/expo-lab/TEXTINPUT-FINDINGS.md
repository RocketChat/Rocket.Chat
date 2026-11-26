# TextInput findings for the composer intent

Question from `COMPOSER-INTENT.md` ("What would make this intent wrong", item 3): can a React Native `TextInput` carry what the web composer does: controlled value, reliable selection and programmatic edits, multiline growth, IME-safe popups.

Evidence kinds, kept apart on purpose:

- **Observed**: run on the iPhone 17 Pro simulator (iOS 26.5, React Native 0.88.1, New Architecture: `nativeFabricUIManager` present), by a scripted lab, `src/ComposerLab.tsx` (open it with `EXPO_PUBLIC_COMPOSER_LAB=1`, or the "Composer lab" button on the plain login, which skips the Fuselage part). The script posts its rows and events to a local sink; the raw data is in `/tmp/expolab/composer/results.json` (not committed). Screenshots are in `docs/composer/`.
- **Code-read**: read from `node_modules/react-native` (`TextInput.js`, `RCTTextInputComponentView.mm`, `TextInputEventEmitter.cpp`) and from this tree. Marked as such.
- **Not testable here**: see the list below.

## What the lab can and cannot read back

There is no JS API to read the native caret or selection. What the lab used:

- Native text: `onEndEditing` carries the native text, so `focus()` then `blur()` reads exactly what the native view holds (a "probe").
- Native selection length: `selectTextOnFocus` makes native emit `onSelectionChange` with the whole range.
- Selection and caret position after a programmatic edit: screenshots only (a highlighted range). A collapsed caret is not reliably captured (it blinks), so **caret position after an edit is not verified by observation**; the "selection" part of each formatting row below is the intended value from the web arithmetic, and the native text part is observed.
- Heights: `onLayout`, `onContentSizeChange`, `onScroll` (which also carries `contentSize`).

The web helper logic was mirrored as plain TS in `src/composerLabOps.ts` (not imported): `wrapSelection` from `createComposerAPI.wrapSelection`, `insertText` from `createComposerAPICore.insertText`, `replaceText` from `createComposerAPI.replaceText`. The web bold pattern is `*{{text}}*` (single asterisk, `messageBoxFormatting.ts`); `**` was also run because the task listed it.

## Results

Three configurations ran the same script: `raw-ref` (uncontrolled selection, `ref.setSelection`), `raw-prop` (controlled `selection` prop), `fuselage-ref` (Fuselage `TextAreaInput`, selection through the ref). Rows below are identical across them unless a column says otherwise. "Native text" means the probe read it back.

| # | Case | Expected | Observed | Verdict | Evidence |
|---|------|----------|----------|---------|----------|
| 1a | `setText('hello')`, then clear, then 3600 chars | native text equals state | equal in all three configs | pass | results.json rows 1a to 1c |
| 1a | `onChangeText` for programmatic changes | never fires | 0 events for set, clear, long text, rapid sets, same value | pass | rows 1a, 1c, 1d, 1f |
| 1d | three `setText` in one tick; four a timer tick apart | last value wins | `ABC`; `four` | pass | rows 1d |
| 1e | CRLF, tab, NBSP, ZWSP, combining mark | kept as is | identical | pass | row 1e |
| 1 | flicker, lost update under real typing | none | not observable (no frame capture, no typing) | untested | - |
| 2a | `onSelectionChange` after programmatic selection 6..11 | `{6,11}` reported | **not fired** in any config | fail | row 2a |
| 2b | `ref.setSelection(6,11)` after text settled | "world" highlighted | highlighted | pass (visual) | `raw-ref-sel-world.png` |
| 2c | ref: `setText(new)` then `setSelection` in the same tick (selection before the value reaches native) | new range highlighted | **no highlight**: selection lost | fail (visual) | `raw-ref-sel-sametick.png` |
| 2d | ref: selection 5..8 set while text is `ab`, then text `abcdefghij` | 5..8 highlighted | **no highlight**: selection lost | fail (visual) | `raw-ref-sel-selection-first.png` |
| 2e | prop: text and `selection` in one render | range highlighted | highlighted ("cruel") | pass (visual) | `raw-prop-sel-sametick.png` |
| 2f | prop: selection set first, text a render later | range highlighted | highlighted ("fgh"); the prop is kept | pass (visual) | `raw-prop-sel-selection-first.png` |
| 2g | selection 6..11, then text becomes `hello world!!!` | see note | prop: "world" still selected; ref: selection gone (no highlight) | prop pass, ref differs | `raw-prop-sel-after-append.png`, `raw-ref-sel-after-append.png` |
| 2h | Fuselage `TextAreaInput`, `ref.setSelection(6,11)` | highlighted | highlighted; `ref` reaches the native input | pass (visual) | `fuselage-ref-sel-world.png` |
| 3 | wrap `*`, `**`, `_`, `` ` ``, `~`, code block around "world" (6..11) | native text equals web result (`hello *world*`, ...) | equal for all six, all configs | pass (text) | rows 3 wrap |
| 3 | wrap twice toggles off (web behavior) | `hello world` | equal | pass (text) | row "second wrap toggles off" |
| 3 | empty selection at 5, wrap `*` | `hello** world`, caret between | text equal; caret position not observed | pass (text), caret untested | row 3 empty |
| 3 | final selection equals web's | web: the wrapped text stays selected | text only; selection set from the same numbers, native honors a non-empty range (2b, 2e) | partial | see 2b to 2f |
| 3 | UTF-16 offsets for emoji, ZWJ family, combining mark | native uses UTF-16 | `selectAll` reports end 17 for a string with `.length` 17 (13 code points); `setSelection(4,12)` highlights the whole ZWJ family | pass | row "UTF-16 offset", `raw-ref-unicode-select-family.png` |
| 3 | wrap around a surrogate pair (1..3) | `a*😀*b...` | text equal | pass (text) | row 3 surrogate |
| 4 | mention: `hi @a` caret 5, replace 3..5 with `@ada ` | `hi @ada ` caret 8 | native text equal in raw-ref and fuselage-ref; in raw-prop the probe returned no value for the mention and emoji rows (see Surprises); the sink log holds the correct text (`end` events `hi @ada `, `say :smile: now`) | pass (text), probe flaw in raw-prop | rows 4, events 292, 295 of the raw-prop run |
| 4 | `:smile:` at caret 4; newline at end; insert over a selection | `say :smile: now`; `line1\n`; `hello X` | equal; the caret position after each is not observed | pass (text), caret untested | rows 4 |
| 5 | growth 1, 3, 10, 40 lines | 52 min, 155 max | field 52, 81, 155, 155 (content 37, 79, 226, 855) | pass | row "5 heights" |
| 5 | clamp keeps the caret visible; scrolls | offset + field about content | caret at end: `y 693`, field 153, content 855 (gap is the padding); caret to start scrolls back to the top (`y 8`, the padding) | pass | rows 5, `raw-ref-growth-40-end.png` not committed |
| 5 | `onContentSizeChange` tracks content | equals content height | **stale once clamped**: reports 226 while `onScroll` says 855; with 600 unbroken chars it still said 37 while the field showed 8 wrapped lines | fail | row 5 content height, `raw-ref-growth-unbroken.png` |
| 5 | clear shrinks back; unbroken text | back to 52; wraps | 52; wraps by character, clamped at 155, scrolls | pass | row 5 heights |
| 6 | props accepted: `returnKeyType='default'`, `enterKeyHint`, `autoCorrect`, `autoCapitalize`, `spellCheck`, `textContentType`, `autoComplete` | accepted | accepted without error; their effect on the keyboard is not observable here | untested | - |
| 7 | event order of `focus()` then `blur()` | - | `focus`, `end`, `blur` (the `end` carries the native text) | info | row 7 |
| 7 | `onKeyPress`, `onChangeText`, selection order under typing | - | no typing possible | untested | - |

Note on 2g: the prop case keeps the range because the controlled prop is re-applied; the ref case has no such memory, and native moved the caret itself.

## Not testable here

- IME composition, dictation, the emoji keyboard, autocorrect behavior: no keyboard automation. The effect of `autoCorrect`, `enterKeyHint`, `returnKeyType` on the keyboard was not seen.
- Real typing: so `onChangeText`, `onKeyPress` and the real `onSelectionChange` order, the lost update when JS rewrites a value while the user types, and flicker under that load were not exercised.
- Paste, hardware keyboard, selection by touch and the native selection menu.
- Android (not run at all).
- Any pixel-level caret position after an edit (see above).
- Frame-level flicker for programmatic changes.

## Code-read (not observed)

- `onPaste` does not exist on `TextInput` in 0.88.1: no `onPaste` in `TextInput.flow.js` or in the Fabric event emitter. iOS marks pasted text (`_textWasPasted` in `RCTUITextView.mm`) only to skip `onKeyPress` for it; a paste arrives as an ordinary `onChange`. A web-style "paste HTML or image" handler has no hook; image paste is not reachable.
- `onKeyPress` delivers `key` from the replacement text: `Backspace` for an empty replacement, `Enter` for `\n`, `Tab`, `Escape`, otherwise the typed text itself (`TextInputEventEmitter.cpp`). No modifier flags. It is not sent for pasted text.
- `onSelectionChange` is suppressed while native applies a value or selection from JS: `setTextAndSelection` and `updateState` set `_comingFromJS`, and the selection is set with `notifyDelegate:NO` (`RCTTextInputComponentView.mm`). This is why 2a never fires. JS learns the caret only from user actions.
- Event order: on iOS a multiline `UITextView` reports selection change before change; the component calls `onChange` first and swallows the duplicate (`_ignoreNextTextInputCall`), so JS sees change then selection.
- Programmatic text keeps the caret at the same distance from the end of the text (`_setAttributedString`), not at its old index.
- Edit versioning: `setTextAndSelection` is dropped when `mostRecentEventCount` (the count of native edits JS has seen) does not match native's. A JS value or selection write issued while the user types is silently discarded. `ref.setSelection` passes the count captured at the last render, so a same-tick call after `setText` reaches native before the new value and is applied to the old text (2c, 2d).
- The controlled `selection` prop is sent together with the text in one command when both changed in the same render, which is why the prop path holds in both orders (2e, 2f).
- IME: JS gets `onChange` while text is marked (composition). `_setAttributedString` skips a write whose text equals native's (`_textOf:equals:`), so a controlled input that echoes the value it received is safe. A JS value that differs from what native holds during composition (a transform, a trim, a rewrite from a popup) replaces the marked text and ends the composition. This is a code-read; it was not reproduced.
- Fuselage host map, `bridgeInputProps.native.ts` and `resolveHost.native.ts`: a `textarea` becomes `multiline` with `numberOfLines={rows}`; `onChange` becomes `onChangeText` and is called with the string, not an event (a different contract from web); `readOnly` and `disabled` become `editable={false}`; `autoCorrect` `'on'`/`'off'` becomes a boolean; `type` maps to `keyboardType`, `returnKeyType='search'`, `autoCapitalize='none'` or `secureTextEntry`. Everything else is passed through untouched by `Box`, so React Native props reach the `TextInput` when set. It does **not** map: web `inputMode`, `enterKeyHint` semantics, `autoComplete` web tokens, `onInput`, `onKeyDown`/`onKeyUp`, `onPaste`, `maxLength` (same name, passes), `selectionStart`/`selectionEnd` and `setSelectionRange` (web names). Nothing sets `submitBehavior`, `selection`, `textContentType`, `spellCheck`. A multiline field's default `submitBehavior` is `newline` (`TextInput.js`: multiline, `blurOnSubmit` not true), so Enter inserts a line; `onSubmitEditing` does not fire in that mode.

## Fuselage `TextAreaInput` against the raw `TextInput`

Same script, same results for every observed row, except: the `ref` reaches the native input (so `setSelection`, `focus`, `blur`, `isFocused` work), and `onChange` receives a string. What the bridge loses is by construction, not by loss at runtime: web-named props (`selectionStart`, `inputMode`) do nothing, and web handlers (`onKeyDown`, `onInput`, `onPaste`) never fire. The style props of the field were not tested through the Fuselage path (the lab used a plain `style`).

## Surprises

1. A programmatic selection is never reported back, and there is no way to read it. The composer must own the "intended selection" itself and treat native as write-only for programmatic edits.
2. `ref.setSelection` is order-sensitive and lossy: a call in the same tick as `setText`, or before the value lands, is dropped (no error). The controlled `selection` prop does not have this problem in either order.
3. With the ref path, a value change after a selection discards the selection; the controlled prop keeps it. This is the difference that matters for "wrap the selection".
4. `onContentSizeChange` is unreliable as a height source: it only fires when layout changes, and went stale at the clamp and for unbroken text. `onScroll` carried the true `contentSize`.
5. The probe returned no value for two rows in `raw-prop` only, while the event log shows the correct native text arrived. The cause was not found (a harness timing issue is the likely reading, not a native one); those two rows are reported as text pass with the flaw stated, not as proven.
6. The dev client's floating menu button overlaps the field in every screenshot (top left); it is not part of the app.

## Implications for the composer intent

- Assumption 3 of "What would make this intent wrong" holds for iOS only, and only with a design constraint: a controlled `TextInput` holds text and a non-empty selection reliably when the app drives selection through the controlled `selection` prop and sends text and selection in the same render. It does not hold if the implementation uses `ref.setSelection`.
- Outcome 12 (wrap the selection): the text result matched the web arithmetic exactly for every pattern, including toggle and surrogate pairs, and offsets are UTF-16 as on the web. Native can show the resulting selection when set through the prop. Collapsed-caret placement after a wrap was not observed.
- Outcome 9 (mention insertion): plain-text mentions with a replace range hold: the text came out right. The caret placement after replacement was not observed; set it through the prop, as above.
- Outcome 2 (growth 52 to 155, scroll inside): holds natively with `minHeight`/`maxHeight` styles; do not drive height from `onContentSizeChange`.
- Outcome 18 (IME): not tested. Code-read says a controlled value that always echoes the native text is safe, and any rewrite of the value during composition is not.
- A native `ComposerAPI` implementation cannot read the selection the way web does (`input.selectionStart`). It has to keep `selection` in state, updated from `onSelectionChange` for user actions and from the edit itself for programmatic ones. `ComposerAPI.selection`, `getCursorPosition` and `wrapSelection` can be implemented over that; the pure string functions (`wrapSelection`, `insertText`, `replaceText`) can be shared as they are.
- Outcome 3 and Q1: Enter inserts a newline by default on a multiline field; `onKeyPress` reports `Enter` with no modifiers, so there is no "Shift+Enter sends" on native.
- Outcome 11 and the "image paste" question (Q14): there is no paste event; leave image paste out, as Q14 recommends.

Recommendations for the intent:

1. Add to Constraints: native composer state is `{ text, selection }` in React state, with the controlled `selection` prop as the only way to place the caret programmatically; `ref.setSelection` is not used for edits.
2. Add to "Stays web-only": paste interception and modifier-key submit; native has neither event.
3. Replace "check first with a small prototype on both platforms" with: iOS prototype done (this document); Android still to do, and it is the larger risk (a different native component and event counting). Do not assume the iOS result carries over.
4. Keep Q2 (plain-text mentions): confirmed workable.
5. Add an open gap for IME: a decision that popups never rewrite the field value while a composition is active, to be verified on a device with a real keyboard before the spec is accepted.
6. Height: specify min and max as styles and say not to use `onContentSizeChange`.
