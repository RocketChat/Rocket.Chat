---
status: planned
adrs: [0001]
code: []
tests: []
---

# Spec: The thread's message list

## Summary

The thread draws its replies with the package's `MessageList`, the list the room already uses. The thread feeds it the main message
and the replies it has, oldest first, the flags and loaders of its paged query (older replies are the query's previous pages, newer
ones its next pages), the `msg` jump target, the first unread message, the viewer's own-message test and a function that draws each
message with `SystemMessage` or `ThreadMessage`. It composes only the floating date, passes `bottomThreshold` 20, waits for the viewer's input before it pages, keeps no position,
gives its messages no selection and takes its jump highlight from the list. The conference thread panels draw the same list. The
highlight store that jumps and editing shared becomes the editing store, written only when a message is edited, and the fourteen
capabilities of the interactions context that nothing reads are removed with what the thread's old list leaves behind.

## Motivation

See [the intent](../intents/thread-message-list.md), [message-list](message-list.md), whose Out of scope hands this capability the
thread's side of the list, and [room-message-list](room-message-list.md), which did the same for the room. Unless a requirement says
otherwise, each states what the thread does on `develop` today, with branch 02's fixes (the base of this stack). What it does, and
where the requirements keep it:

- **Opening.** The thread opens at its latest reply (`shouldJumpToBottom` starts true), or, with a `msg` parameter, on that message;
  unread replies move nothing, they only get the divider; the thread keeps no position, so reopening starts again. Kept by R6, R7,
  R15, R41.
- **Staying at the bottom.** The viewer counts as at the bottom within 20 px of the end, with no newer replies to load; arrivals,
  growing content and the composer or panel resizing keep it there. Kept by R16 to R18.
- **The main message.** It is the first row once no older reply remains (`!hasPreviousPage`); while older replies remain the first
  row is the older loader. While the first page loads there are no rows at all. Kept by R4, R10 to R14.
- **Paging.** Older replies load 200 px from the top, newer ones 200 px from the end, one page at a time, after the viewer has
  touched the list and not while a jump settles; the loaders are rows of the list. Kept by R19 to R24; the distances differ: newer
  pages at 20 px (intent Q1), older ones at a third of the viewport (R19).
- **Links to a reply.** `?msg=` names a reply or the main message. A reply that is not loaded gets the replies around it loaded
  (`chat.getThreadMessages` with `aroundId`, which answers the first page for the main message), once per link; the thread scrolls
  to it, highlights it for 2 s, and clears `msg` 500 ms after finding a reply, never when it names the main message, which the room
  clears. The highlight is written to the store jumps and editing share, and stays set when the thread closes within 2 s, because only
  its timer is cleared. Kept by R25 to R32.
- **Own replies.** The viewer's reply, optimistic or confirmed, takes the thread to the bottom; from an older window it first
  resets the thread's replies to the latest page. Kept by R33 to R37 (intent Q2 for when).
- **Live embeds and the date.** The rows of messages with a player or a preview stay mounted; the floating date hides the day
  divider it covers so a day shows once. Kept by R38 to R41 (intent Q4).
- **The read state.** The thread is marked as read when its first page loads and when a reply arrives, through the chat of the
  thread; the first unread message of the room's read state gets the divider. Kept by R41, R42.
- **Keyboard.** One tab stop, arrows between messages, Tab to the composer, Shift+Tab to the top. Kept by R43.
- **No selection.** The thread's messages never join the room's selection. Kept by R44.
- **The conference panels.** Both mount the thread's own chat. Kept by R52.

## Behaviour

The **thread's list** is the `MessageList` that `ThreadChat` renders for the open thread. The **replies** are the messages of the
thread the paged query holds, and the **main message** is the one the thread hangs off. A **window** is the replies loaded. The
**older loader** and the **newer loader** are the rows of `message-list` R2. "At the bottom" means within 20 px of the end of the
latest replies (`message-list` R17, R80). The list's behaviour for any source is [message-list](message-list.md); the requirements
below are what the thread does with it.

**The list in the thread**

- **R1** `ThreadChat` MUST render one message list for the open thread, with role `list` named by the translation of
  `Thread_message_list`, inside the room's error boundary, whether the thread is the room's thread tab or one of the conference
  panels (R52). It MUST NOT need a floating-date registry or the room's selection provider.
