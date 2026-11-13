---
status: planned
adrs: [0001]
code:
  [
    apps/meteor/client/providers/MessagesProvider/useMessageRelatedDataValue.ts,
    apps/meteor/client/providers/MessagesProvider/placeConversationStore.ts,
    apps/meteor/client/hooks/useAutoLinkDomains.ts,
    apps/meteor/client/views/room/body/RoomMessageList/useMessages.ts,
    apps/meteor/client/views/room/body/RoomMessageList/useRegisterRenderedMessage.ts,
    apps/meteor/client/lib/RoomManager.ts,
    apps/meteor/client/views/room/body/hooks/useElementHeight.ts,
    apps/meteor/client/views/room/body/RoomMessageList/RoomMessageList.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/RoomMessageRow.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/MessageMarkers.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/useRoomMessageListData.ts,
    apps/meteor/client/views/room/body/RoomMessageList/useRoomJumpTarget.ts,
    apps/meteor/client/views/room/body/hooks/useRetryFirstPage.ts,
    apps/meteor/client/views/room/body/RoomMessageList/useScrollToBottomOnOwnMessage.ts,
    apps/meteor/client/views/room/body/RoomBody.tsx,
    apps/meteor/client/views/room/body/layout/RoomBodyContent.tsx,
    apps/meteor/tests/e2e/page-objects/fragments/home-content.ts,
    apps/meteor/client/lib/RoomHistoryManager.ts,
    apps/meteor/client/views/room/providers/RoomProvider.tsx,
    apps/meteor/client/styles/imports/general/base_old.css,
  ]
tests:
  [
    apps/meteor/client/providers/MessagesProvider/MessagesProvider.stability.spec.tsx,
    apps/meteor/tests/mocks/client/RelatedDataReader.tsx,
    apps/meteor/client/hooks/useAutoLinkDomains.spec.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/useMessages.spec.tsx,
    apps/meteor/client/lib/RoomManager.spec.ts,
    apps/meteor/client/views/room/body/hooks/useElementHeight.spec.ts,
    apps/meteor/client/views/room/body/RoomMessageList/RoomMessageList.spec.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/RoomMessageRow.spec.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/useRoomMessageListData.spec.tsx,
    apps/meteor/client/views/room/body/RoomMessageList/useRoomJumpTarget.spec.tsx,
    apps/meteor/client/views/room/body/hooks/useRetryFirstPage.spec.ts,
    apps/meteor/client/views/room/body/RoomBody.spec.tsx,
    apps/meteor/client/views/room/composer/ComposerSelectMessages.spec.tsx,
    apps/meteor/client/lib/RoomHistoryManager.spec.ts,
  ]
---

# Spec: The room's message list

## Summary

