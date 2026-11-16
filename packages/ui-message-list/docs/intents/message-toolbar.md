# Intent: Message toolbar

Author: message list replacement stack (branch 05). Status: accepted.

## Problem

The row of actions that shows when the viewer hovers or focuses a message (react, quote, reply in
thread, forward, jump to the message, and the "More" menu with copy link, pin, star, edit, delete,
report and the actions of apps) is drawn by `apps/meteor/client/components/message/toolbar` and
`MessageToolbarHolder`. Those parts read the app directly: the open chat, the router, the emoji
picker, the modals, the room's settings and the app actions. They cannot be rendered in a story or a
jsdom test without booting most of the client, so which items each place shows (the room, a thread,
the pinned, starred and mentions tabs, search, a federated room, a video conference message), in what
order, and under which permission and setting, can only be checked by running Rocket.Chat.
`ui-message-list` renders the content of a message already, but not its toolbar.

## Proposed outcome

- The package renders the toolbar: the inline items of each place, the reaction with its quick
  reactions, and the "More" and AI menus, asking the app for what it needs through the contexts it
  already has and the toolbar context. It works with no provider, so stories and package tests need
  none.
- The app supplies the toolbar from the provider it already mounts wherever messages show: the menu
  entries (the built-in ones gated by permissions and settings, then the apps'), the AI entries and
  the quick reactions.
- Everywhere the app shows a message with a toolbar it shows the package's, and the app keeps no
  copy. The toolbar looks and behaves as it does today: the same items in the same order under the
  same gates, shown while its menu or the emoji picker is open, and never in a read-only place.
- Two changes are intended and stated: a menu that holds only app actions is shown, and a quick
  reaction no longer counts as a recently used emoji (the emoji picker still does). A quick reaction
  still counts toward the frequent emoji, which choose the quick reactions, as before.

## Affected users and systems

Everyone who hovers a message: in rooms, threads, the pinned, starred and mentions tabs, search and
federated rooms; users with installed apps that add message actions; users of end-to-end encrypted
rooms. A new spec, `specs/message-toolbar.md`, covers it; `specs/message-capabilities.md` gets the
proof it deferred for pin, star, mark unread and translate. The variants and the list engine are
later capabilities.

## Constraints

- The package imports nothing from `apps/meteor`.
- No behaviour of the toolbar changes, except where a requirement of the spec names it. Where
  `develop` and the earlier implementation of this work disagree because `develop` changed,
  `develop` wins, among them the guard that keeps a user outside the parent room from creating a
  discussion and the emoji picker living in `@rocket.chat/ui-emoji-picker`.
- Read-only places keep showing no toolbar (`message-capabilities` R32); no place gets a second
  provider.
- Hovering a message must stay cheap: a toolbar's value does not change when another message does.

## Open questions

- **Q1** Whether a menu holding only app actions is shown. Assumed: yes, a decided change.
- **Q2** Whether a quick reaction adds to the recent emoji list, and to the frequent emoji that choose
  the quick reactions. Assumed: it does not add to the recent list, a decided change; it still raises the
  emoji's frequency, a decision of the user, as before. The emoji picker still does both.
- **Q3** Whether "reply in thread" from the toolbar keeps the URL's search parameters as the thread
  metrics' button does. Assumed: no, it drops them as the toolbar did.
- **Q4** Whether the actions of apps are hidden by the layout's hidden actions. Assumed: no, as before.
