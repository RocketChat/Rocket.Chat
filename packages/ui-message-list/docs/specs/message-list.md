---
status: planned
adrs: []
code:
  [
    packages/ui-client/src/hooks/useFormatDate.ts,
    packages/ui-client/src/components/CustomScrollbars/useViewportScrollbars.ts,
    packages/mock-providers/src/fixtures,
    src/MessageList/lib,
    src/MessageList/scroll,
    src/hooks,
    tests/utils/listContract.ts,
  ]
tests:
  [
    packages/ui-client/src/hooks/useFormatDate.spec.ts,
    packages/ui-client/src/components/CustomScrollbars/useViewportScrollbars.spec.tsx,
    packages/mock-providers/src/tests/fixtures.spec.ts,
    src/MessageList/lib/buildMessageListRows.spec.ts,
    src/MessageList/lib/isSequentialMessage.spec.ts,
    src/MessageList/lib/diffMessageKeys.spec.ts,
    src/MessageList/lib/geometry.spec.ts,
    src/MessageList/lib/position.spec.ts,
    src/MessageList/scroll/messageListScrollReducer.spec.ts,
    src/MessageList/scroll/planRowsCommit.spec.ts,
    src/hooks/useItemListNavigation.spec.ts,
    src/hooks/useMessageListNavigation.spec.tsx,
  ]
---

# Spec: Message list

## Summary

The package offers `MessageList`, an infinite list of messages for the room, a thread and the read-only lists. The app gives it
the messages it has (oldest first), whether older and newer ones remain, loading flags, promise-returning loaders, the id of the
first unread message and of a jump target, how to tell the viewer's own messages, a position to restore and a function that
renders each message. The list draws the rows around the messages (the older and newer loaders, a start-of-conversation header,
day and unread dividers), decides how each change of the data and each input of the viewer moves the scroll position, loads pages
as the viewer approaches an edge, jumps to any message and highlights it, and reports what is visible and where it was left. The
floating date, "New messages" and "Jump to recent messages" are parts a consumer composes as children. Its keyboard model is the
composite list of `docs/frontend/list-keyboard-navigation.md`. Nothing in `apps/meteor` uses it in this branch.

## Motivation

