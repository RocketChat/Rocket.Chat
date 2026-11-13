# Intent: Message list

Author: message list replacement stack (branch 07). Status: accepted.

## Problem

The room and the thread each have their own infinite list of messages in `apps/meteor`, two copies of one idea. Where the
viewer is, whether they are at the bottom, which way a page of messages was added, whether a jump is still holding a message
in view and whether the viewer or the list made a scroll are all guessed from mutable refs, thresholds that differ between the
copies, timers and `requestAnimationFrame` loops, and row indexes recomputed by hand in several files. The loader and the
start-of-room row sit inside the virtualizer, so an offset forgotten in one place lands a `?msg=` jump one message too high or
puts the thread's kept-mounted rows one off; branch 02 fixed six such defects, one copy at a time. The floating date reads
divider nodes from the DOM and the thread loses the class that hides the divider under it. `ui-message-list` now draws the
content of a message, its toolbar and the four row variants, but not the list that holds them, so how a conversation scrolls,
pages, jumps, restores and reports what is visible can only be checked by running Rocket.Chat in a busy room: no story scrolls,
and the app specs mock the virtualizer.

## Proposed outcome

- The package offers one message list that serves the room, a thread and the read-only lists. A viewer of any of them gets what
  the room and thread give today: it opens at the newest message, or where it was left, or on a jump target; it stays at the
  bottom while the viewer is there, through arrivals, content that grows, and the composer or a panel resizing; the viewer's own
  messages take it to the latest, from an older part of the conversation too; "New messages" shows when others write while the
  viewer reads further up; older and newer pages load without moving what is on screen; "Jump to recent messages" and a jump to
  any message, loaded or not, land centered and highlighted; day and unread dividers, a floating date that never doubles a
  divider, grouping of consecutive messages, a start-of-conversation header, loading indicators, live embeds that do not reload,
  one tab stop with arrow navigation, and a list announced as a busy-aware `list`.
- It does this for any source of messages. The app hands it the messages it has, flags and promises for paging, and the ids of
  the first unread message and of a jump target; the list hands back what is visible, where it was left and when a target was
  reached. It knows nothing of rooms, subscriptions or endpoints.
- Every behaviour above is proven where it can be seen: in a reducer table, in a component spec, or in a story with a play test
  in a real browser, and each story is one behaviour that QA can walk. The conversation stories, a room and a thread drawn
  with the real variants through the list, live here too.
- Nothing in the app changes in this branch. The room and the thread keep their own lists until branches 08 and 09 switch them.
- Four things the app's lists fixed or gained since the reference was written hold in the package's list, so that deleting the
  old lists later loses no behaviour: the six behaviours branch 02 fixed, the room's read-state rules of #42756 (a saved
  position is overridden by unread messages decided from the listed messages, and not by a thread reply alone), the keyboard
  model of lists with video and audio players, and what `develop` changed in the helpers the list copies.

## Affected users and systems

Nobody sees a change yet; the viewers of rooms, threads, the tabs and search are affected once branches 08 and 09 switch to
the list. QA gets the list's stories as the manual check. New spec: `specs/message-list.md`. `message-variants` is touched in
R8 (the conversation stories its Q5 sent here) and in its bridges for "Select all" and the highlight store, which the list
replaces in 08 and 09. ADR 0010 (`virtua` and the scroll reducer), written at the reference, moves into `docs/adr/` in this
branch. `ui-client` gains the viewport mode of its scrollbars and a date formatter; `mock-providers` gains deterministic
fixtures. Later capabilities depend on it: `room-message-list` (08) and the thread list (09).

## Constraints

- The package imports nothing from `apps/meteor`; every capability of the app arrives through a prop or an intent-named
  context. `useMergedRefsV2` comes from `@rocket.chat/ui-client`.
- Scrolling goes through the virtualizer's `scrollToIndex`, never `scrollTop`; no row index is computed outside the row model;
  only the viewer's input releases what the list holds in view (ADR 0010, `AGENTS.md`).
- Where `develop` and the reference disagree because `develop` changed, `develop` wins. Known cases: the item-list keyboard
  hook gained the video and audio Tab model (#43544, #43573) and the move-row shortcut (#42995); the room's read-state
  decisions (#42756); `useTranslation` from `react-i18next` (#43627).
- Nothing outside the package uses the list in this branch, so the app's existing lists, their hooks and their specs stay.
- No shared test infrastructure beyond what the reference carries.

## Open questions

- **Q1** ~~Which of the six behaviours branch 02 fixed belong to this spec, given that their app specs are deleted in branches
  08 and 09. (a) The four the engine owns, carried here as requirements: a `?msg=` jump lands on the message with the
  start-of-room row present; kept-mounted rows and the top message stay right while older messages load; a day shows once under
  the floating date; a highlight in one list never clears another's. The other two stay where they are: a thread's system
  messages out of the room's selection is `message-variants` R24 and R25 plus the "Select all" wiring of 08, and the composer's
  auto-link domains is the composer's hook, which 08 must move out of the directory it deletes. (b) All six here, which puts
  selection and a composer hook in a spec about scrolling. (c) None here, which leaves four behaviours of the engine with no
  proof once the old specs go. Recommended: (a).~~ Answered (the orchestrator, for the user): (a). The four are carried (spec R42, R49, R52, R64); selection and
  the auto-link hook are noted in the spec's Out of scope for 08.
- **Q2** ~~What the list must offer so branch 08 keeps develop's read-state work (#42756): the unread jump is decided from the
  listed messages, and the saved position is kept when only a thread reply is unread. (a) The list decides nothing about unread:
  it restores a position when it is given one, opens at the bottom when it is not, draws the unread divider for the id it is
  given without moving for it, reports what is visible (the first report without any scroll, `isAtBottom` true when the viewer
  stands at the latest messages) and answers the same question synchronously from its handle. The room decides from its listed
  messages and the subscription, as today. (b) The list takes the subscription's last-seen time and decides, which ties the
  package to the read model. Recommended: (a). Where the reference's B14 says "unreads override the restore", the spec says the
  consumer decides, as `develop` does.~~ Answered: (a). The list decides nothing about unread (spec R9, R55 to R57, R60 to R62).
- **Q3** ~~Where the conversation stories live.~~ Answered by the user (branch 06, intent Q5): in this branch (spec R76).
- **Q4** ~~Whether the list's requirements bound the re-rendering of mounted rows. The related-data context value of
  `MessagesProvider` changes on every room or subscription update, so every mounted row reads a new value when a message
  arrives (carried from branch 06). (a) The list bounds its own part (a scroll, an anchor change, a date or an arrival
  re-renders only the rows whose row data changed), with a spec that counts renders; the provider's value stability is a
  requirement of 08, where the real provider and the list meet and a meteor spec can count a mounted row's renders. (b) Leave
  both. (c) Both here, which changes a provider that nothing in this branch feeds to the list. Recommended: (a) (spec R71 to
  R73).~~ Answered: (a). The provider value's stability is a requirement of 08.
