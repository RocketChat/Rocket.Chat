---
status: implemented
adrs: []
code:
  [
    src/Message/variants,
    src/Message/hooks/useCanReplyToBroadcast.ts,
    src/Message/lib/splitQuoteAttachments.ts,
    src/Message/lib/toMessageActionOptions.ts,
    src/Message/MessageHeader.tsx,
    src/Message/MessageAuthorAvatar.tsx,
    src/Message/StatusIndicators.tsx,
    src/Message/ReadReceiptIndicator.tsx,
    src/Message/header,
    src/Message/hooks/useSelectableMessage.ts,
    src/Message/hooks/useIsMessageEmphasized.ts,
    src/Message/lib/getAuthorUsername.ts,
    src/Message/index.ts,
    src/Message/contexts/MessageRelatedDataContext.ts,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.tsx,
    apps/meteor/client/providers/MessagesProvider/useMessageRelatedDataValue.ts,
    apps/meteor/client/providers/MessagesProvider/useMessageEditingValue.ts,
    apps/meteor/client/providers/MessagesProvider/useRolesByUser.ts,
    apps/meteor/client/views/room/body/RoomMessageList/RoomMessageRow.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/useRegisterRenderedMessage.ts,
    apps/meteor/client/providers/MessagesProvider/messageSelectionFromStore.ts,
    apps/meteor/client/lib/MessageAction.ts,
    apps/meteor/client/views/room/contextualBar/MessageListTab.tsx,
    apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.tsx,
    apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.tsx,
    apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.tsx,
    apps/meteor/client/views/audit/components/AuditMessageList.tsx,
    apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.tsx,
  ]
tests:
  [
    src/Message/variants/RoomMessage.spec.tsx,
    src/Message/variants/room/RoomMessageContent.spec.tsx,
    src/Message/variants/SystemMessage.spec.tsx,
    src/Message/variants/system/SystemMessageContent.spec.tsx,
    src/Message/variants/ThreadMessage.spec.tsx,
    src/Message/variants/thread/ThreadMessageContent.spec.tsx,
    src/Message/variants/ThreadMessagePreview.spec.tsx,
    src/Message/variants/Variants.spec.tsx,
    src/Message/MessageHeader.spec.tsx,
    src/Message/MessageAuthorAvatar.spec.tsx,
    src/Message/StatusIndicators.spec.tsx,
    src/Message/ReadReceiptIndicator.spec.tsx,
    src/Message/header/MessageRoles.spec.tsx,
    src/Message/hooks/useSelectableMessage.spec.tsx,
    src/Message/hooks/useIsMessageEmphasized.spec.tsx,
    src/Message/hooks/useCanReplyToBroadcast.spec.tsx,
    src/Message/lib/getAuthorUsername.spec.ts,
    src/index.spec.ts,
    src/Message/contexts/contexts.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.conversation.spec.tsx,
    apps/meteor/client/providers/MessagesProvider/useRolesByUser.spec.ts,
    apps/meteor/client/providers/MessagesProvider/MessageVariants.contexts.spec.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/RoomMessageRow.spec.tsx,
    apps/meteor/client/views/room/contextualBar/MessageListTab.spec.tsx,
    apps/meteor/client/views/room/contextualBar/MessageSearchTab/MessageSearchTab.spec.tsx,
    apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageItem.spec.tsx,
    apps/meteor/client/views/room/contextualBar/Threads/components/ThreadMessageList.spec.tsx,
    apps/meteor/client/views/audit/components/AuditMessageList.display.spec.tsx,
    apps/meteor/client/views/audit/components/AuditMessageList.roles.spec.tsx,
    apps/meteor/client/views/omnichannel/contactHistory/MessageList/ContactHistoryMessage.spec.tsx,
  ]
---

# Spec: Message variants

## Summary

The package renders the row of every message in a conversation with four variants: `RoomMessage` (a message in the
room, in the pinned, starred and mentions tabs, in search and in the audit), `SystemMessage` (a message of a system type, such as a join),
`ThreadMessage` (a message inside a thread) and `ThreadMessagePreview` (the reply of a thread, as the room shows it). It also renders their
parts: the header with the author's name, username and roles, the avatar, the status indicators, the read receipt, the
checkbox of selection mode, the placeholder of an ignored message and the per-message fallback. The variants take what they
need from the app through the message contexts, among them the selection and editing contexts, and work with no provider.
`apps/meteor` supplies those two contexts from `MessagesProvider` and renders the package's variants in the room, in a
thread, in the tabs, in search and in the audit.