See [the intent](../intents/message-list.md). The room and the thread keep two copies of the scroll logic, guessed from refs
and timers, and no test scrolls. Unless a requirement says otherwise, each one states what the room's or the thread's list does
today, as the behaviour list `B1` to `B21` of the reference puts it (see References for the ids). Requirements that differ from
the reference are marked with the question that decides them. The behaviours `B18` (the part that is the row's) and `B20` belong to
[message-variants](message-variants.md).

## Behaviour

The **viewer** is whoever reads the list. The **latest messages** are the end of the conversation: when `hasNewerMessages` is
true, the last loaded message is not the latest. "Within 1px" is the tolerance of every position check in the stories. A
**jump** is a scroll the list makes to a message, as opposed to one the viewer makes.

**The list and its rows**

- **R1** The list MUST render an element with role `list` named by `aria-label`, whose `aria-busy` is true exactly while the
  first page, an older page or a newer page is loading, and false otherwise (B19, B13).
- **R2** The rows MUST appear in this order: the older loader while `hasOlderMessages` is true, else the header when the
  consumer gave one; then one row per message, oldest first; then the newer loader while `hasNewerMessages` is true. The header
  MUST NOT show while older messages remain and MUST show as soon as none do (B12).
- **R3** The header MUST be a `listitem` of the list. A loader MUST be `presentation` and MUST show a spinner only while its own
  page loads: the older loader for `isLoadingOlderMessages`, the newer one for `isLoadingNewerMessages` (B13).
- **R4** While `isLoadingInitialMessages` is true and there are no messages, the list MUST show a spinner and none of the
  header, the loaders and the message rows. The spinner MUST sit at the top of the list, where the older loader shows, as
  `develop`'s room and thread show it (review round 1: it sat at the bottom). Once a message exists the rows MUST show, whatever
  the flag says (B13).
- **R5** A list with no messages that is not loading MUST render no message row and no error, and the header when it was given
  and no older messages remain (B12).
- **R6** The list MUST call `renderMessage` once per message row with the message, the message before it (none for the first),
  `isSequential`, `startsNewDay` and `isFirstUnread`, and MUST mark the row's element with the message's id in `data-message-id`.
- **R7** A message that is the first of the loaded messages, or whose day differs from the day of the message before it, MUST
  be preceded by a day divider that writes the day in the viewer's date format (the `Message_DateFormat` setting). A message of
  the same day as the one before it MUST have none (B9). The first loaded message keeps its divider while older messages remain,
  as `develop` draws it, and loses it once a page of the same day is added before it (R36).
- **R8** The message named by `firstUnreadMessageId` MUST be preceded by an unread divider labelled with the translation of
  `Unread_Messages`, in lower case. When the same message also starts a day, one divider MUST carry both the day and the label.
  A divider MUST move with its message: it is never a row of its own and never shifts the index of a message (B9).
- **R9** A `firstUnreadMessageId` that is not among the messages MUST draw no divider and raise no error. It MUST NOT scroll the
  list by itself, whatever the position the list opens at (B8; intent Q2).
- **R10** A message MUST be marked `isSequential` (drawn without its own author line) exactly when it has a previous message
  and none of these holds: either is a system message; the author differs; the alias differs; the message is not groupable
  (`groupable` false); the two are `groupingPeriodSeconds` (default 300) or more apart; they fall on different days (B11).
- **R11** While `groupsThreadReplies` is true (the default, as in a room), a thread reply MUST be sequential exactly when the
  message before it is its thread's main message or another reply of the same thread, whoever wrote it, and a message
  that follows a reply MUST NOT be sequential. While it is false (inside a thread, where every message is a reply) grouping MUST
  follow R10 alone (B11).
- **R12** The list MUST expose its anchor and its phase to the page as `data-anchor` (`bottom`, `message` or `none`) and
  `data-phase` (`positioning` or `idle`) on its host element (a package decision: the play tests wait on them).

**Opening and staying at the bottom**

- **R13** A list with no jump target and no position to restore MUST open with its newest message at the bottom of the
  viewport (B1).
- **R14** A list whose messages are shorter than its viewport MUST sit at the bottom of the viewport, the last row's bottom within
  1px of the viewport's bottom (B1).
- **R15** While the viewer is at the bottom, a message arriving at the end, a row at the end growing (a reaction, an image, an
  embed, a collapsible opening) and a late-resolving content MUST leave the viewport at the bottom, within 1px (B2).
- **R16** While the viewer is at the bottom, the viewport shrinking or growing (the composer growing, the container or the
  window resizing, a contextual bar opening) MUST leave the viewport at the bottom, within 1px (B2).
- **R17** The viewer MUST count as at the bottom when the end of the scrollable content is within `bottomThreshold` (R80) of the viewport's bottom and
  `hasNewerMessages` is false; the end of an older window MUST NOT count, so reaching it does not make the list follow arrivals
  (B2, B6; Q2, answered).
- **R18** While the viewer is reading away from the bottom, a message arriving at the end and a row at the end growing MUST NOT
  move the viewport: the topmost visible message keeps its offset, within 1px (B2, B4).

**Own messages and "New messages"**

- **R19** A message at the end that `isOwnMessage` says is the viewer's, including a copy the consumer marks as optimistic,
  MUST take the list to the bottom, from wherever the viewer is reading (B3).
- **R20** When `hasNewerMessages` is true, such a message MUST first make the list call `onJumpToLatest`, and the list MUST go
  to the bottom once the latest page is among the messages. Until then, and if `onJumpToLatest` is not given, the viewer's
  position MUST NOT change by itself (B3).
- **R21** `MessageListNewMessagesButton` MUST be visible (`data-visible` true, `aria-hidden` false) when a message that is not the
  viewer's is appended at the end while the viewer is away from the bottom, `hasNewerMessages` is false and no newer page is
  loading; and hidden (`data-visible` false, `aria-hidden` true, its button out of the tab order) otherwise (B4).
- **R22** The button MUST NOT show for a message that arrives while the viewer is at the bottom, for the viewer's own message,
  for a page of newer messages the list asked for, or for an edit, a deletion or a reaction (B4).
- **R23** The button MUST hide as soon as the list reaches the bottom, by any means. Activating it MUST scroll the list to the
  bottom and then call its `onClick` (B4).
- **R24** `MessageListJumpToLatestButton` MUST be visible while `hasNewerMessages` is true and hidden otherwise. Activating it
  MUST call `onJumpToLatest`, go to the bottom once the latest page is among the messages, and then call its `onClick`; it
  MUST be hidden again by then (B6).

**What holds and what releases the position**

- **R25** The list MUST hold one thing in view: the bottom, a message, or nothing. Only the viewer's input MUST release it:
  a wheel or touch gesture on the list; PageUp, PageDown, Home, End, ArrowUp, ArrowDown or Space while focus is not in a
  text field, a select or editable content; dragging the scrollbar; and moving between messages with the keyboard. A scroll the
  list or the browser makes (an arrival, a resize, a measurement) MUST NOT release it (B2; ADR 0010).
- **R26** A scroll that lands at the bottom MUST take the list back to the bottom, and MUST NOT take it away from it, whoever
  made it (B2).
- **R27** Everything the viewer does from the first gesture until scrolling stops MUST count as one window, in which the
  floating date shows (R51). It MUST end at `scrollend`, or 300 ms after a gesture that moved nothing because the list was at
  an edge.
- **R28** A message the list holds in view (a jump target, a restored position) MUST be released by the viewer's input, or 3 s
  after the sizes around it stopped changing, and MUST NOT be released earlier by anything else (B7).
- **R29** The list is _positioning_ while it opens or restores: it MUST NOT load a page then, and MUST stop positioning once
  nothing moved for 5 frames, at the latest after 2 s, or at the viewer's first input. When it stops it MUST check whether a
  page is due (B1, B21).

**Paging**

- **R30** When `hasOlderMessages` is true and the top of the viewport comes within a third of the viewport's height of the first
  message, the list MUST call `onLoadOlderMessages` (B5, B21).
- **R31** When `hasNewerMessages` is true and the viewport is within `bottomThreshold` of the end of the loaded messages, the list MUST call
  `onLoadNewerMessages`, and MUST NOT call it from anywhere else (B6, B21).
- **R32** One page MUST load at a time. While a load has not settled (its promise neither resolved nor rejected), the list MUST
  start no other. It MUST NOT call a loader while its own flag, `isLoadingOlderMessages` or `isLoadingNewerMessages`, is true
  (B5, B21).
- **R33** The list MUST NOT load a page while positioning (R29) or while it holds a message in view (R28).
- **R34** After every change of the messages, the list MUST check again whether a page is due, so a viewport taller than a page
  keeps loading until it is full or nothing remains. A loading flag changing alone MUST NOT start a load (B5, B21).
- **R35** A loader that rejects MUST settle like one that resolves, and the list MUST NOT retry by itself; the next scroll or
  change of the messages checks again (B5).

**Data changes**

- **R36** When older messages are added before the first one, or the first message is removed, the viewer's visible messages
  MUST stay where they are, within 1px, the message that was first included when the page takes its day divider or its author
  line away: what it says stays in place. A page added there MUST leave the viewer where they were, so the next page is asked
  for only once the viewer comes near the new first message again (R30): one page per approach to the top (B5; review round 1,
  where a page of the same day moved the message being read by the height of its divider and the list asked for page after page
  from the top).
- **R37** When the older loader is replaced by the header, or the header changes height after it showed, the visible messages
  MUST stay where they are, within 1px (B5, B12).
- **R38** When a message arrives at the end while an older page is being added in the same update, both changes MUST hold:
  a viewer reading keeps their position, and a viewer at the bottom stays at the bottom (B5).
- **R39** When messages change somewhere other than the ends (a filter, a message reordered by its server timestamp) while
  the viewer is reading, the topmost visible message MUST stay at its offset, within 1px.
- **R40** When the messages are replaced by another window of the conversation (a jump to a message that was not loaded, back to
  the latest page), the position MUST come from what caused it: the jump target centered (R41), or the bottom. A window
  replaced for no such reason, while the viewer is reading, MUST go to the bottom.

**Jumps**

- **R41** When the consumer sets `targetMessageId` to a loaded message, the list MUST scroll to it with the message centered in
  the viewport, within 1px, release no earlier than R28 says, highlight it (R48) and call `onTargetMessageReached` with its
  id once (B7).
- **R42** With the start-of-conversation header, or the older loader, among the rows, a jump MUST land on the target message itself,
  not on the message above it, and the same MUST hold for the rows kept mounted (R64) and the top message reported (R54) (branch 02,
  fix 1; intent Q1).
- **R43** When the target is not among the messages, the list MUST NOT move for it, MUST NOT follow arrivals to the bottom while it
  waits, and MUST jump, as R41, as soon as a commit of the messages contains it (B7).
- **R44** A target MUST stay centered, within 1px, while the sizes of the rows around it change (an image or an embed resolving late)
  and while rows are added before it, until it is released (R28) (B7).
- **R45** A list that mounts with a target MUST open centered on it, not at the bottom nor at a restored position (B1, B7).
- **R46** The list MUST act on a target when it changes. A consumer clears it once reached; setting the id it already holds
  does nothing, and setting it again after clearing jumps again. `scrollToMessage(id)` of the handle MUST do what setting the
  target does.
- **R47** A jump to the first unread message MUST work as any other: the consumer sets `targetMessageId` to the id it gave as
  `firstUnreadMessageId`, which MUST land centered with its divider (R8) (B8).

**Highlight**

- **R48** The target of a jump MUST be drawn with the editing look (`useIsMessageEmphasized`) for 2 s after it is reached, then
  without it (B7).
- **R49** A highlight MUST belong to its list: jumping in one list MUST NOT clear or set the highlight of another list that shows
  the same message, a second jump in a list MUST replace its previous highlight, and a list MUST highlight nothing it was not
  asked to (branch 02, fix 4; intent Q1).
- **R50** A highlight MUST NOT change the message the editing context names: a message being edited and a message being
  jumped to MUST both be drawn emphasized, each until its own reason ends (a package decision, ending the bridge of
  `message-variants` R47 for the lists that use the engine).

**Dates**

- **R51** `MessageListDateBubble` MUST show the day, in the viewer's date format, of the message at the top of the viewport
  (the first message in the 48px below the top) while the window of R27 is open and for 1 s after it closes, then fade out; it
  MUST NOT show for scrolls the list makes. It MUST be `aria-hidden` and MUST NOT take pointer events. With `prefers-reduced-motion`
  it MUST NOT animate (B10).
- **R52** A day MUST show once: the bubble MUST be hidden while an inline day divider, or the start-of-conversation header, is
  at the top of the viewport, in a room and in a thread (branch 02, fix 3; intent Q1; B10).
- **R53** A thread MUST be able to compose the date alone and a room all three overlay parts; a part rendered outside a
  `MessageList` MUST throw an error that names the rule.

**What the list reports**

- **R54** The list MUST call `onVisibleMessagesChange` with `topMessage` (the first message at or below the top of the viewport,
  never a header or a loader), `isFirstUnreadVisible` (the row of the first unread message is at least partly inside the
  viewport) and `isAtBottom` (R17), and only when one of the three changed (B16).
- **R55** The first report MUST be made once the list has been placed, without any scroll by the viewer, and the list MUST report
  again after every scroll, every change of the messages and every change of the viewport's size (B16; Q1).
- **R56** `isAtBottom` MUST describe the position, not what the list holds: it MUST be true right after a jump to the last message
  and false while the viewer is anywhere else, or on an older window (B16; Q1).
- **R57** The `getVisibility()` of the handle MUST return the latest reported value at any time, synchronously, so a caller that
  asks at its own moment (the read state) gets what the last callback said; it MUST return `undefined` while nothing was reported.
- **R58** While the first page loads (R4) and while there is no message, the list MUST report nothing.

**Keeping a position**

- **R59** The list MUST call `onPositionChange` with an opaque position 150 ms after a scroll or a change that moved the visible
  messages, at most once per window of that length, and once when it unmounts, so a consumer can store it. It MUST NOT call
  it while no message is listed (B14).
- **R60** A list mounted with `restoredPosition` MUST open at the bottom when it was left at the bottom; else with the message that
  was at the top at the same offset, within 1px, when that message is listed; else at the bottom. A jump target (R45) wins
  over it, and `firstUnreadMessageId` never does (B14; R9).
- **R61** The position MUST be applied when the first messages are listed, however late they arrive after mounting; a list
  that mounted empty and whose messages arrive later MUST still open at the saved position (B14; Q1).
- **R62** The list MUST open at the bottom when it gets no `restoredPosition`. Whether unread messages override a saved position is the
  consumer's: it omits the position (B14; intent Q2, where the reference's "unreads override the restore" becomes the consumer's
  decision, as `develop` makes it from the listed messages).