- **R2** The thread MUST draw a message of a system type with `SystemMessage` and every other message, the main message included,
  with `ThreadMessage`, passing `unread` for the first unread message and `ignoredUser` from the subscription's ignored users or the
  message's own mark, each message once (`message-variants` R28, R41).
- **R3** The list's `aria-busy` MUST be true exactly while the first page, an older page or a newer page of replies loads, and false
  otherwise (`message-list` R1).
- **R4** While the first page of replies loads, the thread MUST give the list no message, the main message included, so the list
  shows its spinner alone; once the page is in the rows MUST show (`message-list` R4; the reference shows the main message alone
  here).
- **R5** When the first page cannot be loaded, the thread MUST show its main message alone with no spinner, as `develop` does.
- **R6** Switching to another thread MUST show that thread in its own opening position (R15, R25), carrying nothing of the previous
  one: no position, no highlight, no target and no window of replies.
- **R7** The thread MUST give the list no header, no `restoredPosition` and no `onPositionChange`: closing a thread and opening it
  again, or opening another, starts at the bottom, or at the target. No scroll position of a thread MUST be kept or restored, since
  nothing would restore it (user decision, review round 1), and the list is seen only where it lands (`message-list` R84). The replies
  loaded MAY be reused when the thread opens again, as on `develop`: the thread's query keeps them in its cache for its default time.
- **R8** The thread MUST compose the floating date alone. It MUST NOT show "New messages" or "Jump to recent messages", whatever the
  position of the viewer and the window the list holds (`message-list` R53).
