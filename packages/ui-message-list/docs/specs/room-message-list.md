---
status: draft
adrs: [0001]
code: []
tests: []
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
  (message-list R59, including the report at unmount), kept for the session as the store is. The store MUST NOT hold a pixel
  offset, a measurement cache, an at-bottom flag or a message count for the list (B14).

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
  fetch of the message, as `useGetMore` does (Q1).
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
  MUST settle when its page is in the store or failed, and MUST be the one load running (message-list R32).
- **R40** The room MUST say `hasOlderMessages` from the manager's `hasMore` and `hasNewerMessages` from its `hasMoreNext`.
- **R41** The room MUST say the list loads newer messages only while a newer page it asked for loads; the first page, the messages
  around a target and the latest page MUST count as the initial load while nothing is loaded and as an older load otherwise, so no
  page starts while another loads (message-list R4, R32).
- **R42** The room's `onJumpToLatest` MUST clear the room's window before it loads the first page, so the list sees the latest messages
  at once and a failed load leaves it at the bottom of an empty window, not waiting (message-list D3; Q5).
- **R43** A message at the end of the list written by the viewer, including one the viewer sends from an older window, MUST take the
  list to the latest messages (B3; message-list R19, R20). The room MUST decide it by comparing the author with the viewer.
- **R44** The history manager MUST NOT read or write the DOM, and MUST keep no scroll snapshot: loading a page changes no scroll
  position of its own (B5; message-list R36).

**Select all**

- **R45** Activating "Select all" in the composer MUST scroll the room's list to its first loaded message through the handle
  (message-list R69) and select every message the room's list has rendered that is not selected, and MUST select no message of a
  thread (intent Q1, recommended (a); B18).
- **R46** Each message row the room's list renders, a room message, a system message or a thread preview, MUST register itself for
  "Select all" while it is mounted and not selected, and MUST unregister when it unmounts or is selected (message-variants R26).
- **R47** The messages of a thread MUST NOT register with the room's selection, from whichever place they render, whatever the state
  of the room's selection (branch 02, fix 5; message-variants R24, R25).
- **R48** The composer's "Select N messages" button MUST show the number of the messages selected, follow scrolling, selecting and
  unselecting, and be disabled at 0 (message-variants R26).

**What the providers hand the rows**

- **R49** A message arriving in the room, which adds it to the store and replaces the room (`lastMessage`, `lm`, `msgs`) and the
  subscription (`ls`, `lr`, `unread`, `alert`, `tunread`) by new objects, MUST NOT re-render a component of a mounted row that reads
  the related data of `MessagesProvider` (the roles of an author, a collapsible part, the parent message of a thread preview, a
  reaction), and MUST NOT re-render one that reads the conversation of its message and only the subscription's `broadcast` (intent;
  #43471).
- **R50** A reader of the conversation of a message of the room MUST see the current room and subscription whenever it renders, and
  MUST re-render when a field it reads changes: the reply-to-broadcast check re-renders when `broadcast` changes, and the toolbar
  shows the conversation as it is when it opens.
- **R51** A component that reads the related data MUST NOT re-render when the room or the subscription is replaced by an equal copy.
- **R52** A message arriving, or a change of the subscription that changes none of a message's markers (R3), MUST NOT render that
  message's row again, and the function the room gives the list to draw a message MUST NOT change with the subscription
  (message-list R71, R72).
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
- **R57** The room's list MUST draw no padding above its first row or below its last (intent Q2, recommended (a)).
- **R58** The thread's list, the thread tab and what they use MUST keep working unchanged: nothing the thread's list still imports
  from the room's old list is deleted (Q9).

## Design

Decided in the plan.

## Out of scope

- The list's behaviour for any source: [message-list](message-list.md). Its defects D1 and D3 stay recorded there.
- The thread's list and the cleanup: branch 09 (`BubbleDate`, `useDateScroll`, the app's copy of the navigation hook, the thread's
  kept-mounted and keep-at-bottom hooks, the loading indicator and the highlight store's rename).
