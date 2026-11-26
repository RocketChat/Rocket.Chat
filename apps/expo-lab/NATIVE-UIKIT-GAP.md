# Gap analysis: rendering UiKit natively in the Expo app

Read-only analysis on the combined branch `feat/expo-lab-all` (tip when written: `1f488bb9505`). Nothing was run on a device. Every figure is tagged **[M]** measured by a stated command, **[R]** read from code, **[I]** inferred.

## 1. Summary and verdict

- The renderer-agnostic core is already portable: `packages/ui-kit` has 127 non-spec source files and 3,388 lines with 0 hits for Meteor, `document`/`window`, `react-dom`, host tags, `Box`, `className` or `onClick` [M, method in section 11]. Seven of its files use `typia`, and its built `dist` imports `typia` at runtime [M, `dist/surfaces/modal/ModalView.js` line 1]; whether Metro loads that is untested.
- The web renderer is not portable as it stands. `packages/fuselage-ui-kit` is 120 files and 6,326 lines [M]. It has no `dist` in this tree [M], is `private: true` [R], and imports web-only modules at load: `@rocket.chat/gazzodown` (4 files), `@nivo/*` (1), `react-dom/client` (1), `react-i18next` (9), `@tanstack/react-query` (7), `@rocket.chat/ui-contexts` (9), `@rocket.chat/ui-avatar` (4) [M].
- **Coverage today, judged only by whether every Fuselage component a web block imports mounts in the native sweep** (`/tmp/expolab/sweep-v4/raw/results.json`, 208 mount / 72 throw / 10 pending / 6 empty of 296 [M]; "mounts" is not "looks right"):
  - **Layout blocks, 27 renderable** (`conditional` is unwrapped before rendering): 12 ready, 10 partial, 4 blocked, 1 out of scope.
  - **Elements, 30 canonical** (the aliases `checkboxes`, `radio_buttons` and `timepicker` map to them): 13 mount, 11 depend on the popover (`Options`, `PositionAnimated`) or on `Option`/`OptionAvatar`, which do not work natively, 3 need native date or time pickers, 3 have another blocker.
  - **Text objects, 2:** `plain_text` is trivial; `mrkdwn` can use the native `Markup` already built in step A3 (commit `972114a47f3`).
- **Recommendation: option (c), a native `SurfaceRenderer` in `apps/expo-lab` that reuses the pure logic of `fuselage-ui-kit`** (copied first, extracted later), Fuselage frames where they mount, React Native primitives where they do not. Start with text, section, divider, header, actions and button, context, image, callout, then the message-surface interaction round trip. Selects are the largest later group (11 elements) and want a bottom sheet, not Fuselage's popover.
- The round trip is a plain REST call plus a user stream that `expo-lab` can already make: `POST /apps/ui.interaction/:appId` through `sdk.rest`, and `sdk.stream('notify-user', '<uid>/uiInteraction', …)`, which `ddp-client` already types with `UiKit.ServerInteraction` [M, section 5].
- There is no `home` surface in this repository [M: no match in `packages/ui-kit/src/surfaces` or `packages/fuselage-ui-kit/src/surfaces`]. The attachment surface has a parser and no renderer on any client [R, `docs/features/uikit/surfaces.md`].

## 2. How UiKit renders on web