- **R9** The thread MUST pass `bottomThreshold` 20 (`develop`'s value; `message-list` Q2, answered), the `Message_GroupingPeriod`
  setting (default 300) as the grouping period, and `groupsThreadReplies` false, so grouping inside a thread follows `message-list`
  R10 alone.

**The main message first**

- **R10** The rows MUST be, while older replies remain to load: the older loader, then the loaded replies; and once none remain: the
  main message, then the replies, oldest first. The thread MUST NOT draw the main message anywhere else, nor twice.
- **R11** When the last older page is added and the main message takes the older loader's place, the visible messages MUST stay where
  they are, within 1px (`message-list` R36, R37, for a message in place of a loader).
- **R12** A thread with no reply MUST show its main message alone, with no loader, and the first reply that arrives MUST follow
  R16 to R18.
- **R13** The main message and the first reply MUST group as any two messages (`message-list` R10): the reply is drawn without its
  author line when the same author wrote both within the grouping period on the same day, and never across a day.
- **R14** A change of the main message (an edit, a reaction, the thread's counters) MUST redraw its row in place and move nothing.

**Opening and staying at the bottom**

- **R15** A thread opened with no `msg` parameter MUST open with its latest reply at the bottom of the viewport, within 1px, also
  when a first unread message is among the replies: that message gets its divider and moves nothing (`message-list` R9, R13, R14;
  B1).
- **R16** While the viewer is at the bottom, a reply arriving, a row growing, a late-resolving content and the thread's panel or
  composer resizing MUST leave the viewport at the bottom, within 1px (`message-list` R15, R16; B2).
- **R17** While the viewer is more than 20 px from the end, a reply arriving MUST NOT move the viewport, and raises nothing
  (`message-list` R18, R22; R8).
- **R18** After a jump to an old reply, reaching the end of the loaded replies MUST NOT make the thread follow arrivals while newer
  replies remain to load (`message-list` R17).

**Paging in both directions**

- **R19** While older replies remain and the top of the viewport comes within a third of the viewport's height of the first message
  or of the older loader, the thread MUST fetch the previous page of replies; the older loader MUST show a spinner only while it
  loads (`message-list` R3, R30; B5). A loader MUST NOT call it while its own flag is true.
- **R20** While newer replies remain, as after a jump to an old reply, and the viewport is within 20 px of the end of the loaded
  replies, the thread MUST fetch the next page of replies, and MUST NOT fetch it from anywhere else (`message-list` R31; B6; Q1).
- **R21** One page MUST load at a time, in either direction; none loads while the list opens or holds a jump target; a page that
  fails MUST settle and MUST NOT be asked for again by the thread itself (`message-list` R29, R32, R33, R35).
- **R22** The thread MUST NOT fetch a previous or a next page of replies before the viewer's first input in the list, a scroll
  gesture, a scroll key or a pointer press (`message-list` R82): it passes `deferPagingUntilInput`, as `develop`'s thread waits for the
  viewer to touch the list (review round 1: `develop` wins). A first page shorter than the viewport waits too, and fills on the first
  input (`message-list` R34).
- **R23** A page added in either direction MUST leave what the viewer sees where it is, within 1px, and a reply that arrives in the
  same update MUST keep the position of a viewer who reads and the bottom of one who is there (`message-list` R36, R38; B5).
- **R24** The thread MUST list only messages of its own thread that are not hidden: a reply of another thread, a message of the
  room's main channel, and a reply it has already listed never reach the list.

**Links to a reply**

- **R25** A `msg` parameter naming a reply that is loaded MUST make the list scroll to it with the message centered, within 1px,
  highlight it for 2 s and call `onTargetMessageReached` once; the thread MUST then clear `msg` (`message-list` R41, R45, R48).
- **R26** A `msg` parameter naming the main message, while it is the first row, MUST make the list jump to it and highlight it as
  R25 says, and the thread MUST NOT clear it: the room clears it when its own list reaches the message (`room-message-list` R36).
- **R27** A `msg` parameter naming a reply that is not loaded MUST, once the first page has loaded, make the thread ask once for the
  replies around it; the list MUST NOT move for it, nor follow arrivals, until a commit of the replies contains it, and MUST then
  jump as R25 says (`message-list` R43).
- **R28** A `msg` parameter naming the main message while older replies remain MUST make the thread load the earliest replies, so
  the main message appears as the first row and the list jumps to it (R26), as `develop` does.
- **R29** The same link followed again, after its `msg` was cleared and the viewer moved to a part of the thread that does not hold
  the reply, MUST load and jump again (`message-list` R46; `room-message-list` R38; a change from `develop`; intent Q3).
- **R30** A `msg` that cannot be loaded MUST leave the list where it is and the parameter set, and the thread MUST NOT ask for it
  again until a new link names it, as `develop` does.
- **R31** A jump MUST land on the target itself and not on the message above or below it, with the older loader or the main message
  among the rows, and the rows kept mounted (R38) and the top message the list reports MUST be the right ones (`message-list` R42;
  branch 02, fix 1).
- **R32** The highlight a jump sets MUST belong to the thread's list: it MUST NOT be written to any store, it MUST end 2 s after the
  target is reached or with the list, whichever comes first, so closing the thread within two seconds leaves no message highlighted
  in the room or anywhere else (`message-list` R49; `message-variants` Out of scope, branch 06).

**Own replies**

- **R33** A reply the viewer writes, the optimistic copy included, MUST take the list to the bottom from wherever the viewer is
  reading, within 1px, while no newer replies remain (`message-list` R19; B3).
- **R34** A reply the viewer writes while an older window is shown (newer replies remain) MUST make the thread ask for its latest
  replies, and the list MUST go to the bottom once the latest page is among the replies, with the reply among them once it has
  arrived; until then the viewer's position MUST NOT change by itself (`message-list` R20; intent Q2).
- **R35** The thread's request for its latest replies MUST NOT reject and MUST clear the replies before the page loads, so a latest
  page that fails to load leaves the list at the bottom of a window that holds only the main message, and never waiting for a page
  that is not coming. A loader that rejects while the window is intact does not leave the list waiting either, for any list
  (`message-list` R20; fixes its D3, intent Q5).
- **R36** A reply written by someone else, while the viewer reads away or an older window is shown, MUST move nothing and raise
  nothing (R17).
- **R37** A message the viewer writes in the room's main channel or in another thread MUST NOT move this thread's list (R24).

**Live embeds, dividers and the date**

- **R38** The row of a message that has files, or a URL preview with metadata or headers, the main message included, MUST stay
  mounted while out of view, so a player or a preview does not reload when scrolled away and back; no other row MAY, and none MUST be
  kept for selection, highlight or editing. This MUST hold with the older loader or the main message among the rows, for the right
  messages (`message-list` R64, R65; branch 02, fix 2; B15).
- **R39** The first loaded message, the main message when it is first, and every message whose day differs from the one before MUST
  be preceded by a day divider in the viewer's date format; the first unread message by an unread divider, both in one divider when
  they coincide (`message-list` R7, R8; B9).
- **R40** The floating date MUST follow `develop`'s rules, as the room's does (`message-list` R51, R52): it shows the day at the top
  on every scroll of the list, the viewer's or not, and fades 1 s after the last; it stands in for the day divider at or above the top,
  which hides meanwhile so a day shows once (branch 02, fix 3), and the next day's divider pushes it up (B10; intent Q4, superseded at
  review round 1).
- **R41** The first unread message MUST come from the room's read state, as today, and MUST get `data-unread` and its divider; it MUST
  NOT change where the thread opens or scroll it (R15).

**The read state**

- **R42** The thread MUST be marked as read through its own chat when its first page loads and when a reply of the thread arrives,
  and MUST NOT be marked by scrolling or by anything the list reports: the thread gives the list no `onVisibleMessagesChange`.

**Keyboard**

- **R43** The keyboard of the thread's messages MUST be the list's (`message-list` R66 to R68): one tab stop, ArrowDown and ArrowUp
  between messages with the first entry on the latest, Tab through the controls of a message and then to the composer, Shift+Tab to
  the top of the contextual bar. Where no focus scope surrounds the thread, as in the conference panels, leaving the list at either
  edge MUST be left to the browser, as on `develop`.

**Selection and editing**

- **R44** A thread's messages MUST NOT show a checkbox, take a selection click or key, or register with the room's selection, from
  either place they render, whatever the state of the room's selection; "Select all" and the composer's "Select N messages" in the
  room, with a thread open, MUST count only what the room's list renders, as on `develop` (`message-variants` R24 to R26, R48;
  `room-message-list` R45 to R48).
