# Intent: The room's message list

Author: message list replacement stack (branch 08). Status: accepted.

## Problem

The room still draws its messages with its own list in `apps/meteor`, the copy of the scroll logic that `ui-message-list` now
replaces (`message-list`, branch 07, which nothing in the app uses yet). The room's list is a virtualizer wrapped in a dozen
hooks and refs: whether the viewer is at the bottom, whether a page is loading, whether a jump is still in progress and where the
list was left are kept in refs, timers, a DOM query in the history manager (`RoomHistoryManager` measures
`[data-overlayscrollbars-viewport]` to restore the scroll after a page loads) and pixel offsets stored in the room store. The
room's read state sits on top of those guesses. In October the room gained rules that depend on them: marking the room as read
only when the viewer has acted and is at the latest message, counting unread messages without waiting for a scroll, opening at the
newest message instead of the saved one when something is unread, and keeping the saved position when only a thread reply is
unread (#42756). Those rules live in `RoomBody.tsx`, `useUserScrollIntent`, `useUnreadMessages` and the old `MessageList.tsx`,
and no test of the list can check them end to end. The reference implementation of the room's new list was written before that
work and would drop it: it has no input gate for mark-as-read, freezes the saved position at mount, and ignores the listed
messages when deciding about unread. Every mounted message also re-renders when a message arrives, because the room and the
subscription objects feed the messages' related-data context and change with each arrival.

## Proposed outcome

- A viewer of a room sees what they see today, drawn by the package's list: the room opens at the newest message, or where the
  viewer left it, unless unread messages call for the newest; it stays at the bottom while the viewer is there; older and newer
  pages load without moving what is on screen; the viewer's own message takes the list to the latest, from older history too;
  "New messages" and "Jump to recent messages" work; a `?msg=` link, the unread banner's jump and a thread reply's link land on
  the message, centered and highlighted, with the start-of-room foreword above; the floating date, the keyboard and the
  accessible list are the package's.
- The read state keeps working exactly as on `develop`: the unread banner and its count, "mark as read", the jump to the first
  unread message, mark-as-read when the viewer reaches the latest message by an action of their own (including a wheel or a key
  press at the bottom, which scrolls nothing), and the saved position kept when only a thread reply is unread.
- "Select all" and the composer's "Select N messages" button keep working, and a thread's messages never join the room's
  selection.
- The composer keeps linking the domains the workspace configures, though the directory its hook lived in goes.
- A message arriving, or a change of the room or the subscription that nothing on screen shows, re-renders no mounted message
  that does not show it; a render-counting spec in the app proves it.
- The history manager no longer reads or writes the DOM, and the room's store keeps one thing about scrolling: where the list
  was left.
- What the room's old list had and the new one does not is stated and decided, not discovered by QA: the padding at the ends of
  the list, and what "Select all" counts.
- Branch 09 can switch the thread's list: nothing the thread still uses is deleted here.

## Affected users and systems

Viewers of any room. QA gets the scope's manual check (open, scroll up through pages, `?msg=`, arrivals while reading, own
message from older history, "Jump to recent messages", switching rooms, unread banner, composer growth, contextual bar, "Select
all", keyboard). New spec: `specs/room-message-list.md`. `message-list` (branch 07) is consumed through its props and its handle
(`bottomThreshold` 60, `getVisibility()`, `restoredPosition`, `onJumpToLatest`); its D3 is pinned there. `message-variants` R26
(the bridge for "Select all" until this branch) and R47's bridge for the room's jump highlight end for the room. Meteor: the
room body, `RoomManager`, `RoomHistoryManager`, `MessagesProvider`. A changeset (`minor`, `@rocket.chat/meteor` and
`@rocket.chat/ui-message-list`). Later capability that depends on it: the thread list (09), which still uses pieces the room's
old list shared with it.

## Constraints

- Where `develop` and the reference disagree because `develop` changed, `develop` wins: #42756 (the read state), #43308, #43471
  (re-renders; the roles resolved once per place), #43627 (`useTranslation` from `react-i18next`), the hook for who can preview a
  room. The reference's `RoomBody.tsx` is merged by hand, not copied.
- The list decides nothing about unread (`message-list` intent Q2): the room omits `restoredPosition` when unread messages are
  among the listed ones, and asks the list's handle, synchronously, what is visible.
- The package imports nothing from `apps/meteor`; the room reaches the list through its props, handle and contexts. No `scrollTop`
  write, no row index computed outside the row model (ADR 0001).
- Every visible change gets a changeset. No new shared test infrastructure: test-only components live under
  `apps/meteor/tests/mocks/client/`.
- Every commit builds and passes; fixes and enabling refactors sit below the feature.

## Open questions

- **Q1** ~~What "Select all" counts.~~ Answered (the orchestrator, for the user): (a), `develop`'s rendered rows, thread previews
  included. The scope's known difference is removed (spec R45 to R48).
- **Q2** ~~The padding at the ends of the list.~~ Answered at the spec gate: (a), none. Reversed at review round 1, by the user: the
  reversal is recorded in the spec, R57 and its Open questions. The room keeps `develop`'s space, 21px above the first row and 10px
  below the last, 34px while newer messages remain.