| Layer | Where | What it does |
| --- | --- | --- |
| Payload types and validation | `packages/ui-kit/src/blocks`, `src/surfaces`, `src/interactions` | Layout blocks (28 files in `blocks/layout`: 27 renderable plus `conditional`), elements (32 files in `blocks/elements`: the 30 canonical element types, the `url` source element used only by `task_card`, and a select-filter helper), 2 text objects, views per surface, `UserInteraction` and `ServerInteraction` [M: `ls` of both directories, non-spec files] |
| Rendering contract | `packages/ui-kit/src/rendering/SurfaceRenderer.ts` (89 lines) | Unwraps `conditional`, applies the surface allowlist, dispatches by `block.type` to a method of the renderer, and gives each call a `BlockContext` (`BLOCK`, `SECTION`, `ACTION`, `FORM`, `CONTEXT`, `NONE`) [R] |
| Web renderer | `packages/fuselage-ui-kit/src` | `FuselageSurfaceRenderer extends SurfaceRenderer<ReactElement>`: one method per block and element, one `*SurfaceRenderer` per surface, a `Surface` component per surface type [R] |
| State and actions | `src/hooks/useUiKitState.ts`, `src/contexts/UiKitContext.ts` | Each element reads its value from `UiKitContext.values`, writes through `updateState`, and sends through `action`. Whether an element sends on change, on enter or only locally is decided here [R] |
| Host | `apps/meteor/client` | Per surface: `UiKitMessageBlock` (+ `useMessageBlockContextValue`), `UiKitModal` (+ `useModalContextValue`), `UiKitContextualBar`, `UiKitBanner`; `ActionManager` (376 lines) owns trigger ids, the modal stack, timeouts and the HTTP call [M: `wc`, R] |

The docs in `docs/features/uikit/` are the contract (support matrix, reference, interactions) and are dated October 2026 [R]. One path in them is stale: `apps/meteor/client/uikit/hooks/use*ContextValue.ts` does not exist; the hooks live next to each surface [M: `find`].

Interaction path [R, `ActionManager.ts:84-117`, `docs/features/uikit/interactions.md`]:

```
element -> useUiKitState -> UiKitContext.action -> surface context value
  -> ActionManager.emitInteraction (triggerId, 5 s timeout)
  -> sdk.rest.post('/apps/ui.interaction/:appId')
  -> ServerInteraction in the response -> handleServerInteraction (open, update, close a view, show errors)
```

## 3. Block and element inventory

Native status comes from the sweep above: **mounts** (renders), **throws** (a literal DOM host tag), **pending** (needs a popover or other context), **empty**. Box styling props (`display`, `gap`, `padding`, `fontScale`, `color`, `backgroundColor`) are used throughout and are probably dropped on a device until the Box decision is taken (checklist decision x1) [I; read from code in `NATIVE-MESSAGE-COMPOSER-GAP.md`].

### 3.1 Text objects

| Type | Web | Native gap |
| --- | --- | --- |
| `plain_text` | `PlainTextElement` (17 lines): the `text`, or an i18next lookup in namespace `app-<appId>` from `text.i18n` [R] | S. Render `text`. The i18n lookup needs `react-i18next`, which the app does not have (decision in section 9) |
| `mrkdwn` | `MarkdownTextElement` (32 lines): `parse()` from `message-parser`, drawn by gazzodown `Markup` inside `Suspense` with a `Skeleton` fallback [R] | S. `parse()` already runs on Hermes (step A2) and the native `Markup` (A3) draws the AST. `Skeleton` is empty natively, so there is no fallback to show [M, sweep] |

### 3.2 Layout blocks (27)

"Fuselage deps" lists what the web block imports from `@rocket.chat/fuselage` [M: import scan of `blocks/*.tsx`]. Lines are the web file(s) [M: `wc -l`].