- **R45** A message of the thread that the composer edits MUST be drawn with the editing look, in the thread's list, until editing
  stops (`message-variants` R18).
- **R46** The store `client/lib/chats/editingMessageSubscription` MUST hold the id of the message being edited and nothing else: the
  chat's `messageEditing` MUST set it with `setEditingMessage` when editing starts, `CurrentEditingMessage` MUST clear it with
  `clearEditingMessage` when editing stops, and `MessagesProvider` MUST provide it as the editing context where interaction is
  allowed. No list MUST write it for a jump.
- **R47** A jump in the thread's list or in the room's, while a message is being edited, MUST leave the message being edited drawn
  with the editing look in every list that shows it, and the target drawn with it too, each until its own reason ends (`message-list`
  R49, R50; this fixes `message-variants` D1).

**Re-renders**

- **R48** The function the thread gives the list to draw a message MUST NOT change when the thread's list renders again for a reason
  that is not a message (`message-list` R71; `room-message-list` R52).
- **R49** A change of the room's subscription that changes none of a message's inputs (whether its author is ignored) MUST NOT draw a
  mounted row of the thread again (`room-message-list` R52; Q1).
- **R50** A reply arriving MUST draw its own row and the rows whose grouping or day divider it changed, and no other (`message-list`
  R72).

**Layout**

- **R51** The list MUST fill the space between the thread's header and its composer, and a long unbroken string in a reply MUST wrap
  inside the width of the list, with no horizontal scroll (the old container wrapped words; `message-list` R16 for the composer
  growing).

**The conference panels**

- **R52** The conference thread panel and the thread over the conference room MUST draw the list of R1, in a modal or a panel that is
  not the room's body, with the main message first once no older reply remains and every requirement above; a viewport that has no size
  when the list mounts MUST place itself once it gets one, and page from then on as R22 says (`message-list` R81).

**What the interactions context offers**

- **R53** The interactions context MUST offer the eleven capabilities the package reads (`toggleReaction`, `hasReacted`,
  `openReactionPicker`, `quote`, `quoteMessageById`, `replyWith`, `sendMessage`, `replyBroadcast`, `followThread`,
  `unfollowThread`, `openForward`) and MUST NOT offer the fourteen it does not: `pin`, `unpin`, `star`, `unstar`, `markUnread`,
  `translate`, `showOriginal`, `edit`, `canDelete`, `requestDeletion`, `openReport`, `openReactionList`, `openReadReceipts` and
  `startDiscussion`, in its type, its default value, `MessagesProvider` and the package's test helpers. Pinning, unpinning, starring,
  marking unread, translating, editing, deleting, reporting, the reactions list, read receipts and discussions MUST work as before,
  through the app's own action hooks (`message-capabilities` R28, `message-toolbar`'s notes; `message-variants` intent Q4).

## Design

Decided in the plan.