- The read-state manager's rules and the banner's look (R23).
- The rendering of a message row: [message-variants](message-variants.md).
- The e2e suites; the manual check of the scope stands in for them (one page-object selector, Q7).
- A retry control for a failed history load, and a smooth scroll for "Select all" (Q4, Q6).
- Keyboard row moves counting as input for the read state: they do not on `develop` either (R56).
- Dead props of the composer (`onResize`, which nothing calls) beyond removing what the room passes.

## Known defects

None; not implemented.

## Open questions

The two questions of the [intent](../intents/room-message-list.md) are open there and decide R45 to R48 (Q1, "Select all") and R57
(Q2, padding). These are the spec's own. Each carries a recommendation for the orchestrator to take when the user is away.

- **Q1** When the `?msg=` request starts. On `develop`, opening a link to an unloaded message starts loading around it at once (in
  `useGetMore`), in parallel with fetching the message; the reference waits for the fetch to learn the target, which is one round
  trip later, and until then the list shows an empty room with the older loader (the room's own first-page prefetch is skipped for
  a `msg`). (a) Keep `develop`'s: start loading around the raw id when no history is loaded, then load around the resolved target when
  it differs (a thread reply's main message), as `develop` does (R32). (b) The reference's: wait for the fetch. Recommended: (a);
  base wins, it is a few lines in the jump hook, and it keeps a first paint a round trip earlier.
- **Q2** How the readers of a message's conversation avoid re-rendering (R49, R50). `useConversation` returns the room and the
  subscription objects, which change on each arrival, and `useCanReplyToBroadcast` mounts for every room message. (a) The provider
  keeps one value and the conversation's identity changes only when a field a reader reads changes: the provider would have to know
  which. (b) `useConversation` takes an optional `select`, so a reader subscribes to what it reads (`broadcast`), the toolbar to the
  whole conversation while it is shown; the context stays one stable value read through the store. (c) Leave the readers, and bound
  the requirement to the other hooks, which re-renders every room message on each arrival. Recommended: (b): it is additive, keeps
  R49 to R51 provable with a counting reader, and the cost is one optional argument in the package's context type and its spec
  (`message-capabilities`, `message-variants` R49).
- **Q3** The viewer's own thread reply. `develop`'s "own message" path ignores thread replies (`msg.tmid` returns early); the list
  sees a thread reply as a row when it shows in the room, so one the viewer sends with `tshow`, or with `showThreadsInMainChannel`
  on, takes the list to the latest like any own message (R43). (a) Accept: a reply that shows in the room is a message at the end.
  (b) Have `isOwnMessage` say no for a thread reply. Recommended: (a); the viewer's message shows at the end and the list follows it,
  which is B3, and (b) would keep a quirk that hid it.
- **Q4** A failed history load in an empty room. After the first page fails, the list has no message to scroll and no scroll to check
  again (message-list R35), where `develop` retries on the viewer's next input. Opening the room again loads again, and a live message arriving
  probably does (the list checks after a change of its messages). This is not proven yet; the plan checks it with a play. (a) Accept, record it in the changeset notes and keep the engine
  as it is. (b) Retry from the room on input while nothing is listed and older messages remain. (c) Change the engine. Recommended: (a),
  and (b) only if the plan's check shows a dead end: the room already asks the manager on every input (R27), so (b) is one condition.
- **Q5** Whether the room can meet message-list D3 (a rejected `onJumpToLatest` leaves the list waiting) and so whether to fix it
  here. It cannot: the room's `onJumpToLatest` clears the window synchronously before it loads (R42), which drops the messages and
  `hasMoreNext` in the same update, so the list leaves its wait for the latest page before the load can reject; the load that fails
  is the first page of an empty window (Q4). D3 needs a promise that rejects while newer messages remain, which nothing in the room
  or the thread produces (the thread has no newer pages). (a) Leave D3 pinned in `message-list`, and prove R42's order in a meteor
  spec that rejects `getMore`. (b) Fix D3 here as its own commit below the feature. Recommended: (a); a fix changes the engine for a
  case no consumer can reach, and (b) can still be done on its own if a later consumer can.
- **Q6** "Select all" scrolls instantly where `develop` scrolls smoothly: the handle's `scrollToTop()` goes through the row model and
  `scrollToIndex`, and the engine does not offer a smooth scroll. (a) Accept. (b) Add a smooth option to the handle. Recommended: (a);
  a scroll the viewer did not ask to watch, which `prefers-reduced-motion` would remove anyway, is not worth a change to the engine.
- **Q7** The e2e page object `home-content.ts` finds the last thread preview with `div.messages-box .messages-list [role=link]`;
  the new list has no `messages-list` class, and the scope deletes the dead CSS for it. (a) Change that selector to the list's
  `role=list` in this branch. (b) Give the list a class. (c) Leave it. Recommended: (a); it is one selector, and the e2e suites
  are not run here (the scope's manual check stands in), so it is not new infrastructure.
- **Q8** What the room store keeps besides `position`: `lastTime`, `lm`, `update()` and its `changed` event are used by nothing
  else once the list's old fields go. (a) Delete them with the old fields, as the reference does. (b) Keep them. Recommended: (a);
  they are dead and R16 says the store holds one scroll state.
- **Q9** What stays for branch 09. The thread's list still uses, from the room's old list: `useKeepAtBottom`,
  `useKeepMountedMessages`, `LoadingMessagesIndicator`, `useDateScroll`, `BubbleDate` and `BubbleDateScope`, the app's
  `useMessageListNavigation`, `messageHighlightSubscription` (also used by editing and the editing context) and
  `useRoomMessages`' history state. (a) Delete only what the room alone used (the list of the scope's item 5, `useGetMore`,
  `useHasNewMessages`, `useIsAtBottomRef`, `useStoreScrollPosition`, `useSelectAllAndScrollToTop`, `JumpToRecentMessageButton`,
  `useTryToJumpToMessage`, `MessageList`, `MessageListItem`, `index.ts`, the dead CSS) and leave the rest, with
  `useUserScrollIntent` kept for the room; the plan checks each deletion against the thread's imports. (b) Also move the shared
  pieces now. Recommended: (a); the thread is branch 09's, and a move here would be a second concern in this branch.

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

Decided or recommended above: no padding at the ends (intent Q2); what "Select all" counts (intent Q1) and an instant scroll
(Q6); the `?msg=` request (Q1); an own thread reply (Q3); an empty room after a failed load (Q4). Not a decision: the saved position
is a message and an offset, not a pixel offset, and is saved at unmount as well; "New messages" is raised for the messages the list
shows, not for every streamed one, and not while an older window is shown (message-list R21); the composer growing is followed by the
list's own resize handling, as `onResize` was never called.

## References

- [Intent](../intents/room-message-list.md); [message-list](message-list.md) R9, R13, R17, R19 to R21, R32, R41 to R49, R54 to R62, R69
  to R72, R80, D3; [message-variants](message-variants.md) R10, R24 to R26, R40, R47, R49; ADR 0001.
- `develop`: #42756 (`7a6bb7e0842`, `ed58fe604fe`, `b3986884c7d`, `3daeeb52a35`, `0c0763dca80`, `c903f8edb3a`, `323cfe908d8`,
  `c124604a77b`), #43308, #43471, #43627.
- Reference tag `message-list-ref`, commit `59f6fe6f2a5`: `RoomMessageList`, `RoomMessageRow`, `useRoomMessageListData`,
  `useRoomJumpTarget`; the behaviour list B1 to B21 (see message-list References).
- The scope: `.message-list/scopes/08-room-list.md`; the drift: `.message-list/BASE-DRIFT.md`.
