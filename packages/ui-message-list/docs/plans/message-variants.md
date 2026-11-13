# Plan: Message variants (from specs/message-variants.md, 2026-11-13)

Status: done.

The package half is copied from the frozen reference (`message-list-ref`): the variants and their parts from `a7d7c91b0e0`
(shells, stories and specs; the conversation stories of `a32cdc39835` go to branch 07, intent Q5). The app half adapts
the reference's consumer commits (`59f6fe6f2a5`, `cae3b5390c6`, `f119239375d`, `96c0d70d3e7`, `33af7a776f0`,
`f4fdb69a149`, `9572a7ddfae`) to the base, one place at a time, because the old lists stay. `develop` wins wherever it
differs from the reference, and every variant is compared with `develop`'s, not only with the reference's.

Regressions in the reference that the plan does not copy:

- Header and `SystemMessage` without the username (#43341): R12.
- `MessageRoles` with a click that opens the user card (removed by #43139, R13); `*LeftContainer` names Fuselage no longer has.
- The selection click without `stopPropagation` (R20, #36812); `useSelectableMessage` returns `toggle` for the click, so it
  must be given the event.
- The avatar click without `stopPropagation` (R14, #43272), and the thread's avatar click, which `develop` also leaves open
  (Q2: both stop).
- The roles of every header resolved by its own query (#43471, R49): the place resolves them once.
- `length && <Part/>` drawing `0` (R38) is fixed in the old variants first, as its own commit; the reference's `> 0` and
  `allowsInteraction` for the broadcast reply are what the package keeps.
- `ThreadMetrics` without an open chat: kept (R31), every place that allows interaction is inside a room.
- The editing look from a row-state context of the list engine (`MessageRowStateContext`, branch 07): `useIsMessageEmphasized`
  reads the editing context only, which the app feeds from the shared highlight store (R47).
- The preview's parent parsed with every content option (`useNormalizedMessage`): `develop` parses with the custom
  domains, emoticons and the translations only; the stored markdown is used as is, so the preview is the same (R36).

Departures from the scope:

- `useIsVisible` is the one of `@rocket.chat/ui-client` (branch 05); `normalizeUsername`, the threads list's parts and `useParentMessage` were done
  by earlier branches. `useCanReplyToBroadcast` is added (the variants read it).
- "Select all" is fed by each rendered row registering itself in the room's store (`useRegisterRenderedMessage`, which, like
  the old `useIsSelectedMessage`, registers a message only while it is rendered and not selected), not by a list-level `setAvailableMessages`: the old list
  cannot know which rows virtua has mounted, so a list-level method would change the count (R26). The method is therefore not
  added; the registration is the bridge, and ends with branch 08.
- `showUserAvatar` goes from every caller (R46).
- The stories of the variants use the package's `mockMessageProviders` (branch 03); no new test infrastructure.

Departures found in implementation (the steps below say where):

- The commit that drops the highlight context comes after the one that deletes the old tree, which still imported it.
- `MessageListProvider` was given an interim `selection` prop (steps 12 and 13) until it was deleted with the old tree (step 16),
  where its four mount sites mount `MessagesProvider` with the room, the subscription and, for the room's list, tabs and search, the room's
  selection (`roomMessageSelection`, one instance).
- The proofs of the specs of branches 03 to 05 that sat in `RoomMessage.contexts.spec.tsx` moved with it to
  `providers/MessagesProvider/MessageVariants.contexts.spec.tsx`, now rendering the package's variants.
- `message-capabilities` R33 is retired: the old list context it kept in agreement is deleted.

Follow-ups (not in this branch):

- Branch 09, as its own commit: remove the fourteen capabilities of the interactions context that nothing in the package
  reads (`pin`, `unpin`, `star`, `unstar`, `markUnread`, `translate`, `showOriginal`, `edit`, `canDelete`,
  `requestDeletion`, `openReport`, `openReactionList`, `openReadReceipts`, `startDiscussion`) with their provider code
  and `message-capabilities` R28's wording (intent Q4).
- Branch 07: the conversation stories of the reference.
- Branch 09: the rename of the highlight store, and the thread list's jump highlight left set when it closes early.
- Optional, from branch 05: `useCountQuickReaction` reads the emoji picker context inside each reaction action.

## Files that change

Package `packages/ui-message-list`:

- `src/Message/variants/{RoomMessage,SystemMessage,ThreadMessage,ThreadMessagePreview}.tsx` (+ specs, stories): new (R1 to R10, R14, R17 to R22, R24, R27 to R32, R35 to R37, R39).
- `src/Message/variants/room/RoomMessageContent.tsx`, `thread/ThreadMessageContent.tsx`, `system/SystemMessage{Body,Content}.tsx`, `threadPreview/*`: new (R30, R33 to R38) (+ specs).
- `src/Message/{MessageHeader,MessageAuthorAvatar,StatusIndicators,ReadReceiptIndicator}.tsx`, `header/MessageRoles.tsx` (+ specs, stories): new (R11 to R16).
- `src/Message/hooks/{useSelectableMessage,useIsMessageEmphasized,useCanReplyToBroadcast}.ts`, `lib/{getCheckboxLabel,splitQuoteAttachments,toMessageActionOptions}.ts`: new (R18 to R21, R23, R33).
- `src/Message/variants/Variants.stories.tsx` (+ axe spec): the stacked story (R8).
- `src/Message/index.ts`, `src/index.spec.ts`: exports (R51).

App `apps/meteor`:

- `client/components/message/variants/*`: the old thread variant's avatar click, `0`, broadcast and date format are fixed first (R14, R38, R15); then the tree is deleted.
- `client/providers/MessagesProvider/{MessagesProvider.tsx,useMessageRelatedDataValue.ts,useMessageEditingValue.ts (new),useRolesByUser.ts (moved)}` (+ specs): R47, R49, R52.
- `client/views/room/providers/SelectedMessagesContext.tsx`: drops `useIsSelectedMessage` and `useToggleSelect`, which only the deleted variants used (step 16); the room's list registers its rows through `useRegisterRenderedMessage` (R26, R50).
- `client/views/room/MessageList/{MessageListItem.tsx,MessageList.tsx}`, `contextualBar/MessageListTab.tsx`, `MessageSearchTab/MessageSearchTab.tsx`, `Threads/components/{ThreadMessageItem,ThreadMessageList}.tsx`, `views/audit/components/AuditMessageList.tsx`, `omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx`: draw the package's variants (R25, R26, R40 to R46, R48).
- `client/views/room/MessageList/providers/MessageListProvider.tsx`, `components/message/list/MessageListContext.tsx`, `views/room/MessageList/hooks/{useMessageBody,useRolesByUser}.ts`, `contexts/MessageHighlightContext.tsx`, `providers/MessageHighlightProvider.tsx`, `views/room/Room.tsx`: deleted or unmounted (R50).
- `client/lib/MessageAction.ts`: re-exports the package's types (R51).
- `.changeset/*.md`: one per visible change: thread avatar click, no stray `0`, no broadcast reply where interaction is off, edited date format, the audit's display settings (`@rocket.chat/meteor`, `patch` unless a change adds behaviour, then `minor`).
- Specs `message-capabilities`, `message-attachments`, `message-toolbar` (`code`, `tests`, R32, R34, R25's wording, Out of scope), this plan and the spec: last.

## Order of work

Each step is one commit and builds and passes on its own. Steps 1 to 4 are fixes of the old variants, below the feature.

1. Fix, thread avatar click (R14, Q2): the old `ThreadMessage` stops the click like `RoomMessage`. Spec in `ThreadMessage.spec.tsx`.
   Changeset.
2. Fix, no stray `0` (R38): `RoomMessageContent` and `ThreadMessageContent` test `length > 0` for the action links and the
   reactions. Specs in the content's spec. Changeset.
3. Fix, no broadcast reply where interaction is off (R38): `allowsInteraction &&` in both contents. Specs. Changeset.
4. Fix, the edited indicator in the viewer's date-and-time format (R15, intent Q2): `StatusIndicators` reads
   `useMessageDisplay().formatDateAndTime`; the old context's `useMessageDateFormatter` is left for step 16. Spec.
   Changeset.
   4a. Fix, the toolbar of a message uses its own room (R49): the toolbar of a message found by a search in all rooms asked the open
   chat for its room and subscription, so it offered the actions of the room that is open; `useConversation` reads the
   stores by the message's room. Spec in `MessagesProvider.conversation.spec.tsx`, failing on its parent. Changeset.
5. Enabling, package: the related-data context gets `usePlaceUserRoles(uid, rid)`, the labels a place already resolved for its
   whole list, or `undefined` (default), so the header can take the place's resolution or look the roles up itself as two
   components, as `develop`'s `MessageHeaderRoles` and `MessageHeaderRolesByScope` do; a conditional hook is not allowed
   (R49). Departure found in implementation: `useUserRoles` alone cannot do both without calling a hook conditionally.
   Spec: `contexts.spec.tsx`.
6. Enabling, roles once per place (R49, R52): `useRolesByUser` moves under `MessagesProvider`; `MessagesProvider` resolves
   the roles of its room once and `useUserRoles` answers from it, falling back to the author's roles in the message's own
   room for another room's message; a failed request leaves no roles and no error. Nothing reads it yet. Spec in
   `MessagesProvider.spec.tsx`.
   6a. Enabling, the conversation of a message without a query (R49, R38), behaviour-neutral after 4a: `useConversation` answers from the
   place's room and subscription, else from the stores, synchronously. The reference (and branch 03) fetched it with one query per message,
   which the base removed in #43471 (`useMessageBroadcast` read the room context or the store); the broadcast reply of every
   row would have brought it back. Spec in `MessagesProvider.spec.tsx`; the toolbar spec's message takes the room's id.
7. Enabling, editing context (R47, Q4): `MessagesProvider` provides `MessageEditingContext` from the highlight store
   (`useSyncExternalStore`), and none where interaction is off. Nothing reads it yet. Spec in `MessagesProvider.spec.tsx`.
   The defect "jump replaces the editing look" is recorded (`D1`) with a skipped test here.
8. Package, parts (R9 to R16, R19 to R21, R23, R51 in part): `MessageHeader`, `MessageAuthorAvatar`, `MessageRoles`,
   `StatusIndicators`, `ReadReceiptIndicator`, `useSelectableMessage`, `useIsMessageEmphasized`, `getCheckboxLabel`, with
   `develop`'s username rule (R12, a `getAuthorUsername`-equivalent in the header, not in `display.showUsername`), no role
   click, `stopPropagation` on the avatar and on the selection click. Stories, specs, exports. Spec `code` and `tests` grow.
9. Package, `RoomMessage` and its content (R1, R2, R6 to R9, R17 to R21, R23, R25 in part, R27, R30, R31, R33, R37 to R39):
   `useCanReplyToBroadcast`, `splitQuoteAttachments`, `toMessageActionOptions`, the story and spec. Known defects `D2`
   (the reveal ends when the row unmounts), `D3` (the checkbox input) get skipped tests.
10. Package, `SystemMessage`, `ThreadMessage`, `ThreadMessagePreview` (R3 to R5, R10, R22, R24, R28, R29, R32, R34 to R37,
    R39): the three variants and their parts, stories, specs, the stacked story (R8), the exports (R51). Known defects `D4` to
    `D8` get skipped tests (no per-message fallback in the preview, Space without `preventDefault`, a pending encrypted
    message keeps the thread toolbar, no accessible name for thread and system rows, the system parent's text).
11. App, the read-only places (R44, R45, R52, intent Q1): the audit draws `RoomMessage` and `SystemMessage` of the package;
    contact history draws `StatusIndicators` of the package; the audit's roles request can fail without an error. A
    changeset (`@rocket.chat/meteor`, `minor`): the audit shows time, roles, usernames, read receipts and URL previews.
12. App, the room's list (R25, R26, R40, R46, R48, R50 in part): `MessageListItem` draws the package's variants,
    `MessageListProvider` gives `MessagesProvider` the room's selection (`messageSelectionFromStore(selectedMessageStore)`,
    one instance), each rendered row registers itself in the room's store (R26), the day divider reads the display
    context's date format. Spec in `MessageListItem.spec.tsx`, `MessageList.spec.tsx`.
13. App, the tabs and search (R25, R42, R43, R46, R48): `MessageListTab` and `MessageSearchTab` draw the package's
    variants with the room's selection. Specs.
14. App, the thread's list (R24, R25, R28, R32, R41, R46): `ThreadMessageItem` draws `ThreadMessage` and the package's
    `SystemMessage`; no selection is given, and the thread's own selection store is gone. The branch 02 spec ("keeps the
    thread's messages out of the room's selection") keeps passing through the new path.
15. App, drop the highlight context (R47): `MessageHighlightContext` and `MessageHighlightProvider` and its mount in
    `Room.tsx` go; the store stays. Nothing visible.
16. App, delete the old message tree (R50): `components/message/**`, `MessageListProvider` (the four mount sites mount
    `MessagesProvider` with the room, the subscription and, for the room's list, tabs and search, the room's selection),
    `MessageListContext`, `useMessageBody`, `useRolesByUser`'s old spec and what only they used; update the specs of
    branches 03 to 05 (`code`, `tests`, R32, R34, their notes). Done when no file imports a deleted file.
17. App, `lib/MessageAction.ts` re-exports the package's types (R51). Nothing visible.
18. Docs: the spec's Design, `code`, `tests`, defects and status; this plan `done`.

## Risks

- The room's list is the busiest place. `MessageListItem` is rendered per row: the selection value and the editing value
  must keep their identity (`messageSelectionFromStore` is built once; the editing value is a string), so one change does not
  render every row twice. The reference read the room's selection above its providers and shared one value among readers; the
  plan keeps one store and per-message selectors (`useIsMessageSelected`).
- The checkbox: a click on the visible box toggles three times through the row and the checkbox and ends toggled once; a
  click on the input toggles twice and ends unchanged (measured on `develop`'s structure with Fuselage's `CheckBox`).
  R23 holds for the box and the input's behaviour is `D3`; changing the wiring changes R23.
- Roles: a hook cannot be called conditionally, so the header takes the place's resolution (`usePlaceUserRoles`) in one
  component and, when there is none for the message's room (a global search result of another room), renders a second
  component that looks the roles up by scope, as `develop` does.
- Between steps 6 and 16 the old lists and the provider's new values coexist; the roles are resolved twice (same query
  keys, no extra request). Stopping after step 10 leaves the package complete and unused.
- The audit's roles can be forbidden: R52 is proven with a failing endpoint. The audit resolves roles per header, not once per
  place: the place's resolution is keyed by one room (`useRolesByUser(rid)`), and the audit lists messages of several rooms, so
  once-per-place there would need a resolution for a set of rooms in `MessagesProvider`'s API, a design change this branch does
  not make. Each audited row subscribes to `roles-change` as `develop`'s header did outside a list provider.
- The related-data value changes when the place's room or subscription object does (a message arriving updates the
  subscription), so the readers of every mounted row render again. Keeping it stable needs the room and the subscription read
  from an external store by selectors, which would change where `useConversation` reads them; left for the list engine (07), which
  owns the rows' rendering.
- `message-toolbar` R25 and `message-capabilities` R32 and R34 say things this branch changes: they move in step 16.
- Hover, focus, the layout, and the scroll position cannot be proven in jsdom: manual check (the scope's list).
- `oxlint --fix` rewrites `SelectedMessagesContext.tsx` and `lib/autotranslate/autotranslate.ts` unrelated lines: kept out.

## Proof

Paths are package-relative (`src/...`) or under `apps/meteor/client/`. The titles end with the requirement they prove.

| Requirement | Proven by                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1          | `src/Message/variants/RoomMessage.spec.tsx`, "renders a focusable list item with its role description and data attributes (R1)", "marks a row of another author as not its own (R1)"                                                                                                                                                                                                                                                               |
| R2          | `src/Message/variants/RoomMessage.spec.tsx`, "names the row by the name, the time and the content, and by the content alone when sequential (R2)"                                                                                                                                                                                                                                                                                                  |
| R3          | `src/Message/variants/SystemMessage.spec.tsx`, "renders a focusable list item with its role description and type (R3)"                                                                                                                                                                                                                                                                                                                             |
| R4          | `src/Message/variants/ThreadMessage.spec.tsx`, "renders a focusable list item with its role description and data attributes (R4)"                                                                                                                                                                                                                                                                                                                  |
| R5          | `src/Message/variants/ThreadMessagePreview.spec.tsx`, "renders a focusable link with its role description (R5)"                                                                                                                                                                                                                                                                                                                                    |
| R6          | "passes the other props to its root (R6)" in `RoomMessage.spec.tsx`, `SystemMessage.spec.tsx` and `ThreadMessagePreview.spec.tsx`                                                                                                                                                                                                                                                                                                                  |
| R7          | `src/Message/variants/Variants.spec.tsx`, "renders every variant with no provider (R7)"                                                                                                                                                                                                                                                                                                                                                            |
| R8          | `src/Message/variants/Variants.spec.tsx`, "stacks the four variants (R8)" and the stories' axe tests (R8) there and in each variant's spec                                                                                                                                                                                                                                                                                                         |
| R9          | "leaves out the avatar and the header of a sequential message and moves the indicators (R9)" in `RoomMessage.spec.tsx` and `ThreadMessage.spec.tsx`                                                                                                                                                                                                                                                                                                |
| R10         | `src/Message/variants/ThreadMessagePreview.spec.tsx`, "leaves out the origin row when sequential (R10)"                                                                                                                                                                                                                                                                                                                                            |
| R11         | `src/Message/MessageHeader.spec.tsx`, "shows the alias or else the display name as a trigger ... (R11)", "is not a trigger while messages are being selected (R11)", "shows the time ... (R11)", "says that only the viewer can see a private message (R11)"; `SystemMessage.spec.tsx`, "shows the display name as a trigger ... (R11)"                                                                                                            |
| R12         | `src/Message/MessageHeader.spec.tsx`, "shows the username only when usernames, real names and a different name all apply (R12)"; `src/Message/lib/getAuthorUsername.spec.ts`; `SystemMessage.spec.tsx`, "shows the username next to the author's name under the same rule as a header (R12)"                                                                                                                                                       |
| R13         | `src/Message/MessageHeader.spec.tsx`, "shows the roles the place resolved ... (R13)", "looks the roles up in the message's own room ... (R13)", "asks for no roles while roles are off ... (R13)"; `src/Message/header/MessageRoles.spec.tsx`                                                                                                                                                                                                      |
| R14         | `src/Message/MessageAuthorAvatar.spec.tsx`; "shows only under its conditions (R14)" and "opens the user info on click without ... (R14)" in `RoomMessage.spec.tsx`; the avatar tests of `ThreadMessage.spec.tsx`, `SystemMessage.spec.tsx`, `ThreadMessagePreview.spec.tsx`; `components/message/variants/ThreadMessage.spec.tsx` for the step-1 fix of the old component, until deleted                                                           |
| R15         | `src/Message/StatusIndicators.spec.tsx`, "shows each indicator with its title (R15)", "shows nothing for a plain message (R15)", "writes the edit in the viewer's date and time format ... (R15)"; `components/message/StatusIndicators.spec.tsx` for the step-4 fix of the old component, until deleted                                                                                                                                           |
| R16         | `src/Message/ReadReceiptIndicator.spec.tsx`; `RoomMessage.spec.tsx`, "names the row by the read status after the content when read receipts are on (R16)"                                                                                                                                                                                                                                                                                          |
| R17         | `RoomMessage.spec.tsx`, "draws a pending message with the pending look and marks it busy (R17)"; `ThreadMessage.spec.tsx`, "draws a pending message with the pending look (R17)"                                                                                                                                                                                                                                                                   |
| R18         | `src/Message/hooks/useIsMessageEmphasized.spec.tsx`; "draws the message being edited ... (R18)" in `RoomMessage.spec.tsx` and `ThreadMessage.spec.tsx`                                                                                                                                                                                                                                                                                             |
| R19         | `RoomMessage.spec.tsx`, `SystemMessage.spec.tsx`, `ThreadMessagePreview.spec.tsx`, the checkbox tests (R19); `src/Message/hooks/useSelectableMessage.spec.tsx`                                                                                                                                                                                                                                                                                     |
| R20         | `src/Message/hooks/useSelectableMessage.spec.tsx`, "toggles by a click on the row and keeps the click on it (R20)"; `RoomMessage.spec.tsx`, "toggles the selection by clicking the row ... (R20)", "does nothing when it is clicked outside selection mode (R20)"; `SystemMessage.spec.tsx`                                                                                                                                                        |
| R21         | `src/Message/hooks/useSelectableMessage.spec.tsx`, "toggles with Space and Enter and prevents the default ... (R21)", "ignores Space and Enter outside selection mode (R21)"; `RoomMessage.spec.tsx`                                                                                                                                                                                                                                               |
| R22         | `ThreadMessagePreview.spec.tsx`, "toggles the selection instead of opening the thread while selecting ... (R22)"                                                                                                                                                                                                                                                                                                                                   |
| R23         | `RoomMessage.spec.tsx`, "toggles once by a click on the visible box of the checkbox (R23)"                                                                                                                                                                                                                                                                                                                                                         |
| R24         | `ThreadMessage.spec.tsx`, "is never selectable (R24)"; `views/room/contextualBar/Threads/components/ThreadMessageItem.spec.tsx`, "keeps the messages of the thread out of the room's selection ... (message-variants R24)"; `ThreadMessageList.spec.tsx`, "gives the messages of the thread no selection ... (message-variants R24, R25)"                                                                                                          |
| R25         | `views/room/body/RoomMessageList/RoomMessageRow.spec.tsx`, "draws the rows with the room's selection (R3, message-variants R25)"; the tab specs "gives the messages the room's selection ..."; `ThreadMessageList.spec.tsx`                                                                                                                                                                                                                        |
| R26         | `views/room/body/RoomMessageList/RoomMessageRow.spec.tsx`, "registers a rendered row for Select all while it is not selected (R46, message-variants R26)", "stops counting a row that unmounts (R46, message-variants R26)"; `views/room/composer/ComposerSelectMessages.spec.tsx`, "counts the rendered messages not selected, follows selecting and is disabled at 0 (R48)"                                                                      |
| R27         | `RoomMessage.spec.tsx`, "hides the content of an ignored user or message until revealed, and again when the user is ignored (R27)", "reveals one message only, with Enter (R27)"                                                                                                                                                                                                                                                                   |
| R28         | `ThreadMessage.spec.tsx`, "hides the content of an ignored user ... (R28)", "does not hide a message that is marked ignored by itself ... (R28)"; `ThreadMessageItem.spec.tsx`, "passes ignoredUser for an author ignored in the subscription and for an ignored message (message-variants R28)"                                                                                                                                                   |
| R29         | `ThreadMessagePreview.spec.tsx`, "shows Message_Ignored for an ignored reply and an ignored origin ... (R29)"                                                                                                                                                                                                                                                                                                                                      |
| R30         | "shows a placeholder for an encrypted message until it is decrypted (R30)" in `RoomMessage.spec.tsx` and `ThreadMessage.spec.tsx`; the two (R30) tests of `ThreadMessagePreview.spec.tsx`                                                                                                                                                                                                                                                          |
| R31         | `src/Message/variants/room/RoomMessageContent.spec.tsx`, "shows the metrics of a thread main message with the unread, mention and all markers ... (R31)", "shows that the viewer follows a thread they replied to (R31)"                                                                                                                                                                                                                           |
| R32         | `ThreadMessage.spec.tsx`, "sets data-unread from unread and draws nothing else for it (R32)"                                                                                                                                                                                                                                                                                                                                                       |
| R33         | `RoomMessageContent.spec.tsx`, "draws its parts in order, each only when it applies (R33)" and the other (R33) tests                                                                                                                                                                                                                                                                                                                               |
| R34         | `src/Message/variants/thread/ThreadMessageContent.spec.tsx`, "draws its parts in order and no metrics (R34)", "renders UiKit blocks before the attachments ... (R34)", "gives the body no id, as the row of a thread message is not named by it and the room may show the same message (R34)"                                                                                                                                                      |
| R35         | `SystemMessage.spec.tsx`, "shows the name, the text of the type, the time, the attachments and the action links (R35)", "draws no text for an unknown type ... (R35)"; `src/Message/variants/system/SystemMessageContent.spec.tsx`                                                                                                                                                                                                                 |
| R36         | `ThreadMessagePreview.spec.tsx`, the (R36) tests: what the thread started with, the skeleton, an attachment, a system message, and the three ways to open the thread                                                                                                                                                                                                                                                                               |
| R37         | "shows a placeholder instead of failing when the content cannot be rendered (R37)" in `RoomMessage.spec.tsx` and `ThreadMessage.spec.tsx`; `SystemMessage.spec.tsx`, "shows a placeholder for content that cannot be rendered ... (R37)"; `RoomMessage.spec.tsx`, "draws the content again once the message changes (R37)"                                                                                                                         |
| R38         | "draws no 0 for empty action links and reactions (R38)" and the broadcast (R38) tests in `RoomMessageContent.spec.tsx` and `ThreadMessageContent.spec.tsx`; `components/message/variants/*Content.spec.tsx` and `RoomMessage.spec.tsx` for the steps 2 and 3 fixes of the old components, until deleted                                                                                                                                            |
| R39         | `RoomMessage.spec.tsx`, "renders the toolbar holder with the place it is given (R39)", "renders no toolbar for a private message, a pending encrypted one, or while selecting (R39)"; `ThreadMessage.spec.tsx`, "renders the toolbar holder for the thread place, or for a call (R39)", "renders no toolbar for a private message (R39)"; `providers/MessagesProvider/MessageVariants.contexts.spec.tsx`, "the toolbar" (message-toolbar R25, R26) |
| R40         | `views/room/body/RoomMessageList/RoomMessageRow.spec.tsx`, "draws a system message once, a thread reply as a preview and the rest as room messages (R2, message-variants R40)"; `RoomMessageList.spec.tsx`, "writes the day dividers in the viewer's date format (R1, message-variants R40)"                                                                                                                                                       |
| R41         | `ThreadMessageItem.spec.tsx`, "draws a thread message or a system message, and the first unread one marked (message-variants R41)"                                                                                                                                                                                                                                                                                                                 |
| R42         | `views/room/contextualBar/MessageListTab.spec.tsx`, "draws each message with its variant, never sequential, with the markers of the subscription (message-variants R42)", "offers the jump to the message and the menu of the pinned place (message-variants R42, R43)"                                                                                                                                                                            |
| R43         | `views/room/contextualBar/MessageSearchTab/MessageSearchTab.spec.tsx`, "draws the results with the search place and highlights the search text (message-variants R43)", "offers the jump to the message and nothing else inline, in the search place (message-variants R42, R43)"                                                                                                                                                                  |
| R44         | `views/audit/components/AuditMessageList.display.spec.tsx`, "the display settings of the viewer (message-variants R44)"                                                                                                                                                                                                                                                                                                                            |
| R45         | `views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.spec.tsx`, "draws the status indicators of a message of the contact history with the package (message-variants R45)"                                                                                                                                                                                                                                                           |
| R46         | "reads whether avatars show from the display context (R2, message-variants R46)" in `RoomMessageList/RoomMessageRow.spec.tsx` and `ThreadMessageItem.spec.tsx`; `AuditMessageList.display.spec.tsx`, "shows no avatar when the viewer turned avatars off (R44, R46)"; `tsc` for the removed prop                                                                                                                                                   |
| R47         | `providers/MessagesProvider/MessagesProvider.spec.tsx`, "the message with the editing look (message-variants R47)"                                                                                                                                                                                                                                                                                                                                 |
| R48         | `providers/MessagesProvider/MessagesProvider.spec.tsx`, "the selection of the room (message-variants R48)"; `views/room/body/RoomMessageList/RoomMessageList.spec.tsx`, "gives the messages the room's subscription and selection through the messages provider (R1, message-variants R48, R50)"                                                                                                                                                   |
| R49         | `providers/MessagesProvider/MessagesProvider.spec.tsx`, "the roles of the authors of a place", "the conversation of a message", "the message a thread started with" (message-variants R49); `src/Message/contexts/contexts.spec.tsx`; `providers/MessagesProvider/MessagesProvider.conversation.spec.tsx`, "answers the message's own room and subscription for a message of another room than the open one (message-variants R49)"                |
| R50         | `views/room/body/RoomMessageList/RoomMessageList.spec.tsx`, "gives the messages the room's subscription and selection through the messages provider (R1, message-variants R48, R50)"; `ThreadMessageList.spec.tsx`; a file-listing check of the deleted tree (done in step 16, not a test)                                                                                                                                                         |
| R51         | `src/index.spec.ts`, "exports the variants and their parts (message-variants R51)"; `tsc` for the re-exported types                                                                                                                                                                                                                                                                                                                                |
| R52         | `providers/MessagesProvider/MessagesProvider.spec.tsx`, "leaves no roles and raises no error when they cannot be fetched (message-variants R52)"; `views/audit/components/AuditMessageList.roles.spec.tsx`                                                                                                                                                                                                                                         |