What changes with the code, for the plan to carry out, and checks of the plan (file listings and searches, not requirements):

- Specs: `message-variants` (R18's note on what the editing context carries, R47, the bridge in Design, D1 and its pinned test, the
  Out of scope lines for branch 09), `message-capabilities` R28 and `message-toolbar`'s notes (R53), `message-list` and
  `room-message-list` (the "branch 09" wording in Out of scope and Design). Documents: `docs/features/message-list/message-components.md`
  (the editing context carries editing only; how the app provides the contexts), `docs/frontend/message-list.md` and the ADR's
  consequences, from reference `0a1da7d63c9` with package paths.
- Gone with the thread's switch, each with no reader left: `ThreadMessageItem` and its spec, `threads.css`, all of
  `views/room/BubbleDate` (`BubbleDate`, `BubbleDateScope`, `bubbleDateStore` and its spec, the index), `hooks/useDateScroll`,
  `providers/DateListProvider` and its mounts in `Room.tsx` and `ThreadChat`, `MessageList/hooks/useKeepAtBottom` and its spec,
  `useKeepMountedMessages`, `body/LoadingMessagesIndicator`, `hooks/useMessageListNavigation` and its spec (the package has its own
  copy and spec), the composer's unused `onResize` prop types in `ComposerMessage` and `MessageBox`, and `tests/mocks/utils/FakeResponse.ts`
  (no importer). The `useThreadMessagesQuery`, `useThreadMainMessageQuery` and the thread's tab, title and list stay.
- Stays, because something outside the thread still reads it: the app's `useItemListNavigation` (the sidebar and other lists) and
  `useMessageRowListNavigation` (the tabs, discussions and the threads list), `useUserScrollIntent` (the room), `InfiniteListAnchor`
  (members, team channels), `MessageListErrorBoundary`, `lib/utils/isMessageNewDay` and `isMessageSequential`, `hooks/useFormatDate`.
  Moving the item-list hook to `@rocket.chat/ui-client` is the follow-up after the stack.
- Searches at the tip: no file under `views/room/MessageList` or `components/message`; no line of `apps/meteor` that names a
  deleted symbol (`messageHighlightSubscription`, `setHighlightMessage`, `clearHighlightMessage`, `DateListProvider`, `useDateScroll`,
  `BubbleDate`, `useKeepAtBottom`, `useKeepMountedMessages`, `LoadingMessagesIndicator`, `ThreadMessageItem`); the scope's
  `grep -rn "components/message\|views/room/MessageList" apps/meteor/client` returns nothing (intent Q7).
- Changesets: `minor` for `@rocket.chat/meteor`, naming the differences of intent Q1 to Q4 that stay; a `patch` of
  `@rocket.chat/ui-message-list` for the fix of D3 and another for the removal of the fourteen capabilities (Q3).

## Out of scope

- The list's behaviour for any source: [message-list](message-list.md). Its D1 stays pinned there; its D3 is fixed in this branch (R35).
- The room's list and the read state: [room-message-list](room-message-list.md). The thread does not use `restoredPosition`,
  `getVisibility()` or `onVisibleMessagesChange`.
- The rendering of a message row: [message-variants](message-variants.md), [message-capabilities](message-capabilities.md),
  [message-attachments](message-attachments.md), [message-toolbar](message-toolbar.md).
- The thread's tab, its title and the threads list (`ThreadList`), which draw no message rows of the list, and the thread's queries
  (`useThreadMessagesQuery`, `useThreadMainMessageQuery`) beyond what R4, R27 to R29 and R35 ask of the request for the replies
  around a message and of the latest page.
- Moving the app's copy of the item-list keyboard hook to `@rocket.chat/ui-client`: it stays used by the sidebar and other lists.
- A smaller distance than the thread's own for newer pages, a "Jump to recent messages" or "New messages" in a thread, a position
  saved per thread and padding at the ends of the list: `develop`'s thread has none.
- The e2e suites; the manual check of the scope stands in for them. The scrollers of the thread's page object are matched by the list
  they contain, as the room's are; the plan checks them.

## Known defects

None; not implemented. `message-variants` D1 is fixed with this capability (R46, R47), and `message-list` D3 is fixed in this branch
(R35).

## Open questions

