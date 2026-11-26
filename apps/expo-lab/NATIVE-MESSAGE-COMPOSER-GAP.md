# Gap analysis: the web message component and composer on React Native

Question: what is missing for the Expo chat (`apps/expo-lab`, today `src/fuselage/FuselageRoom.tsx` with Fuselage `Message` parts and a bare `TextInput`) to render messages with the real web message component and to use the real web composer?

Evidence tags: **[M]** measured by the commands in section 2, **[R]** read from the code, **[I]** inferred, not run. Nothing here was run on a device; no login was made.

Trees analysed: this branch (`feat/expo-lab-all`, develop-based, tip 14595e019ac) for the web code; `origin/message-list/09-thread-list-and-cleanup` (fd7b3f50e47) for the `ui-message-list` stack (#43721 to #43730, one package, spec-first, replaces the room and thread lists).

## 1. Summary and verdict

| Area | Verdict |
| --- | --- |
| Message component, as it is on develop (`apps/meteor/client/components/message`) | Not reusable on RN. 155 files, 0 Meteor hits [M], but it reads app singletons (`useChat`, `RoomManager`, `stores`, `lib/*`: 147 relative imports reaching 3+ levels up) and its toolbar and reactions need CSS hover and DOM. Superseded by the stack. |
| Message component, as the stack ships it (`packages/ui-message-list`) | Closest candidate. 180 files, 8,095 lines, 0 Meteor, 0 `.native` files, 0 `selection`/`clipboard`/`File` hits [M]. It is already the view-isolation shape: 11 intent-named contexts with defaults, injected `Markup`, `Emoji`, `UiKitMessageBlock` renderers, no `gazzodown` import. Only 10 raw host-tag hits and 8 `Box is='tag'` hits in the whole package [M]. The blockers are Fuselage on native (24 of the 66 Fuselage components it imports throw, 1 renders empty [M]), `Box` styling props, a native Markup renderer, and the list engine (virtua + DOM scroll bridge). |
| Markup (gazzodown) | Needs a native twin or a native renderer injected through `MessageRenderersContext`. 47 files, 37 host-tag hits in 22 files [M], katex and highlight.js write HTML into the DOM. `@rocket.chat/message-parser` itself is DOM-free (0 hits [M]). |
| List engine (`MessageList`) | Pure parts reusable as is (reducer 423 lines, row builder, diff, `isSequentialMessage`); the DOM bridge `useMessageListScroller.ts` (622 lines: ResizeObserver, wheel/touch/keydown/scrollend listeners, `scrollTop`, `getBoundingClientRect`, `querySelectorAll`) needs a native twin or a FlatList-based replacement. |
| Composer (`views/room/composer`, `packages/ui-composer`) | Needs redesign, not a twin of the leaf components. The text model is a DOM textarea (or contenteditable behind a feature preview): 74 selection/`execCommand` hits in `messageBox` [M], `createComposerAPICore` takes an `HTMLElement` and dispatches DOM events. The seam exists: `ComposerAPI` in `lib/chats/ChatAPI.ts` is a plain type (text, selection, setText, wrapSelection, insertText, replaceText, subscribables). A native implementation of that type over an RN `TextInput`, plus a native `MessageBox`, is the work. No intent, spec or PR in the isolation plan covers it (phase 1 says `createComposerAPI` stays web-only). |
| Data layer | Usable. `lib/chats/*` talks to the server through `sdk.rest` and `sdk.stream` (0 Meteor hits in `lib/chats`, `ChatMessages`, the composer, the message tree [M]); expo-lab already uses the same SDK (`DDPSDK`). `lib/SDKClient.ts` imports a Meteor shim (`../meteor/connection`), so a native `ServerContext`/`sdk` has to be provided instead of reusing that module. |

Reusable as is: `message-parser`, the stack's pure row/scroll logic and contexts, `ui-contexts` (116 files, only 1 file with `File`/`navigator`), `ComposerAPI` and `DataAPI` types, `formattingButtons` data, `useComposerBoxPopup` queries, `ComposerPopupProvider` options.
Needs a twin: markup renderer, emoji renderer, list engine bridge, composer input and `ComposerAPI` implementation, popups, toolbar reveal, media (image/video/audio), draft storage, file picker.
Needs redesign: message toolbar interaction (hover reveal, react-aria toolbar), user card (hover), composer text model and keyboard shortcuts, emoji picker, recorders.

## 2. Method and commands

All counts are over `*.ts`/`*.tsx` excluding `*.spec.*`, `*.stories.*`, `stories/`, `.d.ts`, `tests/`, unless said otherwise. Per-unit script (not committed): for each path it lists files and lines and, per category, `files/hits` using `grep -lE` and `grep -hE | wc -l`. Regexes:

| Category | Regex |
| --- | --- |
| Meteor | `Meteor\.\|from 'meteor/\|Tracker\|Session\.\|ReactiveVar\|Accounts\.` |
| document/window | `\bdocument\.\|\bwindow\.\|\bwindow\b[,)]` |
| observers | `ResizeObserver\|IntersectionObserver\|MutationObserver\|matchMedia` |
| selection | `getSelection\|createRange\|\bRange\b\|contentEditable\|contenteditable\|setSelectionRange\|selectionStart\|selectionEnd\|execCommand` |
| clipboard/drag | `clipboard\|ClipboardEvent\|DataTransfer\|onDrop\|onPaste\|dragover\|onDragOver` |
| file/blob | `\bFile\b\|\bBlob\b\|FileReader\|URL\.createObjectURL\|FormData\|MediaRecorder\|getUserMedia` |
| storage | `localStorage\|sessionStorage\|indexedDB` |
| navigator | `navigator\.` |
| scroll DOM | `scrollIntoView\|scrollTop\|scrollHeight\|clientHeight\|getBoundingClientRect\|offsetHeight\|scrollTo\(` |
| web libs | `virtua\|react-virtuoso\|react-aria\|@react-aria\|dompurify\|katex\|highlight\.js\|prism\|emojione\|react-dom\|css-in-js\|@react-stately` |
| className | ``className=\|rcx-\|css` `` |
| DOM events | `onClick\|onMouse\|onKeyDown\|onKeyUp\|onFocus\|onBlur\|onContextMenu\|onPointer\|onWheel\|onScroll\|onTouch` |
| aria/role | `aria-\|role=` |
| host tags | `<(div\|span\|a\|img\|input\|textarea\|button\|ul\|ol\|li\|p\|pre\|code\|table\|tr\|td\|th\|iframe\|video\|audio\|svg\|canvas\|section\|label\|form\|select\|blockquote\|strong\|em\|del\|h[1-6]\|br\|hr\|mark\|kbd)[ >/]` |

Other commands:

- Stack package read from a tar of the branch: `git fetch origin message-list/09-thread-list-and-cleanup`, `git archive -o <tmp>.tar origin/message-list/09-thread-list-and-cleanup packages/ui-message-list`, extracted outside the repo. PRs listed with `gh pr list --search "ui-message-list" --state open --json number,headRefName,baseRefName`.
- Fuselage components used per area: a script that reads `import { ... } from '@rocket.chat/fuselage'` in each tree, then matched by name against `/tmp/expolab/sweep-v4/raw/results.json` (the step-3 sweep: 208 render, 72 throw, 6 empty, 10 pending of 296; the raw file is not committed). Note that `NATIVE-SWEEP.md`'s per-component table is the older first run; the latest status per component is in the raw file and was used here.
- Imports by source: `grep -hE "from '@rocket.chat/ui-contexts'"` etc. per tree.
- `Box` usage: `grep -rE "<Box"` per tree.
- Host-tag detail in gazzodown: `grep -rnoE` for the tags listed above plus `is='tag'`.
- Native Box path read in `packages/fuselage/src/components/Box/Box.tsx`, `useStylingProps.ts`, `hooks/useStyle.ts`, `helpers/resolveHost.native.ts`.

## 3. Message component: unit-by-unit

Web files are under `apps/meteor/client/components/message` unless a path starts with `packages/`. "Stack" = `packages/ui-message-list/src` on the tip branch. Counts are `files/hits` [M] unless noted.

| Unit | Web implementation | Dependency categories (web tree) | Stack equivalent and what it changes | Native readiness | Gap, minimal change, owner |
| --- | --- | --- | --- | --- | --- |
| Message row shell | `variants/RoomMessage.tsx` (`Message`, `MessageLeftContainer`, `MessageContainer`, `CheckBox`); `variants/` 9 files, 887 lines | reads `useUserId`, `useUserCard`, `useIsMessageHighlight`, `useIsSelecting` hooks directly; `role`, `tabIndex`, `aria-labelledby`, `data-*`, `onClick`, `onKeyDown`, class `message-toolbar-scope` (CSS reveal); aria 7/19, data-attr 3/12 | `Message/variants/RoomMessage` (+ System, Thread, ThreadPreview), 10 files, 755 lines, 0 host tags; selection/editing/row state from contexts [R] | Fuselage `Message`, `MessageLeftContainer`, `MessageContainer` render (container needs element children) [M]. `CheckBox` renders without its mark (NATIVE-GAP). `aria-*`/`data-*`/`onKeyDown` are ignored by RN [I] | Props like `onClick` become `onPress` through the host map [R]; no change needed to render. Owner: expo-lab provides contexts; Fuselage native for CheckBox |
| Content body and markup | `MessageContentBody.tsx` (`MessageBody` + `Suspense` + `GazzodownText` + `Markup`) | gazzodown: see section 4 | `Message/MessageContentBody.tsx` calls `useMessageRenderers().Markup` (injected) | `MessageBody` renders [M]; the markup under it does not | Native `Markup` provided through `MessageRenderersContext`. Owner: new work in expo-lab first, then a `.native` twin in gazzodown (isolation plan item 7 says the native twin lives in `client/components/message`) |
| Header | `MessageHeader.tsx`, `header/` 3 files, 79 lines; roles (`MessageRoles`) | 0 DOM hits; DOM events 2/3, aria 2/3 | `Message/MessageHeader.tsx` + `header/` 4 files, 91 lines, 0 deps [M] | `MessageHeader`, `MessageName`, `MessageUsername`, `MessageTimestamp`, `MessageNameContainer` render [M]; `MessageRole` renders since step 2 [M]; `MessageSystemName` throws (`span`) [M] | Already works in the current expo-lab room for name/username/time. Only `MessageSystemName` needs a frame. Owner: Fuselage native |
| Avatar and user card | `packages/ui-avatar` `MessageAvatar` (7 files, 167 lines, className 2/3); `useUserCard` from `ui-contexts` opens the card on `onMouseEnter` | hover (no hover on touch), `onClick`; app provider `views/room/providers/UserCardProvider.tsx` uses `document` 1/1 | `MessageAuthorAvatar.tsx` over `ui-avatar` | `Avatar` renders since step 3, SVG default avatars through `src/AppAvatar.tsx` (SvgXml) [M, README] | Native avatar via `AvatarUrlContext` + `AppAvatar` twin of `ui-avatar`; card opens on press, via a native `UserCardContext` value. Owner: expo-lab (avatar), expo-lab (card context) |
| Toolbar and actions | `MessageToolbarHolder.tsx` (IntersectionObserver via `useIsVisible`, lazy), `toolbar/` 46 files, 2,182 lines: `MessageToolbar.tsx` uses `@react-aria/toolbar`; CSS reveal `MessageToolbarReveal.css` (hover, focus-within, `:has()`); action menu `MessageToolbarActionMenu.tsx`; clipboard 2/2, navigator 2/2, domEvents 8/11 | web-only by design: hover reveal, react-aria toolbar and menus, `GenericMenu` | `Message/MessageToolbarHolder.tsx` + `toolbar/` 22 files, 812 lines; keeps `useIsVisible`, `MessageToolbarWrapper` and `useToolbar` (2 files with `@react-aria`); has `items/MobileItems.tsx` already [M]; actions arrive through `MessageToolbarContext`, implemented in `apps/meteor/client/providers/MessagesProvider/actions/*` (25 non-spec files) | `MessageToolbar` and `MessageToolbarWrapper` throw (`div`) [M]; `MessageToolbarItem` renders [M]. Hover reveal does not exist on touch | Redesign the trigger: long-press or tap opens a native action sheet fed by the same `MessageToolbarContext` items (`MobileItems` is the starting list). `useIsVisible` has a DOM implementation; a native one is a view-visibility hook. Owner: expo-lab for the sheet; Fuselage native for the two frames; isolation plan for the context |
| Reactions | `content/Reactions.tsx`, `content/reactions/` 3 files, 206 lines | domEvents 1/5, `@react-aria/toolbar`; emoji by CSS class (`getEmojiClassNameAndDataTitle`, background-image sprite) | `Message/content/Reactions.tsx`, `content/reactions/` (`Reaction`, `ReactionTooltip`) | `MessageReaction`, `MessageReactionAction`, `MessageReactionCounter`, `MessageReactionEmoji`, `MessageReactions` all throw [M] | 5 Fuselage frames; native `Emoji` renderer (unicode text, or `Image` for custom). Tooltip on hover becomes long-press. Owner: Fuselage native (5), expo-lab (emoji) |
| Attachments and previews | `content/attachments/` 40 files, 1,547 lines; `content/urlPreviews/` 14 files; `content/location/`; `AudioPlayer`/`video` | doc 2/6 (`window.location.origin`), file/blob 1/1, web libs 5/5, className 9/16, domEvents 6/6; raw `<img>`, `<video controls>`, `Box is='picture'`, `Box is='a'` | `content/attachments/` + `urlPreviews/` + `location/` in the stack: 2 raw tags (`<video>`, `<img>`) and 8 `Box is='tag'` (video, img, picture, blockquote, a x3, span); `OEmbedHtmlPreview` uses `dompurify`; `useReloadOnError` and `GenericFileAttachment` use `window.location` (3 sites); `userAgentMIMETypeFallback` uses `navigator.userAgent`; image gallery opens by class `gallery-item` | `AudioPlayer`, `AudioPlayerControls` throw (`input`) [M]; `MessageGenericPreview*` 8 components throw [M]; no RN `Image` with SVG, no `video`/`audio` host | Image: RN `Image` (already used by Avatar). Video/audio: expo-video/expo-audio twins of 3 files (`ImageAttachment`, `VideoAttachment`, `AudioAttachment`). GenericPreview 8 frames. `dompurify`/`window.location`: hooks behind `ui-client` twins. Owner: Fuselage native (10 frames), expo-lab (media), isolation plan (hooks) |
| System and thread variants | `variants/SystemMessage.tsx`, `ThreadMessage.tsx`, `ThreadMessagePreview.tsx`; `content/ThreadMetrics*.tsx` (`useResizeObserver`) | aria 1/1 each; ThreadMetrics uses `useResizeObserver` (fuselage-hooks, guarded since step 1) | stack variants, `ThreadMetrics*` 5 files | `MessageSystem`, `MessageSystemContainer`, `MessageSystemBlock` render; `MessageSystemBody`, `MessageSystemName` throw [M]. `ThreadMessage`, `ThreadMessageRow` render; `ThreadMessageBody`, `ThreadMessageContainer`, `ThreadMessageOrigin` throw [M]. `MessageMetrics*` render except `MessageMetricsItemAvatarRowContent` [M] | 5 + 1 frames. Owner: Fuselage native |
| UiKit blocks in a message | `uikit/` 3 files, 201 lines | doc 1/1 | injected `UiKitMessageBlock` renderer; the package does not depend on `fuselage-ui-kit` | `fuselage-ui-kit` native status not measured here | Out of the first milestone: render nothing or a fallback. Owner: not planned (open decision) |
| Message data and normalisation | `list/MessageListContext.tsx`, `views/room/MessageList/providers/MessageListProvider.tsx` (184 lines), `lib/createMessageNormalizer.ts` | 0 Meteor; settings, preferences, roles, translation hooks | `apps/meteor/client/providers/MessagesProvider/*` (46 non-spec files on the tip branch, 25 of them actions): `useMessageContentValue`, `...DisplayValue`, `...InteractionsValue`, `...MediaValue`, `...NavigationValue`, `...RelatedDataValue`, `...ToolbarValue`, `...EditingValue`, `normalizeMessage` | expo-lab has none: `ChatMessage` is `{ _id, rid, msg, ts, u }` only (`src/api.ts`) | A native provider that fills the 11 contexts. Defaults exist, so it can start with display, content and renderers and add the rest. Owner: expo-lab |
| Virtualized list and scroll | `views/room/MessageList/MessageList.tsx` (virtua), `useKeepAtBottom`, `useTryToJumpToMessage` | see section 5 | `MessageList/` 27 files, 2,346 lines | not ported | Section 5 |

View-isolation shape per unit [R]: the stack's `Message/*` follows it (parts take props, capabilities through `ui-contexts` and its own contexts, 0 `meteor/*`). The develop tree does not: `RoomMessage.tsx`, `MessageToolbarHolder.tsx` (calls `useChat` and `chat.data.findRoom()` inside the component) and `MessageListProvider.tsx` read context and singletons inline.

Imports by source, develop message tree vs stack [M]: `ui-contexts` 63 vs 34, `ui-client` 14 vs 24, `fuselage` 74 vs 75, relative imports 3+ levels up 147 vs 24, `stores` 6 vs 0, `lib/` 76 vs 28, `react-query` 14 vs 3.

Web-only libs in the stack, all of them [M]: `virtua` (4 files: list), `@react-aria/toolbar` (2: toolbar, reactions), `@react-aria/focus` (2: keyboard navigation hooks), `dompurify` (1: `OEmbedHtmlPreview`), `@rocket.chat/css-in-js` (10 files, 0 effect on native: `useStyle` returns no class without a document [R]), `ResizeObserver` direct (1: the scroller).

## 4. gazzodown and message-parser

`message-parser`: pure TypeScript/PEG output, 0 DOM hits in `src`; built with webpack to `dist/messageParser.js` (ESM) [M, R]. Whether Metro evaluates that bundle was not tested [not determined]. The web calls it on the client when `md` is missing (`parseMessageTextToAstMarkdown`), so the app needs it either way.

`@rocket.chat/gazzodown/src` (47 files, 1,962 lines): host-tag hits 37 in 22 files, className 6/13, katex 5 files, highlight.js 1, DOMPurify 1, `react-aria`, `react-virtuoso` and `react-dom` are in its package.json but `src` imports none of them [M]. Every node below is drawn with a Fuselage part or a raw JSX tag. Raw tags throw on RN (`View config getter callback`) unless routed through the host map; raw JSX with a literal tag is not routed (NATIVE-SWEEP, group 2).

| AST node (`Markup.tsx`, `InlineElements.tsx`) | Web file | Host tag(s) / web mechanism | Native renderer needs |
| --- | --- | --- | --- |
| `PARAGRAPH` | `blocks/ParagraphBlock.tsx` | `<div>` | `Text` as the block; inline children must be nested `Text` (a `View` cannot hold bare text) |
| `HEADING` | `blocks/HeadingBlock.tsx` | Fuselage heading part | `Text` with size/weight |
| `BIG_EMOJI`, `EMOJI` | `emoji/*`, `EmojiRenderer.tsx` | `<div>`, `<span title>`, Fuselage `MessageEmoji` with `className` sprite, `DOMPurify` for the fallback | unicode `Text` for unicode emoji, `Image` for custom; no CSS sprite; `useEmojiDescriptors` needs a native path (DOMPurify off) |
| `BOLD`, `ITALIC`, `STRIKE` | `BoldSpan.tsx`, `ItalicSpan.tsx`, `StrikeSpan.tsx` | `<strong>`, `<em>`, `<del>` | nested `Text` with `fontWeight`, `fontStyle`, `textDecorationLine` (the host map lists `strong/em/del` as text tags [R], so a frame works when the tag comes from a Fuselage/Box call, not from raw JSX) |
| `PLAIN_TEXT` | `PlainSpan.tsx` | `<mark>` for highlights, text node | `Text`; highlight as a nested `Text` with background |
| `LINK` | `LinkSpan.tsx` | `<a href rel target>`, `sanitizeUrl`, `getBaseURI` | nested `Text` with `onPress` (`Linking.openURL`), same `sanitizeUrl` (pure) |
| `INLINE_CODE` | `code/CodeElement.tsx` | `<code>` | nested `Text` with monospace and background |
| `CODE` | `code/CodeBlock.tsx` | `Box is='pre'`, `<mark>`, `useLayoutEffect` + `hljs.highlightElement` + `classList.add('hljs')`, clipboard 1/1 | `View` + `Text` monospace, horizontal `ScrollView`; highlighting needs `hljs.highlight` to tokens (or none in the first milestone); copy via expo-clipboard |
| `QUOTE` | `blocks/QuoteBlock.tsx` | `<blockquote>` | `View` with left border |
| `UNORDERED_LIST`, `ORDERED_LIST`, `TASKS` | `blocks/*ListBlock.tsx`, `TaskListBlock.tsx` | `<ul>`, `<ol>`, `<li>`, Fuselage `CheckBox` | `View` rows with bullet/number `Text`; task checkbox (CheckBox lacks its mark natively) |
| nested lists | `NestedListsBlock.tsx` | `<ul>` | indentation by depth |
| `SPOILER`, `SPOILER_BLOCK` | `SpoilerSpan.tsx`, `SpoilerBlock.tsx` | `<span>`, `<div>`, click to reveal | `Text`/`View` with `onPress` toggle |
| `TABLE` | `blocks/TableBlock.tsx` | Fuselage `Table` parts | `View` grid or horizontal `ScrollView`; Fuselage `Table` native status not measured here |
| `MENTION_USER`, `MENTION_CHANNEL` | `mentions/*Element.tsx` | Fuselage `Chip`-like parts, `onClick`, `onMouseEnter`; `MarkupInteractionContext` resolves mentions | nested `Text` with `onPress`; context value from the app |
| `COLOR` | `colors/ColorElement.tsx` | `<span>` swatch | inline `View` swatch |
| `IMAGE` | `elements/ImageElement.tsx` | `<a>`, `<img>` | `Image` (not SVG) |
| `INLINE_KATEX`, `KATEX` | `katex/*` | `katex.renderToString` + `dangerouslySetInnerHTML`, `katex.css` | no HTML sink on RN: a `WebView` or `react-native-katex`-style renderer, or show the source text |
| `TIMESTAMP` | `elements/Timestamp/index.tsx` | `<time>`, `Intl` | `Text` |
| `LINE_BREAK`, `HORIZONTAL_RULE` | `Markup.tsx` | `<br>`, rule | `"\n"`, `View` rule |

Structural point: the stack injects `Markup`, `PreviewMarkup`, `UiKitMessageBlock`, `Emoji` through `MessageRenderersContext` (`Message/contexts/MessageRenderersContext.tsx`), with the props `md`, `msg`, `mentions`, `channels`, `searchText`. A native `Markup` is therefore a context value, not a change to the package. The same holds for `Emoji` (props `emojiHandle`, `className`, `fillContainer`).

`gazzodown-alt` (20 files) is the composer's WYSIWYG markup (`ComposerMarkup`), used only by the contenteditable composer behind the `realtimeMessageComposer` feature preview; not relevant for a native `TextInput`.

## 5. The `ui-message-list` stack: what it provides and how native-ready it is

Stack: PRs #43721 (base develop) to #43730; branches `message-list/00-package-setup` to `message-list/09-thread-list-and-cleanup`; tip fd7b3f50e47. Docs in the package: 7 intents, 7 specs (`message-list.md` has R1 to R85, behaviours B1 to B21), 7 plans, ADR 0001. Specs state `status: implemented`. The package keeps no mention of React Native [M: grep of docs for native/mobile/expo returns none].

| Provides | Where |
| --- | --- |
| `MessageList` (infinite list: loaders, header, day/unread dividers, jump-to-message with highlight, restore position, paging, floating date, "New messages" and "Jump to recent" buttons, composite-list keyboard model) | `src/MessageList/` 27 files, 2,346 lines |
| Message parts and variants: `RoomMessage`, `SystemMessage`, `ThreadMessage`, `ThreadMessagePreview`, header, status, read receipts, attachments, previews, reactions, thread/discussion/broadcast metrics, toolbar | `src/Message/` 149 files, 5,409 lines |
| 11 contexts with working defaults: content, display, editing, interactions, media, navigation, related data, renderers, row state, selection, toolbar | `src/Message/contexts/` |
| Pure helpers exported: `isSequentialMessage`, `hasLiveEmbed`, types `MessageListRow`, `MessageListPosition` | `src/MessageList/index.ts` |
| App half (stays in `apps/meteor`): `MessagesProvider` with 8 `use…Value` hooks (content, display, editing, interactions, media, navigation, related data, toolbar), 25 action files, renderers (`MessageMarkup`, `MessagePreviewMarkup`, `UiKitMessageBlock`) | `apps/meteor/client/providers/MessagesProvider/` |

Native readiness of the engine [M unless noted]:

| Part | Lines | DOM reliance | Native verdict |
| --- | --- | --- | --- |
| `scroll/messageListScrollReducer.ts` | 423 | 0 DOM objects (4 grep hits are geometry field names) | reusable as is: events in, commands out |
| `lib/buildMessageListRows.ts`, `diffMessageKeys.ts`, `isSequentialMessage.ts`, `position.ts`, `dateBubble.ts`, `planRowsCommit.ts` | 105, 95, 55, 50, 77, 62 | `geometry.ts` and `dateBubble.ts` read `scrollTop`, `scrollHeight`, `clientHeight`, rect values (data in, no DOM calls) | reusable; `dateBubble` reads rects of `[data-day-divider]` through the hook |
| `scroll/useMessageListScroller.ts` | 622 | `ResizeObserver`; listeners `wheel`, `touchstart`, `touchmove`, `keydown`, `scrollend`, `focusin`, `pointerdown`; `scrollTop`/`scrollHeight`/`clientHeight`; `getBoundingClientRect`; `querySelectorAll('[data-day-divider]')`; `requestAnimationFrame` and timers; virtua `VirtualizerHandle`, `CacheSnapshot` | needs a native twin (events become `onScroll`, `onScrollBeginDrag`, `onMomentumScrollEnd`, `onLayout`, `onContentSizeChange`) |
| `MessageListVirtualizer.tsx` | ~60 | `virtua` `Virtualizer` into its own viewport element | replace with FlatList/FlashList-like virtualizer, or virtua's React Native entry if it has one [I: virtua documents React Native support; not installed in this worktree, not verified, and shift-mode behaviour on RN not checked] |
| `MessageList.tsx` + `MessageListRow.tsx` + `MessageListRows.tsx` | 11.5 KB + | `div` with `data-row-index`, `data-message-id` (5 raw host tags), css-in-js, custom scrollbars from `ui-client` (`useViewportScrollbars`) | needs a native twin; the spec's R-list is the contract to port |
| Keyboard navigation `hooks/useItemListNavigation.ts` (11.5 KB), `useMessageListNavigation.ts` | | `@react-aria/focus` focus manager and tree walker (DOM) | not applicable on touch; omit on native |

Scroll anchoring on native: the spec requires "bottom anchor, message anchor, none" with no jump when older pages prepend (R17, R18, R25 to R29). RN FlatList has `maintainVisibleContentPosition` [I: RN 0.88 supports it on both platforms; not exercised]; an inverted FlatList (what expo-lab uses today) gives bottom anchoring for free but not message anchoring or day-divider placement. DOM measurement is the main loss: the reducer's `geometry` input would come from `onLayout`/`onContentSizeChange`/`onScroll` events.

What the stack leaves out for native [M by absence]:

- no `.native` file, no `react-native` import, no native story or test;
- no Markup, Emoji or UiKit implementation (by design: injected), only fakes;
- no media implementation (image gallery by class `gallery-item`, `video`, `audio`);
- no composer (the `ComposerAPI` is mentioned by the thread/room app wiring only);
- toolbar keeps hover reveal and react-aria; `MobileItems` exists as an item set only;
- user card by hover (`onMouseEnter` in `MessageAuthorAvatar`);
- `ui-client` is its dependency for `useIsVisible`, `useFormatDate*`, `useViewportScrollbars`: `ui-client/src` has 237 files, 12 with `document`/`window`, 19 with web libs; whether the barrel imports evaluate under Metro was not tested [not determined].

## 6. Composer: unit-by-unit

Paths are under `apps/meteor/client/views/room/composer` unless noted. Counts [M].

Totals: `composer` 78 files, 4,904 lines: selection 7/75, clipboard 3/20, file/blob 3/4, storage 1/3, navigator 3/6, document 4/8, observers 1/1, scroll DOM 3/6, host tags 5/13, domEvents 24/44, 0 Meteor. `packages/ui-composer/src`: 26 files, 684 lines, 22 Fuselage imports, 23 `<Box`. `lib/createComposerAPICore.ts` + `createRichTextComposerAPI.ts` + `selectionRange.ts`: 894 lines, selection 2/61. Imports: `ui-contexts` 28, `ui-client` 16, relative 3+ up 90, `lib/` 55, `stores` 2.

| Unit | Web implementation | Dependency categories | Native readiness | Gap, minimal change, owner |
| --- | --- | --- | --- | --- |
| Container by room state | `ComposerContainer.tsx`, `ComposerMessage.tsx` (picks `MessageBox` or `RichTextMessageBox` by `FeaturePreview`), `ComposerReadOnly`, `ComposerBlocked`, `ComposerArchived`, `ComposerAnonymous`, `ComposerJoinWithPassword`, `ComposerAbacLocked` and `hooks/useMessageComposerIs*` | no DOM; reads `useRoom`, `useChat` (`RoomContext`, `ChatContext`), `LegacyRoomManager` | state logic reusable; views use Fuselage/ui-composer parts | Reads app singletons: needs the view-model split (hook returns the state, view draws it). Owner: composer work (no PR); app-side contexts are in the isolation plan phase 1 (`RoomManager` behind a context) |
| Input (plain) | `messageBox/MessageBox.tsx` (13.5 KB, `/* oxlint-disable complexity */`, `'use no memo'`); input `ui-composer` `MessageComposerInput.tsx` = `Box is='textarea'` with `rows`, `resize: none`, class `rc-message-box__textarea js-input-message` | native `addEventListener('keydown'`, `'beforeinput'`, `'input'`, `'keyup'`, `'focus'` through merged callback refs; `HTMLTextAreaElement` refs; `useContentBoxSize`, `useMediaQuery('(pointer: coarse)')`; reads `useChat`, `useRoom`, `Subscriptions.useStore` (zustand), `roomCoordinator`, `emoji` lib | `TextInput` renders but draws no chrome natively (README); `InputBox`/`Input` render [M] | Redesign as `MessageBox.native.tsx` over RN `TextInput` (see "Input model" below). Owner: composer work |
| Input (contenteditable) | `messageBox/RichTextMessageBox.tsx` (17 KB, `span role=textbox` contentEditable), `lib/createRichTextComposerAPI.ts` (250 lines, selection 47 hits), `lib/selectionRange.ts` (221 lines), `gazzodown-alt` | `getSelection`, `Range`, DOM tree offsets | not portable | Do not port. Feature preview only (`realtimeMessageComposer`). Native uses the plain model |
| `ComposerAPI` | `lib/chats/ChatAPI.ts` type; `createComposerAPI.ts` (5.3 KB, selection 35 hits, 4 `document.execCommand('insertText')`), `lib/createComposerAPICore.ts` (262 lines: takes an `HTMLElement`, `_valueTracker`, `dispatchEvent('input')`, `addEventListener('input')`) | DOM text/selection model | The type is neutral; the implementation is DOM | Native implementation of the same type: text as state, selection from `onSelectionChange`, `setText`/`insertText`/`replaceText`/`wrapSelection` as pure string operations (the string logic in `wrapSelection` and `messageBoxHelpers` is already pure and has specs), `focus`/`blur` through the `TextInput` ref. `createComposerAPICore` needs a split: the quote, editing, recording, formatters and uploads state (subscribables) does not need a DOM; `persist` and `focus`/`blur` do. Owner: composer work; isolation plan says it "stays web-only" so this is a new twin |
| Enter / Shift-Enter / send | `MessageBox.tsx` `keyboardEventHandler`: Enter, Shift/Ctrl/Alt/Meta+Enter by `sendOnEnter` preference and `isMobile`; ArrowUp/Down at selection edges navigate to previous/next message; Escape closes editing | `KeyboardEvent.which`, `preventDefault`, `selectionEnd` | RN `TextInput` has `onSubmitEditing` (single-line) and `onKeyPress` (key only, no modifiers) | On native: multiline input, send by button (`sendOnEnter` false on mobile in the web too: `useUserPreference('sendOnEnter') \|\| isMobile`); hardware keyboards only if needed. Edit-previous via an action instead of ArrowUp. Owner: composer work |
| Multiline growth | `RoomComposer/hooks/useAutoGrow.ts` (ResizeObserver, style on textarea), `MessageComposerInputExpandable` (minHeight 52, maxHeight 155) | `ResizeObserver` | `TextInput multiline` + `onContentSizeChange` | S: a native twin of `useAutoGrow` |
| IME and paste | `handlePaste` in `MessageBox.tsx` and `messageBoxHelpers.ts`: reads `clipboardData.items`, `getAsFile`, `DOMParser` for html (`clipboard` 3/20); `beforeinput` handler `handleSelectionWrapping` (wraps selection when typing a markup char) | `ClipboardEvent`, `DataTransfer`, `InputEvent.beforeinput` | IME is native to `TextInput` [I]; paste of images is not exposed by RN `TextInput` (Android via `onPaste` in RN 0.7x+ [I: not checked]) | Drop `beforeinput` wrapping on native, or reimplement from `onChangeText` diffing; image paste via `expo-clipboard` on demand. Owner: composer work |
| Mentions / slash / emoji / canned autocomplete | `hooks/useComposerBoxPopup.ts` (8.8 KB), `useComposerBoxPopupQueries.ts`, `views/room/providers/ComposerPopupProvider.tsx` (432 lines, 0 DOM), views `ComposerBoxPopup*.tsx` (7 files, 506 lines: `scrollIntoView` 2, `<ul>`/`aria-listbox` 3/13) | `useComposerBoxPopup` binds `input`, `keyup`, `keydown`, `focus` with `node.addEventListener` and `:focus-visible`; reads `composer.selection.start` and `composer.substring` (neutral) | Queries and options are reusable; the binding and the list views are web | Split `useComposerBoxPopup` into a pure part (filter, trigger detection from text + cursor, apply) and the DOM binding; native binds to `onChangeText`/`onSelectionChange`; list = `FlatList` above the input. Owner: composer work |
| Formatting toolbar | `messageBox/MessageBoxFormattingToolbar/` (4 files, 259 lines), `lib/messageBoxFormatting.ts` (data: pattern buttons `*{{text}}*` etc., link prompt via modal, line prefixes; imports `flushSync` from `react-dom`), `wrapSelection` | keyboard shortcuts `handleFormattingShortcut` (cmd/ctrl+key), `react-dom` `flushSync`, selection ranges, `GenericMenu` dropdown | the data and `composer.wrapSelection(pattern)` are neutral; ranges are character offsets | Native toolbar buttons call the native `wrapSelection`; selection must be kept controlled (`selection` prop) after wrapping. `flushSync` import must go. Owner: composer work |
| Actions toolbar (attach, audio, video, location, timestamp, discussion, apps) | `messageBox/MessageBoxActionsToolbar/` (10 files, 534 lines): `useFileInput.ts` (`document.createElement('input')`), `useVideoMessageAction.ts` (`navigator.mediaDevices`, `window.MediaRecorder`), `useShareLocationAction.tsx` (`navigator.geolocation`), `useAudioMessageAction.ts` | `document`, `navigator`, `MediaRecorder`, `GenericMenu` | not portable as is | Capability hooks in `ui-client` with `.native.ts` twins (isolation plan item 6: `useFilePicker`, device permissions), expo-document-picker/expo-image-picker/expo-location/expo-audio |
| Audio/video recorder | `views/composer/AudioMessageRecorder`, `VideoMessageRecorder` + `hooks/useMediaPermissions.ts` | `MediaRecorder` 2/4, `navigator.mediaDevices`/`permissions` 1/4, raw `<video>`/`<audio>` 1/2 | not portable | expo-audio/expo-camera twins; or omit in the first milestone. Owner: composer work |
| Upload | `body/hooks/useFileUpload.ts` (51 lines), `lib/chats/uploads.ts` (`sdk.rest.upload` XHR), `flows/uploadFiles.ts`, `processMessageUploads.ts`, drop target `useFileUploadDropTarget.ts` | `File` objects, drag and drop | `api-client` uses global `fetch`, `FormData`, `File`, `XMLHttpRequest`, all present in RN (README) [R]; RN files are `{uri, name, type}`, not `File` | Adapter: pick (uri) to `FormData` part; flows (`processMessageUploads`) need `File` typed input replaced by an interface. Drop target: not applicable. Owner: composer work |
| Drafts | `messageBox/hooks/useDraft.ts` (`localStorage`, server draft from subscription) | `localStorage` | trivial twin | `useDraftStorage` in `ui-client` with `.native.ts` over AsyncStorage (isolation plan item 6). S |
| Typing indicators | `lib/UserAction.ts` (`sdk.publish`/`sdk.stream` on `notify-room`); `ComposerUserActionIndicator/` | 0 DOM | reusable once the native `sdk` is provided; `DDPSDK` supports `stream` [README] | `publish` for typing: not exercised in expo-lab [not determined] |
| Emoji picker | `ui-emoji-picker` (27 files, 1,187 lines: observers 1/1, scroll DOM 2/4, web libs 7/13, aria, 3 host tags), opened by `chat.emojiPicker.open(el, cb)` at a DOM anchor (`EmojiPickerProvider`) | `Element` anchor, react-aria, positioned popover | not portable | New native picker (sheet + `FlatList` grid) behind the `EmojiPickerContext` seam. Owner: new |
| Reply/quote, editing, hints, replies | `MessageBoxReplies.tsx`, `MessageBoxReply.tsx`, `MessageBoxHint.tsx`, `CurrentEditingMessage` | Fuselage parts (`Item*`, `Callout`) | `Item*` parts render [M] | Views twin only |
| Shell | `MessageBoxBase.tsx` (props-driven shell: `input: ReactNode` slot, `ui-composer` parts, recorders, popups); `ui-composer/src/MessageComposer*` (Box-based, `className` 7/14, `useStyle`) | Fuselage `Box` with styling props, class names | a shell shape that can be reused with a native input slot | Port `MessageComposer*` parts as native frames (Tamagui) or twins; they are leaf layout |

Input model, native vs web:

| Aspect | Web (`MessageBox`) | React Native `TextInput` |
| --- | --- | --- |
| Value | uncontrolled DOM value, read as `input.value`; `composer.text` getter | controlled (`value`/`onChangeText`) or ref-based; `composer.text` has to be state |
| Selection | `selectionStart`, `selectionEnd`, `setSelectionRange` | `onSelectionChange`, controlled `selection` prop; setting selection after a programmatic change is order-sensitive on iOS [I] |
| Insert at caret | `document.execCommand('insertText')` (keeps undo stack) with string fallback | string splice into state, no native undo for programmatic edits [I] |
| Growth | autoGrow + ResizeObserver | `multiline`, `onContentSizeChange`, max height |
| Enter | Enter sends, Shift+Enter newline (preference-driven) | multiline: Enter is newline; send button; `submitBehavior` options |
| Keys/shortcuts | keydown handlers, formatting shortcuts, ArrowUp/Down | `onKeyPress` only (key without modifiers) |
| Paste | `ClipboardEvent` items, html to text | text only via the input; images need explicit clipboard API |
| Mentions | popup bound to `input`/`keyup`; replace range with `replaceText` | derive trigger from `onChangeText` + selection; replace by splicing |
| IME | browser | native, composing text is exposed through `onChangeText` as it changes [I] |
| Keyboard avoidance | n/a | `KeyboardAvoidingView` (expo-lab has it), insets |

## 7. Contexts, data, Meteor and DOM blockers across both

| Blocker | Measured | Phase in the isolation plan (`docs/proposals/view-isolation-migration.md`) | Note |
| --- | --- | --- | --- |
| Meteor APIs | 0 hits in the message tree, the stack, the composer, `lib/chats`, `ChatMessages`; `lib/SDKClient.ts` imports `../meteor/connection`; `ui-client` 1 file/5 hits (not examined) | already clean in `views/**` by lint; `SDKClient` outside any phase | a native app provides its own `sdk` and `ServerContext`; do not import `SDKClient` |
| App singletons read by components (`useChat`, `RoomContext`, `LegacyRoomManager`, `roomCoordinator`, `stores`, `emoji` lib) | message tree: `stores` 6, `lib/` 76; composer: `lib/` 55, `stores` 2; `lib/chats`: `stores` 5, `sdk` 18 | phase 1 ("`RoomManager` behind a context"); stack handles messages (0 `stores` in the package); composer not in any phase | largest unmeasured blocker in the plan's own text (608 imports from `client/lib` and `client/stores` across 380 view files) |
| `document`, `window`, `navigator`, `localStorage` in views | composer: document 4/8, navigator 3/6, storage 1/3; stack: document/window 6/8, navigator 1/1 | phases 0 and 1 ("composer storage, file and permission hooks to `ui-client`") | most are named hooks; `ui-client` twins are needed |
| Observers (`ResizeObserver`, `IntersectionObserver`) | stack 2/3 (scroller, `ThreadMetrics` through fuselage-hooks); composer 1/1 (`useAutoGrow`); `useIsVisible` (ui-client) | phase 1 (message list handle contract) | `useResizeObserver` is guarded natively since step 1; `useIsVisible` is not |
| Text selection / contenteditable / clipboard / drag-drop | composer 7/75 selection, 3/20 clipboard; `lib/*` 894 lines | none: phase 1 states `createComposerAPI` stays web-only | new twin required |
| File/Blob/MediaRecorder | composer 3/4; `lib/chats` 6/14 | phase 1 (capability hooks) | RN files are URIs |
| Web-only widgets: virtua, react-aria toolbar/menus/focus, `GenericMenu`, portals, dompurify, katex, highlight.js | stack: virtua 4 files, react-aria 4, dompurify 1; gazzodown: katex 5 files, hljs 1, DOMPurify 1; composer: `GenericMenu` in toolbars | section 4 of `view-isolation.md`; items 3, 5, 7 of the proposal | gazzodown not wrapped by an app component yet |
| ui-contexts | 116 files, 1 file with `File`/`navigator` | none needed | a native app provides contexts (`ServerContext`, `UserContext`, `SettingsContext`, `TranslationContext`, `LayoutContext`, `UserCardContext`, `AttachmentContext`, `AvatarUrlContext`, `ToastMessagesContext`, `ModalContext`, `RouterContext`, `TooltipContext`, `UserPresenceContext`) |
| `className` / `rcx-*` / css-in-js | stack: className/`css` 19 files/35; composer 4/8; ui-composer 7/14; gazzodown 6/13 | not a plan item | no effect on native; Fuselage frames carry the look |
| `onClick`, `aria-*`, `data-*`, hover | stack: domEvents 39/93, aria 26/40, data-attr 19/40 | not a plan item | host map aliases `onClick` to press [R]; `aria-*`/`data-*` ignored; hover has no equivalent |
| i18n | `react-i18next` 48 files in the stack, 38 in composer | `docs/i18n.md` | expo-lab has no i18n provider yet [R] |

## 8. Dependencies on the Fuselage native work

Status from the step-3 sweep [M]; "frames" means Fuselage components that must stop throwing.

| Open item | Units blocked | Count |
| --- | --- | --- |
| Frames still throwing (`div`, `span`, `img`, `input` in Fuselage JSX) | Reactions (5: `MessageReaction`, `MessageReactionAction`, `MessageReactionCounter`, `MessageReactionEmoji`, `MessageReactions`), Toolbar (2), Thread variant (3), System variant (2), URL previews (8 `MessageGenericPreview*`), Audio (2: `AudioPlayer`, `AudioPlayerControls`), `Bubble` (1), `MessageMetricsItemAvatarRowContent` (1) | 24 of the 66 Fuselage components the stack imports; `Skeleton` renders empty (height `1.2em` in SCSS) |
| `Box` styling props | `<Box` in 37 of the stack's files (46 uses; at least 31 with styling props), 17 in composer, 23 in `ui-composer`. `Box` renders natively, but `useStylingProps` returns a class name and `useStyle` attaches it only to a document, so padding, colour, width and the like are dropped [R, not observed on device] | blocks every `Box`-based layout in both areas; either the host map converts styling props to `style`, or the stack's `Box` calls become frames/layout containers (the repo's layout rules already ask for named containers) |
| Press | rows, reactions, toolbar items, links | `onPress` reaches Button, Chip, Tag, Item, SidebarItem fibers [README probe]; a real touch was not made |
| Input chrome | composer input (`InputBox` renders but draws no border/background natively; app wraps a bordered `View`) | blocks a styled composer |
| `PasswordInput` focus, `onChange` as string | login only | not message/composer |
| Icon font | every toolbar/action icon (`Icon` loads the font through `expo-font` in the gallery) | OK in the app already (`FuselageProvider`); glyph correctness was a gallery finding |
| `CheckBox` mark | selection mode, task lists | renders without the check mark |
| ToggleSwitch | settings only | twin exists |
| Banner, Tag, Avatar | `Avatar`, `Banner`, `Tag` render since step 3; SVG avatars through `AppAvatar` | done |
| Host map gaps | `select`/`textarea` (maps to `TextInput`), `video`, `audio`, `picture`, `blockquote`, `figure`: no RN host with those semantics; `className` ignored | `video`/`audio` need expo packages, not a map entry |
| Overlay primitives | `Dropdown`, `Popover`, `PopoverSurface`, `Options`, `PositionAnimated` status `pending` in the sweep (need a DOM anchor and portal), `Menu` throws | blocks action menus, popups and the emoji picker anchor |

## 9. Proposed order of work

Principle: use the stack's parts and contexts, not the develop tree; run them in a FlatList first; do not wait for the stack's engine to be ported. Items marked PR are in the isolation plan or the stack; the rest stay in expo-lab.

| Step | Work | Where | Effort | Unblocks |
| --- | --- | --- | --- | --- |
| 1 | Check that `channels.history` returns the fields the parts read (`md`, `attachments`, `reactions`, `mentions`, `tcount`, `urls`) and widen `ChatMessage` to the core-typings `IMessage` subset; call `message-parser` when `md` is missing. Check Metro evaluates `@rocket.chat/message-parser` and `core-typings` | expo-lab | S | everything below |
| 2 | Native `Markup` and `Emoji` as `MessageRenderersContext` values (paragraph, inline spans, links, inline code, code block without highlight, quotes, lists, mentions, emoji, big emoji; katex and tables as text fallback first). Property-test with the parser's fixtures | expo-lab (later a `gazzodown` `.native` twin) | M | message body on native |
| 3 | Frames for the first 12 throwers: Reactions 5, Thread 3, System 2, Toolbar 2. Decide `Box` styling props on native (host map to `style`, or replace `Box` uses). Then GenericPreview 8, Audio 2, `Bubble`, `AvatarRowContent` | Fuselage native stack (other session) | M each; Box decision L | reactions, thread/system variants, toolbar |
| 4 | Native `MessagesProvider`: the 11 contexts, starting from defaults, with display, content, renderers, related data and navigation (press opens user info), and `AvatarUrlContext` + `AppAvatar` | expo-lab | M | `RoomMessage` on native |
| 5 | Mount the stack's `RoomMessage` (and system/thread variants) as `renderItem` of the existing inverted FlatList, using the exported `isSequentialMessage` for grouping. Keep `useRoom` state. This is the "same message component" milestone without the engine | expo-lab; depends on the stack being published as a built package | M | message row parity with web |
| 6 | Toolbar on native: long-press opens an action sheet fed by `MessageToolbarContext` items (`MobileItems` set); reaction tap toggles. Needs `useIsVisible` native twin | expo-lab (+ PR to `ui-client` for the hook) | M | message actions |
| 7 | Media: image (RN `Image`, tap opens a native viewer), video/audio twins of the three attachment files, `window.location` hook sites in 3 files behind a hook | expo-lab + PR (hooks) | M | attachments |
| 8 | List engine: decide between (a) FlatList with `maintainVisibleContentPosition` plus pure stack helpers, (b) a native twin of `useMessageListScroller` driving the reducer. Port the spec's R-list as native tests | PR in the stack (needs its own intent and spec: it changes a `.native` twin contract) | L | paging, jump to message, unread divider, restore position |
| 9 | Composer, minimum: native `MessageBox` over `TextInput` (multiline, auto-grow, send button, keyboard avoidance), native `ComposerAPI` (text, selection, insert, replace, wrapSelection), split of `createComposerAPICore`, draft hook twin. Send through the existing flow (`sendMessage` flow uses `sdk.rest.post('/v1/chat.sendMessage')`, same as expo-lab's `api.ts`) | needs a new intent/spec; not in the isolation plan | L | typing, sending, drafts, editing, quoting |
| 10 | Composer popups (mention/slash/emoji/canned): split `useComposerBoxPopup` into pure + binding; native list above the input | composer PR | M | autocomplete |
| 11 | Formatting toolbar, then attach (picker), then recorders | composer PR, capability hooks in `ui-client` | M, M, L | formatting, uploads, voice/video |
| 12 | Native emoji picker; user card on press; UiKit blocks | new | M each | parity tail |

Steps 1, 2, 4 and the Box decision of step 3 can begin before the stack merges; steps 5 to 8 need the stack built as a package (its `package.json` has `main: ./dist/index.js`, `private: true`); steps 9 to 11 are independent of the stack.

## 10. Risks and open decisions for the user

1. Scope of "the same message component": the stack's parts (recommended) or the develop tree. The develop tree is being replaced; building on it is throwaway.
2. Whether the engine must be shared. The stack's spec (85 requirements) is DOM-shaped; a native twin is a second implementation to keep in step. FlatList first is cheaper but diverges (step 8).
3. `Box` styling props on native: converting in the host map (affects every Fuselage consumer) vs replacing `Box` in the stack (46 uses). Needs the Fuselage owner.
4. Where the native Markup lives: expo-lab, `gazzodown` `.native`, or `ui-message-list` default renderers. The isolation plan says a `.native.tsx` is added only with its consumer; expo-lab is the consumer.
5. The composer has no owner in the plan; phase 1 keeps `createComposerAPI` web-only. A new intent is needed, and a decision to extract a props-driven `MessageBox` view (the `MessageBoxBase` shell is close) from `useChat`/`useRoom`.
6. Rich composer (contenteditable): not portable; confirm native always uses the plain model.
7. The stack is 10 open PRs, stacked; its API (contexts, `MessageList` props) may still move in review. Anything built against it before merge can break.
8. virtua on RN: unverified; if absent, the stack's ADR 0001 ("virtua stays the virtualizer") conflicts with a native list.
9. Katex, UiKit and HTML previews on native: show as text or leave out; needs a product decision.
10. `react-aria` hooks (`useToolbar`, `useFocusManager`) are imported by the package top-level; they must not evaluate DOM at import under Metro [not determined].

## 11. What could not be determined

- Nothing was run on a device or the simulator. All native statuses of Fuselage components come from the committed sweep results (mounting and layout size only, no look, no press) and are step-3 values.
- Whether Metro can import the stack's package (its dependencies `@rocket.chat/ui-client`, `ui-avatar`, `ui-contexts`, `@react-aria/*`, `dompurify`, `css-in-js`, `virtua`), including module-evaluation DOM access in the `ui-client` barrel.
- Whether virtua has a usable React Native build with shift mode, and whether `maintainVisibleContentPosition` suffices for the spec's prepend and anchor rules.
- Whether `channels.history` returns `md` and the other fields on a live server (no login made).
- Whether `Box` styling props are dropped on a device (read from code only).
- The 5 sweep components marked `pending` (`Popover`, `PopoverSurface`, `Dropdown`, `Options`, `PositionAnimated`) and `Menu` (throws, cause not traced).
- Fuselage `Table`, `Chip`-based mention parts and `fuselage-ui-kit` native status for markup tables, mentions and UiKit.
- Typing indicator publishing (`sdk.publish`) and upload (`sdk.rest.upload`) over the native SDK.
- The 1 Meteor-pattern file in `ui-client/src` (5 hits) was not opened.
- Per-unit line and hit counts for the stack are from its tip branch at fd7b3f50e47 at the time of the run; the PRs are open and may change.