The room draws its messages with the package's `MessageList`. The room feeds it the room's loaded messages, the history manager's
flags and loaders, the `msg` jump target, the first unread message, the viewer's own-message test, the position the room store
saved, and a function that draws each message with the variant its type calls for. It keeps everything around the list: the
announcement, upload progress, drop target, unread banner, composer and error boundary. The read state (the unread banner and its
count and jump, mark-as-read and the rules that gate it, the saved position that unread messages override) is `develop`'s
(#42756), carried over with the list's `getVisibility()`, its visibility reports and `restoredPosition`. "Select all" selects what
the room's list has rendered and scrolls the list to the top. The room's old list, the hooks that guessed its scroll state and the
history manager's DOM measurements are gone.

## Motivation

See [the intent](../intents/room-message-list.md) and [message-list](message-list.md), whose Out of scope hands this capability the
room's side of the list. Unless a requirement says otherwise, each states what the room does on `develop` today.

What the room does on `develop` today (the base the requirement groups are written against), and where it is kept:

- **Opening.** The old `MessageList.tsx` decides once, when the room is first initialized: with a `msg` parameter it leaves the
  position to the jump; with no stored position (or one left at the bottom) it goes to the newest message; with a stored pixel offset
  it scrolls there, unless unread messages exist, which send it to the newest. Unread messages are the first unread id of the
  read-state manager, or a listed message newer than the subscription's last seen time that is not the viewer's and shows in the room
  (a thread reply counts only with `tshow`), so a room whose only unread messages are thread replies keeps its saved position
  (c124604a77b, c903f8edb3a, 323cfe908d8). Kept by R10 to R16.
- **The unread banner.** `UnreadMessagesIndicator` shows while the count is not zero. The count is the history manager's unloaded
  unread messages plus the room's stored messages not newer than the message at the top of the viewport and newer than the last seen
  time, recomputed from the top message (debounced 300 ms, and once without any scroll). Its jump sets `?msg=<first unread>&jumpContext=jumpToUnread`,
  marks the room as read and zeroes the loaded count. Kept by R17 to R22.
- **Mark as read.** The read-state manager marks the room as read on an attempt when its own rules allow, and answers "has the viewer
  reached the latest message" with a callback the room gives it: the viewer has given input in the messages area since the room opened
  (`hasUserScrolled`, from `useUserScrollIntent`), the list is at the bottom (60 px), no newer messages remain and the first history
  page loaded (7a6bb7e0842, 3daeeb52a35, 0c0763dca80). Input events ask for an attempt themselves, because a wheel or a key at the
  bottom scrolls nothing (ed58fe604fe, b3986884c7d); scroll events ask for it too (500 ms debounce). Whether the first unread mark is
  visible is asked from the list at the moment of the attempt. Kept by R23 to R30.
- **Jumps.** `useTryToJumpToMessage` fetches the message of `msg`, opens another room's message in its room, targets a thread
  reply's main message, loads the messages around an unloaded target, scrolls to it centered, highlights it for 2 s and clears `msg` once reached;
  `useGetMore` starts loading around `msg` at once when nothing is loaded. Kept by R31 to R38.
- **Select all.** Each rendered row registers itself while not selected (`useRegisterRenderedMessage`); "Select all" scrolls
  smoothly to the top and selects the registered ones. Kept by R45 to R48 (intent Q1).
- **Paging.** `useGetMore` loads no page before the viewer's first wheel, pointer press or scroll key in the messages, nor after a jump
  or the jump to recent rebuilds the window, until the next one; then it checks on each scroll, change of the rows and resize. Kept by
  R60.
- **The ends of the list.** The list has 21px above its first row and 10px below its last (`.messages-list`), and the element around
  it has 24px more below while newer messages remain (`.wrapper.has-more-next`), while "Jump to recent messages" stays 8px above the
  bottom of the messages area. Kept by R57.
- **Over the top of the list.** The upload progress and the unread banner are drawn over the top of the messages, and the floating
  date under them, which measures the day dividers from their bottom (`useDateScroll`). Kept by R61.
- **Providers.** `MessagesProvider` rebuilds its related-data value whenever the room or the subscription object changes, so every
  mounted row's readers render again for each arrival. Changed by R49 to R53, which the intent assigns to this branch.

## Behaviour

The **room's list** is the `MessageList` the room body renders. A **listed** message is one in the `messages` the room gives it. The
**unread** messages of a room are those of R12. **Input** is a wheel, touch move, key press, pointer press or click inside the
messages area (R25). The list's behaviour for any source is [message-list](message-list.md); the requirements below are what the
room does with it. The list is given `bottomThreshold` 60, the room's value on `develop`, so "at the bottom" below means within 60 px
of the end of the latest messages (message-list R17, R80).

**The list in the room**

- **R1** The room body MUST render one message list for the opened room, with role `list` named by the translation of
  `Message_list`, inside the room's error boundary. Switching to another room MUST show that room's list in its own opening
  position (R10 to R14), carrying nothing of the previous room's position or of the viewer's-input flag (R26).
- **R2** The room MUST draw a message of a system type with `SystemMessage`, any other thread reply with `ThreadMessagePreview`, and
  every other message with `RoomMessage`, each message once (message-variants R40).
- **R3** The room MUST pass `RoomMessage` `unread`, `mention` and `all` from whether the message is in the subscription's `tunread`,
  `tunreadUser` and `tunreadGroup`, and `ignoredUser` from whether its author is in the subscription's `ignored` (message-variants R40).
- **R4** A `ThreadMessagePreview` MUST sit in a `listitem` carrying `data-mid`, `data-tmid`, `data-unread` (the first unread
  message) and `data-sequential` (as the list decided it), and MUST be drawn sequential only when the list says so and the message
  does not start a day, as `develop` does (message-variants R10, R40).
- **R5** The room MUST pass the list the `Message_GroupingPeriod` setting (default 300) as the grouping period, and leave the grouping
  of thread replies at the list's default for a room (message-list R10, R11).
- **R6** The room MUST pass `bottomThreshold` 60 (develop's value; message-list Q2, answered).
- **R7** When the viewer can preview the room (`useCanPreviewRoom`), the room MUST give the list the start-of-room foreword, with
  the retention-policy warning below it while the policy is active, as its header, and `hasOlderMessages` as the history
  manager says. When the viewer cannot, the room MUST give no header and no older messages, and MUST show the notice with the
  translation of `You_must_join_to_view_messages_in_this_channel`, as today.
- **R8** The room MUST list the messages of the room that are not hidden, whose type is not in `Hide_System_Messages` or in the
  room's hidden system messages, and that are not thread replies unless the reply has `tshow` or the viewer's
  `showThreadsInMainChannel` is on, oldest first, as `useMessages` does today.
- **R9** The room MUST compose the list's floating date, its "New messages" button and its "Jump to recent messages" button.
  Activating "New messages" MUST take the list to the bottom and then focus the composer; activating "Jump to recent messages" MUST
  NOT focus it (message-list R23, R24; develop).

**Opening position**

- **R10** A room opened with no `msg` parameter, no saved position and no unread messages (R12) MUST open with its newest message at
  the bottom of the viewport (B1; message-list R13).
- **R11** A room reopened in the same session whose list was left away from the bottom, with no unread messages, MUST open with
  the message that was at the top at the same offset, within 1px; one left at the bottom MUST open at the bottom (B14;
  message-list R60).
- **R12** While the read-state manager has a first unread message id, or a listed message is newer than the subscription's last seen
  time (`ls`), was not written by the viewer and shows in the room (not a thread reply, unless it has `tshow`), the room MUST NOT
  give the list a saved position, so the list opens at the newest message (develop, c124604a77b, 323cfe908d8; message-list R62).
- **R13** A room whose only unread messages are thread replies that do not show in the room MUST keep the saved position
  (c903f8edb3a).
- **R14** The decision of R12 MUST be made from the messages listed when the list lists its first messages and from the first unread
  id then, not when the list mounts: a room whose messages, or whose first unread id, arrive after mounting MUST open at the newest
  message when they hold an unread message, and at the saved position when they hold none (message-list R61).
- **R15** A `msg` target MUST win over both the saved position and unread messages: the room opens centered on it (message-list R45).
- **R16** The room store MUST hold, as the only scroll state of a room, the position the list reports through `onPositionChange`
  (message-list R59, including the report at unmount and none before the list has placed itself), kept for the session as the
  store is. The store MUST NOT hold a pixel offset, a measurement cache, an at-bottom flag or a message count for the list (B14).

**The unread banner**

- **R17** The unread banner MUST show, with the translation of `unread_messages_counter` for the count, while the count is not
  zero and the room has an unread-since time, and MUST NOT show otherwise (develop).
- **R18** The count MUST be the history manager's unloaded unread messages plus the room's messages in the client's store that are not
  newer than the message at the top of the viewport and are newer than the subscription's last seen time, and MUST be zero for a
  viewer with no subscription (develop; the rules are not changed).
- **R19** The loaded part of the count MUST follow the `topMessage` of the list's reports: it MUST be counted from the first report,
  which the list makes without any scroll (message-list R55), recounted when the top message changes, at most once in 300 ms, and
  zero when the report has no top message (c124604a77b).
- **R20** Activating the banner MUST set the `msg` parameter to the history manager's first unread message, or, when it has none, to
  the earliest message of the room in the store that is newer than the unread-since time and shows in the room (not a thread reply
  unless `tshow`), with the `jumpContext` parameter `jumpToUnread`; MUST mark the room as read; and MUST zero the loaded count. With no
  such message it MUST do nothing.
- **R21** That jump MUST land on the first unread message centered, with its divider, whether the message was loaded or not, MUST NOT
  open a thread when the message is a thread reply, and the banner MUST then show no count (message-list R47; develop).
- **R22** The banner's "mark as read" control MUST mark the room as read and zero the loaded count, as today.

**Mark as read**

- **R23** The read-state manager's rules, and its spec, MUST NOT change: an attempt marks the room as read as `develop`'s does today.
  The room only gives it the two answers of R24 and R30, and asks for attempts (R27, R28).
- **R24** The room MUST answer the manager's "has the viewer reached the latest message" with true only while all of these hold: the
  viewer has given input in the messages area since the room was opened (R25), the list's `getVisibility()` says `isAtBottom` (asked at that
  moment, false when nothing was reported), no newer messages remain, and the room's first history
  page has loaded (7a6bb7e0842, 3daeeb52a35, 0c0763dca80; message-list R56, R57).
- **R25** The room MUST count as input a `wheel`, `touchmove`, `keydown`, `pointerdown` or `click` that reaches the messages area, which
  holds the list, its overlay buttons and the notice of R7, and MUST NOT count one in the composer, the banner or the contextual bar
  (develop, b3986884c7d). It MUST NOT depend on a scroll event.
- **R26** The flag of R25 MUST be false when a room opens and MUST stay false while the list alone moves (opening, an arrival, a jump,
  the position it restores); it MUST NOT carry over when the viewer switches rooms (develop).
- **R27** Each input MUST ask the manager for a debounced attempt (500 ms), also when it scrolls nothing because the list is already at
  the bottom (ed58fe604fe).
- **R28** Each report of the list MUST ask for a debounced attempt (500 ms) as each scroll event did, and a room with unread messages
  opened at the newest message whose first unread divider is out of view MUST NOT be marked as read by the opening alone, but when
  the viewer acts at the bottom (7a6bb7e0842).
- **R29** The attempts the room makes on a change of the route, of the subscription's alert or unread state and of the unread count
  MUST stay as `develop`'s (`useHandleUnread`).
- **R30** The room MUST answer the manager's "is the first unread message visible" with the list's `isFirstUnreadVisible`, asked
  synchronously at the moment of the attempt, and with false when nothing was reported (message-list R57).

**The jump target**

- **R31** A `msg` parameter naming a message of this room MUST become the list's `targetMessageId` once the message is fetched
  (`chat.getMessage`, as today).
- **R32** When the target is not listed, the room MUST load the messages around it once per target, until the list reports it reached
  (message-list R43), and when no history is loaded yet it MUST start loading around the `msg` message without waiting for the
  fetch of the message, as `useGetMore` does (Q1, answered).
- **R33** A `msg` naming a thread reply that does not show in the room (not the thread's main message, no `tshow`) MUST make the
  thread's main message the target.
- **R34** A `msg` naming a message of another room MUST open that room, and one naming a thread message MUST leave the jump to the
  thread tab, unless `jumpContext` is `jumpToUnread`, as today.
- **R35** A `msg` that cannot be fetched MUST be dropped from the address, and the room MUST keep its position.
- **R36** When the list reports the target reached, the room MUST clear `msg` if the target is the parameter's message, and MUST NOT
  write the highlight store: the list highlights the target (message-list R41, R48, R49).
- **R37** A jump with the foreword among the rows MUST land on the target itself and not on the message above it (branch 02, fix 1;
  message-list R42).
- **R38** A link to the same message followed after its parameter was cleared MUST jump again (message-list R46).

**Paging and the window**

- **R39** The room MUST load an older page with the history manager's `getMore` and a newer page with its `getMoreNext`; each load
  MUST settle when its page is in the store or failed, and MUST be the one load running, also against a page the room asks for in
  the same moment, as the retry of R59 does (message-list R32).
- **R40** The room MUST say `hasOlderMessages` from the manager's `hasMore` and `hasNewerMessages` from its `hasMoreNext`.
- **R41** The room MUST say the list loads newer messages only while a newer page it asked for loads; the first page, the messages
  around a target and the latest page MUST count as the initial load while nothing is loaded and as an older load otherwise, so no
  page starts while another loads (message-list R4, R32).
- **R42** The room's `onJumpToLatest` MUST clear the room's window before it loads the first page, so the list sees the latest messages
  at once and a failed load leaves it at the bottom of an empty window, not waiting (message-list D3; Q5).
- **R43** A message at the end of the list written by the viewer, including one the viewer sends from an older window, MUST take the
  list to the latest messages (B3; message-list R19, R20). The room MUST decide it by comparing the author with the viewer, and a
  thread reply MUST NOT count as the viewer's own message, as on `develop`, whether or not it shows in the room (Q3, answered). A reply
  in a thread MUST NOT count as an arrival either, whoever wrote it and whether or not it shows in the room: it takes the list nowhere
  and raises no "New messages", as on `develop`, where every streamed message that has a `tmid` is ignored (message-list R21, R22).
  The room MUST call the list handle's `scrollToBottom()` when the room stream delivers a message of the viewer's that is neither an edit
  nor a reply in a thread, as `develop` does: with newer messages remaining the list cannot tell the message from one inside its rows, and
  `scrollToBottom()` is what loads the latest window and ends at the bottom (message-list R20), from wherever the viewer reads.
- **R44** The history manager MUST NOT read or write the DOM, and MUST keep no scroll snapshot: loading a page changes no scroll
  position of its own (B5; message-list R36).

**Select all**

- **R45** Activating "Select all" in the composer MUST scroll the room's list to its first loaded message through the handle
  (message-list R69) and select every message the room's list has rendered that is not selected, and MUST select no message of a
  thread (intent Q1, answered (a); B18).
- **R46** Each message row the room's list renders, a room message, a system message or a thread preview, MUST register itself for
  "Select all" while it is mounted and not selected, and MUST unregister when it unmounts or is selected (message-variants R26).
- **R47** The messages of a thread MUST NOT register with the room's selection, from whichever place they render, whatever the state
  of the room's selection (branch 02, fix 5; message-variants R24, R25).
- **R48** The composer's "Select N messages" button MUST show as N the number of rendered messages that are not selected, follow
  scrolling, selecting and unselecting, and be disabled at 0; its "N messages selected" text MUST show the number selected
  (message-variants R26).

**What the providers hand the rows**

- **R49** A message arriving in the room, which adds it to the store and replaces the room (`lastMessage`, `lm`, `msgs`) and the
  subscription (`ls`, `lr`, `unread`, `alert`, `tunread`) by new objects, MUST NOT re-render a component of a mounted row that reads
  the related data of `MessagesProvider` (the roles of an author, a collapsible part, the parent message of a thread preview, a
  reaction), and MUST NOT re-render one that reads the conversation of its message and only the subscription's `broadcast` (intent;
  #43471).
- **R50** `useConversation` MUST take an optional `select`, a function of the conversation whose result the reader gets as `data`
  and re-renders for only when it changes (message-capabilities, message-variants R49; Q2, answered). A reader of the conversation of
  a message of the room MUST see the current room and subscription whenever it renders, and MUST re-render when what it selects
  changes: the reply-to-broadcast check re-renders when `broadcast` changes, and the toolbar shows the conversation as it is when it
  opens.
- **R51** A component that reads the related data MUST NOT re-render when the room or the subscription is replaced by an equal copy.
- **R52** A message arriving, or a change of the subscription that changes none of a message's markers (R3), MUST NOT render that
  message's row again, and the function the room gives the list to draw a message MUST NOT change with the subscription
  (message-list R71, R72). A change of a subscription of another room, or of anything else in the client, MUST cost no mounted row
  anything: rows read the room's subscription from the list, not from the client's stores.
- **R53** The roles of the room's authors MUST still be resolved once for the room's list, not once per header (message-variants R49;
  #43471).

**The composer**

- **R54** The composer MUST keep linking the domains of `Message_CustomDomain_AutoLink` that its text box links, and the hook that gives
  it those domains, with its spec, MUST live outside the room's old list directory, which is deleted for the room (branch 02, fix 6).

**What the room keeps, and what it leaves to the list**

- **R55** The room body MUST keep the announcement (not in the embedded layout), the upload progress while files upload, the drop
  target, the unread banner, the composer and the closing of the contextual bar by a click in the messages that is not on a button or
  link while `hideFlexTab` is on, as today.
- **R56** The keyboard of the room's messages MUST be the list's (message-list R66 to R68), with the composer the next stop after the
  list and the top of the room the one before it. The keys the list handles at the document (an arrow between messages, Tab through a
  message, Escape on a control) do not reach the messages area and so do not count as input (R25), as on `develop`.
- **R57** The room's list MUST keep 21px above its first row, and below its last row 10px, or 34px while newer messages remain, as part
  of those rows (`startSpacing` and `endSpacing`, message-list R83), so a room at the bottom rests with that space in view. The element
  around the list MUST NOT be shortened: at the end of the list, the last row then rests where `develop` draws it, 10px under its rows
  (`.messages-list`) and 24px more while newer messages remain (`.wrapper.has-more-next`), and "Jump to recent messages", which the
  list draws 8px above its own bottom, sits 8px above the bottom of the messages area, as on `develop`. Away from the end of the list
  while newer messages remain, rows show in the bottom 24px of the messages area, behind "Jump to recent messages", where `develop`
  left that band empty (intent Q2, answered (a) at the gate and reversed at review round 1, by the user; second review: the 24px kept
  outside the list raised the button by as much).
- **R58** The thread's list, the thread tab and what they use MUST keep working unchanged: nothing the thread's list still imports
  from the room's old list is deleted (Q9).
- **R59** While no message is listed, older messages remain and nothing loads, an input in the messages area (R25) MUST ask the
  history manager for the first page again, and a failed first page MUST leave the room able to retry that way, where `develop`
  retries on the viewer's next input (Q4, answered). A room the viewer cannot preview MUST NOT ask: it has no history to give, and
  every input would meet a refusal.

**Paging before the viewer's input**

- **R60** The room MUST NOT ask for an older or a newer page before the viewer's first input in the list, a scroll gesture, a scroll
  key or a pointer press (message-list R82), from when it opens, and again from when a jump, the jump to the latest messages or the
  viewer's own message replaces its window: it passes `deferPagingUntilInput`. A room opens with its first page alone, also when that
  page is shorter than the viewport, and the first input asks for the page that is due (user decision, review round 1; `develop`'s
  `useGetMore`).

**Over the top of the list**

- **R61** The room MUST give the list, as `overlayTopInset` (message-list R85), the height of what it draws over the top of the list:
  the upload progress while files upload, then the unread banner while it shows, in `develop`'s order. The height MUST follow either
  showing, hiding or changing size, so the floating date rests below them and stands in for the day divider under itself, as on
  `develop` (review round 1, second review: the date was drawn at the top of the list, behind them).

## Design

Decided in the plan.

## Out of scope

- The list's behaviour for any source: [message-list](message-list.md). Its defects D1 and D3 stay recorded there.
- The thread's list and the cleanup: branch 09 (`BubbleDate`, `useDateScroll`, the app's copy of the navigation hook, the thread's
  kept-mounted and keep-at-bottom hooks, the loading indicator and the highlight store's rename).
- The read-state manager's rules and the banner's look (R23).
- The rendering of a message row: [message-variants](message-variants.md).
- The e2e suites; the manual check of the scope stands in for them (one page-object selector, Q7).
- A retry control for a failed history load (R59 retries on input), and a smooth scroll for "Select all" (Q6).
- Keyboard row moves counting as input for the read state: they do not on `develop` either (R56).
- Dead props of the composer (`onResize`, which nothing calls) beyond removing what the room passes.

## Known defects

None; not implemented.

## Open questions

The two questions of the [intent](../intents/room-message-list.md) are answered there: ~~Q1, what "Select all" counts~~ is (a), the
rendered rows as `develop` (R45 to R48), and ~~Q2, padding~~ was (a), reversed at review round 1: `develop`'s space (R57). These are the spec's own,
answered at the spec gate by the orchestrator, for the user.

- **Q1** ~~When the `?msg=` request starts.~~ Answered: (a). It starts at once, in parallel with the fetch, as on `develop` (R32).
- **Q2** ~~How the readers of a message's conversation avoid re-rendering.~~ Answered: (b), an optional `select` on `useConversation`
  (R49, R50), with `message-capabilities` and `message-variants` R49 updated in the same commit.
- **Q3** ~~The viewer's own thread reply.~~ Answered: (b), contrary to the recommendation. A thread reply is not an own message for the
  list (R43). Done without a difference: the list takes a `countsAsArrival` predicate (message-list R19, R21, R22), and the room says that
  a thread reply is not an arrival, so it also raises no "New messages", own or not, as on `develop`.
- **Q4** ~~A failed history load in an empty room.~~ Answered: check first. The check is the reducer's: paging is checked on a commit of
  the messages, on a scroll, when positioning ends (also once a viewport that had no size gets one, message-list R81) and when a load
  settled that was waiting for a check, and, since the room waits for the viewer (R60), at the viewer's first input only (message-list
  R82); an empty list can neither commit new messages nor scroll. After a failed first page only the first input asks again, so later
  inputs meet a dead end, and (b) holds: the room retries on every input (R59), and a page the list asks for in that moment is the
  same load (R39).
- **Q5** ~~Whether the room can meet message-list D3.~~ Answered: it cannot, as analysed (R42). D3 stays pinned in `message-list`; a
  meteor spec rejects `getMore` after the clear.
- **Q6** ~~"Select all" scrolls instantly where `develop` scrolls smoothly.~~ Answered: (a), accepted, listed under the differences.
- **Q7** ~~The e2e page object's `.messages-list` selector.~~ Answered: (a), changed to the list's `role=list`; every use of
  `.messages-list` in e2e is checked, and the page objects touched are listed for QA.
- **Q8** ~~What the room store keeps besides `position`.~~ Answered: the dead fields go if nothing reads them (R16).
- **Q9** ~~What stays for branch 09.~~ Answered: (a). Only what the room alone used is deleted, and `useUserScrollIntent` stays; each
  deletion is checked against the thread's imports (R58).

### Corrections to the scope, for the plan

- Scope item 2 sends the visibility callback to "the unread count and mark-as-read", and "Select all" to `setAvailableMessages` of
  branch 06. Branch 06 did not add that method (rows register themselves through `useRegisterRenderedMessage`); intent Q1 decides
  what "Select all" counts, and under (a) the method is not added.
- Scope item 5 does not list `useUserScrollIntent` and its spec. They stay: R24 to R27 depend on them, on a wrapper of the list, as
  the input events bubble out of its viewport.
- Scope item 5 deletes `MessageList.tsx` without saying where #42756's unread decisions go: R12 to R14 (from the listed messages;
  the position kept for a thread reply alone), R19 (the count without waiting for a scroll).
- `JumpToRecentMessageButton` is at `views/room/body/`, not `components/body/`; only the room used it.
- The reference's `RoomBody.tsx` predates #42756, #43308, #43471 and #43627: it has no input gate for mark-as-read and no
  `setHasUserReachedLatestMessageCallback` (R24 to R27), computes `canPreview` inline instead of `useCanPreviewRoom` (R7), freezes
  `restoredPosition` at mount from the first unread id alone (R12 to R14), debounces nothing in the visibility callback (R19), passes
  the subscription object to each row, which re-renders every row on each arrival (R52), imports `useRoomMessages` from `RoomContext`
  (it is `hooks/useRoomMessages` at the base), keys the room by a `Box` where `develop` keys `BubbleDateScope` (the thread still uses
  that scope), uses `useTranslation` from `ui-contexts` (it is `react-i18next`, #43627), and drops the composer's `onResize`, which
  nothing calls.
- The composer's auto-link hook is at `views/room/MessageList/hooks/useAutoLinkDomains.ts`, with its spec, at the base; the reference
  has it at `client/hooks/useAutoLinkDomains.ts`. The plan moves it in a commit of its own, below the feature (R54).
- The comments in `RoomProvider.tsx` and `RoomHistoryManager.ts` name `useGetMore` and `useHasNewMessages`, which this branch deletes;
  the plan rewrites them.

### Where the new list differs from `develop`'s room

Decided above: "Select all" counts the rendered rows as `develop` does, so no difference
(intent Q1), but scrolls instantly (Q6). Not a decision: the saved position
is a message and an offset, not a pixel offset, and is saved at unmount as well; "New messages" is raised for the messages the list
shows, not for every streamed one, and not while an older window is shown (message-list R21); the composer growing is followed by the
list's own resize handling, as `onResize` was never called. Found at review round 1 and kept: the first input asks at once for a page
that is due, where `develop` waited for the next scroll, change of the rows or resize (R60); while newer messages remain, the overlay
scrollbar reaches the bottom of the messages area, where `develop`'s stopped 24px above it, since that space is now part of the
list's last row, and a viewer away from the end of the list sees rows in that band, behind "Jump to recent messages", where
`develop` showed none (R57).

## References

- [Intent](../intents/room-message-list.md); [message-list](message-list.md) R9, R13, R17, R19 to R21, R32, R41 to R49, R54 to R62, R69
  to R72, R80 to R83, D3; [message-variants](message-variants.md) R10, R24 to R26, R40, R47, R49; ADR 0001.
- `develop`: #42756 (`7a6bb7e0842`, `ed58fe604fe`, `b3986884c7d`, `3daeeb52a35`, `0c0763dca80`, `c903f8edb3a`, `323cfe908d8`,
  `c124604a77b`), #43308, #43471, #43627.
- Reference tag `message-list-ref`, commit `59f6fe6f2a5`: `RoomMessageList`, `RoomMessageRow`, `useRoomMessageListData`,
  `useRoomJumpTarget`; the behaviour list B1 to B21 (see message-list References).
- The scope: `.message-list/scopes/08-room-list.md`; the drift: `.message-list/BASE-DRIFT.md`.