The intent's seven questions (distance for newer pages, when an own reply goes back, a link followed twice, the floating date, D3, the
stale scope, the final check) are answered there, and R20, R22, R29, R34, R35, R40, R53 and the Design carry the answers. The
spec's own, answered at the gate by the orchestrator, for the user:

- **Q1** ~~How the thread's rows read whether their author is ignored without a change of the subscription drawing every row again
  (R48, R49). `develop` reads `useRoomSubscription()` in each row, and the reference gives each row the subscription in a closure that
  changes on every render, which draws every row for every change of the room's subscription (`room-message-list` R52 forbids it for
  the room). (a) The room's per-list store of markers (`MessageMarkers`, with `useMessageMarkers`) is moved out of the room's folder in
  its own refactor commit below the feature, and the thread's row reads `ignoredUser` from it, under a stable function. (b) The row
  reads the subscription from the room's context under a stable function: rows draw again for each change of the subscription, as
  `develop`'s did. (c) The reference as written. Recommended: (a); it is the room's rule (#43471) with code that exists, a move and a
  four-line row, and (b) leaves the subscription churn of a busy room in every open thread.~~ Answered (the orchestrator, for the user): (a). The room's markers store is moved out of the room's folder in a refactor commit below the feature, and the thread's row reads `ignoredUser` from it under a stable function (R48, R49).
- **Q2** ~~How `message-variants` D1 is retired. Its pinned test, "keeps the editing look on the message being edited while a jump
  highlights another", writes the highlight store twice to stand for editing and a jump; with the rename the store has no jump and
  the test cannot be un-skipped as written, and the checker allows a pinned test to change only by losing its skip unless a person adds
  `Pinned-test-change: message-variants D1` to the commit. (a) The test is replaced, with that trailer added by the orchestrator or
  the user, not the agent, by proofs at the levels that can see a jump: a meteor spec that a jump in the thread's list leaves the
  editing store and the editing look of the message being edited unchanged (R32, R47), the package's spec of `message-list` R50, and
  the `D1` entry deleted. (b) The test is left skipped and D1 kept as obsolete, which the checker accepts and the spec would then
  contradict (R47). (c) The test is un-skipped by changing only its import and names, which fails for the reason that a second
  `setEditingMessage` replaces the first. Recommended: (a); it is the only one that proves the new behaviour.~~ Answered: (a), with the orchestrator's authorisation under the user's delegation of the gate: the commit that replaces the pinned test carries `Pinned-test-change: message-variants D1`, naming it. The proof is a meteor spec that a jump in the thread's list and in the room's leaves the editing store untouched and that editing in one list is not cleared by a jump in the other, with `message-list` R50 (R32, R46, R47). The trailer is used for no other test.
- **Q3** ~~The changeset for the removal of the fourteen capabilities. (a) A `patch` of `@rocket.chat/ui-message-list`, alone or with
  the fix of D3, since a type the package exports shrinks and nothing in the app changes for a viewer. (b) None, since the package
  has not been released and its own changeset (`ui-message-list-package`) covers its first release. Recommended: (a); a reviewer reading
  the stack sees the type change named.~~ Answered: (a). A `patch` of `@rocket.chat/ui-message-list` (R53).

### Corrections to the scope, for the plan

- Scope item 2 lists `BubbleDate`, `useDateScroll` and `DateListProvider`. At the base `views/room/BubbleDate` also holds
  `BubbleDateScope`, `bubbleDateStore` and its spec, added by #43471 after the reference, and `Room.tsx` still mounts
  `DateListProvider` though the room's list has not read it since branch 08. All of it goes (intent Q6).
- Scope item 2 also lists `MessageHighlightProvider`, `MessageHighlightContext` and "the rest of `views/room/MessageList/`", and the dead
  `.hide-avatar` and `.hide-usernames` classes of `RoomBody`. At the base the provider and context are already deleted (branch 06), the
  classes are gone (branch 08), and `views/room/MessageList/` holds `hooks/useKeepAtBottom` (and its spec), `hooks/useKeepMountedMessages`
  and `providers/messageHighlightSubscription` (and its spec). The scope's "unused composer `onResize` props" are two optional prop types
  that nothing passes (`RoomBody.spec` asserts the room does not).
- Scope item 3: `client/lib/chats/editingMessageSubscription.ts` does not exist and is created by moving
  `views/room/MessageList/providers/messageHighlightSubscription.ts` and its spec; the specs that import it
  (`useRoomJumpTarget.spec`, `MessagesProvider.spec`) and `ChatMessages`, `CurrentEditingMessage` and `useMessageEditingValue` change with it.
- The reference's thread (`cae3b5390c6`) departs from `develop`'s thread in these places, where `develop` wins (R4, R9, R28, R29, R48,
  R49): it gives the list the main message alone while the first page loads (R4), and with it a main message that shows and then
  leaves when the first page turns out to have older replies; it never passes `bottomThreshold` (R9); its jump target skips loading around a
  message when it names the main message, whatever remains to load, so a link to the main message of a long thread never lands
  (R28); it asks for the replies around a message once per thread and message for good, which `develop`'s thread does too and the
  list's rule does not allow (R29); and it gives the list an inline function that closes over the subscription, drawing every row for
  every change of the subscription (R48, R49).
- The reference's `useThreadJumpTarget` keeps `onTargetMessageReached` clearing `msg` only for a reply, as `develop` (R25, R26); it is
  copied with those two corrections, and `ThreadChat` keys the list by the main message's id (R6).
- The reference deletes the app's `useMessageListNavigation.spec.tsx`; the package already has its own port of it (`message-list` R66 to
  R68), so no proof is lost. `ThreadMessageItem.spec` and `ThreadMessageList.spec`, which proved `message-variants` R24, R41, R28, R46 and
  branch 02's fixes (R31, R38, R40) in the app, are replaced by specs of `ThreadMessageRow`, `useThreadJumpTarget` and the list as the
  thread feeds it, and by the package's stories of `message-list` R42, R52 and R64.
