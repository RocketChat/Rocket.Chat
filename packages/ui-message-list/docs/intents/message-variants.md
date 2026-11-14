# Intent: Message variants

Author: message list replacement stack (branch 06). Status: accepted.

## Problem

The rows of a conversation (a message in the room, a system message such as "joined the channel", a message in a
thread, and the preview of a thread reply in the room) are drawn by `apps/meteor/client/components/message`: four variants,
their header, avatar, roles, status indicators and read receipt, and the hooks that decide when a row is selected, being edited, ignored
or pending. They read the app directly (the old list context, the selection store, the highlight store, the router and the
stores), and the list that renders them provides that context from one provider that only the room, a thread, the pinned,
starred and mentions tabs and search mount. So what each row shows in each place, which states it can be in, and what
a click, Space or Enter does to it, can only be checked by running Rocket.Chat; the audit, where no such provider is mounted,
draws its rows with the context's empty defaults. `ui-message-list` renders the content of a message and its toolbar
already (see the specs of `message-capabilities`, `message-attachments` and `message-toolbar`), but not the row around them.

## Proposed outcome

- The package renders the four variants and their parts (the header with the author's name, username and roles, the
  avatar, the status indicators, the read receipt, the checkbox of selection mode, the placeholder of an ignored message, the
  per-message fallback), asking the app for what it needs through the contexts it already has, the selection context and
  the editing context. Each works with no provider, so stories and package tests need none, and every state a row can be in
  is a story.
- The app supplies the editing and selection contexts from the provider it already mounts wherever messages show, and
  every place that renders a row (the room, a thread, the pinned, starred and mentions tabs, search, the audit) renders the
  package's variant. The app keeps no copy of a variant, of the old list context or of the provider that fed it.
- A row looks and behaves as it does today in the room, in a thread, in the tabs and in search: grouping, pending, the
  editing look, the highlight of a jump, selection mode with click and Space or Enter, ignored messages and their reveal,
  an encrypted message that is not decrypted yet, the markers of a thread's unread replies, mentions and mentions of everyone, the
  fallback of a message that cannot be drawn, avatars, usernames, real names and roles as the viewer's preferences
  say, and each row announced as a list item with its role description and name.
- Two bridges, with their end, keep the old lists working until the branches that replace them: a jump to a message
  still highlights it through the store jumps and editing share (until the highlight store is renamed, branch 09),
  and "Select all" still counts and selects the messages the old room list has rendered (until the list engine
  replaces it, branch 08). A thread's messages never join the room's selection.
- Changes a user can see are few and stated, not discovered (see the open questions): in the audit, the only read-only place that
  draws rows, which now follows the viewer's display settings as the user decided for the read-only places; the date format
  of the tooltip of the edit indicator; and two small corrections.

## Affected users and systems

Everyone who reads messages in a room, a thread, the pinned, starred and mentions tabs, search, and the audit.
A new spec, `specs/message-variants.md`, covers it. `message-capabilities` (R32, R34, its Out of scope and its notes on
`display.showUsername`) and `message-toolbar` (R25, and its notes on the interactions capabilities with no reader) are
touched: their lists of code and tests move when the app's variants go. The list engine, the room list and the thread
list are later capabilities (branches 07, 08 and 09).

## Constraints

- The package imports nothing from `apps/meteor`.
- No behaviour of a row changes in the room, in a thread, in the tabs and in search, except where a requirement of the
  spec names it. Where `develop` and the earlier implementation of this work disagree because `develop` changed, `develop`
  wins: the row built on `Item`, usernames next to real names that respect `hideUsernames`, roles resolved once per list, the
  avatar click that does not close the user info it opens, the chevron icons, `useTranslation` from `react-i18next`.
- The read-only places (audit, moderation, contact history, the forward, pin and report modals, the composer's quote and the
  threads list) follow the viewer's display settings and show no toolbar (decided for `message-capabilities` R36 to R40).
- A thread's messages never join the room's selection, and the highlight store notifies every list that shows the
  message (both fixed in branch 02).
- No shared test infrastructure; `useMergedRefsV2` stays in `@rocket.chat/ui-client`.

## Open questions

All answered by the user at the spec gate (2026-11-13), each with the recommended option.

- **Q1** ~~What the audit shows once it renders the package's variants.~~ Answered: (a) the audit follows the display
  settings (timestamps, roles, `@username`, read receipts, URL previews), with a changeset. Where the roles of an audited
  room cannot be fetched (the endpoint can be forbidden for an auditor) the row still renders, without roles and without an
  error (spec R44, R52).
- **Q2** ~~The date in the tooltip of the "edited" indicator.~~ Answered: (a) the display date-and-time format; the visible
  change is named in a changeset (spec R15).
- **Q3** ~~Two small corrections: the literal `0`, and the broadcast reply where interaction is off.~~ Answered: (a) take
  both, each in its own commit below the feature where it can be separated, with a changeset (spec R38).
- **Q4** ~~The capabilities of the interactions context that nothing in the package reads (fourteen).~~ Answered: (a) remove
  them, as their own commit in branch 09; this branch does not touch them (spec Out of scope; the plan's follow-ups).
- **Q5** ~~Where the conversation stories live.~~ Answered: (a) branch 07; this branch has a story per variant and state and
  one story that stacks the four variants (spec R8).