| Block | Web lines | Fuselage deps → native | Web-only constructs | Verdict | Effort |
| --- | --- | --- | --- | --- | --- |
| `actions` | 46 + 28 | `Box`, `Button` → mount | "Show more" after 5 elements | Ready | S |
| `alert` | 16 | `Callout` → mounts (ResizeObserver guard landed) | none | Ready | S |
| `callout` | 18 | `Callout` → mounts | accessory elements (`button`, `overflow`) | Ready (overflow blocked, see 3.3) | S |
| `card` | 16 + 82 | `Card`, `CardBody`, `CardTitle` mount; `CardControls`, `CardHeader` **throw** (`div`) | none | Blocked | M |
| `carousel` | 97 | `Box`, `IconButton` → mount | `window` resize listener, `element.scrollLeft`, `scrollBy` | Partial (use a horizontal `ScrollView`) | M |
| `container` | 79 | `Box`, `Divider`, `IconButton` → mount | nested blocks through `renderNestedBlocks` | Ready | S |
| `context` | 30 + 32 | `Box` → mounts | image element draws a CSS `background-image` (see 3.3) | Partial | S |
| `context_actions` | 31 | `Box` → mounts; elements `feedback_buttons` (`Button`, `Stack` mount) and `icon_button` | `FeedbackButtonsElement` has literal host tags | Partial | S |
| `data_table` | 194 | `Box`, `IconButton`, `SearchInput`, `Table*` → mount | `Box is='nav'` pagination, sorting | Partial (table layout unverified) | M |
| `data_visualization` | 53 + 130 + 57 + 17 + 23 | `Box`, `Skeleton` (empty), `Palette`, `Tooltip` | `@nivo/*` charts (web SVG), `DataVisualizationTable` uses a literal `<table>` | Blocked | L |
| `divider` | 11 | `Divider` → mounts | none | Ready | S |
| `file` | 43 | `Box`, `Icon` → mount | `@rocket.chat/ui-contexts` (download), DOM types | Partial | S |
| `header` | 15 | `Box is='h3'` → mounts through the host map (`h3` maps to a text host) [I] | none | Ready | S |
| `image` | 81 | `Box`, `Skeleton` (empty) | `document.createElement('img')` to preload, styled CSS `background-image` | Partial (use RN `Image` with `onLoad`) | S |
| `info_card` | 61 | `Box` → mounts | literal `<div>` around the action | Partial | S |
| `input` | 37 | `Field`, `FieldLabel`, `FieldRow`, `FieldError`, `FieldHint` → all mount | none | Ready (the container; the element inside decides) | S |
| `layout` | 81 | `Box`, `Divider` → mount | none: it uses flex wrap, not CSS grid | Ready | S |
| `markdown` | 16 | `Box` + `MarkdownTextElement` | gazzodown → replaced by native `Markup` | Ready | S |
| `plan` | 29 | `Box` → mounts | none | Ready | S |
| `preview` | 59 | all 7 `MessageGenericPreview*` parts **throw** (`div`, `span`) [M: sweep] | none | Blocked | M |
| `rich_text` | 48 + 84 + `richTextRuns` | `Box`, `Skeleton`, `Tag` | gazzodown, literal `<li>`, `window.location.href`, a different AST from `message-parser` | Blocked | M |
| `section` | 63 + 21 | `Box` → mounts | `Fields` uses `display='grid'` with `gridTemplateColumns` and a literal `<div>`; RN has no CSS grid | Partial (two flex columns) | S |
| `tab_navigation` | 41 + 34 | `Tabs`, `TabsItem` → mount | contextual bar only | Ready | S |
| `table` | 56 | `Box`, `Table*` → mount (`TableBody`, `TableHead`, `TableRow` with a `Text` child) | none | Partial (column layout unverified) | M |
| `task_card` | 16 + 58 | `Box`, `Icon` → mount | none | Ready | S |
| `video` | 110 | `Box`, `Icon` → mount | `window.location.origin`; draws an absolute https URL | Partial (needs a video or web view dependency) | M |
| `video_conf` | `VideoConferenceBlock` + 3 hooks | `@rocket.chat/ui-contexts`, `ui-video-conf` | needs the call UI of the client | Out of scope | n/a |

Totals [M: count of the verdict column]: **12 ready, 10 partial, 4 blocked, 1 out of scope** = 27. "Ready" means the Fuselage dependencies mount; the look is unjudged, and `Box` styling props are unverified natively.

### 3.3 Elements (30 canonical)

Native status of the Fuselage component each element imports, from the same import scan and sweep [M]. The popover group is the largest.

