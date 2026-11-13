# Intent: The thread's message list

Author: message list replacement stack (branch 09). Status: accepted.

## Problem

The thread is the last place that draws a conversation with its own list in `apps/meteor`. `ThreadMessageList` is a virtualizer
wrapped in the same kind of hooks and refs the room's list had: whether the viewer is at the bottom, whether a jump is still in
progress, whether the viewer has touched the list yet (paging waits for it), whether the list is prepending and what the floating
date shows are kept in refs, timers and `requestAnimationFrame` loops, and the thread's rows are counted by hand (a leading loader
row, the main message in front) in several places. Branch 02 fixed two such defects in it (a `?msg=` jump landing one reply too high,
kept-mounted rows off by one) and the day shown twice under the floating date. The room already draws with `ui-message-list`
(`room-message-list`, branch 08), so the app now carries two scroll engines, the old one only for threads, with a floating-date
registry (`DateListProvider`, `useDateScroll`, `BubbleDate`), a keep-at-bottom hook, a keep-mounted hook, a copy of the keyboard
hook for message lists, and a highlight store that still carries both the message being edited and the message a jump lands on:
a jump in the thread replaces the editing look of the message being edited (`message-variants` D1). The fourteen capabilities of
the interactions context that nothing in the package reads (`message-variants` intent Q4) are still provided by the app. Until
the thread is switched, none of that can be deleted, and the room and the thread cannot be said to scroll, page, jump and
highlight the same way.

## Proposed outcome

- A viewer of a thread sees what they see on `develop`, drawn by the package's list. The thread opens at its latest reply, or
  centered on the reply a `?msg=` link names; it stays at the bottom while the viewer is within 20 px of it, through arrivals,
  growing content and the panel resizing; the main message is the first row once no older reply remains to load; older and newer
  pages load without moving what is on screen; a link to a reply that is not loaded loads the replies around it and lands on it,
  centered and highlighted; the viewer's own reply, also sent from older history, takes the thread to its latest replies; a video,
  a player or a link preview does not reload when scrolled away and back; the floating date never doubles a day; the keyboard and
  the accessible, busy-aware `Thread message list` are the package's. The thread shows neither "New messages" nor "Jump to recent
  messages", as today.
- The thread's read state is `develop`'s: the thread is marked as read when its first page loads and when a reply arrives, and
  the first unread message is marked by its divider.
- A thread's messages never join the room's selection, and "Select all" in the room with a thread open counts as it does today.
- Editing a reply, in the room or in the thread, shows the editing look. A jump to a message in one list never takes the editing
  look from the message being edited, in that list or in the other. A highlight a jump sets ends with the list that set it,
  including when the thread closes within two seconds of the jump.
- The conference thread panels, which are the thread, follow it.
- What the old lists leave behind in the app, and the fourteen unused capabilities of the interactions context, are gone, and the
  documents say how the app provides the message contexts.
- What the old thread had and the new one does not is stated and decided, not discovered by QA.

## Affected users and systems

Viewers of any thread, in the room's contextual bar and in the conference panels. QA gets the scope's manual check (a long thread:
open it, page up and down, open a link to an old reply; a reply from older history; a reply with a video or a link preview; the
floating date; editing a reply; the conference thread panel; "Select all" in the room while a thread is open). New spec:
`specs/thread-message-list.md`. `message-list` is consumed through its props (`bottomThreshold` 20, `onJumpToLatest`) and its D3 is
in question here. `message-variants` changes in R18's note, R47, D1 and its Out of scope (the bridge for the highlight store ends);
`message-capabilities` R28 and `message-toolbar`'s notes lose the fourteen capabilities; `room-message-list` and `message-list` lose
the "branch 09" wording in their Out of scope and Design. `docs/features/message-list/message-components.md`,
`docs/frontend/message-list.md` and the ADR's consequences are updated. Meteor: `ThreadChat`, the thread's list, `Room.tsx`, the
highlight store and the places that write it (`ChatMessages`, `CurrentEditingMessage`), `MessagesProvider`, the composer's unused
`onResize`, and the old list's remains under `views/room`. A changeset (`minor`, `@rocket.chat/meteor`) for the thread.

## Constraints

- Where `develop` and the reference disagree because `develop` changed, `develop` wins: #43471 (re-renders), #43627
  (`useTranslation` from `react-i18next`), #43341 (`hideUsernames`) and branch 02's fixes. The reference's thread is not copied
  where it departs from `develop`'s thread (the spec's corrections list them).
- The package imports nothing from `apps/meteor`; the thread reaches the list through its props, handle and contexts. No `scrollTop`
  write and no row index outside the row model (ADR 0001). The thread passes `bottomThreshold` 20, `develop`'s value.
- Every visible change gets a changeset. No new shared test infrastructure.
- Every commit builds and passes; fixes and enabling refactors sit below the feature; the removal of the fourteen capabilities is a
  commit of its own (`message-variants` intent Q4, answered).
- The app's copy of the item-list keyboard hook stays: the sidebar and many other lists read it, so deleting the room and thread
  copy leaves it used. Moving it to `@rocket.chat/ui-client` is a follow-up after the stack.

## Open questions