## Motivation

See [the intent](../intents/message-variants.md). The app's variants read the app directly, so which states a row can be
in, what shows in each place, and what a click, Space or Enter does to it, could only be checked by running the client.

Unless a requirement says otherwise, each one states what the variant does today on `develop`; the requirements that state
a change say so, and are marked with the question of the intent or of this spec that decides them.

## Behaviour

The places are: the **room** (`room-message-list`), a **thread** (`thread-message-list`), the
**tabs** (pinned, starred and mentions), **search** and the **audit**. The moderation, contact history, the modals and the
composer's quote draw message parts, not rows (`message-capabilities` R32 to R40), and the threads list draws its own items.

**The rows and what announces them**

- **R1** `RoomMessage` MUST render a `listitem` that can be focused (`tabIndex` 0) whose role description is the translation of
  `message`, with `id`, `data-id` and `data-mid` set to the message id, `data-unread` and `data-sequential` set to the `unread` and `sequential`
  props, and `data-own` true when the author is the viewer.
- **R2** `RoomMessage` MUST name its `listitem` by the elements it points at: for a message that is not sequential, the author's
  name, the time and the content, in that order; for a sequential one, the content alone; and, when read receipts are on, the read
  status after them. A message whose content cannot be drawn (R37) is named by the fallback in its place.
- **R3** `SystemMessage` MUST render a focusable `listitem` whose role description is the translation of `system_message`,
  with `data-system-message-type` set to the message's type.
- **R4** `ThreadMessage` MUST render a focusable `listitem` whose role description is the translation of `thread_message`,
  with the same `id` and `data-*` attributes as R1 (`data-unread` is R32's) and, as on `develop`, without `aria-busy`.
- **R5** `ThreadMessagePreview` MUST render an element with role `link`, focusable, whose role description is the translation of
  `thread_message_preview`.
- **R6** `RoomMessage`, `SystemMessage` and `ThreadMessagePreview` MUST pass the other props they are given (such as `data-mid`,
  `data-tmid`) to their root element, so the list can mark the rows it draws.
- **R7** Every variant MUST render with no provider at all, without throwing and without calling anything outside the package.
- **R8** Every state this spec lists MUST have a story, every story of the variants and their parts MUST pass an axe check with
  no violations, and a story MUST stack the four variants in a column without the list engine (a package decision; the
  conversation stories wait for branch 07, intent Q5, answered).

**Grouping**

- **R9** A `RoomMessage` or `ThreadMessage` marked `sequential` MUST show neither the avatar nor the header (name, username,
  roles, time and the private marker); its status indicators (R15) MUST show in the left column instead. One not marked
  sequential MUST show the avatar (R14) and the header, with the indicators inside the header.
- **R10** A `ThreadMessagePreview` marked `sequential` MUST leave out the row that says what the thread started with (R36) and
  show only the reply's row.

**The header and the author**

- **R11** The author's name in a header MUST be the message's alias when it has one, else the author's display name (the real
  name when `UI_Use_Real_Name` is on and the author has one, else the username), as a button that opens the author's user
  info (`openUserInfo` with the username) when activated and the author's user card (`openUserCard`) on hover. The
  name MUST be the target of neither while messages are being selected, since the row then toggles the selection (R20).
  The same holds for the name in a `SystemMessage`, which is the author's display name.