| Element | Fuselage deps → native | Web-only constructs | Group |
| --- | --- | --- | --- |
| `button` | `Button`, `Throbber` → mount | `window.open`, `is='a'`, `e.currentTarget` | Mounts |
| `icon_button` | `IconButton` → mounts | DOM event type | Mounts |
| `icon` | `Icon`, `FramedIcon` → mount (needs the icon font) | none | Mounts |
| `linear_scale` | `Box`, `Button`, `ButtonGroup` → mount | none | Mounts |
| `plain_text_input` | `TextInput`, `TextAreaInput` → mount (no border or background yet) | `onChange` receives a DOM event; native gives a string | Mounts |
| `number_input`, `email_text_input`, `url_text_input` | `NumberInput`, `EmailInput`, `UrlInput` → mount | same | Mounts |
| `rich_text_input` | `TextAreaInput` → mounts | none | Mounts |
| `checkbox` | `CheckBox`, `Box` → mount (no checked mark until the twin lands) | none | Mounts |
| `radio_button` | `RadioButton`, `Box` → mount | none | Mounts |
| `toggle_switch` | `ToggleSwitch` → mounts (twin landed, unverified) | none | Mounts |
| `tab` | `TabsItem` → mounts | none | Mounts |
| `static_select`, `multi_static_select` | `SelectFiltered`, `MultiSelectFiltered` → mount | their list is `Options` in `PositionAnimated`, both **pending** | Popover |
| `external_select`, `multi_external_select` | `AutoComplete` → mounts | `Options` pending; options come from `useExternalSelectOptions` (tanstack query + `blockSuggestion`) | Popover |
| `users_select`, `multi_users_select` | `AutoComplete`, `Chip`, `Option`, `OptionAvatar` → `Option` and `OptionAvatar` **throw** | `useUsersData` (ui-contexts + tanstack query) | Popover |
| `channels_select`, `multi_channels_select` | same | `useChannelsData` | Popover |
| `conversations_select`, `multi_conversations_select` | same | `useConversationsData`, `useCurrentConversationDefault` | Popover |
| `overflow` | `IconButton`, `PositionAnimated`, `Options`, `useCursor` → the last three pending | `window.open` | Popover |
| `datepicker`, `datetimepicker`, `time_picker` | `InputBox type='date'` etc. → mounts as a plain input | the browser date picker does not exist natively | Needs a native picker |
| `file_input` | `Box`, `Button`, `IconButton` → mount | DOM `File`, hidden `<input type=file>`, `uploadFile(file: File)` | Other |
| `image` | none | styled CSS `background-image` (`ImageElement.styles.tsx`) | Other |
| `feedback_buttons` | `Button`, `Stack` → mount | literal host tags | Other |

Totals [M: count of the group column]: **13 mount, 11 popover, 3 need a native picker, 3 other** = 30. Three of the 13 look wrong until the input-chrome, CheckBox and ToggleSwitch work lands (checklist step f6).

## 4. Surfaces

Scope is "everything except omnichannel" [docs/proposals/view-isolation-migration.md decision]. UiKit is not omnichannel-specific, so all four surfaces are in scope.

| Surface | Mounted on web by | What native needs | Native readiness |
| --- | --- | --- | --- |
| **Message** | `UiKitMessageBlock` (`apps/meteor/client/components/message/uikit`), through `MessageRenderersContext.UiKitMessageBlock: ComponentType<{ rid, mid, blocks }>` in the stack [M, `git show origin/message-list/09-thread-list-and-cleanup:packages/ui-message-list/src/Message/contexts/MessageRenderersContext.tsx`] | A component with that exact prop shape, a `UiKitContext`-equivalent whose `action` posts `blockAction` with `container: { type: 'message', id: mid }`, `rid`, `mid` | Blocks 12 ready of 27; the host plumbing is small |
| **Modal** | `UiKitModal` → `ModalBlock`; opened by `ActionManager.openModal` through `imperativeModal` (`@rocket.chat/ui-client`) | A native modal host: React Native `Modal` or a navigation sheet; a stack of up to 3 per app; a `viewSubmit`/`viewClosed` flow and `errors` display (only modals show errors) | Fuselage `Modal` mounts only with a `Text` child (sweep), so use RN `Modal` plus Fuselage parts for content |
| **Contextual bar** | `UiKitContextualBar` on the route `tab=app&context=<viewId>` | A full-screen view in the room navigation; the only surface that renders `tab_navigation`; `rid` added to every interaction | Fuselage `Contextualbar*` parts mount [M, sweep] |
| **Banner** | `UiKitBanner` inside `BannerRegion`; every `blockAction` closes it | A top region in the app shell, fed by `banner.open`/`update`/`close` | Fuselage `Banner` mounts [M, sweep] |
| **Attachment** | nowhere | nothing | n/a |