- **R63** The measurements a position carries MUST only be reused when the rows they describe are still the first rows, in the same
  order, at the same width; otherwise the list MUST measure again, and the opening position MUST NOT differ (B14).

**Live embeds**

- **R64** A message with files, or with a URL preview that has metadata or headers, MUST stay mounted while out of view, so a player
  or an iframe does not reload when scrolled away and back; no other message may, unless `shouldKeepMounted` says so. This MUST hold
  with a loader or the header among the rows, for the right messages (branch 02, fix 2; intent Q1; B15).
- **R65** The row the list holds in view MAY also stay mounted while it is held, and no row MUST be kept mounted for any other
  state of the interface (selection, highlight, editing) (B15; Q3).

**Keyboard**

- **R66** The list MUST be one tab stop: ArrowDown and ArrowUp move the focus between messages, including a message the
  virtualizer has not rendered, which the list scrolls in through its handle, and a move MUST release what the list holds (R25) so
  the list does not snap back to the bottom. The first keyboard entry MUST land on the latest message (B17).
- **R67** Tab MUST walk the focusable controls of the focused message, a toolbar of the message being one stop, then leave the list
  to the composer; Shift+Tab from the message MUST leave it to the top of the room, or of the contextual bar in a thread, and
  Tab MUST NOT enter the next message (B17; `list-keyboard-navigation.md`).