- **Q1** ~~Where the thread's newer pages start loading. `develop` asks for the next page of newer replies 200 px before the end of
  the loaded replies; the list has one distance for "at the bottom" and for loading newer pages (`message-list` R31, R80), and the
  thread's is 20. (a) Accept 20 px: after a jump to an old reply the viewer reaches the end of the loaded window before the next
  page starts, named as a difference in the changeset. (b) Give the list a second distance for newer pages, a new requirement of
  `message-list` and a change to its reducer, for a distance between 20 and 200 px. (c) Pass 200 as `bottomThreshold`, which stops
  following arrivals for a viewer 100 px above the end. Recommended: (a); the cost is a short wait at the end of an older window,
  and (b) would add engine surface in the last branch for it.~~ Answered (the orchestrator, for the user): (a). The thread's newer pages start 20 px from the end of the loaded replies, named in the changeset (spec R20).
- **Q2** ~~When a reply sent from older history takes the thread back to its latest replies. `develop` goes when the server's copy of
  the reply arrives; the list goes when the reply is appended, which for a thread is when the optimistic copy is, so the thread's
  window is reset at once and the reply shows again when the latest page or the server's copy arrives. (a) Accept the list's
  moment. (b) Keep `develop`'s moment, which needs the thread to hide its optimistic copy from the list and to call
  `scrollToBottom()` on the stream, undoing what the engine does for the room. Recommended: (a); the reply is among the latest
  replies as soon as it exists, and the difference is a blink of the reply, not of the position.~~ Answered: (a). An own reply goes back to the latest replies when it is appended (spec R34).
- **Q3** ~~A link to a reply that is not loaded, followed a second time after the viewer paged away. `develop`'s thread asks for the
  replies around a reply once per thread and reply, so a second click on the same link does nothing, which `message-list` R46 and
  `room-message-list` R38 do not allow for the room. (a) The thread jumps again, as the room does: a change from `develop`, with a
  changeset line. (b) Keep `develop`'s. Recommended: (a); it is the list's rule for any source, the fix is the thread asking again
  once its target was reached, and (b) would be a defect written into a spec.~~ Answered: (a). A link followed twice jumps twice, as the room does (spec R29).
- **Q4** ~~The floating date differs from `develop`'s in three ways the list's own rules decide (`message-list` R51, R52): it shows
  only while the viewer scrolls, so it no longer flashes when the thread opens or a reply arrives; it hides when a day divider is at
  the top, where `develop` hid the divider and kept the date; and it is centered at the top, not moved down to sit on the divider.
  (a) Accept, named in the changeset. (b) Change the list to the thread's behaviour, which the room, already switched, does not
  have. Recommended: (a).~~ Answered: (a). The list's floating date, named in the changeset (spec R40). Superseded at review
  round 1, by the user: the list follows `develop`'s rules again (`message-list` R51, R52), so the thread's date shows on every scroll,
  stands in for the divider under it and is pushed up by the next day, as `develop`'s thread, with branch 02's fix that keeps a day
  from showing twice (spec R40).
- **Q5** ~~`message-list` D3 (a rejected `onJumpToLatest` leaves the list waiting for the latest page). The thread cannot reach it:
  its `onJumpToLatest` resets the thread's query, which resolves whether or not the refetch fails, and clears the replies first,
  so the list is never left waiting; the room cannot either (`room-message-list` R42). The fix is known: dispatch
  `jumpToLatestUnavailable` when the promise rejects (`useMessageListScroller.ts`, one line) and un-skip the pinned test.
  (a) Leave D3 pinned: no consumer can hit it, and the stack ends with it recorded. (b) Fix it here, as the lowest commit of the
  branch, with the test un-skipped and a `patch` changeset for the package: it ends with the last consumer that could have needed it
  and a future list with a rejecting loader will not. Recommended: (b); the commit is independent of the thread, one line, proven
  by a test that exists, and the alternative leaves a defect in an `implemented` spec after the last branch that could fix it.~~ Answered: (b). D3 is fixed in this branch as the lowest code commit: the dispatch on rejection, its test un-skipped after it failed, the `D3` entry removed, a `patch` changeset for the package (spec R35).
- **Q6** ~~The scope is stale against the base in places the cleanup touches. `views/room/BubbleDate` holds `BubbleDateScope`,
  `bubbleDateStore` and its spec besides the files the scope names, and nothing but the old thread reads them;
  `tests/mocks/utils/FakeResponse.ts` has no importer; `MessageHighlightProvider`, `MessageHighlightContext` and the `.hide-avatar`
  and `.hide-usernames` classes of `RoomBody` are already gone; the composer's `onResize` survives only as two optional prop types;
  `DateListProvider` is still mounted by `Room.tsx` though the room no longer reads it. (a) Follow the base: delete every file that
  the thread's switch leaves with no reader, and skip what is already gone. (b) Delete only what the scope names, leaving the rest
  as dead code. Recommended: (a); the scope's aim is that nothing of the old list is left, and (b) fails it.~~ Answered: (a). Everything the thread's switch leaves with no reader is deleted, each proved unread by a search and the typecheck (spec Design).
- **Q7** ~~The scope's final check, `grep -rn "components/message\|views/room/MessageList" apps/meteor/client`, can return nothing,
  but it only matches the absolute spelling of those paths, and every relative import of the old folders passes it. (a) Keep it and
  add that `views/room/MessageList` and `components/message` do not exist and that no deleted symbol is named anywhere in
  `apps/meteor`. (b) Keep it alone. The scope's second sentence, that no meteor import names a message-list symbol from
  `@rocket.chat/ui-client`, has nothing left to check at the base. Recommended: (a).~~ Answered: (a). The stronger check (spec Design).