Overlay components relevant to modal content: `Popover`, `Dropdown`, `PositionAnimated` and `Options` are **pending** (need a positioned popover context) [M: sweep].

## 5. Interaction round trip natively

| Part | Web | What `expo-lab` has | Gap |
| --- | --- | --- | --- |
| Send an interaction | `sdk.rest.post('/apps/ui.interaction/${appId}', { ...interaction, triggerId })` [R, `ActionManager.ts:96`]. The endpoint is an express route under `apps/meteor/ee/server/api/apps/uikit.ts:44` and is typed in `rest-typings` as `/apps/ui.interaction/:id` [R] | `sdk.rest.post('/v1/chat.sendMessage', …)` and `sdk.rest.send(...)` exist in `src/api.ts:63-65` and `:31` [R] | Use `rest.post`, or `rest.send` untyped as for `subscriptions.get`. The path has no `/v1` prefix; confirm how `api-client` builds it [I] |
| Trigger ids | `generateTriggerId`, a `Map` that expires after 5 s; an interaction with an unknown or expired id is ignored [R] | none | Port the 25-line trigger logic. `Random.id()` comes from `@rocket.chat/random`, which has no `dist` and, on Hermes, falls back to a non-cryptographic generator (not security-critical here) [R, spike notes in the checklist] |
| Timeout and errors | 5 s timeout, then a toast and the view is disposed; other errors toast [R] | no toast layer | RN `Alert` or a toast component |
| Block suggestions | `suggestOptions` posts `blockSuggestion`; the client debounces 300 ms and waits at most 3 s [R, docs] | none | needed for the external selects |
| Server push | `useAppUiKitInteraction` subscribes `notify-user` `<uid>/uiInteraction` and calls `handleServerInteraction` [R] | `sdk.stream('room-messages', rid, cb)` in `src/api.ts:72` [R] | `ddp-client` types the key as `${string}/uiInteraction` with `UiKit.ServerInteraction` [M, `packages/ddp-client/src/types/streams.ts:171`] and its legacy SDK already subscribes to it [M, `RocketchatSDKLegacy.ts:191`]. The same `sdk.stream` call works [I] |
| Message updates | an app updating a message arrives as a normal message update | the room stream is already subscribed | blocks change with the message [I] |
| Input state | `useUiKitView`: `values` keyed by `actionId` as `{ value, blockId }`; `state` is `{ [blockId]: { [actionId]: value } }`; initial values from `extractInitialStateFromLayout` [R] | none | pure functions, reusable as they are (section 6) |
| Confirm dialogs | `askConfirmation` creates a DOM root on `document.body` [R, `utils/askConfirmation.tsx`] | none | RN `Alert.alert` with the `confirm` and `deny` labels and a destructive style for `danger`: S |
| Links | `isSafeUrl` (ui-kit) then `window.open` [R] | none | `Linking.openURL` after `isSafeUrl`. `isSafeUrl` uses `new URL(url, base)`; whether Hermes handles that is untested [I] |
| Files | `file_input` uploads through `rooms.media/:rid` and keeps ids in the view state [R, docs] | none | needs a picker dependency and an adapter from `{ uri, name, type }`: the same issue as the composer upload (Q4 of the composer intent) |
| Views the app opens | `modal.open`/`push`/`clear`/`update`/`close`, `contextual_bar.*`, `banner.*`, `errors` [R] | none | a native `ActionManager` port; the web one imports `ui-client` (`imperativeModal`), `i18next`, `banners` and `toast`, so it cannot be reused |

## 6. Web-only dependencies by category

Counts are over non-spec, non-story `.ts`/`.tsx` files [M, patterns in section 11].