- **R68** As `develop` does: on a video or audio player with controls, Tab and Shift+Tab MUST be left to the browser to walk its
  native controls, and the focus MUST return to the row's next or previous stop once the browser leaves the player (#43544,
  #43573); Left and Right MUST stay with the focused control (#43156); Shift+Ctrl or Shift+Cmd with an arrow MUST NOT move the focus
  between rows (#42995); Escape on a control MUST return to its row; keys typed in a text field MUST stay with it.

**Select all and the handle**

- **R69** `scrollToTop()` of the handle MUST scroll to the first row of the loaded messages and hold there (nothing pins the
  bottom), as "Select all" needs (B18). `scrollToBottom()` MUST do what R20 says of the latest page and go to the bottom,
  for the room's "Jump to recent messages" and the composer.
- **R70** The list MUST NOT select, register or count messages: what "Select all" selects (every loaded message but the thread
  previews) is the room's (`message-variants` R26, branch 08).

**Re-renders**

- **R71** A change of the list's own scroll state (what it holds, the viewer's scrolling window, the floating date, "New messages")
  MUST NOT call `renderMessage` for a row whose row data did not change, given a stable `renderMessage` (intent Q4).
- **R72** A change of the messages MUST call `renderMessage` only for the rows whose message, previous message, grouping, day
  divider or unread divider changed: a message arriving at the end renders itself and nothing else (intent Q4).