- **R12** A header and a `SystemMessage` MUST show `@<username>` after the name, in the same trigger, when, and only when, all
  of these hold: the viewer has not hidden usernames and the layout is not the mobile one (`display.showUsername`); `UI_Use_Real_Name` is
  on (`display.showRealName`); and the name being shown, once a leading `@` is removed, is not empty and differs from the
  author's username with its leading `@` removed. The name compared is the alias or the display name in a header, and the author's
  `name` in a `SystemMessage`. The name and the username elements MUST carry the username without its leading `@` in `data-username`.
  (`develop` `getAuthorUsername`, #43341. `display.showUsername` alone, which the app provides today, is not this rule.)
- **R13** A header MUST show roles only when `display.showRoles` is on: a tag for the workspace roles and a tag for the room roles
  of the author in the message's own room, then a tag `Bot` when the message comes from a bot. A tag MUST read the first
  role's label, followed by ` +N` for the N others, and its `title` MUST be `<Workspace_roles or Room_roles>: <every label, joined by ", ">`;
  a scope without roles has no tag and an author without roles who is not a bot has no tags at all. The labels MUST be the
  roles' descriptions, a role without one left out. A tag MUST NOT be a trigger (#43139), and no roles MUST be asked for while
  `display.showRoles` is off. Roles MUST be those of the message's own room, also in a place that lists messages of several rooms (global search).
- **R14** The avatar of a row MUST show, when the row is a `RoomMessage` or `ThreadMessage` that is not sequential, the author has a username, the
  place shows avatars (`display.showAvatars`) and, for a `RoomMessage`, messages are not being selected: the message's own avatar image
  when it has one, else the author's, or the emoji of `message.emoji`; presentational (hidden from assistive technology, since the
  name beside it is the control); opening the user card on hover and the user info on click. In a `RoomMessage`, that click MUST NOT reach the elements around
  the row (#43272: the user info closed right after it opened). A `ThreadMessage` MUST do the same (Q2, answered: a change for the thread, which `develop` does not stop). A
  `SystemMessage` shows a small avatar, when avatars are on and messages are not being selected, with the same hover and click, and a `ThreadMessagePreview`
  shows a small avatar of the reply's author, with no hover or click, on the same conditions.
- **R15** The status indicators of a `RoomMessage` or `ThreadMessage` MUST show, each with its icon and title: translated
  (`Translated`, when the place translates the message: `display.isTranslated`), following (`Following`, when the viewer follows the
  thread and the message is not its main message: `display.isFollowing`), sent by email (`Message_sent_by_email`), edited, pinned
  (`Message_has_been_pinned`), encrypted (a key, for an end-to-end encrypted message or a pinned one), and starred
  (`Message_has_been_starred`, only for a viewer subscribed to the room: `display.isStarred`). The edited indicator's title
  MUST be `Message_has_been_edited_at` with the date when the viewer made the edit, else `Message_has_been_edited_by_at` with
  the editor's username (`?` without one) and the date; it MUST be drawn as danger when the editor is not the author. The date MUST be in the
  viewer's date-and-time format (`display.formatDateAndTime`), where `develop` writes it with `toLocaleString()` (a change, intent Q2).
- **R16** When read receipts are on (`display.readReceipts.enabled`), a `RoomMessage` and a `ThreadMessage` MUST show a `status` named by the translation of
  `Message_sent` while the message is unread and `Message_viewed` once read, with a single or a double check respectively,
  and, in a `RoomMessage`, that status MUST be part of the row's name (R2). With them off, none shows.

**States of a row**

- **R17** A `RoomMessage` or `ThreadMessage` whose message is pending (`temp`) MUST be drawn with the pending look; a
  `RoomMessage` MUST also be `aria-busy`.
- **R18** A `RoomMessage` or `ThreadMessage` MUST be drawn with the editing look when, and only when, the editing context
  names its message, and with no editing look otherwise. A `SystemMessage` and a `ThreadMessagePreview` have none.
  (The editing context carries both the message being edited and the one a jump to a message lands on, R47.)

**Selection mode**

- **R19** While the selection context says messages are being selected, a `RoomMessage`, a `SystemMessage` and a
  `ThreadMessagePreview` MUST show a checkbox in the left column in place of the avatar, checked when the message is selected,
  named by the translation of `Select_message_from_user_with_preview` with the author's name (else username) and the
  message's text when it has any, else `Select_message_from_user` with the name. The row MUST be drawn selected while its message is selected.
  Outside selection mode there is no checkbox.
- **R20** In selection mode, a click on a `RoomMessage` or a `SystemMessage` MUST toggle that message in the selection and MUST
  NOT reach the elements around it (#36812: a click that reached them closed the Export Messages tab). Outside selection
  mode, a click does nothing and is not stopped.
- **R21** In selection mode, Space or Enter on the focused row of a `RoomMessage` or a `SystemMessage` MUST toggle that message and prevent the browser's
  default; no other key does, and outside selection mode no key does.
- **R22** In selection mode, a click, Space or Enter on a `ThreadMessagePreview` MUST toggle that message and MUST NOT open the thread.
- **R23** A click on the visible box of the checkbox MUST leave its message toggled once.
- **R24** A `ThreadMessage` MUST NOT be selectable: in none of its places does it show a checkbox, take a selection click or key, or register with the room's selection.
- **R25** The room, the tabs and search MUST give their rows the room's selection, so selection mode, the checkbox state and
  the toggles are the room's; a thread, and the audit, give their rows none, so a thread's messages never join the
  room's selection, whatever state the room's selection is in (branch 02's fix, kept).
- **R26** "Select all" and the composer's "Select N messages" button MUST work as today on the room's selection, as the room's list
  keeps them (`room-message-list` R45 to R48): the count and the messages selected are those the room list has rendered and are not selected yet, the count
  follows scrolling, selecting and unselecting, and the button is disabled at 0. The rows of a thread MUST add none to the count.

**Ignored messages**

- **R27** A `RoomMessage` MUST replace its content with the placeholder of `IgnoredContent` (`message-capabilities` R10: a button named by the translation of
  `Message_Ignored`) when its `ignoredUser` prop is true or its message is marked `ignored`, and the placeholder has not been
  revealed; the header, avatar and toolbar stay. Activating the placeholder MUST reveal that message's content only. The reveal MUST last as long as the row is mounted. A row that becomes ignored while
  it is mounted and not revealed MUST hide its content again.
- **R28** A `ThreadMessage` MUST behave as R27 for its `ignoredUser` prop alone; the thread's list MUST pass it true when the
  author is ignored in the subscription or the message is marked `ignored`.
- **R29** A `ThreadMessagePreview` whose message is marked `ignored` MUST show the translation of `Message_Ignored` in place of the reply's text,
  with no way to reveal it; when the message the thread started with is marked `ignored`, the same text MUST replace what the thread started with (R36).

**Encrypted messages not decrypted yet**

- **R30** A message of an end-to-end encrypted room that is not decrypted (`e2e` is `pending`) MUST show, in a `RoomMessage` and a
  `ThreadMessage`, a `document` whose role description is the translation of `message_body` and whose text is the translation of
  `E2E_message_encrypted_placeholder`, and no markdown body, until it is `done`; in a `ThreadMessagePreview` the same text MUST replace the body, and
  what the thread started with when that message is the pending one. A `RoomMessage` in that state MUST show no toolbar (R39).

**Markers of a thread's unread replies**

- **R31** A `RoomMessage` MUST pass its `unread`, `mention` and `all` props to the thread metrics of a thread's main message, so the badge says
  unread, "mentions you" or mentions everyone and the reply button is primary while unread (`message-capabilities` R19, R20), and MUST show the thread metrics only where the place allows interaction.
  The room, the tabs and search MUST pass them from the subscription (the message id is in `tunread`, `tunreadUser`, `tunreadGroup`); the audit passes none.
- **R32** A `ThreadMessage`'s `unread` prop means that it is the first unread message of the thread: it MUST only set `data-unread`.

**Content of each variant**

- **R33** A `RoomMessage` MUST draw its content, each part only when it applies, in this order: the placeholder of R30;
  quoted messages; the markdown body, when the message has no UiKit blocks and has markdown, and is not encrypted or is decrypted, with
  `<message id>-content` as its id and the search text highlighted; the other attachments; the UiKit blocks; URL previews, when the viewer's embeds
  setting is on; the action links; the reactions, when there is one; the thread metrics, for a thread's main message where the place
  allows interaction; the discussion metrics, for a discussion; the shared location; the broadcast reply (R38); and the read receipt.
- **R34** A `ThreadMessage` MUST draw its content in this order, each part only when it applies: the placeholder of R30; quoted messages;
  the markdown body, on the same conditions as R33; the UiKit blocks; the other attachments; URL previews; the action links; the reactions; the shared location; the
  broadcast reply; and the read receipt. It MUST NOT draw thread metrics or discussion metrics.
- **R35** A `SystemMessage` MUST show the author's name (R11, R12), the text of the message's type (a `document` whose role description is
  the translation of `system_message_body`, and nothing when the type is unknown) and the time, whose `title` is the date and time, then
  its attachments and its action links. The body and the attachments with the action links MUST each have their own fallback (R37).
- **R36** Unless sequential, a `ThreadMessagePreview` MUST show what the thread started with, loaded from the message's `tmid` (`useParentMessage`): a skeleton while it loads and
  nothing when it fails; the text of its type when it is a system message; `Message_Ignored` (R29); else its text as an inline preview of its
  markdown, with an attachment's description or title when it has no text and `Message_with_attachment` when it has neither, the encrypted
  placeholder when pending (R30), and without the quote's first line when it starts with a quote. Under it, the reply's row MUST show the reply with the same rules, and
  a translated indicator after the text when the reply is translated (`display.isTranslated`), in the origin too. Activating the preview outside
  selection mode with a click, Enter or Space MUST open the thread (`openThread` with the room, the thread id and as target the message the thread started with, once it has loaded, and nothing before),
  or, when sequential, with the reply itself as target.
- **R37** The content of a `RoomMessage` or `ThreadMessage` that throws while it renders MUST be replaced by `MessageContentFallback`
  (the translation of `Message_could_not_be_displayed`, with the id `<message id>-content` in a `RoomMessage`), and nothing else of the row nor of another
  row may be affected; it MUST draw the content again when the message changes. A `SystemMessage` MUST do the same for its body and its attachments with action links, each apart.
- **R38** A part that applies to nothing MUST draw nothing, in particular no `0` where `actionLinks` or `reactions` is empty (a change: `develop` draws it, intent Q3). The broadcast reply
  (`MessageBroadcastMetrics`) MUST show only where the place allows interaction, the viewer is subscribed to a room that is a broadcast, the author has a username and is not the viewer (a change for places that do not allow interaction: `develop` shows it, intent Q3).

**The toolbar**

- **R39** A `RoomMessage` MUST render `MessageToolbarHolder` with the `context` it is given, unless its message is private,
  an end-to-end encrypted one not decrypted yet, or messages are being selected; a `ThreadMessage` MUST render it for the place
  `videoconf-threads` when its message is a video conference and `threads` otherwise, unless its message is private; it keeps it for an encrypted message not decrypted yet, as today (Q6, answered; a known defect). `SystemMessage` and
  `ThreadMessagePreview` MUST render none. Where interaction is off the holder renders nothing (`message-toolbar` R1, R25, R26).

**Where the app renders rows**

- **R40** The room's list MUST draw each message with `ThreadMessagePreview` when it is a thread reply, with `SystemMessage` when it
  has a system type and with `RoomMessage` otherwise, passing `sequential` as the list decides it today (branch 08 owns that rule),
  the markers from the subscription (R31) and `ignoredUser` from the subscription's ignored users; its day divider MUST write the date in the viewer's date format.
- **R41** A thread's list MUST draw each message with `SystemMessage` when it has a system type and with `ThreadMessage` otherwise, passing `unread` for the
  first unread message (R32) and `ignoredUser` as R28 says.
- **R42** The pinned, starred and mentions tabs MUST draw each message with `SystemMessage` or with `RoomMessage` as the room does, never sequential, with the markers from the
  subscription and `context` set to `pinned`, `starred` or `mentions`.
- **R43** Message search MUST draw its results as the tabs do, with `context` `search` and the search text, which MUST be highlighted in the body (R33).
- **R44** The audit MUST draw each message with `SystemMessage` or with `RoomMessage`, never sequential, with no markers and no ignored state, in a provider that allows no
  interaction, so it shows no toolbar and no thread metrics, and its rows MUST follow the viewer's display settings: the time, the roles, the
  username (R12), the read receipt and URL previews (a change, `message-capabilities` R36 to R40 and intent Q1).
- **R45** Omnichannel contact history MUST draw the status indicators of its messages with the package's `StatusIndicators` (R15).
- **R46** No place MUST pass the app's `showUserAvatar` any longer: a row MUST read whether avatars show from the display context (Q5, answered).

**What the app provides**

- **R47** `MessagesProvider` MUST provide the editing context from the store that jumps to a message and editing both write to, so the id it carries is the one
  that store holds and it changes whenever the store does, in every list that shows the message (room, thread, tabs, search), until the
  store is renamed in branch 09 (the bridge: a jump highlights a message in the thread's list as it does today; the room's list highlights through the engine, `room-message-list` R36). Where the place does not allow interaction it MUST provide none (Q4, answered).
- **R48** `MessagesProvider` MUST provide the selection context only when it is given a selection. The room's list, the tabs and search MUST give the room's
  selection (`messageSelectionFromStore` over the room's selected messages store, with the same identity across renders); a thread
  and the audit MUST give none.
- **R49** `MessagesProvider` MUST answer the data the variants read about other things: the conversation of a message (its room and subscription, from the place's own when the message is of its room, else the stores, with no request,
  R38; a reader may pass `select` to take only what it reads, and is then given that, and renders again only when it changes, `room-message-list` R50), the labels of an author's roles in a room (R13), and the message a thread started with (from the store, else
  fetched with the others asked for in the same half second), each with `data`, `isLoading` and `isError`. The roles of a place's own room MUST be resolved once for the
  place, in `MessagesProvider`, not once per header (#43471; Q1, answered).
- **R50** Wherever the app mounted `MessageListProvider`, it MUST mount `MessagesProvider` with the same room and subscription, and no place may provide
  the old list context.

**Exports**

- **R51** The package MUST export `RoomMessage`, `SystemMessage`, `ThreadMessage`, `ThreadMessagePreview`, `MessageHeader`, `StatusIndicators`,
  `ReadReceiptIndicator` and `MessageRoles` with their props types, and the app's `MessageActionContext` and `MessageActionConfig` MUST be the package's types.

**Roles that cannot be fetched**

- **R52** Where the roles of a room cannot be fetched (the endpoint answers an error, as it can for an auditor who is not in the
  room), a header MUST still render, with its name, time and content and without roles, and the app MUST surface no error for it
  (intent Q1). Roles that cannot be fetched MUST NOT keep the rest of the row from rendering.

## Design

The package owns the four variants and their parts (`src/Message/variants`, `src/Message`), built only from the contexts: a row's
display, navigation, related data, renderers, selection and editing come from them, never from the app. A header takes the roles its place
resolved (`usePlaceUserRoles`) or looks them up for the message's room, as two components. `display.showUsername` stays "the viewer has not
hidden usernames"; the real-name and name-difference conditions of R12 belong to the parts that show a name (`getAuthorUsername`), so the two
are not treated as equal (`message-capabilities` notes). The selection click and the avatar click stop at their element (R14, R20), as in
`develop`, and `useSelectableMessage` is the one place a row learns what a click, Space or Enter does to it.

The app owns the provider's values: `MessagesProvider` resolves the roles of its room once (`useRolesByUser`), answers the conversation of a
message from its own room and subscription or the stores (applying a reader's `select`), and provides the editing context from the highlight store and the selection it is
given. Bridges, with their end: (1) the editing context reads the store that jumps and editing write to (R47), until the rename in branch
09; (2) the room's selection for the room's list, tabs and search, none for a thread or the audit (R48, `roomMessageSelection`); (3) each
row the room's list renders registers itself for "Select all" while it is not selected (`useRegisterRenderedMessage`, in `RoomMessageRow`), as the old variants
did, which `room-message-list` R46 keeps.

The thread list and the tabs stay and draw the package's variants; they mount `MessagesProvider` directly where the old list
provider was. The app's variants and their parts, the old list context and its provider, the highlight context and `useMessageBody` are
deleted, and `lib/MessageAction.ts` re-exports the package's types. "No `components/message` is left in the app" is a check of the plan (a file
listing), not a requirement, as `message-capabilities` R35 was. `message-capabilities` R33 is retired, R34 and its notes follow, and the
code and tests lists of the specs of branches 03 to 05 point at the moved proofs.

## Out of scope

- The list engine, scrolling and virtualization (branch 07), and the conversation stories that render it (intent Q5).
- The room list: its rows, day and unread dividers, the way it decides `sequential` and the markers (branch 08). R40 states
  only what it passes.
- The thread list and the cleanup (branch 09): the rename of the highlight store, and the unused capabilities of the interactions
  context (intent Q4).
- The content parts (`message-capabilities`, `message-attachments`) and the toolbar (`message-toolbar`): this spec only places them.
- The moderation, contact history, the modals, the composer's quote and the threads list, which draw parts and not rows, except R45.
- Naming the thread and system rows for assistive technology (Q3), and any change to the keyboard model of the lists.

## Known defects

Behaviour on `develop` that the variants carry over. The checker rejects a `D` entry without a skipped test that pins it,
so each is a `D<n>` entry with its test. `D1` (a jump replacing the editing look of the message being edited, while jumps and editing
shared a store) was fixed with the thread's list, which takes its highlight from the list as the room's does (`thread-message-list` R32,
R47); its number is not reused.

### D2 The reveal of an ignored message ends when its row unmounts

An ignored message is revealed by local state of its row (R27), so a row that unmounts, as one scrolled away does, hides it again when
it mounts. Pinned by the skipped test "keeps the content of a revealed message revealed when the row mounts again" in `RoomMessage.spec.tsx`.

### D3 Activating the checkbox input toggles the message twice

The row and the checkbox both toggle the selection, so activating the input itself (assistive technology, a script) toggles twice and leaves the
message as it was. A click on the visible box toggles three times and ends toggled once (R23; measured on `develop`'s structure with Fuselage's
`CheckBox`: a click on the input toggled twice, a click on its visible box three times). Pinned by the skipped test "toggles once when the checkbox
input itself is activated" in `RoomMessage.spec.tsx`.

### D4 A thread preview has no per-message fallback

A `ThreadMessagePreview` whose content throws while it renders takes its list down: the other variants replace only the failing content (R37).
Pinned by the skipped test "shows a placeholder instead of failing when the content cannot be rendered" in `ThreadMessagePreview.spec.tsx`.

### D5 Space on a thread preview does not prevent the default

Space on a focused `ThreadMessagePreview` opens the thread without preventing the browser's default, which also scrolls. Pinned by the skipped
test "prevents the default of Space when it opens the thread" in `ThreadMessagePreview.spec.tsx`.

### D6 A pending encrypted message in a thread keeps its toolbar

`RoomMessage` shows no toolbar for an end-to-end encrypted message not decrypted yet (R39), and `message-toolbar` R25 says the same of the thread's message, but
`ThreadMessage` keeps it (Q6, answered). Pinned by the skipped test "renders no toolbar for an encrypted message that is not decrypted yet" in
`ThreadMessage.spec.tsx`.

### D7 A system or thread message has no accessible name

`RoomMessage` is named by its name, time and content (R2); `SystemMessage` and `ThreadMessage` have a role description and no name (Q3, answered). Pinned by
the skipped tests "names the row of a system message" in `SystemMessage.spec.tsx` and "names the row of a thread message" in `ThreadMessage.spec.tsx`.

### D8 The preview of a reply to a system message writes the text from the reply

When the thread started with a system message, `ThreadMessagePreview` writes the text of its type from the reply, not from the message the thread started with (R36).
Pinned by the skipped test "writes the text of the type from the message the thread started with" in `ThreadMessagePreview.spec.tsx`.

## Open questions

The intent's questions 1 to 5 were answered at the spec gate (2026-11-13), all with the recommended option. So were these.

- **Q1** ~~Whether the roles of a place's own room are resolved once for the place or per header.~~ Answered: once, in
  `MessagesProvider`, as `develop` does since #43471 (R49).
- **Q2** ~~Whether the avatar click of a `ThreadMessage` stops reaching the elements around the row.~~ Answered: it does, like the room's (R14).
- **Q3** ~~Whether `ThreadMessage` and `SystemMessage` are named for assistive technology.~~ Answered: no, in this branch; recorded as a defect (R2, Known defects).
- **Q4** ~~Whether a place that allows no interaction shows the editing look.~~ Answered: none (R47).
- **Q5** ~~Whether the `showUserAvatar` prop goes.~~ Answered: it goes (R46).
- **Q6** ~~Whether `ThreadMessage` hides its toolbar for a pending encrypted message.~~ Answered: no, as today; recorded as a defect (R39, Known defects).

## References

- [Intent](../intents/message-variants.md)
- [message-capabilities](message-capabilities.md) R10, R19 to R20, R32 to R40; [message-attachments](message-attachments.md);
  [message-toolbar](message-toolbar.md) R1, R25, R26
- The message states of the reference's `docs/features/message-list/message-components.md`, where `develop` differs, the requirements follow `develop`
- `develop`: #43139 (row built on `Item`), #43341 (`hideUsernames`), #43471 (roles per list, `useMessageBroadcast`), #43272 (avatar click), #36812 (selection click and the Export Messages tab)
- WCAG 2.1 AA, for R8 (a package decision for how it is checked: axe over the stories)