| Category | `packages/ui-kit` | `packages/fuselage-ui-kit` |
| --- | --- | --- |
| Source files / lines | 127 / 3,388 | 120 / 6,326 |
| Meteor | 0 | 1 file (a comment about the Meteor bundler in `DataVisualizationBlock.tsx`) |
| `document`/`window` | 0 | 7 files, 15 hits: `CarouselBlock`, `ImageBlock`, `RichTextLine`, `VideoBlock`, `ButtonElement`, `OverflowElement`, `askConfirmation` |
| `react-dom` | 0 | 1 file (`askConfirmation`) |
| DOM types or events (`HTMLElement`, `MouseEvent`, `File`, …) | 0 | 10 files |
| `react-aria` / `react-stately` | 0 | 0 |
| `@rocket.chat/gazzodown` | 0 | 4 files (`RichTextBlock`, `RichTextLine`, `MarkdownTextElement`, `richTextRuns`) |
| `katex` / `highlight` | 0 | 0 |
| `@nivo/*` | 0 | 1 file (`DataVisualizationChart`) |
| `@rocket.chat/ui-contexts` | 0 | 9 files (video conference hooks, `FileBlock`, the three entity selects, `useRichTextMentionNames`) |
| `@rocket.chat/ui-avatar` | 0 | 4 files (the user and channel selects) |
| `@tanstack/react-query` | 0 | 7 files |
| `react-i18next` | 0 | 9 files (the `useAppTranslation` hook is used by most elements and blocks) |
| `@rocket.chat/core-typings` | 0 | 4 files |
| `Box`: files / `<Box` hits | 0 | 41 / 123 |
| `Box` styling-prop hits | 0 | 77 |
| `Box is=` hits | 0 | 24 |
| Literal host tags in JSX: hits / files | 0 | 19 / 6 (`DataVisualizationTable`, `InfoCard`, `RichTextBlock`, `RichTextLine`, `SectionBlock.Fields`, `FeedbackButtonsElement`) |
| `className` hits | 0 | 48 |
| `onClick` / `aria-` hits | 0 | 29 / 22 |
| `typia` | 7 files (generated validators; `dist` imports `typia`) | 0 |

The parts of `fuselage-ui-kit` that are logic and not rendering, and read no DOM: `getInitialValue.ts`, `extractInitialStateFromLayout.ts`, `renderNestedBlocks.ts`, `hasElement(s).ts`, `limitOptions.ts`, `inlineBigEmoji.ts`, `messageBlockWidth.tsx` [R], and `useUiKitState.ts`, which is DOM-free except its `KeyboardEvent` typing, the `onEnterKeyDown` handler that reads `event.nativeEvent.isComposing`, and the `askConfirmation` call [R]. Elements call it with a pseudo event, `action({ target: { value } })`, so a native text input can call it with `{ target: { value: text } }` [R, `StaticSelectElement.tsx`].

## 7. Options for a native renderer

| | (a) Reuse `fuselage-ui-kit` as is | (b) New native renderer, own components | (c) Hybrid: native renderer, shared logic, Fuselage frames where they mount |
| --- | --- | --- | --- |
| Idea | Import the package and its blocks on the native Fuselage | `SurfaceRenderer<ReactElement>` subclass with React Native components, written against `@rocket.chat/ui-kit` only | Same as (b), plus the DOM-free logic of section 6 shared, and Fuselage frames used for the blocks and elements that mount |
| Cost to start | Stub 7 module families so the package even bundles: `gazzodown`, `@nivo`, `react-dom/client`, `react-i18next`, `@tanstack/react-query`, `ui-contexts`, `ui-avatar`; build its missing `dist` or alias to `src`; fix `UiKitContext` event typing | New code only; the Livechat renderer is the size reference: 35 files, 1,471 lines for a subset of message blocks plus simple modal inputs [M] | New code plus a copy of about 8 small pure files first |
| What works at the end | Only blocks and elements whose dependencies mount: 12 ready blocks, 13 mounting elements, and every `Box` styling prop is at risk (77 hits) | Everything you write | The 12 ready blocks quickly, and a native answer where Fuselage has none (selects, pickers, image, video) |
| Blockers it leaves | 11 popover elements dead, 3 picker elements, 4 blocked blocks, literal tags in 6 files | None from Fuselage; costs an own implementation of ~27 blocks and 30 elements | Same as (b) for those; Fuselage blockers do not block |
| Drift from web | Follows web automatically | Hand-synced | Logic shared, look hand-synced |
| Effort | L, fragile | L overall, S to M per group | M to start, L overall |