- `#43627` moved `useTranslation` to `react-i18next` in `ThreadList.tsx` and `ThreadMessage.tsx` of the thread; the reference's thread
  imports it from `ui-contexts`. Keep the base's.

### Where the new thread list differs from `develop`'s

Decided in the intent: the distance for newer pages is the thread's 20 px, not 200 (R20; Q1); the moment an own reply goes back to the
latest is the append, not the server's copy (R34; Q2); a link followed twice jumps twice (R29; Q3). Not a decision:
the highlight lasts 2 s from the moment the target is reached, not from the
moment its index is found, and `msg` is cleared when it is reached, not 500 ms after the reply is among the replies (R25); the
container no longer carries the classes `thread-list`, `js-scroll-thread` and `hide-usernames`, which nothing styles or reads (the
provider's display value carries `hideUsernames`, #43341); the thread no longer writes a jump into the editing store (R32, R46), which
ends the highlight a closing thread left set. Found at review round 1 and kept: older replies load when the top of the viewport comes
within a third of the viewport's height of the first message, where `develop`'s thread loaded them 200 px from the top (R19); a first
page shorter than the viewport, or one whose top is within that distance while the viewer is at the bottom, loads the older page that
is due at the viewer's first input, where `develop`'s thread loaded no older page while at the bottom; and once a jump replaces the
replies, paging waits for the viewer's input again, where `develop`'s thread kept the input it had: this shows when something other
than the viewer scrolls the list after a jump, such as an image resolving late or find-in-page, which on `develop` asked for a page
that was due and here waits for the viewer (R22).

## References

- [Intent](../intents/thread-message-list.md); [message-list](message-list.md) R1 to R9, R13 to R22, R29 to R36, R41 to R46, R48 to
  R54, R64 to R68, R71, R72, R80, R81, D3; [room-message-list](room-message-list.md) R36, R38, R45 to R48, R52; [message-variants](message-variants.md)
  R18, R24 to R28, R41, R47, R48, D1; [message-capabilities](message-capabilities.md) R28; [message-toolbar](message-toolbar.md);
  ADR 0001.
- `develop`: #42756 (the room's read state, which the thread does not use), #43471 (re-renders), #43627 (`useTranslation`), #43341
  (`hideUsernames`); branch 02's fixes: the `?msg=` jump, the thread's kept-mounted rows, the thread's doubled day, the thread's
  selection, the highlight store.
- Reference tag `message-list-ref`: `cae3b5390c6` (the thread's list), `9572a7ddfae` (deletion), `56ef744ebd5` (the editing store),
  `0a1da7d63c9` (documents); the behaviour list B1 to B21 (see message-list References).
- The scope: `.message-list/scopes/09-thread-list-and-cleanup.md`; the drift: `.message-list/BASE-DRIFT.md`.