- **R73** Starting and ending a highlight MUST re-render each mounted row at most once each (intent Q4).

**Stories**

- **R74** Every behaviour of B1 to B17 and B21 this spec lists MUST have a story of `Components/MessageList` that proves it in a real
  browser or, for what a browser cannot see, a spec that proves it in jsdom (the reducer's table, a component spec): a list
  that opens at the bottom, a short list, an empty one, infinite older history, arrivals at the bottom and while reading up,
  the viewer's own message from an older window, a jump to a loaded and to an unloaded message, a jump that survives late content,
  the first unread, back to the latest, newer pages at the bottom, late-resizing content, the composer and container resizing,
  restoring a position, the header, a thread's layout, loading states, the highlight, the floating date (package decision).
- **R75** Every story of the list MUST pass an axe check with no violations, and a spec MUST do that for each (package
  decision, as `message-variants` R8).
- **R76** The conversation stories MUST render a room and a thread through the list with the real variants (`message-variants`
  R8, intent Q3): a room with system messages, thread previews, reactions, files, edits and an ignored author; a thread with its
  main message first; selection mode (a checkbox on the messages); hidden avatars; a read-only place (no toolbar, no thread
  metrics); read receipts. Each MUST pass R75, and the room and selection mode MUST have a play test that the list rendered its
  rows and, for selection mode, that a checkbox shows on a message.

**Where the list sits in the package**

- **R77** The package MUST export from its entry point `MessageList` with `MessageListProps` and `MessageListHandle`,
  `MessageListDateBubble`, `MessageListNewMessagesButton`, `MessageListJumpToLatestButton` with their props types,
  `useIsMessageHighlighted`, `hasLiveEmbed`, `isSequentialMessage`, the row types, `MessageListPosition` and
  `MessageListVisibility`.
- **R78** The list MUST render with no provider other than the app's translation and settings roots, calling nothing outside the
  package, and the viewport MUST draw the overlay scrollbars, which MUST update when the rows inside the viewport grow.
- **R79** `@rocket.chat/ui-client` MUST export `useFormatDate`, which formats a date with the `Message_DateFormat` setting, and the
  viewport mode of its scrollbars (`useViewportScrollbars` and `viewportScrollbarsHostStyle`); `@rocket.chat/mock-providers` MUST export
  the deterministic fixtures `createFakeUser`, `createFakeRoom`, `createFakeSubscription`, `createFakeMessage`,
  `createFakeMessageWithAttachment` and `createFakeConversation`, which return the same values for the same input (Q5).
- **R80** The list MUST accept `bottomThreshold`, the distance in pixels from the end of the latest messages within which the viewer counts
  as at the bottom (R17, R26, R31, R54), 1 by default. Within it the list MUST follow arrivals, and an arrival MUST bring it to the true
  bottom, within 1px, so a threshold never leaves the list short of the end; beyond it the viewer is reading away (R18). The
  app passes the room's 60 and the thread's 20, as `develop` does (Q2, answered).

## Design

Decided in the plan.

## Out of scope

- The room and the thread feeding the list (the `?msg=` parameter and the other room's jump, the read state, "Select all"
  selecting, the room store's position, the history manager, the thread's queries) and the deletion of their lists: branches 08 and 09. This spec states what the list does for any source, and what it gives them.
- The part of intent Q1's six behaviours that is not the list's. A thread's system messages out of the room's selection is
  `message-variants` R24 and R25 (branch 02, fix 5), with the "Select all" wiring of 08 and the thread of 09. The composer's
  auto-link domains (branch 02, fix 6) is the composer's hook, which 08 must move out of the directory it deletes, with its spec.
- The read state itself: the unread count, mark-as-read, the unread banner and deciding that unread messages override a saved
  position (R62). The list gives what #42756 needs (R9, R55, R56, R57, R60, R62), and 08 keeps develop's rules: the unread jump
  decided from the listed messages, and the position kept when only a thread reply is unread.
- The states of a message row (B20) and the row's part of selection (B18): `message-variants`.
- Message content, attachments and the toolbar: `message-capabilities`, `message-attachments`, `message-toolbar`.
- Padding at the ends of the list: none, which the room's PR states as a known difference.
- Anchors other than the bottom, a message or nothing, and any change to the keyboard model.
- Replacing the app's copy of the item-list keyboard hook: it serves the sidebar and the other lists (Q4).

## Known defects

Defects of the reference's list that the package copies. None can be pinned by a skipped test before the code exists, and the
checker rejects a `D` entry without one, so each becomes a `D<n>` entry with its skipped test in the commit that copies the
list, except where noted:

- A message at the end is recognised as the viewer's own only when it is the last one appended: an own message followed by
  another in the same update does not take the list to the bottom (R19).
- A page of newer messages whose last message is the viewer's own is taken for an own message: the list jumps to the bottom, past
  the page, instead of staying at the edge (R19, R31).
- A failed `onJumpToLatest` leaves the list waiting for the latest page: it holds nothing, and goes to the bottom later without
  the viewer asking, once a newer page ends the window (R20).
- Not carried, fixed first (Q1): the position is resolved when the list mounts, so a list that mounts before its messages
  loses its position (R61); `isAtBottom` reports what the list holds, so it is false for up to 3 s after a jump to the last message
  (R56); a resize does not refresh the report (R55).
- Not carried, required differently (intent Q4): every message row object is rebuilt on every change, so the memo of the row
  never holds (R71, R72).

### D4 A page committed before its load settles is not followed by a check

When a page is committed while its load has not settled yet, the check for a page that is due finds the load in flight and starts
none, and settling the load does not check again, so a viewport taller than the page stays unfilled until the next scroll or change of
the messages (R34). A load that settles without new messages must still not be retried (R35). Pinned by the skipped test "checks again
when a load settles after its page was committed (R34)" in `messageListScrollReducer.spec.ts`; fixed in step 14 of the plan.

## Open questions

The intent's questions were answered at the spec gate (written "intent Q1" to "intent Q4", the ones below plain "Q"), and so were
these: R42, R49, R52 and R64 follow intent Q1; R9, R62 and the read-state requirements R55 to R57 and R60 follow intent Q2; R71 to
R73 follow intent Q4; R76 is intent Q3.

- **Q1** ~~Whether the reference's defects that branch 08 would meet are fixed in this branch: a position resolved at mount
  (R61), `isAtBottom` following what the list holds (R56) and no report after a resize (R55).~~ Answered: (b). Each of the three is
  fixed in its own commit on top of the copied list, with a test that fails first (R55, R56, R61). The other defects are
  carried as `D` entries.
- **Q2** ~~How near the bottom counts as the bottom (R17).~~ Answered: not 1px alone. The list takes a `bottomThreshold` option,
  1 by default as in the reference, so branch 08 can pass the room's 60px and branch 09 the thread's 20px, as `develop` does
  (R17, R31, R80).
- **Q3** ~~The row the list holds in view stays mounted while held (R65), which `REVIEW.md` and `AGENTS.md` forbid.~~ Answered:
  (a). It stays mounted, and both files are reworded in this branch.
- **Q4** ~~Where the item-list keyboard hook lives.~~ Answered: (a). The package gets its own copy of `develop`'s current hook
  with the two options the list needs and without the `scrollTop` fallback; the app's copy is untouched. Moving the hook to
  `@rocket.chat/ui-client` for both is a follow-up after branch 09.
- **Q5** ~~Where the list gets the day's format.~~ Answered: (a). `useFormatDate` in `@rocket.chat/ui-client` (R79).

### Corrections to the scope, for the plan

- `B1` to `B21` are not numbered in the reference's `docs/features/message-list/README.md`, which has eighteen bullets; the ids live
  in the original plan (`MESSAGE_LIST_PLAN.md`, "Behaviors to preserve"). The package README and the scope cite them by id, so the
  feature doc written in this branch carries them, and References lists them.
- `useFormatDate` and `useViewportScrollbars` are missing in ui-client at the base, as the scope says; `mock-providers` is not
  without `fixtures/`: it has `createFakeMessage` and its sequence helper from an earlier branch, and lacks `createFakeUser`,
  `createFakeRoom`, `createFakeSubscription`, `createFakeMessageWithAttachment` and `createFakeConversation`.
- `useMergedRefsV2` comes from `@rocket.chat/ui-client` in `MessageList.tsx`, not from `@rocket.chat/fuselage-hooks`.
- The package lacks the dependencies the list needs: `virtua`, `date-fns`, `@rocket.chat/message-types`, `@react-aria/focus`, as
  peers and dev dependencies as its other imports are, and `react-virtuoso` is not needed (see the next point).
- The reference's `tests/utils/listContract.ts` carries `listWrapper`, which wraps a Virtuoso mock the package no longer uses and
  nothing in the package calls; copy `expectListKeyboard` only. The reference also drops `useMessageListNavigation.spec.tsx`, the
  app's proof of the room's keyboard model (toolbar as one stop, leaving to the composer, Shift+Tab to the room); the plan ports it.
- The reference's `scrollToAdjacentRow` in `MessageList.tsx` computes `index - 1` and `index + 1`, which the package forbids outside
  the row model; the plan moves the lookup of the adjacent row into the row model.
- The reference's copy of the keyboard hook predates #43544, #43573 and #42995 (R68), and keeps a fallback that writes `scrollTop`
  (Q4); `useMessageRowListNavigation` is unused in the package, and the app keeps its own.
- `useIsMessageEmphasized` of the base reads the editing context only (branch 06's plan left the reference's row-state context to
  this branch): it gains the list's highlight (R48, R50), and `MessageRowStateContext` is the first thing under
  `Message/` to import from `MessageList/`, so the plan places the context where neither folder imports the other.
- The reference's stories prove several behaviours only in part: the floating date is checked only to show, not to hide under a
  divider (R52); no story keeps a live embed mounted (R64) or moves by keyboard into an unrendered row (R66); "Send own message"
  also calls `scrollToBottom()`, so the detached own-message path of R20 is not isolated; `LoadingStates` checks `aria-busy` only
  (R1, R3). The plan adds the missing proofs.

## References

- [Intent](../intents/message-list.md)
- ADR 0010 (virtua, typed rows and a scroll reducer), at the reference `docs/adr/0010-message-list-virtua-and-scroll-reducer.md`;
  it moves into `docs/adr/` with the implementation.
- Reference tag `message-list-ref`: `docs/features/message-list/README.md`, `message-components.md`, `docs/frontend/message-list.md`; commits
  `66abbe1eea7`, `2da05ca0415`, `9b408f0a57d`, `83e7cfd5af3`, `1007b6e5fa2`, `a32cdc39835`, `36bc5e0db92`.
- The reference's behaviour list, from `MESSAGE_LIST_PLAN.md`: B1 opens at the newest message; B2 stays at the bottom; B3 own messages;
  B4 "New messages"; B5 older pages, the content does not move; B6 newer pages and "Jump to recent messages"; B7 jump to a message;
  B8 jump to the first unread; B9 day and unread dividers; B10 floating date; B11 grouping; B12 start-of-list header; B13 loading
  indicators; B14 position saved and restored; B15 live embeds stay mounted; B16 what is visible is reported; B17 keyboard;
  B18 selection mode and "Select all"; B19 accessibility; B20 message states; B21 paging thresholds.
- `develop`: #42756 (the room's read state: unread jump from the listed messages, position kept for a thread reply),
  #43544, #43573, #43156 (video and audio Tab and arrows), #42995 (move-row shortcut), #43471 (re-renders when opening and switching a room)
- Branch 02's fixes: the `?msg=` jump, the thread's kept-mounted rows, the thread's doubled day, the highlight store, the thread's
  selection, the composer's auto-link domains.
- [message-variants](message-variants.md) R8, R24 to R26, R47; [message-capabilities](message-capabilities.md);
  `docs/frontend/list-keyboard-navigation.md`
- WCAG 2.1 AA, for R1, R75 and R76 (axe over the stories, a package decision)