**Recommendation: (c).** Option (a) fails first on bundling and then on 11 of 30 elements; it also depends on the `Box` decision. Option (b) alone duplicates logic that is already pure. In (c) the renderer lives in `apps/expo-lab/src/uikit` (no package edits). The shared logic is copied there first; extracting it into a package (`ui-kit` itself, or a new React package) is a later PR for the owner of `fuselage-ui-kit`.

### Order that unblocks the most first

| Step | What | Unblocks | Effort |
| --- | --- | --- | --- |
| 1 | Load `@rocket.chat/ui-kit` in Metro (including `typia`); a `SurfaceRenderer` subclass that renders text objects, `section`, `divider`, `header`, `actions` + `button`, `context`, `image` (block and element), `callout`, `alert`, `markdown` | about 10 message blocks and 4 elements, around 640 web lines to mirror [M: sum of the block files] | S to M |
| 2 | Message-surface interaction: the `UiKitContext`-equivalent, trigger ids, `sdk.rest.post`, confirm via `Alert`, link opening, the `notify-user` stream, and `UiKitMessageBlock` with the exact stack prop shape | every interactive message block | M |
| 3 | Modal surface and the `input` block with the simple inputs (`plain_text_input`, `number`, `email`, `url`, `rich_text_input`, `checkbox`, `radio_button`, `toggle_switch`, `linear_scale`), `viewSubmit` and state, `errors` | the form flow | M |
| 4 | Selects through a bottom sheet (static, multi, external, users, channels, conversations) and `overflow` as an action sheet | 11 elements | M to L |
| 5 | Date, time and date-time pickers, and `file_input` (new dependencies, upload adapter) | 4 elements | M |
| 6 | Contextual bar and banner surfaces, `tab_navigation` | two surfaces | M |
| 7 | `table`, `data_table`, `carousel`, `card`, `preview`, `info_card`, `file`, `video`, `container`, `layout`, `plan`, `task_card` | the remaining partial blocks | M each group |
| 8 | A native `rich_text` renderer; `data_visualization` first as its table fallback; `video_conf` out | last 3 blocks | M to L |

## 8. What to verify on the simulator next

Not run. A probe plan that needs no server:

1. Add a gallery cell "UiKit payloads" to `apps/expo-lab/src/GalleryContent.tsx`. Use payloads from `packages/fuselage-ui-kit/src/stories/payloads` (25 files [M: `ls`]: `section.ts`, `actions.ts`, `divider.ts`, `header.ts`, `image.ts`, `context.ts`, `input.ts`, `callout.ts`, `alert.ts`, `markdown.ts`, `richText.ts`, `table.ts`, `card.ts`, `preview.ts`, …), copied into the app or imported by relative path, plus the playground samples in `apps/uikit-playground/src/Payload` and the examples in `docs/features/uikit/reference.md`.
2. First check only that Metro bundles `@rocket.chat/ui-kit` and that `typia`'s runtime loads on Hermes (a subclass whose `plain_text`/`mrkdwn` return strings, called with one payload).
3. Render the same payload in the web Storybook of `fuselage-ui-kit` (`Message.stories.tsx`, `Modal.stories.tsx`, `Banner.stories.tsx`) and compare, as done for the Fuselage components in `NATIVE-GAP.md`.
4. Check `isSafeUrl` (uses `new URL(url, base)`) on Hermes, and that the native `Markup` draws `mrkdwn` from text objects.
5. Interaction needs a server with an installed app; see risk 5.

## 9. Risks and open decisions for the user

1. **Where the native renderer lives.** `apps/expo-lab` only (recommended for now) or a new package; and who owns extracting the DOM-free logic out of `fuselage-ui-kit`, which is a private package.
2. **App texts are localized per app** (`text.i18n` with namespace `app-<appId>`, resolved with `react-i18next`). The app has no i18n. Rendering only `text` loses app translations; a port needs the app language packs. Recommend `text` first.
3. **The `Box` styling-prop decision** (checklist decision x1) affects every block that reuses Fuselage layout.
4. **New native dependencies.** Date and time pickers, a file or document picker, an image-picker for the file input, a video player, a bottom sheet. Approve per group.
5. **Real interaction testing needs a server with an installed Rocket.Chat App.** The interaction endpoint sits under `apps/meteor/ee/server/api/apps/uikit.ts`; whether a development server needs a license for it was not checked. Without it only static rendering and the request shape can be tested.
6. **Untrusted content.** Apps send arbitrary image URLs, links and markup. The web renderer applies `isSafeUrl` to links and only allows absolute https URLs in `video`. A native renderer should keep the same checks and decide whether to load app images without a consent step.
7. **`typia` in Metro.** `ui-kit`'s `dist` imports `typia` at runtime. If Metro cannot load it, the fix is an alias or a build change in `ui-kit`.
8. **The stack's `UiKitMessageBlock` default is a fake**; the real one is in `apps/meteor/client/providers/MessagesProvider/renderers/UiKitMessageBlock.tsx` and uses `fuselage-ui-kit` [M, `git grep` on the stack tip]. The native provider must supply its own.
9. **The docs are a snapshot of October 2026** and nothing checks them against the code [R]. Re-check the support matrix before relying on a row.

## 10. What could not be determined

- Whether Metro loads `typia` and the ESM-style `.js` imports of `@rocket.chat/ui-kit`'s `dist`.
- Whether `Box` styling props have any effect on a device, and so how the "ready" blocks look.
- Whether Hermes handles `new URL(url, base)` as `isSafeUrl` needs.
- Which blocks and elements real Rocket.Chat Apps use most; the ordering in section 7 follows dependencies, not usage.
- Whether `useStableCallback`, `useSafely` and `useDebouncedCallback` from `@rocket.chat/fuselage-hooks` are DOM-free enough for native [I: they are state and ref hooks].
- How `Table*` lays out columns natively (they mount with a `Text` child; layout is unjudged).
- The exact path `api-client` builds for `/apps/ui.interaction/:id`.
- Whether an Apps-enabled test server is available for the round trip.
- The look and feel parity of anything: no composite was produced for UiKit.

## 11. Method

Run from `packages/` on this tree. "Files" count non-spec, non-story `.ts`/`.tsx` under `src` (127 for `ui-kit`, 120 for `fuselage-ui-kit`); each category is a `grep -E` over those files:

- Meteor: `Meteor|from .meteor`
- DOM globals: `\b(document|window)\.`
- `react-dom`, `react-aria|react-stately`, `gazzodown`, `katex|highlight`, `@nivo`, `@rocket.chat/ui-contexts`, `@rocket.chat/ui-avatar`, `@tanstack/react-query`, `i18next`, `typia`
- DOM types: `HTMLElement|MouseEvent|KeyboardEvent|ChangeEvent|FocusEvent|FormEvent|DragEvent|FileReader|\bFile\b|Blob`
- `Box` styling props: `<Box[^>]*\b(mi|mb|mbs|mbe|mie|mis|pi|pb|pbs|pbe|pis|pie|p|m|fontScale|color|bg|bc|w|h|maxWidth|minWidth|display|flexGrow|flexShrink|flexDirection|alignItems|justifyContent|withTruncatedText|size|borderRadius|elevation)=`
- Host tags: `<(div|span|img|a|p|h1|h2|h3|h4|h5|h6|ul|ol|li|input|textarea|button|table|tr|td|th|svg|form|label|video|iframe|section|figure|pre|code|hr|br)[ />]`
- Fuselage dependencies per block and element: the `import { … } from '@rocket.chat/fuselage'` lists in `blocks/*.tsx`, `elements/*.tsx` and `elements/*/*.tsx`.
- Native status: `/tmp/expolab/sweep-v4/raw/results.json` (not committed), the same run described in `NATIVE-SWEEP.md`.
- Livechat renderer size: files and lines of `packages/livechat/src/components/uiKit` without specs and stories (35 files, 1,471 lines).
